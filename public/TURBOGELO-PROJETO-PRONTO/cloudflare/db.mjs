export const schema=`CREATE TABLE IF NOT EXISTS checkout_orders (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
 details TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'creating', transaction_id TEXT UNIQUE,
 payment TEXT, created_at INTEGER NOT NULL, checked_at INTEGER,
 UNIQUE(owner,request_key)
);
CREATE TABLE IF NOT EXISTS checkout_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS checkout_pending ON checkout_orders(state,created_at);`;
const decode=r=>r?{...r,details:JSON.parse(r.details),payment:r.payment?JSON.parse(r.payment):null}:undefined;
export function repository(db){const first=async(sql,...args)=>db.prepare(sql).bind(...args).first();return {
 async reserve(o){return decode(await first('INSERT INTO checkout_orders(id,owner,request_key,fingerprint,details,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,request_key) DO NOTHING RETURNING *',o.id,o.owner,o.key,o.fingerprint,JSON.stringify(o.details),Date.now()));},
 async byKey(owner,key){return decode(await first('SELECT * FROM checkout_orders WHERE owner=? AND request_key=?',owner,key));},
 async get(id){return decode(await first('SELECT * FROM checkout_orders WHERE id=?',id));},
 async unknown(id){await db.prepare("UPDATE checkout_orders SET state='unknown' WHERE id=? AND transaction_id IS NULL").bind(id).run();},
 async save(id,t,payment){return decode(await first('UPDATE checkout_orders SET state=?,transaction_id=?,payment=?,checked_at=? WHERE id=? RETURNING *',t.status,String(t.id),JSON.stringify(payment),Date.now(),id));},
 async limit(key,max,seconds){const now=Date.now();const r=await first(`INSERT INTO checkout_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN checkout_limits.expires_at<? THEN 1 ELSE checkout_limits.hits+1 END, expires_at=CASE WHEN checkout_limits.expires_at<? THEN excluded.expires_at ELSE checkout_limits.expires_at END RETURNING hits`,key,now+seconds*1000,now,now);return r.hits<=max;},
 async pending(){const r=await db.prepare("SELECT * FROM checkout_orders WHERE transaction_id IS NOT NULL AND state IN ('creating','unknown','processing','waiting_payment','approved') AND created_at>? ORDER BY checked_at ASC LIMIT 20").bind(Date.now()-14*86400000).all();return r.results.map(decode);},
 async cleanup(){await db.prepare('DELETE FROM checkout_limits WHERE expires_at<?').bind(Date.now()-86400000).run();}
};}
