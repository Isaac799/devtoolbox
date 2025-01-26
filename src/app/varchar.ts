export type VarcharJSONData = Record<string, {keys: string[]; pool: string[]}>

export type AttributeMap = Map<string, string[]>

const generateAreaCodes = (n: number): string[] => {
    const areaCodes: string[] = []

    for (let i = 0; i < n; i++) {
        // Generate a random area code in the range 201-999 (as US area codes are typically in this range)
        const areaCode = Math.floor(Math.random() * (999 - 201 + 1)) + 201
        areaCodes.push(areaCode.toString())
    }

    return areaCodes
}

const generatePhoneExtensions = (n: number): string[] => {
    const extensions: string[] = []

    for (let i = 0; i < n; i++) {
        // Generate a random phone extension between 1000 and 9999
        const extension = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
        extensions.push(extension.toString())
    }

    return extensions
}

const generateYears = (n: number, startYear = 1900, endYear = new Date().getFullYear()): string[] => {
    const years: string[] = []

    for (let i = 0; i < n; i++) {
        // Generate a random year between startYear and endYear
        const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
        years.push(year + '')
    }

    return years
}

const generateDomains = (n: number, companyNames: string[], domainExtensions: string[]): string[] => {
    const domains: string[] = []

    for (let i = 0; i < n; i++) {
        // Pick a random company name
        const companyName = companyNames[Math.floor(Math.random() * companyNames.length)]
        // Pick a random domain extension
        const extension = domainExtensions[Math.floor(Math.random() * domainExtensions.length)]
        // Generate the domain name
        const domainName = companyName.replace(/\s+/g, '').toLowerCase() + extension
        domains.push(domainName)
    }

    return domains
}

const generatePhoneNumbers = (n: number, areaCodes: string[], phoneEtensions: string[]): string[] => {
    const phoneNumbers: string[] = []

    for (let i = 0; i < n; i++) {
        const areaCode = areaCodes[i % areaCodes.length]
        const extension = phoneEtensions[i % phoneEtensions.length]
        phoneNumbers.push(`(${areaCode}) 555-123-${extension}`)
    }

    return phoneNumbers
}

const generateMacAddresses = (n: number): string[] => {
    const macAddresses: string[] = []

    for (let i = 0; i < n; i++) {
        const mac = Array(6)
            .fill(0)
            .map(() =>
                Math.floor(Math.random() * 256)
                    .toString(16)
                    .padStart(2, '0')
            )
            .join(':')
        macAddresses.push(mac)
    }

    return macAddresses
}

const generateIpAddresses = (n: number): string[] => {
    const ipAddresses: string[] = []

    for (let i = 0; i < n; i++) {
        const ip = Array(4)
            .fill(0)
            .map(() => Math.floor(Math.random() * 256))
            .join('.')
        ipAddresses.push(ip)
    }

    return ipAddresses
}

const generateModelNumbers = (n: number): string[] => {
    const models: string[] = []

    for (let i = 0; i < n; i++) {
        const model = `Model-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`
        models.push(model)
    }

    return models
}

const generateSerialNumbers = (n: number): string[] => {
    const serials: string[] = []

    for (let i = 0; i < n; i++) {
        const serial = `SN-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`
        serials.push(serial)
    }

    return serials
}

const generateEmailAddresses = (n: number, firstNames: string[], lastNames: string[], domainExtensions: string[], companies: string[]): string[] => {
    const emailAddresses: string[] = []

    for (let i = 0; i < n; i++) {
        // Generating at least 100 email addresses
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const company = companies[i % companies.length]

        // Randomly choose an email format
        const formats = [
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName[0].toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${lastName[0].toLowerCase()}`,
            `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}`, // Add number to make email unique
            `${lastName.toLowerCase()}${firstName.toLowerCase()}`,
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`,
            `${lastName.toLowerCase()}_${firstName.toLowerCase()}`
        ]

        const emailPrefix = formats[Math.floor(Math.random() * formats.length)] // Randomly select one format

        // Random chance to use a different domain format
        const domainAlternatives = domainExtensions.map(e => `${company.toLowerCase().replace(/\s+/g, '')}.${e}`)

        const randomDomain = domainAlternatives[Math.floor(Math.random() * domainAlternatives.length)]

        // Create email
        const email = `${emailPrefix}@${randomDomain}`
        emailAddresses.push(email)
    }

    return emailAddresses
}

