import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabaseClient, isSupabaseConnected } from '../config/supabase.ts';

export interface PlainRecord {
  _id: string;
  [key: string]: any;
}

interface LocalDatabase {
  users: PlainRecord[];
  plans: PlainRecord[];
  salads: PlainRecord[];
  ingredients: PlainRecord[];
  customSalads: PlainRecord[];
  subscriptions: PlainRecord[];
  orders: PlainRecord[];
  payments: PlainRecord[];
  appointments: PlainRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY_DB: LocalDatabase = {
  users: [],
  plans: [],
  salads: [],
  ingredients: [],
  customSalads: [],
  subscriptions: [],
  orders: [],
  payments: [],
  appointments: [],
};

let memoryCache: LocalDatabase | null = null;

function readLocalDB(): LocalDatabase {
  if (memoryCache) return memoryCache;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      memoryCache = structuredClone(EMPTY_DB);
      fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCache, null, 2));
      return memoryCache;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    memoryCache = { ...structuredClone(EMPTY_DB), ...parsed };
    return memoryCache!;
  } catch {
    memoryCache = structuredClone(EMPTY_DB);
    return memoryCache;
  }
}

function writeLocalDB(db: LocalDatabase) {
  memoryCache = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('[Store] Failed to persist local DB:', err);
  }
}

export function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

type CollectionName = keyof LocalDatabase;

const supabaseTableMap: Record<CollectionName, string> = {
  users: 'users',
  plans: 'plans',
  salads: 'salads',
  ingredients: 'ingredients',
  customSalads: 'custom_salads',
  subscriptions: 'subscriptions',
  orders: 'orders',
  payments: 'payments',
  appointments: 'appointments',
};

function toSnakeKey(key: string): string {
  if (key === '_id') return 'id';
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelKey(key: string): string {
  if (key === 'id') return '_id';
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSupabaseRow(obj: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    row[toSnakeKey(key)] = val;
  }
  return row;
}

function fromSupabaseRow<T extends Record<string, any>>(row: Record<string, any>): T & { _id: string } {
  const doc: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    doc[toCamelKey(key)] = val;
  }
  return doc as T & { _id: string };
}

function applySupabaseFilter(query: any, filter: Record<string, any>) {
  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined) continue;
    const col = toSnakeKey(key);
    if (val && typeof val === 'object' && '$in' in val) {
      query = query.in(col, val.$in);
    } else if (val === null) {
      query = query.is(col, null);
    } else {
      query = query.eq(col, val);
    }
  }
  return query;
}

function matchesFilter(doc: PlainRecord, filter: Record<string, any>): boolean {
  return Object.entries(filter).every(([key, val]) => {
    if (val === undefined) return true;
    if (val && typeof val === 'object' && '$in' in val) {
      return val.$in.map(String).includes(String(doc[key]));
    }
    return String(doc[key]) === String(val);
  });
}

export const dbRepo = {
  async findAll<T extends Record<string, any> = PlainRecord>(
    collection: CollectionName,
    filter: Record<string, any> = {}
  ): Promise<Array<T & { _id: string }>> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      let query = sb
        .from(supabaseTableMap[collection])
        .select('*')
        .order('created_at', { ascending: false });
      query = applySupabaseFilter(query, filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map((row) => fromSupabaseRow<T>(row));
    }

    const db = readLocalDB();
    const list = db[collection]
      .filter((item) => matchesFilter(item, filter))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list.map((d) => structuredClone(d) as T & { _id: string });
  },

  async findOne<T extends Record<string, any> = PlainRecord>(
    collection: CollectionName,
    filter: Record<string, any>
  ): Promise<(T & { _id: string }) | null> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      let query = sb.from(supabaseTableMap[collection]).select('*').limit(1);
      query = applySupabaseFilter(query, filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data && data[0] ? fromSupabaseRow<T>(data[0]) : null;
    }

    const db = readLocalDB();
    const found = db[collection].find((item) => matchesFilter(item, filter));
    return found ? (structuredClone(found) as T & { _id: string }) : null;
  },

  async findById<T extends Record<string, any> = PlainRecord>(
    collection: CollectionName,
    id: string
  ): Promise<(T & { _id: string }) | null> {
    if (!id) return null;

    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from(supabaseTableMap[collection])
        .select('*')
        .eq('id', String(id))
        .maybeSingle();
      if (error) return null;
      return data ? fromSupabaseRow<T>(data) : null;
    }

    const db = readLocalDB();
    const found = db[collection].find((item) => String(item._id) === String(id));
    return found ? (structuredClone(found) as T & { _id: string }) : null;
  },

  async create<T extends Record<string, any> = PlainRecord>(
    collection: CollectionName,
    payload: Record<string, any>
  ): Promise<T & { _id: string }> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      const id = payload._id ? String(payload._id) : generateId();
      const row = toSupabaseRow({ ...payload, _id: id });
      const { data, error } = await sb
        .from(supabaseTableMap[collection])
        .insert(row)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return fromSupabaseRow<T>(data);
    }

    const db = readLocalDB();
    const now = new Date().toISOString();
    const record: PlainRecord = {
      ...payload,
      _id: payload._id ? String(payload._id) : generateId(),
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    db[collection].push(record);
    writeLocalDB(db);
    return structuredClone(record) as T & { _id: string };
  },

  async updateById<T extends Record<string, any> = PlainRecord>(
    collection: CollectionName,
    id: string,
    updates: Record<string, any>
  ): Promise<(T & { _id: string }) | null> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      const row = toSupabaseRow({ ...updates, updatedAt: new Date().toISOString() });
      delete row.id;
      const { data, error } = await sb
        .from(supabaseTableMap[collection])
        .update(row)
        .eq('id', String(id))
        .select('*')
        .maybeSingle();
      if (error || !data) return null;
      return fromSupabaseRow<T>(data);
    }

    const db = readLocalDB();
    const idx = db[collection].findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;
    db[collection][idx] = {
      ...db[collection][idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalDB(db);
    return structuredClone(db[collection][idx]) as T & { _id: string };
  },

  async updateMany(
    collection: CollectionName,
    filter: Record<string, any>,
    updates: Record<string, any>
  ): Promise<number> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      const row = toSupabaseRow({ ...updates, updatedAt: new Date().toISOString() });
      let query = sb.from(supabaseTableMap[collection]).update(row);
      query = applySupabaseFilter(query, filter);
      const { data, error } = await query.select('id');
      if (error) return 0;
      return data ? data.length : 0;
    }

    const db = readLocalDB();
    let count = 0;
    db[collection] = db[collection].map((item) => {
      if (matchesFilter(item, filter)) {
        count++;
        return { ...item, ...updates, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    writeLocalDB(db);
    return count;
  },

  async deleteById(collection: CollectionName, id: string): Promise<boolean> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      const { error } = await sb.from(supabaseTableMap[collection]).delete().eq('id', String(id));
      return !error;
    }

    const db = readLocalDB();
    const prevLen = db[collection].length;
    db[collection] = db[collection].filter((item) => String(item._id) !== String(id));
    writeLocalDB(db);
    return db[collection].length < prevLen;
  },

  async count(collection: CollectionName, filter: Record<string, any> = {}): Promise<number> {
    if (isSupabaseConnected()) {
      const sb = getSupabaseClient()!;
      let query = sb.from(supabaseTableMap[collection]).select('id', { count: 'exact', head: true });
      query = applySupabaseFilter(query, filter);
      const { count, error } = await query;
      if (error) return 0;
      return count || 0;
    }

    const db = readLocalDB();
    return db[collection].filter((item) => matchesFilter(item, filter)).length;
  },
};
