/**
 * Comprehensive Indian commercial freight hubs, logistics centers, ports,
 * and cities with state affiliations and geographic coordinates.
 * Specifying state names prevents confusion when cities share identical names across states.
 */

export const INDIAN_CITIES = [
  // --- Gujarat ---
  { city: 'Vadodara', state: 'Gujarat', pincode: '390001', lat: 22.3072, lng: 73.1812 },
  { city: 'Vadodara (Industrial Estate)', state: 'Gujarat', district: 'Vadodara', pincode: '390016', lat: 22.3036, lng: 73.1977 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { city: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { city: 'Gandhidham', state: 'Gujarat', lat: 23.0753, lng: 70.1337 },
  { city: 'Mundra', state: 'Gujarat', lat: 22.8394, lng: 69.7214 },
  { city: 'Morbi', state: 'Gujarat', lat: 22.8173, lng: 70.8370 },
  { city: 'Vapi', state: 'Gujarat', lat: 20.3712, lng: 72.9044 },
  { city: 'Ankleshwar', state: 'Gujarat', lat: 21.6264, lng: 73.0033 },
  { city: 'Bharuch', state: 'Gujarat', lat: 21.7051, lng: 72.9959 },
  { city: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519 },
  { city: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lng: 70.0577 },
  { city: 'Gandhinagar', state: 'Gujarat', lat: 23.2156, lng: 72.6369 },
  { city: 'Mehsana', state: 'Gujarat', lat: 23.5880, lng: 72.3693 },
  { city: 'Anand', state: 'Gujarat', lat: 22.5645, lng: 72.9289 },
  { city: 'Porbandar', state: 'Gujarat', lat: 21.6417, lng: 69.6293 },
  { city: 'Bhuj', state: 'Gujarat', lat: 23.2420, lng: 69.6669 },

  // --- Maharashtra ---
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { city: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { city: 'Aurangabad (Chhatrapati Sambhajinagar)', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lng: 73.0297 },
  { city: 'Bhiwandi', state: 'Maharashtra', lat: 19.3002, lng: 73.0588 },
  { city: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },
  { city: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433 },
  { city: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lng: 75.5626 },
  { city: 'Amravati', state: 'Maharashtra', lat: 20.9374, lng: 77.7796 },
  { city: 'Nanded', state: 'Maharashtra', lat: 19.1383, lng: 77.3210 },
  { city: 'Akola', state: 'Maharashtra', lat: 20.7002, lng: 77.0082 },
  { city: 'Panvel', state: 'Maharashtra', lat: 18.9894, lng: 73.1175 },
  { city: 'JNPT (Nhava Sheva)', state: 'Maharashtra', lat: 18.9498, lng: 72.9511 },

  // --- Telangana ---
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941 },
  { city: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941 },
  { city: 'Karimnagar', state: 'Telangana', lat: 18.4386, lng: 79.1288 },
  { city: 'Ramagundam', state: 'Telangana', lat: 18.7646, lng: 79.4746 },
  { city: 'Khammam', state: 'Telangana', lat: 17.2473, lng: 80.1514 },
  { city: 'Mahbubnagar', state: 'Telangana', lat: 16.7488, lng: 77.9863 },

  // --- Andhra Pradesh ---
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { city: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { city: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lng: 79.9865 },
  { city: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373 },
  { city: 'Rajahmundry', state: 'Andhra Pradesh', lat: 17.0005, lng: 81.8040 },
  { city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { city: 'Kakinada', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475 },
  { city: 'Kadapa', state: 'Andhra Pradesh', lat: 14.4673, lng: 78.8242 },
  { city: 'Anantapur', state: 'Andhra Pradesh', lat: 14.6819, lng: 77.6006 },

  // --- Karnataka ---
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { city: 'Hubballi-Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  { city: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.8560 },
  { city: 'Belagavi', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  { city: 'Davanagere', state: 'Karnataka', lat: 14.4644, lng: 75.9218 },
  { city: 'Ballari', state: 'Karnataka', lat: 15.1394, lng: 76.9214 },
  { city: 'Kalaburagi (Gulbarga)', state: 'Karnataka', lat: 17.3297, lng: 76.8343 },
  { city: 'Shivamogga', state: 'Karnataka', lat: 13.9299, lng: 75.5681 },
  { city: 'Tumakuru', state: 'Karnataka', lat: 13.3379, lng: 77.1173 },
  { city: 'Hosapete', state: 'Karnataka', lat: 15.2715, lng: 76.3912 },

  // --- Tamil Nadu ---
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { city: 'Tiruchirappalli (Trichy)', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { city: 'Tiruppur', state: 'Tamil Nadu', lat: 11.1085, lng: 77.3411 },
  { city: 'Erode', state: 'Tamil Nadu', lat: 11.3410, lng: 77.7172 },
  { city: 'Vellore', state: 'Tamil Nadu', lat: 12.9165, lng: 79.1325 },
  { city: 'Thoothukudi (Tuticorin)', state: 'Tamil Nadu', lat: 8.7642, lng: 78.1348 },
  { city: 'Hosur', state: 'Tamil Nadu', lat: 12.7409, lng: 77.8253 },
  { city: 'Sriperumbudur', state: 'Tamil Nadu', lat: 12.9739, lng: 79.9439 },

  // --- Delhi & NCR ---
  { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { city: 'Greater Noida', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040 },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { city: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
  { city: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635 },
  { city: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  { city: 'Sonipat', state: 'Haryana', lat: 28.9931, lng: 77.0151 },
  { city: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905 },
  { city: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066 },
  { city: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217 },
  { city: 'Manesar', state: 'Haryana', lat: 28.3512, lng: 76.9388 },
  { city: 'Bawal', state: 'Haryana', lat: 28.0833, lng: 76.5833 },

  // --- Punjab & Chandigarh ---
  { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { city: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { city: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { city: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762 },
  { city: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869 },
  { city: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455 },
  { city: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179 },
  { city: 'Pathankot', state: 'Punjab', lat: 32.2689, lng: 75.6499 },

  // --- Rajasthan ---
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { city: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { city: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119 },
  { city: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399 },
  { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { city: 'Bhilwara', state: 'Rajasthan', lat: 25.3407, lng: 74.6313 },
  { city: 'Alwar', state: 'Rajasthan', lat: 27.5530, lng: 76.6346 },
  { city: 'Bhiwadi', state: 'Rajasthan', lat: 28.2096, lng: 76.8606 },
  { city: 'Sri Ganganagar', state: 'Rajasthan', lat: 29.9038, lng: 73.8772 },

  // --- Uttar Pradesh ---
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { city: 'Prayagraj (Allahabad)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { city: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { city: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304 },
  { city: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880 },
  { city: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8356, lng: 78.7747 },
  { city: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  { city: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9640, lng: 77.5460 },
  { city: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lng: 78.5685 },
  { city: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },
  { city: 'Hamirpur', state: 'Uttar Pradesh', lat: 25.9547, lng: 80.1506 },

  // --- Madhya Pradesh ---
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { city: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { city: 'Sagar', state: 'Madhya Pradesh', lat: 23.8388, lng: 78.7378 },
  { city: 'Dewas', state: 'Madhya Pradesh', lat: 22.9676, lng: 76.0534 },
  { city: 'Satna', state: 'Madhya Pradesh', lat: 24.6005, lng: 80.8322 },
  { city: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3315, lng: 75.0367 },
  { city: 'Pithampur', state: 'Madhya Pradesh', lat: 22.6104, lng: 75.6888 },

  // --- West Bengal ---
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
  { city: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119 },
  { city: 'Asansol', state: 'West Bengal', lat: 23.6739, lng: 86.9524 },
  { city: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  { city: 'Haldia', state: 'West Bengal', lat: 22.0628, lng: 88.0825 },
  { city: 'Kharagpur', state: 'West Bengal', lat: 22.3460, lng: 87.2320 },

  // --- Bihar ---
  { city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { city: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002 },
  { city: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842 },
  { city: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647 },
  { city: 'Purnia', state: 'Bihar', lat: 25.7771, lng: 87.4753 },
  { city: 'Darbhanga', state: 'Bihar', lat: 26.1542, lng: 85.8918 },
  { city: 'Aurangabad', state: 'Bihar', lat: 24.7539, lng: 84.3742 },

  // --- Odisha ---
  { city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { city: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828 },
  { city: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536 },
  { city: 'Berhampur', state: 'Odisha', lat: 19.3149, lng: 84.7941 },
  { city: 'Sambalpur', state: 'Odisha', lat: 21.4669, lng: 83.9812 },
  { city: 'Paradip', state: 'Odisha', lat: 20.3165, lng: 86.6114 },
  { city: 'Balasore', state: 'Odisha', lat: 21.4934, lng: 86.9135 },
  { city: 'Jharsuguda', state: 'Odisha', lat: 21.8554, lng: 84.0062 },

  // --- Jharkhand ---
  { city: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { city: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },
  { city: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },
  { city: 'Bokaro Steel City', state: 'Jharkhand', lat: 23.6693, lng: 86.1511 },

  // --- Chhattisgarh ---
  { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { city: 'Bhilai', state: 'Chhattisgarh', lat: 21.2121, lng: 81.3733 },
  { city: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409 },
  { city: 'Korba', state: 'Chhattisgarh', lat: 22.3595, lng: 82.7501 },

  // --- Kerala ---
  { city: 'Kochi (Cochin)', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { city: 'Kozhikode (Calicut)', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  { city: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  { city: 'Palakkad', state: 'Kerala', lat: 10.7867, lng: 76.6548 },

  // --- Assam & Northeast ---
  { city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { city: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789 },
  { city: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120 },
  { city: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
  { city: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },

  // --- Uttarakhand & Himachal Pradesh ---
  { city: 'Kashipur', state: 'Uttarakhand', pincode: '244713', lat: 29.2115, lng: 78.9641 },
  { city: 'Rudrapur', state: 'Uttarakhand', pincode: '263153', lat: 28.9800, lng: 79.4000 },
  { city: 'Haldwani', state: 'Uttarakhand', pincode: '263139', lat: 29.2183, lng: 79.5130 },
  { city: 'Dehradun', state: 'Uttarakhand', pincode: '248001', lat: 30.3165, lng: 78.0322 },
  { city: 'Haridwar', state: 'Uttarakhand', pincode: '249401', lat: 29.9457, lng: 78.1642 },
  { city: 'Roorkee', state: 'Uttarakhand', pincode: '247667', lat: 29.8543, lng: 77.8880 },
  { city: 'Pantnagar', state: 'Uttarakhand', pincode: '263145', lat: 29.0210, lng: 79.4930 },
  { city: 'Baddi', state: 'Himachal Pradesh', pincode: '173205', lat: 30.9578, lng: 76.7914 },
  { city: 'Shimla', state: 'Himachal Pradesh', pincode: '171001', lat: 31.1048, lng: 77.1734 },
  { city: 'Bilaspur', state: 'Himachal Pradesh', pincode: '174001', lat: 31.3260, lng: 76.7600 },
  { city: 'Hamirpur', state: 'Himachal Pradesh', pincode: '177001', lat: 31.6862, lng: 76.5213 },

  // --- Goa, J&K, UTs ---
  { city: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278 },
  { city: 'Vasco da Gama', state: 'Goa', lat: 15.3982, lng: 73.8113 },
  { city: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570 },
  { city: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { city: 'Daman', state: 'Dadra & Nagar Haveli and Daman & Diu', lat: 20.3974, lng: 72.8328 },
  { city: 'Silvassa', state: 'Dadra & Nagar Haveli and Daman & Diu', lat: 20.2763, lng: 73.0083 },
  { city: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083 },
];

/**
 * Great-circle distance between two GPS coordinates using Haversine formula
 * @returns distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find city coordinates by name (matches "City, State", "City", or embedded pincode/district)
 */
export function findCity(cityNameOrLabel) {
  if (!cityNameOrLabel) return null;
  const clean = cityNameOrLabel.trim().toLowerCase();

  // 1. Direct match on 6-digit PIN code if present
  const pinMatch = clean.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    const matchByPin = INDIAN_CITIES.find((c) => c.pincode === pin);
    if (matchByPin) return matchByPin;
  }

  // 2. Exact match on label ("Vadodara, Gujarat")
  let match = INDIAN_CITIES.find(
    (c) => `${c.city}, ${c.state}`.toLowerCase() === clean
  );
  if (match) return match;

  // 3. Exact match on city name ("Vadodara")
  match = INDIAN_CITIES.find((c) => c.city.toLowerCase() === clean);
  if (match) return match;

  // 4. City contained in full label or prefix match
  match = INDIAN_CITIES.find(
    (c) =>
      clean.includes(c.city.toLowerCase()) ||
      `${c.city}, ${c.state}`.toLowerCase().startsWith(clean) ||
      clean.startsWith(c.city.toLowerCase())
  );
  return match || null;
}

/**
 * Calculates estimated road distance and suggested duration in days.
 * Rule: For every 150 km road distance, provide 1 day of tracking.
 * Minimum 1 day, maximum 30 days.
 */
export function estimateRouteDays(originInput, destinationInput) {
  let origin = null;
  let destination = null;

  if (originInput && typeof originInput === 'object' && originInput.lat && originInput.lng) {
    origin = originInput;
  } else if (typeof originInput === 'string') {
    origin = findCity(originInput);
  }

  if (destinationInput && typeof destinationInput === 'object' && destinationInput.lat && destinationInput.lng) {
    destination = destinationInput;
  } else if (typeof destinationInput === 'string') {
    destination = findCity(destinationInput);
  }

  if (!origin || !destination || !origin.lat || !destination.lat) {
    return null;
  }

  // Straight line great-circle distance
  const straightKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // Indian highway road winding factor (~1.25x straight line)
  const roadKm = straightKm * 1.25;
  const roundedKm = Math.max(15, Math.round(roadKm));

  // 1 day for every 150 km road distance
  const suggestedDays = Math.max(1, Math.min(30, Math.ceil(roundedKm / 150)));

  return {
    origin,
    destination,
    straightKm: Math.round(straightKm),
    roadDistanceKm: roundedKm,
    suggestedDays,
  };
}

/**
 * Search cities for autocomplete
 */
export function searchIndianCities(query, limit = 8) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  return INDIAN_CITIES.filter((c) => {
    const full = `${c.city}, ${c.state} ${c.district || ''} ${c.pincode || ''}`.toLowerCase();
    const cityOnly = c.city.toLowerCase();
    const stateOnly = c.state.toLowerCase();
    const pin = (c.pincode || '').toLowerCase();
    return full.includes(q) || cityOnly.includes(q) || stateOnly.includes(q) || pin.startsWith(q);
  })
    .slice(0, limit)
    .map((c) => ({
      ...c,
      name: c.city,
      label: `${c.city}, ${c.state}${c.pincode ? ` (${c.pincode})` : ''}`,
    }));
}

