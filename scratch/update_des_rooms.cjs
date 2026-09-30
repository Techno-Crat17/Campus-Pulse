const fs = require('fs');
const path = require('path');

const roomsJsonPath = path.join(__dirname, '../src/data/msrit_rooms.json');
const currentData = JSON.parse(fs.readFileSync(roomsJsonPath, 'utf8'));

// Filter out existing DES rooms to replace with verified registry
const nonDesRooms = currentData.rooms.filter(r => r.buildingCode !== 'DES');

function calculateCampusPulseFloor(roomNum) {
  const match = roomNum.match(/(\d{3})/);
  if (!match) return 'Ground Floor';
  const digit = match[1][0];
  switch (digit) {
    case '1': return 'Basement';
    case '2': return 'Ground Floor';
    case '3': return '1st Floor';
    case '4': return '2nd Floor';
    case '5': return '3rd Floor';
    case '6': return '4th Floor';
    case '7': return '5th Floor';
    case '8': return '6th Floor';
    case '9': return '7th Floor';
    default: return 'Ground Floor';
  }
}

function normalizeRoomNumber(num) {
  return num.replace(/[\s–—_-]/g, '').toUpperCase();
}

const verifiedDesRoomList = [
  // 1xx -> Basement
  {
    roomNumber: "DES-101",
    name: "P G Laboratory - I, Project Lab",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["PG Laboratory - I", "PG Lab 1", "PG Lab - I", "Project Lab", "CSE PG Lab", "DES 101"]
  },
  {
    roomNumber: "DES-102",
    name: "P G Laboratory - II, Project Lab",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["PG Laboratory - II", "PG Lab 2", "PG Lab - II", "Project Lab", "CSE PG Lab", "DES 102"]
  },
  {
    roomNumber: "DES-101/102",
    name: "P G Laboratory - I/II, Project Lab",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["PG Laboratory - I/II, Project Lab", "PG Lab", "PG Laboratory", "CSE PG Lab", "CSE Project Lab", "DES 101/102"]
  },
  {
    roomNumber: "DES-103",
    name: "R&D Laboratories",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "E&EE", "Computer Science & Engineering", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["R&D Laboratories", "R&D Lab", "R and D Lab", "Research & Development Lab", "DES 103"]
  },
  {
    roomNumber: "DES-104",
    name: "R&D Laboratories",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "E&EE", "Computer Science & Engineering", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["R&D Laboratories", "R&D Lab", "R and D Lab", "Research & Development Lab", "DES 104"]
  },
  {
    roomNumber: "DES-103/104",
    name: "R&D Laboratories",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "E&EE", "Computer Science & Engineering", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["R&D Laboratories", "R&D Lab", "R and D Lab", "Research & Development Laboratories", "DES 103/104"]
  },
  {
    roomNumber: "DES-105",
    name: "Cloud & Security Lab",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Cloud & Security Lab", "Cloud and Security Lab", "Security Lab", "Cloud Lab", "CSE Cloud Lab", "CSE Security Lab", "DES 105"]
  },
  {
    roomNumber: "DES-106",
    name: "Hardware Lab (M-Tech)",
    floor: "Basement",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Hardware Lab (M-Tech)", "Hardware Lab", "M-Tech Hardware Lab", "MTech Hardware Lab", "EEE Hardware Lab", "E&EE Hardware Lab", "DES 106"]
  },
  {
    roomNumber: "DES-109",
    name: "Center for Antenna & Radio Frequency",
    floor: "Basement",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Center for Antenna & Radio Frequency", "Antenna & Radio Frequency Lab", "Antenna and Radio Frequency Lab", "CARF", "Antenna Lab", "Radio Frequency Lab", "RF Lab", "ETE Antenna Lab", "E&TE Antenna Lab", "DES 109"]
  },
  {
    roomNumber: "DES-111",
    name: "Electrical Machines Lab",
    floor: "Basement",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Electrical Machines Lab", "Machines Lab", "Electrical Machines Laboratory", "EEE Electrical Machines Lab", "E&EE Machines Lab", "DES 111"]
  },
  {
    roomNumber: "DES-113",
    name: "Computer Lab / Micro Controllers Lab, NI Lab",
    floor: "Basement",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab / Micro Controllers Lab, NI Lab", "Micro Controllers Lab", "Microcontroller Lab", "NI Lab", "National Instruments Lab", "EEE Computer Lab", "EEE Microcontroller Lab", "E&EE NI Lab", "DES 113"]
  },
  {
    roomNumber: "DES-114",
    name: "Relay and High Voltage Lab",
    floor: "Basement",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Relay and High Voltage Lab", "Relay & High Voltage Lab", "High Voltage Lab", "Relay Lab", "HV Lab", "EEE High Voltage Lab", "E&EE Relay Lab", "DES 114"]
  },
  {
    roomNumber: "DES-115",
    name: "Analog & Digital Electronics Lab",
    floor: "Basement",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Analog & Digital Electronics Lab", "Analog and Digital Electronics Lab", "ADE Lab", "Analog Electronics Lab", "Digital Electronics Lab", "EEE ADE Lab", "E&EE ADE Lab", "DES 115"]
  },
  {
    roomNumber: "DES-118",
    name: "DES High Tech Seminar Hall",
    floor: "Basement",
    department: "CSE",
    departments: ["CSE", "DES", "Computer Science & Engineering"],
    type: "Seminar Hall",
    category: "Seminar Hall",
    aliases: ["DES High Tech Seminar Hall", "DES Seminar Hall", "High Tech Seminar Hall", "Hi-Tech Seminar Hall", "DES Hi Tech Seminar Hall", "DES Hi-Tech Seminar Hall", "DES 118"]
  },

  // 2xx -> Ground Floor, 3xx -> 1st Floor
  {
    roomNumber: "DES-201",
    name: "HOD & Faculty Room (E&EE)",
    floor: "Ground Floor",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["E&EE HOD & Faculty Room", "EEE Faculty Room", "E&EE Faculty Room", "EEE HOD Room", "EEE Staff Room", "DES 201"]
  },
  {
    roomNumber: "DES-202",
    name: "Faculty Room (E&EE)",
    floor: "Ground Floor",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["E&EE Faculty Room", "EEE Faculty Room", "EEE Faculty Lounge", "EEE Staff Room", "DES 202"]
  },
  {
    roomNumber: "DES-201/202",
    name: "HOD & Faculty Room",
    floor: "Ground Floor",
    department: "E&EE",
    departments: ["E&EE", "EEE", "Electrical & Electronics Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room", "E&EE HOD & Faculty Room", "EEE Faculty Room", "E&EE Faculty Room", "EEE HOD Room", "EEE Staff Room", "EEE Faculty Lounge", "E&EE Faculty Lounge", "DES EEE Faculty Room", "DES E&EE Faculty Room", "DES 201/202"]
  },
  {
    roomNumber: "DES-204",
    name: "Control Systems Lab",
    floor: "Ground Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Control Systems Lab", "Control Systems Laboratory", "CS Lab", "EIE Control Systems Lab", "E&IE Control Systems Lab", "DES 204"]
  },
  {
    roomNumber: "DES-207",
    name: "Computer Lab - I",
    floor: "Ground Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - I", "Computer Lab 1", "CSE Computer Lab 1", "CSE Computer Lab - I", "DES 207"]
  },
  {
    roomNumber: "DES-308",
    name: "Computer Lab - II",
    floor: "1st Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - II", "Computer Lab 2", "CSE Computer Lab 2", "CSE Computer Lab - II", "DES 308"]
  },
  {
    roomNumber: "DES-207/308",
    name: "Computer Lab - I / II",
    floor: "Ground Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - I / II", "CSE Computer Lab - I/II", "DES 207/308"]
  },
  {
    roomNumber: "DES-208",
    name: "Computer Lab - III",
    floor: "Ground Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - III", "Computer Lab 3", "ISE Computer Lab 3", "ISE Computer Lab - III", "DES 208"]
  },
  {
    roomNumber: "DES-309",
    name: "Computer Lab - IV",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - IV", "Computer Lab 4", "ISE Computer Lab 4", "ISE Computer Lab - IV", "DES 309"]
  },
  {
    roomNumber: "DES-208/309",
    name: "Computer Lab - III / IV",
    floor: "Ground Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Computer Lab - III / IV", "ISE Computer Lab - III/IV", "DES 208/309"]
  },

  // 3xx -> 1st Floor, 2xx -> Ground Floor
  {
    roomNumber: "DES-203",
    name: "Faculty Room (CSE)",
    floor: "Ground Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (CSE)", "CSE Faculty Room", "CSE Staff Room", "DES 203"]
  },
  {
    roomNumber: "DES-210",
    name: "Faculty Room (CSE)",
    floor: "Ground Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (CSE)", "CSE Faculty Room", "CSE Staff Room", "DES 210"]
  },
  {
    roomNumber: "DES-301",
    name: "HOD & Faculty Room (CSE)",
    floor: "1st Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room (CSE)", "CSE HOD Room", "CSE Faculty Room", "CSE Staff Room", "DES 301"]
  },
  {
    roomNumber: "DES-301/203/210",
    name: "HOD & Faculty Room",
    floor: "1st Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room", "CSE HOD & Faculty Room", "CSE Faculty Room", "CSE HOD Room", "CSE Staff Room", "CSE Faculty Lounge", "DES CSE Faculty Room", "CSE Faculty Area", "DES 301/203/210"]
  },

  // ISE Faculty Suite (3xx -> 1st Floor)
  {
    roomNumber: "DES-303",
    name: "Faculty Room (ISE)",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (ISE)", "ISE Faculty Room", "ISE Staff Room", "DES 303"]
  },
  {
    roomNumber: "DES-304",
    name: "Faculty Room (ISE)",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (ISE)", "ISE Faculty Room", "ISE Staff Room", "DES 304"]
  },
  {
    roomNumber: "DES-305",
    name: "HOD & Faculty Room (ISE)",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room (ISE)", "ISE HOD Room", "ISE Faculty Room", "ISE Staff Room", "DES 305"]
  },
  {
    roomNumber: "DES-311",
    name: "Faculty Room (ISE)",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (ISE)", "ISE Faculty Room", "ISE Staff Room", "DES 311"]
  },
  {
    roomNumber: "DES-305/303/304/311",
    name: "HOD & Faculty Room",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: [
      "HOD & Faculty Room", "ISE HOD & Faculty Room", "ISE Faculty Room", "ISE HOD Room",
      "ISE Staff Room", "ISE Faculty Lounge", "DES ISE Faculty Room", "ISE Faculty Area",
      "ISE Teachers Room", "ISE Staff Lounge", "DES ISE Faculty Area", "DES ISE Staff Room",
      "DES 305/303/304/311"
    ]
  },

  // 4xx -> 2nd Floor
  {
    roomNumber: "DES-402",
    name: "Embedded Systems Lab",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Embedded Systems Lab", "Embedded Systems Laboratory", "ECE Embedded Systems Lab", "E&CE Embedded Systems Lab", "DES 402"]
  },
  {
    roomNumber: "DES-404",
    name: "VLSI Lab",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["VLSI Lab", "VLSI Laboratory", "ECE VLSI Lab", "E&CE VLSI Lab", "DES 404"]
  },
  {
    roomNumber: "DES-408",
    name: "Signal Processing Lab / Simulation Lab",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Signal Processing Lab / Simulation Lab", "Signal Processing Lab", "Simulation Lab", "SP Lab", "ECE Signal Processing Lab", "E&CE Signal Processing Lab", "DES 408"]
  },
  {
    roomNumber: "DES-409",
    name: "Circuits Lab & Communication Lab",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Circuits Lab & Communication Lab", "Circuits Lab", "Communication Lab", "Circuits and Communication Lab", "ECE Circuits Lab", "E&CE Circuits Lab", "DES 409"]
  },
  {
    roomNumber: "DES-401",
    name: "Faculty Room (E&TE)",
    floor: "2nd Floor",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (E&TE)", "ETE Faculty Room", "E&TE Faculty Room", "ETE Staff Room", "DES 401"]
  },
  {
    roomNumber: "DES-405",
    name: "Faculty Room (E&CE)",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (E&CE)", "ECE Faculty Room", "E&CE Faculty Room", "ECE Staff Room", "DES 405"]
  },
  {
    roomNumber: "DES-411",
    name: "Faculty Room (E&CE)",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (E&CE)", "ECE Faculty Room", "E&CE Faculty Room", "ECE Staff Room", "DES 411"]
  },
  {
    roomNumber: "DES-413",
    name: "HOD & Faculty Room (E&CE / E&TE)",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "E&TE", "ETE", "Electronics & Communication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room (E&CE / E&TE)", "ECE HOD Room", "ETE HOD Room", "DES 413"]
  },
  {
    roomNumber: "DES-413/405/411/511",
    name: "HOD & Faculty Room",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room", "E&CE HOD & Faculty Room", "ECE Faculty Room", "E&CE Faculty Room", "ECE HOD Room", "ECE Staff Room", "ECE Faculty Lounge", "DES ECE Faculty Room", "DES 413/405/411/511"]
  },
  {
    roomNumber: "DES-413/401/510/511",
    name: "HOD & Faculty Room",
    floor: "2nd Floor",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room", "E&TE HOD & Faculty Room", "ETE Faculty Room", "E&TE Faculty Room", "ETE HOD Room", "ETE Staff Room", "ETE Faculty Lounge", "DES ETE Faculty Room", "DES 413/401/510/511"]
  },

  // 5xx -> 3rd Floor
  {
    roomNumber: "DES-501",
    name: "HOD & Faculty Room (E&IE)",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room (E&IE)", "EIE HOD Room", "EIE Faculty Room", "E&IE Faculty Room", "EIE Staff Room", "DES 501"]
  },
  {
    roomNumber: "DES-502B",
    name: "Faculty Room (E&IE)",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (E&IE)", "EIE Faculty Room", "E&IE Faculty Room", "EIE Staff Room", "DES 502B"]
  },
  {
    roomNumber: "DES-501/502B",
    name: "HOD & Faculty Room",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["HOD & Faculty Room", "E&IE HOD & Faculty Room", "EIE Faculty Room", "E&IE Faculty Room", "EIE HOD Room", "EIE Staff Room", "EIE Faculty Lounge", "DES EIE Faculty Room", "DES 501/502B"]
  },
  {
    roomNumber: "DES-502A",
    name: "Project Lab / ITC_RIT",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: ["Project Lab / ITC_RIT", "Project Lab", "ITC_RIT", "ITC RIT", "EIE Project Lab", "E&IE Project Lab", "ITC RIT Lab", "DES 502A"]
  },
  {
    roomNumber: "DES-503",
    name: "PG Lab (Digital Communication) / Research Lab / Project Lab / IoT Research",
    floor: "3rd Floor",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: [
      "PG Lab (Digital Communication)", "Digital Communication Lab", "Research Lab",
      "Project Lab / IoT Research", "IoT Research Lab", "IoT Lab", "ETE Research Lab",
      "ETE IoT Lab", "ETE PG Lab", "E&TE Research Lab", "DES 503"
    ]
  },
  {
    roomNumber: "DES-506",
    name: "Digital Electronics Lab / Micro Controller Lab / Embedded Systems Lab / Micro wave and Antenna Lab / Mitsubishi Lab",
    floor: "3rd Floor",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: [
      "Digital Electronics Lab", "Micro Controller Lab", "Microcontroller Lab", "Embedded Systems Lab",
      "Micro wave and Antenna Lab", "Microwave and Antenna Lab", "Mitsubishi Lab", "ETE Mitsubishi Lab",
      "ETE Embedded Systems Lab", "ETE Microcontroller Lab", "E&TE Mitsubishi Lab", "DES 506"
    ]
  },
  {
    roomNumber: "DES-507",
    name: "Automation Lab / Process Control & Instrumentation Lab",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Lab",
    category: "Lab",
    aliases: [
      "Automation Lab", "Process Control & Instrumentation Lab", "Process Control Lab",
      "Instrumentation Lab", "PCI Lab", "EIE Automation Lab", "E&IE Automation Lab",
      "EIE Process Control Lab", "DES 507"
    ]
  },
  {
    roomNumber: "DES-508",
    name: "Board Room - I / II",
    floor: "3rd Floor",
    department: "E&IE",
    departments: ["E&IE", "EIE", "Electronics & Instrumentation Engineering"],
    type: "Board Room",
    category: "Seminar Hall",
    aliases: ["Board Room - I / II", "Board Room 1", "Board Room 2", "DES Board Room", "EIE Board Room", "E&IE Board Room", "Board Room I", "Board Room II", "DES 508"]
  },
  {
    roomNumber: "DES-511",
    name: "Faculty Room (E&CE / E&TE)",
    floor: "3rd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "E&TE", "ETE", "Electronics & Communication Engineering"],
    type: "Office",
    category: "Faculty Space",
    aliases: ["Faculty Room (E&CE / E&TE)", "ECE Faculty Room", "ETE Faculty Room", "DES 511"]
  },
  {
    roomNumber: "DES-512",
    name: "Board Room / Seminar Hall",
    floor: "3rd Floor",
    department: "DES",
    departments: ["DES"],
    type: "Board Room",
    category: "Seminar Hall",
    aliases: ["DES 512", "DES-512", "Seminar Hall", "DES Board Room", "DES Seminar Hall 512"]
  },

  // Department Libraries
  {
    roomNumber: "DES-302",
    name: "Dept of CSE Department Library",
    floor: "1st Floor",
    department: "CSE",
    departments: ["CSE", "Computer Science & Engineering"],
    type: "Library",
    category: "Library",
    aliases: ["CSE Department Library", "CSE Dept Library", "CSE Library DES", "DES-302 Library", "DES 302 Library", "Department Library CSE", "CSE Library", "DES 302"]
  },
  {
    roomNumber: "DES-311-LIB",
    name: "Dept of ISE Department Library",
    floor: "1st Floor",
    department: "ISE",
    departments: ["ISE", "Information Science & Engineering"],
    type: "Library",
    category: "Library",
    aliases: ["ISE Department Library", "ISE Dept Library", "ISE Library DES", "DES-311 Library", "DES 311 Library", "Department Library ISE", "ISE Library", "DES 311 LIB"]
  },
  {
    roomNumber: "DES-412",
    name: "Dept of ECE Department Library",
    floor: "2nd Floor",
    department: "E&CE",
    departments: ["E&CE", "ECE", "Electronics & Communication Engineering"],
    type: "Library",
    category: "Library",
    aliases: ["ECE Department Library", "E&CE Department Library", "ECE Dept Library", "DES-412 Library", "DES 412 Library", "Department Library ECE", "ECE Library", "E&CE Library", "DES 412"]
  },
  {
    roomNumber: "DES-510",
    name: "Dept of ETE Department Library",
    floor: "3rd Floor",
    department: "E&TE",
    departments: ["E&TE", "ETE", "Electronics & Telecommunication Engineering"],
    type: "Library",
    category: "Library",
    aliases: ["ETE Department Library", "E&TE Department Library", "ETE Dept Library", "DES-510 Library", "DES 510 Library", "Department Library ETE", "ETE Library", "E&TE Library", "DES 510"]
  }
];

