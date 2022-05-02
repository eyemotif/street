import { Result } from './result'

export type Bounds =
    | { type: 'exactly', value: number }
    | { type: 'atLeast', value: number }
    | { type: 'many', value: number[] }

export const Bounds = {
    isInBounds: function (amt: number, bounds: Bounds): Result<string> {
        switch (bounds.type) {
            case 'exactly':
                if (amt === bounds.value) return [true]
                else return [false, bounds.value.toString()]
            case 'atLeast':
                if (amt >= bounds.value) return [true]
                else return [false, `at least ${bounds.value}`]
            case 'many':
                if (bounds.value.includes(amt)) return [true]
                else return [false, `one of ${bounds.value.join(', ')}`]
        }
    }
}
