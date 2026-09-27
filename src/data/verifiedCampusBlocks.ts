/**
 * VERIFIED CAMPUS BLOCKS — SINGLE SOURCE OF TRUTH
 * 
 * Exact 4-corner coordinates provided for Campus Pulse campus blocks.
 * Coordinate Format: Latitude, Longitude
 * 
 * Corner Nomenclature:
 * TL = Top Left
 * BL = Bottom Left
 * TR = Top Right
 * BR = Bottom Right
 * 
 * Polygon Ordering (Crucial: Prevents crossed geometry):
 * TL -> TR -> BR -> BL -> TL
 * 
 * CRD Block: Has no provided coordinates. Kept as a non-geographic reference.
 * No fake coordinates are invented.
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface CornerCoordinates {
  TL: LatLngPoint;
  BL: LatLngPoint;
  TR: LatLngPoint;
  BR: LatLngPoint;
}

export interface VerifiedCampusBlock {
  id: string;
  name: string; // Exact building label: LHC, DES, APEX, MULTIPURPOSE BLOCK, ESB, QUADRANGLE, ARCHITECTURE BLOCK, WORKSHOP BLOCK
  displayName: string;
  colorName: 'Yellow' | 'Orange' | 'Cyan' | 'Purple' | 'Red' | 'Green' | 'White' | 'Slate';
  fillColor: string;
  strokeColor: string;
  corners: CornerCoordinates;
  polygon: LatLngPoint[]; // TL -> TR -> BR -> BL -> TL
  center: LatLngPoint;
  departments: string[];
  libraries: string[];
  category: 'academic' | 'facility' | 'administrative' | 'outdoor' | 'workshop';
  baseOccupancy: number; // percentage (0-100)
  description: string;
}

export const VERIFIED_CAMPUS_BLOCKS: VerifiedCampusBlock[] = [
  // 1. LHC
  {
    id: 'lhc',
    name: 'LHC',
    displayName: 'Lecture Hall Complex (LHC)',
    colorName: 'Yellow',
    fillColor: '#EAB308',
    strokeColor: '#CA8A04',
    corners: {
      TL: { lat: 13.0315921, lng: 77.5646349 },
      BL: { lat: 13.0311870, lng: 77.5645847 },
      TR: { lat: 13.0315607, lng: 77.5651761 },
      BR: { lat: 13.0312014, lng: 77.5651057 }
    },
    polygon: [
      { lat: 13.0315921, lng: 77.5646349 }, // TL
      { lat: 13.0315607, lng: 77.5651761 }, // TR
      { lat: 13.0312014, lng: 77.5651057 }, // BR
      { lat: 13.0311870, lng: 77.5645847 }, // BL
      { lat: 13.0315921, lng: 77.5646349 }  // TL (close)
    ],
    center: {
      lat: (13.0315921 + 13.0315607 + 13.0312014 + 13.0311870) / 4,
      lng: (77.5646349 + 77.5651761 + 77.5651057 + 77.5645847) / 4
    },
    departments: ['CSE', 'ISE', 'ECE', 'ET', 'EI', 'ME (Medical Electronics)'],
    libraries: ['LHC Library'],
    category: 'academic',
    baseOccupancy: 68,
    description: 'Premier academic lecture hall facility hosting CSE, ISE, ECE, ET, EI, and Medical Electronics departments along with LHC Library.'
  },

  // 2. DES
  {
    id: 'des',
    name: 'DES',
    displayName: 'DES Block (Department of Electrical Sciences)',
    colorName: 'Orange',
    fillColor: '#F97316',
    strokeColor: '#EA580C',
    corners: {
      TL: { lat: 13.0310992, lng: 77.5645903 },
      BL: { lat: 13.0307562, lng: 77.5645417 },
      TR: { lat: 13.0310289, lng: 77.5651137 },
      BR: { lat: 13.0308264, lng: 77.5650748 }
    },
    polygon: [
      { lat: 13.0310992, lng: 77.5645903 }, // TL
      { lat: 13.0310289, lng: 77.5651137 }, // TR
      { lat: 13.0308264, lng: 77.5650748 }, // BR
      { lat: 13.0307562, lng: 77.5645417 }, // BL
      { lat: 13.0310992, lng: 77.5645903 }  // TL (close)
    ],
    center: {
      lat: (13.0310992 + 13.0310289 + 13.0308264 + 13.0307562) / 4,
      lng: (77.5645903 + 77.5651137 + 77.5650748 + 77.5645417) / 4
    },
    departments: [],
    libraries: [],
    category: 'academic',
    baseOccupancy: 54,
    description: 'Electrical sciences laboratory complex and lecture facilities.'
  },

  // 3. APEX
  {
    id: 'apex',
    name: 'APEX',
    displayName: 'Apex Academic Block',
    colorName: 'Cyan',
    fillColor: '#06B6D4',
    strokeColor: '#0891B2',
    corners: {
      TL: { lat: 13.0306252, lng: 77.5646058 },
      BL: { lat: 13.0301875, lng: 77.5645625 },
      TR: { lat: 13.0306690, lng: 77.5650601 },
      BR: { lat: 13.0301574, lng: 77.5650165 }
    },
    polygon: [
      { lat: 13.0306252, lng: 77.5646058 }, // TL
      { lat: 13.0306690, lng: 77.5650601 }, // TR
      { lat: 13.0301574, lng: 77.5650165 }, // BR
      { lat: 13.0301875, lng: 77.5645625 }, // BL
      { lat: 13.0306252, lng: 77.5646058 }  // TL (close)
    ],
    center: {
      lat: (13.0306252 + 13.0306690 + 13.0301574 + 13.0301875) / 4,
      lng: (77.5646058 + 77.5650601 + 77.5650165 + 77.5645625) / 4
    },
    departments: [],
    libraries: ['Apex Library'],
    category: 'academic',
    baseOccupancy: 42,
    description: 'Apex academic wing housing computing auditoriums, seminar halls, and Apex Library.'
  },

  // 4. MULTIPURPOSE BLOCK
  {
    id: 'multipurpose',
    name: 'MULTIPURPOSE BLOCK',
    displayName: 'Multipurpose Block',
    colorName: 'Purple',
    fillColor: '#A855F7',
    strokeColor: '#9333EA',
    corners: {
      TL: { lat: 13.0316509, lng: 77.5653692 },
      BL: { lat: 13.0313876, lng: 77.5653427 },
      TR: { lat: 13.0316231, lng: 77.5657360 },
      BR: { lat: 13.0313647, lng: 77.5657192 }
    },
    polygon: [
      { lat: 13.0316509, lng: 77.5653692 }, // TL
      { lat: 13.0316231, lng: 77.5657360 }, // TR
      { lat: 13.0313647, lng: 77.5657192 }, // BR
      { lat: 13.0313876, lng: 77.5653427 }, // BL
      { lat: 13.0316509, lng: 77.5653692 }  // TL (close)
    ],
    center: {
      lat: (13.0316509 + 13.0316231 + 13.0313647 + 13.0313876) / 4,
      lng: (77.5653692 + 77.5657360 + 77.5657192 + 77.5653427) / 4
    },
    departments: [],
    libraries: [],
    category: 'facility',
    baseOccupancy: 50,
    description: 'Central campus multipurpose hall for student activities, conferences, and exhibitions.'
  },

  // 5. ESB
  {
    id: 'esb',
    name: 'ESB',
    displayName: 'Engineering Sciences Block (ESB)',
    colorName: 'Red',
    fillColor: '#EF4444',
    strokeColor: '#DC2626',
    corners: {
      TL: { lat: 13.0306575, lng: 77.5651965 },
      BL: { lat: 13.0301679, lng: 77.5650658 },
      TR: { lat: 13.0305889, lng: 77.5658490 },
      BR: { lat: 13.0301179, lng: 77.5657420 }
    },
    polygon: [
      { lat: 13.0306575, lng: 77.5651965 }, // TL
      { lat: 13.0305889, lng: 77.5658490 }, // TR
      { lat: 13.0301179, lng: 77.5657420 }, // BR
      { lat: 13.0301679, lng: 77.5650658 }, // BL
      { lat: 13.0306575, lng: 77.5651965 }  // TL (close)
    ],
    center: {
      lat: (13.0306575 + 13.0305889 + 13.0301179 + 13.0301679) / 4,
      lng: (77.5651965 + 77.5658490 + 77.5657420 + 77.5650658) / 4
    },
    departments: ['CV', 'INDUSTRIAL', 'BIOTECH'],
    libraries: ['ESB Library'],
    category: 'academic',
    baseOccupancy: 76,
    description: 'Houses Civil Engineering (CV), Industrial Engineering, Biotechnology, and ESB Library.'
  },

  // 6. QUADRANGLE
  {
    id: 'quadrangle',
    name: 'QUADRANGLE',
    displayName: 'Campus Quadrangle',
    colorName: 'Green',
    fillColor: '#22C55E',
    strokeColor: '#16A34A',
    corners: {
      TL: { lat: 13.0312801, lng: 77.5652448 },
      BL: { lat: 13.0308908, lng: 77.5651751 },
      TR: { lat: 13.0312497, lng: 77.5656733 },
      BR: { lat: 13.0307915, lng: 77.5656810 }
    },
    polygon: [
      { lat: 13.0312801, lng: 77.5652448 }, // TL
      { lat: 13.0312497, lng: 77.5656733 }, // TR
      { lat: 13.0307915, lng: 77.5656810 }, // BR
      { lat: 13.0308908, lng: 77.5651751 }, // BL
      { lat: 13.0312801, lng: 77.5652448 }  // TL (close)
    ],
    center: {
      lat: (13.0312801 + 13.0312497 + 13.0307915 + 13.0308908) / 4,
      lng: (77.5652448 + 77.5656733 + 77.5656810 + 77.5651751) / 4
    },
    departments: [],
    libraries: [],
    category: 'outdoor',
    baseOccupancy: 35,
    description: 'Central open-air social plaza, campus garden, and student congregation space.'
  },

  // 7. ARCHITECTURE BLOCK
  {
    id: 'architecture',
    name: 'ARCHITECTURE BLOCK',
    displayName: 'School of Architecture Block',
    colorName: 'White',
    fillColor: '#FFFFFF',
    strokeColor: '#475569',
    corners: {
      TL: { lat: 13.0309799, lng: 77.5659331 },
      BL: { lat: 13.0301499, lng: 77.5658627 },
      TR: { lat: 13.0309489, lng: 77.5661665 },
      BR: { lat: 13.0301980, lng: 77.5660820 }
    },
    polygon: [
      { lat: 13.0309799, lng: 77.5659331 }, // TL
      { lat: 13.0309489, lng: 77.5661665 }, // TR
      { lat: 13.0301980, lng: 77.5660820 }, // BR
      { lat: 13.0301499, lng: 77.5658627 }, // BL
      { lat: 13.0309799, lng: 77.5659331 }  // TL (close)
    ],
    center: {
      lat: (13.0309799 + 13.0309489 + 13.0301980 + 13.0301499) / 4,
      lng: (77.5659331 + 77.5661665 + 77.5660820 + 77.5658627) / 4
    },
    departments: [],
    libraries: [],
    category: 'academic',
    baseOccupancy: 58,
    description: 'Department of Architecture studios, design exhibition spaces, and modeling labs.'
  },

  // 8. WORKSHOP BLOCK
  {
    id: 'workshop',
    name: 'WORKSHOP BLOCK',
    displayName: 'Engineering Workshop Block',
    colorName: 'Slate',
    fillColor: '#94A3B8',
    strokeColor: '#64748B',
    corners: {
      TL: { lat: 13.0312775, lng: 77.5659881 },
      BL: { lat: 13.0310962, lng: 77.5659680 },
      TR: { lat: 13.0313131, lng: 77.5662372 },
      BR: { lat: 13.0310730, lng: 77.5661621 }
    },
    polygon: [
      { lat: 13.0312775, lng: 77.5659881 }, // TL
      { lat: 13.0313131, lng: 77.5662372 }, // TR
      { lat: 13.0310730, lng: 77.5661621 }, // BR
      { lat: 13.0310962, lng: 77.5659680 }, // BL
      { lat: 13.0312775, lng: 77.5659881 }  // TL (close)
    ],
    center: {
      lat: (13.0312775 + 13.0313131 + 13.0310730 + 13.0310962) / 4,
      lng: (77.5659881 + 77.5662372 + 77.5661621 + 77.5659680) / 4
    },
    departments: [],
    libraries: [],
    category: 'workshop',
    baseOccupancy: 40,
    description: 'Heavy machinery, fabrication suites, thermal laboratories, and mechanical engineering workshops.'
  }
];

/**
 * Non-geographic reference for CRD:
 * No coordinates provided -> DO NOT invent coordinates.
 */
