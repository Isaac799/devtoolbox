export const replaceDoubleSpaces = (str: string) => {
        return str.replace(/\s{2,}/g, ' ');
};

export const SnakeToPascal = (value: string) => {
        return value
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
};

export const SnakeToKebab = (snake: string): string => {
        return snake.replace(/_/g, '-');
};

export const SnakeToCamel = (snakeStr: string): string => {
        return snakeStr
                .toLowerCase()
                .split('_')
                .map((word, index) => {
                        // Capitalize the first letter of each word except the first one
                        if (index === 0) {
                                return word;
                        }
                        return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join('');
};

export const SnakeToTitle = (value: string) => {
        let val = value.split('_');
        let answer: string[] = [];
        for (let i = 0; i < val.length; i++) {
                const e = val[i];
                answer.push(e.slice(0, 1).toUpperCase() + e.slice(1, e.length));
        }
        return answer.join(' ');
};

export const alignKeyword = (strings: string[], keyword: string): string[] => {
        // Find the maximum length of the prefix strings before the keyword
        const maxLength = strings.reduce((max, str) => {
                const index = str.indexOf(keyword);
                return index !== -1 ? Math.max(max, index) : max;
        }, 0);

        // Align the strings by adding spaces
        return strings.map((str) => {
                const index = str.indexOf(keyword);
                if (index === -1) return str; // Return original if keyword not found

                // Create the aligned prefix
                const alignedPrefix = str.slice(0, index) + ' '.repeat(maxLength - index);
                return alignedPrefix + keyword + str.slice(index + keyword.length);
        });
};

export const alignKeywords = (phrases: string[], keywords: string[]): string[] => {
        // Initialize the alignment reference point and mappings
        let alignTo = 0;
        const phraseMapping = new Map<string, number>();
        const answer: string[] = [];

        // Find the first keyword position for each phrase
        phrases.forEach((phrase) => {
                const keywordPosition = findKeywordPosition(phrase, keywords, alignTo);
                if (keywordPosition !== -1) {
                        phraseMapping.set(phrase, keywordPosition);
                        alignTo = Math.max(alignTo, keywordPosition);
                }
        });

        // Construct the aligned output phrases
        phrases.forEach((phrase) => {
                const position = phraseMapping.get(phrase) ?? findBackupPosition(phrase, keywords);

                if (position === undefined) {
                        answer.push(phrase);
                } else {
                        answer.push(constructAlignedPhrase(phrase, position, alignTo));
                }
        });

        return answer;
};

// Helper function to find the position of the first keyword in a phrase
const findKeywordPosition = (phrase: string, keywords: string[], alignTo: number): number => {
        for (const word of keywords) {
                const pos = phrase.indexOf(word);
                if (pos >= alignTo) {
                        return pos;
                }
        }
        return -1; // Return -1 if no keyword is found
};

// Helper function to find a backup keyword position
const findBackupPosition = (phrase: string, keywords: string[]): number | undefined => {
        for (const word of keywords) {
                const pos = phrase.indexOf(word);
                if (pos !== -1) {
                        return pos;
                }
        }
        return undefined; // Return undefined if no backup keyword is found
};

// Helper function to construct an aligned phrase
const constructAlignedPhrase = (phrase: string, position: number, alignTo: number): string => {
        const spacesToAdd = alignTo - position;
        let newPhraseParts: string[] = [];
        let addedSpacing = false;

        for (let i = 0; i < phrase.length; i++) {
                newPhraseParts.push(phrase[i]);
                if (!addedSpacing && i === position - 1) {
                        newPhraseParts.push(...Array(spacesToAdd).fill(' '));
                        addedSpacing = true;
                }
        }

        return newPhraseParts.join('');
};

export const trimAndRemoveBlankStrings = (obj: { [key: string]: string }): { [key: string]: string } => {
        const trimmedObj: { [key: string]: string } = {};

        for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                        trimmedObj[key] = obj[key].trim();
                        if (!trimmedObj[key]) delete trimmedObj[key];
                }
        }

        return trimmedObj;
};

export const organizeObjectByKeys = (obj: any) => {
        // Get the keys of the object and sort them
        const sortedKeys = Object.keys(obj).sort();

        // Create a new object with sorted keys
        const sortedObject: any = {};
        for (const key of sortedKeys) {
                sortedObject[key] = obj[key];
        }

        return sortedObject;
};

export const organizePathObjectByKeys = (obj: any) => {
        // Get the keys of the object and sort them based on path components
        const sortedKeys = Object.keys(obj).sort((a, b) => {
                const aParts = a.split('/');
                const bParts = b.split('/');

                // Compare each part of the paths
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                        if (aParts[i] !== bParts[i]) {
                                return aParts[i].localeCompare(bParts[i]);
                        }
                }

                // If one path is a prefix of the other, the shorter one comes first
                return aParts.length - bParts.length;
        });

        // Create a new object with sorted keys
        const sortedObject: any = {};
        for (const key of sortedKeys) {
                sortedObject[key] = obj[key];
        }

        return sortedObject;
};

export const GoCommentItOut = (input: string, reason: string): string => {
        // Split the input string by new lines
        const lines = input.split('\n');

        // Map through each line and add '//' at the beginning
        const modifiedLines = lines.map((line) => {
                return `//${line}`; // Prepend '//'
        });

        modifiedLines.unshift(`// ${reason}`);

        // Join the modified lines back into a single string
        return modifiedLines.join('\n');
};
