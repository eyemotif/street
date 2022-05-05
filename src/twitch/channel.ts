export type BadgeSet = {
    X1: string
    X2: string
    X4: string
}

let channelID: string | undefined = undefined
let subBadges: Record<number, BadgeSet> | undefined = undefined

export async function setChannelID(channel: string) {
    const response = await fetch(`https://emotes.adamcy.pl/v1/channel/${channel}/id`)
    if (!response.ok) throw `Invalid channel "${channel}".`

    const json = await response.json()
    channelID = json['id']
}
export async function setBadges() {
    if (!channelID) throw 'Channel ID not set.'

    const response = await fetch(`https://badges.twitch.tv/v1/badges/channels/${channelID}/display`)
    if (!response.ok) throw `Error ${response.status} getting badges: ${await response.text()}.`

    const json = await response.json()
    const badges = json?.badge_sets?.subscriber?.versions
    if (!badges) return

    subBadges = {}
    for (const monthStr in badges) {
        const month = parseInt(monthStr)
        subBadges[month] = {
            X1: badges[monthStr]['image_url_1x'],
            X2: badges[monthStr]['image_url_2x'],
            X4: badges[monthStr]['image_url_4x'],
        }
    }
}
export async function getSubBadge(months: number): Promise<BadgeSet> {
    if (!subBadges) throw 'Sub badges not set.'
    return subBadges[months]
}
