import { NextResponse } from "next/server";

import { ExternalApiError, ResourceNotFoundError } from "@/lib/errors";

// o ano mínimo aceito pela api da câmara
export const MIN_YEAR = 2008;

export const NOTE_MAX_LENGTH = 500;

// ---------------------------------------------------------------------
// resposta de erro no formato único da aplicação
// ---------------------------------------------------------------------
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ---------------------------------------------------------------------
// converte os erros conhecidos no status certo (404, 502 ou 500)
// ---------------------------------------------------------------------
export function toErrorResponse(error: unknown) {
  if (error instanceof ResourceNotFoundError) {
    return errorResponse(error.message, 404);
  }

  if (error instanceof ExternalApiError) {
    return errorResponse(error.message, 502);
  }

  console.error(error);
  return errorResponse("Erro interno do servidor.", 500);
}

// ---------------------------------------------------------------------
// lê o corpo da requisição como json, sem quebrar se vier vazio ou torto
// ---------------------------------------------------------------------
export async function readJsonBody(request: Request) {
  try {
    const body = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// o id da rota precisa ser um número inteiro positivo
// ---------------------------------------------------------------------
export function parseId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// ---------------------------------------------------------------------
// o ano precisa ser inteiro e ficar entre 2008 e o ano atual
// ---------------------------------------------------------------------
export function parseYear(value: string | null) {
  if (!value || !/^\d{4}$/.test(value)) {
    return null;
  }

  const year = Number(value);

  return year >= MIN_YEAR && year <= new Date().getFullYear() ? year : null;
}

// ---------------------------------------------------------------------
// a página da listagem é um inteiro a partir de 1 (padrão é a primeira)
// ---------------------------------------------------------------------
export function parsePage(value: string | null) {
  if (!value) {
    return 1;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : null;
}

// ---------------------------------------------------------------------
// a nota pode ser nula, mas se vier texto não passa de 500 caracteres
// ---------------------------------------------------------------------
export function normalizeNote(value: unknown) {
  if (value === undefined || value === null) {
    return { valid: true, note: null };
  }

  if (typeof value !== "string" || value.length > NOTE_MAX_LENGTH) {
    return { valid: false, note: null };
  }

  const text = value.trim();

  return { valid: true, note: text === "" ? null : text };
}
