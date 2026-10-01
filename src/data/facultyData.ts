import facultyMsritDynamicData from './faculty_msrit_dynamic.json';

export interface FacultyDayScheduleItem {
  time: string;
  subject: string;
  event?: string;
  room?: string;
}

export interface WeeklySchedule {
  Monday: FacultyDayScheduleItem[];
  Tuesday: FacultyDayScheduleItem[];
  Wednesday: FacultyDayScheduleItem[];
  Thursday: FacultyDayScheduleItem[];
  Friday: FacultyDayScheduleItem[];
  Saturday: FacultyDayScheduleItem[];
}

export interface TodayScheduleItem {
  time: string;
  event: string;
  room?: string;
}

export interface MSRITFacultyRecord {
  id: string;
  name: string;
  shortCode?: string;
  designation: string;
  department: string;
  email: string;
  cabinLocation: string;
  nodeId: string;
  status: string;
  currentLocation: string | null;
  nextAvailableTime: string | null;
  todaySchedule?: TodayScheduleItem[];
  weeklySchedule?: WeeklySchedule;
  avatarUrl?: string;
  building?: string;
  primaryBuilding?: string;
  homeBuilding?: string;
}

export interface CampusNode {
  nodeId: string;
  name: string;
  building: string;
  floor: string;
  description: string;
  category?: 'Departments' | 'Faculty' | 'Labs' | 'Library' | 'Administration' | 'Facilities' | 'Canteens' | 'Hostels';
  coordinates: { x: number; y: number; lat: number; lng: number };
}

/**
 * Department-to-Building Canonical Resolution:
 * LHC BLOCK: CSE, ISE, ECE, ET, EI, ME (Medical Electronics)
 * CRD BLOCK: CSE AIML, CSE CY
 * ESB BLOCK: CV, INDUSTRIAL, BIOTECH
 *
 * NOTE: "ME" means Medical Electronics -> LHC Block.
 * It does NOT mean Mechanical Engineering!
 */
export function resolveFacultyBuildingMapping(deptName: string): {
  building: string;
  primaryBuilding: string;
  homeBuilding: string;
  nodeId: string;
} {
  const d = (deptName || '').trim().toLowerCase();

  // CRD BLOCK:
  // - CSE AIML
  // - CSE CY
  if (
    d.includes('ai & ml') ||
    d.includes('ai-ml') ||
    d.includes('aiml') ||
    d.includes('artificial intelligence') ||
    d.includes('cyber') ||
    d === 'cy' ||
    d === 'cse cy' ||
    d === 'cse aiml'
  ) {
    return {
      building: 'CRD',
      primaryBuilding: 'CRD Block',
      homeBuilding: 'CRD Block',
      nodeId: 'crd_block'
    };
  }

  // ESB BLOCK:
  // - CV
  // - INDUSTRIAL
  // - BIOTECH
  if (
    d.includes('civil') ||
    d === 'cv' ||
    d.includes('industrial') ||
    d.includes('iem') ||
    d.includes('biotech') ||
    d === 'bt'
  ) {
    return {
      building: 'ESB',
      primaryBuilding: 'ESB Block',
      homeBuilding: 'ESB Block',
      nodeId: 'esb_entrance'
    };
  }

  // DES BLOCK (Division of Electrical Sciences):
  // - ISE (DES-305/303/304/311)
  // - ETE / E&TE (DES-413/401/510/511)
  // - EIE / E&IE (DES-501/502B)
  // - EEE / E&EE (DES-201/202)
  if (
    d.includes('information science') ||
    d === 'ise'
  ) {
    return {
      building: 'DES',
      primaryBuilding: 'DES Block',
      homeBuilding: 'DES Block',
      nodeId: 'block-des'
    };
  }

  if (
    d.includes('telecommunication') ||
    d === 'et' ||
    d === 'ete' ||
    d === 'e&te'
  ) {
    return {
      building: 'DES',
      primaryBuilding: 'DES Block',
      homeBuilding: 'DES Block',
      nodeId: 'block-des'
    };
  }

  if (
    d.includes('instrumentation') ||
    d === 'ei' ||
    d === 'eie' ||
    d === 'e&ie'
  ) {
    return {
      building: 'DES',
      primaryBuilding: 'DES Block',
      homeBuilding: 'DES Block',
      nodeId: 'block-des'
    };
  }

  if (
    d.includes('electrical') ||
    d === 'eee' ||
    d === 'e&ee'
  ) {
    return {
      building: 'DES',
      primaryBuilding: 'DES Block',
      homeBuilding: 'DES Block',
      nodeId: 'block-des'
    };
  }

  // LHC BLOCK:
  // - CSE
  // - ECE
  // - ME (Medical Electronics)
  // CRITICAL: "ME" means Medical Electronics, NOT Mechanical Engineering!
  if (
    d === 'me' ||
    d.includes('medical electronics') ||
    d.includes('computer science') ||
    d === 'cse' ||
    d.includes('communication') ||
    d === 'ece'
  ) {
    return {
      building: 'LHC',
      primaryBuilding: 'LHC Block',
      homeBuilding: 'LHC Block',
      nodeId: 'lhc_block'
    };
  }

  // Mechanical Engineering (NOT ME!)
  if (d.includes('mechanical')) {
    return {
      building: 'Mechanical',
      primaryBuilding: 'Mechanical Block',
      homeBuilding: 'Mechanical Block',
      nodeId: 'mech_block'
    };
  }

  // Fallback default
  return {
    building: 'LHC',
    primaryBuilding: 'LHC Block',
    homeBuilding: 'LHC Block',
    nodeId: 'lhc_block'
  };
}

