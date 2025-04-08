// Simulation Engine for Viral Outbreak
const SimulationEngine = (() => {
  // Private variables
  let isRunning = false;
  let isPaused = false;
  let currentDay = 0;
  let simulationSpeed = 1; // Days per second
  let simulationInterval = null;
  let patientZeroCity = null;
  let simulationHistory = [];
  let peakInfections = 0;
  let peakInfectionDay = 0;
  let zeroDaysCounter = 0;
  let runUntilEradication = false; // New parameter for complete eradication
  
  // Default parameters
  const defaultParams = {
    rFactor: 2.5,
    incubationPeriod: 5,
    infectiousPeriod: 14,
    asymptomaticRate: 0.3,
    transmissionMode: 'airborne',
    mortalityRate: 0.02,
    recoveryPeriod: 14,
    immunityDuration: 180,
    populationDensityFactor: 1.0,
    mobilityFactor: 1.0,
    interventionType: 'none',
    complianceRate: 0.7,
    testingRate: 0.5,
    healthcareCapacity: 0.7
  };
  
  let currentParams = { ...defaultParams };
  
  // Event listeners
  const eventListeners = {
    onDayChange: [],
    onStatusChange: [],
    onSimulationEnd: [],
    onStatisticsUpdate: []
  };
  
  /**
   * Updates parameters for the simulation
   * @param {Object} params - Object containing parameters to update
   */
  const updateParams = (params) => {
    currentParams = { ...currentParams, ...params };
  };
  
  /**
   * Gets the current simulation parameters
   * @returns {Object} - Current simulation parameters
   */
  const getParams = () => {
    return { ...currentParams };
  };
  
  /**
   * Resets the simulation to its initial state
   * @param {Boolean} clearPatient - Whether to clear the patient zero (default: false)
   */
  const resetSimulation = (clearPatient = false) => {
    stopSimulation();
    currentDay = 0;
    simulationHistory = [];
    peakInfections = 0;
    peakInfectionDay = 0;
    zeroDaysCounter = 0;
    isRunning = false;
    isPaused = false;
    CityDataUtil.resetAllCities();
    
    // Reset patient zero if it was set and not explicitly cleared
    if (patientZeroCity && !clearPatient) {
      patientZeroCity = CityDataUtil.setPatientZero(patientZeroCity.properties.name);
    } else if (clearPatient) {
      patientZeroCity = null;
    }
    
    notifyListeners('onDayChange', { day: currentDay });
    notifyListeners('onStatusChange', { status: 'reset' });
    updateStatistics();
  };
  
  /**
   * Sets the patient zero for the simulation
   * @param {String} cityName - Name of the city to set as patient zero
   */
  const setPatientZero = (cityName) => {
    const city = CityDataUtil.setPatientZero(cityName);
    if (city) {
      patientZeroCity = city;
      updateStatistics();
      notifyListeners('onStatusChange', { status: 'patientZeroSet', city });
    }
  };
  
  /**
   * Clears the patient zero setting
   * This is needed to fully reset the simulation state
   */
  const clearPatientZero = () => {
    patientZeroCity = null;
    isRunning = false;
    isPaused = false;
    notifyListeners('onStatusChange', { status: 'reset' });
  };
  
  /**
   * Sets the simulation speed
   * @param {Number} speed - Speed multiplier (days per second)
   */
  const setSimulationSpeed = (speed) => {
    simulationSpeed = speed;
    
    // If simulation is running, restart the interval with new speed
    if (isRunning && !isPaused) {
      clearInterval(simulationInterval);
      const intervalMs = 1000 / simulationSpeed;
      simulationInterval = setInterval(simulateDay, intervalMs);
    }
  };
  
  /**
   * Starts the simulation
   */
  const startSimulation = () => {
    console.log('startSimulation called. patientZeroCity:', patientZeroCity, 'isRunning:', isRunning, 'isPaused:', isPaused);
    
    // Check if patient zero is set properly
    if (!patientZeroCity) {
      console.error('ERROR: Patient zero not set - please select a city on the map first');
      // Alert UI layer that patient zero needs to be selected
      notifyListeners('onStatusChange', { status: 'needPatientZero' });
      return;
    }
    
    if (isRunning && !isPaused) {
      console.log('Already running, not starting again');
      return; // Already running
    }
    
    if (isRunning && isPaused) {
      // Resume simulation
      console.log('Resuming paused simulation');
      isPaused = false;
      const intervalMs = 1000 / simulationSpeed;
      simulationInterval = setInterval(simulateDay, intervalMs);
      notifyListeners('onStatusChange', { status: 'resumed' });
      return;
    }
    
    // Start a new simulation
    console.log('Starting new simulation');
    isRunning = true;
    isPaused = false;
    const intervalMs = 1000 / simulationSpeed;
    simulationInterval = setInterval(simulateDay, intervalMs);
    notifyListeners('onStatusChange', { status: 'started' });
  };
  
  /**
   * Pauses the simulation
   */
  const pauseSimulation = () => {
    if (!isRunning || isPaused) return;
    
    clearInterval(simulationInterval);
    isPaused = true;
    notifyListeners('onStatusChange', { status: 'paused' });
  };
  
  /**
   * Stops the simulation
   */
  const stopSimulation = () => {
    if (!isRunning) return;
    
    clearInterval(simulationInterval);
    isRunning = false;
    isPaused = false;
    notifyListeners('onStatusChange', { status: 'stopped' });
    
    // Generate final report
    generateReport();
  };
  
  /**
   * Set whether to run until complete eradication
   * @param {Boolean} value - Whether to run until eradication
   */
  const setRunUntilEradication = (value) => {
    runUntilEradication = value;
  };

  /**
   * Get whether simulation is set to run until complete eradication
   * @returns {Boolean} - Whether to run until eradication
   */
  const getRunUntilEradication = () => {
    return runUntilEradication;
  };
  
  /**
   * Simulates a single day in the outbreak
   */
  const simulateDay = () => {
    currentDay++;
    
    // Update simulation history with current statistics
    const stats = CityDataUtil.getStatistics();
    simulationHistory.push({
      day: currentDay,
      ...stats
    });
    
    // Update peak infection tracking
    if (stats.infected > peakInfections) {
      peakInfections = stats.infected;
      peakInfectionDay = currentDay;
    }
    
    // Debug log every 10 days or when infection status changes
    if (currentDay % 10 === 0 || stats.infected === 0) {
      console.log(`Day ${currentDay}: Infected: ${stats.infected}, Recovered: ${stats.recovered}, Deceased: ${stats.deceased}`);
    }
    
    // Process all cities
    const cities = CityDataUtil.getAllCities().features;
    processCities(cities);
    
    notifyListeners('onDayChange', { day: currentDay });
    updateStatistics();
    
    // Get updated statistics after processing
    const updatedStats = CityDataUtil.getStatistics();
    
    // Track consecutive days with very low infections
    const lowInfectionThreshold = Math.max(10, Math.ceil(updatedStats.totalPopulation * 0.0001)); // 0.01% of population or at least 10
    
    if (updatedStats.infected === 0) {
      zeroDaysCounter++;
      console.log(`Day ${currentDay}: No infections for ${zeroDaysCounter} consecutive days.`);
    } else if (updatedStats.infected <= lowInfectionThreshold && peakInfectionDay > 0 && currentDay > peakInfectionDay + 30) {
      // If we're well past the peak and infections are very low, count it as near-zero
      // This helps prevent the simulation from running indefinitely with tiny infection numbers
      zeroDaysCounter++;
      console.log(`Day ${currentDay}: Near-zero infections (${updatedStats.infected}) for ${zeroDaysCounter} consecutive days.`);
    } else {
      // If there were zero/low infections but now there are more, log this unusual event
      if (zeroDaysCounter > 0) {
        console.log(`Day ${currentDay}: WARNING - Had ${zeroDaysCounter} days with low infections but now have ${updatedStats.infected} infections`);
      }
      zeroDaysCounter = 0; // Reset counter if there are significant infections
    }
    
    // End simulation if conditions are met
    // If runUntilEradication is true, only end if infections reach exactly 0 for several days or max days reached
    // Otherwise, use the standard low infection threshold
    let shouldEndSimulation = false;
    let endReason = "";
    
    if (currentDay >= 365) {
      shouldEndSimulation = true;
      endReason = "Maximum 365 days reached";
    } else if (runUntilEradication) {
      // Only end if infections reach exactly 0 for several consecutive days
      if (updatedStats.infected === 0 && zeroDaysCounter >= 7) {
        shouldEndSimulation = true;
        endReason = `No infections for ${zeroDaysCounter} consecutive days - disease eradicated`;
      }
    } else {
      // Standard ending condition - low infections for several days
      if (peakInfections > 0 && zeroDaysCounter >= 7) {
        shouldEndSimulation = true;
        endReason = `Near-zero infections for ${zeroDaysCounter} days after peak of ${peakInfections} on day ${peakInfectionDay}`;
      }
    }
    
    if (shouldEndSimulation) {
      console.log(`Day ${currentDay}: Ending simulation - ${endReason}`);
      stopSimulation();
    }
  };
  
  /**
   * Processes all cities for a day of simulation
   * @param {Array} cities - Array of city features
   */
  const processCities = (cities) => {
    // Track which cities will be newly infected this turn
    const newlyInfected = [];
    
    // First pass: Process existing infections and calculate recovery/mortality
    cities.forEach(city => {
      const props = city.properties;
      
      if (props.status === 'infected') {
        props.daysSinceInfection++;
        
        // Check for recovery or death after infectious period
        if (props.daysSinceInfection >= currentParams.infectiousPeriod) {
          processRecoveryAndMortality(city);
        }
      }
    });
    
    // Second pass: Spread infections to nearby cities
    cities.forEach(city => {
      const props = city.properties;
      
      if (props.status === 'infected' && props.infectedCount > 0) {
        // Get nearby cities - use a much wider radius for initial spread from patient zero
        let maxDistance = 300 * currentParams.mobilityFactor;
        
        // Patient zero gets special treatment with a wider reach initially
        if (props.isPatientZero && props.daysSinceInfection < 20) {
          maxDistance = 600 * currentParams.mobilityFactor; // Much wider reach for patient zero
        }
        
        const nearbyCities = CityDataUtil.getNearestCities(city, maxDistance);
        
        // Sort by distance to prioritize closest cities
        nearbyCities.sort((a, b) => a.distance - b.distance);
        
        // Force infection to at least one nearby city per day when patient zero is still recent
        if (props.isPatientZero && props.daysSinceInfection < 15 && nearbyCities.length > 0) {
          // Find the nearest susceptible city
          const nearestSusceptible = nearbyCities.find(city => 
            city.properties.status === 'susceptible' && 
            !newlyInfected.includes(city.properties.name)
          );
          
          if (nearestSusceptible) {
            // Force infection of the nearest susceptible city
            nearestSusceptible.properties.status = 'infected';
            nearestSusceptible.properties.infectionDay = currentDay;
            nearestSusceptible.properties.daysSinceInfection = 0;
            nearestSusceptible.properties.infectedCount = 1;
            newlyInfected.push(nearestSusceptible.properties.name);
            
            console.log(`Day ${currentDay}: Patient Zero forced infection to ${nearestSusceptible.properties.name}`);
          }
        }
        
        // Process all nearby cities (normal transmission logic)
        nearbyCities.forEach(nearbyCity => {
          const nearbyProps = nearbyCity.properties;
          
          // Skip cities that are already processed for new infection this turn
          if (newlyInfected.includes(nearbyCity.properties.name)) {
            return;
          }
          
          // Calculate base transmission probability
          let transmissionProbability = calculateTransmissionProbability(city, nearbyCity);
          
          // Apply interventions if active
          transmissionProbability = applyInterventions(transmissionProbability);
          
          // Boost transmission probability for cities with no infections
          if (nearbyProps.status === 'susceptible') {
            transmissionProbability *= 2.0; // Significantly boost initial infection probability
          }
          
          // Early in the simulation, have a higher chance for spread
          if (currentDay < 30) {
            transmissionProbability = Math.min(1, transmissionProbability * 1.5);
          }
          
          // Determine if transmission occurs - higher chance for closer cities
          if (Math.random() < transmissionProbability) {
            // If city was susceptible, mark it as newly infected
            if (nearbyProps.status === 'susceptible') {
              nearbyProps.status = 'infected';
              nearbyProps.infectionDay = currentDay;
              nearbyProps.daysSinceInfection = 0;
              newlyInfected.push(nearbyProps.name);
            }
            
            // Calculate new infections
            const newInfections = calculateNewInfections(nearbyCity, transmissionProbability);
            nearbyProps.infectedCount += newInfections;
            
            // Safety check to prevent negative infected count
            if (nearbyProps.infectedCount < 0) {
              console.error(`Prevented negative infected count in ${nearbyProps.name}: ${nearbyProps.infectedCount}. Setting to 0.`);
              nearbyProps.infectedCount = 0;
            }
          }
        });
      }
    });
  };
  
  /**
   * Calculates the transmission probability between two cities
   * @param {Object} sourceCity - The infected source city
   * @param {Object} targetCity - The target city
   * @returns {Number} - Probability of transmission (0-1)
   */
  const calculateTransmissionProbability = (sourceCity, targetCity) => {
    // Base factors
    const rFactor = currentParams.rFactor;
    const distance = targetCity.distance; // Added during getNearestCities
    const maxDistance = 300 * currentParams.mobilityFactor;
    
    // Calculate distance factor (closer cities have higher probability)
    // Use a more aggressive distance scaling to ensure spread to nearby cities
    const distanceFactor = Math.max(0.3, DistanceUtil.calculateTransmissionRisk(distance, maxDistance));
    
    // Population density factor
    const sourcePop = sourceCity.properties.population;
    const targetPop = targetCity.properties.population;
    const sourceInfectedRatio = sourceCity.properties.infectedCount / sourcePop;
    const populationDensityFactor = Math.min(1, 
      Math.log(targetPop / 100000 + 1) * currentParams.populationDensityFactor);
    
    // Transmission mode factor
    let transmissionModeFactor = 1.0;
    switch (currentParams.transmissionMode) {
      case 'airborne':
        transmissionModeFactor = 1.5;
        break;
      case 'direct-contact':
        transmissionModeFactor = 1.0;
        break;
      case 'fluid-exchange':
        transmissionModeFactor = 0.6;
        break;
    }
    
    // Special handling for patient zero to guarantee initial spread
    // This ensures that at least the first few cities get infected
    if (sourceCity.properties.isPatientZero && sourceCity.properties.daysSinceInfection < 10) {
      // Use a much higher base probability for the first 10 days of patient zero
      return Math.min(1, 0.5 * distanceFactor); // 50% chance modified by distance
    }
    
    // Calculate final probability with a much higher multiplier to ensure spread
    let probability = (
      rFactor * 
      distanceFactor * 
      populationDensityFactor * 
      transmissionModeFactor * 
      sourceInfectedRatio *
      30 // Significantly increase the base transmission chance
    ) / 10;
    
    // Set a minimum probability floor to ensure some transmission always happens
    probability = Math.max(probability, 0.05);
    
    // Cap probability between 0 and 1
    return Math.min(1, probability);
  };
  
  /**
   * Processes recovery and mortality for a city
   * @param {Object} city - The city to process
   */
  const processRecoveryAndMortality = (city) => {
    const props = city.properties;
    
    // If no infected, ensure status is updated correctly
    if (props.infectedCount <= 0) {
      // If there were any recoveries, mark as recovered
      if (props.recoveredCount > 0) {
        props.status = 'recovered';
        props.recoveryDay = currentDay;
      } else {
        props.status = 'susceptible';
      }
      return;
    }
    
    // Patient zero recovers more slowly to ensure spread happens
    if (props.isPatientZero && props.daysSinceInfection < 30) {
      // For the first 30 days, reduce recovery rate significantly for patient zero
      // This gives more time for the infection to spread to other cities
      const reducedRecoveryChance = 0.1; // Only 10% of normal recovery rate
      
      // Only process a small percentage of patient zero recovery to ensure
      // they remain infectious longer to seed the outbreak
      if (Math.random() > reducedRecoveryChance) {
        return; // Skip recovery process most of the time
      }
    }
    
    // Calculate base mortality rate
    let effectiveMortalityRate = currentParams.mortalityRate;
    
    // Adjust mortality rate based on healthcare capacity
    const healthcareCapacity = currentParams.healthcareCapacity;
    const population = props.population;
    const infectedPercentage = props.infectedCount / population;
    
    // If infected percentage exceeds healthcare capacity, increase mortality
    if (infectedPercentage > healthcareCapacity) {
      const overloadFactor = infectedPercentage / healthcareCapacity;
      effectiveMortalityRate *= (1 + Math.min(1, overloadFactor - 1));
    }
    
    // Calculate deaths and recoveries - ensure we don't exceed current infected count
    const infectedBeforeProcessing = props.infectedCount;
    
    // Safety check - ensure we have a valid infected count to begin with
    if (infectedBeforeProcessing < 0) {
      console.error(`Detected negative infected count (${infectedBeforeProcessing}) before processing recovery/mortality for ${props.name}. Setting to 0.`);
      props.infectedCount = 0;
      props.status = props.recoveredCount > 0 ? 'recovered' : 'susceptible';
      props.recoveryDay = currentDay;
      return; // Skip processing for this city
    }
    
    // Additional safety - if there are no infected, nothing to process
    if (infectedBeforeProcessing === 0) {
      props.status = props.recoveredCount > 0 ? 'recovered' : 'susceptible';
      props.recoveryDay = currentDay;
      return;
    }
    
    // Calculate maximum possible deaths based on mortality rate
    let newDeaths = Math.round(props.infectedCount * effectiveMortalityRate);
    // Ensure we don't have more deaths than infected people
    newDeaths = Math.min(newDeaths, infectedBeforeProcessing);
    
    // Update infected count after deaths
    props.infectedCount -= newDeaths;
    props.deceasedCount += newDeaths;
    const infectedAfterDeaths = props.infectedCount;
    
    // Safety check - ensure we didn't go negative after deaths calculation
    if (infectedAfterDeaths < 0) {
      console.error(`Negative infected count (${infectedAfterDeaths}) after calculating deaths for ${props.name}. Resetting to 0.`);
      props.infectedCount = 0;
      props.status = props.recoveredCount > 0 ? 'recovered' : 'susceptible';
      props.recoveryDay = currentDay;
      return; // Skip further processing
    }
    
    // Calculate recoveries differently based on day    
    let newRecoveries;
    
    // When there's only 1 infected person left, increase likelihood of complete recovery
    // This ensures cities don't get stuck with 1 infected indefinitely
    if (infectedAfterDeaths === 1) {
      // 80% chance of recovery when only 1 infected person remains
      // This ensures eventually all infections clear out
      newRecoveries = Math.random() < 0.8 ? 1 : 0;
    } else if (currentDay < 30) {
      // Reduce recovery rate in the early days
      newRecoveries = Math.round(infectedAfterDeaths * 0.3);
    } else {
      // After day 30, use a gradual recovery rate based on recovery period
      // rather than having all infected recover at once
      const recoveryRate = 1 / currentParams.recoveryPeriod;
      newRecoveries = Math.round(infectedAfterDeaths * recoveryRate);
      
      // Ensure at least 1 recovery per turn when infection count is low
      // This helps prevent cities from being stuck with low infection counts
      if (infectedAfterDeaths <= 10 && newRecoveries === 0) {
        newRecoveries = 1;
      }
    }
    
    // Ensure we don't exceed remaining infected count
    newRecoveries = Math.min(newRecoveries, infectedAfterDeaths);
    
    // Double-check to make sure we don't exceed total infected count
    if (newDeaths + newRecoveries > infectedBeforeProcessing) {
      // Adjust recoveries to prevent going negative
      newRecoveries = infectedBeforeProcessing - newDeaths;
    }
    
    // Update city properties
    props.deceasedCount += newDeaths;
    props.recoveredCount += newRecoveries;
    props.infectedCount -= newRecoveries;
    
    // Final safety check - ensure infected count is not negative
    if (props.infectedCount < 0) {
      console.error(`Negative infected count (${props.infectedCount}) after calculating recoveries for ${props.name}. Adjusting counts.`);
      props.recoveredCount += props.infectedCount; // Reduce recovered count by the negative amount
      props.infectedCount = 0;
    }
    
    // Ensure patient zero keeps at least 1 infected for a minimum period
    if (props.isPatientZero && props.daysSinceInfection < 20 && props.infectedCount <= 0) {
      props.infectedCount = 1; // Keep at least 1 infected
    } else if (props.infectedCount <= 0) {
      props.status = props.recoveredCount > 0 ? 'recovered' : 'susceptible';
      props.recoveryDay = currentDay;
    }
  };
  
  /**
   * Applies intervention effects to transmission probability
   * @param {Number} probability - Base transmission probability
   * @returns {Number} - Adjusted transmission probability
   */
  const applyInterventions = (probability) => {
    if (currentParams.interventionType === 'none') {
      return probability;
    }
    
    const complianceFactor = currentParams.complianceRate;
    let reductionFactor = 0;
    
    switch (currentParams.interventionType) {
      case 'mask-mandate':
        reductionFactor = 0.3; // 30% reduction when 100% compliance
        break;
      case 'social-distancing':
        reductionFactor = 0.5; // 50% reduction when 100% compliance
        break;
      case 'lockdown':
        reductionFactor = 0.9; // 90% reduction when 100% compliance
        
        // Apply additional effects of lockdown beyond transmission reduction
        // If we have 100% compliance on lockdown, there should be almost no new cases
        if (complianceFactor >= 0.99) {
          // With complete lockdown, reduce probability to near zero
          // but keep a very small chance to account for essential workers and leakage
          return probability * 0.01; 
        }
        break;
      case 'school-closure':
        reductionFactor = 0.4; // 40% reduction when 100% compliance
        break;
    }
    
    // Apply compliance-adjusted reduction
    const actualReduction = reductionFactor * complianceFactor;
    return probability * (1 - actualReduction);
  };
  
  /**
   * Calculates new infections for a city
   * @param {Object} city - The city to calculate new infections for
   * @param {Number} transmissionProbability - Base probability of transmission
   * @returns {Number} - Number of new infections
   */
  const calculateNewInfections = (city, transmissionProbability) => {
    const population = city.properties.population;
    const currentInfected = city.properties.infectedCount;
    const currentDeceased = city.properties.deceasedCount;
    const currentRecovered = city.properties.recoveredCount;
    
    // Additional safety check - ensure currentInfected isn't negative
    if (currentInfected < 0) {
      console.error(`ERROR: Detected negative infected count (${currentInfected}) in calculateNewInfections for ${city.properties.name}. Setting to 0.`);
      city.properties.infectedCount = 0;
      return 0;
    }
    
    // Calculate susceptible population
    const susceptible = population - currentInfected - currentDeceased - currentRecovered;
    if (susceptible <= 0) return 0;
    
    // Ensure at least 1 new infection when transmission occurs to kickstart the spread
    // but only if the city just became infected (no previous infections)
    if (currentInfected === 0) {
      return 1; // Start with at least one infection in a new city
    }
    
    // Base number of new infections uses a more realistic growth formula
    // Using SIR model principles: new infections proportional to SI/N
    const contactRate = currentParams.rFactor / currentParams.infectiousPeriod;
    const newInfectionRate = contactRate * currentInfected * (susceptible / population) * transmissionProbability;
    
    // Apply randomness for more realistic variation
    const randomFactor = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
    let newInfections = Math.ceil(newInfectionRate * randomFactor);
    
    // Safety check - ensure we never return negative infections
    if (newInfections < 0) {
      console.error(`WARNING: Calculated negative new infections (${newInfections}) for ${city.properties.name}. Setting to 0.`);
      newInfections = 0;
    }
    
    // Apply limits to prevent unrealistic jumps
    const maxGrowthFactor = currentDay < 30 ? 2.0 : 1.5; // Higher growth early on
    const maxNewInfections = Math.max(1, Math.ceil(currentInfected * maxGrowthFactor));
    
    // Cap new infections at susceptible population and maximum growth limit
    newInfections = Math.min(newInfections, maxNewInfections, susceptible);
    
    return newInfections;
  };
  
  /**
   * Updates statistics and notifies listeners
   */
  const updateStatistics = () => {
    const stats = CityDataUtil.getStatistics();
    
    // Validate statistics - ensure there are no negative values
    if (stats.infected < 0) {
      console.error(`ERROR: Negative infected count detected: ${stats.infected}. Fixing to 0.`);
      // Fix the issue by resetting infected to 0 in all cities
      fixNegativeInfections();
      // Get updated statistics
      const correctedStats = CityDataUtil.getStatistics();
      notifyListeners('onStatisticsUpdate', correctedStats);
    } else {
      notifyListeners('onStatisticsUpdate', stats);
    }
  };
  
  /**
   * Fixes negative infection counts in cities
   */
  const fixNegativeInfections = () => {
    const cities = CityDataUtil.getAllCities().features;
    if (!cities) return;
    
    cities.forEach(city => {
      if (city.properties.infectedCount < 0) {
        console.error(`Fixed negative infection count in ${city.properties.name}: ${city.properties.infectedCount} → 0`);
        city.properties.infectedCount = 0;
        
        // If there are no infections, update the city status accordingly
        if (city.properties.status === 'infected') {
          city.properties.status = city.properties.recoveredCount > 0 ? 'recovered' : 'susceptible';
          city.properties.recoveryDay = currentDay;
        }
      }
      
      // Double check that any city with zero infections shouldn't be 'infected'
      if (city.properties.infectedCount === 0 && city.properties.status === 'infected') {
        city.properties.status = city.properties.recoveredCount > 0 ? 'recovered' : 'susceptible';
        city.properties.recoveryDay = currentDay;
      }
    });
  };
  
  /**
   * Generates a final report for the simulation
   */
  const generateReport = () => {
    const stats = CityDataUtil.getStatistics();
    
    // Determine reason for simulation end
    let endReason = '';
    if (currentDay >= 365) {
      endReason = 'Maximum simulation period reached (365 days)';
    } else if (zeroDaysCounter >= 7) {
      if (runUntilEradication) {
        if (stats.infected === 0) {
          endReason = `Disease successfully eradicated for ${zeroDaysCounter} consecutive days`;
        } else {
          endReason = 'Simulation manually stopped';
        }
      } else {
        const lowInfectionThreshold = Math.max(10, Math.ceil(stats.totalPopulation * 0.0001));
        if (stats.infected === 0) {
          endReason = `Infections reached zero for ${zeroDaysCounter} consecutive days`;
        } else {
          endReason = `Infections fell below threshold (${lowInfectionThreshold}) for ${zeroDaysCounter} consecutive days`;
        }
      }
    } else {
      endReason = 'Simulation manually stopped';
    }
    
    const report = {
      duration: currentDay,
      finalStats: stats,
      peakInfections,
      peakInfectionDay,
      endReason,
      history: simulationHistory
    };
    
    console.log(`Simulation ended: ${endReason}`);
    console.log(`Final stats: Infected: ${stats.infected}, Recovered: ${stats.recovered}, Deceased: ${stats.deceased}`);
    console.log(`Peak of ${peakInfections} infections occurred on day ${peakInfectionDay}`);
    
    notifyListeners('onSimulationEnd', report);
    return report;
  };
  
  /**
   * Adds an event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  const addEventListener = (event, callback) => {
    if (eventListeners[event]) {
      eventListeners[event].push(callback);
    }
  };
  
  /**
   * Removes an event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  const removeEventListener = (event, callback) => {
    if (eventListeners[event]) {
      const index = eventListeners[event].indexOf(callback);
      if (index !== -1) {
        eventListeners[event].splice(index, 1);
      }
    }
  };
  
  /**
   * Notifies listeners of an event
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  const notifyListeners = (event, data) => {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => callback(data));
    }
  };
  
  /**
   * Gets the current simulation state
   * @returns {Object} - Current simulation state
   */
  const getSimulationState = () => {
    return {
      isRunning,
      isPaused,
      currentDay,
      patientZeroCity: patientZeroCity ? patientZeroCity.properties.name : null
    };
  };
  
  /**
   * Gets the simulation history data
   * @returns {Array} - Simulation history data
   */
  const getSimulationHistory = () => {
    return [...simulationHistory];
  };
  
  return {
    updateParams,
    getParams,
    resetSimulation,
    setPatientZero,
    clearPatientZero,
    setSimulationSpeed,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    getSimulationState,
    getSimulationHistory,
    addEventListener,
    removeEventListener,
    setRunUntilEradication,
    getRunUntilEradication
  };
})(); 