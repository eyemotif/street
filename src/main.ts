import './components/componentRegistry'
import './events/eventRegistry'
import './tasks/taskRegistry'
import './styles/styleRegistry'

import { getComponents } from './component'
import { getTasks, testArgLength } from './task'
import { addComponent, modeSet, setModes } from './page'
import { EmoteProvider, getChannelEmotes, getGlobalEmotes } from './twitch/emote'
import { setBadges, setChannelID } from './twitch/channel'

function loadExternalResources(channel: string | null, noBadges: boolean) {
    if (modeSet('chat')) {
        getGlobalEmotes('all').then(_ => {
            console.log('Loaded global emotes!')
        })
        if (channel) {
            setChannelID(channel)
                .then(() => {
                    setBadges(noBadges)
                    console.log('Loaded channel badges!')
                })
            getChannelEmotes([EmoteProvider.SevenTV, EmoteProvider.BetterTTV, EmoteProvider.FrankerFaceZ], channel).then(_ => {
                console.log('Loaded channel emotes!')
            })
        }
        else {
            setBadges(noBadges)
        }
    }
    else {
        if (channel) setChannelID(channel)
    }
}

window.onload = () => {
    const url = new URL(window.location.href)
    const modes = url.searchParams.get('mode')?.split(',') ?? 'all'
    const channel = url.searchParams.get('channel')
    const webSocketPort = url.searchParams.get('port') ?? '8000'
    const noBadges = url.searchParams.has('noBadges')
    const refresh = url.searchParams.has('refresh')

    setModes(modes)
    console.log(`Modes set: ${modes}`)

    loadExternalResources(channel, noBadges)

    const components = getComponents()
    const tasks = getTasks()

    for (const componentType in components) {
        for (const componentName in components[componentType])
            addComponent(componentType, componentName, components[componentType][componentName])
    }
    console.log('Loaded components!')

    const socket = new WebSocket(`ws://${url.hostname}:${webSocketPort}`)
    socket.onopen = function () {
        console.log('Connected to server!')
        socket.onclose = function (event) {
            console.error(`Socket closed! reason: ${event.reason}`)
            if (refresh) window.location.reload()
        }
    }
    socket.onmessage = function (event) {
        const message = event.data as string
        const [task, ...args] = message.split(' ')
        const taskInfo = tasks[task]
        if (taskInfo) {
            if (taskInfo.Mode && !modeSet(taskInfo.Mode)) return

            const [correctNumberOfArgs, errorAmount] = testArgLength(args.length, taskInfo)
            if (!correctNumberOfArgs) {
                socket.send(`Invalid number of arguments for task "${task}". Got ${args.length}, expected ${errorAmount}.`)
                return
            }
            const taskResult = taskInfo.OnTask(args, str => socket.send(str))
            if (!taskResult[0]) socket.send(taskResult[1])
        }
        else socket.send(`Invalid task "${task}"`)
    }
}
