export type Components = Record<string, Record<string, ComponentInfo>>
export type ComponentInfo = {
    Path: string
}

let components: Components = {
    'audio': {}
}

export function registerComponent(type: string, name: string, component: ComponentInfo) {
    if (!components[type]) throw `Invalid component type "${type}".`
    if (Object.keys(components[type]).includes(name))
        throw `Component "${name}" already registered for component type "${type}".`
    components[type][name] = component
}
export function getComponents(): Components { return components }
export function getComponentNames(): Record<string, string[]> {
    let result: Record<string, string[]> = {}
    for (const componentType in components) {
        result[componentType] = []
        for (const componentName in components[componentType])
            result[componentType].push(componentName)
    }
    return result
}
export function getComponentTypes(): string[] {
    return Object.keys(components)
}
