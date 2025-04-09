// Onboarding Component for Viral Outbreak Simulator
const OnboardingComponent = (() => {
  // DOM Elements
  const elements = {
    overlay: null,
    welcomeModal: null,
    startBtn: null,
    helperBtn: null,
    startSimBtn: null,
    mapContainer: null,
    selectedCity: null
  };

  // State
  let isFirstVisit = true;
  let activeTooltip = null;
  let highlight = null;
  let currentStep = 0;

  /**
   * Initializes the onboarding component
   */
  const init = () => {
    // Cache DOM elements
    elements.overlay = document.getElementById('onboarding-overlay');
    elements.welcomeModal = document.querySelector('.onboarding-welcome');
    elements.startBtn = document.getElementById('onboarding-start-btn');
    elements.helperBtn = document.getElementById('helper-button');
    elements.startSimBtn = document.getElementById('start-btn');
    elements.mapContainer = document.querySelector('.map-container');
    elements.selectedCity = document.getElementById('selected-city');

    // Check if this is the first visit (could use localStorage)
    isFirstVisit = !localStorage.getItem('hasVisitedBefore');
    
    // Setup event listeners
    setupEventListeners();
    
    // Show welcome modal on first visit
    if (isFirstVisit) {
      showWelcomeModal();
    } else {
      hideWelcomeModal();
      addStartButtonTooltip();
    }

    // Mark as visited
    localStorage.setItem('hasVisitedBefore', 'true');
  };

  /**
   * Sets up event listeners
   */
  const setupEventListeners = () => {
    // Start button in welcome modal
    elements.startBtn.addEventListener('click', () => {
      hideWelcomeModal();
      startOnboardingTour();
    });

    // Help button
    elements.helperBtn.addEventListener('click', () => {
      startOnboardingTour();
    });

    // Subscribe to simulation events for tooltips
    SimulationEngine.addEventListener('onStatusChange', (data) => {
      if (data.status === 'needPatientZero') {
        // Add tooltip to map container if not already showing
        if (!activeTooltip) {
          addMapTooltip();
        }
      } else if (data.status === 'patientZeroSet') {
        // Remove map tooltip and add start button tooltip
        removeTooltip();
        addStartButtonTooltip();
      } else if (data.status === 'started') {
        // Remove all tooltips once simulation starts
        removeTooltip();
        removeHighlight();
      }
    });

    // Listen for city selection
    document.addEventListener('citySelected', () => {
      removeTooltip();
      removeHighlight();
      addStartButtonTooltip();
    });
  };

  /**
   * Shows the welcome modal
   */
  const showWelcomeModal = () => {
    // Short delay to ensure styles are properly loaded
    setTimeout(() => {
      elements.overlay.classList.remove('hidden');
    }, 300);
  };

  /**
   * Hides the welcome modal
   */
  const hideWelcomeModal = () => {
    elements.overlay.classList.add('hidden');
  };

  /**
   * Starts the onboarding tour
   */
  const startOnboardingTour = () => {
    removeTooltip();
    removeHighlight();
    currentStep = 0;
    
    // Check if a city has been selected
    if (elements.selectedCity.textContent === 'No city selected') {
      addMapTooltip();
    } else {
      addStartButtonTooltip();
    }
  };

  /**
   * Adds a tooltip to the map
   */
  const addMapTooltip = () => {
    removeTooltip();
    removeHighlight();
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.id = 'map-tooltip';
    tooltip.textContent = 'Click on a city to set Patient Zero location';
    document.body.appendChild(tooltip);
    
    // Create highlight around map
    const highlight = document.createElement('div');
    highlight.className = 'tooltip-highlight';
    document.body.appendChild(highlight);
    
    // Position the tooltip and highlight
    const mapRect = elements.mapContainer.getBoundingClientRect();
    
    highlight.style.top = `${mapRect.top}px`;
    highlight.style.left = `${mapRect.left}px`;
    highlight.style.width = `${mapRect.width}px`;
    highlight.style.height = `${mapRect.height}px`;
    
    tooltip.style.top = `${mapRect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${mapRect.left + (mapRect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    
    // Add arrow
    tooltip.classList.add('bottom');
    
    activeTooltip = tooltip;
  };

  /**
   * Adds a tooltip to the start button
   */
  const addStartButtonTooltip = () => {
    // Only add if a city has been selected
    if (elements.selectedCity.textContent === 'No city selected') {
      return;
    }
    
    // Don't add if simulation is already running
    if (elements.startSimBtn.disabled) {
      return;
    }
    
    removeTooltip();
    removeHighlight();
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.id = 'start-tooltip';
    tooltip.textContent = 'Click Start to begin the simulation';
    document.body.appendChild(tooltip);
    
    // Create highlight around start button
    const highlight = document.createElement('div');
    highlight.className = 'tooltip-highlight';
    document.body.appendChild(highlight);
    
    // Position the tooltip and highlight
    const btnRect = elements.startSimBtn.getBoundingClientRect();
    
    highlight.style.top = `${btnRect.top}px`;
    highlight.style.left = `${btnRect.left}px`;
    highlight.style.width = `${btnRect.width}px`;
    highlight.style.height = `${btnRect.height}px`;
    
    tooltip.style.top = `${btnRect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${btnRect.left + (btnRect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    
    // Add arrow
    tooltip.classList.add('bottom');
    
    activeTooltip = tooltip;
  };

  /**
   * Removes active tooltip
   */
  const removeTooltip = () => {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  };

  /**
   * Removes active highlight
   */
  const removeHighlight = () => {
    const highlight = document.querySelector('.tooltip-highlight');
    if (highlight) {
      highlight.remove();
    }
  };

  /**
   * Public API
   */
  return {
    init
  };
})();

// Initialize onboarding component after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // We'll initialize this component last
  setTimeout(() => {
    try {
      OnboardingComponent.init();
    } catch (error) {
      console.error('Error initializing onboarding component:', error);
    }
  }, 500);
}); 