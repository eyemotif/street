import { addEventListener } from '../event'
import { getComponent } from '../page'
import { getMediaQueue, setMediaQueue } from '../queue'

export function mediaQueueManager(type: string, name: string, exec: (element: HTMLElement) => void) {
    let queue = getMediaQueue(type)
    queue[0][0].splice(queue[0][0].indexOf(name), 1)
    if (queue[0][0].length === 0) queue[0].shift()
    if (queue[0].length === 0) queue.shift()
    if (queue.length > 0) {
        for (const componentName of queue[0][0][0]) {
            const component = getComponent('audio', componentName)
            if (component !== null) exec(component)
        }
    }
    setMediaQueue('audio', queue)
}

addEventListener('end', 'audio', name => {
    mediaQueueManager('audio', name, element => {
        (element as HTMLAudioElement).play()
    })
})