const generateAddresses = (n: number, streets: string[], cities: string[], states: string[], countries: string[]): string[] => {
    const zipCodes = [
        '10001',
        '20002',
        '30003',
        '40004',
        '50005',
        '60006',
        '70007',
        '80008',
        '90009',
        '10010',
        '20011',
        '30012',
        '40013',
        '50014',
        '60015',
        '70016',
        '80017',
        '90018',
        '10020',
        '20021',
        '30022',
        '40023',
        '50024',
        '60025',
        '70026',
        '80027',
        '90028',
        '10030',
        '20031',
        '30032',
        '40033',
        '50034',
        '60035',
        '70036',
        '80037',
        '90038',
        '10040',
        '20041',
        '30042',
        '40043',
        '50044',
        '60045',
        '70046',
        '80047',
        '90048',
        '10050',
        '20051',
        '30052',
        '40053',
        '50054',
        '60055',
        '70056',
        '80057',
        '90058',
        '10060',
        '20061',
        '30062',
        '40063',
        '50064',
        '60065'
    ]

    const addresses: string[] = []
    for (let i = 0; i < n; i++) {
        const street = streets[i % streets.length]
        const city = cities[i % cities.length]
        const state = states[i % states.length]
        const zip = zipCodes[i % zipCodes.length]
        const country = countries[i % countries.length]

        // Randomize the address format with options like including unit numbers or different separators
        const addressFormats = [
            `${street}, ${city}, ${state} ${zip}, ${country}`,
            `${street} Apt ${Math.floor(Math.random() * 100)}, ${city}, ${state} ${zip}, ${country}`,
            `${street}, Suite ${Math.floor(Math.random() * 500)}, ${city}, ${state} ${zip}, ${country}`,
            `Unit ${Math.floor(Math.random() * 10)} ${street}, ${city}, ${state} ${zip}, ${country}`,
            `${street}, ${city}, ${state} ${zip}`,
            `${street}, ${city}, ${state}, ${country}`
        ]

        const randomAddress = addressFormats[Math.floor(Math.random() * addressFormats.length)]
        addresses.push(randomAddress)
    }
    return addresses
}

const generateEducation = (n: number, degrees: string[], universities: string[], states: string[]): string[] => {
    const educationRecords: string[] = []

    for (let i = 0; i < n; i++) {
        const degree = degrees[i % degrees.length]
        const university = universities[i % universities.length]
        const state = states[i % states.length]
        educationRecords.push(`${degree} from ${university}, ${state}`)
    }

    return educationRecords
}

const generateSocialMediaProfiles = (n: number, platforms: string[], firstNames: string[], lastNames: string[]): string[] => {
    const profiles: string[] = []

    for (let i = 0; i < n; i++) {
        const platform = platforms[i % platforms.length]
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const username = `${firstName}${lastName}${Math.floor(Math.random() * 1000)}` // Randomized username part

        profiles.push(`https://www.${platform}.com/${username}`)
    }

    return profiles
}

const generateWebsiteURLs = (n: number, firstNames: string[], lastNames: string[], domainExtensions: string[]): string[] => {
    const websiteURLs: string[] = []

    for (let i = 0; i < n; i++) {
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const domain = domainExtensions[i % domainExtensions.length]
        const siteName = `${firstName}${lastName}${Math.floor(Math.random() * 100)}${domain}` // Randomized website name

        websiteURLs.push(`https://www.${siteName}`)
    }

    return websiteURLs
}

// Generate combined destinations (city + country)
const generateTravelDestinations = (n: number, countries: string[], cities: string[]): string[] => {
    const destinations: string[] = []

    for (let i = 0; i < n; i++) {
        const country = countries[i % countries.length]
        const city = cities[i % cities.length]
        destinations.push(`${city}, ${country}`)
    }

    return destinations
}

