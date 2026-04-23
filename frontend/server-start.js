// Custom startup script for Pxxl deployment
// Forces Next.js standalone server to use Pxxl's injected PORT env var

const { createServer } = require('http');
const { parse } = require('url');
const next = require('./.next/standalone/node_modules/next/dist/server/next.js');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

const app = next.default({
  dir: './.next/standalone',
  dev: false,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});