export const FACULTY_MSRIT_DATA: MSRITFacultyRecord[] = (facultyMsritDynamicData as MSRITFacultyRecord[]).map((f) => {
  const mapping = resolveFacultyBuildingMapping(f.department);
  let cabin = f.cabinLocation;
  // If Medical Electronics, ensure cabin reflects LHC Block
  if (f.department === 'ME' || f.department.toLowerCase().includes('medical electronics')) {
    if (cabin && cabin.includes('ESB Block')) {
      cabin = cabin.replace('ESB Block', 'LHC Block');
    } else if (!cabin || !cabin.includes('LHC Block')) {
      cabin = cabin ? `LHC Block, ${cabin}` : 'LHC Block, Medical Electronics Wing';
    }
  }
  return {
    ...f,
    building: mapping.building,
    primaryBuilding: mapping.primaryBuilding,
    homeBuilding: mapping.homeBuilding,
    cabinLocation: cabin,
    nodeId: (f.department === 'ME' || f.department.toLowerCase().includes('medical electronics')) ? mapping.nodeId : f.nodeId
  };
});

export const CAMPUS_NODES_MAPPING: Record<string, CampusNode> = {
  ise_hod_office: {
    nodeId: 'ise_hod_office',
    name: 'ISE HOD Office',
    building: 'LHC / ISE Wing',
    floor: '3rd Floor',
    description: 'Information Science & Engineering Head of Department Office Suite.',
    category: 'Departments',
    coordinates: { x: 38, y: 32, lat: 13.0311, lng: 77.5649 }
  },
  ise_faculty_cubicles: {
    nodeId: 'ise_faculty_cubicles',
    name: 'ISE Faculty Cubicles',
    building: 'LHC / ISE Wing',
    floor: '3rd Floor',
    description: 'Faculty offices & research cabins for Information Science professors.',
    category: 'Faculty',
    coordinates: { x: 45, y: 35, lat: 13.0312, lng: 77.5648 }
  },
  ise_dept_entrance: {
    nodeId: 'ise_dept_entrance',
    name: 'ISE Department Area / Entrance',
    building: 'LHC / ISE Wing',
    floor: '2nd Floor',
    description: 'Main department entrance, seminar halls, and student counseling area.',
    category: 'Departments',
    coordinates: { x: 36, y: 40, lat: 13.0310, lng: 77.5647 }
  },
  apex_entrance: {
    nodeId: 'apex_entrance',
    name: 'Apex Academic Block (CSE & MCA Wing)',
    building: 'Apex Block',
    floor: 'Ground to 5th Floor',
    description: 'Houses Computer Science & Engineering, MCA, and SAP Center of Excellence.',
    category: 'Departments',
    coordinates: { x: 62, y: 25, lat: 13.0314, lng: 77.5645 }
  },
  esb_entrance: {
    nodeId: 'esb_entrance',
    name: 'Electronics & Electrical Block (DES & ESB)',
    building: 'DES Block / ESB',
    floor: '1st to 4th Floor',
    description: 'Houses ECE, EEE, and Electronics Instrumentation departments.',
    category: 'Departments',
    coordinates: { x: 25, y: 58, lat: 13.0308, lng: 77.5642 }
  },
  central_foyer: {
    nodeId: 'central_foyer',
    name: 'Central Academic Foyer & Basic Sciences',
    building: 'Basic Sciences Block',
    floor: '1st & 2nd Floor',
    description: 'Mathematics, Physics, Chemistry, and Humanities departmental suites.',
    category: 'Administration',
    coordinates: { x: 50, y: 68, lat: 13.0306, lng: 77.5639 }
  },
  esb_library: {
    nodeId: 'esb_library',
    name: 'ESB Library',
    building: 'ESB Block',
    floor: '1st Floor',
    description: 'Primary academic library serving 1st Year, Above 1st Year, and mainly Non-CSE engineering branches.',
    category: 'Library',
    coordinates: { x: 25, y: 58, lat: 13.0308, lng: 77.5642 }
  },
  lhc_library: {
    nodeId: 'lhc_library',
    name: 'LHC Library',
    building: 'LHC Block',
    floor: '2nd Floor',
    description: 'Departmental library and research reference center for Computer Science and Electronics students.',
    category: 'Library',
    coordinates: { x: 45, y: 35, lat: 13.0311, lng: 77.5649 }
  },
  apex_library: {
    nodeId: 'apex_library',
    name: 'Apex Library',
    building: 'Apex Block',
    floor: 'Ground Floor',
    description: 'Dedicated foundation engineering library and quiet study zone for 1st Year students.',
    category: 'Library',
    coordinates: { x: 62, y: 25, lat: 13.0314, lng: 77.5645 }
  },
  msrit_cafeteria: {
    nodeId: 'msrit_cafeteria',
    name: 'Main Campus Food Court & Canteen',
    building: 'Central Canteen Complex',
    floor: 'Ground Floor',
    description: 'Multi-cuisine campus dining, coffee lounge, and student food court.',
    category: 'Canteens',
    coordinates: { x: 42, y: 72, lat: 13.0304, lng: 77.5646 }
  },
  msrit_sports: {
    nodeId: 'msrit_sports',
    name: 'MSRIT Sports Complex & Gymnasium',
    building: 'Sports & Athletics Ground',
    floor: 'Ground Level',
    description: 'Indoor basketball court, badminton hall, fitness gym, and outdoor sports ground.',
    category: 'Facilities',
    coordinates: { x: 70, y: 80, lat: 13.0301, lng: 77.5652 }
  },
  msrit_hostel: {
    nodeId: 'msrit_hostel',
    name: 'MSRIT Student Hostels Complex',
    building: 'Hostels Block A & B',
    floor: 'Multi-storey',
    description: 'Residential quarters for undergraduate and postgraduate students.',
    category: 'Hostels',
    coordinates: { x: 20, y: 85, lat: 13.0298, lng: 77.5641 }
  },
  ise_lab_2: {
    nodeId: 'ise_lab_2',
    name: 'ISE Lab 2 / Innovation Computing Lab',
    building: 'LHC / Innovation Wing',
    floor: '2nd Floor',
    description: 'High-performance computing laboratory and project work workspace.',
    category: 'Labs',
    coordinates: { x: 40, y: 30, lat: 13.0311, lng: 77.5650 }
  },
  arch_block: {
    nodeId: 'arch_block',
    name: 'School of Architecture & Design Block',
    building: 'Architecture Block',
    floor: 'Ground to 4th Floor',
    description: 'Design studios, exhibition galleries, and architectural drafting suites.',
    category: 'Departments',
    coordinates: { x: 52, y: 18, lat: 13.0316, lng: 77.5649 }
  },
  quadrangle: {
    nodeId: 'quadrangle',
    name: 'Central Academic Quadrangle',
    building: 'Main Campus Quadrangle',
    floor: 'Open Plaza',
    description: 'Central campus plaza, amphitheatre seating, and student gathering venue.',
    category: 'Facilities',
    coordinates: { x: 48, y: 48, lat: 13.0309, lng: 77.5644 }
  },
  crd_block: {
    nodeId: 'crd_block',
    name: 'CRD Block (CSE AI-ML & Cyber Security)',
    building: 'CRD Block',
    floor: 'Ground to 4th Floor',
    description: 'Academic block housing Computer Science & Engineering (AI & ML) and Cyber Security departments.',
    category: 'Departments',
    coordinates: { x: 55, y: 30, lat: 13.0313, lng: 77.5647 }
  },
  lhc_block: {
    nodeId: 'lhc_block',
    name: 'LHC Block (CSE, ISE, ECE, ET, EI, Medical Electronics)',
    building: 'LHC Block',
    floor: 'Ground to 4th Floor',
    description: 'Lecture Hall Complex housing CSE, ISE, ECE, ET, EI, and Medical Electronics departments.',
    category: 'Departments',
    coordinates: { x: 45, y: 35, lat: 13.0311, lng: 77.5649 }
  }
};

