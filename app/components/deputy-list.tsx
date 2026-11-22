import type { Deputy } from "@/app/types";

type DeputyListProps = {
  deputies: Deputy[];
  selectedId: number | null;
  followedIds: number[];
  page: number;
  hasNext: boolean;
  loading: boolean;
  error: string;
  onSelect: (id: number) => void;
  onAdd: (id: number) => void;
  onPrevious: () => void;
  onNext: () => void;
};

// lista os deputados com ações de detalhe e acompanhamento
export default function DeputyList({
  deputies,
  selectedId,
  followedIds,
  page,
  hasNext,
  loading,
  error,
  onSelect,
  onAdd,
  onPrevious,
  onNext,
}: DeputyListProps) {
  return (
    <div className="deputy-list-wrapper">
      {loading && <p className="status-message">Carregando deputados...</p>}

      {!loading && error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && deputies.length === 0 && (
        <p className="empty-state">Nenhum deputado encontrado.</p>
      )}

      {!error && deputies.length > 0 && (
        <ul className="deputy-list">
          {deputies.map((deputy) => {
            const followed = followedIds.includes(deputy.id);
            const selected = selectedId === deputy.id;

            return (
              <li
                key={deputy.id}
                className={`deputy-card${selected ? " is-selected" : ""}`}
              >
                <img
                  className="deputy-photo"
                  src={deputy.photoUrl}
                  alt={`Foto de ${deputy.name}`}
                  width={72}
                  height={96}
                  loading="lazy"
                />

                <div className="deputy-info">
                  <strong className="deputy-name">{deputy.name}</strong>
                  <span className="deputy-party">
                    {deputy.party} - {deputy.state}
                  </span>
                </div>

                <div className="deputy-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => onSelect(deputy.id)}
                  >
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => onAdd(deputy.id)}
                    disabled={followed}
                  >
                    {followed ? "Acompanhado" : "Acompanhar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="pagination" aria-label="Paginação">
        <button
          type="button"
          className="button button-secondary"
          onClick={onPrevious}
          disabled={loading || page <= 1}
        >
          Anterior
        </button>
        <span className="pagination-info">Página {page}</span>
        <button
          type="button"
          className="button button-secondary"
          onClick={onNext}
          disabled={loading || !hasNext}
        >
          Próxima
        </button>
      </nav>
    </div>
  );
}
