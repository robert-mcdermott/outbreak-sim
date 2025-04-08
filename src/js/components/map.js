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
          <div class="infected-stat">Infected: <span class="infected-count">0</span></div>
          <div class="deceased-stat">Deceased: <span class="deceased-count">0</span></div>
          <div class="recovered-stat">Recovered: <span class="recovered-count">0</span></div>
        </div>
      </div>
    `;
    
    const popup = L.popup().setContent(popupContent);
    marker.bindPopup(popup);
    
    // Handle popup open
    marker.on('popupopen', () => {
      // Update stats in popup
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
    
    // Store marker reference
    cityMarkers[name] = {
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
    const markerData = cityMarkers[name];
    if (!markerData) return;
    
    const { marker, element } = markerData;
    const status = city.properties.status;
    const infectedCount = city.properties.infectedCount;
    
    // Reset classes
    element.className = 'city-marker';
    
    // Add class based on status
    if (status === 'infected') {
      element.classList.add('infected');
      
      // Add high-infection class if there are many infections
      if (infectedCount > city.properties.population * 0.05) {
        element.classList.add('high-infection');
      }
    } else if (status === 'recovered') {
      element.classList.add('recovered');
    } else if (status === 'deceased') {
      element.classList.add('deceased');
    }
    
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
            <div class="infected-stat">Infected: <span class="infected-count">0</span></div>
            <div class="deceased-stat">Deceased: <span class="deceased-count">0</span></div>
            <div class="recovered-stat">Recovered: <span class="recovered-count">0</span></div>
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
            <div class="infected-stat">Infected: <span class="infected-count">0</span></div>
            <div class="deceased-stat">Deceased: <span class="deceased-count">0</span></div>
            <div class="recovered-stat">Recovered: <span class="recovered-count">0</span></div>
          </div>
        </div>
      `;
      
      marker.setPopupContent(popupContent);
      
      // Add event handler for the select button
      marker.off('popupopen');
      marker.on('popupopen', () => {
        console.log('City marker popup opened', city.properties.name);
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
   */
  const centerOnCity = (cityName) => {
    const markerData = cityMarkers[cityName];
    if (!markerData) return;
    
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
    resetMap
  };
})(); 