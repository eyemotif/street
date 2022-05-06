import { Bounds } from './bounds'
import { Result } from './result'

/*
        General guide for task names:
        - The default task for a component is the name of the component type.
        - Any sub-task for a component type is formatted as
          "<component-type>.<action>".
        - Any task not associated with a component type is formatted as
          "~<task>".
*/

export type TaskInfo = {
    Mode?: string
    ExpectedArgs: Bounds
    OnTask: (args: string[], respond: (message: string) => void) => Result<string>
}

let tasks: Record<string, TaskInfo> = {}

export function registerTask(name: string, task: TaskInfo) {
    if (Object.keys(tasks).includes(name))
        throw `Task "${name}" already registered.`
    tasks[name] = task
}
export function getTasks(): Record<string, TaskInfo> { return tasks }

export function testArgLength(len: number, taskInfo: TaskInfo): Result<string> {
    return Bounds.isInBounds(len, taskInfo.ExpectedArgs)
}