// Generate combined vehicle details (make + model + year)
const generateVehicles = (n: number, makes: string[], models: string[], years: string[]): string[] => {
    const vehicles: string[] = []

    for (let i = 0; i < n; i++) {
        const make = makes[i % makes.length]
        const model = models[i % models.length]
        const year = years[i % years.length]
        vehicles.push(`${year} ${make} ${model}`)
    }

    return vehicles
}

const generateSSNs = (n: number): string[] => {
    const gen = (): string => {
        const areaNumber = Math.floor(Math.random() * 899) + 1 // Between 001 and 899
        const groupNumber = Math.floor(Math.random() * 99) + 1 // Between 01 and 99
        const serialNumber = Math.floor(Math.random() * 9999) + 1 // Between 0001 and 9999

        // Return the SSN in the format XXX-XX-XXXX
        return `${areaNumber.toString().padStart(3, '0')}-${groupNumber.toString().padStart(2, '0')}-${serialNumber.toString().padStart(4, '0')}`
    }

    // Generate an array of n SSNs
    return Array.from({length: n}, gen)
}

const generateCouponCodes = (n: number, couponCodes: string[]): string[] => {
    const codes: string[] = []

    const getRandomWord = (): string => {
        return couponCodes[Math.floor(Math.random() * couponCodes.length)]
    }

    const getRandomNumber = (): string => {
        return (Math.floor(Math.random() * 100) + 1).toString() // number between 1 and 100
    }

    const getRandomSuffix = (): string => {
        // Generate a small suffix like '10', 'ALE', etc.
        const suffixes = ['10', '15', '20', 'ALE', 'WIN', 'SALE', 'VIP']
        return suffixes[Math.floor(Math.random() * suffixes.length)]
    }

    for (let i = 0; i < n; i++) {
        const word = getRandomWord() // e.g., SAVE, FLASH
        const number = getRandomNumber() // e.g., 10, 20
        const suffix = getRandomSuffix() // e.g., SALE, VIP

        const couponCode = `${word}${number}${suffix}`
        codes.push(couponCode)
    }

    return codes
}

const generateHexCodes = (n: number): string[] => {
    const hexCodes: string[] = []

    for (let i = 0; i < n; i++) {
        const hexCode = `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')}`
        hexCodes.push(hexCode)
    }

    return hexCodes
}

const generateRgbColors = (n: number): string[] => {
    const rgbColors: string[] = []

    for (let i = 0; i < n; i++) {
        const r = Math.floor(Math.random() * 256)
        const g = Math.floor(Math.random() * 256)
        const b = Math.floor(Math.random() * 256)
        const rgb = `rgb(${r}, ${g}, ${b})`
        rgbColors.push(rgb)
    }

    return rgbColors
}

const generateProductNames = (n: number, productAdjectives: string[], productNouns: string[]): string[] => {
    const productNames: string[] = []

    for (let i = 0; i < n; i++) {
        // Randomly select an adjective and a noun
        const adjective = productAdjectives[Math.floor(Math.random() * productAdjectives.length)]
        const noun = productNouns[Math.floor(Math.random() * productNouns.length)]
        const productName = `${adjective} ${noun}`
        productNames.push(productName)
    }

    return productNames
}

const generateInstructions = (n: number, instructionVerbs: string[], instructionSubjects: string[]): string[] => {
    const instructions: string[] = []

    for (let i = 0; i < n; i++) {
        // Randomly select a verb, object, and action
        const verb = instructionVerbs[Math.floor(Math.random() * instructionVerbs.length)]
        const object = instructionSubjects[Math.floor(Math.random() * instructionSubjects.length)]
        const instruction = `${verb} ${object}`
        instructions.push(instruction)
    }

    return instructions
}

const generateDirections = (n: number): string[] => {
    const cardinalDirections = ['N', 'E', 'S', 'W'] // North, East, South, West
    const diagonalDirections = ['NE', 'NW', 'SE', 'SW'] // North-East, North-West, South-East, South-West

    const directions: string[] = []

    for (let i = 0; i < n; i++) {
        // Randomly decide if we want a cardinal or diagonal direction
        const useCardinal = Math.random() < 0.5 // 50% chance of cardinal direction

        if (useCardinal) {
            // Random cardinal direction (N, E, S, W)
            const direction = cardinalDirections[Math.floor(Math.random() * cardinalDirections.length)]
            directions.push(direction)
        } else {
            // Random diagonal direction (NE, NW, SE, SW)
            const direction = diagonalDirections[Math.floor(Math.random() * diagonalDirections.length)]
            directions.push(direction)
        }
    }

    return directions
}