export function getFacultyById(id: string): MSRITFacultyRecord | undefined {
  return FACULTY_MSRIT_DATA.find((f) => f.id === id);
}

export function getFacultyByNodeId(nodeId: string): MSRITFacultyRecord[] {
  return FACULTY_MSRIT_DATA.filter((f) => f.nodeId === nodeId);
}

export function loadFacultyData(): MSRITFacultyRecord[] {
  return FACULTY_MSRIT_DATA;
}

export function getDepartments(facultyData: MSRITFacultyRecord[] = FACULTY_MSRIT_DATA): string[] {
  const depts = new Set<string>();
  facultyData.forEach((f) => {
    if (f.department) {
      depts.add(f.department.trim());
    }
  });
  return Array.from(depts).sort();
}

export function groupFacultyByDepartment(
  facultyData: MSRITFacultyRecord[] = FACULTY_MSRIT_DATA
): Record<string, MSRITFacultyRecord[]> {
  const grouped: Record<string, MSRITFacultyRecord[]> = {};
  
  facultyData.forEach((f) => {
    const dept = f.department ? f.department.trim() : 'OTHER';
    if (!grouped[dept]) {
      grouped[dept] = [];
    }
    grouped[dept].push(f);
  });
  
  return grouped;
}

export function getFacultyByDepartment(
  department: string,
  facultyData: MSRITFacultyRecord[] = FACULTY_MSRIT_DATA
): MSRITFacultyRecord[] {
  if (!department || department === 'ALL') return facultyData;
  const deptLower = department.toLowerCase().trim();
  return facultyData.filter((f) => f.department && f.department.toLowerCase().trim() === deptLower);
}

export function searchFaculty(
  query: string,
  department: string = 'ALL',
  facultyData: MSRITFacultyRecord[] = FACULTY_MSRIT_DATA
): MSRITFacultyRecord[] {
  const q = query.toLowerCase().trim();
  let baseList = facultyData;
  
  if (department && department !== 'ALL') {
    const deptLower = department.toLowerCase().trim();
    baseList = facultyData.filter((f) => f.department && f.department.toLowerCase().trim() === deptLower);
  }
  
  if (!q) return baseList;
  
  return baseList.filter((f) =>
    f.name.toLowerCase().includes(q) ||
    f.department.toLowerCase().includes(q) ||
    f.designation.toLowerCase().includes(q) ||
    f.cabinLocation.toLowerCase().includes(q) ||
    (f.email && f.email.toLowerCase().includes(q))
  );
}

export function getAllNodes(): CampusNode[] {
  return Object.values(CAMPUS_NODES_MAPPING);
}

