// Main JavaScript file for Viral Outbreak Simulator

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Initializing Viral Outbreak Simulator...');
    
    // Initialize map component first (loads city data)
    await MapComponent.init();
    console.log('Map component initialized');
    
    // Initialize other components
    ControlsComponent.init();
    console.log('Controls component initialized');
    
    ReportComponent.init();
    console.log('Report component initialized');
    
    // Initial call to onThemeChange to ensure chart reflects dark mode
    ReportComponent.onThemeChange();
    
    // Connect theme toggle to update chart
    document.getElementById('theme-toggle').addEventListener('change', () => {
      ReportComponent.onThemeChange();
    });
    
    console.log('Viral Outbreak Simulator initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing application:', error);
    
    // Show error message to user
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.innerHTML = `
        <div class="error-message">
          <h3>Error Loading Application</h3>
          <p>${error.message}</p>
          <p>Please check the console for more details or try refreshing the page.</p>
        </div>
      `;
    }
  }
}); 