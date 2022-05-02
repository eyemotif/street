import { ComponentInfo } from './component'
import { fireEvent } from './event'

export function addComponent(type: string, name: string, component: ComponentInfo) {
    let div = document.getElementById(type)!
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
