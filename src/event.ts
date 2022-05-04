let events: Record<string, ((componentName: string) => void)[]> = {}

export function addEvent(eventName: string, componentType: string | undefined, onEvent: (componentName: string) => void) {
    const eventKey = componentType ? `${componentType}.${eventName}` : eventName

    if (events[eventKey]) events[eventKey].push(onEvent)
    else events[eventKey] = [onEvent]
}
export function fireEvent(eventName: string, componentType: string | undefined, componentName: string) {
    const eventKey = componentType ? `${componentType}.${eventName}` : eventName
    for (const event of events[eventKey] ?? []) event(componentName)
}
