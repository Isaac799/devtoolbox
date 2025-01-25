// returning the TS code, please privide at least 20 values for each entity-attribute pair I provided that can be passed into new Map<string, string[]>

type AttributeMap = Map<string, string[]>

const states = [
    'California',
    'Massachusetts',
    'New York',
    'Texas',
    'Florida',
    'Illinois',
    'Michigan',
    'Pennsylvania',
    'Ohio',
    'Georgia',
    'North Carolina',
    'Virginia',
    'Washington',
    'Arizona',
    'Colorado',
    'Tennessee',
    'Indiana',
    'Missouri',
    'Wisconsin',
    'Maryland',
    'Minnesota',
    'South Carolina',
    'Alabama',
    'Louisiana',
    'Kentucky',
    'Connecticut',
    'Oregon',
    'Oklahoma',
    'Iowa',
    'Nevada',
    'Kansas',
    'Arkansas',
    'Utah',
    'New Jersey',
    'New Mexico',
    'Nebraska',
    'West Virginia',
    'Idaho',
    'Hawaii',
    'Montana',
    'Wyoming',
    'Alaska',
    'North Dakota',
    'South Dakota',
    'Maine',
    'Delaware',
    'Rhode Island',
    'Vermont',
    'District of Columbia'
]

// Helper functions for data generation
const generateFirstNames = (): string[] => [
    'John',
    'Jane',
    'Carlos',
    'Alice',
    'Bob',
    'Michael',
    'Sarah',
    'David',
    'Eve',
    'Tom',
    'Chris',
    'Emily',
    'James',
    'Laura',
    'Daniel',
    'Rachel',
    'Andrew',
    'Olivia',
    'Matthew',
    'Sophia',
    'William',
    'Isabella',
    'Zachary',
    'Hannah',
    'Alexander',
    'Grace',
    'Benjamin',
    'Amelia',
    'Lucas',
    'Megan',
    'Ryan',
    'Charlotte',
    'Nathan',
    'Victoria',
    'Samuel',
    'Madison',
    'Joseph',
    'Avery',
    'Henry',
    'Lily',
    'Oliver',
    'Emma',
    'Isaac',
    'Samantha',
    'Ethan',
    'Harper',
    'Jack',
    'Leah',
    'Elijah',
    'Maya',
    'Gabriel',
    'Natalie',
    'Caleb',
    'Chloe',
    'Samuel'
]

const generateLastNames = (): string[] => [
    'Doe',
    'Smith',
    'Mendoza',
    'Johnson',
    'Lee',
    'Brown',
    'Taylor',
    'Wilson',
    'White',
    'Davis',
    'Martinez',
    'Garcia',
    'Rodriguez',
    'Hernandez',
    'Moore',
    'Clark',
    'Lewis',
    'Walker',
    'Hall',
    'Allen',
    'Young',
    'King',
    'Scott',
    'Green',
    'Adams',
    'Baker',
    'Gonzalez',
    'Nelson',
    'Carter',
    'Mitchell',
    'Perez',
    'Roberts',
    'Evans',
    'Campbell',
    'Murphy',
    'Cooper',
    'Wright',
    'Greenwood',
    'Reed',
    'Watson',
    'Wood',
    'Morgan',
    'Bailey',
    'Rivera',
    'Kim',
    'Patel',
    'Stewart',
    'Barnes',
    'Sanchez',
    'Ross'
]

const generateCompanyNames = (): string[] => [
    'TechCorp',
    'Innovative Solutions',
    'NextGen Systems',
    'DigitalWorks',
    'Global Enterprises',
    'Alpha Industries',
    'Beta Tech',
    'DataFlow Technologies',
    'Prime Systems',
    'Visionary Ventures',
    'Synergy Innovations',
    'Quantum Labs',
    'Fusion Enterprises',
    'Eclipse Solutions',
    'Core Dynamics',
    'Pinnacle Industries',
    'Hypernova Technologies',
    'Stratosphere Tech',
    'Velocity Enterprises',
    'Infinite Horizons',
    'Global Networks',
    'Redshift Enterprises',
    'Solaris Innovations',
    'Titan Technologies',
    'Crystal Solutions',
    'Summit Labs',
    'Vanguard Systems',
    'NexTech Solutions',
    'Edge Technologies',
    'Hyperlink Innovations',
    'GreenTech Enterprises',
    'Optima Solutions',
    'Skyline Ventures',
    'Orbital Systems',
    'Titanium Labs',
    'Epoch Technologies',
    'HexaTech Industries',
    'Zenith Innovations',
    'Momentum Systems',
    'LumenTech Solutions',
    'GenTech Enterprises',
    'XenoTech',
    'Spectra Innovations',
    'CloudLogic Systems',
    'Magneto Labs',
    'Proxima Solutions',
    'CoreTech Enterprises',
    'Ascend Technologies',
    'SkyTech Industries',
    'Catalyst Systems',
    'Spark Innovations',
    'Vertex Enterprises'
]

const domainExtensions = ['.com', '.net', '.org', '.io', '.tech', '.co', '.ai', '.biz']

