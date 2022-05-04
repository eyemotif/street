/*
    Each queue is a 3-dimensional array.
    The dimensions are:
    - First dimension: The queue "spot", called the Request.
    - Second dimension: The list of elements in the Request, called the Words.
    - Third dimension: All the different elements that are executed at the same
      time per Word, called the Multis.
*/
export const MAX_QUEUE_LENGTH = 10

let mediaQueues: Record<string, string[][][]> = {
    'audio': []
}

export function getMediaQueue(queueName: string) { return mediaQueues[queueName] }
export function setMediaQueue(queueName: string, queue: string[][][]) { mediaQueues[queueName] = queue }
