/**
 * Shree Ganesha Solar - Lead Management Database Layer
 * Provider-agnostic service layer with SQLite storage and JSON fallback.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'leads.db');
const JSON_BACKUP_FILE = path.join(DATA_DIR, 'leads-backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;
let useNativeSqlite = false;

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);
  useNativeSqlite = true;

  // Initialize Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      monthly_bill REAL,
      property_type TEXT,
      area TEXT,
      consent INTEGER DEFAULT 1,
      status TEXT DEFAULT 'new',
      notes TEXT DEFAULT '',
      utm_source TEXT DEFAULT '',
      utm_medium TEXT DEFAULT '',
      utm_campaign TEXT DEFAULT '',
      utm_term TEXT DEFAULT '',
      utm_content TEXT DEFAULT '',
      referrer TEXT DEFAULT '',
      ip_hash TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);
} catch (err) {
  console.warn('[DB] Native SQLite not initialized; using JSON file store fallback:', err.message);
  useNativeSqlite = false;
  if (!fs.existsSync(JSON_BACKUP_FILE)) {
    fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify([]), 'utf8');
  }
}

// Helpers for JSON fallback
function readJsonLeads() {
  try {
    if (!fs.existsSync(JSON_BACKUP_FILE)) return [];
    const raw = fs.readFileSync(JSON_BACKUP_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJsonLeads(leads) {
  fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

/**
 * Generate a unique, recognizable lead identifier
 */
function generateLeadId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SGS-${dateStr}-${randomHex}`;
}

/**
 * Lead Repository Interface
 */
const LeadRepository = {
  isSqlite() {
    return useNativeSqlite;
  },

  createLead(data) {
    const id = generateLeadId();
    const nowIso = new Date().toISOString();

    const record = {
      id,
      name: String(data.name || '').trim(),
      phone: String(data.phone || '').trim(),
      monthly_bill: Number(data.monthly_bill) || 0,
      property_type: String(data.property_type || 'home').trim(),
      area: String(data.area || '').trim(),
      consent: data.consent ? 1 : 0,
      status: 'new',
      notes: '',
      utm_source: String(data.utm_source || '').trim(),
      utm_medium: String(data.utm_medium || '').trim(),
      utm_campaign: String(data.utm_campaign || '').trim(),
      utm_term: String(data.utm_term || '').trim(),
      utm_content: String(data.utm_content || '').trim(),
      referrer: String(data.referrer || '').trim(),
      ip_hash: String(data.ip_hash || ''),
      user_agent: String(data.user_agent || '').slice(0, 255),
      created_at: nowIso,
      updated_at: nowIso
    };

    if (useNativeSqlite && db) {
      const stmt = db.prepare(`
        INSERT INTO leads (
          id, name, phone, monthly_bill, property_type, area, consent,
          status, notes, utm_source, utm_medium, utm_campaign, utm_term,
          utm_content, referrer, ip_hash, user_agent, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `);
      stmt.run(
        record.id, record.name, record.phone, record.monthly_bill, record.property_type, record.area, record.consent,
        record.status, record.notes, record.utm_source, record.utm_medium, record.utm_campaign, record.utm_term,
        record.utm_content, record.referrer, record.ip_hash, record.user_agent, record.created_at, record.updated_at
      );
    } else {
      const list = readJsonLeads();
      list.unshift(record);
      writeJsonLeads(list);
    }

    return record;
  },

  getLeads({ status = 'all', search = '', limit = 50, offset = 0 } = {}) {
    if (useNativeSqlite && db) {
      let query = 'SELECT * FROM leads';
      const params = [];
      const whereClauses = [];

      if (status && status !== 'all') {
        whereClauses.push('status = ?');
        params.push(status);
      }

      if (search && search.trim()) {
        whereClauses.push('(name LIKE ? OR phone LIKE ? OR area LIKE ?)');
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit) || 50, Number(offset) || 0);

      const stmt = db.prepare(query);
      const leads = stmt.all(...params);

      // Total count
      let countQuery = 'SELECT COUNT(*) as count FROM leads';
      const countParams = [];
      if (whereClauses.length > 0) {
        countQuery += ' WHERE ' + whereClauses.join(' AND ');
        countParams.push(...params.slice(0, -2));
      }
      const countStmt = db.prepare(countQuery);
      const total = countStmt.get(...countParams)?.count || leads.length;

      return { leads, total };
    } else {
      let list = readJsonLeads();
      if (status && status !== 'all') {
        list = list.filter(l => l.status === status);
      }
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        list = list.filter(l => 
          (l.name && l.name.toLowerCase().includes(term)) ||
          (l.phone && l.phone.includes(term)) ||
          (l.area && l.area.toLowerCase().includes(term))
        );
      }
      const total = list.length;
      const paginated = list.slice(offset, offset + limit);
      return { leads: paginated, total };
    }
  },

  getStats() {
    if (useNativeSqlite && db) {
      const allRows = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
      const stats = { total: 0, new: 0, contacted: 0, site_visit_scheduled: 0, closed_won: 0, closed_lost: 0 };
      allRows.forEach(r => {
        stats.total += r.count;
        if (stats[r.status] !== undefined) stats[r.status] = r.count;
      });
      return stats;
    } else {
      const list = readJsonLeads();
      const stats = { total: list.length, new: 0, contacted: 0, site_visit_scheduled: 0, closed_won: 0, closed_lost: 0 };
      list.forEach(r => {
        if (stats[r.status] !== undefined) stats[r.status]++;
      });
      return stats;
    }
  },

  updateLead(id, updates) {
    const nowIso = new Date().toISOString();
    if (useNativeSqlite && db) {
      const allowed = ['status', 'notes'];
      const setClauses = [];
      const params = [];

      for (const field of allowed) {
        if (updates[field] !== undefined) {
          setClauses.push(`${field} = ?`);
          params.push(updates[field]);
        }
      }

      if (setClauses.length === 0) return null;

      setClauses.push('updated_at = ?');
      params.push(nowIso);
      params.push(id);

      const sql = `UPDATE leads SET ${setClauses.join(', ')} WHERE id = ?`;
      const stmt = db.prepare(sql);
      stmt.run(...params);

      const fetchStmt = db.prepare('SELECT * FROM leads WHERE id = ?');
      return fetchStmt.get(id);
    } else {
      const list = readJsonLeads();
      const idx = list.findIndex(l => l.id === id);
      if (idx === -1) return null;

      if (updates.status !== undefined) list[idx].status = updates.status;
      if (updates.notes !== undefined) list[idx].notes = updates.notes;
      list[idx].updated_at = nowIso;
      writeJsonLeads(list);
      return list[idx];
    }
  },

  exportCsv() {
    let allLeads = [];
    if (useNativeSqlite && db) {
      allLeads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    } else {
      allLeads = readJsonLeads();
    }

    const headers = [
      'Lead ID', 'Date & Time', 'Name', 'Phone', 'Monthly Bill (INR)',
      'Property Type', 'Area in Pune', 'Status', 'Staff Notes',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer'
    ];

    const escapeCsv = (val) => {
      const str = String(val == null ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = allLeads.map(l => [
      l.id,
      l.created_at,
      l.name,
      l.phone,
      l.monthly_bill,
      l.property_type,
      l.area,
      l.status,
      l.notes,
      l.utm_source,
      l.utm_medium,
      l.utm_campaign,
      l.referrer
    ].map(escapeCsv).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
};

module.exports = { LeadRepository };
