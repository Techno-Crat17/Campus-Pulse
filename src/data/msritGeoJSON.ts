import facultyMsritData from '../../faculty_msrit.json';

export interface GeoLocation {
  id: string;
  name: string;
  category: 'Departments' | 'Faculty' | 'Labs' | 'Library' | 'Administration' | 'Facilities' | 'Canteens' | 'Hostels';
  building: string;
  floor: string;
  department?: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  sourceUrl: string;
  facultyDetails?: {
    name: string;
    designation: string;
    department: string;
    email: string;
    cabinLocation: string;
    status: string;
    avatarUrl?: string;
  };
}

export const MSRIT_CAMPUS_GEOJSON: GeoLocation[] = [
  {
    id: "loc-apex-block",
    name: "Computer Science & Engineering (Apex Block)",
    category: "Departments",
    building: "Apex Block / Tech Block",
    floor: "Ground to 5th Floor",
    department: "Computer Science & Engineering",
    description: "Primary academic block for Computer Science & Engineering, MCA, SAP Centre of Excellence, and High-Performance GPU Research Labs.",
    latitude: 13.0314,
    longitude: 77.5645,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/cse.html"
  },
  {
    id: "loc-lhc-block",
    name: "Information Science & Engineering (LHC / Innovation Block)",
    category: "Departments",
    building: "Lecture Hall Complex (LHC)",
    floor: "Ground to 4th Floor",
    department: "Information Science & Engineering",
    description: "Houses Information Science & Engineering classrooms, HOD office, faculty cabins, algorithm compute labs, and project suites.",
    latitude: 13.0311,
    longitude: 77.5649,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/ise.html"
  },
  {
    id: "loc-des-block",
    name: "Electronics & Communication (DES Block)",
    category: "Departments",
    building: "DES Block",
    floor: "1st to 4th Floor",
    department: "Electronics & Communication Engineering",
    description: "Houses ECE, EIE, and Telecommunication departments alongside IoT, VLSI & Embedded Systems research labs.",
    latitude: 13.0308,
    longitude: 77.5642,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/ece.html"
  },
  {
    id: "loc-central-library",
    name: "MSRIT Central Library",
    category: "Library",
    building: "Central Library Building",
    floor: "4 Floors (Ground + 3)",
    department: "Central Facility",
    description: "Four floors of silent reading halls, VTU digital library consortium, research alcoves, archives, and printing hub.",
    latitude: 13.0316,
    longitude: 77.5651,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/facilities/library.html"
  },
  {
    id: "loc-admin-block",
    name: "MSRIT Administrative Block",
    category: "Administration",
    building: "Main Admin Block",
    floor: "Ground & 1st Floor",
    department: "Administration",
    description: "Central administrative headquarters housing Principal's Office, Registrar, Admissions, Controller of Examinations, and Student Accounts.",
    latitude: 13.0305,
    longitude: 77.5648,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/"
  },
  {
    id: "loc-apex-auditorium",
    name: "Apex Auditorium & Convention Center",
    category: "Facilities",
    building: "Apex Block Complex",
    floor: "Ground Floor",
    department: "Central Amenities",
    description: "1,200-seater acoustic campus auditorium hosting keynote speeches, international symposia, hackathons, and cultural festivals.",
    latitude: 13.0315,
    longitude: 77.5644,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/"
  },
  {
    id: "loc-food-court",
    name: "MSRIT Central Food Court & Cafeteria",
    category: "Canteens",
    building: "Student Commons Block",
    floor: "Ground Floor & Garden Terrace",
    department: "Student Amenities",
    description: "Multi-cuisine dining food court serving fresh meals, artisanal coffee, juice bars, and shaded outdoor seating.",
    latitude: 13.0309,
    longitude: 77.5653,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/"
  },
  {
    id: "loc-sports",
    name: "MSRIT Sports Complex & Fitness Center",
    category: "Facilities",
    building: "Sports Complex",
    floor: "Ground Floor",
    department: "Physical Education",
    description: "Indoor badminton courts, modern gymnasium, basketball court, table tennis hall, and athletic sports grounds.",
    latitude: 13.0320,
    longitude: 77.5641,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/"
  },
  {
    id: "loc-hostel-quad",
    name: "MSRIT Student Hostels (Boys & Girls)",
    category: "Hostels",
    building: "Hostel Block A, B & C",
    floor: "Multi-storey Residential Halls",
    department: "Hostel Administration",
    description: "On-campus residential student halls with dining mess, study lounges, high-speed Wi-Fi, and 24/7 security.",
    latitude: 13.0322,
    longitude: 77.5655,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/"
  },
  {
    id: "loc-basic-sciences",
    name: "Basic Sciences Block (Physics, Chemistry, Maths)",
    category: "Departments",
    building: "Basic Sciences Block",
    floor: "1st to 3rd Floor",
    department: "Basic Sciences",
    description: "Houses Department of Mathematics, Physics, Chemistry, and Humanities lecture rooms and laboratories.",
    latitude: 13.0306,
    longitude: 77.5639,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/maths.html"
  },
  {
    id: "loc-ise-lab-suite",
    name: "Advanced ISE Computing Labs (Lab 1 & Lab 2)",
    category: "Labs",
    building: "LHC / Innovation Block",
    floor: "2nd & 3rd Floor",
    department: "Information Science & Engineering",
    description: "40 high-performance computer workstations equipped with dual monitors, Linux terminals, and cloud development SDKs.",
    latitude: 13.0312,
    longitude: 77.5648,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/ise.html"
  },
  {
    id: "loc-mechanical-block",
    name: "Mechanical Engineering Block",
    category: "Departments",
    building: "Mechanical Block",
    floor: "Ground to 3rd Floor",
    department: "Mechanical Engineering",
    description: "Houses Mechanical Engineering, Industrial Engineering & Management, CAD/CAM labs, workshops, and thermal labs.",
    latitude: 13.0310,
    longitude: 77.5638,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/department/me.html"
  }
];

