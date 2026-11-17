import pg from 'pg';
export const schema=`CREATE TABLE IF NOT EXISTS checkout_orders (
 id uuid PRIMARY KEY, owner text NOT NULL, request_key uuid NOT NULL, fingerprint text NOT NULL,
 details jsonb NOT NULL, state text NOT NULL DEFAULT 'creating', transaction_id text UNIQUE,
 payment jsonb, created_at timestamptz NOT NULL DEFAULT now(), checked_at timestamptz,
 UNIQUE(owner,request_key)
);
CREATE TABLE IF NOT EXISTS checkout_limits (key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS checkout_pending ON checkout_orders(state,created_at);`;
let pool;
export function database(){ if(!pool) {if(!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:8000});} return pool; }
export function repository(db){ return {
 async reserve(o){const r=await db.query('INSERT INTO checkout_orders(id,owner,request_key,fingerprint,details) VALUES($1,$2,$3,$4,$5) ON CONFLICT(owner,request_key) DO NOTHING RETURNING *',[o.id,o.owner,o.key,o.fingerprint,JSON.stringify(o.details)]);return r.rows[0]?.id===o.id?r.rows[0]:undefined;},
 async byKey(owner,key){return (await db.query('SELECT * FROM checkout_orders WHERE owner=$1 AND request_key=$2',[owner,key])).rows[0];},
 async get(id){return (await db.query('SELECT * FROM checkout_orders WHERE id=$1',[id])).rows[0];},
 async unknown(id){await db.query("UPDATE checkout_orders SET state='unknown' WHERE id=$1 AND transaction_id IS NULL",[id]);},
 async save(id,t,payment){return (await db.query('UPDATE checkout_orders SET state=$2, transaction_id=$3, payment=$4, checked_at=now() WHERE id=$1 RETURNING *',[id,t.status,String(t.id),JSON.stringify(payment)])).rows[0];},
 async limit(key,max,seconds){const r=await db.query(`INSERT INTO checkout_limits(key,hits,expires_at) VALUES($1,1,$2)
 ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN checkout_limits.expires_at<now() THEN 1 ELSE checkout_limits.hits+1 END,
 expires_at=CASE WHEN checkout_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE checkout_limits.expires_at END RETURNING hits`,[key,new Date(Date.now()+seconds*1000)]);return r.rows[0].hits<=max;},
 async pending(){return (await db.query("SELECT * FROM checkout_orders WHERE transaction_id IS NOT NULL AND state IN ('creating','unknown','processing','waiting_payment','approved') AND created_at>now()-interval '14 days' ORDER BY checked_at ASC NULLS FIRST LIMIT 50")).rows;}
};}
