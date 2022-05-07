import { Alert } from './alert'

export const MAX_QUEUE_LENGTH = 10

/*
    Each media queue is a 3-dimensional array.
    The dimensions are:
    - First dimension: The queue "spot", called the Request.
    - Second dimension: The list of elements in the Request, called the Words.
    - Third dimension: All the different elements that are executed at the same
      time per Word, called the Multis.
*/
let mediaQueues: Record<string, string[][][]> = {
    'audio': [],
}
// [alertType, alertWords][]
let alertQueue: Alert[] = []

export function getMediaQueue(queueName: string) { return mediaQueues[queueName] }
export function setMediaQueue(queueName: string, queue: string[][][]) { mediaQueues[queueName] = queue }

export function getAlertQueue() { return alertQueue }
export function setAlertQueue(value: Alert[]) { alertQueue = value }
