import { AlertType, showAlert } from '../alert'
import { addEvent } from '../event'
import { getComponent } from '../page'
import { getAlertQueue, getMediaQueue, setAlertQueue, setMediaQueue } from '../queue'

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

addEvent('start', 'alert', type => {
    console.log(`alert ${type} start`)
})
addEvent('end', 'alert', type => {
    console.log(`alert ${type} end`)

    const alertDiv = document.getElementById('alert')!
    alertDiv.removeChild(document.getElementsByClassName(`alert-${type}`)[0])

    const alertQueue = getAlertQueue()
    alertQueue.shift()

    if (alertQueue.length > 0) {
        showAlert(alertQueue[0], alert => {
            switch (alert.Type) {
                case AlertType.Follow:
                    return `Thanks for the follow, %%!!! :3`
                case AlertType.Subscribe:
                    return `Thanks for the ${alert.Months} month ${alert.Months === 1 ? 'subscription' : 'resubscription'}, %%!!! :3`
                case AlertType.Bits:
                    return `Thanks for the ${alert.Amount} ${alert.Amount === 1 ? 'bit' : 'bits'}, %%!!! :3`
            }
        })
    }
    setAlertQueue(alertQueue)
})
