// Report Component for Viral Outbreak Simulator
const ReportComponent = (() => {
  // Track UI elements
  const elements = {
    reportContainer: null,
    reportBackdrop: null,
    reportInfected: null,
    reportDeceased: null,
    reportRecovered: null,
    reportSusceptible: null,
    reportPeakDate: null,
    reportPeakInfections: null,
    downloadBtn: null,
    newSimulationBtn: null,
    infectionChart: null
  };
  
  // Chart instance
  let chart = null;
  
  // Report data
  let reportData = null;
  
  /**
   * Initializes the report component
   */
  const init = () => {
    // Cache DOM elements
    elements.reportContainer = document.getElementById('report-container');
    elements.reportBackdrop = document.querySelector('.report-backdrop');
    elements.reportInfected = document.getElementById('report-infected');
    elements.reportDeceased = document.getElementById('report-deceased');
    elements.reportRecovered = document.getElementById('report-recovered');
    elements.reportSusceptible = document.getElementById('report-susceptible');
    elements.reportPeakDate = document.getElementById('report-peak-date');
    elements.reportPeakInfections = document.getElementById('report-peak-infections');
    elements.downloadBtn = document.getElementById('download-btn');
    elements.newSimulationBtn = document.getElementById('new-simulation-btn');
    elements.infectionChart = document.getElementById('infection-chart');
    
    // Set up event listeners
    setupEventListeners();
  };
  
  /**
   * Sets up event listeners for the report
   */
  const setupEventListeners = () => {
    // Listen for simulation end to generate report
    SimulationEngine.addEventListener('onSimulationEnd', generateReport);
    
    // Download button
    elements.downloadBtn.addEventListener('click', downloadReport);
    
    // New simulation button
    elements.newSimulationBtn.addEventListener('click', startNewSimulation);
    
    // Close report when clicking on backdrop
    elements.reportBackdrop.addEventListener('click', () => {
      elements.reportContainer.classList.add('hidden');
      elements.reportBackdrop.classList.add('hidden');
    });
  };
  
  /**
   * Generates a report based on simulation results
   * @param {Object} report - Report data from simulation
   */
  const generateReport = (report) => {
    // Store report data
    reportData = report;
    
    // Update report stats
    elements.reportInfected.textContent = report.finalStats.infected.toLocaleString();
    elements.reportDeceased.textContent = report.finalStats.deceased.toLocaleString();
    elements.reportRecovered.textContent = report.finalStats.recovered.toLocaleString();
    elements.reportSusceptible.textContent = report.finalStats.susceptible.toLocaleString();
    elements.reportPeakDate.textContent = `Day ${report.peakInfectionDay}`;
    elements.reportPeakInfections.textContent = report.peakInfections.toLocaleString();
    
    // Generate chart
    generateChart(report.history);
    
    // Show the report container and backdrop
    elements.reportContainer.classList.remove('hidden');
    elements.reportBackdrop.classList.remove('hidden');
  };
  
  /**
   * Generates a chart of infection over time
   * @param {Array} history - Array of daily statistics
   */
  const generateChart = (history) => {
    // Prepare data for the chart
    const labels = history.map(day => `Day ${day.day}`);
    const infectedData = history.map(day => day.infected);
    const deceasedData = history.map(day => day.deceased);
    const recoveredData = history.map(day => day.recovered);
    
    // Destroy previous chart if it exists
    if (chart) {
      chart.destroy();
    }
    
    // Create the chart
    const ctx = elements.infectionChart.getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Infected',
            data: infectedData,
            borderColor: '#f56565',
            backgroundColor: 'rgba(245, 101, 101, 0.2)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Deceased',
            data: deceasedData,
            borderColor: '#4a5568',
            backgroundColor: 'rgba(74, 85, 104, 0.2)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Recovered',
            data: recoveredData,
            borderColor: '#48bb78',
            backgroundColor: 'rgba(72, 187, 120, 0.2)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Infection Progression Over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Day'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'People'
            },
            suggestedMin: 0
          }
        }
      }
    });
    
    // Update chart colors for dark mode
    updateChartTheme();
  };
  
  /**
   * Updates chart theme based on current mode
   */
  const updateChartTheme = () => {
    if (!chart) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
      // Dark mode colors
      chart.data.datasets[0].borderColor = '#fe4450'; // Infected
      chart.data.datasets[0].backgroundColor = 'rgba(254, 68, 80, 0.2)';
      
      chart.data.datasets[1].borderColor = '#b381c5'; // Deceased
      chart.data.datasets[1].backgroundColor = 'rgba(179, 129, 197, 0.2)';
      
      chart.data.datasets[2].borderColor = '#36f9f6'; // Recovered
      chart.data.datasets[2].backgroundColor = 'rgba(54, 249, 246, 0.2)';
      
      // Update text colors
      chart.options.plugins.title.color = '#ffffff';
      chart.options.plugins.legend.labels.color = '#ffffff';
      chart.options.scales.x.ticks.color = '#ffffff';
      chart.options.scales.y.ticks.color = '#ffffff';
      chart.options.scales.x.title.color = '#ffffff';
      chart.options.scales.y.title.color = '#ffffff';
      
    } else {
      // Light mode colors
      chart.data.datasets[0].borderColor = '#f56565'; // Infected
      chart.data.datasets[0].backgroundColor = 'rgba(245, 101, 101, 0.2)';
      
      chart.data.datasets[1].borderColor = '#4a5568'; // Deceased
      chart.data.datasets[1].backgroundColor = 'rgba(74, 85, 104, 0.2)';
      
      chart.data.datasets[2].borderColor = '#48bb78'; // Recovered
      chart.data.datasets[2].backgroundColor = 'rgba(72, 187, 120, 0.2)';
      
      // Update text colors
      chart.options.plugins.title.color = '#1a202c';
      chart.options.plugins.legend.labels.color = '#1a202c';
      chart.options.scales.x.ticks.color = '#1a202c';
      chart.options.scales.y.ticks.color = '#1a202c';
      chart.options.scales.x.title.color = '#1a202c';
      chart.options.scales.y.title.color = '#1a202c';
    }
    
    chart.update();
  };
  
  /**
   * Downloads the report data as JSON
   */
  const downloadReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `outbreak_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  /**
   * Starts a new simulation by resetting everything
   */
  const startNewSimulation = () => {
    console.log('New Simulation button clicked');
    
    // Hide the report and backdrop
    elements.reportContainer.classList.add('hidden');
    elements.reportBackdrop.classList.add('hidden');
    
    console.log('Resetting simulation and clearing patient zero');
    // Reset the simulation with clearPatient=true to force new patient zero selection
    SimulationEngine.resetSimulation(true);
    
    // Clear patient zero to force user to pick a new one
    SimulationEngine.clearPatientZero();
    
    // Reset the map to allow selecting a new patient zero
    MapComponent.resetMap();
    
    console.log('Simulation reset complete');
  };
  
  /**
   * Exposed method to update chart theme when global theme changes
   */
  const onThemeChange = () => {
    updateChartTheme();
  };
  
  return {
    init,
    onThemeChange
  };
})(); 