const fs = require('fs');
const path = require('path');

const dynamicPath = path.join(__dirname, '../src/data/faculty_msrit_dynamic.json');
const staticPath = path.join(__dirname, '../src/data/faculty_msrit.json');

function updateFacultyData(filePath) {
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const f of data) {
    const d = (f.department || '').toLowerCase();
    if (d.includes('information science') || d === 'ise') {
      f.building = 'DES';
      f.primaryBuilding = 'DES Block';
      f.homeBuilding = 'DES Block';
      f.nodeId = 'block-des';
      if (f.designation && f.designation.toLowerCase().includes('hod')) {
        f.cabinLocation = 'DES Block, 1st Floor, DES-305 (HOD Office)';
      } else {
        const cabinMatch = (f.cabinLocation || '').match(/Cabin\s*(\d+)/i);
        const cabinSuffix = cabinMatch ? `, Cabin ${cabinMatch[1]}` : '';
        f.cabinLocation = `DES Block, 1st Floor, DES-305/303/304/311 (ISE Faculty Room${cabinSuffix})`;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Updated ${filePath} for ISE faculty -> DES Block.`);
}

updateFacultyData(dynamicPath);
updateFacultyData(staticPath);
