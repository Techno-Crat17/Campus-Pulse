const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/msritFaculty.json');
const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Filter rules for valid faculty names
const cleaned = [];
const seenNames = new Set();

for (const item of rawData) {
  let name = item.name.trim();

  // Skip invalid/scraped sentence snippets
  if (
    name.includes('received') ||
    name.includes('obtained') ||
    name.includes('published') ||
    name.includes('currently') ||
    name.includes('himself') ||
    name.endsWith('and Dr.') ||
    name.includes('Head of Department (') ||
    name === 'Dr. M.S.'
  ) {
    continue;
  }

  // Handle combined names like "Dr. Aravinda CL. Rao and Dr. Raji George"
  if (name.includes(' and ')) {
    const parts = name.split(' and ');
    name = parts[0].trim();
  }

  // Clean trailing punctuation
  name = name.replace(/\.$/, '');

  if (seenNames.has(name.toLowerCase())) continue;
  seenNames.add(name.toLowerCase());

  item.name = name;
  cleaned.push(item);
}

// Re-assign IDs sequentially
cleaned.forEach((fac, idx) => {
  fac.id = `msrit-fac-${idx + 1}`;
});

fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`Cleaned dataset from ${rawData.length} records to ${cleaned.length} verified records.`);
