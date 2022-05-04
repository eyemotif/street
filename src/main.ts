import './components/componentRegistry'
import './events/eventRegistry'
import './tasks/taskRegistry'

import { getComponents } from './component'
import { getTasks, testArgLength } from './task'
import { addComponent } from './page'

window.onload = () => {
    const components = getComponents()
    const tasks = getTasks()

    for (const componentType in components) {
        for (const componentName in components[componentType])
            addComponent(componentType, componentName, components[componentType][componentName])
    }

    const socket = new WebSocket('ws://localhost:8000')
    socket.onopen = function () { console.log('connected to server!') }
    socket.onmessage = function (event) {
        const message = event.data as string
        const [task, ...args] = message.split(' ')
        const taskInfo = tasks[task]
        if (taskInfo) {
            const [correctNumberOfArgs, errorAmount] = testArgLength(args.length, taskInfo)
            if (!correctNumberOfArgs) {
                socket.send(`Invalid number of arguments for task "${task}". Got ${args.length}, got ${errorAmount}.`)
                return
            }
            const taskResult = taskInfo.OnTask(args, str => socket.send(str))
            if (!taskResult[0]) socket.send(taskResult[1])
        }
        else socket.send(`Invalid task "${task}"`)
    }
}