const generatedRooms = verifiedDesRoomList.map(r => ({
  roomNumber: r.roomNumber,
  name: r.name,
  building: "DES Block",
  buildingCode: "DES",
  floor: r.floor || calculateCampusPulseFloor(r.roomNumber),
  department: r.department,
  departments: r.departments,
  type: r.type,
  category: r.category,
  aliases: r.aliases,
  sourceTitle: "DES Block Directory Board",
  sourceYear: 2026,
  verified: true,
  temporalStatus: "current",
  roomNumberNormalized: normalizeRoomNumber(r.roomNumber),
  normalizedName: r.name.toLowerCase().trim()
}));

// Enhance Stardust Lab aliases in nonDesRooms
for (const r of nonDesRooms) {
  if (r.roomNumber === 'AB-513' || (r.name && r.name.toLowerCase().includes('stardust'))) {
    r.name = "Dept of E&CE - S.T.A.R.D.U.S.T Lab";
    r.department = "E&CE";
    r.departments = ["E&CE", "ECE", "Electronics & Communication Engineering"];
    r.floor = "3rd Floor";
    r.category = "Lab";
    r.aliases = [
      "Stardust Lab", "S.T.A.R.D.U.S.T Lab", "STARDUST Lab", "Stardust Laboratory",
      "Stardust", "STAR DUST Lab", "STARDUST", "AB-513 Stardust", "AB 513", "AB-513",
      "Stardust Lab ECE", "ECE Stardust Lab"
    ];
  }
  if (r.roomNumber === 'AB-714') {
    r.aliases = [
      "Apex Library", "Apex Block Library", "Apex First Year Library", "First Year Library",
      "1st Year Library", "Apex 1st Year Library", "Apex Library & Information Center",
      "Library & Information Center (First year)", "AB 714", "AB-714"
    ];
  }
  if (r.roomNumber === 'AB-401') {
    r.aliases = [
      "MCA Library", "MCA Department Library", "MCA Dept Library", "Dept of MCA Library",
      "Department of MCA Library", "AB 401", "AB-401"
    ];
  }
}

const finalRooms = [...nonDesRooms, ...generatedRooms];

const updatedJson = {
  lastVerified: "2026-09-30",
  source: "Official MSRIT website and verified directory boards",
  rooms: finalRooms
};

fs.writeFileSync(roomsJsonPath, JSON.stringify(updatedJson, null, 2), 'utf8');
console.log(`✅ Successfully wrote ${finalRooms.length} total rooms (${generatedRooms.length} DES rooms).`);
