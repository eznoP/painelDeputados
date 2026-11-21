import { ExternalApiError, ResourceNotFoundError } from "@/lib/errors";

const CAMARA_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2";

// a api da câmara pede que a aplicação se identifique no user-agent
const USER_AGENT = "painelDeputados (UESPI - Programacao Web)";

// a api as vezes demora bastante, então damos um tempo maior
const REQUEST_TIMEOUT = 25000;

// quando ela devolve 429, esperamos e tentamos de novo
const MAX_ATTEMPTS = 3;

const DEPUTIES_PER_PAGE = 30;
const EXPENSES_PER_PAGE = 100;

// formatos que a api da câmara devolve
type CamaraLink = {
  rel: string;
  href: string;
};

type CamaraListResponse<T> = {
  dados: T[];
  links: CamaraLink[];
};

type CamaraDeputy = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
};

type CamaraDeputyDetail = {
  id: number;
  ultimoStatus: {
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto: string;
    email: string | null;
    idLegislatura: number;
    situacao: string;
    gabinete: {
      email: string | null;
    } | null;
  };
};

type CamaraExpense = {
  mes: number;
  tipoDespesa: string;
  valorLiquido: number;
};

// formatos que a nossa aplicação usa
export type Deputy = {
  id: number;
  name: string;
  party: string;
  state: string;
  photoUrl: string;
};

export type DeputyDetail = Deputy & {
  email: string | null;
  status: string;
  legislatureId: number;
};

export type DeputyFilters = {
  uf?: string;
  party?: string;
  name?: string;
  page: number;
};

export type DeputyList = {
  data: Deputy[];
  page: number;
  hasNext: boolean;
};

export type ExpensesSummary = {
  deputyId: number;
  year: number;
  total: number;
  byType: { type: string; total: number }[];
  byMonth: { month: number; total: number }[];
};

// ---------------------------------------------------------------------
// espera um tempo antes de tentar a requisição de novo
// ---------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------
// arredonda pra 2 casas, senão a soma das despesas vem com centavo quebrado
// ---------------------------------------------------------------------
function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------
// faz a requisição na api da câmara e devolve o json já tipado
// ---------------------------------------------------------------------
async function requestCamara<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        cache: "no-store",
      });
    } catch {
      throw new ExternalApiError("Não foi possível falar com a API da Câmara.");
    }

    // 429 é falta de educação da api, então espera um pouco e tenta de novo
    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 1000);
      continue;
    }

    if (response.status === 404) {
      throw new ResourceNotFoundError("Deputado não encontrado na Câmara.");
    }

    if (!response.ok) {
      throw new ExternalApiError("A API da Câmara respondeu com erro.");
    }

    return (await response.json()) as T;
  }

  throw new ExternalApiError("A API da Câmara está limitando as requisições.");
}

// ---------------------------------------------------------------------
// descobre a última página pela lista de links que a api devolve
// ---------------------------------------------------------------------
function readLastPage(links: CamaraLink[], currentPage: number) {
  const last = links.find((link) => link.rel === "last");

  if (!last) {
    return currentPage;
  }

  const page = Number(new URL(last.href).searchParams.get("pagina"));

  return Number.isInteger(page) && page > 0 ? page : currentPage;
}

// ---------------------------------------------------------------------
// lista os deputados, filtrando por uf, partido e nome
// ---------------------------------------------------------------------
export async function listDeputies(filters: DeputyFilters): Promise<DeputyList> {
  const query = new URLSearchParams({
    itens: String(DEPUTIES_PER_PAGE),
    pagina: String(filters.page),
    ordem: "ASC",
    ordenarPor: "nome",
  });

  if (filters.uf) {
    query.set("siglaUf", filters.uf);
  }

  if (filters.party) {
    query.set("siglaPartido", filters.party);
  }

  if (filters.name) {
    query.set("nome", filters.name);
  }

  const body = await requestCamara<CamaraListResponse<CamaraDeputy>>(
    `${CAMARA_BASE_URL}/deputados?${query.toString()}`,
  );

  return {
    data: body.dados.map((deputy) => ({
      id: deputy.id,
      name: deputy.nome,
      party: deputy.siglaPartido,
      state: deputy.siglaUf,
      photoUrl: deputy.urlFoto,
    })),
    page: filters.page,
    hasNext: body.links.some((link) => link.rel === "next"),
  };
}

// ---------------------------------------------------------------------
// busca os dados de um deputado pelo id da api
// ---------------------------------------------------------------------
export async function getDeputy(id: number): Promise<DeputyDetail> {
  const body = await requestCamara<{ dados: CamaraDeputyDetail }>(
    `${CAMARA_BASE_URL}/deputados/${id}`,
  );

  const deputy = body.dados;
  const status = deputy.ultimoStatus;

  return {
    id: deputy.id,
    name: status.nome,
    party: status.siglaPartido,
    state: status.siglaUf,
    photoUrl: status.urlFoto,
    email: status.email ?? status.gabinete?.email ?? null,
    status: status.situacao,
    legislatureId: status.idLegislatura,
  };
}

// ---------------------------------------------------------------------
// percorre todas as páginas de despesas do ano e monta o resumo
// ---------------------------------------------------------------------
export async function getExpensesSummary(
  deputyId: number,
  year: number,
): Promise<ExpensesSummary> {
  const totalsByType = new Map<string, number>();
  const totalsByMonth = new Map<number, number>();

  let total = 0;
  let page = 1;
  let lastPage = 1;

  // a paginação tem que ser na ordem, uma página de cada vez
  while (page <= lastPage) {
    const url =
      `${CAMARA_BASE_URL}/deputados/${deputyId}/despesas` +
      `?ano=${year}&itens=${EXPENSES_PER_PAGE}&pagina=${page}`;

    const body = await requestCamara<CamaraListResponse<CamaraExpense>>(url);

    for (const expense of body.dados) {
      // a api manda o valor líquido negativo (é débito), então usamos o módulo
      const value = Math.abs(expense.valorLiquido);

      total += value;
      totalsByType.set(
        expense.tipoDespesa,
        (totalsByType.get(expense.tipoDespesa) ?? 0) + value,
      );
      totalsByMonth.set(expense.mes, (totalsByMonth.get(expense.mes) ?? 0) + value);
    }

    lastPage = readLastPage(body.links, page);
    page++;
  }

  const byType = Array.from(totalsByType)
    .map(([type, value]) => ({ type, total: roundMoney(value) }))
    .sort((a, b) => b.total - a.total);

  // devolve os 12 meses, com zero nos que não tiveram despesa
  const byMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      month,
      total: roundMoney(totalsByMonth.get(month) ?? 0),
    };
  });

  return {
    deputyId,
    year,
    total: roundMoney(total),
    byType,
    byMonth,
  };
}
