const http = require('http');
const fs = require('fs');
const path = require('path');

const cacheDuration = 3600; // 1 hour;
const getExpireDateString = () => {
        return new Date(Date.now() + cacheDuration * 1000).toUTCString();
};

const port = 1313;
const publicDir = '~/website/public';

const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.txt': 'text',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
        let filePath = path.join(publicDir, req.url || '/');
        if (filePath === path.join(publicDir, '/')) {
                filePath = path.join(publicDir, 'index.html');
        }

        fs.stat(filePath, (err, stats) => {
                if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                        return;
                }

                if (stats.isDirectory()) {
                        filePath = path.join(filePath, 'index.html');
                }

                fs.readFile(filePath, (err, content) => {
                        if (err) {
                                res.writeHead(500, {
                                        'Content-Type': 'text/plain',
                                });
                                res.end('500 Internal Server Error');
                                return;
                        }

                        const extname = path.extname(filePath);
                        const contentType = mimeTypes[extname] || 'application/octet-stream';

                        res.writeHead(200, {
                                'Content-Type': contentType,
                                'Cache-Control': `public, max-age=${cacheDuration}`,
                                Expires: getExpireDateString(),
                        });
                        res.end(content);
                });
        });
});

server.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
});
