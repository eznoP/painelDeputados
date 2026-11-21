import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, MIN_YEAR, parseId, parseYear, toErrorResponse } from "@/lib/api";
import { getExpensesSummary } from "@/lib/camara";

// ---------------------------------------------------------------------
// GET /api/deputies/[id]/expenses?year=2024
// soma as despesas da cota parlamentar do ano, por tipo e por mês
// ---------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (id === null) {
    return errorResponse("O id do deputado precisa ser um número inteiro positivo.", 400);
  }

  const rawYear = request.nextUrl.searchParams.get("year");

  if (!rawYear) {
    return errorResponse("Informe o ano das despesas.", 400);
  }

  const year = parseYear(rawYear);

  if (year === null) {
    const currentYear = new Date().getFullYear();

    return errorResponse(`O ano precisa estar entre ${MIN_YEAR} e ${currentYear}.`, 400);
  }

  try {
    const summary = await getExpensesSummary(id, year);

    return NextResponse.json(summary);
  } catch (error) {
    return toErrorResponse(error);
  }
}
