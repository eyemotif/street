import { addEvent } from '../event'
import { getComponent } from '../page'
import { getMediaQueue, setMediaQueue } from '../queue'

export function mediaQueueManager(type: string, name: string, exec: (element: HTMLElement) => void) {
    let queue = getMediaQueue(type)
    const current = queue[0][0]

    const removeIndex = current.indexOf(name)
    if (removeIndex < 0) throw `Unknown ${type} component "${name}"`

    current.splice(removeIndex, 1)
    if (current.length === 0) {
        queue[0].shift()
        if (queue[0].length === 0) queue.shift()
        if (queue.length > 0) {
            for (const component of queue[0][0]) {
                const element = getComponent(type, component)
                if (element) exec(element)
            }
        }
    }
    else queue[0][0] = current
    setMediaQueue(type, queue)
}

addEvent('end', 'audio', name => {
    mediaQueueManager('audio', name, element => {
        (element as HTMLAudioElement).play()
    })
})