const generateProcessTitles = (n: number, processVerbs: string[], processSubject: string[]): string[] => {
    const processTitles: string[] = []

    for (let i = 0; i < n; i++) {
        // Randomly select a verb and an object
        const verb = processVerbs[Math.floor(Math.random() * processVerbs.length)]
        const object = processSubject[Math.floor(Math.random() * processSubject.length)]
        const processTitle = `${verb} ${object}`
        processTitles.push(processTitle)
    }

    return processTitles
}

const generateMaterials = (n: number, materialTypes: string[], materialSubject: string[]): string[] => {
    const materials: string[] = []

    for (let i = 0; i < n; i++) {
        // Randomly select a material type and descriptor
        const materialType = materialTypes[Math.floor(Math.random() * materialTypes.length)]
        const descriptor = materialSubject[Math.floor(Math.random() * materialSubject.length)]
        const material = `${materialType} ${descriptor}`
        materials.push(material)
    }

    return materials
}

export const generateAttributeMap = (data: VarcharJSONData): AttributeMap => {
    const attributeMap = new Map<string, string[]>()

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const e = data[key]
            for (const k of e.keys) {
                if (!k) continue
                if (e.pool.length === 0) continue
                attributeMap.set(k, e.pool)
            }
        }
    }

    const n = 50

    const firstName = data['firstName']?.pool || []
    if (firstName.length === 0) {
        console.warn('missing firstName')
    }
    const lastName = data['lastName']?.pool || []
    if (lastName.length === 0) {
        console.warn('missing lastName')
    }
    const companyName = data['companyName']?.pool || []
    if (companyName.length === 0) {
        console.warn('missing companyName')
    }
    const domainExtension = data['domainExtension']?.pool || []
    if (domainExtension.length === 0) {
        console.warn('missing domainExtension')
    }
    const street = data['street']?.pool || []
    if (street.length === 0) {
        console.warn('missing street')
    }
    const city = data['city']?.pool || []
    if (city.length === 0) {
        console.warn('missing city')
    }
    const state = data['state']?.pool || []
    if (state.length === 0) {
        console.warn('missing state')
    }
    const studyDegree = data['studyDegree']?.pool || []
    if (studyDegree.length === 0) {
        console.warn('missing studyDegree')
    }
    const university = data['university']?.pool || []
    if (university.length === 0) {
        console.warn('missing university')
    }
    const socialPlatform = data['socialPlatform']?.pool || []
    if (socialPlatform.length === 0) {
        console.warn('missing socialPlatform')
    }
    const country = data['country']?.pool || []
    if (country.length === 0) {
        console.warn('missing country')
    }
    const carMake = data['carMake']?.pool || []
    if (carMake.length === 0) {
        console.warn('missing carMake')
    }
    const carModel = data['carModel']?.pool || []
    if (carModel.length === 0) {
        console.warn('missing carModel')
    }
    const processVerb = data['processVerb']?.pool || []
    if (processVerb.length === 0) {
        console.warn('missing processVerb')
    }
    const materialType = data['materialType']?.pool || []
    if (materialType.length === 0) {
        console.warn('missing materialType')
    }
    const materialSubject = data['materialSubject']?.pool || []
    if (materialSubject.length === 0) {
        console.warn('missing materialSubject')
    }
    const productAdjective = data['productAdjective']?.pool || []
    if (productAdjective.length === 0) {
        console.warn('missing productAdjective')
    }
    const productNoun = data['productNoun']?.pool || []
    if (productNoun.length === 0) {
        console.warn('missing productNoun')
    }
    const instructionVerb = data['instructionVerb']?.pool || []
    if (instructionVerb.length === 0) {
        console.warn('missing instructionVerb')
    }
    const instructionSubject = data['instructionSubject']?.pool || []
    if (instructionSubject.length === 0) {
        console.warn('missing instructionSubject')
    }
    const couponCode = data['couponCode']?.pool || []
    if (couponCode.length === 0) {
        console.warn('missing couponCode')
    }
    const processSubject = data['processSubject']?.pool || []
    if (processSubject.length === 0) {
        console.warn('missing processSubject')
    }
    const AreaCodesKeys = ['area codes', 'dialing codes', 'phone area codes']
    const AreaCodes = generateAreaCodes(n)
    for (const e of AreaCodesKeys) {
        attributeMap.set(e, AreaCodes)
    }

    const PhoneExtensionsKeys = ['phone extensions', 'telephone extensions', 'extension numbers']
    const PhoneExtensions = generatePhoneExtensions(n)
    for (const e of PhoneExtensionsKeys) {
        attributeMap.set(e, PhoneExtensions)
    }

    const YearsKeys = ['years', 'publication year', 'event year']
    const Years = generateYears(n)
    for (const e of YearsKeys) {
        attributeMap.set(e, Years)
    }

    const DomainsKeys = ['domain names', 'website domains', 'urls']
    const Domains = generateDomains(n, companyName, domainExtension)
    for (const e of DomainsKeys) {
        attributeMap.set(e, Domains)
    }

    const PhoneNumbersKeys = ['phone numbers', 'contact numbers', 'mobile numbers']
    const PhoneNumbers = generatePhoneNumbers(n, AreaCodes, PhoneExtensions)
    for (const e of PhoneNumbersKeys) {
        attributeMap.set(e, PhoneNumbers)
    }

    const MacAddressesKeys = ['mac', 'mac addresses', 'ethernet address']
    const MacAddresses = generateMacAddresses(n)
    for (const e of MacAddressesKeys) {
        attributeMap.set(e, MacAddresses)
    }

    const IpAddressesKeys = ['ip', 'ip address', 'internet protocol address']
    const IpAddresses = generateIpAddresses(n)
    for (const e of IpAddressesKeys) {
        attributeMap.set(e, IpAddresses)
    }

    const ModelNumbersKeys = ['model numbers', 'item model', 'product model']
    const ModelNumbers = generateModelNumbers(n)
    for (const e of ModelNumbersKeys) {
        attributeMap.set(e, ModelNumbers)
    }

    const SerialNumbersKeys = ['serial numbers', 'product serial']
    const SerialNumbers = generateSerialNumbers(n)
    for (const e of SerialNumbersKeys) {
        attributeMap.set(e, SerialNumbers)
    }

    const EmailAddressesKeys = ['email addresses', 'contact emails']
    const EmailAddresses = generateEmailAddresses(n, firstName, lastName, domainExtension, companyName)
    for (const e of EmailAddressesKeys) {
        attributeMap.set(e, EmailAddresses)
    }

    const AddressesKeys = ['addresses', 'postal addresses', 'physical addresses']
    const Addresses = generateAddresses(n, street, city, state, country)
    for (const e of AddressesKeys) {
        attributeMap.set(e, Addresses)
    }

    const EducationKeys = ['education', 'degree', 'educational background']
    const Education = generateEducation(n, studyDegree, university, state)
    for (const e of EducationKeys) {
        attributeMap.set(e, Education)
    }

    const SocialMediaProfilesKeys = ['social media profiles', 'social accounts']
    const SocialMediaProfiles = generateSocialMediaProfiles(n, socialPlatform, firstName, lastName)
    for (const e of SocialMediaProfilesKeys) {
        attributeMap.set(e, SocialMediaProfiles)
    }

    const WebsiteURLsKeys = ['website urls', 'site URLs']
    const WebsiteURLs = generateWebsiteURLs(n, firstName, lastName, domainExtension)
    for (const e of WebsiteURLsKeys) {
        attributeMap.set(e, WebsiteURLs)
    }

    const TravelDestinationsKeys = ['travel destinations', 'vacation spots', 'places to visit']
    const TravelDestinations = generateTravelDestinations(n, country, city)
    for (const e of TravelDestinationsKeys) {
        attributeMap.set(e, TravelDestinations)
    }

    const VehiclesKeys = ['vehicles', 'cars', 'automobiles']
    const Vehicles = generateVehicles(n, carMake, carModel, Years)
    for (const e of VehiclesKeys) {
        attributeMap.set(e, Vehicles)
    }

    const SSNsKeys = ['ssns', 'social security numbers']
    const SSNs = generateSSNs(n)
    for (const e of SSNsKeys) {
        attributeMap.set(e, SSNs)
    }

    const CouponCodesKeys = ['coupon', 'coupon codes', 'promo codes', 'voucher codes']
    const CouponCodes = generateCouponCodes(n, couponCode)
    for (const e of CouponCodesKeys) {
        attributeMap.set(e, CouponCodes)
    }

    const HexCodesKeys = ['hex codes', 'color hex codes']
    const HexCodes = generateHexCodes(n)
    for (const e of HexCodesKeys) {
        attributeMap.set(e, HexCodes)
    }

    const RgbColorsKeys = ['rgb colors', 'rgb values']
    const RgbColors = generateRgbColors(n)
    for (const e of RgbColorsKeys) {
        attributeMap.set(e, RgbColors)
    }

    const ProductNamesKeys = ['product names', 'item titles']
    const ProductNames = generateProductNames(n, productAdjective, productNoun)
    for (const e of ProductNamesKeys) {
        attributeMap.set(e, ProductNames)
    }

    const InstructionsKeys = ['instructions', 'guidelines', 'how-to steps']
    const Instructions = generateInstructions(n, instructionVerb, instructionSubject)
    for (const e of InstructionsKeys) {
        attributeMap.set(e, Instructions)
    }

    const DirectionsKeys = ['directions', 'navigation instructions', 'location directions']
    const Directions = generateDirections(n)
    for (const e of DirectionsKeys) {
        attributeMap.set(e, Directions)
    }

    const ProcessTitlesKeys = ['process titles', 'procedure titles', 'workflow names']
    const ProcessTitles = generateProcessTitles(n, processVerb, processSubject)
    for (const e of ProcessTitlesKeys) {
        attributeMap.set(e, ProcessTitles)
    }

    const MaterialsKeys = ['materials', 'raw materials', 'supplies']
    const Materials = generateMaterials(n, materialType, materialSubject)
    for (const e of MaterialsKeys) {
        attributeMap.set(e, Materials)
    }

    return attributeMap
}

