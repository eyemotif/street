import { registerTask } from '../task'
import { getComponent } from '../page'
import { Result } from '../result'
import { getComponentNames } from '../component'
import { getMediaQueue, setMediaQueue } from '../queue'

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

registerTask('audio', {
    ExpectedArgs: { type: 'atLeast', value: 1 },
    OnTask: (args, _respond): Result<string> => {
        const queueSpot = args.map(arg => arg.split(':'))
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