export const NON_GEOGRAPHIC_CRD_BLOCK = {
  id: 'crd',
  name: 'CRD',
  displayName: 'Center for Research & Development (CRD)',
  departments: ['CSE AIML', 'CSE CY'],
  hasGeographicCoordinates: false,
  description: 'CRD houses CSE AIML and CSE Cyber Security. Kept as a non-geographic building reference until verified corner coordinates are surveyed.'
};

/**
 * All 32 corners for calculating map bounds.
 */
export const ALL_VERIFIED_CORNER_COORDINATES: LatLngPoint[] = VERIFIED_CAMPUS_BLOCKS.flatMap((block) => [
  block.corners.TL,
  block.corners.TR,
  block.corners.BR,
  block.corners.BL
]);

/**
 * Official Campus Perimeter Survey Boundary Coordinates:
 * BL - 13°01'45.9"N 77°33'48.8"E (lat: 13.0294167, lng: 77.5635556)
 * TL - 13°01'57.8"N 77°33'50.8"E (lat: 13.0327222, lng: 77.5641111)
 * TR - 13°01'57.0"N 77°34'00.6"E (lat: 13.0325000, lng: 77.5668333)
 * BR - 13°01'45.5"N 77°34'00.5"E (lat: 13.0293056, lng: 77.5668056)
 */
