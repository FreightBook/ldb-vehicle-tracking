const axios = require('axios');

const LDB_SEARCH_URL = process.env.LDB_API_URL || 'https://ldb.co.in/api/ldbv2/truck/search';

/**
 * Parses LDB timestamp format "YYYY-MM-DD HH:mm:ss.SSS" or standard dates into Date object
 */
function parseEventTimestamp(timeStr) {
  if (!timeStr) return new Date();
  // Format typically: "2026-10-31 04:30:54.000"
  const clean = timeStr.trim().replace(' ', 'T');
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

/**
 * Fetch truck toll crossing events from LDB API
 * @param {string} vehicleNumber - e.g. "TN74BE7362"
 * @returns {Promise<{ success: boolean, events: Array, rawMessage: string, code: string }>}
 */
async function fetchLdbTruckEvents(vehicleNumber) {
  const sanitizedVehicle = (vehicleNumber || '').toUpperCase().replace(/[\s-]/g, '');

  try {
    const response = await axios.post(
      LDB_SEARCH_URL,
      { vehiclenumber: sanitizedVehicle },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Origin: 'https://ldb.co.in',
          Referer: 'https://ldb.co.in/ldb/trucksearchlog',
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    // Check if LDB returned success
    if (data && data.status === 'OK' && data.responseBody) {
      const groupEvents = data.responseBody.groupEvents || [];
      const extractedEvents = [];

      for (const group of groupEvents) {
        const list = group.containerGroupingList || [];
        for (const item of list) {
          const locName = (item.locName || 'Unknown Plaza').trim();
          const eventTime = item.eventTime || group.timestamp;
          const lat = parseFloat(item.locLat);
          const lng = parseFloat(item.locLong);

          extractedEvents.push({
            vehicleNumber: sanitizedVehicle,
            eventName: item.eventName || 'TOLL PLAZA CROSSED',
            locName,
            eventTime,
            eventTimestamp: parseEventTimestamp(eventTime),
            seqNo: item.seqNo ? String(item.seqNo).trim() : null,
            laneDirection: item.laneDirection || null,
            locLat: !isNaN(lat) ? lat : null,
            locLong: !isNaN(lng) ? lng : null,
            vehicleType: item.vehicleType || null,
            transportMode: item.transportMode || 'TRUCK',
            containerNumber: item.containerNumber || 'N/A',
          });
        }
      }

      return {
        success: true,
        events: extractedEvents,
        rawMessage: data.message || 'SUCCESS',
        code: data.code || '200',
        truckType: data.responseBody.truckType || null,
      };
    }

    // 404 or NOT_FOUND response
    if (data && (data.status === 'NOT_FOUND' || data.code === '404')) {
      return {
        success: true,
        events: [],
        rawMessage: data.message || 'Truck Details Not Found',
        code: '404',
      };
    }

    return {
      success: false,
      events: [],
      rawMessage: data?.message || 'Unknown response from LDB',
      code: data?.code || '500',
    };
  } catch (err) {
    const errorMsg =
      err.response?.data?.message || err.response?.statusText || err.message;
    const statusCode = err.response?.status ? String(err.response.status) : '500';

    // If 404 from axios
    if (statusCode === '404') {
      return {
        success: true,
        events: [],
        rawMessage: 'Truck Details Not Found on LDB',
        code: '404',
      };
    }

    console.error(`[LDB API Error] Vehicle ${sanitizedVehicle}: ${errorMsg}`);
    return {
      success: false,
      events: [],
      rawMessage: errorMsg,
      code: statusCode,
    };
  }
}

module.exports = {
  fetchLdbTruckEvents,
  parseEventTimestamp,
};

