import { registerTask } from '../task'
import { getComponent, messageToParagraph } from '../page'
import { Result } from '../utils/result'
import { getComponentNames } from '../component'
import { getAlertQueue, getMediaQueue, MAX_QUEUE_LENGTH, setAlertQueue, setMediaQueue } from '../queue'
import { setCachedUser, UserInfo } from '../twitch/chatter'
import { Alert, AlertType, showAlert } from '../alert'

registerTask('~components', {
    ExpectedArgs: { type: 'exactly', value: 0 },
    OnTask: (_args, respond): Result<string> => {
        const components = getComponentNames()
        respond(JSON.stringify(components))
        return [true]
    }
})
registerTask('~flush', {
    ExpectedArgs: { type: 'exactly', value: 1 },
    OnTask: (args, _respond): Result<string> => {
        if (getMediaQueue(args[0])) {
            setMediaQueue('audio', [])
            return [true]
        }
        else return [false, `Invalid queue "${args[0]}".`]
    }
})
registerTask('~channel', {
    ExpectedArgs: { type: 'exactly', value: 0 },
    OnTask: (_args, respond): Result<string> => {
        respond(new URL(window.location.href).searchParams.get('channel') ?? '')
        return [true]
    }
})

registerTask('audio', {
    Mode: 'audio',
    ExpectedArgs: { type: 'atLeast', value: 1 },
    OnTask: (args, _respond): Result<string> => {
        const audioComponents = new Set<string>(getComponentNames()['audio'])

        const queueSpot =
            args
                .map(arg => arg.split(':'))
                .map(multi => multi.filter(m => audioComponents.has(m)))
                .filter(arg => arg.length > 0)

        if (queueSpot.length === 0) return [true]
        if (queueSpot.length > MAX_QUEUE_LENGTH) queueSpot.splice(MAX_QUEUE_LENGTH)

        let queue = getMediaQueue('audio')
        queue.push(queueSpot)
        setMediaQueue('audio', queue)

        if (queue.length === 1) {
            for (const first of queueSpot[0]) {
                const component = getComponent('audio', first)! as HTMLAudioElement
                component.play()
            }
            return [true]
        }
        else return [true]
    }
})

registerTask('audio.volume', {
    Mode: 'audio',
    ExpectedArgs: { type: 'exactly', value: 1 },
    OnTask: (args, _respond): Result<string> => {
        const volume = parseFloat(args[0])
        if (isNaN(volume) || volume < 0 || volume > 1) {
            return [false, `Invalid volume "${args[0]}".`]
        }
        for (const name of getComponentNames()['audio']) {
            const component = getComponent('audio', name)! as HTMLAudioElement
            component.volume = volume
        }
        return [true]
    }
})

registerTask('chat', {
    Mode: 'chat',
    ExpectedArgs: { type: 'atLeast', value: 3 },
    OnTask: (args, _respond): Result<string> => {
        const [username, replaceString, ...words] = args
        const chatDiv = document.getElementById('chat')!
        const chatP = document.createElement('p')

        chatP.className = 'chat'
        chatP.dataset.time = Date.now().toString()
        chatDiv.appendChild(chatP)

        messageToParagraph(chatP, username, replaceString, words)
            .then(_ => {
                chatDiv.childNodes.forEach((el: any) => { if (el.getBoundingClientRect().y < 0) chatDiv.removeChild(el) })
            })

        return [true]
    }
})

registerTask('chat.user', {
    Mode: 'chat',
    ExpectedArgs: { type: 'exactly', value: 5 },
    OnTask: (args, _respond): Result<string> => {
        const [user, display, color, badges, badgeInfo] = args
        const badgesList = badges.split(',').filter(s => s.length > 0)
        const badgeInfoList = badgeInfo.split(',').filter(s => s.length)

        let userInfo: UserInfo = {
            DisplayName: display,
            Color: color,
            Broadcaster: false,
            Moderator: false,
            Subscriber: undefined,
            Bits: undefined
        }

        for (const badge of badgesList) {
            const [name, value] = badge.split('/')
            if (!name || !value) continue
            switch (name) {
                case 'broadcaster':
                    userInfo.Broadcaster = true
                    break
                case 'broadcaster':
                    userInfo.Moderator = true
                    break
                case 'subscriber':
                    userInfo.Subscriber = parseInt(value)
                    break
                case 'bits':
                    userInfo.Bits = parseInt(value)
                    break
                default: break
            }
        }

        setCachedUser(user, userInfo)
        return [true]
    }
})

registerTask('chat.clear', {
    Mode: 'chat',
    ExpectedArgs: { type: 'exactly', value: 0 },
    OnTask: (_args, _respond): Result<string> => {
        document.getElementById('chat')!.replaceChildren()
        return [true]
    }
})

registerTask('alert', {
    Mode: 'alert',
    ExpectedArgs: { type: 'atLeast', value: 5 },
    OnTask: (args, _respond): Result<string> => {
        const [type, username, mainArg, replacer, ...body] = args

        let alertType: AlertType
        switch (type) {
            case 'follow':
                alertType = AlertType.Follow
                break
            case 'subscribe':
                alertType = AlertType.Subscribe
                break
            case 'bits':
                alertType = AlertType.Bits
                break
            default:
                return [false, `Invalid alert type "${type}".`]
        }
        let alertHead: any = {
            Username: username,
            Body: body,
            BodyReplacer: replacer.substring(1),
            Type: alertType,
        }
        let alert: Alert

        switch (alertType) {
            case AlertType.Follow:
                alert = Object.assign(alertHead, {
                    body: []
                }) as Alert
                break
            case AlertType.Subscribe:
                const [months, gift] = mainArg.split('/')
                alert = Object.assign(alertHead, {
                    Months: parseInt(months),
                    GiftTo: gift,
                }) as Alert
                break
            case AlertType.Bits:
                alert = Object.assign(alertHead, {
                    Amount: parseInt(mainArg)
                })
                break
        }

        const alertQueue = getAlertQueue()
        alertQueue.push(alert)

        if (alertQueue.length === 1) {
            showAlert(alert, alert => {
                switch (alert.Type) {
                    case AlertType.Follow:
                        return `Thanks for the follow, %%!!! :3`
                    case AlertType.Subscribe:
                        if (alert.GiftTo)
                            return `Thanks for the gift to ${alert.GiftTo}, %%!!! :3`
                        else
                            return `Thanks for the ${alert.Months} month ${alert.Months === 1 ? 'subscription' : 'resubscription'}, %%!!! :3`
                    case AlertType.Bits:
                        return `Thanks for the ${alert.Amount} ${alert.Amount === 1 ? 'bit' : 'bits'}, %%!!! :3`
                }
            })
        }

        setAlertQueue(alertQueue)
        return [true]
    }
})
