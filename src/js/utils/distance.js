// Distance Utility for calculating distances between geographic coordinates
const DistanceUtil = (() => {
  // Earth radius in kilometers
  const EARTH_RADIUS = 6371;
  
  /**
   * Converts degrees to radians
   * @param {Number} degrees - Angle in degrees
   * @returns {Number} - Angle in radians
   */
  const degreesToRadians = (degrees) => {
    return degrees * Math.PI / 180;
  };
  
  /**
   * Calculates the distance between two points using the Haversine formula
   * @param {Number} lat1 - Latitude of first point in degrees
   * @param {Number} lon1 - Longitude of first point in degrees
   * @param {Number} lat2 - Latitude of second point in degrees
   * @param {Number} lon2 - Longitude of second point in degrees
   * @returns {Number} - Distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = EARTH_RADIUS * c;
    
    return distance;
  };
  
  /**
   * Calculates if a point is within a certain distance of another point
   * @param {Number} lat1 - Latitude of first point in degrees
   * @param {Number} lon1 - Longitude of first point in degrees
   * @param {Number} lat2 - Latitude of second point in degrees
   * @param {Number} lon2 - Longitude of second point in degrees
   * @param {Number} maxDistance - Maximum distance in kilometers
   * @returns {Boolean} - True if distance is less than or equal to maxDistance
   */
  const isWithinDistance = (lat1, lon1, lat2, lon2, maxDistance) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= maxDistance;
  };
  
  /**
   * Calculate the relative risk of transmission between cities based on distance
   * @param {Number} distance - Distance in kilometers
   * @param {Number} maxDistance - Maximum distance that can have transmission
   * @returns {Number} - Risk factor between 0 and 1
   */
  const calculateTransmissionRisk = (distance, maxDistance = 300) => {
    if (distance <= 0) return 1; // Same city or invalid distance
    if (distance >= maxDistance) return 0; // Too far for transmission
    
    // Inverse relationship: closer cities have higher risk
    return 1 - (distance / maxDistance);
  };
  
  return {
    calculateDistance,
    isWithinDistance,
    calculateTransmissionRisk
  };
})(); 