import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import { connectDB } from '../config/db.js';
import { normalizeRoomNumber } from '../utils/roomUtils.js';
import { Faculty } from '../models/Faculty.js';
import { Library } from '../models/Library.js';
import { LibraryOccupancy } from '../models/LibraryOccupancy.js';
import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { LostFound } from '../models/LostFound.js';
import { INITIAL_LOST_FOUND_SEED } from '../controllers/lostFoundController.js';

// Buildings verified data
const VERIFIED_BUILDINGS = [
  {
    id: 'lhc',
    name: 'Lecture Hall Complex',
    shortName: 'LHC',
    description: 'Central academic complex housing Lecture Halls, CSE, Medical Electronics, and Central Library LHC branch.',
    departments: ['Computer Science & Engineering', 'Medical Electronics Engineering', 'Information Science & Engineering'],
    coordinates: { lat: 13.03138955, lng: 77.5646098 },
    polygon: [
      { lat: 13.0315921, lng: 77.5646349 },
      { lat: 13.0316447, lng: 77.5649916 },
      { lat: 13.0312396, lng: 77.5650418 },
      { lat: 13.0311870, lng: 77.5645847 },
      { lat: 13.0315921, lng: 77.5646349 }
    ],
    facilities: ['Lecture Halls', 'Subhashini Language Lab', 'LHC Library (Room 306)', 'Department Labs']
  },
  {
    id: 'des',
    name: 'Deshmukh Block',
    shortName: 'DES',
    description: 'Houses Electronics & Communication, Telecommunication, and Electrical & Electronics departments.',
    departments: ['Electronics & Communication Engineering', 'Electrical & Electronics Engineering', 'Telecommunication Engineering'],
    coordinates: { lat: 13.03056025, lng: 77.56447055 },
    polygon: [
      { lat: 13.0307628, lng: 77.5644956 },
      { lat: 13.0308154, lng: 77.5648523 },
      { lat: 13.0304103, lng: 77.5649025 },
      { lat: 13.0303577, lng: 77.5644455 },
      { lat: 13.0307628, lng: 77.5644956 }
    ],
    facilities: ['VLSI Labs', 'Signal Processing Labs', 'Department Staff Cabins']
  },
  {
    id: 'apex',
    name: 'Apex Block',
    shortName: 'Apex',
    description: 'Houses MCA, Mathematics, Basic Sciences, 1st Year classrooms, and Apex Library.',
    departments: ['Master of Computer Applications', 'Mathematics', 'Physics', 'Chemistry', 'Humanities'],
    coordinates: { lat: 13.029731, lng: 77.5643313 },
    polygon: [
      { lat: 13.0299335, lng: 77.5643563 },
      { lat: 13.0299861, lng: 77.5647130 },
      { lat: 13.0295810, lng: 77.5647632 },
      { lat: 13.0295284, lng: 77.5643063 },
      { lat: 13.0299335, lng: 77.5643563 }
    ],
    facilities: ['Apex Library (5th Level)', 'MCA Labs', 'Basic Science Labs', 'Seminar Halls']
  },
  {
    id: 'mpb',
    name: 'Multipurpose Block',
    shortName: 'Multipurpose Block',
    description: 'Central administrative offices, Auditorium, Board Rooms, and examination centers.',
    departments: ['Administration', 'Examinations', 'Placement Cell'],
    coordinates: { lat: 13.0322188, lng: 77.56474905 },
    polygon: [
      { lat: 13.0324213, lng: 77.5647741 },
      { lat: 13.0324739, lng: 77.5651308 },
      { lat: 13.0320688, lng: 77.5651810 },
      { lat: 13.0320162, lng: 77.5647240 },
      { lat: 13.0324213, lng: 77.5647741 }
    ],
    facilities: ['Main Auditorium', 'Registrar Office', 'Placement Hall', 'Board Room']
  },
  {
    id: 'esb',
    name: 'Engineering Sciences Block',
    shortName: 'ESB',
    description: 'Houses Mechanical, Civil, Chemical, Biotechnology, Industrial Engineering, and ESB Library.',
    departments: ['Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Industrial Engineering & Management'],
    coordinates: { lat: 13.0289017, lng: 77.56419205 },
    polygon: [
      { lat: 13.0291042, lng: 77.5642171 },
      { lat: 13.0291568, lng: 77.5645738 },
      { lat: 13.0287517, lng: 77.5646240 },
      { lat: 13.0286991, lng: 77.5641670 },
      { lat: 13.0291042, lng: 77.5642171 }
    ],
    facilities: ['ESB Library (4th Level)', 'Heavy Engineering Labs', 'Research Centers']
  },
  {
    id: 'quadrangle',
    name: 'Campus Quadrangle',
    shortName: 'Quadrangle',
    description: 'Central open gathering plaza connecting LHC, DES, and Apex blocks.',
    departments: ['Student Affairs', 'Sports & Cultural'],
    coordinates: { lat: 13.03014565, lng: 77.5644009 },
    polygon: [
      { lat: 13.0303482, lng: 77.5644260 },
      { lat: 13.0304008, lng: 77.5647827 },
      { lat: 13.0299957, lng: 77.5648329 },
      { lat: 13.0299431, lng: 77.5643759 },
      { lat: 13.0303482, lng: 77.5644260 }
    ],
    facilities: ['Open Amphitheater', 'Student Lounges', 'Event Grounds']
  },
  {
    id: 'arch',
    name: 'Architecture Block',
    shortName: 'Architecture Block',
    description: 'School of Architecture studios, design labs, and material library.',
    departments: ['Architecture'],
    coordinates: { lat: 13.02807245, lng: 77.5640528 },
    polygon: [
      { lat: 13.0282750, lng: 77.5640778 },
      { lat: 13.0283276, lng: 77.5644345 },
      { lat: 13.0279225, lng: 77.5644847 },
      { lat: 13.0278699, lng: 77.5640278 },
      { lat: 13.0282750, lng: 77.5640778 }
    ],
    facilities: ['Design Studios', 'Exhibition Hall', 'Model Making Workshop']
  },
  {
    id: 'workshop',
    name: 'Workshop Block',
    shortName: 'Workshop Block',
    description: 'Central mechanical workshop, carpentry, foundry, and CNC machinery facility.',
    departments: ['Mechanical Engineering', 'Manufacturing Engineering'],
    coordinates: { lat: 13.0272432, lng: 77.56391355 },
    polygon: [
      { lat: 13.0274457, lng: 77.5639386 },
      { lat: 13.0274983, lng: 77.5642953 },
      { lat: 13.0270932, lng: 77.5643455 },
      { lat: 13.0270406, lng: 77.5638885 },
      { lat: 13.0274457, lng: 77.5639386 }
    ],
    facilities: ['CNC Machining Center', 'Foundry Shop', 'Welding & Carpentry Labs']
  }
];

