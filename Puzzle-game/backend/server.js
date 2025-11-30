const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Set CORS head
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  
  let filePath;
  if (pathname.startsWith('/data/')) {
    //lead to backend/data/
    filePath = path.join(__dirname, 'data', pathname.substring(6));
  } else {
    //lead to frontend/
    filePath = path.join(__dirname, '../frontend', pathname);
  }

  const ext = path.extname(pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log('File not found',filePath);
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found');
      return;
    }
    
    const contentType = mimeTypes[ext] || 'text/plain';
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});