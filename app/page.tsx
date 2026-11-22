"use client";

import { useCallback, useEffect, useState } from "react";

import DeputyDetail from "@/app/components/deputy-detail";
import DeputyList from "@/app/components/deputy-list";
import SearchFilters from "@/app/components/search-filters";
import WatchlistPanel from "@/app/components/watchlist-panel";
import { CURRENT_YEAR } from "@/app/constants";
import type {
  Deputy,
  DeputyDetail as DeputyDetailData,
  DeputyList as DeputyListData,
  ExpensesSummary,
  Filters,
  WatchlistItem,
} from "@/app/types";

const EMPTY_FILTERS: Filters = { uf: "", party: "", name: "" };

// lê a mensagem de erro devolvida pela api
async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };

    return typeof body.error === "string"
      ? body.error
      : "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}

// monta a página principal do painel
export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedDeputy, setSelectedDeputy] =
    useState<DeputyDetailData | null>(null);
  const [expenses, setExpenses] = useState<ExpensesSummary | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");

  const loadDeputies = useCallback(
    async (targetPage: number, activeFilters: Filters) => {
      setListLoading(true);
      setListError("");

      try {
        const params = new URLSearchParams({ page: String(targetPage) });

        if (activeFilters.uf.trim()) {
          params.set("uf", activeFilters.uf.trim().toUpperCase());
        }

        if (activeFilters.party.trim()) {
          params.set("party", activeFilters.party.trim());
        }

        if (activeFilters.name.trim()) {
          params.set("name", activeFilters.name.trim());
        }

        const response = await fetch(`/api/deputies?${params.toString()}`);

        if (!response.ok) {
          setListError(await readErrorMessage(response));
          setDeputies([]);
          setHasNext(false);
          return;
        }

        const body = (await response.json()) as DeputyListData;

        setDeputies(body.data);
        setPage(body.page);
        setHasNext(body.hasNext);
      } catch {
        setListError("Não foi possível carregar os deputados.");
        setDeputies([]);
        setHasNext(false);
      } finally {
        setListLoading(false);
      }
    },
    [],
  );

  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setWatchlistError("");

    try {
      const response = await fetch("/api/watchlist");

      if (!response.ok) {
        setWatchlistError(await readErrorMessage(response));
        return;
      }

      const body = (await response.json()) as { data: WatchlistItem[] };

      setWatchlist(body.data);
    } catch {
      setWatchlistError("Não foi possível carregar a lista de acompanhados.");
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const loadExpenses = useCallback(
    async (deputyId: number, targetYear: number) => {
      setExpensesLoading(true);
      setDetailError("");
      setExpenses(null);

      try {
        const response = await fetch(
          `/api/deputies/${deputyId}/expenses?year=${targetYear}`,
        );

        if (!response.ok) {
          setDetailError(await readErrorMessage(response));
          return;
        }

        const body = (await response.json()) as ExpensesSummary;

        setExpenses(body);
      } catch {
        setDetailError("Não foi possível carregar as despesas.");
      } finally {
        setExpensesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDeputies(1, EMPTY_FILTERS);
    void loadWatchlist();
  }, [loadDeputies, loadWatchlist]);

  async function selectDeputy(deputyId: number) {
    setDetailLoading(true);
    setDetailError("");
    setExpenses(null);

    try {
      const response = await fetch(`/api/deputies/${deputyId}`);

      if (!response.ok) {
        setDetailError(await readErrorMessage(response));
        setSelectedDeputy(null);
        return;
      }

      const body = (await response.json()) as DeputyDetailData;

      setSelectedDeputy(body);
      setDetailLoading(false);
      await loadExpenses(deputyId, year);
    } catch {
      setDetailError("Não foi possível carregar os detalhes do deputado.");
      setSelectedDeputy(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSearch() {
    const nextFilters = { ...filters };

    setAppliedFilters(nextFilters);
    void loadDeputies(1, nextFilters);
  }

  function handleClear() {
    const nextFilters = { ...EMPTY_FILTERS };

    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    void loadDeputies(1, nextFilters);
  }

  function handlePreviousPage() {
    if (page > 1) {
      void loadDeputies(page - 1, appliedFilters);
    }
  }

  function handleNextPage() {
    if (hasNext) {
      void loadDeputies(page + 1, appliedFilters);
    }
  }

  function handleYearChange(nextYear: number) {
    setYear(nextYear);

    if (selectedDeputy) {
      void loadExpenses(selectedDeputy.id, nextYear);
    }
  }

  async function addToWatchlist(deputyId: number) {
    setWatchlistError("");

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deputyId }),
      });

      if (!response.ok) {
        setWatchlistError(await readErrorMessage(response));
        return;
      }

      await loadWatchlist();
    } catch {
      setWatchlistError("Não foi possível adicionar o deputado à lista.");
    }
  }

  async function updateNote(id: number, note: string) {
    setWatchlistError("");

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note.trim() === "" ? null : note.trim(),
        }),
      });

      if (!response.ok) {
        setWatchlistError(await readErrorMessage(response));
        return false;
      }

      await loadWatchlist();
      return true;
    } catch {
      setWatchlistError("Não foi possível atualizar a observação.");
      return false;
    }
  }

  async function removeFromWatchlist(id: number) {
    setWatchlistError("");

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setWatchlistError(await readErrorMessage(response));
        return false;
      }

      await loadWatchlist();
      return true;
    } catch {
      setWatchlistError("Não foi possível remover o deputado da lista.");
      return false;
    }
  }

  const followedIds = watchlist.map((item) => item.deputy_id);

  return (
    <div className="app">
      <header className="site-header">
        <div className="container">
          <h1>Painel de Deputados</h1>
          <p>
            Consulte deputados federais, veja as despesas e monte sua lista de
            acompanhados.
          </p>
        </div>
      </header>

      <main className="container page-main">
        <section className="search-section" aria-labelledby="search-title">
          <h2 id="search-title">Buscar deputados</h2>

          <SearchFilters
            filters={filters}
            loading={listLoading}
            onChange={(field, value) =>
              setFilters((current) => ({ ...current, [field]: value }))
            }
            onSubmit={handleSearch}
            onClear={handleClear}
          />
        </section>

        <div className="content-grid">
          <section className="list-section" aria-labelledby="list-title">
            <h2 id="list-title">Deputados</h2>

            <DeputyList
              deputies={deputies}
              selectedId={selectedDeputy?.id ?? null}
              followedIds={followedIds}
              page={page}
              hasNext={hasNext}
              loading={listLoading}
              error={listError}
              onSelect={(id) => void selectDeputy(id)}
              onAdd={(id) => void addToWatchlist(id)}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          </section>

          <section className="detail-section" aria-labelledby="detail-title">
            <h2 id="detail-title">Detalhes</h2>

            <DeputyDetail
              deputy={selectedDeputy}
              expenses={expenses}
              year={year}
              loading={detailLoading}
              expensesLoading={expensesLoading}
              error={detailError}
              followed={
                selectedDeputy
                  ? followedIds.includes(selectedDeputy.id)
                  : false
              }
              onYearChange={handleYearChange}
              onAdd={(id) => void addToWatchlist(id)}
            />
          </section>

          <aside
            className="watchlist-section"
            aria-labelledby="watchlist-title"
          >
            <h2 id="watchlist-title">Acompanhados</h2>

            <WatchlistPanel
              items={watchlist}
              loading={watchlistLoading}
              error={watchlistError}
              onSelectDeputy={(id) => void selectDeputy(id)}
              onUpdateNote={updateNote}
              onRemove={removeFromWatchlist}
            />
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>Dados públicos da Câmara dos Deputados.</p>
        </div>
      </footer>
    </div>
  );
}
