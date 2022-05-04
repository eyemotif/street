import { registerTask } from '../task'
import { getComponent } from '../page'
import { Result } from '../result'
import { getComponentNames } from '../component'
import { getMediaQueue, MAX_QUEUE_LENGTH, setMediaQueue } from '../queue'

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
