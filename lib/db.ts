import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import { DEFAULT_BEER_COUNT, DEFAULT_PARTICIPANTS } from "./constants";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<
  Record<string, unknown>[]
>;

let localPool: Pool | null = null;

/**
 * El driver HTTP de Neon solo habla con Neon; para desarrollo local contra un
 * Postgres normal (localhost) usamos `pg` con la misma interfaz de template tag.
 */
function localSql(url: string): SqlTag {
  if (!localPool) localPool = new Pool({ connectionString: url });
  const pool = localPool;
  return async (strings, ...values) => {
    const text = strings.reduce(
      (acc, part, i) => (i === 0 ? part : `${acc}$${i}${part}`),
      ""
    );
    const result = await pool.query(text, values as unknown[]);
    return result.rows;
  };
}

export function sql(): SqlTag {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Añádela a .env.local con tu cadena de conexión de Neon."
    );
  }
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  if (host === "localhost" || host === "127.0.0.1") {
    return localSql(url);
  }
  return neon(url) as unknown as SqlTag;
}

let ready: Promise<void> | null = null;

/**
 * Crea el esquema y los datos iniciales la primera vez que se toca la base de
 * datos en cada instancia del servidor. Idempotente, así que apuntar la app a
 * una base de datos Neon vacía es todo lo que hace falta para arrancar.
 */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = init().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

async function init() {
  const q = sql();

  await q`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )`;

  await q`
    CREATE TABLE IF NOT EXISTS beers (
      id SERIAL PRIMARY KEY,
      number INTEGER UNIQUE NOT NULL,
      real_name TEXT NOT NULL DEFAULT ''
    )`;

  await q`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      beer_id INTEGER NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
      score NUMERIC(3,1) NOT NULL CHECK (score BETWEEN 1 AND 10),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (participant_id, beer_id)
    )`;

  // Migración para bases de datos creadas cuando score era INTEGER
  await q`
    DO $$
    BEGIN
      IF (SELECT data_type FROM information_schema.columns
          WHERE table_name = 'votes' AND column_name = 'score') = 'integer' THEN
        ALTER TABLE votes ALTER COLUMN score TYPE NUMERIC(3,1);
      END IF;
    END $$`;

  await q`
    CREATE TABLE IF NOT EXISTS contest (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'voting'
        CHECK (status IN ('voting', 'locked', 'finished'))
    )`;

  await q`INSERT INTO contest (id, status) VALUES (1, 'voting') ON CONFLICT (id) DO NOTHING`;

  const [participantRow] = await q`SELECT COUNT(*)::int AS count FROM participants`;
  if (Number(participantRow.count) === 0) {
    for (const name of DEFAULT_PARTICIPANTS) {
      await q`INSERT INTO participants (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
    }
  }

  const [beerRow] = await q`SELECT COUNT(*)::int AS count FROM beers`;
  if (Number(beerRow.count) === 0) {
    for (let n = 1; n <= DEFAULT_BEER_COUNT; n++) {
      await q`INSERT INTO beers (number) VALUES (${n}) ON CONFLICT (number) DO NOTHING`;
    }
  }
}
