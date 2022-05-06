import { registerTask } from '../task'
import { getComponent, htmlEscape } from '../page'
import { Result } from '../result'
import { getComponentNames } from '../component'
import { getMediaQueue, MAX_QUEUE_LENGTH, setMediaQueue } from '../queue'
import { replaceEmotes } from '../twitch/emote'
import twemoji from 'twemoji'
import { getCachedUser, getUserBadges, setCachedUser, UserInfo } from '../twitch/chatter'

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

registerTask('chat', {
    ExpectedArgs: { type: 'atLeast', value: 3 },
    OnTask: (args, _respond): Result<string> => {
        const [username, replaceString, ...words] = args
        const cachedUser = getCachedUser(username)
        replaceEmotes(words, replaceString.substring(1))
            .then(replacement => {
                let chatDiv = document.getElementById('chat')!
                let chatP = document.createElement('p')
                chatP.className = 'chat'

                if (cachedUser) {
                    for (const badge of getUserBadges(cachedUser)) {
                        chatP.innerHTML += `<img class="badge" src="${badge.X4}"></img>`
                    }
                }
                chatP.innerHTML += `<span style="color:${cachedUser?.Color ?? ''}">${cachedUser?.DisplayName ?? username}</span>: `
                chatP.innerHTML +=
                    replacement.map(r => {
                        switch (r.type) {
                            case 'text': return htmlEscape(r.text + ' ')
                            case 'emote': return `<img class="emote" src="${r.emote.X4 ?? r.emote.X3 ?? r.emote.X2 ?? r.emote.X1}"></img>`
                        }
                    })
                        .join(' ')

                chatDiv.appendChild(chatP)
                twemoji.parse(chatP)

                chatDiv.childNodes.forEach((el: any) => { if (el.getBoundingClientRect().y < 0) chatDiv.removeChild(el) })
            })
            .catch(e => { throw e })
        return [true]
    }
})

registerTask('chat.user', {
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
    ExpectedArgs: { type: 'exactly', value: 0 },
    OnTask: (_args, _respond): Result<string> => {
        document.getElementById('chat')!.replaceChildren()
        return [true]
    }
})
