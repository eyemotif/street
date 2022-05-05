import { BadgeSet, getBitsBadge, getGlobalBadge, getSubBadge, isBitsSet, isSubSet } from './channel'

export type UserInfo = {
    DisplayName: string,
    Color: string,
    Subscriber: number | undefined
    Bits: number | undefined
}

let cachedUsers: Record<string, UserInfo> = {}

export function setCachedUser(username: string, userInfo: UserInfo) {
    cachedUsers[username] = userInfo
}
export function getCachedUser(username: string): UserInfo | undefined {
    return cachedUsers[username]
}
export function getUserBadges(userInfo: UserInfo): BadgeSet[] {
    let badges: (BadgeSet | undefined)[] = [undefined, undefined]

    if (userInfo.Subscriber !== undefined) {
        let subBadge: BadgeSet | undefined = undefined
        if (isSubSet())
            subBadge = getSubBadge(userInfo.Subscriber) ?? getGlobalBadge('subscriber', userInfo.Subscriber)
        else subBadge = getGlobalBadge('subscriber', userInfo.Subscriber)
        if (subBadge) badges[0] = subBadge
    }
    if (userInfo.Bits !== undefined) {
        let bitsBadge: BadgeSet | undefined = undefined
        if (isBitsSet())
            bitsBadge = getBitsBadge(userInfo.Bits) ?? getGlobalBadge('bits', userInfo.Bits)
        else bitsBadge = getGlobalBadge('bits', userInfo.Bits)
        if (bitsBadge) badges[1] = bitsBadge
    }

    return badges.filter(badge => badge !== undefined) as BadgeSet[]
}
