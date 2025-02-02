export const TAB = '    '

export class BitwiseOperations {
    // Bitwise AND
    static bitwiseAnd(a: number, b: number): number {
        return a & b
    }

    // Bitwise OR
    static bitwiseOr(a: number, b: number): number {
        return a | b
    }

    // Bitwise XOR
    static bitwiseXor(a: number, b: number): number {
        return a ^ b
    }

    // Bitwise NOT
    static bitwiseNot(a: number): number {
        return ~a
    }

    // Left Shift
    static leftShift(a: number, n: number): number {
        return a << n
    }

    // Right Shift
    static rightShift(a: number, n: number): number {
        return a >> n
    }

    // Unsigned Right Shift
    static unsignedRightShift(a: number, n: number): number {
        return a >>> n
    }

    // Check if a number is a power of two
    static isPowerOfTwo(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0
    }

    // Set a bit (turn it to 1)
    static setBit(a: number, position: number): number {
        return a | (1 << position)
    }

    // Clear a bit (turn it to 0)
    static clearBit(a: number, position: number): number {
        return a & ~(1 << position)
    }

    // Toggle a bit (flip it)
    static toggleBit(a: number, position: number): number {
        return a ^ (1 << position)
    }

    // Get the value of a specific bit
    static getBit(a: number, position: number): number {
        return (a >> position) & 1
    }

    // Check if the bit at a specific position is set
    static isBitSet(a: number, position: number): boolean {
        return (a & (1 << position)) !== 0
    }
}

// Define a type for the input array of objects
export type Grouped<T> = {
    [key: string]: T[]
}

// Function to group items by a property
export const groupBy = <T, K extends keyof T>(arr: T[], prop: K): Grouped<T> => {
    return arr.reduce((acc, item) => {
        const key = item[prop] as unknown as string // Get the value of the property to group by

        // If the group doesn't exist, create it
        if (!acc[key]) {
            acc[key] = []
        }

        // Add the item to the corresponding group
        acc[key].push(item)

        return acc
    }, {} as Grouped<T>)
}

export const array_move = (arr: any[], old_index: number, new_index: number) => {
    if (new_index >= arr.length) {
        let k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
}
