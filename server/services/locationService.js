const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let locationsData = null;
const pincodeMap = new Map();
let isLoaded = false;

/**
 * Loads and initializes the All-India dataset in memory.
 */
function initLocationData() {
  if (isLoaded) return;

  const dataPath = path.join(__dirname, '../data/allIndiaPincodes.json.gz');
  if (!fs.existsSync(dataPath)) {
    console.warn(`[LocationService Warning] Data file not found at ${dataPath}. Location lookups disabled.`);
    return;
  }

  const startTime = Date.now();
  try {
    const compressed = fs.readFileSync(dataPath);
    const decompressed = zlib.gunzipSync(compressed);
    const rawItems = JSON.parse(decompressed.toString('utf-8'));

    locationsData = [];

    for (let i = 0; i < rawItems.length; i++) {
      const [name, dist, state, pin, lat, lng, weight] = rawItems[i];
      const entry = {
        name,
        district: dist,
        state,
        pincode: pin,
        lat,
        lng,
        weight: weight || 1,
        // Pre-computed lowercase search text for speed
        searchText: `${name} ${dist} ${state} ${pin}`.toLowerCase(),
      };

      locationsData.push(entry);

      // Index by 6-digit pincode
      if (!pincodeMap.has(pin)) {
        pincodeMap.set(pin, []);
      }
      pincodeMap.get(pin).push(entry);
    }

    isLoaded = true;
    const elapsed = Date.now() - startTime;
    console.log(`[LocationService] Loaded ${locationsData.length} Indian locations in ${elapsed}ms.`);
  } catch (err) {
    console.error(`[LocationService Error] Failed to load dataset: ${err.message}`);
  }
}

// Auto-initialize on module import
initLocationData();

/**
 * Validates 6-digit Indian PIN code format
 */
function isValidIndianPincode(pin) {
  return /^[1-9][0-9]{5}$/.test((pin || '').trim());
}

/**
 * Search locations by City/Town name, District, State, or 6-digit PIN code.
 * @param {string} query
 * @param {number} limit
 * @returns {Array} List of matching locations with coordinates
 */
function searchLocations(query, limit = 10) {
  if (!query || typeof query !== 'string') return [];
  const cleanQ = query.trim().toLowerCase();
  if (cleanQ.length === 0) return [];

  initLocationData();
  if (!locationsData || locationsData.length === 0) return [];

  // 1. Direct O(1) PIN code lookup if 6-digit numeric
  if (isValidIndianPincode(cleanQ) && pincodeMap.has(cleanQ)) {
    const pinMatches = pincodeMap.get(cleanQ) || [];
    return pinMatches
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(formatLocationOutput);
  }

  // 2. Check if query contains an embedded 6-digit PIN code (e.g. "(391775)" or "PIN 391775")
  const embeddedPin = cleanQ.match(/\b([1-9][0-9]{5})\b/);
  if (embeddedPin && pincodeMap.has(embeddedPin[1])) {
    const pinMatches = pincodeMap.get(embeddedPin[1]) || [];
    if (pinMatches.length > 0) {
      return pinMatches
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit)
        .map(formatLocationOutput);
    }
  }

  // 3. Tokenized search across name, district, state, and pincode (sanitizing special characters)
  const sanitized = cleanQ.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const tokens = sanitized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const matched = [];

  for (let i = 0; i < locationsData.length; i++) {
    const item = locationsData[i];
    const full = item.searchText;

    let allMatch = true;
    for (let t = 0; t < tokens.length; t++) {
      if (!full.includes(tokens[t])) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      let score = item.weight * 10;
      const nameLower = item.name.toLowerCase();
      const firstToken = tokens[0];

      if (nameLower === firstToken) {
        score += 80;
      } else if (nameLower.startsWith(firstToken)) {
        score += 45;
      } else if (nameLower.includes(firstToken)) {
        score += 20;
      }

      if (tokens.length > 1) {
        const lastToken = tokens[tokens.length - 1];
        if (item.state.toLowerCase().startsWith(lastToken)) {
          score += 40;
        } else if (item.district.toLowerCase().startsWith(lastToken)) {
          score += 30;
        }
      }

      matched.push({ item, score });
    }
  }

  matched.sort((a, b) => b.score - a.score);

  // Deduplicate by label so we don't show identical town/district/pincode pairs
  const seenLabels = new Set();
  const results = [];

  for (let i = 0; i < matched.length && results.length < limit; i++) {
    const formatted = formatLocationOutput(matched[i].item);
    if (!seenLabels.has(formatted.label)) {
      seenLabels.add(formatted.label);
      results.push(formatted);
    }
  }

  return results;
}

/**
 * Format location item for frontend consumption
 */
function formatLocationOutput(item) {
  const isCityMatchDistrict = item.name.toLowerCase() === item.district.toLowerCase();
  const desc = isCityMatchDistrict
    ? `${item.district}, ${item.state}`
    : `${item.name}, ${item.district}, ${item.state}`;

  return {
    name: item.name,
    city: item.name,
    district: item.district,
    state: item.state,
    pincode: item.pincode,
    lat: item.lat,
    lng: item.lng,
    label: `${desc} (${item.pincode})`,
    cityState: `${item.name}, ${item.state}`,
  };
}

/**
 * Resolve a single location (with lat, lng) from a query string or label.
 */
function resolveLocation(query) {
  if (!query || typeof query !== 'string') return null;
  const results = searchLocations(query, 1);
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  searchLocations,
  resolveLocation,
  isValidIndianPincode,
  initLocationData,
};
