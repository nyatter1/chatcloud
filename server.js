import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import dbService from './services/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurable CORS
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === frontendUrl || origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    })
  );
} else {
  app.use(cors());
}

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ====================================================
// 1. HEALTH ENDPOINT
// ====================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'chatlaxy',
  });
});

// ====================================================
// 2. USERS API
// ====================================================
app.get('/api/users', async (req, res) => {
  try {
    const list = await dbService.getCollection('users');
    const usersMap = {};
    list.forEach((u) => {
      if (u && u.username) {
        usersMap[u.username.toLowerCase().trim()] = u;
      }
    });
    res.json(usersMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await dbService.getDoc('users', req.params.username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || !profile.username) {
      return res.status(400).json({ error: 'Username required' });
    }
    const saved = await dbService.setDoc('users', profile.username, profile, true);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    await dbService.deleteDoc('users', req.params.username);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 3. MESSAGES API
// ====================================================
app.get('/api/messages', async (req, res) => {
  try {
    const list = await dbService.getCollection('messages');
    list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    res.json(list.slice(-250));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const msg = req.body;
    if (!msg || !msg.id) {
      return res.status(400).json({ error: 'Message ID required' });
    }
    const saved = await dbService.setDoc('messages', msg.id, msg, false);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    await dbService.deleteDoc('messages', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages', async (req, res) => {
  try {
    const { announcementMessage } = req.body || {};
    await dbService.clearCollection('messages');
    if (announcementMessage && announcementMessage.id) {
      await dbService.setDoc('messages', announcementMessage.id, announcementMessage, false);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 4. AUDIT LOGS API
// ====================================================
app.get('/api/audit-logs', async (req, res) => {
  try {
    const list = await dbService.getCollection('audit_logs');
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(list.slice(0, 150));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const entry = req.body;
    if (!entry || !entry.id) {
      return res.status(400).json({ error: 'Log entry ID required' });
    }
    const saved = await dbService.setDoc('audit_logs', entry.id, entry, false);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/audit-logs', async (req, res) => {
  try {
    await dbService.clearCollection('audit_logs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 5. RIGGED USERS CONFIG API
// ====================================================
app.get('/api/config/rigged', async (req, res) => {
  try {
    const config = await dbService.getDoc('system_config', 'rigged_users');
    res.json(config?.users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config/rigged', async (req, res) => {
  try {
    const { username, rigged } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    const config = (await dbService.getDoc('system_config', 'rigged_users')) || { users: [] };
    const currentList = Array.isArray(config.users) ? config.users : [];
    const cleanName = username.trim().toLowerCase();
    const filtered = currentList.filter((u) => u.toLowerCase() !== cleanName);
    if (rigged) {
      filtered.push(cleanName);
    }
    await dbService.setDoc('system_config', 'rigged_users', { users: filtered }, false);
    res.json({ users: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 6. NEWS API
// ====================================================
app.get('/api/news', async (req, res) => {
  try {
    const list = await dbService.getCollection('news');
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(list.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const post = req.body;
    if (!post || !post.id) return res.status(400).json({ error: 'Post ID required' });
    const saved = await dbService.setDoc('news', post.id, post, false);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const post = req.body;
    const saved = await dbService.setDoc('news', req.params.id, post, true);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    await dbService.deleteDoc('news', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 7. NOTIFICATIONS API
// ====================================================
app.get('/api/notifications/:username', async (req, res) => {
  try {
    const cleanName = req.params.username.trim().toLowerCase();
    const list = await dbService.getCollection('notifications');
    const filtered = list.filter((n) => {
      const target = (n.recipientUsername || '').toLowerCase();
      return target === cleanName || target === 'all';
    });
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(filtered.slice(0, 100));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notif = req.body;
    if (!notif || !notif.id) return res.status(400).json({ error: 'Notification ID required' });
    const saved = await dbService.setDoc('notifications', notif.id, notif, false);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await dbService.deleteDoc('notifications', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/user/:username', async (req, res) => {
  try {
    const cleanName = req.params.username.trim().toLowerCase();
    const list = await dbService.getCollection('notifications');
    for (const n of list) {
      const target = (n.recipientUsername || '').toLowerCase();
      if (target === cleanName || target === 'all') {
        await dbService.deleteDoc('notifications', n.id);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 8. STATIC FILES / VITE DEV MIDDLEWARE
// ====================================================
if (process.env.NODE_ENV !== 'production') {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (err) {
    console.warn('Vite dev middleware warning:', err.message);
  }
} else {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chatlaxy API Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f111a; color: #a6accd; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h1 { color: #82aaff; margin-bottom: 8px; }
            p { font-size: 14px; color: #8f93a2; }
            .badge { background: #1e213a; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-family: monospace; color: #c3e88d; }
          </style>
        </head>
        <body>
          <h1>Chatlaxy API Backend</h1>
          <p>The backend services are live and healthy.</p>
          <div class="badge">Status: Online</div>
        </body>
        </html>
      `);
    });
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chatlaxy server listening on port ${PORT}`);
});
