import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, parseId, toErrorResponse } from "@/lib/api";
import { getDeputy } from "@/lib/camara";

// ---------------------------------------------------------------------
// GET /api/deputies/[id]
// devolve os dados de um deputado pelo id da api da câmara
// ---------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (id === null) {
    return errorResponse("O id do deputado precisa ser um número inteiro positivo.", 400);
  }

  try {
    const deputy = await getDeputy(id);

    return NextResponse.json(deputy);
  } catch (error) {
    return toErrorResponse(error);
  }
}
