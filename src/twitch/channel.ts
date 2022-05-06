export type BadgeSet = {
    X1: string
    X2: string
    X4: string
}

type GlobalBadges = {
    broadcaster: Record<number, BadgeSet>,
    moderator: Record<number, BadgeSet>,
    subscriber: Record<number, BadgeSet>
    bits: Record<number, BadgeSet>
}

let channelID: string | undefined = undefined
let globalBadges: GlobalBadges | undefined = undefined
let subBadges: Record<number, BadgeSet> | undefined = undefined
let bitsBadges: Record<number, BadgeSet> | undefined = undefined


async function getBadges(url: string, badgeSet: string): Promise<Record<number, BadgeSet>> {
    const response = await fetch(url)
    if (!response.ok) throw `Error ${response.status} getting badges: ${await response.text()}.`

    const json = await response.json()
    const badgeSets = json?.badge_sets
    if (badgeSets === undefined) throw `Field "badge_sets" not found in ${url}.`

    const set = badgeSets[badgeSet]?.versions
    if (set === undefined) return {} //throw `Field "${badgeSet}.versions" not found in ${url}.`

    let result: Record<number, BadgeSet> = {}
    for (const key in set) {
        const resultKey = parseInt(key)
        if (isNaN(resultKey)) throw `Invalid key "${key}".`

        result[resultKey] = {
            X1: set[key]['image_url_1x'],
            X2: set[key]['image_url_2x'],
            X4: set[key]['image_url_4x'],
        }
    }

    return result
}

async function getSingleBadge(url: string, badgeSet: string, element: number): Promise<BadgeSet> {
    const badgeRecord = await getBadges(url, badgeSet)
    return badgeRecord[element]
}

export async function setChannelID(channel: string) {
    const response = await fetch(`https://emotes.adamcy.pl/v1/channel/${channel}/id`)
    if (!response.ok) throw `Invalid channel "${channel}".`

    const json = await response.json()
    channelID = json['id']
}

export async function setBadges(noBadges: boolean = false) {
    if (noBadges) {
        if (channelID) {
            subBadges = {}
            bitsBadges = {}
        }
        globalBadges = {
            broadcaster: {},
            moderator: {},
            subscriber: {},
            bits: {},
        }
    }
    else {
        if (channelID) {
            subBadges = await getBadges(`https://badges.twitch.tv/v1/badges/channels/${channelID}/display`, 'subscriber')
            bitsBadges = await getBadges(`https://badges.twitch.tv/v1/badges/channels/${channelID}/display`, 'bits')
        }

        globalBadges = {
            broadcaster: await getBadges(`https://badges.twitch.tv/v1/badges/global/display`, 'broadcaster'),
            moderator: await getBadges(`https://badges.twitch.tv/v1/badges/global/display`, 'moderator'),
            subscriber: await getBadges(`https://badges.twitch.tv/v1/badges/global/display`, 'subscriber'),
            bits: await getBadges(`https://badges.twitch.tv/v1/badges/global/display`, 'bits'),
        }
    }

}

export function isGlobalSet(): boolean { return globalBadges !== undefined }
export function isSubSet(): boolean { return subBadges !== undefined }
export function isBitsSet(): boolean { return bitsBadges !== undefined }

export function getGlobalBadge(type: keyof GlobalBadges, number: number): BadgeSet | undefined {
    if (!globalBadges) throw 'Global badges not set.'
    return globalBadges[type][number]
}
export function getSubBadge(months: number): BadgeSet | undefined {
    if (!subBadges) throw 'Sub badges not set.'
    return subBadges[months]
}
export function getBitsBadge(months: number): BadgeSet | undefined {
    if (!bitsBadges) throw 'Sub badges not set.'
    return bitsBadges[months]
}
