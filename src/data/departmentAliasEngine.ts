import type { MSRITFacultyRecord } from './facultyData';

export interface DepartmentAliasRecord {
  code: string;
  primaryName: string;
  officialNames: string[];
  aliases: string[];
  building: string;
  buildingId: string;
  nodeId: string;
}

export const DEPARTMENT_ALIAS_RECORDS: DepartmentAliasRecord[] = [
  {
    code: 'EEE',
    primaryName: 'Electrical & Electronics Engineering',
    officialNames: ['Electrical & Electronics Engineering', 'Electrical and Electronics Engineering', 'EEE'],
    aliases: [
      'eee', 'ee', 'ee&e', 'e.e.e', 'e e e', 'e & e e',
      'electrical', 'electrical and electronics engineering',
      'electrical & electronics engineering', 'electrical electronics engineering',
      'electrical and electronics', 'electrical & electronics', 'electrical electronics'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'CSE',
    primaryName: 'Computer Science & Engineering',
    officialNames: ['Computer Science & Engineering', 'Computer Science and Engineering', 'CSE'],
    aliases: [
      'cse', 'cs', 'c.s.e', 'c s e', 'comp sci',
      'computer science', 'computer science and engineering',
      'computer science & engineering', 'computer science engineering'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'ISE',
    primaryName: 'Information Science & Engineering',
    officialNames: ['Information Science & Engineering', 'Information Science and Engineering', 'ISE'],
    aliases: [
      'ise', 'i.s.e', 'i s e', 'info sci', 'info science',
      'information science', 'information science and engineering',
      'information science & engineering', 'information science engineering'
    ],

    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'ECE',
    primaryName: 'Electronics & Communication Engineering',
    officialNames: ['Electronics & Communication Engineering', 'Electronics and Communication Engineering', 'ECE'],
    aliases: [
      'ece', 'ec', 'e.c.e', 'e c e',
      'electronics and communication engineering', 'electronics & communication engineering',
      'electronics communication engineering', 'electronics and communication',
      'electronics & communication', 'electronics communication'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'ET',
    primaryName: 'Electronics & Telecommunication Engineering',
    officialNames: ['Electronics & Telecommunication Engineering', 'Electronics and Telecommunication Engineering', 'ET', 'ETE'],
    aliases: [
      'et', 'ete', 'e&t', 'e.t', 'e t', 'telecom', 'telecommunication',
      'electronics and telecommunication engineering', 'electronics & telecommunication engineering',
      'electronics telecommunication engineering', 'electronics and telecommunication',
      'electronics & telecommunication', 'electronics telecommunication'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'EI',
    primaryName: 'Electronics & Instrumentation Engineering',
    officialNames: ['Electronics & Instrumentation Engineering', 'Electronics and Instrumentation Engineering', 'EI', 'EIE'],
    aliases: [
      'ei', 'eie', 'e&i', 'e.i', 'e i', 'instrumentation',
      'electronics and instrumentation engineering', 'electronics & instrumentation engineering',
      'electronics instrumentation engineering', 'electronics and instrumentation',
      'electronics & instrumentation', 'electronics instrumentation'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'ME',
    primaryName: 'Medical Electronics Engineering',
    officialNames: ['Medical Electronics Engineering', 'Medical Electronics', 'ME', 'MLE'],
    aliases: [
      'me', 'mle', 'med ele', 'medical electronics', 'medical electronics engineering',
      'medical electronics dept', 'medical electronics department'
    ],
    building: 'LHC',
    buildingId: 'block-lhc',
    nodeId: 'lhc_block'
  },
  {
    code: 'AIML',
    primaryName: 'Artificial Intelligence & Machine Learning',
    officialNames: [
      'Artificial Intelligence & Machine Learning',
      'Artificial Intelligence and Machine Learning',
      'Computer Science & Engineering (AI & ML)',
      'CSE AIML',
      'AIML'
    ],
    aliases: [
      'aiml', 'ai-ml', 'ai & ml', 'ai and ml', 'ai ml',
      'artificial intelligence', 'artificial intelligence and machine learning',
      'artificial intelligence & machine learning', 'cse aiml', 'cse ai ml', 'cse ai & ml'
    ],
    building: 'CRD',
    buildingId: 'block-crd',
    nodeId: 'crd_block'
  },
  {
    code: 'CY',
    primaryName: 'Computer Science & Engineering (Cyber Security)',
    officialNames: [
      'Computer Science & Engineering (Cyber Security)',
      'CSE CY',
      'CY',
      'Cyber Security'
    ],
    aliases: [
      'cy', 'cse cy', 'cyber security', 'cyber', 'cse cyber security', 'cse cyber'
    ],
    building: 'CRD',
    buildingId: 'block-crd',
    nodeId: 'crd_block'
  },
  {
    code: 'CV',
    primaryName: 'Civil Engineering',
    officialNames: ['Civil Engineering', 'CV'],
    aliases: ['cv', 'civil', 'civil engineering', 'civil dept'],
    building: 'ESB',
    buildingId: 'block-esb',
    nodeId: 'esb_entrance'
  },
  {
    code: 'BT',
    primaryName: 'Biotechnology',
    officialNames: ['Biotechnology', 'BT', 'Biotech'],
    aliases: ['bt', 'biotech', 'biotechnology', 'biotech dept'],
    building: 'ESB',
    buildingId: 'block-esb',
    nodeId: 'esb_entrance'
  },
  {
    code: 'IND',
    primaryName: 'Industrial Engineering & Management',
    officialNames: ['Industrial Engineering & Management', 'Industrial Engineering and Management', 'IEM', 'IND'],
    aliases: [
      'iem', 'ind', 'industrial', 'industrial engineering',
      'industrial engineering & management', 'industrial engineering and management'
    ],
    building: 'ESB',
    buildingId: 'block-esb',
    nodeId: 'esb_entrance'
  },
  {
    code: 'MECH',
    primaryName: 'Mechanical Engineering',
    officialNames: ['Mechanical Engineering', 'Mechanical'],
    aliases: ['mechanical', 'mechanical engineering', 'mech', 'mech engineering'],
    building: 'Mechanical',
    buildingId: 'block-mechanical',
    nodeId: 'mech_block'
  },
  {
    code: 'ARCH',
    primaryName: 'Architecture',
    officialNames: ['Architecture', 'School of Architecture'],
    aliases: ['arch', 'architecture', 'school of architecture', 'b arch', 'barch'],
    building: 'Architecture',
    buildingId: 'block-architecture',
    nodeId: 'arch_block'
  },
  {
    code: 'MBA',
    primaryName: 'Management Studies (MBA)',
    officialNames: ['Management Studies (MBA)', 'MBA'],
    aliases: ['mba', 'management studies', 'management', 'dept of mba'],
    building: 'Apex',
    buildingId: 'block-apex',
    nodeId: 'apex_entrance'
  },
  {
    code: 'MCA',
    primaryName: 'Master of Computer Applications (MCA)',
    officialNames: ['Master of Computer Applications (MCA)', 'MCA'],
    aliases: ['mca', 'master of computer applications', 'computer applications'],
    building: 'Apex',
    buildingId: 'block-apex',
    nodeId: 'apex_entrance'
  },
  {
    code: 'AERO',
    primaryName: 'Aerospace Engineering',
    officialNames: ['Aerospace Engineering'],
    aliases: ['aero', 'aerospace', 'aerospace engineering'],
    building: 'ESB',
    buildingId: 'block-esb',
    nodeId: 'esb_entrance'
  },
  {
    code: 'AIDS',
    primaryName: 'Artificial Intelligence & Data Science',
    officialNames: ['Artificial Intelligence & Data Science', 'Artificial Intelligence and Data Science'],
    aliases: ['aids', 'ai & ds', 'ai-ds', 'ai and ds', 'data science'],
    building: 'CRD',
    buildingId: 'block-crd',
    nodeId: 'crd_block'
  },
  {
    code: 'CH',
    primaryName: 'Chemical Engineering',
    officialNames: ['Chemical Engineering'],
    aliases: ['chemical', 'chemical engineering', 'chem eng'],
    building: 'ESB',
    buildingId: 'block-esb',
    nodeId: 'esb_entrance'
  },
  {
    code: 'CHEMISTRY',
    primaryName: 'Chemistry',
    officialNames: ['Chemistry'],
    aliases: ['chemistry', 'chem', 'dept of chemistry'],
    building: 'Basic Sciences',
    buildingId: 'block-basic-sciences',
    nodeId: 'central_foyer'
  },
  {
    code: 'PHYSICS',
    primaryName: 'Physics',
    officialNames: ['Physics'],
    aliases: ['physics', 'phy', 'dept of physics'],
    building: 'Basic Sciences',
    buildingId: 'block-basic-sciences',
    nodeId: 'central_foyer'
  },
  {
    code: 'MATHS',
    primaryName: 'Mathematics',
    officialNames: ['Mathematics'],
    aliases: ['mathematics', 'maths', 'math', 'dept of mathematics'],
    building: 'Basic Sciences',
    buildingId: 'block-basic-sciences',
    nodeId: 'central_foyer'
  },
  {
    code: 'HUMANITIES',
    primaryName: 'Humanities',
    officialNames: ['Humanities'],
    aliases: ['humanities', 'hum'],
    building: 'Basic Sciences',
    buildingId: 'block-basic-sciences',
    nodeId: 'central_foyer'
  }
];

/**
 * Normalizes input text for department matching.
 * Tolerates dots, hyphens, ampersands, extra spaces, and common query noise words.
 */
export function normalizeDepartmentQuery(query: string): string {
  if (!query) return '';
  return query
    .toLowerCase()
    .trim()
    .replace(/[’'"`]/g, '')
    .replace(/\b(department|dept|branch|wing|faculty|teachers|professors|hod|head|email|mail|ka|ke|ki|dikhao|batao|kaha|kidhar|show|list|find|of|the|in|for)\b/gi, ' ')
    .replace(/[.\-\/]/g, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds department record by exact code, official name, or alias.
 * Strict boundary check: ME must NOT match Mechanical!
 */
export function getDepartmentRecord(query: string): DepartmentAliasRecord | null {
  if (!query) return null;
  const rawLower = query.toLowerCase().trim();
  const norm = normalizeDepartmentQuery(query);

  // Safety constraint: Mechanical explicitly checked to prevent ME collision
  if (/\b(mechanical|mech)\b/i.test(query)) {
    return DEPARTMENT_ALIAS_RECORDS.find((r) => r.code === 'MECH') || null;
  }

  // 1. Exact match on code (e.g. "EEE", "CSE", "ME")
  const exactCodeMatch = DEPARTMENT_ALIAS_RECORDS.find((r) => r.code.toLowerCase() === rawLower);
  if (exactCodeMatch) return exactCodeMatch;

  // 2. Exact match on official stored names
  for (const record of DEPARTMENT_ALIAS_RECORDS) {
    for (const offName of record.officialNames) {
      if (offName.toLowerCase() === rawLower) {
        return record;
      }
    }
  }

  // 3. Exact match on normalized alias or official name
  for (const record of DEPARTMENT_ALIAS_RECORDS) {
    for (const offName of record.officialNames) {
      if (normalizeDepartmentQuery(offName) === norm) {
        return record;
      }
    }
    for (const alias of record.aliases) {
      if (normalizeDepartmentQuery(alias) === norm) {
        return record;
      }
    }
  }

  // 4. Substring / Word-boundary alias match (e.g. "ee ka hod", "computer science faculty")
  for (const record of DEPARTMENT_ALIAS_RECORDS) {
    for (const alias of record.aliases) {
      const normAlias = normalizeDepartmentQuery(alias);
      if (normAlias && norm.includes(normAlias)) {
        return record;
      }
    }
  }

  return null;
}

/**
 * Resolves a query/alias to the official department name present in the dataset.
 */
export function resolveOfficialDepartmentName(
  query: string,
  availableDepartments?: string[]
): string | null {
  const record = getDepartmentRecord(query);
  if (!record) return null;

  if (availableDepartments && availableDepartments.length > 0) {
    // Return the matching stored official name from the available dataset
    const matchedOfficial = availableDepartments.find((d) => {
      const dNorm = normalizeDepartmentQuery(d);
      return record.officialNames.some((off) => normalizeDepartmentQuery(off) === dNorm) || d.toLowerCase() === record.primaryName.toLowerCase();
    });
    if (matchedOfficial) return matchedOfficial;
  }

  return record.officialNames[0] || record.primaryName;
}

/**
 * Retrieves all valid aliases and abbreviations for a given department.
 */
export function getDepartmentAliases(departmentOrCode: string): string[] {
  const record = getDepartmentRecord(departmentOrCode);
  if (!record) return [departmentOrCode];
  return Array.from(new Set([...record.officialNames, ...record.aliases]));
}

/**
 * Filters faculty records by department query using smart alias matching.
 */
export function filterFacultyByDepartment(
  facultyList: MSRITFacultyRecord[],
  deptQuery: string
): MSRITFacultyRecord[] {
  if (!deptQuery || deptQuery.toUpperCase() === 'ALL') return facultyList;

  const record = getDepartmentRecord(deptQuery);
  if (!record) {
    const normQ = normalizeDepartmentQuery(deptQuery);
    return facultyList.filter((f) => {
      const d = normalizeDepartmentQuery(f.department || '');
      return d.includes(normQ);
    });
  }

  return facultyList.filter((f) => {
    const fDept = f.department || '';
    const fNorm = normalizeDepartmentQuery(fDept);

    // EEE strict isolation
    if (record.code === 'EEE') {
      return (
        fNorm.includes('electrical') ||
        fNorm.includes('eee') ||
        fNorm.includes('ee')
      ) && !fNorm.includes('electronics & communication') && !fNorm.includes('electronics & instrumentation') && !fNorm.includes('electronics & telecommunication');
    }

    // CSE strict isolation (exclude AIML and CY)
    if (record.code === 'CSE') {
      return (fNorm.includes('computer science') || fNorm.includes('cse')) && !fNorm.includes('ai') && !fNorm.includes('cyber');
    }

    // AIML strict isolation
    if (record.code === 'AIML') {
      return fNorm.includes('ai') || fNorm.includes('artificial');
    }

    // CY strict isolation
    if (record.code === 'CY') {
      return fNorm.includes('cyber');
    }

    // Medical Electronics strict isolation (exclude Mechanical)
    if (record.code === 'ME') {
      return (fNorm.includes('medical electronics') || fNorm === 'me' || fNorm === 'mle') && !fNorm.includes('mechanical');
    }

    // Mechanical strict isolation
    if (record.code === 'MECH') {
      return fNorm.includes('mechanical');
    }

    // General matching against official names & aliases
    return record.officialNames.some((off) => normalizeDepartmentQuery(off) === fNorm) || record.aliases.some((al) => normalizeDepartmentQuery(al) === fNorm);
  });
}
