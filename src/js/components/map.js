// Map Component for Viral Outbreak Simulator
const MapComponent = (() => {
  let map = null;
  let cityMarkers = {};
  let patientZeroSet = false;
  
  /**
   * Initializes the map
   * @returns {Promise} - Promise that resolves when the map is initialized
   */
  const initMap = async () => {
    try {
      // Create the map
      map = L.map('map').setView([39.8283, -98.5795], 4); // Center of US
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);
      
      // Load city data
      const citiesData = await CityDataUtil.loadCityData();
      
      // Add markers for each city
      citiesData.features.forEach(city => {
        addCityMarker(city);
      });
      
      return map;
    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
    }
  };
  
  /**
   * Adds a marker for a city
   * @param {Object} city - The city feature
   */
  const addCityMarker = (city) => {
    const coords = city.geometry.coordinates;
    const name = city.properties.name;
    const state = city.properties.state;
    const population = city.properties.population;
    
    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'city-marker';
    
    // Create marker
    const marker = L.marker([coords[1], coords[0]], {
      icon: L.divIcon({
        className: 'city-marker-container',
        html: markerElement,
        iconSize: [10, 10]
      })
    }).addTo(map);
    
    // Popup content
    const popupContent = `
      <div class="city-popup">
        <h3>${name}, ${state}</h3>
        <p>Population: ${population.toLocaleString()}</p>
        ${!patientZeroSet ? '<button class="select-city-btn">Set as Patient Zero</button>' : ''}
        <div class="city-stats">
          <div class="infected-stat">Infected: <span class="infected-count">${city.properties.infectedCount.toLocaleString()}</span></div>
          <div class="deceased-stat">Deceased: <span class="deceased-count">${city.properties.deceasedCount.toLocaleString()}</span></div>
          <div class="recovered-stat">Recovered: <span class="recovered-count">${city.properties.recoveredCount.toLocaleString()}</span></div>
        </div>
      </div>
    `;
    
    const popup = L.popup().setContent(popupContent);
    marker.bindPopup(popup);
    
    // Handle popup open
    marker.on('popupopen', () => {
      // Update stats in popup with current values
      updateCityPopupStats(marker, city);
      
      // Add event listener to "Set as Patient Zero" button if it exists
      const selectButton = marker._popup._contentNode.querySelector('.select-city-btn');
      if (selectButton) {
        selectButton.addEventListener('click', () => {
          setPatientZero(city);
          marker.closePopup();
        });
      }
    });
    
    // Create a unique key for this city using both name and state
    const cityKey = `${name}, ${state}`;
    
    // Store marker reference
    cityMarkers[cityKey] = {
      marker,
      element: markerElement,
      city
    };
  };
  
  /**
   * Updates a city marker's appearance based on its status
   * @param {Object} city - The city feature
   */
  const updateCityMarker = (city) => {
    const name = city.properties.name;
    const state = city.properties.state;
    const cityKey = `${name}, ${state}`;
    
    const markerData = cityMarkers[cityKey];
    if (!markerData) {
      console.warn(`City marker not found for ${cityKey}`);
      return;
    }
    
    const { marker, element } = markerData;
    const status = city.properties.status;
    const infectedCount = city.properties.infectedCount;
    
    // Reset classes
    element.className = 'city-marker';
    
    // Add class based on status and infected count
    if (infectedCount > 0) {
      // Always show as infected if there are any infected people, regardless of status
      element.classList.add('infected');
      
      // Add high-infection class if there are many infections
      if (infectedCount > city.properties.population * 0.05) {
        element.classList.add('high-infection');
      }
      
      // Make sure status is properly set to 'infected' if there are infected people
      if (status !== 'infected') {
        city.properties.status = 'infected';
      }
    } else if (status === 'recovered') {
      element.classList.add('recovered');
    } else if (status === 'deceased') {
      element.classList.add('deceased');
    }
    
    // Also update the stored city object to keep it in sync
    markerData.city = city;
    
    // Update popup content if it's open
    if (marker.isPopupOpen()) {
      updateCityPopupStats(marker, city);
    }
  };
  
  /**
   * Updates the statistics in a city's popup
   * @param {Object} marker - The Leaflet marker
   * @param {Object} city - The city feature
   */
  const updateCityPopupStats = (marker, city) => {
    const popupNode = marker._popup._contentNode;
    if (!popupNode) return;
    
    const infectedElement = popupNode.querySelector('.infected-count');
    const deceasedElement = popupNode.querySelector('.deceased-count');
    const recoveredElement = popupNode.querySelector('.recovered-count');
    
    if (infectedElement) {
      infectedElement.textContent = city.properties.infectedCount.toLocaleString();
    }
    
    if (deceasedElement) {
      deceasedElement.textContent = city.properties.deceasedCount.toLocaleString();
    }
    
    if (recoveredElement) {
      recoveredElement.textContent = city.properties.recoveredCount.toLocaleString();
    }
  };
  
  /**
   * Sets a city as patient zero
   * @param {Object} city - The city feature
   */
  const setPatientZero = (city) => {
    console.log('setPatientZero called for', city.properties.name);
    
    // Set patient zero
    SimulationEngine.setPatientZero(city.properties.name);
    
    // Update UI
    document.getElementById('selected-city').textContent = `${city.properties.name}, ${city.properties.state}`;
    
    // Prevent further patient zero selections
    patientZeroSet = true;
    console.log('patientZeroSet =', patientZeroSet);
    
    // Update all popups to remove the button
    Object.values(cityMarkers).forEach(({ marker, city }) => {
      const popupContent = `
        <div class="city-popup">
          <h3>${city.properties.name}, ${city.properties.state}</h3>
          <p>Population: ${city.properties.population.toLocaleString()}</p>
          <div class="city-stats">
            <div class="infected-stat">Infected: <span class="infected-count">${city.properties.infectedCount.toLocaleString()}</span></div>
            <div class="deceased-stat">Deceased: <span class="deceased-count">${city.properties.deceasedCount.toLocaleString()}</span></div>
            <div class="recovered-stat">Recovered: <span class="recovered-count">${city.properties.recoveredCount.toLocaleString()}</span></div>
          </div>
        </div>
      `;
      
      marker.setPopupContent(popupContent);
    });
    
    // Update the city marker to show infection
    updateCityMarker(city);
    console.log('Patient zero set complete');
  };
  
  /**
   * Updates all city markers based on current data
   */
  const updateAllMarkers = () => {
    const cities = CityDataUtil.getAllCities();
    if (!cities) return;
    
    cities.features.forEach(city => {
      updateCityMarker(city);
    });
  };
  
  /**
   * Resets the map to its initial state
   */
  const resetMap = () => {
    console.log('MapComponent.resetMap called - resetting patient zero status and city markers');
    
    // Reset patient zero status
    patientZeroSet = false;
    
    // Reset city markers
    Object.values(cityMarkers).forEach(({ marker, element, city }) => {
      // Reset marker appearance
      if (element) {
        element.className = 'city-marker';
      }
      
      // Update popup content to add button back
      const popupContent = `
        <div class="city-popup">
          <h3>${city.properties.name}, ${city.properties.state}</h3>
          <p>Population: ${city.properties.population.toLocaleString()}</p>
          <button class="select-city-btn">Set as Patient Zero</button>
          <div class="city-stats">
            <div class="infected-stat">Infected: <span class="infected-count">${city.properties.infectedCount.toLocaleString()}</span></div>
            <div class="deceased-stat">Deceased: <span class="deceased-count">${city.properties.deceasedCount.toLocaleString()}</span></div>
            <div class="recovered-stat">Recovered: <span class="recovered-count">${city.properties.recoveredCount.toLocaleString()}</span></div>
          </div>
        </div>
      `;
      
      marker.setPopupContent(popupContent);
      
      // Add event handler for the select button
      marker.off('popupopen');
      marker.on('popupopen', () => {
        console.log('City marker popup opened', city.properties.name);
        // Update popup stats with current values
        updateCityPopupStats(marker, city);
        
        const selectButton = marker._popup._contentNode.querySelector('.select-city-btn');
        if (selectButton) {
          selectButton.addEventListener('click', () => {
            setPatientZero(city);
            marker.closePopup();
          });
        }
      });
    });
    
    // Reset selected city display
    document.getElementById('selected-city').textContent = 'No city selected';
    console.log('Map reset complete');
  };
  
  /**
   * Centers the map on a city
   * @param {String} cityName - Name of the city to center on
   * @param {String} state - State of the city (optional, but recommended for cities with same names)
   */
  const centerOnCity = (cityName, state) => {
    let cityKey = cityName;
    
    // If a state is provided, use the full key format
    if (state) {
      cityKey = `${cityName}, ${state}`;
    }
    
    // Try to find the city in the cityMarkers map
    let markerData = cityMarkers[cityKey];
    
    // If not found and no state was provided, try to infer based on the first found match
    if (!markerData && !state) {
      // Look for any city that starts with this name
      const possibleKeys = Object.keys(cityMarkers).filter(key => key.startsWith(`${cityName}, `));
      if (possibleKeys.length > 0) {
        // Use the first match
        cityKey = possibleKeys[0];
        markerData = cityMarkers[cityKey];
        console.log(`Inferred city key as ${cityKey}`);
      }
    }
    
    if (!markerData) {
      console.warn(`No marker data found for city: ${cityKey}`);
      return;
    }
    
    const { marker, city } = markerData;
    const coords = city.geometry.coordinates;
    
    map.setView([coords[1], coords[0]], 6);
    marker.openPopup();
  };
  
  /**
   * Sets up event listeners for simulation events
   */
  const setupEventListeners = () => {
    // Listen for day changes to update markers
    SimulationEngine.addEventListener('onDayChange', () => {
      updateAllMarkers();
    });
    
    // Listen for simulation status changes
    SimulationEngine.addEventListener('onStatusChange', (data) => {
      if (data.status === 'reset') {
        resetMap();
      } else if (data.status === 'patientZeroSet') {
        patientZeroSet = true;
      }
    });
    
    // Listen for statistics updates to refresh marker data
    SimulationEngine.addEventListener('onStatisticsUpdate', () => {
      // Ensure all city markers reflect the latest data
      updateAllMarkers();
    });
  };
  
  /**
   * Logs the status of city markers for debugging
   * @param {String} cityFilter - Optional filter to only show cities containing this string (case insensitive)
   */
  const logCityMarkerStatus = (cityFilter = '') => {
    const filter = cityFilter.toLowerCase();
    console.group('City Marker Status');
    
    Object.entries(cityMarkers).forEach(([cityKey, { city }]) => {
      if (!filter || cityKey.toLowerCase().includes(filter)) {
        const props = city.properties;
        console.log(
          `${cityKey}: status=${props.status}, ` +
          `infected=${props.infectedCount}, ` +
          `recovered=${props.recoveredCount}, ` +
          `deceased=${props.deceasedCount}`
        );
      }
    });
    
    console.groupEnd();
  };
  
  /**
   * Initializes the map component
   */
  const init = async () => {
    await initMap();
    setupEventListeners();
  };
  
  return {
    init,
    updateAllMarkers,
    centerOnCity,
    resetMap,
    logCityMarkerStatus
  };
})(); 