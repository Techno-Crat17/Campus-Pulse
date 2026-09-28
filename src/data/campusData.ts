import msritFacultyData from './msritFaculty.json';
import msritLocationsData from './msritLocations.json';
import msritDepartmentsData from './msritDepartments.json';
import { LIBRARIES, calculateLibraryOccupancy } from './libraryData';

export interface MSRITFaculty {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string | null;
  office: string | null;
  location: string;
  expertise: string;
  profileUrl: string;
  sourceUrl: string;
}

export interface MSRITLocation {
  id: string;
  name: string;
  category: string;
  description: string;
  department: string;
  building: string;
  floor: string;
  room: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
}

export interface MSRITDepartment {
  id: string;
  code: string;
  name: string;
  hod: string;
  building: string;
  sourceUrl: string;
}

export const MSRIT_FACULTY_DATA: MSRITFaculty[] = msritFacultyData as MSRITFaculty[];
export const MSRIT_LOCATIONS_DATA: MSRITLocation[] = msritLocationsData as MSRITLocation[];
export const MSRIT_DEPARTMENTS_DATA: MSRITDepartment[] = msritDepartmentsData as MSRITDepartment[];

export interface Building {
  id: string;
  name: string;
  category: 'study' | 'lab' | 'faculty' | 'facility' | 'cafeteria' | 'sports';
  occupancy: number; // 0 - 100%
  status: 'AVAILABLE' | 'BUSY' | 'CROWDED' | 'ISSUE REPORTED';
  noiseLevel: 'Silent' | 'Quiet' | 'Moderate' | 'Loud';
  walkTimeMinutes: number;
  distanceMeters: number;
  floor: string;
  coordinates: { x: number; y: number }; // percentage position on stylized SVG map
  amenities: string[];
  description: string;
  rooms: {
    name: string;
    occupancy: number;
    capacity: number;
    status: 'AVAILABLE' | 'BUSY' | 'FULL' | 'CROWDED';
  }[];
  code?: string;
  roomNumber?: string;
  capacity?: number;
  carpetArea?: string;
  digitalSystems?: string;
  servers?: string;
  sections?: string;
  facilities?: string;
  exclusiveFor?: string;
  disciplines?: string;
  zone?: string;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  status: 'AVAILABLE' | 'IN CLASS' | 'IN MEETING' | 'OFF-CAMPUS';
  room: string;
  buildingId: string;
  availableUntil?: string;
  nextFreeTime?: string;
  officeHours: string;
  email: string;
  avatar: string;
  expertise: string;
}

export interface CampusIssue {
  id: string;
  title: string;
  type: 'Projector' | 'AC' | 'Wi-Fi' | 'Equipment' | 'Lighting' | 'Water Leakage' | 'Other';
  buildingId: string;
  locationDetails: string;
  description: string;
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'IN PROGRESS' | 'RESOLVED';
  reportedAt: string;
  upvotes: number;
  imageUrl?: string;
}

export interface LiveActivity {
  id: string;
  timestamp: string;
  type: 'occupancy' | 'faculty' | 'issue' | 'announcement';
  message: string;
  location?: string;
  level?: 'info' | 'warning' | 'success';
}

