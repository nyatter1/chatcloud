import pkg from 'pg';
const { Pool } = pkg;

// In-memory fallback store
const inMemoryStore = new Map();

let pool = null;
let isPgConnected = false;

// Initialize PostgreSQL pool if DATABASE_URL is present
if (process.env.DATABASE_URL) {
  try {
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    // Auto-create store table for document collections
    pool.query(`
      CREATE TABLE IF NOT EXISTS chatlaxy_store (
        collection_name VARCHAR(64) NOT NULL,
        doc_id VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (collection_name, doc_id)
      );
    `).then(() => {
      isPgConnected = true;
      console.log('PostgreSQL storage initialized successfully.');
    }).catch((err) => {
      console.warn('PostgreSQL table creation warning:', err.message);
    });
  } catch (err) {
    console.warn('Failed to initialize PostgreSQL pool, using in-memory store fallback:', err.message);
  }
}

export const dbService = {
  async getDoc(collection, id) {
    const docId = String(id).toLowerCase().trim();
    if (pool && isPgConnected) {
      try {
        const res = await pool.query(
          'SELECT data FROM chatlaxy_store WHERE collection_name = $1 AND doc_id = $2',
          [collection, docId]
        );
        if (res.rows.length > 0) {
          return res.rows[0].data;
        }
        return null;
      } catch (err) {
        console.warn(`PostgreSQL getDoc error (${collection}/${docId}):`, err.message);
      }
    }
    const colMap = inMemoryStore.get(collection);
    return colMap ? colMap.get(docId) || null : null;
  },

  async setDoc(collection, id, data, merge = true) {
    const docId = String(id).toLowerCase().trim();
    let finalData = data;
    if (merge) {
      const existing = await this.getDoc(collection, docId);
      if (existing) {
        finalData = { ...existing, ...data };
      }
    }

    if (pool && isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO chatlaxy_store (collection_name, doc_id, data, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (collection_name, doc_id)
           DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [collection, docId, JSON.stringify(finalData), Date.now()]
        );
      } catch (err) {
        console.warn(`PostgreSQL setDoc error (${collection}/${docId}):`, err.message);
      }
    }

    if (!inMemoryStore.has(collection)) {
      inMemoryStore.set(collection, new Map());
    }
    inMemoryStore.get(collection).set(docId, finalData);
    return finalData;
  },

  async getCollection(collection) {
    if (pool && isPgConnected) {
      try {
        const res = await pool.query(
          'SELECT data FROM chatlaxy_store WHERE collection_name = $1 ORDER BY updated_at ASC',
          [collection]
        );
        return res.rows.map((r) => r.data);
      } catch (err) {
        console.warn(`PostgreSQL getCollection error (${collection}):`, err.message);
      }
    }
    const colMap = inMemoryStore.get(collection);
    if (!colMap) return [];
    return Array.from(colMap.values());
  },

  async deleteDoc(collection, id) {
    const docId = String(id).toLowerCase().trim();
    if (pool && isPgConnected) {
      try {
        await pool.query(
          'DELETE FROM chatlaxy_store WHERE collection_name = $1 AND doc_id = $2',
          [collection, docId]
        );
      } catch (err) {
        console.warn(`PostgreSQL deleteDoc error (${collection}/${docId}):`, err.message);
      }
    }
    const colMap = inMemoryStore.get(collection);
    if (colMap) {
      colMap.delete(docId);
    }
  },

  async clearCollection(collection) {
    if (pool && isPgConnected) {
      try {
        await pool.query(
          'DELETE FROM chatlaxy_store WHERE collection_name = $1',
          [collection]
        );
      } catch (err) {
        console.warn(`PostgreSQL clearCollection error (${collection}):`, err.message);
      }
    }
    inMemoryStore.set(collection, new Map());
  },
};

export default dbService;
