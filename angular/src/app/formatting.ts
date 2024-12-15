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
