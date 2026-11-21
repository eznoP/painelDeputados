import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, normalizeNote, parseId, readJsonBody } from "@/lib/api";
import { db, type WatchlistRow } from "@/lib/db";

// ---------------------------------------------------------------------
// PATCH /api/watchlist/[id]
// atualiza só a observação, que é o único campo editável
// ---------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (id === null) {
    return errorResponse("O id precisa ser um número inteiro positivo.", 400);
  }

  const body = await readJsonBody(request);

  if (body === null) {
    return errorResponse("Corpo da requisição inválido.", 400);
  }

  // nome, partido, uf e created_at não podem ser alterados
  const unknownField = Object.keys(body).find((key) => key !== "note");

  if (unknownField) {
    return errorResponse(`O campo "${unknownField}" não pode ser alterado.`, 400);
  }

  if (!("note" in body)) {
    return errorResponse("Informe a observação, mesmo que seja nula.", 400);
  }

  const noteResult = normalizeNote(body.note);

  if (!noteResult.valid) {
    return errorResponse("A observação deve ter no máximo 500 caracteres.", 400);
  }

  const exists = db.prepare("SELECT id FROM watchlist WHERE id = ?").get(id);

  if (!exists) {
    return errorResponse("Deputado não encontrado na lista de acompanhados.", 404);
  }

  db.prepare("UPDATE watchlist SET note = ? WHERE id = ?").run(noteResult.note, id);

  const updated = db
    .prepare("SELECT * FROM watchlist WHERE id = ?")
    .get(id) as WatchlistRow;

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------
// DELETE /api/watchlist/[id]
// remove um deputado da lista
// ---------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (id === null) {
    return errorResponse("O id precisa ser um número inteiro positivo.", 400);
  }

  const result = db.prepare("DELETE FROM watchlist WHERE id = ?").run(id);

  if (result.changes === 0) {
    return errorResponse("Deputado não encontrado na lista de acompanhados.", 404);
  }

  return new NextResponse(null, { status: 204 });
}
