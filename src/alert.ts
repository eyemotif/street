import { fireEvent } from './event'
import { messageToParagraph } from './page'
import { getCachedUser } from './twitch/chatter'

type AlertBody =
    | {
        Type: AlertType.Follow
    }
    | {
        Type: AlertType.Subscribe
        Months: number
        GiftTo: string | undefined
    }
    | {
        Type: AlertType.Bits
        Amount: number
    }

export enum AlertType {
    Follow,
    Subscribe,
    Bits,
}

export type Alert = {
    Username: string
    Body: string[]
    BodyReplacer: string
} & AlertBody

export async function showAlert(alert: Alert, headText: (alert: Alert) => string) {
    const alertDiv = document.getElementById('alert')!
    let alertP = document.createElement('p')
    let alertHead = document.createElement('p')
    let alertBody = document.createElement('p')

    alertHead.className = 'head'
    alertBody.className = 'body'

    alertHead.innerText = headText(alert)
    alertHead.innerHTML = alertHead.innerHTML.replace('%%', `<span class="username">${alert.Username}</span>`)
    alertBody = await messageToParagraph(alertBody, alert.Username, alert.BodyReplacer, alert.Body, false)

    alertP.appendChild(alertHead)
    alertP.appendChild(alertBody)
    alertDiv.appendChild(alertP)

    alertP.addEventListener('animationstart', () => fireEvent('start', 'alert', AlertType[alert.Type]))
    alertP.addEventListener('animationend', () => fireEvent('end', 'alert', AlertType[alert.Type]))

    alertP.className = `alert alert-${AlertType[alert.Type]}`
}