const fuzzyCache = new Map<string, number>()

// Fuzzy string matching based on Levenshtein distance (custom scoring)
function fuzzyMatch(input: string, candidate: string): number {
    const key = `${input.toLowerCase()}~${candidate.toLowerCase()}`.trim()
    const c = fuzzyCache.get(key)
    if (c) {
        return c
    }

    const levenshteinDistance = (a: string, b: string): number => {
        const tmp: number[][] = []
        for (let i = 0; i <= a.length; i++) {
            tmp[i] = [i]
        }
        for (let j = 0; j <= b.length; j++) {
            tmp[0][j] = j
        }
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
            }
        }
        return tmp[a.length][b.length]
    }

    const distance = levenshteinDistance(input, candidate)
    const maxLength = Math.max(input.length, candidate.length)
    const score = Math.max(0, 100 - (distance / maxLength) * 100)

    fuzzyCache.set(key, score)

    return score
}

// Function to get the best match for a PFN
function getBestMatch(input: string, map: AttributeMap): string | null {
    let bestMatch: string | null = null
    let highestScore = 0

    const [entity, attr] = input.split('.')

    for (const [key, _] of map) {
        const categoryScore = fuzzyMatch(key, entity) * 0.5

        let attrModifer = 1
        if (attr === 'title') {
            attrModifer = 0.1
        }
        const attrScore = fuzzyMatch(key, attr) * attrModifer

        const score = categoryScore + attrScore

        if (score > highestScore) {
            highestScore = score
            bestMatch = key // Return just the attribute part
        }
    }

    return bestMatch
}

// Main function to construct a sentence based on input string (PFN)
export function randAttrVarchar(PFN: string, map: AttributeMap): string {
    const match = getBestMatch(PFN, map)
    if (!match) {
        return ``
    }

    const wordPool = map.get(match)

    if (!wordPool) {
        return ``
    }

    const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)]

    return randomWord
}
