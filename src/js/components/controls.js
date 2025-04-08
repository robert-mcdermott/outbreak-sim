// Controls Component for Viral Outbreak Simulator
const ControlsComponent = (() => {
  // Track UI elements
  const elements = {
    startBtn: null,
    pauseBtn: null,
    resetBtn: null,
    themeToggle: null,
    darkModeStylesheet: null,
    dayCount: null,
    infectedCount: null,
    deceasedCount: null,
    recoveredCount: null,
    simulationSpeed: null,
    simulationSpeedValue: null,
    runUntilEradication: null
  };
  
  // Parameter sliders and their value display elements
  const paramSliders = {
    rFactor: { input: null, display: null },
    incubationPeriod: { input: null, display: null },
    infectiousPeriod: { input: null, display: null },
    asymptomaticRate: { input: null, display: null },
    transmissionMode: { input: null },
    mortalityRate: { input: null, display: null },
    recoveryPeriod: { input: null, display: null },
    immunityDuration: { input: null, display: null },
    populationDensityFactor: { input: null, display: null },
    mobilityFactor: { input: null, display: null },
    interventionType: { input: null },
    complianceRate: { input: null, display: null },
    testingRate: { input: null, display: null },
    healthcareCapacity: { input: null, display: null }
  };
  
  /**
   * Initializes the controls component
   */
  const init = () => {
    // Cache DOM elements
    elements.startBtn = document.getElementById('start-btn');
    elements.pauseBtn = document.getElementById('pause-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.darkModeStylesheet = document.getElementById('dark-mode-stylesheet');
    elements.dayCount = document.getElementById('day-count');
    elements.infectedCount = document.getElementById('infected-count');
    elements.deceasedCount = document.getElementById('deceased-count');
    elements.recoveredCount = document.getElementById('recovered-count');
    elements.simulationSpeed = document.getElementById('simulation-speed');
    elements.simulationSpeedValue = document.getElementById('simulation-speed-value');
    elements.runUntilEradication = document.getElementById('run-until-eradication');
    
    // Cache slider elements
    paramSliders.rFactor.input = document.getElementById('r-factor');
    paramSliders.rFactor.display = document.getElementById('r-factor-value');
    paramSliders.incubationPeriod.input = document.getElementById('incubation-period');
    paramSliders.incubationPeriod.display = document.getElementById('incubation-period-value');
    paramSliders.infectiousPeriod.input = document.getElementById('infectious-period');
    paramSliders.infectiousPeriod.display = document.getElementById('infectious-period-value');
    paramSliders.asymptomaticRate.input = document.getElementById('asymptomatic-rate');
    paramSliders.asymptomaticRate.display = document.getElementById('asymptomatic-rate-value');
    paramSliders.transmissionMode.input = document.getElementById('transmission-mode');
    paramSliders.mortalityRate.input = document.getElementById('mortality-rate');
    paramSliders.mortalityRate.display = document.getElementById('mortality-rate-value');
    paramSliders.recoveryPeriod.input = document.getElementById('recovery-period');
    paramSliders.recoveryPeriod.display = document.getElementById('recovery-period-value');
    paramSliders.immunityDuration.input = document.getElementById('immunity-duration');
    paramSliders.immunityDuration.display = document.getElementById('immunity-duration-value');
    paramSliders.populationDensityFactor.input = document.getElementById('population-density-factor');
    paramSliders.populationDensityFactor.display = document.getElementById('population-density-factor-value');
    paramSliders.mobilityFactor.input = document.getElementById('mobility-factor');
    paramSliders.mobilityFactor.display = document.getElementById('mobility-factor-value');
    paramSliders.interventionType.input = document.getElementById('intervention-type');
    paramSliders.complianceRate.input = document.getElementById('compliance-rate');
    paramSliders.complianceRate.display = document.getElementById('compliance-rate-value');
    paramSliders.testingRate.input = document.getElementById('testing-rate');
    paramSliders.testingRate.display = document.getElementById('testing-rate-value');
    paramSliders.healthcareCapacity.input = document.getElementById('healthcare-capacity');
    paramSliders.healthcareCapacity.display = document.getElementById('healthcare-capacity-value');
    
    // Set up event listeners
    setupEventListeners();
    
    // Update stats initially
    updateStats({
      infected: 0,
      deceased: 0,
      recovered: 0
    });
  };
  
  /**
   * Sets up event listeners for controls
   */
  const setupEventListeners = () => {
    // Theme toggle
    elements.themeToggle.addEventListener('change', toggleTheme);
    
    // Simulation controls
    elements.startBtn.addEventListener('click', startSimulation);
    elements.pauseBtn.addEventListener('click', pauseSimulation);
    elements.resetBtn.addEventListener('click', resetSimulation);
    
    // Simulation speed
    elements.simulationSpeed.addEventListener('input', () => {
      const speed = parseFloat(elements.simulationSpeed.value);
      elements.simulationSpeedValue.textContent = `${speed.toFixed(1)}x`;
      SimulationEngine.setSimulationSpeed(speed);
    });
    
    // Run until eradication checkbox
    elements.runUntilEradication.addEventListener('change', () => {
      SimulationEngine.setRunUntilEradication(elements.runUntilEradication.checked);
      console.log(`Run until eradication set to: ${elements.runUntilEradication.checked}`);
    });
    
    // Setup parameter sliders
    setupParameterSliders();
    
    // Subscribe to simulation events
    SimulationEngine.addEventListener('onDayChange', (data) => {
      elements.dayCount.textContent = data.day;
    });
    
    SimulationEngine.addEventListener('onStatisticsUpdate', updateStats);
    
    SimulationEngine.addEventListener('onStatusChange', (data) => {
      console.log('Status change event:', data.status);
      
      if (data.status === 'started' || data.status === 'resumed') {
        setRunningState(true);
      } else if (data.status === 'paused') {
        setPausedState(true);
      } else if (data.status === 'stopped' || data.status === 'reset') {
        setRunningState(false);
        setPausedState(false);
      } else if (data.status === 'needPatientZero') {
        // Show message to user that they need to select a patient zero
        const selectedCityElement = document.getElementById('selected-city');
        if (selectedCityElement) {
          selectedCityElement.textContent = 'Please select a city on the map as Patient Zero';
          selectedCityElement.style.color = '#ff0000'; // Highlight in red
          
          // Reset color after 3 seconds
          setTimeout(() => {
            selectedCityElement.style.color = '';
          }, 3000);
        }
        
        // Ensure start button is disabled until a city is selected
        elements.startBtn.disabled = true;
      } else if (data.status === 'patientZeroSet') {
        // Enable start button when patient zero is set
        elements.startBtn.disabled = false;
        elements.startBtn.classList.remove('disabled');
      }
    });
  };
  
  /**
   * Sets up event listeners for parameter sliders
   */
  const setupParameterSliders = () => {
    // R-Factor
    paramSliders.rFactor.input.addEventListener('input', () => {
      const value = parseFloat(paramSliders.rFactor.input.value);
      paramSliders.rFactor.display.textContent = value.toFixed(1);
      SimulationEngine.updateParams({ rFactor: value });
    });
    
    // Incubation Period
    paramSliders.incubationPeriod.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.incubationPeriod.input.value);
      paramSliders.incubationPeriod.display.textContent = value;
      SimulationEngine.updateParams({ incubationPeriod: value });
    });
    
    // Infectious Period
    paramSliders.infectiousPeriod.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.infectiousPeriod.input.value);
      paramSliders.infectiousPeriod.display.textContent = value;
      SimulationEngine.updateParams({ infectiousPeriod: value });
    });
    
    // Asymptomatic Rate
    paramSliders.asymptomaticRate.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.asymptomaticRate.input.value);
      paramSliders.asymptomaticRate.display.textContent = `${value}%`;
      SimulationEngine.updateParams({ asymptomaticRate: value / 100 });
    });
    
    // Transmission Mode
    paramSliders.transmissionMode.input.addEventListener('change', () => {
      const value = paramSliders.transmissionMode.input.value;
      SimulationEngine.updateParams({ transmissionMode: value });
    });
    
    // Mortality Rate
    paramSliders.mortalityRate.input.addEventListener('input', () => {
      const value = parseFloat(paramSliders.mortalityRate.input.value);
      paramSliders.mortalityRate.display.textContent = `${value.toFixed(1)}%`;
      SimulationEngine.updateParams({ mortalityRate: value / 100 });
    });
    
    // Recovery Period
    paramSliders.recoveryPeriod.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.recoveryPeriod.input.value);
      paramSliders.recoveryPeriod.display.textContent = value;
      SimulationEngine.updateParams({ recoveryPeriod: value });
    });
    
    // Immunity Duration
    paramSliders.immunityDuration.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.immunityDuration.input.value);
      paramSliders.immunityDuration.display.textContent = value;
      SimulationEngine.updateParams({ immunityDuration: value });
    });
    
    // Population Density Factor
    paramSliders.populationDensityFactor.input.addEventListener('input', () => {
      const value = parseFloat(paramSliders.populationDensityFactor.input.value);
      paramSliders.populationDensityFactor.display.textContent = value.toFixed(1);
      SimulationEngine.updateParams({ populationDensityFactor: value });
    });
    
    // Mobility Factor
    paramSliders.mobilityFactor.input.addEventListener('input', () => {
      const value = parseFloat(paramSliders.mobilityFactor.input.value);
      paramSliders.mobilityFactor.display.textContent = value.toFixed(1);
      SimulationEngine.updateParams({ mobilityFactor: value });
    });
    
    // Intervention Type
    paramSliders.interventionType.input.addEventListener('change', () => {
      const value = paramSliders.interventionType.input.value;
      SimulationEngine.updateParams({ interventionType: value });
    });
    
    // Compliance Rate
    paramSliders.complianceRate.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.complianceRate.input.value);
      paramSliders.complianceRate.display.textContent = `${value}%`;
      SimulationEngine.updateParams({ complianceRate: value / 100 });
    });
    
    // Testing Rate
    paramSliders.testingRate.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.testingRate.input.value);
      paramSliders.testingRate.display.textContent = `${value}%`;
      SimulationEngine.updateParams({ testingRate: value / 100 });
    });
    
    // Healthcare Capacity
    paramSliders.healthcareCapacity.input.addEventListener('input', () => {
      const value = parseInt(paramSliders.healthcareCapacity.input.value);
      paramSliders.healthcareCapacity.display.textContent = `${value}%`;
      SimulationEngine.updateParams({ healthcareCapacity: value / 100 });
    });
  };
  
  /**
   * Updates the statistics display
   * @param {Object} stats - Statistics object
   */
  const updateStats = (stats) => {
    elements.infectedCount.textContent = stats.infected.toLocaleString();
    elements.deceasedCount.textContent = stats.deceased.toLocaleString();
    elements.recoveredCount.textContent = stats.recovered.toLocaleString();
  };
  
  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    const isDarkMode = elements.themeToggle.checked;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      elements.darkModeStylesheet.removeAttribute('disabled');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      elements.darkModeStylesheet.setAttribute('disabled', '');
    }
  };
  
  /**
   * Starts or resumes the simulation
   */
  const startSimulation = () => {
    SimulationEngine.startSimulation();
  };
  
  /**
   * Pauses the simulation
   */
  const pauseSimulation = () => {
    SimulationEngine.pauseSimulation();
  };
  
  /**
   * Resets the simulation
   */
  const resetSimulation = () => {
    SimulationEngine.resetSimulation();
    // Keep the run-until-eradication setting after reset
    SimulationEngine.setRunUntilEradication(elements.runUntilEradication.checked);
  };
  
  /**
   * Sets the UI state for when the simulation is running
   * @param {Boolean} isRunning - Whether the simulation is running
   */
  const setRunningState = (isRunning) => {
    console.log('setRunningState called with:', isRunning);
    elements.startBtn.disabled = isRunning;
    elements.pauseBtn.disabled = !isRunning;
    
    // If simulation is not running, ensure start button is enabled
    if (!isRunning) {
      elements.startBtn.classList.remove('disabled');
      elements.startBtn.removeAttribute('disabled');
    }
    
    // Disable parameter controls while running
    Object.values(paramSliders).forEach(slider => {
      if (slider.input) {
        slider.input.disabled = isRunning;
      }
    });
  };
  
  /**
   * Sets the UI state for when the simulation is paused
   * @param {Boolean} isPaused - Whether the simulation is paused
   */
  const setPausedState = (isPaused) => {
    elements.startBtn.disabled = !isPaused;
    elements.pauseBtn.disabled = !isPaused;
    
    if (isPaused) {
      elements.startBtn.textContent = 'Resume';
    } else {
      elements.startBtn.textContent = 'Start';
    }
  };
  
  return {
    init
  };
})(); 