const generateDomains = (count: number): string[] => {
    const companyNames = generateCompanyNames()
    const domains: string[] = []

    for (let i = 0; i < count; i++) {
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

const generateDepartments = (): string[] => [
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Legal',
    'Customer Support',
    'IT',
    'Product Development',
    'Operations',
    'R&D',
    'Logistics',
    'Business Development',
    'Public Relations',
    'Purchasing',
    'Quality Assurance',
    'Supply Chain',
    'Content Creation',
    'Customer Service',
    'Creative',
    'Communications',
    'Strategy',
    'Project Management',
    'Corporate Affairs',
    'Product Management',
    'Legal Affairs',
    'Data Science',
    'Risk Management',
    'Compliance',
    'Admin',
    'Data Analytics',
    'Software Development',
    'Infrastructure',
    'Client Relations',
    'Talent Acquisition',
    'Internal Audit',
    'Procurement',
    'Technical Support',
    'Financial Planning',
    'Investor Relations',
    'Design',
    'Training',
    'Facilities',
    'Brand Management',
    'Event Planning',
    'Media Relations',
    'Business Analysis',
    'Systems Administration',
    'Legal Counsel',
    'Contract Management',
    'Global Affairs',
    'Market Research',
    'Community Outreach'
]

const generatePositions = (): string[] => [
    'Software Engineer',
    'Product Manager',
    'Sales Executive',
    'HR Manager',
    'Marketing Specialist',
    'Data Analyst',
    'CEO',
    'CTO',
    'CFO',
    'UX Designer',
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Project Manager',
    'DevOps Engineer',
    'Business Analyst',
    'Product Owner',
    'Graphic Designer',
    'Content Writer',
    'Account Manager',
    'Marketing Director',
    'Operations Manager',
    'Technical Writer',
    'Data Scientist',
    'Network Engineer',
    'Security Analyst',
    'Customer Support Representative',
    'Digital Marketing Specialist',
    'Business Development Manager',
    'Quality Assurance Tester',
    'Web Developer',
    'Social Media Manager',
    'Sales Manager',
    'Chief Marketing Officer',
    'Chief Financial Officer',
    'Product Designer',
    'Customer Success Manager',
    'Client Account Executive',
    'Chief Technology Officer',
    'Cloud Architect',
    'HR Director',
    'Event Coordinator',
    'Solutions Architect',
    'Strategic Partnerships Manager',
    'Content Strategist',
    'IT Director',
    'Supply Chain Manager',
    'Financial Analyst',
    'Legal Advisor',
    'Data Architect',
    'Research Scientist',
    'System Administrator',
    'E-commerce Manager',
    'Marketing Analyst'
]

const generatePhoneNumbers = (): string[] => {
    const areaCodes = [
        '123',
        '234',
        '345',
        '456',
        '567',
        '678',
        '789',
        '890',
        '901',
        '012',
        '213',
        '324',
        '435',
        '546',
        '657',
        '768',
        '879',
        '980',
        '091',
        '202'
    ]
    const extensions = [
        '1000',
        '2000',
        '3000',
        '4000',
        '5000',
        '6000',
        '7000',
        '8000',
        '9000',
        '1001',
        '2001',
        '3001',
        '4001',
        '5001',
        '6001',
        '7001',
        '8001',
        '9001',
        '1002',
        '2002'
    ]

    const phoneNumbers: string[] = []

    for (let i = 0; i < 100; i++) {
        const areaCode = areaCodes[i % areaCodes.length]
        const extension = extensions[i % extensions.length]
        phoneNumbers.push(`(${areaCode}) 555-123-${extension}`)
    }

    return phoneNumbers
}

const generateMacAddresses = (count: number): string[] => {
    const macAddresses: string[] = []

    for (let i = 0; i < count; i++) {
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

const generateIpAddresses = (count: number): string[] => {
    const ipAddresses: string[] = []

    for (let i = 0; i < count; i++) {
        const ip = Array(4)
            .fill(0)
            .map(() => Math.floor(Math.random() * 256))
            .join('.')
        ipAddresses.push(ip)
    }

    return ipAddresses
}

const generateModelNumbers = (count: number): string[] => {
    const models: string[] = []

    for (let i = 0; i < count; i++) {
        const model = `Model-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`
        models.push(model)
    }

    return models
}

const generateSerialNumbers = (count: number): string[] => {
    const serials: string[] = []

    for (let i = 0; i < count; i++) {
        const serial = `SN-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`
        serials.push(serial)
    }

    return serials
}

const generateEmailAddresses = (firstNames: string[], lastNames: string[], companies: string[]): string[] => {
    const emailAddresses: string[] = []

    for (let i = 0; i < 100; i++) {
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

const generateAddresses = (count: number): string[] => {
    const streets = [
        '123 Main St',
        '456 Oak Rd',
        '789 Pine Ave',
        '101 Maple Dr',
        '202 Birch Ln',
        '303 Cedar Blvd',
        '404 Elm St',
        '505 Willow Way',
        '606 Cherry Cir',
        '707 Ash Ave',
        '808 Redwood Rd',
        '909 Spruce Ln',
        '1001 Palm Blvd',
        '1102 Walnut St',
        '1203 Birchwood Dr',
        '1304 Ivy St',
        '1405 Magnolia Blvd',
        '1506 Dogwood Ave',
        '1607 Beechwood Rd',
        '1708 Hemlock Ln',
        '1809 Poplar St',
        '1900 Cedarwood Dr',
        '2001 Pinecrest Blvd',
        '2102 Magnolia Cir',
        '2203 Oakwood Ave',
        '3001 Rosewood St',
        '4002 Hickory Ln',
        '5003 Almond Rd',
        '6004 Juniper Dr',
        '7005 Chestnut St',
        '8006 Lilac Ave',
        '9007 Maplewood Blvd',
        '1008 Chestnut Grove St',
        '1109 Silver Birch Rd',
        '1210 Fernwood Ln',
        '1311 Golden Oaks Blvd',
        '1412 Copper Hill Dr',
        '1513 Highland Ave',
        '1614 Bluebell Rd',
        '1715 Sycamore St',
        '1816 Lavender Ln',
        '1917 Jasmine Dr',
        '2018 Magnolia Way',
        '2119 Riverbend Blvd',
        '2220 Whispering Pines Rd',
        '2321 Sandy Springs Blvd',
        '2422 Lakeside Dr',
        '2523 Forest Oaks Rd'
    ]

    const cities = [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Miami',
        'San Francisco',
        'Dallas',
        'Seattle',
        'Denver',
        'Austin',
        'Boston',
        'Washington DC',
        'Phoenix',
        'Philadelphia',
        'Atlanta',
        'Portland',
        'Minneapolis',
        'Charlotte',
        'Detroit',
        'Miami',
        'Salt Lake City',
        'Cleveland',
        'Indianapolis',
        'St. Louis',
        'Kansas City',
        'Sacramento',
        'Chicago',
        'Tampa',
        'Las Vegas',
        'Orlando',
        'San Diego',
        'Columbus',
        'Fort Worth',
        'Nashville',
        'Baltimore',
        'San Jose',
        'Indianapolis',
        'Charlotte',
        'Oklahoma City',
        'Tucson',
        'Cincinnati',
        'St. Paul',
        'Raleigh',
        'Pittsburgh',
        'Anchorage',
        'New Orleans',
        'Salt Lake City',
        'Birmingham',
        'Cleveland',
        'St. Petersburg',
        'Jacksonville',
        'Fort Wayne',
        'Madison',
        'Bakersfield',
        'Grand Rapids',
        'Lubbock',
        'Chattanooga',
        'Macon',
        'Shreveport',
        'Boise',
        'Des Moines',
        'Toledo',
        'Murfreesboro',
        'Draper',
        'Little Rock',
        'Champaign',
        'Fresno',
        'Corpus Christi',
        'Wichita'
    ]

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

    const countries = [
        'USA',
        'Canada',
        'UK',
        'Germany',
        'Australia',
        'France',
        'Spain',
        'Italy',
        'Mexico',
        'Japan',
        'Brazil',
        'Argentina',
        'South Korea',
        'India',
        'Russia',
        'China',
        'South Africa',
        'Sweden',
        'Norway',
        'Netherlands'
    ]

    const addresses: string[] = []
    for (let i = 0; i < count; i++) {
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
const generateBiography = (): string[] => {
    return [
        'A passionate individual with a love for technology and innovation, always looking to solve problems creatively.',
        'An experienced professional in the field of finance, specializing in corporate strategy and investment management.',
        'A dedicated artist with a background in modern abstract painting, seeking to inspire others through visual art.',
        'A world traveler who has lived in multiple countries, bringing a unique cultural perspective to every project.',
        'A dedicated healthcare professional who advocates for accessible care and improving patient outcomes through innovative solutions.',
        'An avid reader and writer who loves crafting engaging stories and sharing thought-provoking ideas.',
        'A dynamic entrepreneur with a focus on sustainable business practices and ethical entrepreneurship.',
        'A detail-oriented project manager who thrives in fast-paced environments and loves turning complex challenges into simple solutions.',
        'An outdoor enthusiast with a passion for environmental conservation and advocating for the preservation of natural resources.',
        'A seasoned software developer who enjoys solving technical problems and mentoring the next generation of coders.',
        'A committed educator who strives to make a positive impact in the lives of students by fostering curiosity and critical thinking.',
        'A creative graphic designer with a flair for transforming ideas into visually compelling artwork.',
        'A marketing expert with a deep understanding of consumer behavior and a passion for crafting impactful campaigns.',
        'An experienced chef who delights in creating new culinary experiences and experimenting with fresh ingredients.',
        'A tech-savvy data analyst who enjoys uncovering hidden trends and using data to drive business decisions.',
        'A passionate advocate for social justice, working towards creating equal opportunities for all individuals.',
        'A curious scientist who loves conducting experiments and seeking innovative solutions to global challenges.',
        'A professional photographer who captures moments with precision and an eye for detail.',
        'A successful business executive who focuses on growth and leading teams to achieve common goals.',
        'A mental health professional who works tirelessly to break the stigma around mental health and provide support to those in need.',
        'A driven sports coach with a focus on building teamwork, resilience, and leadership skills.',
        'A tech entrepreneur who enjoys building innovative apps and bringing transformative ideas to life.',
        'A passionate animal rights advocate dedicated to improving the welfare of animals through education and activism.',
        'A software architect with a passion for designing scalable, efficient systems that support business needs.',
        'A self-motivated individual who thrives on helping others achieve their personal and professional goals.',
        'A public relations professional skilled at creating and maintaining positive reputations for brands and individuals.',
        'An experienced writer and content creator with a knack for telling compelling stories across different mediums.',
        'A skilled mechanical engineer who loves solving problems through technical innovation and creative thinking.',
        'A yoga instructor who promotes mindfulness, well-being, and mental clarity through breathwork and movement.',
        'An accomplished musician with a passion for composing and performing original works across genres.',
        'A digital marketing specialist who helps businesses grow their online presence and reach the right audiences.',
        'A leadership coach who empowers individuals to unlock their full potential and develop essential leadership skills.',
        'A committed environmentalist who advocates for sustainable practices and works toward protecting the planet.',
        'A communications expert who excels at crafting effective messages for diverse audiences and platforms.',
        'A tech industry veteran who enjoys staying ahead of the curve by embracing new technologies and innovation.',
        'A community organizer working to unite people around common causes to improve local neighborhoods and cities.',
        'A passionate urban planner dedicated to designing smart, sustainable, and inclusive communities.',
        'A financial advisor focused on helping individuals make informed decisions to secure their financial futures.',
        'A humanitarian with a deep commitment to serving marginalized communities and advocating for social equity.',
        'A skilled lawyer who specializes in family law, helping clients navigate complex legal issues with empathy and expertise.',
        'A dedicated human resources professional who focuses on employee engagement, development, and company culture.',
        'A fitness enthusiast who advocates for healthy living and supports others in achieving their physical goals.',
        'A highly skilled software tester who ensures that products meet the highest quality standards before reaching consumers.',
        'A digital artist who combines technology and creativity to produce innovative visual designs.',
        'A passionate historian who enjoys delving into the past to uncover valuable insights that shape the future.',
        'A motivated sales leader who drives team performance by fostering collaboration, motivation, and setting clear goals.',
        'A data-driven marketing professional who leverages analytics to craft tailored campaigns for businesses.',
        'A dedicated parent and teacher who works to create enriching learning experiences for children of all backgrounds.',
        'A strategic thinker who helps organizations plan for the future and navigate complex business landscapes.'
    ]
}

const generateBookDescription = (): string[] => {
    return [
        'An inspiring journey of self-discovery that teaches readers to overcome personal obstacles and reach their full potential.',
        'A thrilling mystery novel that takes place in a small coastal town, where everyone has something to hide.',
        'A groundbreaking exploration of the impact of social media on modern relationships and mental health.',
        'A captivating historical fiction piece set during World War II, focusing on the lives of ordinary people during extraordinary times.',
        'A heartwarming tale of friendship and resilience as two unlikely allies set off on an adventurous quest.',
        'A dark psychological thriller about a detective investigating a series of unsettling disappearances in a remote village.',
        'An epic fantasy novel filled with mythical creatures, ancient prophecies, and a hero destined to change the world.',
        'A moving narrative about the intersection of race, identity, and family in a modern-day urban setting.',
        'A science fiction adventure set on a distant planet where humanity must adapt to a new and hostile environment.',
        "A memoir that chronicles the author's journey through hardship, self-reflection, and eventual empowerment.",
        'An exploration of love and loss, told through the intertwined stories of two individuals from different walks of life.',
        'A humorous and satirical take on modern-day politics, social media, and the absurdity of public discourse.',
        'A deeply emotional tale of a mother and son navigating their relationship through the challenges of mental illness.',
        'A gripping crime novel about a seasoned investigator who uncovers a hidden conspiracy that threatens the very foundation of society.',
        'A philosophical examination of the nature of time, existence, and the human experience through the lens of a curious physicist.',
        "A chilling dystopian story set in a future where the government controls every aspect of citizens' lives.",
        'A romantic drama that explores the complexities of love, forgiveness, and second chances in a small-town setting.',
        "An adventurous exploration of the world's most remote and beautiful locations, featuring a traveling photographer.",
        'A self-help guide to cultivating mindfulness and inner peace through practical exercises and real-world examples.',
        'An educational book about the importance of sustainability and the role individuals can play in preserving the planet.',
        'A magical realism story where everyday life intersects with the supernatural in unexpected and whimsical ways.',
        'A gripping legal thriller in which a young lawyer uncovers corruption within the justice system and risks everything to expose the truth.',
        'A fantasy epic about a young hero who must unite a fractured kingdom to defeat an ancient evil threatening to return.',
        'A heart-pounding action-adventure about a group of elite soldiers tasked with a mission that could change the fate of nations.',
        "A memoir that explores the author's personal journey through grief, healing, and rediscovery of purpose.",
        'A collection of short stories that delve into the emotional lives of characters caught in moments of profound change.',
        'A satire about the clash between old-world traditions and the relentless march of modern technology.',
        'An exploration of the challenges and triumphs of being a creative in a world that constantly demands innovation.',
        'A guide to building a successful startup from the ground up, filled with practical advice and inspiring stories.',
        'A chilling psychological novel that examines the line between reality and illusion through the eyes of an unreliable narrator.',
        'An epic retelling of the rise and fall of a powerful empire, filled with political intrigue, betrayal, and ambition.',
        "A coming-of-age story about a young girl's quest for identity and belonging in a foreign land.",
        'A self-improvement book focusing on developing resilience in the face of adversity and turning obstacles into opportunities.',
        'A deep dive into the mysteries of the human mind, exploring topics like memory, dreams, and consciousness.',
        'A story of redemption and second chances, as a troubled man seeks to rebuild his life after serving time in prison.',
        'A heartwarming family drama about a father and daughter rebuilding their relationship after years of estrangement.',
        'A suspenseful tale of a group of strangers trapped in a remote cabin, with something lurking in the woods outside.',
        'A science-based exploration of the benefits of exercise, nutrition, and sleep on mental health and cognitive function.',
        'A futuristic thriller that imagines a world where advanced technology blurs the line between human and machine.',
        'An insightful book about the psychology of decision-making and how to make smarter choices in both personal and professional life.',
        'A story of survival against the odds as a group of astronauts struggle to return to Earth after a catastrophic space mission.',
        'A guide to building healthy habits and cultivating a positive mindset for a more fulfilling life.',
        'A fast-paced mystery where a detective must solve the case before the killer strikes again.',
        'A philosophical examination of the concept of freedom in the modern world, exploring both the benefits and limitations of liberty.',
        'A dramatic historical account of a famous military leader who rose from humble beginnings to reshape the world.',
        'A humorous look at modern relationships and the absurdities of online dating in the digital age.'
    ]
}

const generateArticleContent = (): string[] => {
    return [
        "In today's fast-paced digital world, it's more important than ever to stay connected to your audience through various social media platforms...",
        'The rise of artificial intelligence has opened new doors in many industries, including healthcare, finance, and marketing...',
        'This article explores the environmental impact of fast fashion and how consumers can make more sustainable choices in their shopping habits...',
        'Cybersecurity is becoming a growing concern in both the private and public sectors. This article looks at how businesses can protect their data from cyber threats...',
        'With remote work becoming the new normal, companies must adapt to support a distributed workforce and create strong virtual collaboration environments...',
        'The impact of climate change on agriculture is profound, with rising temperatures and changing weather patterns affecting crop yields worldwide...',
        'Blockchain technology is changing the way industries handle data security, transparency, and trust. This article explores its potential and future applications...',
        'As more people embrace plant-based diets, the food industry is experiencing a shift toward healthier and more sustainable food options...',
        'E-commerce has seen exponential growth in recent years, and businesses must adapt to meet consumer expectations for speed, personalization, and convenience...',
        'Mental health awareness is critical in the workplace, and organizations are increasingly taking steps to create supportive environments for their employees...',
        'The future of work is evolving, with technology and automation playing a larger role in shaping job markets and workforce demands...',
        'This article discusses the importance of financial literacy and how individuals can take control of their financial futures through informed decision-making...',
        'Diversity and inclusion have become central to many organizational cultures. Learn how companies are building more inclusive workplaces...',
        'With the rise of online education, traditional classrooms are being supplemented by virtual learning experiences that provide more flexibility and accessibility...',
        'The influence of pop culture on modern advertising is undeniable, with brands tapping into current trends to engage consumers and drive sales...',
        'As artificial intelligence advances, there are growing concerns about its ethical implications, particularly regarding privacy, bias, and job displacement...',
        'Social entrepreneurship is gaining momentum, as more individuals and organizations work to solve societal issues while achieving business success...',
        'The gig economy continues to grow, and this article explores its implications on labor rights, income stability, and the future of work...',
        'Renewable energy sources are becoming more mainstream, and this article explores the potential of solar, wind, and other sustainable technologies...',
        'The rise of influencer marketing has transformed the way brands connect with their audiences. Learn how businesses can leverage this strategy for success...',
        'Artificial intelligence is revolutionizing healthcare by enabling faster diagnoses, personalized treatments, and more efficient patient care...',
        'With increasing urbanization, cities must find innovative ways to address challenges like overcrowding, pollution, and limited resources...',
        'Data privacy is a growing concern, and individuals must take proactive steps to protect their personal information in an increasingly digital world...',
        'The concept of sustainability has expanded beyond environmental issues to include social and economic dimensions. Learn how organizations are embracing a holistic approach...',
        'The importance of mental and physical well-being is gaining recognition in schools and workplaces, with programs aimed at promoting overall health...',
        'In the age of information overload, finding ways to prioritize and filter out unnecessary content has become crucial for maintaining focus and productivity...',
        'With the ongoing challenges of the COVID-19 pandemic, businesses must find new ways to maintain operations while ensuring the safety and well-being of their employees...',
        'This article examines the growing importance of social media marketing for businesses and how companies can effectively reach their target audience online...',
        'The rise of automation and robotics is transforming manufacturing industries, leading to increased efficiency but also raising concerns about job displacement...',
        'The role of women in leadership positions continues to evolve. This article explores the challenges and triumphs of female leaders in various industries...',
        'The future of transportation lies in electric and autonomous vehicles. This article discusses the potential impact these technologies will have on cities and infrastructure...',
        'The global workforce is becoming increasingly diverse, and this article examines the benefits and challenges of promoting workplace diversity...',
        'The education system is being reshaped by technological innovations, including virtual learning platforms, artificial intelligence, and personalized education...',
        'Sustainability in fashion is no longer a trend but a necessity. Learn how designers and brands are working to reduce waste and promote eco-friendly practices...',
        'The rise of streaming services has changed the entertainment industry, offering viewers more choices and personalized content than ever before...',
        'This article discusses the importance of self-care and how individuals can incorporate habits into their daily lives to promote mental and physical health...',
        'With the increasing demand for personalized experiences, businesses are utilizing big data and advanced analytics to better understand customer behavior...',
        'This article discusses how climate change is impacting global water resources and what steps can be taken to preserve and protect freshwater supplies...',
        'As the world becomes more interconnected, cybersecurity is more important than ever. This article explores emerging threats and the best practices for protecting sensitive data...',
        'This article explores the future of artificial intelligence in creative industries such as music, art, and writing, and the ethical questions that arise from it...',
        'Work-life balance is a growing concern for employees across various sectors. This article looks at strategies for managing workload and prioritizing personal life...',
        'The importance of community engagement in urban planning is becoming more recognized as cities seek to create spaces that foster inclusivity and well-being...',
        'With the rise of online activism, individuals and groups are using social media to amplify their voices and drive positive change in society...',
        "As the gig economy expands, it's important to consider the long-term financial and social impacts on workers, including access to benefits and job stability...",
        'Digital transformation is reshaping industries worldwide. Learn how businesses are leveraging new technologies to innovate and stay competitive in the digital age...'
    ]
}

const generateProductDescriptions = (): string[] => {
    return [
        'A sleek and modern smartphone with a high-resolution display and an ultra-fast processor, perfect for both work and play.',
        'A luxurious leather wallet crafted with premium materials, featuring multiple card slots and a secure coin compartment.',
        'An ergonomic office chair designed to provide comfort and support for long hours of sitting, with adjustable height and lumbar support.',
        'A stylish wristwatch with a classic design, featuring a stainless steel band and water-resistant properties for everyday wear.',
        'A compact and portable Bluetooth speaker that delivers crystal-clear sound with a deep bass, ideal for outdoor gatherings and travel.',
        'A high-quality, non-stick frying pan with a durable ceramic coating, ensuring even heat distribution and easy cleanup.',
        'A set of noise-canceling headphones with superior sound quality, designed to block out ambient noise for an immersive listening experience.',
        'A versatile multi-tool with a range of essential functions, perfect for outdoor enthusiasts and DIY projects.',
        'A high-performance laptop with a fast processor, ample storage, and a long-lasting battery, ideal for professionals and students alike.',
        'A beautiful handwoven rug made from natural fibers, adding warmth and texture to any room in your home.',
        'An innovative smartwatch that tracks your fitness goals, monitors heart rate, and provides notifications directly on your wrist.',
        'A premium leather backpack with spacious compartments, designed for comfort and durability, perfect for both business and travel.',
        'A luxurious scented candle made with natural soy wax, filling your home with a soothing fragrance for a relaxing atmosphere.',
        'A durable and lightweight suitcase with 360-degree spinner wheels and a spacious interior for easy packing and travel convenience.',
        'A high-quality yoga mat with a non-slip surface and extra cushioning, ideal for beginners and advanced practitioners alike.',
        'A compact digital camera with advanced features, capturing stunning photos and videos with ease.',
        'A stylish and functional kitchen blender, designed for creating smoothies, soups, and sauces with minimal effort.',
        'A sophisticated coffee maker with customizable settings, perfect for brewing your ideal cup of coffee every morning.',
        'A comfortable pair of running shoes designed with breathable materials and responsive cushioning for long-lasting comfort.',
        'A sleek and efficient air purifier that removes allergens, dust, and odors, improving air quality in your home.',
        'A set of luxurious bath towels made from soft, absorbent cotton, perfect for a spa-like experience at home.',
        'A high-end gaming console with stunning graphics and fast loading times, offering an immersive gaming experience.',
        'A powerful cordless vacuum cleaner with a lightweight design, making it easy to clean every corner of your home.',
        'A stylish and practical kitchen knife set with high-quality stainless steel blades, designed for precision and durability.',
        'An elegant and functional wine cooler that keeps your favorite wines at the perfect temperature for serving.',
        'A cozy and plush throw blanket made from soft, warm materials, perfect for snuggling up on the couch.',
        'A sleek and modern desk lamp with adjustable brightness levels, providing the perfect lighting for any workspace.',
        'A durable and water-resistant smartwatch with fitness tracking features and a long-lasting battery life.',
        'A high-performance drone equipped with a 4K camera, offering stunning aerial shots and video recordings.',
        'A spacious and comfortable inflatable kayak, perfect for leisurely water adventures and exploring lakes and rivers.',
        'A reliable electric kettle with a rapid boiling feature and a temperature control setting for precise brewing.',
        'A sleek and functional tablet designed for both entertainment and productivity, featuring a vibrant screen and fast processing speed.',
        'A beautifully crafted stainless steel cocktail shaker, perfect for mixing drinks and entertaining guests.',
        'A stylish and comfortable pair of sunglasses with UV protection and a modern design, ideal for sunny days.',
        'A cozy heated blanket with multiple heat settings, providing warmth and comfort during the colder months.',
        'A lightweight and foldable electric bike with a powerful motor, making it easy to navigate through the city streets.',
        'A premium-quality portable charger with a high-capacity battery, ensuring that your devices stay powered on the go.',
        'A versatile portable grill perfect for outdoor barbecues, tailgating, and camping trips.',
        'A high-quality leather journal with a smooth, durable cover and thick, acid-free pages for writing and sketching.',
        'A space-saving folding treadmill designed for easy storage, ideal for indoor workouts and fitness routines.',
        'A stylish and modern coffee table made from solid wood and tempered glass, adding a touch of elegance to any living room.',
        'A set of premium-quality essential oils, each designed to promote relaxation, focus, and well-being.',
        'A durable and comfortable hiking backpack with plenty of compartments, perfect for outdoor adventures and travel.',
        'A high-performance blender with a powerful motor and multiple speed settings, perfect for making smoothies and soups.',
        'A sleek and lightweight smartwatch with customizable bands, offering notifications, fitness tracking, and more.',
        'An adjustable standing desk with a spacious work surface and ergonomic design, promoting better posture and productivity.',
        'A beautifully designed ceramic teapot, perfect for brewing your favorite tea and serving guests.',
        'A cozy pair of slippers with a memory foam insole, offering ultimate comfort and support for your feet.',
        'A compact and efficient home espresso machine with customizable settings, ideal for brewing your perfect cup of coffee.',
        'A high-end portable speaker with water-resistant features, perfect for outdoor use and parties.',
        'A set of premium kitchen utensils made from durable stainless steel, designed for long-lasting use and performance.',
        'An elegant and functional desk organizer to help keep your workspace tidy and efficient.'
    ]
}

const generateGenericDescriptions = (): string[] => {
    return [
        'A highly functional and practical item designed to meet your everyday needs with ease and efficiency.',
        'An elegant piece that combines form and function, perfect for any modern home or office setting.',
        'A versatile product that offers a wide range of uses, making it a must-have for anyone looking to simplify their life.',
        'An essential addition to your collection, offering both style and practicality for daily use.',
        'A durable and long-lasting product, engineered for reliability and ease of use.',
        'A premium item designed to elevate your daily experience with its innovative features and sleek design.',
        'A timeless classic that blends seamlessly into any environment, offering both style and utility.',
        'A smart choice for anyone looking to enhance their lifestyle with top-tier functionality and design.',
        'An item that offers exceptional value, combining quality, design, and affordability.',
        'A sleek, modern solution for those looking for style and practicality in their everyday products.',
        'A beautifully crafted item that brings both elegance and utility to your space.',
        'A convenient and easy-to-use product, designed to simplify your life and make everyday tasks easier.',
        'A minimalist design that combines beauty with practicality, perfect for any occasion.',
        'A high-quality product that offers outstanding performance and features at an affordable price.',
        'A user-friendly item that takes the guesswork out of everyday tasks, making it the perfect addition to any home or office.',
        'A functional and attractive product that fits seamlessly into your daily routine.',
        'An innovative solution that combines cutting-edge design with ultimate practicality.',
        'A high-performance item that provides superior results and is built to last.',
        "An affordable yet stylish product designed to meet the needs of today's fast-paced lifestyle.",
        'A product that offers an unbeatable combination of style, performance, and value.',
        'A reliable and efficient item that stands the test of time and provides exceptional results.',
        'An essential accessory designed to provide comfort, style, and functionality in one package.',
        'A well-crafted product made with care and attention to detail, built to perform and impress.',
        'A sophisticated item that combines the best of technology, design, and user experience.',
        'A product that offers unparalleled convenience, making it an essential part of any home or office.',
        'A versatile and reliable product that adapts to your needs and performs under any circumstances.',
        'A stylish and functional item designed to fit perfectly into your daily life.',
        'An item built with care and precision, offering lasting quality and unmatched performance.',
        'A modern and innovative product that combines advanced technology with intuitive design.',
        'A product that effortlessly blends in with your surroundings while offering exceptional functionality.',
        'A high-quality item designed to meet your needs while offering a sleek, modern aesthetic.',
        'A well-designed product that takes your daily routines to the next level with ease and style.',
        'A premium item that provides superior results and stands out for its attention to detail.',
        'An item crafted for both beauty and utility, offering long-lasting value.',
        'A functional and attractive product that helps streamline your routine while looking great.',
        'A versatile product that can be used in a variety of ways, making it an essential in your home.',
        'A practical and stylish item that simplifies everyday tasks and makes life easier.',
        'An item that offers a unique combination of convenience, style, and durability.',
        'A thoughtfully designed product that adds both form and function to any space.',
        'A durable and high-performance item, built to withstand the test of time and deliver exceptional results.',
        'A must-have product that enhances your life with superior functionality and timeless design.',
        'A practical solution that combines smart design with modern technology for everyday ease.',
        'A beautifully made product that brings both elegance and utility to your home or office.',
        'An item that offers simplicity, performance, and value all in one package.',
        'A versatile and stylish product that enhances your lifestyle with ease and sophistication.',
        'A smartly designed product that adds a touch of luxury while offering practical functionality.',
        'An affordable and stylish solution for everyday tasks, designed to make life easier and more enjoyable.',
        'A modern item that blends innovative technology with sleek aesthetics, offering unbeatable performance.',
        'An elegant and practical product that stands out for its simplicity and functionality.',
        'A versatile item that adapts to your lifestyle, offering both style and utility at a great value.'
    ]
}

const generateInterests = (): string[] => {
    return [
        'Photography',
        'Traveling',
        'Cooking',
        'Reading',
        'Fitness',
        'Gardening',
        'Music',
        'Hiking',
        'Technology',
        'Painting',
        'Cycling',
        'Writing',
        'Yoga',
        'Running',
        'Dancing',
        'Swimming',
        'Baking',
        'Video Games',
        'Art Collecting',
        'Fishing',
        'Camping',
        'Fashion Design',
        'Birdwatching',
        'Astronomy',
        'Skiing',
        'Surfing',
        'Poetry',
        'Acting',
        'Knitting',
        'Woodworking',
        'Sculpture',
        'Pottery',
        'Calligraphy',
        'Diving',
        'Languages',
        'Stand-up Comedy',
        'Volunteering',
        'Podcasting',
        'Board Games',
        'Genealogy',
        'Cryptocurrency',
        'Spirituality',
        'Cultural Exploration',
        'Interior Design',
        'Antique Collecting',
        'Motorcycling',
        'Running Marathons',
        'Sculpting',
        'Origami',
        'Fitness Training',
        'Homebrewing',
        'Public Speaking',
        'Sailing',
        'Graphic Design',
        'Historical Reenactment'
    ]
}

const generateEducation = (): string[] => {
    const degrees = [
        'B.A. in Business Administration',
        'M.Sc. in Computer Science',
        'Ph.D. in Environmental Science',
        'M.A. in Literature',
        'B.S. in Mechanical Engineering',
        'M.A. in Fine Arts',
        'B.A. in Psychology',
        'M.S. in Data Science',
        'Ph.D. in Physics',
        'B.A. in Sociology',
        'M.B.A.',
        'B.A. in Political Science',
        'M.A. in Economics',
        'B.S. in Electrical Engineering',
        'Ph.D. in Neuroscience',
        'B.A. in History',
        'M.Sc. in Artificial Intelligence',
        'B.S. in Environmental Engineering',
        'M.A. in Anthropology',
        'B.A. in Philosophy',
        'M.S. in Software Engineering',
        'Ph.D. in Mathematics',
        'B.A. in Architecture',
        'M.A. in Journalism',
        'B.S. in Biochemistry',
        'M.A. in Education',
        'B.A. in English Literature',
        'Ph.D. in Linguistics',
        'M.A. in Urban Planning',
        'B.A. in Media Studies',
        'M.Sc. in Biostatistics',
        'B.S. in Chemical Engineering',
        'Ph.D. in Sociology',
        'B.A. in Art History',
        'M.A. in International Relations',
        'B.S. in Computer Engineering',
        'M.A. in Music Theory',
        'B.A. in Communication Studies',
        'M.Sc. in Cybersecurity',
        'B.A. in Public Policy',
        'M.S. in Robotics',
        'B.S. in Nursing',
        'M.A. in Political Science',
        'Ph.D. in Education',
        'B.A. in Music Composition',
        'M.S. in Statistics',
        'B.A. in Environmental Studies',
        'M.Sc. in Geology',
        'B.A. in Economics',
        'Ph.D. in Psychology',
        'B.S. in Mathematics'
    ]

    const universities = [
        'Lakeside University',
        'Northwood Institute of Technology',
        'Golden Gate Academy',
        'Hillcrest University',
        'Eastfield College of Arts',
        'Crystal Waters University',
        'Brightstone College',
        'Silver Birch Institute',
        'Western Plains Academy',
        'Maple Ridge University',
        'Greenfield Institute of Science',
        'Starlight University',
        'Harborview College',
        'Sunshine University',
        'Evergreen Institute',
        'Cloudridge University',
        'Sapphire Mountain College',
        'Redwood Heights University',
        'Rockhill University',
        'Riverstone Academy',
        'Blue Ocean University',
        'Clearview College',
        'Stonehill University',
        'Oakwood College of Arts',
        'Cedarfield Institute',
        'Briarwood University',
        'Crestview Academy',
        'White Sands University',
        'Pinecrest College',
        'Windward University',
        'Ashwood Institute',
        'Silverstone College',
        'Wildflower University',
        'Lakeview Academy',
        'Seabreeze College',
        'Goldcrest University',
        'Stonebrook University',
        'Bright Horizons Academy',
        'Shoreline College of Arts',
        'Sagewood Institute',
        'Forestgrove University',
        'Violet Plains Academy',
        'Harborstone College',
        'Crystal Springs University',
        'Tidewater Institute',
        'Horizon Ridge University',
        'Redberry University',
        'Springhill College',
        'Autumnwood Academy',
        'Mountainview Institute',
        'Silverpine College',
        'Valley Forge University'
    ]

    const educationRecords: string[] = []

    for (let i = 0; i < 50; i++) {
        const degree = degrees[i % degrees.length]
        const university = universities[i % universities.length]
        const state = states[i % states.length]
        educationRecords.push(`${degree} from ${university}, ${state}`)
    }

    return educationRecords
}
const generateSocialMediaProfiles = (): string[] => {
    const platforms = ['twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'pinterest']
    const firstNames = ['john', 'jane', 'alex', 'emily', 'chris', 'sarah', 'david', 'katie', 'michael', 'lisa']
    const lastNames = ['doe', 'smith', 'miller', 'johnson', 'brown', 'lee', 'taylor', 'white', 'wilson', 'davis']

    const profiles: string[] = []

    for (let i = 0; i < 50; i++) {
        const platform = platforms[i % platforms.length]
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const username = `${firstName}${lastName}${Math.floor(Math.random() * 1000)}` // Randomized username part

        profiles.push(`https://www.${platform}.com/${username}`)
    }

    return profiles
}

const generateWebsiteURLs = (): string[] => {
    const firstNames = generateFirstNames()
    const lastNames = generateLastNames()

    const websiteURLs: string[] = []

    for (let i = 0; i < 50; i++) {
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[i % lastNames.length]
        const domain = domainExtensions[i % domainExtensions.length]
        const siteName = `${firstName}${lastName}${Math.floor(Math.random() * 100)}${domain}` // Randomized website name

        websiteURLs.push(`https://www.${siteName}`)
    }

    return websiteURLs
}

const generateFavoriteBooks = (): string[] => {
    return [
        'To Kill a Mockingbird',
        '1984',
        'The Great Gatsby',
        'Moby Dick',
        'Pride and Prejudice',
        'The Catcher in the Rye',
        'The Lord of the Rings',
        "Harry Potter and the Sorcerer's Stone",
        'The Hobbit',
        'The Chronicles of Narnia',
        'Brave New World',
        'The Book Thief',
        'The Kite Runner',
        'The Hunger Games',
        'The Fault in Our Stars',
        'War and Peace',
        'Ulysses',
        'Don Quixote',
        'The Odyssey',
        'Fahrenheit 451',
        'Wuthering Heights',
        'The Alchemist',
        'Catch-22',
        'Slaughterhouse-Five',
        'The Picture of Dorian Gray',
        'The Road',
        'Crime and Punishment',
        'The Secret Garden',
        'The Brothers Karamazov',
        'The Godfather',
        'The Great Expectations',
        'The Bell Jar',
        'The Grapes of Wrath',
        'Frankenstein',
        'One Hundred Years of Solitude',
        "The Handmaid's Tale",
        'The Shining',
        'The Outsiders',
        'Little Women',
        'Jane Eyre',
        'The Silence of the Lambs',
        "Bridget Jones's Diary",
        'Lord of the Flies',
        'Beloved',
        'The Girl on the Train',
        'The Giver',
        'The Goldfinch',
        'A Tale of Two Cities',
        'Gone with the Wind',
        'Of Mice and Men',
        'Shantaram'
    ]
}

const generateFavoriteMovies = (): string[] => {
    return [
        'Inception',
        'The Matrix',
        'The Shawshank Redemption',
        'Forrest Gump',
        'The Dark Knight',
        'Pulp Fiction',
        'The Godfather',
        "Schindler's List",
        'Fight Club',
        'The Lord of the Rings: The Return of the King',
        'Star Wars: A New Hope',
        'The Silence of the Lambs',
        'The Terminator',
        'The Lion King',
        'Back to the Future',
        'Gladiator',
        'The Social Network',
        'The Green Mile',
        'Casablanca',
        'Citizen Kane',
        'The Big Lebowski',
        'Goodfellas',
        'Titanic',
        'The Shawshank Redemption',
        'Jurassic Park',
        'The Prestige',
        'Avatar',
        'The Wolf of Wall Street',
        'A Clockwork Orange',
        'Blade Runner',
        'The Matrix Reloaded',
        'The Dark Knight Rises',
        'The Departed',
        'The Pianist',
        'There Will Be Blood',
        'Gone with the Wind',
        'Eternal Sunshine of the Spotless Mind',
        'The Good, the Bad, and the Ugly',
        'Interstellar',
        '12 Angry Men',
        'The Revenant',
        'The Usual Suspects',
        'The Great Gatsby',
        'Deadpool',
        'Jurassic World',
        'Black Panther',
        'Mad Max: Fury Road',
        'La La Land',
        'The Incredibles',
        'Parasite',
        'Avengers: Endgame',
        'The Matrix Revolutions'
    ]
}

const generateMusicPreferences = (): string[] => {
    return [
        'Rock',
        'Pop',
        'Jazz',
        'Classical',
        'Hip-Hop',
        'Electronic',
        'Indie',
        'Country',
        'Blues',
        'Reggae',
        'R&B',
        'Soul',
        'Folk',
        'Punk',
        'Alternative',
        'Metal',
        'Disco',
        'Techno',
        'House',
        'Funk',
        'Opera',
        'Trap',
        'Dubstep',
        'Dancehall',
        'Ambient',
        'Latin',
        'Jazz Fusion',
        'Experimental',
        'Bluegrass',
        'Ska',
        'Swing',
        'K-Pop',
        'New Age',
        'Gospel',
        'Acapella',
        'Post-Punk',
        'Grunge',
        'Industrial',
        'Electronic Rock',
        'Chillwave',
        'Synthwave',
        'Folk Rock',
        'Lo-Fi Hip-Hop',
        'Hardcore Punk',
        'Indie Pop',
        'Post-Rock',
        'Reggaeton',
        'Tech House',
        'Folk Pop',
        'Trap Soul',
        'Progressive Rock',
        'Classical Crossover'
    ]
}

// Generate list of countries
const generateCountries = (): string[] => {
    return [
        'France',
        'Japan',
        'USA',
        'Italy',
        'Australia',
        'United Kingdom',
        'Spain',
        'Thailand',
        'Germany',
        'UAE',
        'Netherlands',
        'South Africa',
        'Singapore',
        'Brazil',
        'Russia',
        'Mexico',
        'Canada',
        'China',
        'Greece',
        'Sweden',
        'Switzerland',
        'Turkey',
        'Egypt',
        'Czech Republic',
        'Malaysia',
        'Nigeria',
        'Portugal',
        'Scotland',
        'Morocco',
        'Iceland',
        'Kenya',
        'Scotland',
        'Belgium',
        'Denmark',
        'Finland',
        'India',
        'South Korea',
        'New Zealand',
        'Colombia',
        'Vietnam',
        'Poland',
        'Austria',
        'Argentina',
        'Chile',
        'South Korea',
        'Peru',
        'Bulgaria',
        'Israel',
        'Romania',
        'Hungary',
        'Ukraine',
        'Croatia',
        'Estonia'
    ]
}

// Generate list of cities
const generateCities = (): string[] => {
    return [
        'Paris',
        'Tokyo',
        'New York',
        'Rome',
        'Sydney',
        'London',
        'Barcelona',
        'Bangkok',
        'Berlin',
        'Dubai',
        'Amsterdam',
        'Los Angeles',
        'Cape Town',
        'Singapore',
        'Rio de Janeiro',
        'Venice',
        'Athens',
        'Istanbul',
        'Cairo',
        'Prague',
        'Moscow',
        'Kuala Lumpur',
        'Mexico City',
        'Vienna',
        'Stockholm',
        'Zurich',
        'Budapest',
        'Beijing',
        'Vancouver',
        'San Francisco',
        'Munich',
        'Lisbon',
        'Reykjavik',
        'Bali',
        'Lagos',
        'Budapest',
        'Seoul',
        'Hong Kong',
        'Machu Picchu',
        'Shanghai',
        'Copenhagen',
        'Nairobi',
        'San Juan',
        'Lima',
        'Oslo',
        'Lagos',
        'Edinburgh',
        'Marrakech',
        'Sydney',
        'Berlin',
        'Cape Town',
        'Amsterdam',
        'Rio de Janeiro'
    ]
}

// Generate combined destinations (city + country)
const generateTravelDestinations = (): string[] => {
    const countries = generateCountries()
    const cities = generateCities()
    const destinations: string[] = []

    for (let i = 0; i < 50; i++) {
        const country = countries[i % countries.length]
        const city = cities[i % cities.length]
        destinations.push(`${city}, ${country}`)
    }

    return destinations
}

const generateSkillsCertifications = (): string[] => {
    return [
        'Certified Data Scientist',
        'AWS Certified Solutions Architect',
        'Project Management Professional (PMP)',
        'Google Analytics Certified',
        'Certified ScrumMaster (CSM)',
        'Microsoft Certified: Azure Fundamentals',
        'Certified Ethical Hacker (CEH)',
        'Certified Information Systems Security Professional (CISSP)',
        'Cisco Certified Network Associate (CCNA)',
        'Certified Kubernetes Administrator (CKA)',
        'AWS Certified Developer - Associate',
        'Google Cloud Certified - Professional Cloud Architect',
        'Certified Business Analysis Professional (CBAP)',
        'Certified Scrum Product Owner (CSPO)',
        'Oracle Certified Professional (OCP)',
        'Certified Six Sigma Green Belt',
        'CompTIA A+ Certification',
        'Certified Information Systems Auditor (CISA)',
        'Certified Cloud Security Professional (CCSP)',
        'Certified DevOps Engineer (AWS)',
        'Certified Blockchain Developer',
        'HubSpot Inbound Marketing Certification',
        'Certified ITIL Foundation',
        'Certified Salesforce Administrator',
        'Certified Python Developer',
        'Certified JavaScript Developer',
        'Certified React Developer',
        'Tableau Desktop Specialist Certification',
        'Microsoft Certified: Power BI Expert',
        'Google Ads Certification',
        'Microsoft Certified: Azure Solutions Architect Expert',
        'Certified ScrumMaster (CSM)',
        'VMware Certified Professional',
        'Google Cloud Certified - Associate Cloud Engineer',
        'Certified Web Developer',
        'Certified Product Manager',
        'AWS Certified SysOps Administrator',
        'Certified Network Security Administrator',
        'Certified Cloud Practitioner (AWS)',
        'Certified Salesforce Developer',
        'Red Hat Certified Engineer (RHCE)',
        'Certified Ethical Hacker (CEH) - Advanced',
        'Certified PHP Developer',
        'CompTIA Security+ Certification',
        'Certified Ethical AI Practitioner',
        'Cisco Certified Network Professional (CCNP)',
        'Certified Information Privacy Professional (CIPP)',
        'Certified AI and Machine Learning Specialist',
        'Certified Digital Marketing Professional',
        'Certified Mobile App Developer',
        'Certified Java Developer',
        'Certified Data Analyst',
        'Certified Machine Learning Specialist',
        'Certified Full Stack Developer'
    ]
}

const generateUserStatus = (): string[] => {
    return [
        'spouse',
        'partner',
        'child',
        'parent',
        'sibling',
        'friend',
        'relative',
        'client',
        'contact',
        'person',
        'co-worker',
        'colleague',
        'team member',
        'manager',
        'assistant',
        'supervisor',
        'mentor',
        'user',
        'advisor',
        'employee',
        'student',
        'teacher',
        'doctor',
        'nurse',
        'director',
        'executive',
        'founder',
        'CEO',
        'COO',
        'CFO',
        'engineer',
        'designer',
        'developer',
        'marketer',
        'salesperson',
        'administrator',
        'recruiter',
        'HR specialist',
        'intern',
        'volunteer',
        'customer',
        'patient',
        'investor',
        'donor',
        'sponsor',
        'community member',
        'peer',
        'team leader',
        'coach',
        'participant',
        'teammate',
        'judge',
        'spiritual leader',
        'business partner',
        'consultant',
        'freelancer',
        'contractor',
        'author',
        'artist',
        'public speaker',
        'scientist',
        'therapist',
        'social worker',
        'lawyer',
        'paralegal',
        'architect',
        'chef',
        'bartender',
        'waiter',
        'nanny',
        'caregiver',
        'researcher',
        'athlete',
        'trainer',
        'motivational speaker'
    ]
}

const generateFavoriteQuotes = (): string[] => {
    return [
        '“The only way to do great work is to love what you do.” - Steve Jobs',
        '“In the middle of difficulty lies opportunity.” - Albert Einstein',
        '“The journey of a thousand miles begins with one step.” - Lao Tzu',
        '“Success is not final, failure is not fatal: It is the courage to continue that counts.” - Winston Churchill',
        '“It does not matter how slowly you go as long as you do not stop.” - Confucius',
        '“The best way to predict the future is to create it.” - Peter Drucker',
        '“Success usually comes to those who are too busy to be looking for it.” - Henry David Thoreau',
        '“Hardships often prepare ordinary people for an extraordinary destiny.” - C.S. Lewis',
        "“Don't watch the clock; do what it does. Keep going.” - Sam Levenson",
        "“It always seems impossible until it's done.” - Nelson Mandela",
        '“The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.” - Ralph Waldo Emerson',
        '“You must be the change you wish to see in the world.” - Mahatma Gandhi',
        '“What you get by achieving your goals is not as important as what you become by achieving your goals.” - Zig Ziglar',
        '“Do not wait to strike till the iron is hot, but make it hot by striking.” - William Butler Yeats',
        '“Success is not in what you have, but who you are.” - Bo Bennett',
        '“It is never too late to be what you might have been.” - George Eliot',
        '“Everything you can imagine is real.” - Pablo Picasso',
        '“The way to get started is to quit talking and begin doing.” - Walt Disney',
        '“If you can dream it, you can do it.” - Walt Disney',
        "“You miss 100% of the shots you don't take.” - Wayne Gretzky",
        "“Opportunities don't happen, you create them.” - Chris Grosser",
        "“It always seems impossible until it's done.” - Nelson Mandela",
        '“The future belongs to those who believe in the beauty of their dreams.” - Eleanor Roosevelt',
        "“Don't wait for the perfect moment. Take the moment and make it perfect.” - Unknown",
        "“In the end, we only regret the chances we didn't take.” - Lewis Carroll",
        '“Everything has beauty, but not everyone sees it.” - Confucius',
        '“Do what you can, with what you have, where you are.” - Theodore Roosevelt',
        "“Believe you can and you're halfway there.” - Theodore Roosevelt",
        '“A journey of a thousand miles begins with a single step.” - Lao Tzu',
        '“The only limit to our realization of tomorrow is our doubts of today.” - Franklin D. Roosevelt',
        "“Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.” - Roy T. Bennett",
        '“You are never too old to set another goal or to dream a new dream.” - C.S. Lewis',
        '“Do one thing every day that scares you.” - Eleanor Roosevelt',
        '“What lies behind us and what lies before us are tiny matters compared to what lies within us.” - Ralph Waldo Emerson',
        '“To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.” - Ralph Waldo Emerson',
        '“You become what you believe.” - Oprah Winfrey',
        '“The only way to do great work is to love what you do.” - Steve Jobs',
        '“Success is the sum of small efforts, repeated day in and day out.” - Robert Collier',
        '“You can never cross the ocean until you have the courage to lose sight of the shore.” - Christopher Columbus',
        '“Doubt kills more dreams than failure ever will.” - Suzy Kassem',
        '“The only person you are destined to become is the person you decide to be.” - Ralph Waldo Emerson',
        '“Nothing in the world can take the place of Persistence.” - Calvin Coolidge',
        "“Life isn't about finding yourself. Life is about creating yourself.” - George Bernard Shaw",
        '“The only way to achieve the impossible is to believe it is possible.” - Charles Kingsleigh',
        '“Happiness depends upon ourselves.” - Aristotle',
        '“Success is not the key to happiness. Happiness is the key to success.” - Albert Schweitzer',
        '“The future belongs to those who believe in the beauty of their dreams.” - Eleanor Roosevelt'
    ]
}

const generatePets = (): string[] => {
    return [
        'Golden Retriever',
        'Siamese Cat',
        'Parrot',
        'Hamster',
        'Turtle',
        'Labrador Retriever',
        'Bulldog',
        'Beagle',
        'Poodle',
        'Rottweiler',
        'Persian Cat',
        'Maine Coon Cat',
        'Cocker Spaniel',
        'Chihuahua',
        'Boxer',
        'German Shepherd',
        'Husky',
        'Yorkshire Terrier',
        'Shih Tzu',
        'Bengal Cat',
        'Sphynx Cat',
        'Rabbit',
        'Guinea Pig',
        'Macaw',
        'Cockatoo',
        'Fish',
        'Iguana',
        'Ferret',
        'Chinchilla',
        'Koi Fish',
        'Corn Snake',
        'Axolotl',
        'Gecko',
        'Tortoise',
        'American Pitbull Terrier',
        'Jack Russell Terrier',
        'Australian Shepherd',
        'Cavalier King Charles Spaniel',
        'Dalmatian',
        'Samoyed',
        'Basset Hound',
        'Maltese',
        'Pomeranian',
        'Saint Bernard',
        'Great Dane',
        'Doberman Pinscher',
        'Akita',
        'Border Collie',
        'Cocker Spaniel',
        'Pekingese',
        'Shiba Inu',
        'English Bulldog'
    ]
}

// Generate makes, models, and years
const generateMakes = (): string[] => {
    return ['Tesla', 'BMW', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Mercedes-Benz', 'Nissan', 'Volkswagen']
}

const generateModels = (): string[] => {
    return ['Model 3', '3 Series', 'A4', 'Prius', 'Civic', 'Mustang', 'Camaro', 'C-Class', 'Altima', 'Golf']
}

const generateYears = (): string[] => {
    return ['2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013']
}

// Generate combined vehicle details (make + model + year)
const generateVehicles = (): string[] => {
    const makes = generateMakes()
    const models = generateModels()
    const years = generateYears()

    const vehicles: string[] = []

    for (let i = 0; i < 50; i++) {
        const make = makes[i % makes.length]
        const model = models[i % models.length]
        const year = years[i % years.length]
        vehicles.push(`${year} ${make} ${model}`)
    }

    return vehicles
}

const generateFavoriteFoods = (): string[] => {
    return [
        'Pizza',
        'Sushi',
        'Burger',
        'Pasta',
        'Tacos',
        'Salad',
        'Ice Cream',
        'Steak',
        'Spaghetti',
        'Sushi Rolls',
        'Peking Duck',
        'Ramen',
        'Chicken Wings',
        'Dim Sum',
        'Lasagna',
        'Burgers with Fries',
        'Curry',
        'Barbecue',
        'Grilled Cheese Sandwich',
        'Fried Chicken',
        'Pancakes',
        'French Fries',
        'Poke Bowl',
        'Fish and Chips',
        'Tiramisu',
        'Cheesecake',
        'Macarons',
        'Chocolate Cake',
        'Apple Pie',
        'Churros',
        'Spring Rolls',
        'Falafel',
        'Biryani',
        'Samosas',
        'Chili',
        'Meatballs',
        'Eggplant Parmesan',
        'Moussaka',
        'Paella',
        'Poke Bowl',
        'Pho',
        'Ceviche',
        'Tempura',
        'Beef Wellington',
        'Shawarma',
        'Mushroom Risotto',
        'Quiche',
        'Clam Chowder',
        'Waffles',
        'Hot Dog',
        'Kebabs',
        'Lobster Roll',
        'Seafood Platter',
        'Poutine',
        'Avocado Toast',
        'Fettuccine Alfredo'
    ]
}

const generateBucketList = (): string[] => {
    return [
        'Skydiving over the Grand Canyon',
        'Visiting the Great Wall of China',
        'Learning to play the piano',
        'Swimming with dolphins',
        'Running a marathon',
        'Writing a book',
        'Opening a business',
        'Climbing Mount Everest',
        'Going on a safari in Africa',
        'Traveling to all seven continents',
        'Learning to speak five languages',
        'Seeing the Northern Lights',
        'Walking the Camino de Santiago',
        'Building a house',
        'Visiting the Taj Mahal',
        'Exploring the Great Barrier Reef',
        'Bungee jumping in New Zealand',
        'Cage diving with sharks',
        'Riding in a hot air balloon',
        'Hiking to Machu Picchu',
        'Going to a major World Cup final',
        'Skydiving in Dubai',
        'Going on a road trip across the USA',
        'Attending the Olympics',
        'Trekking in the Himalayas',
        'Taking a cooking class in Italy',
        'Living in a foreign country for a year',
        'Swimming in all five oceans',
        'Seeing the cherry blossoms in Japan',
        'Participating in a triathlon',
        "Exploring Iceland's hot springs",
        'Meeting the Pope',
        'Seeing the pyramids in Egypt',
        'Visiting all UNESCO World Heritage Sites',
        'Living off the grid for a month',
        'Going to space',
        'Running an ultra-marathon',
        'Visiting Antarctica',
        'Having dinner in the sky',
        'Writing and publishing a novel',
        'Going to a masquerade ball',
        'Buying my dream car',
        'Learning to surf',
        'Riding a motorcycle across a country',
        'Getting a tattoo',
        'Meeting my favorite celebrity',
        'Taking a year-long sabbatical',
        "Experiencing a New Year's Eve in Times Square",
        'Visiting the Galápagos Islands',
        'Making a documentary film',
        'Staying in a luxury resort',
        'Driving a Formula 1 car'
    ]
}

const generateClothingStyle = (): string[] => {
    return [
        'Casual',
        'Business Casual',
        'Formal',
        'Bohemian',
        'Streetwear',
        'Sporty',
        'Vintage',
        'Preppy',
        'Edgy',
        'Athleisure',
        'Classic',
        'Chic',
        'Minimalist',
        'Maximalist',
        'Goth',
        'Punk',
        'Artsy',
        'Retro',
        'Eco-friendly',
        'Eco-Chic',
        'Skater',
        'Hipster',
        'Grunge',
        'Boho-chic',
        'Athletic',
        'Urban',
        'Smart Casual',
        'Western',
        'Romantic',
        'Playful',
        'Professional',
        'Feminine',
        'Androgynous',
        'Sustainable',
        'Luxury',
        'Street style',
        'Casual chic',
        'Office casual',
        'Festival style',
        'Jungle print',
        'Tropical',
        'Monochrome',
        'Preppy chic',
        'French chic',
        'Boho luxe',
        'Glam',
        'Tomboy',
        'Casual luxe',
        'Mod',
        'Funky',
        'Smart formal',
        'Rocker chic',
        'Sporty chic',
        'Hollywood glam'
    ]
}

const generateVolunteerWork = (): string[] => {
    return [
        'Soup Kitchen Volunteer',
        'Animal Shelter Worker',
        'Environmental Clean-Up Organizer',
        'Mentor for At-Risk Youth',
        'Fundraiser for Cancer Research',
        'Blood Drive Coordinator',
        'Habitat for Humanity Volunteer',
        'Nursing Home Volunteer',
        'Teaching English as a Second Language',
        'Disaster Relief Worker',
        'Homeless Shelter Coordinator',
        'Beach Clean-Up Organizer',
        'Food Pantry Volunteer',
        'Volunteering at Animal Rescue',
        'Tutor for Underprivileged Children',
        'Fundraiser for Homelessness',
        "Volunteer for Women's Shelter",
        'Event Planner for Charity Auctions',
        'Park Restoration Volunteer',
        'Volunteer for Special Olympics',
        'Mentor for Juvenile Offenders',
        'Disability Awareness Campaigner',
        'Health and Wellness Coach for Seniors',
        'Youth Sports Coach',
        'Volunteer at Refugee Centers',
        'Donation Drive Organizer',
        'Caregiver for the Elderly',
        'Working with At-Risk Teens',
        'Community Outreach Coordinator',
        'Volunteering with Veterans',
        'Environmental Activist',
        'Sustainable Agriculture Advocate',
        'Clean Water Project Volunteer',
        'Crisis Hotline Volunteer',
        'Volunteer for Refugee Relief Efforts',
        'Foster Animal Caregiver',
        'Volunteer at Homeless Shelters',
        'Tree Planting Campaign Volunteer',
        'Cultural Exchange Program Volunteer',
        'Volunteer for the Disabled',
        'Health Education Volunteer',
        'Volunteer for Disaster Preparedness',
        'Digital Literacy Teacher',
        'Veteran Support Volunteer',
        'Animal Welfare Advocate',
        'Cultural Heritage Preservation Volunteer',
        'Volunteer for Refugee Integration',
        'Teacher for Rural Areas',
        'Global Education Advocate',
        'Disaster Recovery Volunteer'
    ]
}

const generateFinancialGoals = (): string[] => {
    return [
        'Pay off student loans',
        'Save for a house down payment',
        'Build a retirement fund',
        'Start a business',
        'Invest in stocks',
        "Save for a child's education",
        'Buy a vacation home',
        'Pay off credit card debt',
        'Create an emergency savings fund',
        'Build a college fund for my children',
        'Save for a dream wedding',
        'Establish a trust fund',
        'Save for early retirement',
        'Create a financial freedom plan',
        'Purchase an investment property',
        'Start an investment portfolio',
        'Pay off car loan',
        'Increase passive income',
        'Build an inheritance for my family',
        'Create a debt payoff strategy',
        'Save for a family reunion',
        'Start a charitable foundation',
        'Create a budget plan',
        'Set up a college fund for my grandchildren',
        'Invest in cryptocurrency',
        'Invest in real estate',
        'Save for travel',
        'Establish financial independence',
        'Achieve net worth goal',
        'Reduce monthly expenses',
        'Save for emergency medical expenses',
        'Increase income streams',
        'Pay off mortgage early',
        'Create a wealth-building strategy',
        'Achieve financial peace of mind',
        'Save for business expansion',
        'Pay off student loans early',
        'Start a retirement savings plan',
        'Create financial security for family',
        'Maximize tax savings',
        'Buy a rental property',
        'Build a large emergency fund',
        'Reach financial independence at 40',
        'Achieve financial freedom by age 50',
        'Create a legacy fund',
        'Grow a business to sell',
        'Invest in a new startup',
        'Increase savings for a comfortable retirement',
        'Pay off all debts',
        'Fund a personal venture'
    ]
}

const generateCharityContributions = (): string[] => {
    return [
        'Donate to Red Cross',
        'Monthly contributions to local food banks',
        'Charity run for breast cancer research',
        'Volunteer at homeless shelters',
        'Fundraise for animal rights organizations',
        'Donate to environmental causes',
        "Support children's education initiatives",
        'Give to global hunger relief organizations',
        'Sponsor a child in need',
        'Contribute to disaster relief funds',
        'Sponsor a medical research initiative',
        'Donate blood regularly',
        'Fundraise for mental health awareness',
        "Support veterans' organizations",
        'Donate to homeless shelters',
        'Give to animal shelters',
        "Support women's empowerment programs",
        'Fund scholarships for underprivileged students',
        'Donate to wildlife conservation',
        'Contribute to global refugee aid',
        'Support arts education programs',
        'Fund sustainable farming initiatives',
        'Support local community outreach programs',
        'Give to literacy programs',
        'Contribute to medical aid in developing countries',
        'Donate to disaster relief organizations',
        'Support local sports teams',
        'Sponsor environmental clean-up projects',
        'Support refugee resettlement organizations',
        'Give to global education charities',
        'Donate to mental health foundations',
        "Contribute to homeless veterans' programs",
        'Fund animal rescue missions',
        'Give to cancer research',
        'Contribute to natural disaster recovery efforts',
        'Support youth mentorship programs',
        'Fund healthcare initiatives in impoverished areas',
        'Support clean water projects',
        'Donate to local shelters for women',
        'Sponsor a family in need',
        'Give to underprivileged schools',
        'Support organizations that fight poverty',
        'Fund community development projects',
        'Donate to anti-human trafficking initiatives',
        'Contribute to COVID-19 relief efforts',
        'Give to local churches or synagogues',
        'Support foster care programs',
        'Contribute to reproductive health initiatives',
        'Sponsor a local charity event',
        'Fundraise for childhood education',
        'Donate to disaster preparedness initiatives'
    ]
}
const generatePersonalityTraits = (): string[] => {
    return [
        'Optimistic',
        'Creative',
        'Introverted',
        'Empathetic',
        'Analytical',
        'Adventurous',
        'Detail-Oriented',
        'Ambitious',
        'Spontaneous',
        'Courageous',
        'Patient',
        'Generous',
        'Curious',
        'Supportive',
        'Confident',
        'Independent',
        'Motivated',
        'Reliable',
        'Hardworking',
        'Respectful',
        'Responsible',
        'Loyal',
        'Energetic',
        'Honest',
        'Friendly',
        'Open-Minded',
        'Persistent',
        'Sensitive',
        'Humble',
        'Sociable',
        'Thoughtful',
        'Tolerant',
        'Enthusiastic',
        'Resourceful',
        'Creative Thinker',
        'Organized',
        'Trustworthy',
        'Compassionate',
        'Hardworking',
        'Non-judgmental',
        'Flexible',
        'Grounded',
        'Driven',
        'Compromising',
        'Punctual',
        'Witty',
        'Reliable',
        'Considerate',
        'Perceptive',
        'Visionary',
        'Pragmatic',
        'Strategic',
        'Optimistic Realist'
    ]
}

const generateFavoriteTechnologies = (): string[] => {
    return [
        'Artificial Intelligence',
        'Blockchain',
        'Quantum Computing',
        'Augmented Reality',
        'Virtual Reality',
        '5G',
        'IoT',
        'Robotic Process Automation',
        'Cloud Computing',
        'Machine Learning',
        'Edge Computing',
        'Autonomous Vehicles',
        'Wearable Tech',
        'Cybersecurity',
        'Biometric Authentication',
        'Natural Language Processing',
        'Digital Twins',
        'Neural Networks',
        '3D Printing',
        'Smart Cities',
        'Drones',
        'Voice Assistants',
        'Smart Homes',
        'Self-Healing Networks',
        'Cryptocurrency',
        'Big Data',
        'Chatbots',
        'Telemedicine',
        'Nanotechnology',
        'Data Analytics',
        'Electric Vehicles',
        'Wearable Health Tech',
        'Smart Grids',
        'Blockchain for Supply Chain',
        'Virtual Reality Gaming',
        'Augmented Reality in Retail',
        'Cloud Storage Solutions',
        'AI in Healthcare',
        'Voice Recognition Systems',
        'Augmented Reality in Education',
        'Mobile Apps Development',
        'Digital Payment Systems',
        'Smart Glasses',
        'Quantum Cryptography',
        'AI in Cybersecurity',
        'Personalized Medicine',
        'Data Mining',
        'Blockchain for Voting',
        'Robotics in Manufacturing',
        'Smart Farming',
        'Predictive Analytics',
        '5G in Healthcare',
        'AI in Retail'
    ]
}

// Helper function for Social Security generation
const generateSocialSecurity = (): string[] => {
    const ssnList = [
        '123-45-6789',
        '987-65-4321',
        '456-78-9012',
        '321-45-6789',
        '654-32-1098',
        '987-12-3456',
        '876-54-3210',
        '234-56-7890',
        '345-67-8901',
        '987-34-5678'
    ]
    return ssnList
}

// Helper function for generating Medical History
const generateMedicalHistory = (): string[] => {
    return [
        'No issues',
        'Asthma',
        'Diabetes',
        'Hypertension',
        'No history',
        'Heart Disease',
        'Chronic Pain',
        'Allergies',
        'Arthritis',
        'Depression',
        'Anxiety',
        'Cancer Survivor',
        'Epilepsy',
        'Migraine',
        'Stroke',
        'Kidney Disease',
        'Lung Disease',
        'Gastrointestinal Issues',
        'Blood Pressure Issues',
        'Thyroid Disorders',
        'Obesity',
        'Mental Health Conditions',
        'Celiac Disease',
        'Multiple Sclerosis',
        'Fibromyalgia',
        'Osteoporosis',
        'Autoimmune Disorders'
    ]
}

// Gender Generator
const generateGender = (): string[] => {
    return ['Male', 'Female', 'Non-Binary', 'Transgender', 'Genderfluid', 'Other']
}

// Nationality Generator
const generateNationality = (): string[] => {
    return [
        'USA',
        'Canada',
        'UK',
        'Germany',
        'Australia',
        'India',
        'China',
        'Japan',
        'Brazil',
        'France',
        'South Korea',
        'Mexico',
        'Italy',
        'Spain',
        'Russia',
        'Netherlands',
        'Sweden',
        'Switzerland',
        'Belgium',
        'Norway',
        'Greece',
        'Denmark',
        'Finland',
        'South Africa',
        'New Zealand'
    ]
}

// Marital Status Generator
const generateMaritalStatus = (): string[] => {
    return ['Single', 'Married', 'Divorced', 'Widowed', 'Engaged', 'Separated']
}

// Insurance Information Generator
const generateInsuranceInformation = (): string[] => {
    return ['Plan A', 'Plan B', 'Plan C', 'Plan D', 'Plan E', 'Bronze Plan', 'Silver Plan', 'Gold Plan', 'Platinum Plan', 'Employee Plan']
}

// Employee Status Generator
const generateEmployeeStatus = (): string[] => {
    return ['Active', 'Terminated', 'On Leave', 'Retired', 'Contract', 'Intern', 'Freelance', 'Temporary']
}

const generateSize = (): string[] => {
    return [
        'Child',
        'Small',
        'Medium',
        'Large',
        'XL',
        'XXL',
        'XXXL',
        'Petite',
        'Tall',
        'Short',
        'Athletic',
        'Curvy',
        'Muscular',
        'Slim',
        'Plus-Size',
        'Maternity',
        'Oversized',
        'Loose Fit',
        'Tight Fit',
        'Athleisure',
        'Husky',
        'Trim',
        'Stocky',
        'Average Build'
    ]
}

const generateCompanySize = (): string[] => {
    return [
        'Small',
        'Medium',
        'Large',
        'Enterprise',
        'Start-Up',
        'Global',
        'Solo Entrepreneur',
        'Family-Owned',
        'Freelancer',
        'Non-Profit',
        'Government Agency',
        'Public Sector',
        'Private Sector',
        'Corporation',
        'Multinational',
        'Publicly Traded',
        'Privately Held',
        'Tech Start-Up',
        'Service-Based',
        'Product-Based',
        'B2B',
        'B2C',
        'E-Commerce',
        'Research & Development',
        'Global Conglomerate',
        'Franchise',
        'Virtual Company',
        'Consultancy',
        'International',
        'Local',
        'Regional'
    ]
}

// Revenue Generator
const generateRevenue = (): string[] => {
    return ['$10M', '$50M', '$200M', '$500M', '$1B', '$5B', '$10B', '$50B', '$100B', '$500B']
}

const generateLanguage = (): string[] => {
    return [
        'English',
        'Spanish',
        'French',
        'German',
        'Chinese',
        'Russian',
        'Arabic',
        'Portuguese',
        'Japanese',
        'Italian',
        'Korean',
        'Hindi',
        'Bengali',
        'Turkish',
        'Vietnamese',
        'Polish',
        'Dutch',
        'Greek',
        'Swedish',
        'Thai',
        'Czech',
        'Finnish',
        'Danish',
        'Romanian',
        'Hebrew',
        'Norwegian',
        'Hungarian',
        'Malay',
        'Punjabi',
        'Tamil',
        'Telugu',
        'Gujarati',
        'Marathi',
        'Urdu',
        'Indonesian',
        'Ukrainian',
        'Swahili',
        'Zulu',
        'Lithuanian',
        'Latvian',
        'Estonian',
        'Bulgarian',
        'Serbian',
        'Croatian',
        'Slovak',
        'Slovenian',
        'Albanian',
        'Georgian',
        'Basque',
        'Catalan',
        'Galician',
        'Yiddish',
        'Wolof',
        'Afrikaans',
        'Burmese',
        'Khmer',
        'Nepali',
        'Mongolian',
        'Kazakh',
        'Tagalog',
        'Finnish',
        'Icelandic',
        'Maltese',
        'Haitian Creole',
        'Maori',
        'Samoan'
    ]
}

// Religion Generator
const generateReligion = (): string[] => {
    return ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Atheist', 'Agnostic', 'Judaism', 'Sikhism', 'Taoism', 'Confucianism', 'Shintoism']
}

// Spiritual Practices Generator
const generateSpiritualPractices = (): string[] => {
    return [
        'Meditation',
        'Yoga',
        'Prayer',
        'Spiritual Reading',
        'Mindfulness',
        'Fasting',
        'Pilgrimage',
        'Journaling',
        'Mantras',
        'Chanting',
        'Visualization',
        'Breathing Exercises',
        'Tai Chi',
        'Energy Healing',
        'Aromatherapy'
    ]
}

const generateNameTypes = (): string[] => {
    return [
        'Myers',
        'Johnson',
        'Smith',
        'Davis',
        'Wilson',
        'Taylor',
        'Brown',
        'Miller',
        'Anderson',
        'Thomas',
        'Jackson',
        'White',
        'Harris',
        'Martin',
        'Thompson',
        'Garcia',
        'Martinez',
        'Rodriguez',
        'Lee',
        'Gonzalez',
        'Perez',
        'Clark',
        'Lewis',
        'Young',
        'Scott',
        'Adams',
        'Baker',
        'Nelson',
        'Hill',
        'Carter',
        'Mitchell',
        'Roberts',
        'Walker',
        'Allen',
        'King',
        'Wright',
        'Scott',
        'Green',
        'Evans',
        'Turner',
        'Collins',
        'Reed',
        'Cameron',
        'Morgan',
        'Parker',
        'Cooper',
        'Murphy',
        'Bailey',
        'Rivera',
        'Grant',
        'Kingston',
        'Richards',
        'Simmons'
    ]
}

const generateNameShortened = (): string[] => {
    return [
        'JD',
        'Cass',
        'Rae',
        'MaxX',
        'Alex123',
        'Mikey99',
        'LolaBee',
        'ChrisTheGreat',
        'MisterX',
        'QueenB',
        'ShayShay',
        'LilBoi',
        'Rockstar22',
        'TheGameMaster',
        'AceOfSpades',
        'JessieC',
        'LuckyLuke',
        'StormRider',
        'MrFancyPants',
        'CocoaMango',
        'XxTheKingxX',
        'Sk8rGrl',
        'TechGuru',
        'LilDragon',
        'SpeedyB',
        'CaptainPanda',
        'CryptoGuy',
        'NinjaMaster',
        'RacerX',
        'RedDragon',
        'DarkKnight',
        'GlitchLord',
        'KingSlayer',
        'FunkyMonkey',
        'CyberWarrior',
        'StarQueen',
        'SilentShadow',
        'SpaceCadet',
        'PixelBuster',
        'VortexMaster',
        'ShadowHunter',
        'ThunderBolt',
        'SuperSonic',
        'EpicGamer',
        'NeonWolf',
        'HyperDrive',
        'PikachuFan'
    ]
}

const generateNicknames = (): string[] => {
    return [
        'Cassie',
        'JDizzle',
        'Roxy',
        'BigMike',
        'LilJ',
        'MisterCool',
        'MaddieBear',
        'SunnyD',
        'LilPump',
        'NikkiSparks',
        'QueenK',
        'Bubbles',
        'TinyTim',
        'G-Man',
        'Ace',
        'FireFly',
        'DaisyMay',
        'LilRae',
        'NinjaBabe',
        'SlimShady',
        'BossLady',
        'Smiley',
        'Gigi',
        'Spice',
        'Peanut',
        'Skipper',
        'Chico',
        'Rocky',
        'Princess',
        'HoneyB',
        'TurboTom',
        'SugarPlum',
        'Coco',
        'JazzMan',
        'BlueJay',
        'SpeedyGonzales',
        'Maxie',
        'LolaLicious',
        'MightyMia',
        'LittleFoot',
        'LilMissSunshine',
        'Foxy',
        'BigRed',
        'Acey',
        'JellyBean',
        'LilG',
        'Viper',
        'Jewel',
        'Gizmo',
        'Ziggy',
        'TazMan',
        'TinkerBell'
    ]
}

const generateCouponCodes = (count: number): string[] => {
    const couponCodes: string[] = []

    const words = [
        'SAVE',
        'DISCOUNT',
        'FLASH',
        'OFFER',
        'DEAL',
        'PROMO',
        'WIN',
        'GIFT',
        'SUMMER',
        'SPECIAL',
        'BEST',
        'BIG',
        'LUCKY',
        'SUPER',
        'HOT',
        'FESTIVE',
        'EXTRA',
        'HAPPY',
        'VIP'
    ]

    const getRandomWord = (): string => {
        return words[Math.floor(Math.random() * words.length)]
    }

    const getRandomNumber = (): string => {
        return (Math.floor(Math.random() * 100) + 1).toString() // number between 1 and 100
    }

    const getRandomSuffix = (): string => {
        // Generate a small suffix like '10', 'ALE', etc.
        const suffixes = ['10', '15', '20', 'ALE', 'WIN', 'SALE', 'VIP']
        return suffixes[Math.floor(Math.random() * suffixes.length)]
    }

    for (let i = 0; i < count; i++) {
        const word = getRandomWord() // e.g., SAVE, FLASH
        const number = getRandomNumber() // e.g., 10, 20
        const suffix = getRandomSuffix() // e.g., SALE, VIP

        const couponCode = `${word}${number}${suffix}`
        couponCodes.push(couponCode)
    }

    return couponCodes
}

const generateHexCodes = (count: number): string[] => {
    const hexCodes: string[] = []

    for (let i = 0; i < count; i++) {
        const hexCode = `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')}`
        hexCodes.push(hexCode)
    }

    return hexCodes
}

const generateRgbColors = (count: number): string[] => {
    const rgbColors: string[] = []

    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * 256)
        const g = Math.floor(Math.random() * 256)
        const b = Math.floor(Math.random() * 256)
        const rgb = `rgb(${r}, ${g}, ${b})`
        rgbColors.push(rgb)
    }

    return rgbColors
}

const generateBackgroundJobNames = (count: number): string[] => {
    const jobNames: string[] = []

    const jobs = [
        'icmp',
        'http-request',
        'disk-check',
        'db-backup',
        'file-cleanup',
        'email-notification',
        'cpu-monitor',
        'memory-check',
        'data-sync',
        'service-health',
        'log-rotation',
        'cache-clear',
        'backup-restore',
        'data-import',
        'data-export',
        'job-scheduler',
        'user-sync',
        'security-scan',
        'system-update',
        'audit-log',
        'session-expiry',
        'error-notification',
        'network-traffic',
        'file-transfer',
        'database-cleanup',
        'email-validation',
        'cron-jobs',
        'data-archive',
        'service-restart',
        'password-reset',
        'multi-factor-auth',
        'user-provisioning',
        'ssl-renewal',
        'api-rate-limiting',
        'payment-processing',
        'order-processing',
        'invoice-generation',
        'site-backup',
        'resource-scaling',
        'dependency-check',
        'container-deploy',
        'log-monitoring',
        'user-notification',
        'notification-cleanup',
        'api-health-check',
        'cloud-sync',
        'memory-dump',
        'task-queue',
        'content-indexing',
        'site-health-check',
        'backup-verification',
        'disk-space-monitor',
        'data-encryption',
        'user-deactivation',
        'data-compression',
        'data-decompression',
        'service-availability',
        'network-diagnostics',
        'service-migration',
        'vpn-connection',
        'log-analysis'
    ]

    // Randomly select job names from the list until the requested count is met
    for (let i = 0; i < count; i++) {
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)]
        jobNames.push(randomJob)
    }

    return jobNames
}

type StatusCategory = Record<string, string[]>

const statusCategories: StatusCategory = {
    sale: ['pending', 'approved', 'rejected', 'shipped', 'delivered', 'returned', 'paid', 'unpaid', 'waiting', 'canceled', 'expired'],
    task: ['complete', 'incomplete', 'pending', 'processing', 'queued', 'failed', 'success', 'on_hold', 'in_progress', 'retrying', 'blocked'],
    review: ['under_review', 'pending_review', 'in_review', 'approved', 'rejected', 'completed', 'resolved', 'resolved_with_issues'],
    shipment: ['shipped', 'delivered', 'returned', 'delayed', 'lost', 'in_transit', 'pending_shipment'],
    system: ['error', 'critical', 'warning', 'info', 'not_found', 'processing_error']
}

const generateStatus = (category: string): string[] => {
    if (!statusCategories[category]) {
        throw new Error(`Category '${category}' not found in status categories.`)
    }

    return statusCategories[category]
}

const generateAttributeMap = (): AttributeMap => {
    const attributeMap = new Map<string, string[]>()

    const saleStatus = generateStatus('sale')
    {
        const items = ['sale status', 'listing status']
        for (const e of items) {
            attributeMap.set(e, saleStatus)
        }
    }
    const taskStatus = generateStatus('task')
    {
        const items = ['status', 'task status', 'project status', 'goal status']
        for (const e of items) {
            attributeMap.set(e, taskStatus)
        }
    }
    const reviewStatus = generateStatus('review')
    {
        const items = ['review status', 'stage']
        for (const e of items) {
            attributeMap.set(e, reviewStatus)
        }
    }
    const shipmentStatus = generateStatus('shipment')
    {
        const items = ['shipment status', 'item status', 'product status']
        for (const e of items) {
            attributeMap.set(e, shipmentStatus)
        }
    }
    const systemStatus = generateStatus('system')
    {
        const items = ['system status']
        for (const e of items) {
            attributeMap.set(e, systemStatus)
        }
    }

    const positions = generatePositions()
    {
        const items = ['work job', 'work title', 'job title', 'job role', 'position']

        for (const e of items) {
            attributeMap.set(e, positions)
        }
    }

    const backgroundJobs = generateBackgroundJobNames(5)
    {
        const items = ['job', 'task', 'backgorund job', 'computer task', 'background task']

        for (const e of items) {
            attributeMap.set(e, backgroundJobs)
        }
    }

    const domains = generateDomains(50)
    {
        const items = ['domain', 'website', 'site']

        for (const e of items) {
            attributeMap.set(e, domains)
        }
    }

    const rgbColors = generateRgbColors(50)
    {
        const items = ['rbg', 'rbg color', 'rbg code']

        for (const e of items) {
            attributeMap.set(e, rgbColors)
        }
    }

    const hexCodes = generateHexCodes(50)
    {
        const items = ['color', 'hex', 'hex color', 'hex code']

        for (const e of items) {
            attributeMap.set(e, hexCodes)
        }
    }

    const couponCodes = generateCouponCodes(50)

    {
        const items = [
            'primary coupon',
            'secondary coupon',
            'local coupon',
            'public coupon',
            'static coupon',
            'dynamic coupon',
            'gateway coupon',
            'subnet coupon',
            'server coupon',
            'vpn coupon',
            'host coupon',
            'network coupon',
            'client coupon'
        ]

        for (const e of items) {
            attributeMap.set(e, couponCodes)
        }
    }

    const userStatus = generateUserStatus()

    const firstNames = generateFirstNames()
    {
        const items = ['first name', 'legal name', 'birth name', 'given name', 'preferred name']
        for (const e of items) {
            attributeMap.set(e, firstNames)
        }
        for (const s of userStatus) {
            for (const e of items) {
                attributeMap.set(`${s} ${e}`, firstNames)
            }
            attributeMap.set(`${s}`, firstNames)
        }
    }

    const lastNames = generateLastNames()
    {
        const items = ['surname', 'last name']
        for (const e of items) {
            attributeMap.set(e, lastNames)
        }
    }

    const nameTypes = generateNameTypes()
    {
        const items = ['middle name', 'family name', 'maiden name']
        for (const e of items) {
            attributeMap.set(e, nameTypes)
        }
    }
    const nameShortened = generateNameShortened()
    {
        const items = [
            'shortened name',
            'display name',
            'screen name',
            'username',
            'user handle',
            'gamertag',
            'game name',
            'online username',
            'profile name',
            'account name',
            'login name',
            'ID name',
            'digital name'
        ]
        for (const e of items) {
            attributeMap.set(e, nameShortened)
        }
    }
    const nicknames = generateNicknames()
    {
        const items = [
            'nickname',
            'informal name',
            'social media handle',
            'alias',
            'stage name',
            'pen name',
            'user alias',
            'handle',
            'call sign',
            'online alias',
            'chat name',
            'persona name',
            'code name'
        ]
        for (const e of items) {
            attributeMap.set(e, nicknames)
        }
    }
    const biography = generateBiography()
    {
        const items = ['bio', 'biography', 'profile description']
        for (const e of items) {
            attributeMap.set(e, biography)
        }
    }

    const emails = generateEmailAddresses(firstNames, lastNames, generateCompanyNames())
    attributeMap.set('Email', emails)

    const models = generateModelNumbers(50)
    const serials = generateSerialNumbers(50)

    {
        const items = [
            'primary model',
            'secondary model',
            'local model',
            'public model',
            'static model',
            'dynamic model',
            'gateway model',
            'subnet model',
            'server model',
            'vpn model',
            'host model',
            'network model',
            'client model'
        ]

        for (const e of items) {
            attributeMap.set(e, models)
        }
    }

    {
        const items = [
            'primary serial',
            'secondary serial',
            'local serial',
            'public serial',
            'static serial',
            'dynamic serial',
            'gateway serial',
            'subnet serial',
            'server serial',
            'vpn serial',
            'host serial',
            'network serial',
            'client serial'
        ]

        for (const e of items) {
            attributeMap.set(e, serials)
        }
    }

    attributeMap.set(
        'Emergency Contact',
        generateFirstNames().map(fn => `${fn} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`)
    )

    attributeMap.set('Social Security', generateSocialSecurity())
    attributeMap.set('Medical History', generateMedicalHistory())

    attributeMap.set('Address', generateAddresses(50))

    attributeMap.set('Department', generateDepartments())
    attributeMap.set(
        'Manager',
        firstNames.map(fn => `${fn} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`)
    )

    const macAddresses = generateMacAddresses(50)
    {
        const items = [
            'mac',
            'mac adress',
            'ethernet mac',
            'wifi mac',
            'bluetooth mac',
            'device mac',
            'gateway mac',
            'router mac',
            'server mac',
            'client mac',
            'local mac',
            'public mac',
            'access point mac',
            'primary mac',
            'secondary mac'
        ]
        for (const e of items) {
            attributeMap.set(e, macAddresses)
        }
    }
    const ipAddresses = generateIpAddresses(50)
    {
        const items = [
            'ip',
            'ip address',
            'primary ip',
            'secondary ip',
            'local ip',
            'public ip',
            'static ip',
            'dynamic ip',
            'gateway ip',
            'subnet ip',
            'server ip',
            'vpn ip',
            'host ip',
            'network ip',
            'client ip'
        ]
        for (const e of items) {
            attributeMap.set(e, ipAddresses)
        }
    }

    attributeMap.set('Company Location', generateAddresses(5))
    attributeMap.set('Book Description', generateBookDescription())
    attributeMap.set('Article Content', generateArticleContent())
    attributeMap.set('Product Description', generateProductDescriptions())
    attributeMap.set('Description', generateGenericDescriptions())
    attributeMap.set('Interests', generateInterests())
    attributeMap.set('Social Media', generateSocialMediaProfiles())
    attributeMap.set('Education', generateEducation())
    attributeMap.set('Personal Website', generateWebsiteURLs())
    attributeMap.set('Books', generateFavoriteBooks())
    attributeMap.set('Movies', generateFavoriteMovies())
    attributeMap.set('Music', generateMusicPreferences())
    attributeMap.set('Travel Destinations', generateTravelDestinations())
    attributeMap.set('Countries', generateCountries())
    attributeMap.set('Cities', generateCities())
    attributeMap.set('Skills & Certifications', generateSkillsCertifications())
    attributeMap.set('Quote', generateFavoriteQuotes())
    attributeMap.set('Pets', generatePets())
    attributeMap.set('Vehicle', generateVehicles())
    attributeMap.set('Makes', generateMakes())
    attributeMap.set('Models', generateModels())
    attributeMap.set('Years', generateYears())
    attributeMap.set('Food', generateFavoriteFoods())
    attributeMap.set('Bucket', generateBucketList())
    attributeMap.set('Clothing', generateClothingStyle())
    attributeMap.set('Volunteer Work', generateVolunteerWork())

    attributeMap.set('Goals', generateFinancialGoals())
    attributeMap.set('Charity Contributions', generateCharityContributions())
    attributeMap.set('Personality Traits', generatePersonalityTraits())
    attributeMap.set('Favorite Technologies', generateFavoriteTechnologies())

    attributeMap.set('Gender', generateGender())
    attributeMap.set('Nationality', generateNationality())
    attributeMap.set('Marital Status', generateMaritalStatus())
    attributeMap.set('Medical History', generateMedicalHistory())
    attributeMap.set('Insurance Information', generateInsuranceInformation())
    attributeMap.set('Employee Status', generateEmployeeStatus())
    attributeMap.set('Cloting Size', generateSize())
    attributeMap.set('Company Size', generateCompanySize())
    attributeMap.set('Revenue', generateRevenue())
    attributeMap.set('Language', generateLanguage())
    attributeMap.set('Religion', generateReligion())
    attributeMap.set('Spiritual Practices', generateSpiritualPractices())

    const companies = generateCompanyNames()
    const phoneNumbers = generatePhoneNumbers()
    const emailAddresses = generateEmailAddresses(firstNames, lastNames, companies)
    const addresses = generateAddresses(100)
    const socialMediaProfiles = generateSocialMediaProfiles()
    const websiteURLs = generateWebsiteURLs()
    const favoriteBooks = generateFavoriteBooks()
    const favoriteMovies = generateFavoriteMovies()
    const musicPreferences = generateMusicPreferences()
    const travelDestinations = generateTravelDestinations()
    const skillsCertifications = generateSkillsCertifications()
    const favoriteQuotes = generateFavoriteQuotes()
    const pets = generatePets()
    const vehicles = generateVehicles()
    const favoriteFoods = generateFavoriteFoods()
    const bucketList = generateBucketList()
    const clothingStyle = generateClothingStyle()
    const volunteerWork = generateVolunteerWork()
    const financialGoals = generateFinancialGoals()
    const charityContributions = generateCharityContributions()
    const personalityTraits = generatePersonalityTraits()
    const favoriteTechnologies = generateFavoriteTechnologies()

    {
        const items = ['phone number', 'contact number', 'cell phone', 'mobile number', 'work phone', 'home phone', 'office phone']
        for (const e of items) {
            attributeMap.set(e, phoneNumbers)
        }
    }

    {
        const items = ['email', 'email address', 'work email', 'personal email', 'contact email', 'company email']
        for (const e of items) {
            attributeMap.set(e, emailAddresses)
        }
    }

    {
        const items = ['address', 'residential address', 'mailing address', 'business address', 'home address', 'company address']
        for (const e of items) {
            attributeMap.set(e, addresses)
        }
    }

    {
        const items = ['social media profile', 'social media account', 'twitter handle', 'linkedin profile', 'instagram profile', 'facebook profile']
        for (const e of items) {
            attributeMap.set(e, socialMediaProfiles)
        }
    }

    {
        const items = ['website', 'portfolio website', 'personal website', 'blog', 'company website']
        for (const e of items) {
            attributeMap.set(e, websiteURLs)
        }
    }

    {
        const items = ['favorite books', 'books I like', 'most read books', 'top books']
        for (const e of items) {
            attributeMap.set(e, favoriteBooks)
        }
    }

    {
        const items = ['favorite movies', 'movies I like', 'most watched movies', 'top movies']
        for (const e of items) {
            attributeMap.set(e, favoriteMovies)
        }
    }

    {
        const items = ['music preferences', 'favorite genres', 'musical tastes', 'top music genres', 'favorite artists']
        for (const e of items) {
            attributeMap.set(e, musicPreferences)
        }
    }

    {
        const items = ['travel destinations', 'places to visit', 'top travel spots', 'dream destinations', 'favorite travel locations']
        for (const e of items) {
            attributeMap.set(e, travelDestinations)
        }
    }

    {
        const items = ['skills certifications', 'professional certifications', 'certified in', 'training certifications', 'qualification certifications']
        for (const e of items) {
            attributeMap.set(e, skillsCertifications)
        }
    }

    {
        const items = ['favorite quotes', 'inspirational quotes', 'motivational quotes', 'top quotes', 'life quotes']
        for (const e of items) {
            attributeMap.set(e, favoriteQuotes)
        }
    }

    {
        const items = ['pets', 'animals I own', 'favorite pets', 'pet types']
        for (const e of items) {
            attributeMap.set(e, pets)
        }
    }

    {
        const items = ['vehicles', 'cars I own', 'favorite vehicles', 'car models']
        for (const e of items) {
            attributeMap.set(e, vehicles)
        }
    }

    {
        const items = ['favorite foods', 'favorite meals', 'best foods', 'top dishes']
        for (const e of items) {
            attributeMap.set(e, favoriteFoods)
        }
    }

    {
        const items = ['bucket list', 'things to do', 'life goals', 'things I want to achieve']
        for (const e of items) {
            attributeMap.set(e, bucketList)
        }
    }

    {
        const items = ['clothing style', 'fashion style', 'favorite fashion', 'preferred clothing']
        for (const e of items) {
            attributeMap.set(e, clothingStyle)
        }
    }

    {
        const items = ['volunteer work', 'charity work', 'social work', 'causes I support']
        for (const e of items) {
            attributeMap.set(e, volunteerWork)
        }
    }

    {
        const items = ['financial goals', 'money goals', 'investment goals', 'financial aspirations']
        for (const e of items) {
            attributeMap.set(e, financialGoals)
        }
    }

    {
        const items = ['charity contributions', 'donations', 'support for causes', 'charity involvement']
        for (const e of items) {
            attributeMap.set(e, charityContributions)
        }
    }

    {
        const items = ['personality traits', 'personality', 'character traits', 'personal attributes']
        for (const e of items) {
            attributeMap.set(e, personalityTraits)
        }
    }

    {
        const items = ['favorite technologies', 'preferred technologies', 'tech interests', 'most used technologies']
        for (const e of items) {
            attributeMap.set(e, favoriteTechnologies)
        }
    }

    {
        const items = ['user status', 'relationship status', 'social role', 'professional role']
        for (const e of items) {
            attributeMap.set(e, userStatus)
        }
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
function getBestMatch(input: string): string | null {
    let bestMatch: string | null = null
    let highestScore = 0

    const [entity, attr] = input.split('.')

    for (const [key, _] of m) {
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

const m = generateAttributeMap()

// Main function to construct a sentence based on input string (PFN)
export function randAttrVarchar(PFN: string): string {
    const match = getBestMatch(PFN)
    if (!match) {
        return ``
    }

    const wordPool = m.get(match)

    if (!wordPool) {
        return ``
    }

    const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)]

    return randomWord
}
