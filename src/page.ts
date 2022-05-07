import twemoji from 'twemoji'
import { ComponentInfo } from './component'
import { fireEvent } from './event'
import { getCachedUser, getUserBadges } from './twitch/chatter'
import { replaceEmotes } from './twitch/emote'

const allModes = new Set(['audio', 'chat', 'alert'])

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

export async function messageToParagraph<T extends HTMLElement>(p: T, username: string, replaceString: string, words: string[], userInfo = true): Promise<T> {
    const cachedUser = getCachedUser(username)
    if (userInfo) {
        if (cachedUser) {
            for (const badge of getUserBadges(cachedUser)) {
                p.innerHTML += `<img class="badge" src="${badge.X4}"></img>`
            }
        }
        p.innerHTML += `<span style="color:${cachedUser?.Color ?? ''}">${cachedUser?.DisplayName ?? username}</span>: `
    }

    const replacement = await replaceEmotes(words, replaceString)
    p.innerHTML +=
        replacement.map(r => {
            switch (r.type) {
                case 'text': return htmlEscape(r.text)
                case 'emote': return `<img class="emote" src="${r.emote.X4 ?? r.emote.X3 ?? r.emote.X2 ?? r.emote.X1}"></img>`
            }
        })
            .join(' ')
    twemoji.parse(p)

    return p
}
