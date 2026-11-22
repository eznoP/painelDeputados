"use client";

import type { FormEvent } from "react";

import type { Filters } from "@/app/types";

type SearchFiltersProps = {
  filters: Filters;
  loading: boolean;
  onChange: (field: keyof Filters, value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

// formulário de busca por uf, partido e nome
export default function SearchFilters({
  filters,
  loading,
  onChange,
  onSubmit,
  onClear,
}: SearchFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="filter-uf">UF</label>
        <input
          id="filter-uf"
          name="uf"
          type="text"
          value={filters.uf}
          maxLength={2}
          pattern="[A-Za-z]{2}"
          placeholder="PI"
          onChange={(event) => onChange("uf", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="filter-party">Partido</label>
        <input
          id="filter-party"
          name="party"
          type="text"
          value={filters.party}
          maxLength={20}
          pattern="[A-Za-z]{2,20}"
          placeholder="PT"
          onChange={(event) => onChange("party", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="filter-name">Nome</label>
        <input
          id="filter-name"
          name="name"
          type="text"
          value={filters.name}
          minLength={2}
          placeholder="nome do deputado"
          onChange={(event) => onChange("name", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onClear}
          disabled={loading}
        >
          Limpar
        </button>
      </div>
    </form>
  );
}