// Exactly THREE libraries
const LIBRARIES = [
  {
    id: 'esb_main_library',
    name: 'ESB Library',
    building: 'ESB Block',
    primaryUsers: ['1st Year', 'Above 1st Year', 'Mainly Non-CSE'],
    capacity: 538,
    digitalWorkstations: '60 TFT Workstations',
    facilities: ['Textbooks', 'Reference volumes', 'Research terminals', 'Reading carrels', 'DSpace & E-Learning Servers'],
    openingHours: '09:00–21:00 Daily',
    openingTime: '09:00',
    closingTime: '21:00',
    location: '4th Level, ESB Block'
  },
  {
    id: 'lhc_unit_2_library',
    name: 'LHC Library',
    building: 'LHC Block',
    primaryUsers: ['CSE', 'Electronics'],
    capacity: 538,
    digitalWorkstations: '61 Workstations',
    facilities: ['CSE Textbooks', 'IEEE Research Access', 'Subhashini Language Lab', 'Technical journals'],
    openingHours: '09:00–21:00 Daily',
    openingTime: '09:00',
    closingTime: '21:00',
    location: '1st Floor (Room LHC-306), LHC Block'
  },
  {
    id: 'apex_unit_3_library',
    name: 'Apex Library',
    building: 'Apex Block',
    primaryUsers: ['1st Year'],
    capacity: 64,
    digitalWorkstations: '02 Workstations',
    facilities: ['1st Year Textbooks', 'Foundational science reference holdings', 'Quiet study cubicles'],
    openingHours: '09:00–21:00 Daily',
    openingTime: '09:00',
    closingTime: '21:00',
    location: '5th Level, Apex Block'
  }
];

