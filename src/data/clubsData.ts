export interface VerifiedClub {
  id?: string;
  name: string;
  normalizedName: string;
  category: 'Cultural & Performing Arts' | 'Literary, Quizzing & Media' | 'Technical & Co-Curricular Chapters';
  description: string;
  type?: string;
  relatedChapters?: string[];
  source?: string;
  instagramUrl?: string;
  active?: boolean;
}

export const VERIFIED_MSRIT_CLUBS: VerifiedClub[] = [
  // CATEGORY 1 — Cultural & Performing Arts
  {
    name: 'Chiraranga',
    normalizedName: 'chiraranga',
    category: 'Cultural & Performing Arts',
    description: 'Kannada and regional theatre/cultural team.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/chirarangamsrit?stkn=MW9xcXlhb2Q2ZjQybw==',
    active: true
  },
  {
    name: 'Lasya',
    normalizedName: 'lasya',
    category: 'Cultural & Performing Arts',
    description: 'The classical/semi-classical dance club of MSRIT.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/lasya_msrit?stkn=MWVvMWhwbHk0cHZnaw==',
    active: true
  },
  {
    name: 'Prayaag',
    normalizedName: 'prayaag',
    category: 'Cultural & Performing Arts',
    description: 'Cultural and traditional arts club.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/prayaag_msrit?stkn=cjV0Z3dsaGVoNWpn',
    active: true
  },
  {
    name: 'TNT',
    normalizedName: 'tnt',
    category: 'Cultural & Performing Arts',
    description: 'A prominent dance crew focusing on energetic and diverse choreography.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/trination_troupe?stkn=eXdmNnZtb2sycmxh',
    active: true
  },
  {
    name: 'Theatrix',
    normalizedName: 'theatrix',
    category: 'Cultural & Performing Arts',
    description: 'The official dramatics/theatre club performing stage plays and street plays (nukkad natak).',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/theatrixmsrit?stkn=OTU0Mnk0aDR6bHpu',
    active: true
  },

  // CATEGORY 2 — Literary, Quizzing & Media
  {
    name: '19A',
    normalizedName: '19a',
    category: 'Literary, Quizzing & Media',
    description: 'Literary and creative writing club.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/19a.rit?stkn=MXhlYnRicHRkYnZldg==',
    active: true
  },
  {
    name: 'ClutchRIT',
    normalizedName: 'clutchrit',
    category: 'Literary, Quizzing & Media',
    description: 'Gaming and esports community.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/clutchrit.esports?stkn=MmUxMmRhYzQ3dWU3',
    active: true
  },
  {
    name: 'DEBSOC',
    normalizedName: 'debsoc',
    category: 'Literary, Quizzing & Media',
    description: 'Organizes parliamentary debates, discussions, and public speaking events.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/msrit.debsoc?stkn=MWg0Z3NwczMxY2JrZg==',
    active: true
  },
  {
    name: 'INARA',
    normalizedName: 'inara',
    category: 'Literary, Quizzing & Media',
    description: 'Fine arts and creative design club.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/msrit.inara?stkn=NnJpbHpveG0zeXJq',
    active: true
  },
  {
    name: 'Nakama RIT',
    normalizedName: 'nakama rit',
    category: 'Literary, Quizzing & Media',
    description: 'Anime and Japanese pop-culture club.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/nakama_rit?stkn=bzJuY3RkcnZmb2Fu',
    active: true
  },
  {
    name: 'Quiz Club',
    normalizedName: 'quiz club',
    category: 'Literary, Quizzing & Media',
    description: 'Hosts regular quizzes on tech, general knowledge, pop culture, and business.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/qcmsrit?stkn=NzZscjdsOHk4NzR0',
    active: true
  },
  {
    name: 'RITMUNSOC',
    normalizedName: 'ritmunsoc',
    category: 'Literary, Quizzing & Media',
    description: 'Model United Nations Society for debating global affairs.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/rit.munsoc?stkn=MW9uMTg2ODVmZGo4bA==',
    active: true
  },
  {
    name: 'Ramaiah Comedy Club',
    normalizedName: 'ramaiah comedy club',
    category: 'Literary, Quizzing & Media',
    description: 'Stand-up comedy and improv community.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/ramaiahcomedy.club?stkn=c3N0MzNkcWJoamZq',
    active: true
  },
  {
    name: 'STUDIO.RIT',
    normalizedName: 'studio.rit',
    category: 'Literary, Quizzing & Media',
    description: 'Media production, design, and cinematic arts club.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/studio.rit?stkn=Y3dlMjZwOG5sZnpw',
    active: true
  },
  {
    name: 'iClick',
    normalizedName: 'iclick',
    category: 'Literary, Quizzing & Media',
    description: 'The official photography and videography club capturing campus events.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/iclick_msrit?stkn=dDgzMHRxMGd0aWxr',
    active: true
  },

  // CATEGORY 3 — Technical & Co-Curricular Chapters
  {
    name: 'IEEE Student Branch (MSRIT)',
    normalizedName: 'ieee student branch (msrit)',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Includes specialized chapters like IEEE WIE (Women in Engineering), IEEE PES (Power & Energy Society), and IEEE EMBS (Engineering in Medicine and Biology Society).',
    type: 'CLUB',
    relatedChapters: [
      'IEEE WIE',
      'IEEE PES',
      'IEEE EMBS'
    ],
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/ieeeritb?stkn=M3NmYmE3a3l5Z2k4',
    active: true
  },
  {
    name: 'NSS MSRIT',
    normalizedName: 'nss msrit',
    category: 'Technical & Co-Curricular Chapters',
    description: 'National Service Scheme chapter organizing community outreach, social welfare, and campus blood donation drives.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/nssmsrit?stkn=Mnk1a3VzNG5jcnhq',
    active: true
  },
  {
    name: 'CodeRIT',
    normalizedName: 'coderit',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Official coding and software development club hosting competitive programming contests and technical workshops.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/code_rit?stkn=MXExOXdmd3RrZnRscg==',
    active: true
  },
  {
    name: 'SecureIT',
    normalizedName: 'secureit',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Cybersecurity, ethical hacking, CTF competitions, and information security student community.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/secur1t?stkn=MWV0MXl4ejJpNnl5',
    active: true
  },
  {
    name: 'AION RIT',
    normalizedName: 'aion rit',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Artificial intelligence, machine learning, deep learning, and data science student society.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/aion.rit?stkn=MWd5NXZsczN4N3d4OQ==',
    active: true
  },
  {
    name: 'Official Velocita Racing',
    normalizedName: 'official velocita racing',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Formula Student automotive engineering and formula racing vehicle design team.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    instagramUrl: 'https://www.instagram.com/officialvelocitaracing?stkn=c3FmNnFobmNybm1v',
    active: true
  },
  {
    name: 'AWS Club',
    normalizedName: 'aws club',
    category: 'Technical & Co-Curricular Chapters',
    description: 'Student cloud computing club focusing on Amazon Web Services architectures, cloud certifications, and hands-on workshops.',
    type: 'CLUB',
    source: 'Provided MSRIT club directory',
    active: true
  }
];

export const CLUB_CATEGORIES = [
  'Cultural & Performing Arts',
  'Literary, Quizzing & Media',
  'Technical & Co-Curricular Chapters'
] as const;
