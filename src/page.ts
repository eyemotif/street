import { ComponentInfo } from './component'
import { fireEvent } from './event'

const allModes = new Set(['audio', 'chat'])

export function setModes(modes: string[] | 'all') {
    const setModes = modes === 'all' ? Array.from(allModes) : modes

    const body = document.getElementsByTagName('body')[0]
    for (const mode of setModes) {
        if (!allModes.has(mode)) throw `Invalid mode "${mode}".`

        const div = document.createElement('div')
        div.id = mode
        body.appendChild(div)
    }
}
export function modeSet(mode: string) { return document.getElementById(mode) !== null }

export function addComponent(type: string, name: string, component: ComponentInfo) {
    let div = document.getElementById(type)
    if (div === null) {
        if (allModes.has(type)) return
        else throw `Invalid component type "${type}"`
    }

    switch (type) {
        case 'audio':
            let audioTag = document.createElement('audio')
            audioTag.id = `audio-${name}`
            audioTag.onended = () => fireEvent('end', 'audio', name)

            let sourceTag = document.createElement('source')
            sourceTag.src = component.Path

            audioTag.appendChild(sourceTag)
            div.appendChild(audioTag)
            break
    }
}

export function getComponent(type: string, name: string): HTMLElement | null {
    return document.getElementById(`${type}-${name}`)
}

export function htmlEscape(text: string): string {
    const tempDiv = document.createElement('div')
    tempDiv.innerText = text
    return tempDiv.innerHTML
}
