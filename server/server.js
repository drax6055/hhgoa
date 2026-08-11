import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Directories for storage
const storageDir = path.join(__dirname, 'public', 'i');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// In-memory / JSON store for metadata
const metaStore = new Map();

// 1. Generate API endpoint
app.post('/api/generate', (req, res) => {
  try {
    const { imageBase64, format, name, builderTitle } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data' });
    }

    // Generate short random ID
    const id = Math.random().toString(36).substring(2, 10);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save PNG file
    const filePath = path.join(storageDir, `${id}.png`);
    fs.writeFileSync(filePath, buffer);

    // Save metadata
    metaStore.set(id, {
      format: format || 'formatA',
      name: name || 'HH Goa Builder',
      builderTitle: builderTitle || 'Chaos Architect',
      createdAt: new Date().toISOString()
    });

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    const shareUrl = `${protocol}://${host}/c/${id}`;
    const imageUrl = `${protocol}://${host}/i/${id}.png`;

    return res.json({
      id,
      shareUrl,
      imageUrl
    });
  } catch (err) {
    console.error('Error generating card:', err);
    return res.status(500).json({ error: 'Failed to process card generation' });
  }
});

// 2. Serve Image File with immutable cache headers
app.get('/i/:id.png', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(storageDir, `${id}.png`);
  if (fs.existsSync(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(filePath);
  }
  return res.status(404).send('Image not found');
});

// 3. Share page for Twitter OG card unfurling
app.get('/c/:id', (req, res) => {
  const id = req.params.id;
  const meta = metaStore.get(id) || { name: 'HH Goa Builder', builderTitle: 'Builder' };
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const imageUrl = `${protocol}://${host}/i/${id}.png`;
  const appUrl = `${protocol}://${host}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HH Goa 2026 — ${meta.name}'s Badge (#FrameInGoa)</title>

  <!-- OpenGraph Meta Tags for X/Twitter -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="HH Goa 2026 — ${meta.name} (${meta.builderTitle})" />
  <meta property="og:description" content="Check out my HH Goa 2026 graphic! Built with #FrameInGoa" />
  <meta property="og:image" content="${imageUrl}" />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="HH Goa 2026 — ${meta.name}" />
  <meta name="twitter:description" content="Join HH Goa 2026! #FrameInGoa" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    body { background: #080914; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; text-align: center; }
    img { max-width: 90%; max-height: 70vh; border-radius: 16px; border: 2px solid #00f2fe; box-shadow: 0 0 30px rgba(0,242,254,0.3); margin: 1.5rem 0; }
    a.btn { background: linear-gradient(135deg, #00f2fe, #9d4edd); color: #fff; text-decoration: none; padding: 0.8rem 1.8rem; border-radius: 30px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>HH Goa 2026 Badge</h1>
  <p>Created by ${meta.name} • #FrameInGoa</p>
  <img src="${imageUrl}" alt="HH Goa 2026 Badge" />
  <br/>
  <a class="btn" href="${appUrl}">Create Your Own HH Goa Graphic</a>
</body>
</html>`;

  res.send(html);
});

// Serve frontend static files if dist exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`HH Goa 2026 Server running on http://localhost:${PORT}`);
});
