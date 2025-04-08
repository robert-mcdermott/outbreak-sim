// Simple HTTP server for the Viral Outbreak Simulator
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME types for various file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Get the URL path
  let filePath = req.url;
  
  // Default to index.html for root path
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Resolve the file path relative to the current directory
  const resolvedPath = path.resolve(process.cwd(), `.${filePath}`);
  
  // Get the file extension
  const ext = path.extname(resolvedPath);
  
  // Set the Content-Type header based on the file extension
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      // File not found or other error
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`File not found: ${filePath}`);
      return;
    }
    
    // Return the file with appropriate headers
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
}); 