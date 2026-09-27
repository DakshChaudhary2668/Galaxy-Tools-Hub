const path = require('path');
const http = require('http');

let next;
try {
  next = require('next');
} catch {
  next = require(path.join(__dirname, 'apps/web/node_modules/next'));
}

const dev = false;
const app = next({ dev, dir: path.join(__dirname, 'apps/web') });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Galaxy Web ready on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});