export const BUILDINGS_DATA: Building[] = [
  {
    id: 'esb_main_library',
    name: 'ESB Library',
    code: 'ESB-LIB',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[0]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 2,
    distanceMeters: 140,
    floor: '4th Level, ESB Block',
    capacity: 538,
    carpetArea: '791.84 Sq.m',
    digitalSystems: '60 TFT Workstations',
    servers: 'LMS, DSpace & E-Learning Servers',
    sections: 'Acquisition Section, Technical Section, Periodical Section',
    facilities: 'Textbooks, reference volumes, research terminals, and reading carrels',
    disciplines: '1st Year, Above 1st Year, Mainly Non-CSE (Civil, Mechanical, Chemical, Biotechnology, Core Engineering)',
    coordinates: { x: 25, y: 58 },
    amenities: ['60 TFT Monitor Systems', 'LMS, DSpace & E-Learning Servers', 'Quiet Study Carrels', 'IS Standards Collection', 'High-Speed Wi-Fi', 'Power Outlets'],
    description: 'Engineering Sciences Block library housing comprehensive reference collections, research journals, and reading carrels for 1st Year and upper-level students across non-CSE disciplines.',
    rooms: [
      { name: 'Non-CSE Reference Hall', occupancy: 120, capacity: 250, status: 'AVAILABLE' },
      { name: 'Digital Commons & LMS Server Zone', occupancy: 35, capacity: 60, status: 'AVAILABLE' },
      { name: 'Bound Journals & Periodical Section', occupancy: 98, capacity: 228, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'lhc_unit_2_library',
    name: 'LHC Library',
    code: 'LHC-306',
    roomNumber: 'LHC-306',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[1]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 3,
    distanceMeters: 210,
    floor: '1st Floor (Room LHC-306), LHC Block',
    capacity: 538,
    carpetArea: '495.83 Sq.m',
    digitalSystems: '61 Workstations',
    facilities: 'CSE textbooks, IEEE research access, Subhashini Language Lab, technical journals',
    disciplines: 'CSE, Electronics, Information Science, AI & ML, Cybersecurity, ECE, EEE',
    coordinates: { x: 45, y: 35 },
    amenities: ['61 Digital Workstations', 'MSRIT Book Bank', 'Subhashini English Language Lab', 'IEEE Journals Archive', 'High-Speed Wi-Fi', 'Power Outlets'],
    description: 'Lecture Hall Complex Central Library located on 1st Floor (Room LHC-306), specialized for Computer Science and Electronics engineering students.',
    rooms: [
      { name: 'CSE & Electronics Reading Hall (LHC-306)', occupancy: 130, capacity: 300, status: 'AVAILABLE' },
      { name: 'Digital Library & Workstations (61 Systems)', occupancy: 28, capacity: 61, status: 'AVAILABLE' },
      { name: 'Book Bank & Core Computing Reference', occupancy: 52, capacity: 177, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'apex_unit_3_library',
    name: 'Apex Library',
    code: 'APEX-LIB',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[2]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 4,
    distanceMeters: 280,
    floor: '5th Level, Apex Block',
    capacity: 64,
    exclusiveFor: 'Exclusive for 1st Year UG courses',
    carpetArea: '200.94 Sq.m',
    digitalSystems: '02 Workstations',
    facilities: '1st Year textbooks, foundational science reference holdings, quiet study cubicles',
    disciplines: '1st Year, Mathematics, Physics, Chemistry, Basic Engineering & Humanities',
    coordinates: { x: 62, y: 25 },
    amenities: ['1st Year UG Foundation Books', '02 Digital Workstations', 'Silent Study Pods', 'Power Outlets'],
    description: 'Dedicated foundational academic library on Apex Block 5th Level, exclusively tailored for 1st Year undergraduate engineering students.',
    rooms: [
      { name: '1st Year Foundation Reading Hall', occupancy: 22, capacity: 64, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'apex_mca_library',
    name: 'MCA Library',
    code: 'MCA-LIB',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[3]),
    status: 'AVAILABLE',
    noiseLevel: 'Quiet',
    walkTimeMinutes: 4,
    distanceMeters: 280,
    floor: 'APEX Block 2nd Level',
    capacity: 35,
    carpetArea: '84.82 Sq.m',
    digitalSystems: '03 Systems',
    facilities: 'MCA Books & Technical Journals & Computing Magazines, Digital System Terminals',
    disciplines: 'Master of Computer Applications (MCA), Software Development, Cloud Computing, Algorithm Design',
    coordinates: { x: 62, y: 27 },
    amenities: ['MCA Books & Journals', '03 Digital Workstations', 'Silent Study Pods', 'Power Outlets'],
    description: 'Postgraduate computing library located on Apex Block 2nd Level, featuring specialized software development volumes, computer application journals, and digital research bays.',
    rooms: [
      { name: 'MCA Reference Reading Bay', occupancy: 12, capacity: 35, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'arch_library',
    name: 'Architecture Library',
    code: 'ARCH-LIB',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[4]),
    status: 'AVAILABLE',
    noiseLevel: 'Quiet',
    walkTimeMinutes: 3,
    distanceMeters: 220,
    floor: 'ADS Block 3rd Level',
    capacity: 45,
    carpetArea: '88.42 Sq.m',
    digitalSystems: '03 Systems',
    facilities: 'Architecture Books & Journals & Design Magazines, Digital Research Workstations, Portfolio Review Tables',
    disciplines: 'Architecture, Urban Design, Landscape Architecture, Environmental Design, Spatial Computing',
    coordinates: { x: 38, y: 65 },
    amenities: ['Design Magazines & Folios', '03 Digital Workstations', 'Portfolio Review Tables', 'Power Outlets'],
    description: 'Specialized architectural library situated on ADS Block 3rd Level, stocked with international design monographs, urban planning catalogues, spatial folios, and architectural journals.',
    rooms: [
      { name: 'Architecture Design Studio Library', occupancy: 16, capacity: 45, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'esb_mba_library',
    name: 'MBA Library',
    code: 'MBA-LIB',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[5]),
    status: 'AVAILABLE',
    noiseLevel: 'Quiet',
    walkTimeMinutes: 2,
    distanceMeters: 140,
    floor: 'ESB-II 5th Level',
    capacity: 45,
    carpetArea: '100.01 Sq.m',
    digitalSystems: '03 Systems',
    facilities: 'MBA Books & Management Journals & Business Magazines, Digital Research Terminals',
    disciplines: 'Master of Business Administration (MBA), Finance, Marketing, Human Resources, Business Analytics',
    coordinates: { x: 25, y: 60 },
    amenities: ['Business Magazines & Case Studies', '03 Digital Workstations', 'Management Reading Room', 'Power Outlets'],
    description: 'Management studies library located on ESB-II 5th Level, dedicated to business research, case study archives, Harvard Business Review folios, and corporate periodicals.',
    rooms: [
      { name: 'MBA Management Reading Room', occupancy: 15, capacity: 45, status: 'AVAILABLE' }
    ]
  },
  // Backward compatibility alias entries so legacy references in any component continue to resolve:
  {
    id: 'ise-lab-2',
    name: 'Unit II - Library (LHC-306)',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[1]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 3,
    distanceMeters: 210,
    floor: '1st Floor, Room LHC-306',
    coordinates: { x: 45, y: 35 },
    amenities: ['61 Digital Workstations', 'MSRIT Book Bank', 'High-Speed Wi-Fi', 'Power Sockets'],
    description: 'Central Library Unit II located on the 1st Floor of LHC Block (Room LHC-306). 538 seats, 61 digital workstations, and CS/ISE/Electronics reference holdings.',
    rooms: [
      { name: 'CSE & ISE Reading Hall', occupancy: 130, capacity: 300, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'esb-library',
    name: 'MSRIT Main Library (ESB)',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[0]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 2,
    distanceMeters: 140,
    floor: '4th Level, ESB-II',
    coordinates: { x: 25, y: 58 },
    amenities: ['60 TFT Monitors', 'LMS Servers', 'Study Cubicles', 'Power Sockets'],
    description: 'MSRIT Central Main Library on ESB-II 4th Level serving Civil, Mechanical, Chemical, IEM, and Biotechnology branches.',
    rooms: [
      { name: 'Main Reading Hall', occupancy: 120, capacity: 250, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'lhc-library',
    name: 'Unit II - Library (LHC)',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[1]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 3,
    distanceMeters: 210,
    floor: '1st Floor, Room LHC-306',
    coordinates: { x: 45, y: 35 },
    amenities: ['61 Systems', 'Book Bank', 'IEEE Journals', 'High-Speed Wi-Fi'],
    description: 'Central Library Unit II in LHC Block (Room LHC-306) for Computer Science and Electronics disciplines.',
    rooms: [
      { name: 'Reading Hall', occupancy: 130, capacity: 300, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'apex-library',
    name: 'Unit III - Library (Apex)',
    category: 'study',
    occupancy: calculateLibraryOccupancy(LIBRARIES[2]),
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 4,
    distanceMeters: 280,
    floor: '5th Level, Apex Block',
    coordinates: { x: 62, y: 25 },
    amenities: ['1st Year Books', 'Digital Pods', 'Power Outlets'],
    description: 'Dedicated foundation engineering library exclusive for 1st Year UG students on Apex Block 5th Level.',
    rooms: [
      { name: 'Foundation Reading Hall', occupancy: 22, capacity: 64, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'computer-lab-3',
    name: 'Unit II Digital Commons (LHC-306)',
    category: 'study',
    occupancy: 42,
    status: 'AVAILABLE',
    noiseLevel: 'Silent',
    walkTimeMinutes: 3,
    distanceMeters: 210,
    floor: '1st Floor, Room LHC-306',
    coordinates: { x: 45, y: 35 },
    amenities: ['61 Digital Workstations', 'Power Sockets', 'Air Conditioned', 'Fiber Internet'],
    description: 'Digital library systems section with 61 workstations inside Unit II Library in LHC Block.',
    rooms: [
      { name: 'Digital Workstations Bay', occupancy: 28, capacity: 61, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'main-block',
    name: 'Main Academic Block',
    category: 'facility',
    occupancy: 62,
    status: 'BUSY',
    noiseLevel: 'Moderate',
    walkTimeMinutes: 1,
    distanceMeters: 50,
    floor: 'Ground + 4 Floors',
    coordinates: { x: 45, y: 52 },
    amenities: ['Lecture Halls', 'Administrative Office', 'ATM', 'Help Desk'],
    description: 'Central hub housing primary lecture halls, student administration, and departmental dean offices.',
    rooms: [
      { name: 'Seminar Hall 101', occupancy: 80, capacity: 100, status: 'BUSY' },
      { name: 'Lecture Theatre A', occupancy: 120, capacity: 120, status: 'FULL' }
    ]
  },
  {
    id: 'auditorium',
    name: 'Grand Campus Auditorium',
    category: 'facility',
    occupancy: 90,
    status: 'BUSY',
    noiseLevel: 'Loud',
    walkTimeMinutes: 4,
    distanceMeters: 290,
    floor: 'Main Complex',
    coordinates: { x: 72, y: 40 },
    amenities: ['1200 Seater', 'Stage Lighting', 'Acoustic Sound', 'HVAC'],
    description: 'State-of-the-art campus auditorium hosting keynote speeches, hackathons, and cultural events.',
    rooms: [
      { name: 'Main Hall', occupancy: 1080, capacity: 1200, status: 'CROWDED' }
    ]
  },
  {
    id: 'cafeteria',
    name: 'Central Food Court',
    category: 'cafeteria',
    occupancy: 68,
    status: 'BUSY',
    noiseLevel: 'Loud',
    walkTimeMinutes: 4,
    distanceMeters: 310,
    floor: 'Student Commons',
    coordinates: { x: 62, y: 65 },
    amenities: ['Multi-cuisine stalls', 'Juice Bar', 'Outdoor Patio', 'Wi-Fi'],
    description: 'Vibrant dining hall offering fresh meals, artisanal coffee, and social seating.',
    rooms: [
      { name: 'Indoor Dining Hall', occupancy: 170, capacity: 250, status: 'BUSY' },
      { name: 'Outdoor Garden Terrace', occupancy: 68, capacity: 100, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'faculty-block-b',
    name: 'Faculty Block B',
    category: 'faculty',
    occupancy: 30,
    status: 'AVAILABLE',
    noiseLevel: 'Quiet',
    walkTimeMinutes: 3,
    distanceMeters: 210,
    floor: 'Block B (3 Floors)',
    coordinates: { x: 25, y: 60 },
    amenities: ['Faculty Offices', 'Research Labs', 'Meeting Rooms'],
    description: 'Departmental faculty offices for Information Science, Computer Science, and AI research faculties.',
    rooms: [
      { name: 'ISE Faculty Wing (2nd Floor)', occupancy: 8, capacity: 25, status: 'AVAILABLE' },
      { name: 'CS Faculty Wing (1st Floor)', occupancy: 12, capacity: 30, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'sports-complex',
    name: 'Sports & Fitness Complex',
    category: 'sports',
    occupancy: 55,
    status: 'AVAILABLE',
    noiseLevel: 'Loud',
    walkTimeMinutes: 6,
    distanceMeters: 450,
    floor: 'West Campus Grounds',
    coordinates: { x: 80, y: 72 },
    amenities: ['Gymnasium', 'Badminton Courts', 'Indoor Basketball', 'Swimming Pool'],
    description: 'Comprehensive athletics center featuring a modern weight room, courts, and recreation facilities.',
    rooms: [
      { name: 'Fitness Gym', occupancy: 35, capacity: 60, status: 'AVAILABLE' },
      { name: 'Badminton Courts 1-4', occupancy: 16, capacity: 16, status: 'FULL' }
    ]
  },
  {
    id: 'hostel-block-a',
    name: 'Student Residences (Block A)',
    category: 'facility',
    occupancy: 75,
    status: 'ISSUE REPORTED',
    noiseLevel: 'Moderate',
    walkTimeMinutes: 7,
    distanceMeters: 520,
    floor: 'North Quad',
    coordinates: { x: 15, y: 18 },
    amenities: ['Laundry', 'Study Lounge', 'Vending Machines'],
    description: 'Residential dormitories housing undergraduate engineering students.',
    rooms: [
      { name: 'Ground Floor Lounge', occupancy: 18, capacity: 25, status: 'BUSY' }
    ]
  }
];

export const FACULTY_DATA: Faculty[] = [
  {
    id: 'fac-0',
    name: 'Dr. Anita Sharma',
    department: 'Computer Science & Eng.',
    status: 'AVAILABLE',
    room: 'B-204',
    buildingId: 'faculty-block-b',
    availableUntil: '4:30 PM',
    officeHours: '2:00 PM - 5:00 PM',
    email: 'anita.sharma@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    expertise: 'Algorithms & Data Structures, Distributed Computing'
  },
  {
    id: 'fac-1',
    name: 'Dr. XYZ',
    department: 'Information Science & Eng.',
    status: 'AVAILABLE',
    room: 'B-204',
    buildingId: 'faculty-block-b',
    availableUntil: '4:30 PM',
    officeHours: '2:00 PM - 5:00 PM',
    email: 'dr.xyz@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    expertise: 'Artificial Intelligence, Distributed Systems & Real-Time Analytics'
  },
  {
    id: 'fac-2',
    name: 'Prof. Sarah Jenkins',
    department: 'Computer Science',
    status: 'IN CLASS',
    room: 'CS-102',
    buildingId: 'main-block',
    nextFreeTime: '3:15 PM',
    officeHours: '3:30 PM - 5:00 PM',
    email: 's.jenkins@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    expertise: 'Algorithms & Data Structures, Competitive Coding'
  },
  {
    id: 'fac-3',
    name: 'Dr. Aris Thorne',
    department: 'Electronics & Comm.',
    status: 'AVAILABLE',
    room: 'B-310',
    buildingId: 'faculty-block-b',
    availableUntil: '5:00 PM',
    officeHours: '1:00 PM - 5:00 PM',
    email: 'athorne@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    expertise: 'Embedded IoT Systems, Wireless Sensor Networks'
  },
  {
    id: 'fac-4',
    name: 'Prof. Marcus Vance',
    department: 'Data Science & AI',
    status: 'IN MEETING',
    room: 'B-112',
    buildingId: 'faculty-block-b',
    nextFreeTime: '4:00 PM',
    officeHours: '4:00 PM - 6:00 PM',
    email: 'mvance@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    expertise: 'Deep Learning, Computer Vision & Robotics'
  }
];

export interface PredictiveForecast {
  location: string;
  peakPeriod: string;
  quietPeriod: string;
  historicalPeakPct: number;
}

export const PREDICTIVE_FORECASTS: PredictiveForecast[] = [
  {
    location: 'MAIN LIBRARY',
    peakPeriod: '5 PM — 7 PM',
    quietPeriod: '2:30 PM — 4 PM',
    historicalPeakPct: 88
  },
  {
    location: 'ISE LAB 2',
    peakPeriod: '11 AM — 1 PM',
    quietPeriod: '8 AM — 10:30 AM',
    historicalPeakPct: 45
  },
  {
    location: 'CENTRAL FOOD COURT',
    peakPeriod: '12:30 PM — 2 PM',
    quietPeriod: '3:30 PM — 5 PM',
    historicalPeakPct: 92
  }
];


export const INITIAL_ISSUES: CampusIssue[] = [
  {
    id: 'iss-101',
    title: 'Projector HDMI Input Failing',
    type: 'Projector',
    buildingId: 'ise-lab-2',
    locationDetails: 'ISE Lab 2 - Podium Console',
    description: 'The overhead projector flickers purple and loses HDMI signal every 5 minutes during presentations.',
    status: 'IN PROGRESS',
    reportedAt: '25 mins ago',
    upvotes: 14,
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'iss-103',
    title: 'Campus-Guest Wi-Fi Packet Loss',
    type: 'Wi-Fi',
    buildingId: 'cafeteria',
    locationDetails: 'Central Food Court - Outdoor Terrace',
    description: 'High packet loss and intermittent drops on the open guest access point.',
    status: 'REPORTED',
    reportedAt: '2 hours ago',
    upvotes: 21
  },
  {
    id: 'iss-104',
    title: 'Water Cooler Filter Replacement',
    type: 'Water Leakage',
    buildingId: 'main-block',
    locationDetails: 'Main Academic Block - 3rd Floor East Hallway',
    description: 'Red maintenance indicator light is flashing on the drinking water station.',
    status: 'RESOLVED',
    reportedAt: 'Yesterday',
    upvotes: 5
  }
];

export const INITIAL_ACTIVITIES: LiveActivity[] = [
  {
    id: 'act-1',
    timestamp: 'Just now',
    type: 'occupancy',
    message: 'ISE Lab 2 is at optimal study availability (20% occupied, Quiet soundscape).',
    location: 'ISE Lab 2',
    level: 'success'
  },
  {
    id: 'act-2',
    timestamp: '3m ago',
    type: 'faculty',
    message: 'Dr. XYZ updated availability status to AVAILABLE in Room B-204.',
    location: 'Faculty Block B',
    level: 'info'
  },
  {
    id: 'act-3',
    timestamp: '7m ago',
    type: 'occupancy',
    message: 'Main Library 2nd floor digital commons reached 85% capacity.',
    location: 'Main Library',
    level: 'warning'
  },
  {
    id: 'act-4',
    timestamp: '15m ago',
    type: 'issue',
    message: 'Tech support dispatched to ISE Lab 2 for Projector HDMI input repair.',
    location: 'ISE Lab 2',
    level: 'info'
  },
  {
    id: 'act-5',
    timestamp: '28m ago',
    type: 'announcement',
    message: 'Campus Hackathon keynotes scheduled at 4:00 PM in Auditorium.',
    location: 'Grand Auditorium',
    level: 'info'
  }
];

export const SAMPLE_SUGGESTIONS = [
  "Where can I study right now?",
  "Is the library crowded?",
  "Where is ISE Lab 2?",
  "Is Dr. XYZ available?",
  "Find a quiet computer lab with Wi-Fi",
  "Report an issue in Block B"
];
