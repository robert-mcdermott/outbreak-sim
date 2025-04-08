# Viral Outbreak Simulator

A high-resolution, interactive viral outbreak simulator for the continental USA that runs entirely on the client side. This application allows users to visualize and experiment with the spread of a viral outbreak across major cities in the United States.

## Features

- Interactive map of the continental United States showing all major cities
- Real-time indicators for infected population, deceased population, and recovered population
- Geographically aware transmission visualization
- Dynamic visualization of infection spread over time
- Patient zero selection by clicking on any city
- Comprehensive disease parameter controls:
  - R-factor (Basic Reproduction Number)
  - Incubation Period
  - Infectious Period
  - Asymptomatic Transmission Rate
  - Transmission Mode (Airborne, Direct Contact, Fluid Exchange)
  - Mortality Rate
  - Recovery Period
  - Immunity Duration
- Population and intervention controls
- Simulation speed controls
- Light and Dark mode (with SynthWave '84 style dark mode)
- Simulation report with statistics and graphs
- Downloadable data in JSON format

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for running the local server) or Python (for running a simple HTTP server)

### Running the Application

1. Clone this repository:
   ```
   git clone [repository-url]
   cd outbreak-sim
   ```

2. Start the application:

   **Option 1: Using Node.js server**
   ```
   node server.js
   ```
   Then open your browser and go to `http://localhost:3000`

   **Option 2: Using a simple HTTP server**
   ```
   python -m http.server
   ```
   Then open your browser and go to `http://localhost:8000`

   > **Note:** Opening the `index.html` file directly in your browser (without a server) will not work due to CORS restrictions when loading the city data JSON files.

## How to Use

1. When the application loads, you'll see a map of the United States with major cities marked.
2. Click on any city to set it as "Patient Zero" - the starting point of the infection.
3. Adjust the disease parameters using the control panel sliders.
4. Press the "Start" button to begin the simulation.
5. Use the "Pause" and "Reset" buttons to control the simulation.
6. Toggle between Light and Dark modes using the switch in the top-right corner.
7. When the simulation ends, a report will be displayed with statistics and a chart.

## Detailed Settings Guide

### Disease Parameters

- **R-factor (Basic Reproduction Number)**: Determines how many people one infected person will transmit the disease to in a fully susceptible population. Higher values cause faster spread.
  - Range: 1.0-10.0
  - Example: COVID-19 ≈ 2.5, Influenza ≈ 1.5, SARS ≈ 3.0
  - Note: Some diseases like measles (≈15) have R-factors beyond this simulator's range

- **Incubation Period (days)**: The time between exposure and when symptoms appear. During this time, the person may still be infectious depending on the asymptomatic rate.
  - Range: 1-21 days

- **Infectious Period (days)**: How long an infected person can transmit the disease to others.
  - Range: 1-30 days

- **Asymptomatic Rate (%)**: Percentage of infections that show no symptoms but can still transmit the disease. Higher rates make the disease harder to contain.
  - Range: 0-100%

- **Transmission Mode**: The primary method of disease transmission:
  - Airborne: Easiest to spread (1.5× multiplier)
  - Direct Contact: Moderate spread (1.0× multiplier)
  - Fluid Exchange: Most difficult to spread (0.6× multiplier)

- **Mortality Rate (%)**: Percentage of infected people who will die from the disease.
  - Range: 0-100%
  - Note: Actual mortality may increase if healthcare capacity is exceeded

- **Recovery Period (days)**: How long it takes for an infected person to recover.
  - Range: 1-30 days

- **Immunity Duration (days)**: How long recovered individuals remain immune before potentially becoming susceptible again.
  - Range: 0-365 days
  - Setting to 0 means no immunity after recovery

### Population Variables

- **Population Density Factor**: Adjusts how much population density affects transmission rates. Higher values make dense cities more dangerous.
  - Range: 0.1-2.0

- **Mobility Factor**: Adjusts how far people typically travel, affecting disease spread between cities. Higher values cause wider geographic spread.
  - Range: 0.1-2.0

### Intervention Variables

- **Intervention Type**: Public health measures that can be implemented:
  - None: No interventions
  - Mask Mandate: 30% reduction in transmission with 100% compliance
  - Social Distancing: 50% reduction in transmission with 100% compliance
  - Lockdown: 90% reduction in transmission with 100% compliance
  - School Closure: 40% reduction in transmission with 100% compliance

- **Compliance Rate (%)**: Percentage of the population that follows the intervention guidelines. Higher compliance increases intervention effectiveness.
  - Range: 0-100%

- **Testing/Reporting Rate (%)**: Percentage of cases that are detected and reported. Affects data visibility but not disease dynamics in the current model.
  - Range: 0-100%

- **Healthcare Capacity (%)**: Percentage of the population that can receive proper healthcare simultaneously. When exceeded, mortality rates increase.
  - Range: 1-100%

### Simulation Controls

- **Simulation Speed**: Controls how quickly days pass in the simulation.
  - Range: 0.5-5 days per second

## Simulation End Conditions

The simulation will end under any of these conditions:

1. **Maximum Duration Reached**: The simulation runs for 365 days.

2. **Zero Infections**: No infections remain for 7 consecutive days.

3. **Controlled Outbreak**: Infections fall below a threshold (0.01% of the total population or at least 10 people) for 7 consecutive days, and it's been at least 30 days since the peak infection day.

4. **Manual Stop**: The user presses the "Reset" button.

### Understanding the "Controlled Outbreak" Condition

When analyzing real-world epidemics, public health agencies often consider an outbreak "controlled" when:
- The infection rate falls below a certain threshold
- The reproductive number (R) is consistently below 1
- New cases are manageable within the healthcare system

In this simulation, we use the threshold of 0.01% of the total population to determine when an outbreak is effectively controlled. While some infections may still exist, they represent a small, manageable portion of the population with a declining trend that's unlikely to cause another major outbreak wave under current conditions.

## Technical Details

The application is built using:
- Vanilla JavaScript
- Leaflet.js for mapping
- Chart.js for data visualization
- Custom-built simulation engine that models disease transmission between cities

The simulation uses a modified SIR (Susceptible, Infected, Recovered) model that takes into account:
- Geographic distance between cities
- Population density
- Various disease parameters
- Intervention effects
- Healthcare capacity
- City-to-city transmission dynamics

## License

This project is licensed under the APACHE 2 License - see the LICENSE file for details.

## Acknowledgments

- City data is based on major US cities and their geographic coordinates
- Outbreak modeling is inspired by compartmental models in epidemiology (SIR model)
- The SynthWave '84 dark theme is inspired by the popular VS Code theme 