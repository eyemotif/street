import './components/componentRegistry'
import './events/eventRegistry'
import './tasks/taskRegistry'
import './styles/styleRegistry'

import { getComponents } from './component'
import { getTasks, testArgLength } from './task'
import { addComponent } from './page'
import { EmoteProvider, getChannelEmotes, getGlobalEmotes } from './twitch/emote'
import { setBadges, setChannelID } from './twitch/channel'

window.onload = () => {
    const url = new URL(window.location.href)
    const channel = url.searchParams.get('channel')
    const webSocketPort = url.searchParams.get('port') ?? '8000'
    const noBadges = url.searchParams.get('noBadges') ?? 'false'

    getGlobalEmotes('all').then(_ => {
        console.log('Loaded global emotes!')
    })
    if (channel) {
        // if twitch channel emotes are loaded here then anyone can use any channel emote
        getChannelEmotes([EmoteProvider.SevenTV, EmoteProvider.BetterTTV, EmoteProvider.FrankerFaceZ], channel).then(_ => {
            console.log('Loaded channel emotes!')
        })
        setChannelID(channel)
            .then(() => {
                setBadges(noBadges === 'true')
                console.log('Loaded channel badges!')
            })
    }
    else {
        setBadges(noBadges === 'true')
    }

    const components = getComponents()
    const tasks = getTasks()

    for (const componentType in components) {
        for (const componentName in components[componentType])
            addComponent(componentType, componentName, components[componentType][componentName])
    }

    const socket = new WebSocket(`ws://localhost:${webSocketPort}`)
    socket.onopen = function () {
        console.log('connected to server!')
        socket.onclose = function (event) { console.error(`socket closed! reason: ${event.reason}`) }
    }
    socket.onmessage = function (event) {
        const message = event.data as string
        const [task, ...args] = message.split(' ')
        const taskInfo = tasks[task]
        if (taskInfo) {
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
