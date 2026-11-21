import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, normalizeNote, readJsonBody, toErrorResponse } from "@/lib/api";
import { getDeputy } from "@/lib/camara";
import { db, type WatchlistRow } from "@/lib/db";

// esses endpoints leem e escrevem no banco, então nada de cache
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// GET /api/watchlist
// lista os deputados que o usuário acompanha
// ---------------------------------------------------------------------
export async function GET() {
  const rows = db
    .prepare("SELECT * FROM watchlist ORDER BY id DESC")
    .all() as WatchlistRow[];

  return NextResponse.json({ data: rows });
}

// ---------------------------------------------------------------------
// POST /api/watchlist
// inclui um deputado na lista, buscando nome, partido e uf na câmara
// ---------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  if (body === null) {
    return errorResponse("Corpo da requisição inválido.", 400);
  }

  const deputyId = body.deputyId;

  if (
    typeof deputyId !== "number" ||
    !Number.isSafeInteger(deputyId) ||
    deputyId <= 0
  ) {
    return errorResponse(
      "O campo deputyId é obrigatório e precisa ser um número inteiro positivo.",
      400,
    );
  }

  const noteResult = normalizeNote(body.note);

  if (!noteResult.valid) {
    return errorResponse("A observação deve ter no máximo 500 caracteres.", 400);
  }

  try {
    // antes de guardar, confere se o deputado existe mesmo na câmara
    const deputy = await getDeputy(deputyId);

    const alreadyExists = db
      .prepare("SELECT id FROM watchlist WHERE deputy_id = ?")
      .get(deputy.id);

    if (alreadyExists) {
      return errorResponse("Esse deputado já está na lista de acompanhados.", 409);
    }

    const insert = db.prepare(`
      INSERT INTO watchlist (deputy_id, name, party, state, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      deputy.id,
      deputy.name,
      deputy.party,
      deputy.state,
      noteResult.note,
    );

    const created = db
      .prepare("SELECT * FROM watchlist WHERE id = ?")
      .get(result.lastInsertRowid) as WatchlistRow;

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