// Helper to convert faculty_msrit.json entries into searchable map locations
export const MSRIT_FACULTY_MAP_ITEMS: GeoLocation[] = (facultyMsritData as any[]).map((fac, idx) => {
  // Map building name based on department
  let lat: number | null = null;
  let lng: number | null = null;
  let bldg = fac.cabinLocation || "Department Building";

  const deptLower = (fac.department || '').toLowerCase();

  // CRD BLOCK: CSE AIML, CSE CY
  if (
    deptLower.includes('ai & ml') ||
    deptLower.includes('ai-ml') ||
    deptLower.includes('aiml') ||
    deptLower.includes('cyber') ||
    deptLower === 'cy' ||
    deptLower === 'cse cy' ||
    deptLower === 'cse aiml'
  ) {
    lat = 13.0313;
    lng = 77.5647;
    bldg = fac.cabinLocation || "CRD Block";
  }
  // ESB BLOCK: CV, INDUSTRIAL, BIOTECH
  else if (
    deptLower.includes('civil') ||
    deptLower === 'cv' ||
    deptLower.includes('industrial') ||
    deptLower.includes('iem') ||
    deptLower.includes('biotech') ||
    deptLower === 'bt'
  ) {
    lat = 13.0308;
    lng = 77.5642;
    bldg = fac.cabinLocation || "ESB Block";
  }
  // LHC BLOCK: CSE, ISE, ECE, ET, EI, ME (Medical Electronics)
  // NOTE: ME = Medical Electronics (NOT Mechanical Engineering)
  else if (
    deptLower === 'me' ||
    deptLower.includes('medical electronics') ||
    deptLower.includes('computer science') ||
    deptLower === 'cse' ||
    deptLower.includes('information science') ||
    deptLower === 'ise' ||
    deptLower.includes('communication') ||
    deptLower === 'ece' ||
    deptLower.includes('telecommunication') ||
    deptLower === 'et' ||
    deptLower === 'ete' ||
    deptLower.includes('instrumentation') ||
    deptLower === 'ei' ||
    deptLower === 'eie'
  ) {
    lat = 13.0311;
    lng = 77.5649;
    bldg = fac.cabinLocation || "LHC Block";
  }
  // Mechanical Engineering (NOT ME!)
  else if (deptLower.includes('mechanical')) {
    lat = 13.0310;
    lng = 77.5638;
    bldg = fac.cabinLocation || "Mechanical Block";
  }

  return {
    id: `fac-geo-${idx}-${fac.id}`,
    name: fac.name,
    category: "Faculty",
    building: bldg,
    floor: fac.cabinLocation ? fac.cabinLocation.split(',')[1] || "Faculty Wing" : "Faculty Wing",
    department: fac.department,
    description: `${fac.designation} (${fac.department}). ${fac.cabinLocation ? 'Cabin: ' + fac.cabinLocation : 'Location information unavailable.'}`,
    latitude: lat,
    longitude: lng,
    source: "MSRIT official website",
    sourceUrl: "https://www.msrit.edu/",
    facultyDetails: {
      name: fac.name,
      designation: fac.designation,
      department: fac.department,
      email: fac.email,
      cabinLocation: fac.cabinLocation,
      status: fac.status || "Available",
      avatarUrl: fac.avatarUrl
    }
  };
});
