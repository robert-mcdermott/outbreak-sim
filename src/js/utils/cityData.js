// City Data Utility
const CityDataUtil = (() => {
  let citiesData = null;

  /**
   * Loads the city data from JSON file
   * @returns {Promise} - Promise resolving to city data
   */
  const loadCityData = async () => {
    try {
      const response = await fetch('./public/data/us-cities.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Process data to add additional properties needed for simulation
      data.features = data.features.map(city => {
        return {
          ...city,
          properties: {
            ...city.properties,
            status: 'susceptible', // 'susceptible', 'infected', 'recovered', 'deceased'
            infectionDay: -1,
            recoveryDay: -1,
            infectedCount: 0,
            deceasedCount: 0,
            recoveredCount: 0,
            daysSinceInfection: 0,
            isPatientZero: false
          }
        };
      });
      
      citiesData = data;
      return data;
    } catch (error) {
      console.error('Error loading city data:', error);
      throw error;
    }
  };

  /**
   * Gets the nearest cities to a given city
   * @param {Object} cityFeature - The city feature
   * @param {Number} maxDistance - Maximum distance in km
   * @returns {Array} - Array of nearby city features
   */
  const getNearestCities = (cityFeature, maxDistance = 300) => {
    if (!citiesData) {
      console.error('City data not loaded');
      return [];
    }
    
    const sourceLng = cityFeature.geometry.coordinates[0];
    const sourceLat = cityFeature.geometry.coordinates[1];
    
    // Using DistanceUtil to calculate distances
    return citiesData.features.filter(city => {
      if (city.properties.name === cityFeature.properties.name) {
        return false; // Skip the source city
      }
      
      const targetLng = city.geometry.coordinates[0];
      const targetLat = city.geometry.coordinates[1];
      
      const distance = DistanceUtil.calculateDistance(
        sourceLat, sourceLng,
        targetLat, targetLng
      );
      
      return distance <= maxDistance;
    }).map(city => {
      const targetLng = city.geometry.coordinates[0];
      const targetLat = city.geometry.coordinates[1];
      
      return {
        ...city,
        distance: DistanceUtil.calculateDistance(
          sourceLat, sourceLng,
          targetLat, targetLng
        )
      };
    }).sort((a, b) => a.distance - b.distance);
  };

  /**
   * Gets a city by name
   * @param {String} name - The city name
   * @returns {Object|null} - City feature or null if not found
   */
  const getCityByName = (name) => {
    if (!citiesData) {
      console.error('City data not loaded');
      return null;
    }
    
    return citiesData.features.find(city => 
      city.properties.name.toLowerCase() === name.toLowerCase()
    );
  };

  /**
   * Resets all cities to their initial susceptible state
   */
  const resetAllCities = () => {
    if (!citiesData) return;
    
    citiesData.features.forEach(city => {
      city.properties.status = 'susceptible';
      city.properties.infectionDay = -1;
      city.properties.recoveryDay = -1;
      city.properties.infectedCount = 0;
      city.properties.deceasedCount = 0;
      city.properties.recoveredCount = 0;
      city.properties.daysSinceInfection = 0;
      city.properties.isPatientZero = false;
    });
  };

  /**
   * Sets a city as patient zero
   * @param {String} cityName - Name of the city to set as patient zero
   * @returns {Object|null} - Updated city or null if not found
   */
  const setPatientZero = (cityName) => {
    const city = getCityByName(cityName);
    if (!city) return null;
    
    // Reset all cities first to ensure only one patient zero
    resetAllCities();
    
    city.properties.status = 'infected';
    city.properties.infectionDay = 0;
    city.properties.isPatientZero = true;
    // Start with exactly 1 infected person (patient zero)
    city.properties.infectedCount = 1;
    
    return city;
  };

  /**
   * Gets all cities data
   * @returns {Object|null} - The cities data
   */
  const getAllCities = () => {
    return citiesData;
  };

  /**
   * Gets statistics for all cities
   * @returns {Object} - Object containing aggregated statistics
   */
  const getStatistics = () => {
    if (!citiesData) return { 
      totalPopulation: 0, 
      infected: 0, 
      deceased: 0, 
      recovered: 0,
      susceptible: 0
    };
    
    let totalPopulation = 0;
    let infected = 0;
    let deceased = 0;
    let recovered = 0;
    let susceptibleCount = 0; // Directly count susceptible population
    
    citiesData.features.forEach(city => {
      const population = city.properties.population;
      const infectedCount = city.properties.infectedCount;
      const deceasedCount = city.properties.deceasedCount;
      const recoveredCount = city.properties.recoveredCount;
      
      // Calculate susceptible for each city individually
      const citySusceptible = Math.max(0, population - infectedCount - deceasedCount - recoveredCount);
      
      totalPopulation += population;
      infected += infectedCount;
      deceased += deceasedCount;
      recovered += recoveredCount;
      susceptibleCount += citySusceptible;
    });
    
    // Safety check to ensure susceptible is never negative
    const susceptible = Math.max(0, susceptibleCount);
    
    return {
      totalPopulation,
      infected,
      deceased,
      recovered,
      susceptible
    };
  };

  return {
    loadCityData,
    getNearestCities,
    getCityByName,
    resetAllCities,
    setPatientZero,
    getAllCities,
    getStatistics
  };
})(); 