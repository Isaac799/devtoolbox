import {Injectable} from '@angular/core'

export interface InformItem {
    id: number
    n: number
    innerText: string
    to: ReturnType<typeof setTimeout>
}

@Injectable({
    providedIn: 'root'
})
export class InformService {
    items: InformItem[] = []

    Mention(s: string, duration = 2500) {
        const i = this.items.findIndex(e => e.innerText === s)
        if (i !== -1) {
            clearTimeout(this.items[i].to)
            const id = this.items[i].id
            const to = setTimeout(() => {
                this.rm(id)
            }, duration)

            this.items[i].n += 1
            this.items[i].to = to
            return
        }

        const id = Math.random()
        const to = setTimeout(() => {
            this.rm(id)
        }, duration)
        this.items.push({
            id,
            n: 0,
            innerText: s,
            to
        })
    }

    private rm(id: number) {
        const i = this.items.findIndex(e => e.id === id)
        if (i === -1) {
            return
        }
        this.items.splice(i, 1)
    }
}
