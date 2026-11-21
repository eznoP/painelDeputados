import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, parsePage, toErrorResponse } from "@/lib/api";
import { listDeputies } from "@/lib/camara";

// ---------------------------------------------------------------------
// GET /api/deputies
// lista os deputados em exercício, com filtro por uf, partido e nome
// ---------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;

  const page = parsePage(search.get("page"));

  if (page === null) {
    return errorResponse("A página precisa ser um número inteiro maior que zero.", 400);
  }

  const uf = (search.get("uf") ?? "").trim().toUpperCase();

  if (uf && !/^[A-Z]{2}$/.test(uf)) {
    return errorResponse("A UF precisa ter duas letras.", 400);
  }

  const party = (search.get("party") ?? "").trim();

  if (party && !/^[A-Za-z]{2,20}$/.test(party)) {
    return errorResponse("O partido precisa ter entre 2 e 20 letras.", 400);
  }

  const name = (search.get("name") ?? "").trim();

  if (name && name.length < 2) {
    return errorResponse("O nome precisa ter pelo menos 2 caracteres.", 400);
  }

  try {
    const result = await listDeputies({
      uf: uf || undefined,
      party: party || undefined,
      name: name || undefined,
      page,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
