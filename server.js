import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import dbService from './services/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurable CORS with secure credentials support for Session Cookies
app.use(
  cors({
    origin: (origin, callback) => {
      // Mirror request origin to allow HTTP-Only cookie transfer
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper function to parse HTTP cookies manually
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const val = (parts[1] || '').trim();
    if (name) cookies[name] = val;
  });
  return cookies;
}

// Cookie parser middleware
app.use((req, res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

// PBKDF2 Password hashing utilities
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

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
// AUTHENTICATION SYSTEM (COOKIES & DATABASE SESSIONS)
// ====================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, profileData } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const cleanUsername = username.trim();
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 2 and 20 characters' });
    }
    const key = cleanUsername.toLowerCase();

    // Enforce uniqueness
    const existing = await dbService.getDoc('users', key);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash & store private credentials securely (separate from public profiles)
    const passwordHash = hashPassword(password);
    await dbService.setDoc('credentials', key, { username: cleanUsername, passwordHash }, false);

    // Save profile to users collection
    const defaultProfile = {
      username: cleanUsername,
      profilePicture: null,
      banner: null,
      mood: 'Exploring Chatlaxy',
      bioSegments: [],
      rank: 'MEMBER',
      wallet: { ruby: 25, gold: 1000 },
      lastDailyClaim: 0,
      dailyMessagesCount: 0,
      ...(profileData || {})
    };
    await dbService.setDoc('users', key, defaultProfile, false);

    // Create session token and persist to database
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    await dbService.setDoc('sessions', sessionToken, { username: cleanUsername, expiresAt }, false);

    // Set secure HttpOnly session cookie
    res.cookie('chatlaxy_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json(defaultProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const key = username.trim().toLowerCase();

    // Verify credentials
    const creds = await dbService.getDoc('credentials', key);
    if (!creds || !verifyPassword(password, creds.passwordHash)) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    // Retrieve user profile
    let profile = await dbService.getDoc('users', key);
    if (!profile) {
      profile = {
        username: creds.username,
        profilePicture: null,
        banner: null,
        mood: 'Exploring Chatlaxy',
        bioSegments: [],
        rank: 'MEMBER',
        wallet: { ruby: 25, gold: 1000 },
        lastDailyClaim: 0,
        dailyMessagesCount: 0
      };
      await dbService.setDoc('users', key, profile, false);
    }

    // Create persistent session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await dbService.setDoc('sessions', sessionToken, { username: profile.username, expiresAt }, false);

    // Set HttpOnly session cookie
    res.cookie('chatlaxy_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.cookies['chatlaxy_session'];
    if (!token) {
      return res.json({ authenticated: false });
    }

    const session = await dbService.getDoc('sessions', token);
    if (!session || session.expiresAt < Date.now()) {
      return res.json({ authenticated: false });
    }

    const key = session.username.toLowerCase();
    const profile = await dbService.getDoc('users', key);
    if (!profile) {
      return res.json({ authenticated: false });
    }

    res.json({ authenticated: true, user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies['chatlaxy_session'];
    if (token) {
      await dbService.deleteDoc('sessions', token);
    }
    res.clearCookie('chatlaxy_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
// 9. SERVERS API
// ====================================================
app.get('/api/servers', async (req, res) => {
  try {
    const list = await dbService.getCollection('servers');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const { name, owner, iconUrl } = req.body;
    if (!name || !owner) return res.status(400).json({ error: 'Name and owner are required' });
    const id = `server-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const serverObj = { id, name, owner, iconUrl: iconUrl || null };
    await dbService.setDoc('servers', id, serverObj, false);
    
    const memberId = `${id}:${owner.toLowerCase()}`;
    await dbService.setDoc('server_members', memberId, { serverId: id, username: owner, roles: ['Owner'] }, false);
    
    const channelId = `channel-${Date.now()}-general`;
    const generalChannel = { id: channelId, serverId: id, name: 'general' };
    await dbService.setDoc('server_channels', channelId, generalChannel, false);

    res.status(201).json(serverObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:serverId/join', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const memberId = `${serverId}:${username.toLowerCase()}`;
    await dbService.setDoc('server_members', memberId, { serverId, username, roles: ['Member'] }, false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:serverId/leave', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { username } = req.body;
    const memberId = `${serverId}:${username.toLowerCase()}`;
    await dbService.deleteDoc('server_members', memberId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/servers/:serverId/members', async (req, res) => {
  try {
    const { serverId } = req.params;
    const list = await dbService.getCollection('server_members');
    const filtered = list.filter((m) => m.serverId === serverId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:serverId/members/:username/roles', async (req, res) => {
  try {
    const { serverId, username } = req.params;
    const { roles } = req.body;
    const memberId = `${serverId}:${username.toLowerCase()}`;
    const existing = await dbService.getDoc('server_members', memberId);
    if (!existing) return res.status(404).json({ error: 'Member not found' });
    existing.roles = roles || [];
    await dbService.setDoc('server_members', memberId, existing, false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 10. CHANNELS API
// ====================================================
app.get('/api/servers/:serverId/channels', async (req, res) => {
  try {
    const { serverId } = req.params;
    const list = await dbService.getCollection('server_channels');
    const filtered = list.filter((c) => c.serverId === serverId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:serverId/channels', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name required' });
    const id = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channelObj = { id, serverId, name: name.toLowerCase().replace(/\s+/g, '-') };
    await dbService.setDoc('server_channels', id, channelObj, false);
    res.status(201).json(channelObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 11. ROLES API
// ====================================================
app.get('/api/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const list = await dbService.getCollection('server_roles');
    const filtered = list.filter((r) => r.serverId === serverId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, colour, position, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name required' });
    const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const roleObj = {
      id,
      serverId,
      name,
      colour: colour || '#99aab5',
      position: position || 0,
      permissions: permissions || []
    };
    await dbService.setDoc('server_roles', id, roleObj, false);
    res.status(201).json(roleObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servers/:serverId/roles/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    await dbService.deleteDoc('server_roles', roleId);
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
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Chatlaxy is loading or the frontend build is missing. Please run "npm run build" to compile the static files.');
      }
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chatlaxy server listening on port ${PORT}`);
});