export const CAMPUS_SURVEY_BOUNDARY = {
  BL: { lat: 13.0294167, lng: 77.5635556, raw: `13°01'45.9"N 77°33'48.8"E` },
  TL: { lat: 13.0327222, lng: 77.5641111, raw: `13°01'57.8"N 77°33'50.8"E` },
  TR: { lat: 13.0325000, lng: 77.5668333, raw: `13°01'57.0"N 77°34'00.6"E` },
  BR: { lat: 13.0293056, lng: 77.5668056, raw: `13°01'45.5"N 77°34'00.5"E` }
};

export const CAMPUS_PERIMETER_POLYGON: LatLngPoint[] = [
  { lat: 13.0327222, lng: 77.5641111 }, // TL
  { lat: 13.0325000, lng: 77.5668333 }, // TR
  { lat: 13.0293056, lng: 77.5668056 }, // BR
  { lat: 13.0294167, lng: 77.5635556 }, // BL
  { lat: 13.0327222, lng: 77.5641111 }  // TL (close loop)
];

export const CAMPUS_RESTRICTION_BOUNDS = {
  north: 13.0327222,
  south: 13.0293056,
  west: 77.5635556,
  east: 77.5668333
};

/**
 * Find verified block by building name or ID
 */
export function getVerifiedBlockByNameOrId(query: string): VerifiedCampusBlock | undefined {
  if (!query) return undefined;
  const q = query.trim().toUpperCase();
  return VERIFIED_CAMPUS_BLOCKS.find((b) =>
    b.id.toUpperCase() === q ||
    b.name.toUpperCase() === q ||
    b.displayName.toUpperCase().includes(q) ||
    b.libraries.some((lib) => lib.toUpperCase() === q || lib.toUpperCase().includes(q) || q.includes(lib.toUpperCase())) ||
    (b.id === 'esb' && q.includes('ESB')) ||
    (b.id === 'lhc' && q.includes('LHC')) ||
    (b.id === 'apex' && q.includes('APEX'))
  );
}

