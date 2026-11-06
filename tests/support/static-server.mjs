/**
 * Minimal zero-dependency static file server for the production build.
 *
 * Mirrors the Netlify `_redirects` rule (`/* /index.html 200`) so Angular
 * deep links such as /know-your-hazards/flood resolve to the SPA shell.
 *
 * Usage: node tests/support/static-server.mjs [port] [root]
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const port = Number(process.argv[2] || process.env.PORT || 4200);
const root = resolve(process.argv[3] || 'dist/noah-frontend');
const indexFile = join(root, 'index.html');

if (!existsSync(indexFile)) {
  console.error(
    `[static-server] ${indexFile} not found. Run "npm run e2e:build" first.`
  );
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.geojson': 'application/geo+json',
};

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const candidate = normalize(join(root, decoded));
  // Block path traversal outside of the build directory.
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url || '/');
  // Unknown paths without a file extension are SPA routes -> index.html.
  // Unknown paths *with* an extension are genuinely missing assets -> 404,
  // so tests can detect broken asset references.
  const isAssetRequest = extname((req.url || '').split('?')[0]) !== '';
  const target = file || (isAssetRequest ? null : indexFile);

  if (!target) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type':
      MIME_TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(port, () => {
  console.log(`[static-server] Serving ${root} on http://localhost:${port}`);
});