// Sample issues
const SAMPLE_ISSUES = [
  {
    id: 'iss-demo-01',
    title: 'Flickering Overhead Tube Light',
    category: 'Electricity',
    description: 'Two fluorescent fixtures in row 3 flicker intermittently during evening lectures.',
    location: 'LHC Block, Room 204',
    priority: 'Low',
    status: 'Under Review',
    reportedBy: 'Udbhav Verma'
  },
  {
    id: 'iss-demo-02',
    title: 'Water Dispenser Sensor Malfunction',
    category: 'Water',
    description: 'Drinking water station sensor does not detect bottles reliably; continuous slow drip.',
    location: 'ESB Block, 2nd Floor Corridor',
    priority: 'Medium',
    status: 'In Progress',
    reportedBy: 'Ravnish Sekhar'
  },
  {
    id: 'iss-demo-03',
    title: 'Weak Wi-Fi Signal Near Study Pods',
    category: 'Internet / Wi-Fi',
    description: 'Access point coverage drops below -82dBm near the quiet study pods on the north side.',
    location: 'Apex Block, Library Reading Hall',
    priority: 'High',
    status: 'Reported',
    reportedBy: 'Shivam Kr Chaudhary'
  },
  {
    id: 'iss-demo-04',
    title: 'Broken Bench Armrest Replaced',
    category: 'Infrastructure',
    description: 'Outdoor wooden seating armrest repaired and revarnished by campus carpentry dispatch.',
    location: 'Campus Quadrangle Plaza',
    priority: 'Low',
    status: 'Resolved',
    reportedBy: 'Varad Adavakar'
  },
  {
    id: 'iss-demo-05',
    title: 'Projector HDMI Loose Connection',
    category: 'Classroom',
    description: 'Wall plate HDMI port cuts signal intermittently when connecting laptops at the podium.',
    location: 'LHC Block, Seminar Hall 1',
    priority: 'High',
    status: 'Under Review',
    reportedBy: 'Sagnik'
  }
];
export async function seedDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('🌱 Starting database seeding process...');
    const facultyPath = path.join(__dirname, '../../../src/data/faculty_msrit_dynamic.json');
    const fallbackPath = path.join(__dirname, '../../../faculty_msrit.json');
    let facultyData = [];
    if (fs.existsSync(facultyPath)) {
      facultyData = JSON.parse(fs.readFileSync(facultyPath, 'utf8'));
    } else if (fs.existsSync(fallbackPath)) {
      facultyData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    }

    if (facultyData.length > 0) {
      const facultyOps = facultyData.map((item) => ({
        updateOne: {
          filter: { id: item.id },
          update: {
            $set: {
              id: item.id,
              name: item.name,
              designation: item.designation,
              department: item.department,
              email: item.email || `${item.id}@msrit.edu`,
              cabinLocation: item.cabinLocation || item.location || 'Department Wing',
              nodeId: item.nodeId || item.id,
              avatarUrl: item.avatarUrl || null,
              todaySchedule: item.todaySchedule || [],
              status: item.status || 'Available in Cabin',
              currentLocation: item.currentLocation || null,
              nextAvailableTime: item.nextAvailableTime || 'Now (Consultation Open)'
            }
          },
          upsert: true
        }
      }));
      await Faculty.bulkWrite(facultyOps);
      console.log(`✅ Seeded ${facultyData.length} faculty records (100% preserved).`);
    } else {
      console.warn('⚠️ No faculty JSON file found for seeding!');
    }

    // 2. Seed Libraries
    const libraryOps = LIBRARIES.map((lib) => ({
      updateOne: {
        filter: { id: lib.id },
        update: { $set: lib },
        upsert: true
      }
    }));
    await Library.bulkWrite(libraryOps);
    console.log(`✅ Seeded ${LIBRARIES.length} libraries (ESB, LHC, Apex).`);

    // 3. Initial Occupancy
    const countOccupancies = await LibraryOccupancy.countDocuments();
    if (countOccupancies === 0) {
      const initialOccupancies = [
        { libraryId: 'esb_main_library', occupancyPercentage: 45, source: 'estimated' },
        { libraryId: 'lhc_unit_2_library', occupancyPercentage: 62, source: 'estimated' },
      ];
      for (const occ of initialOccupancies) {
        await LibraryOccupancy.create(occ);
      }
      console.log(`✅ Seeded initial library occupancies.`);
    }

    // 4. Seed Buildings
    const buildingOps = VERIFIED_BUILDINGS.map((bldg) => ({
      updateOne: {
        filter: { id: bldg.id },
        update: { $set: bldg },
        upsert: true
      }
    }));


    await Building.bulkWrite(buildingOps);
    console.log(`✅ Seeded ${VERIFIED_BUILDINGS.length} campus buildings.`);

    // 5. Seed Rooms
    const roomsPath = path.join(__dirname, '../../../src/data/msrit_rooms.json');
    if (fs.existsSync(roomsPath)) {
      const roomJson = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
      if (roomJson.rooms && Array.isArray(roomJson.rooms)) {
        // Clean up conflicting legacy records if present
        await Room.deleteMany({
          roomNumber: { $in: ['LHC Seminar Hall 1', 'LHC Seminar Hall 2', 'LHC-217'] }
        });

        const roomOps = roomJson.rooms.map((room) => ({
          updateOne: {
            filter: { roomNumber: room.roomNumber },
            update: {
              $set: {
                ...room,
                roomNumberNormalized: normalizeRoomNumber(room.roomNumber),
                normalizedName: (room.name || '').toLowerCase().trim()
              }
            },
            upsert: true
          }
        }));
        await Room.bulkWrite(roomOps);
        console.log(`✅ Seeded ${roomJson.rooms.length} verified rooms (including all LHC & CRD verified records).`);
      }
    }


    // 6. Seed Issues
    for (const issue of SAMPLE_ISSUES) {
      await Issue.findOneAndUpdate(
        { id: issue.id },
        { $set: issue },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${SAMPLE_ISSUES.length} sample issue reports.`);

    for (const lf of INITIAL_LOST_FOUND_SEED) {
      await LostFound.findOneAndUpdate(
        { id: lf.id },
        { $setOnInsert: lf },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${INITIAL_LOST_FOUND_SEED.length} sample Lost & Found records.`);

    const adminEmail = 'admin@campuspulse.edu';
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: 'System Admin',
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: 'admin'
        }
      },
      { upsert: true }
    );

    const studentEmail = 'student@campuspulse.edu';
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);
    await User.findOneAndUpdate(
      { email: studentEmail },
      {
        $set: {
          name: 'Demo Student',
          email: studentEmail,
          passwordHash: studentPasswordHash,
          role: 'student'
        }
      },
      { upsert: true }
    );

    console.log(`✅ Seeded default users:`);
    console.log(`   - Admin: ${adminEmail} (password: Admin@123)`);
    console.log(`   - Student: ${studentEmail} (password: Student@123)`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
