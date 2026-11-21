import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// uma linha da tabela watchlist, do jeito que o sqlite devolve
export type WatchlistRow = {
  id: number;
  deputy_id: number;
  name: string;
  party: string;
  state: string;
  note: string | null;
  created_at: string;
};

const dataDir = path.join(process.cwd(), "data");
export const dbPath = path.join(dataDir, "app.db");

// ---------------------------------------------------------------------
// dados que entram no banco só quando ele é criado pela primeira vez
// os ids abaixo foram conferidos na api da câmara, todos existem
// ---------------------------------------------------------------------
const initialWatchlist = [
  {
    deputy_id: 123086,
    name: "Átila Lira",
    party: "PP",
    state: "PI",
    note: "gastos com combustível bem acima da média",
  },
  {
    deputy_id: 220688,
    name: "Dr. Francisco",
    party: "PT",
    state: "PI",
    note: null,
  },
  {
    deputy_id: 141408,
    name: "Cleber Verde",
    party: "MDB",
    state: "MA",
    note: null,
  },
  {
    deputy_id: 178835,
    name: "Afonso Motta",
    party: "PDT",
    state: "RS",
    note: "prometeu olhar a pauta da saúde",
  },
  {
    deputy_id: 220554,
    name: "Alexandre Lindenmeyer",
    party: "PT",
    state: "RS",
    note: null,
  },
];

// ---------------------------------------------------------------------
// cria a tabela da watchlist (o id é local, o deputy_id é o id da api)
// ---------------------------------------------------------------------
function createTable(connection: Database.Database) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      deputy_id  INTEGER NOT NULL UNIQUE,
      name       TEXT    NOT NULL,
      party      TEXT    NOT NULL,
      state      TEXT    NOT NULL,
      note       TEXT,
      created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )
  `);
}

// ---------------------------------------------------------------------
// insere os registros iniciais na tabela
// ---------------------------------------------------------------------
function insertInitialRows(connection: Database.Database) {
  const insert = connection.prepare(`
    INSERT INTO watchlist (deputy_id, name, party, state, note)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const row of initialWatchlist) {
    insert.run(row.deputy_id, row.name, row.party, row.state, row.note);
  }
}

// ---------------------------------------------------------------------
// abre a conexão, garante a tabela e os dados iniciais
// ---------------------------------------------------------------------
function openDatabase(): Database.Database {
  fs.mkdirSync(dataDir, { recursive: true });

  const connection = new Database(dbPath);

  // o trabalho pede o modo de journal padrão (DELETE), sem WAL,
  // assim o banco fica em um arquivo só
  connection.pragma("journal_mode = delete");
  connection.pragma("foreign_keys = on");

  // se a tabela já existe é porque o banco não é novo, então não repete o seed
  const tableExists = connection
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'watchlist'")
    .get();

  createTable(connection);

  if (!tableExists) {
    insertInitialRows(connection);
  }

  return connection;
}

// o next recarrega os módulos em desenvolvimento, então guardamos a conexão
// no global pra não abrir um arquivo de banco novo a cada salvamento
const globalForDb = globalThis as unknown as {
  database?: Database.Database;
};

export const db: Database.Database = globalForDb.database ?? openDatabase();
globalForDb.database = db;
