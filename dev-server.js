import express from 'express';
import path from 'path';
import fs from 'fs';
import url from 'url';

const app = express();
app.use(express.json({ limit: '20mb' }));
const root = process.cwd();

// Serve static files from project root
app.use(express.static(root));

// Simple API router that imports files from /api/<name>.js
const handleApi = async (rawName, req, res) => {
  const name = String(rawName || '').replace(/\.js$/i, '');
  const filePath = path.join(root, 'api', `${name}.js`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Dynamic import using file URL
    const mod = await import(url.pathToFileURL(filePath).href);
    if (mod && typeof mod.default === 'function') {
      // Call the exported handler
      await mod.default(req, res);
    } else {
      res.status(500).json({ error: 'Module does not export default handler' });
    }
  } catch (err) {
    console.error('API handler error', err);
    try { res.status(500).json({ error: 'Handler error', details: String(err) }); } catch(e) {}
  }
};

// Support both `/api/name` and `/api/name.js` URL styles
app.all('/api/:name', async (req, res) => handleApi(req.params.name, req, res));
app.all('/api/:name.js', async (req, res) => handleApi(req.params.name, req, res));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Dev server running at http://127.0.0.1:${port}`));
