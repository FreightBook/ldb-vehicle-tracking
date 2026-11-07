const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

const csvPath = path.join(__dirname, '../../AllIndiaPincodeData.csv');
const outPath = path.join(__dirname, '../data/allIndiaPincodes.json.gz');

function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanOfficeName(name) {
  return name
    .replace(/\s+(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?|MDG|PO)$/i, '')
    .replace(/\s+Udham Singh Nagar$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function compile() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Processing ${csvPath}...`);
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  const items = [];
  const seen = new Set();

  for await (const line of rl) {
    if (count++ === 0) continue; // Skip header
    const cols = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((s) => s.replace(/^\"|\"$/g, '').trim());
    if (cols.length >= 11 && cols[9] && cols[9] !== 'NA' && cols[10] && cols[10] !== 'NA') {
      const type = cols[5] || '';
      const delivery = cols[6] || '';
      const rawName = cleanOfficeName(cols[3] || '');
      const rawDist = cols[7] || '';
      const rawState = cols[8] || '';
      const pin = cols[4] || '';

      const lat = parseFloat(cols[9]);
      const lng = parseFloat(cols[10]);

      if (!isNaN(lat) && !isNaN(lng) && lat > 5 && lat < 40 && lng > 65 && lng < 100) {
        const name = titleCase(rawName);
        const dist = titleCase(rawDist);
        const state = titleCase(rawState);

        const key = `${name}|${dist}|${state}|${pin}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);

          // Priority weight: HO=3, SO/PO=2, BO=1; +1 for delivery offices
          let weight = 1;
          if (type.includes('HO') || type.includes('GPO')) weight = 3;
          else if (type.includes('SO') || type.includes('PO')) weight = 2;

          if (delivery.toLowerCase().includes('delivery') && !delivery.toLowerCase().includes('non')) {
            weight += 1;
          }

          // Compact tuple: [name, district, state, pincode, lat, lng, weight]
          items.push([
            name,
            dist,
            state,
            pin,
            Number(lat.toFixed(4)),
            Number(lng.toFixed(4)),
            weight,
          ]);
        }
      }
    }
  }

  console.log(`Extracted ${items.length} valid unique locations.`);

  // Serialize to JSON and compress with Gzip
  const jsonBuffer = Buffer.from(JSON.stringify(items), 'utf-8');
  const gzBuffer = zlib.gzipSync(jsonBuffer, { level: 9 });

  fs.writeFileSync(outPath, gzBuffer);
  const sizeMb = (gzBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`Saved compressed dataset to ${outPath} (${sizeMb} MB)`);
}

compile().catch((err) => {
  console.error('Compilation failed:', err);
  process.exit(1);
});

