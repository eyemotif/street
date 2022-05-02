let events: Record<string, ((componentName: string) => void)[]> = {}

export function addEventListener(eventName: string, componentType: string | undefined, onEvent: (componentName: string) => void) {
    const eventKey = componentType ? `${eventName}.${componentType}` : eventName

    if (events[eventKey]) events[eventKey].push(onEvent)
}
export function fireEvent(eventName: string, componentType: string | undefined, componentName: string) {
    const eventKey = componentType ? `${eventName}.${componentType}` : eventName
    for (const event of events[eventKey] ?? []) event(componentName)
}
