const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const port = Number(process.env.PORT || process.env.PASSENGER_PORT || 3000);
const distDir = path.join(__dirname, 'apps', 'web', 'dist');
const indexFile = path.join(distDir, 'index.html');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  if (body !== undefined) res.end(body);
  else res.end();
}

function safePathname(requestUrl) {
  try {
    const url = new URL(requestUrl || '/', 'http://localhost');
    return decodeURIComponent(url.pathname);
  } catch {
    return '/';
  }
}

function fileInsideDist(pathname) {
  const normalizedPathname = pathname === '/' ? '/index.html' : pathname;
  const requested = path.normalize(path.join(distDir, normalizedPathname));
  if (!requested.startsWith(distDir)) return null;
  return requested;
}

function serveFile(req, res, filePath, fallbackStatus = 200) {
  const extension = path.extname(filePath).toLowerCase();
  const stream = fs.createReadStream(filePath);
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  const headers = {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  };

  stream.on('error', () => send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Could not read file.'));
  res.writeHead(fallbackStatus, headers);
  if (req.method === 'HEAD') {
    stream.destroy();
    res.end();
    return;
  }
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  if (!fs.existsSync(indexFile)) {
    send(res, 503, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Build output not found. Run npm run build before starting Omukweyo.');
    return;
  }

  if (req.url?.startsWith('/api/health')) {
    send(res, 200, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ ok: true, mode: 'static-supabase' }));
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' }, 'Method not allowed.');
    return;
  }

  const pathname = safePathname(req.url);
  const requested = fileInsideDist(pathname);
  if (!requested) {
    send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Invalid path.');
    return;
  }

  fs.stat(requested, (error, stats) => {
    if (!error && stats.isFile()) {
      serveFile(req, res, requested);
      return;
    }

    if (path.extname(pathname)) {
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found.');
      return;
    }

    serveFile(req, res, indexFile);
  });
});

server.listen(port, () => {
  console.log(`Omukweyo static app listening on port ${port}`);
});
