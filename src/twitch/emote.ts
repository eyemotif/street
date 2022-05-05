export enum EmoteProvider {
    Twitch = 0,
    SevenTV = 1,
    BetterTTV = 2,
    FrankerFaceZ = 3,
}

export type Emote = {
    Provider: EmoteProvider
    Code: string
    X1?: string | undefined
    X2?: string | undefined
    X3?: string | undefined
    X4?: string | undefined
}

export type EmoteReplacement =
    | { type: 'text', text: string }
    | { type: 'emote', emote: Emote }

export function emoteFromJson(json: any): Emote {
    if (!json['provider'] === undefined) throw 'Emote has no "provider" field.'
    if (!json['code']) throw 'Emote has no "code" field.'
    if (!json['urls']) throw 'Emote has no "urls" field.'

    let emote: Emote = {
        Provider: json['provider'],
        Code: json['code'],
    }

    for (const urlObj of json['urls']) {
        if (!urlObj['size']) throw 'Emote URL has no "size" field.'
        if (!urlObj['url']) throw 'Emote URL has no "url" field.'

        switch (urlObj['size']) {
            case '1x':
                emote.X1 = urlObj['url']
                break
            case '2x':
                emote.X2 = urlObj['url']
                break
            case '3x':
                emote.X3 = urlObj['url']
                break
            case '4x':
                emote.X4 = urlObj['url']
                break
            default: throw `Invalid Emote URL size "${urlObj['size']}".`
        }
    }

    return emote
}

let emotesCache: Record<string, Emote> = {}

function servicesString(services: EmoteProvider[] | 'all'): string {
    if (services === 'all') return 'all'
    return services
        .map(provider => {
            switch (provider) {
                case EmoteProvider.Twitch: return 'twitch'
                case EmoteProvider.SevenTV: return '7tv'
                case EmoteProvider.BetterTTV: return 'bttv'
                case EmoteProvider.FrankerFaceZ: return 'ffz'
            }
        })
        .join('.')
}

export async function getGlobalEmotes(services: EmoteProvider[] | 'all', cache: boolean = true): Promise<Record<string, Emote>> {
    let result: Record<string, Emote> = {}

    const response = await fetch(`https://emotes.adamcy.pl/v1/global/emotes/${servicesString(services)}`)
    if (response.status === 429) throw `Rate limit reached (code 429). Retry after ${response.headers.get('Retry-After')} seconds.`
    if (response.status === 400) {
        const error = await response.json()
        throw `API Error (code 4000). Reason: "${error}"`
    }
    if (response.status !== 200) throw `Fetch Error (code ${response.status}). Reason: "${response.statusText}"`
    const json = await response.json()

    for (const emoteJson of json) {
        const emote = emoteFromJson(emoteJson)
        result[emote.Code] = emote
        if (cache) emotesCache[emote.Code] = emote
    }
    return result
}

export async function getChannelEmotes(services: EmoteProvider[] | 'all', channel: string, cache: boolean = true): Promise<Record<string, Emote>> {
    let result: Record<string, Emote> = {}

    const response = await fetch(`https://emotes.adamcy.pl/v1/channel/${channel}/emotes/${servicesString(services)}`)
    if (response.status === 429) throw `Rate limit reached (code 429). Retry after ${response.headers.get('Retry-After')} seconds.`
    if (response.status === 400) {
        const error = await response.json()
        throw `API Error (code 4000). Reason: "${error}"`
    }
    if (response.status !== 200) throw `Fetch Error (code ${response.status}). Reason: "${response.statusText}"`
    const json = await response.json()

    for (const emoteJson of json) {
        const emote = emoteFromJson(emoteJson)
        result[emote.Code] = emote
        if (cache) emotesCache[emote.Code] = emote
    }
    return result
}

export function getCachedEmote(name: string): Emote | undefined { return emotesCache[name] }
export function getCachedEmoteNames(): string[] { return Object.keys(emotesCache) }

export async function replaceEmotes(words: string[], replaceString?: string): Promise<EmoteReplacement[]> {
    let replacement: EmoteReplacement[] = []
    let current = ''
    let replacers: Record<number, string> = {}

    for (const replacer of (replaceString ?? '').split('/').filter(r => r.length > 0)) {
        const [name, locStr] = replacer.split(':')
        const locs = locStr.split(',')
        const starts = locs.map(loc => /(\d+)-(\d+)/.exec(loc)![1])
        for (const start of starts)
            replacers[parseInt(start)] = name
    }

    let i = 0
    for (const word of words) {
        let emote: Emote | undefined = getCachedEmote(word)
        if (!emote && replacers[i]) {
            let anim1: Response, anim2: Response, anim3: Response, anim4: Response
            try {
                anim1 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/1.0`, { mode: 'cors' })
                anim2 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/2.0`, { mode: 'cors' })
                anim3 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/3.0`, { mode: 'cors' })
                anim4 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/4.0`, { mode: 'cors' })
            }
            catch {
                // setting the mode to be 'cors' throws an exception on a 404.
                // setting the mods to be 'no-cors' will always set "ok" to be false.
                anim1 = anim2 = anim3 = anim4 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/1.0`, { mode: 'no-cors' })
            }

            if (anim1.ok || anim2.ok || anim3.ok || anim4.ok) {
                console.log(`anim fetch ${replacers[i]}`)
                emote = {
                    Code: replacers[i],
                    Provider: EmoteProvider.Twitch,
                    X1: anim1.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/1.0` : undefined,
                    X2: anim2.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/2.0` : undefined,
                    X3: anim3.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/3.0` : undefined,
                    X4: anim4.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/animated/light/4.0` : undefined,
                }
            }
            else {
                console.log(`static fetch ${replacers[i]}`)

                const static1 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/1.0`, { mode: 'cors' })
                const static2 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/2.0`, { mode: 'cors' })
                const static3 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/3.0`, { mode: 'cors' })
                const static4 = await fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/4.0`, { mode: 'cors' })

                emote = {
                    Code: replacers[i],
                    Provider: EmoteProvider.Twitch,
                    X1: static1.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/1.0` : undefined,
                    X2: static2.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/1.0` : undefined,
                    X3: static3.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/1.0` : undefined,
                    X4: static4.ok ? `https://static-cdn.jtvnw.net/emoticons/v2/${replacers[i]}/static/light/1.0` : undefined,
                }
            }
        }

        if (emote) {
            if (current.length > 0) {
                replacement.push({ type: 'text', text: current.substring(0, current.length - 1) })
                current = ''
            }
            replacement.push({ type: 'emote', emote: emote })
            emote = undefined
        }
        else current += word + ' '
        i += word.length + 1
    }

    if (current.length > 0)
        replacement.push({ type: 'text', text: current.substring(0, current.length - 1) })

    return replacement
}
