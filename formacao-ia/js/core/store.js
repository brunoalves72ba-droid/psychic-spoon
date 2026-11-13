// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Armazenamento local (IndexedDB) com esquema versionado. Tudo fica só no aparelho:
// sem servidor, sem login, sem analytics. Sem IndexedDB (ou nos testes), usa memória.

export const DB_NAME = 'formacao-ia';
export const SCHEMA = 1;

const MIGRATIONS = {
  1(db) {
    db.createObjectStore('kv');
    const lg = db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
    lg.createIndex('t', 't');
  },
};

let dbp = null;
let mem = null;
const memStore = () => ({ stores: { kv: new Map(), log: new Map() }, seq: { log: 0 } });

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { mem = memStore(); resolve(null); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, SCHEMA); } catch { mem = memStore(); resolve(null); return; }
    req.onupgradeneeded = (e) => { for (let v = e.oldVersion + 1; v <= SCHEMA; v++) MIGRATIONS[v](req.result, req.transaction); };
    req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
    req.onerror = () => { mem = memStore(); resolve(null); };
    req.onblocked = () => { mem = memStore(); resolve(null); };
  });
  return dbp;
}
const P = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

async function run(store, mode, fn) {
  const db = await open();
  if (!db) return fn(null, mem);
  const tx = db.transaction(store, mode);
  const out = await fn(tx.objectStore(store));
  if (mode === 'readwrite') await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  return out;
}
const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export const kv = {
  async get(key, def) { const v = await run('kv', 'readonly', (os, m) => (os ? P(os.get(key)) : m.stores.kv.get(key))); return v === undefined ? def : v; },
  set: (key, val) => run('kv', 'readwrite', (os, m) => (os ? P(os.put(val, key)) : m.stores.kv.set(key, clone(val)))),
  del: (key) => run('kv', 'readwrite', (os, m) => (os ? P(os.delete(key)) : m.stores.kv.delete(key))),
  async all() {
    return run('kv', 'readonly', async (os, m) => {
      if (!os) return Object.fromEntries([...m.stores.kv.entries()].map(([k, v]) => [k, clone(v)]));
      const [keys, vals] = await Promise.all([P(os.getAllKeys()), P(os.getAll())]);
      return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
    });
  },
  clear: () => run('kv', 'readwrite', (os, m) => (os ? P(os.clear()) : m.stores.kv.clear())),
};

export const log = {
  add: (ev) => run('log', 'readwrite', (os, m) => { if (os) return P(os.add(ev)); const id = ++m.seq.log; m.stores.log.set(id, { ...clone(ev), id }); return id; }),
  all: () => run('log', 'readonly', (os, m) => (os ? P(os.getAll()) : [...m.stores.log.values()].map(clone))),
  clear: () => run('log', 'readwrite', (os, m) => { if (os) return P(os.clear()); m.stores.log.clear(); m.seq.log = 0; }),
  async replace(list) { await log.clear(); for (const ev of list) { const { id, ...rest } = ev; await log.add(rest); } },
};

/** Pede ao navegador para não apagar os dados em caso de pouco espaço (quando houver suporte). */
export async function persistir() { try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch {} return false; }

/** Só para testes: volta ao estado inicial em memória. */
export function _resetMem() { dbp = null; mem = null; }
