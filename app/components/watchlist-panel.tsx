"use client";

import { useState } from "react";

import type { WatchlistItem } from "@/app/types";

type WatchlistPanelProps = {
  items: WatchlistItem[];
  loading: boolean;
  error: string;
  onSelectDeputy: (id: number) => void;
  onUpdateNote: (id: number, note: string) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
};

// lista os deputados acompanhados e permite editar a observação
export default function WatchlistPanel({
  items,
  loading,
  error,
  onSelectDeputy,
  onUpdateNote,
  onRemove,
}: WatchlistPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startEditing(item: WatchlistItem) {
    setEditingId(item.id);
    setNoteDraft(item.note ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setNoteDraft("");
  }

  async function saveNote(id: number) {
    setSaving(true);
    const success = await onUpdateNote(id, noteDraft);
    setSaving(false);

    if (success) {
      cancelEditing();
    }
  }

  async function removeItem(id: number) {
    const confirmed = window.confirm(
      "Remover este deputado da lista de acompanhados?",
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    await onRemove(id);
    setSaving(false);
  }

  return (
    <div className="watchlist-wrapper">
      {loading && (
        <p className="status-message">Carregando acompanhados...</p>
      )}

      {!loading && error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="empty-state">Nenhum deputado acompanhado.</p>
      )}

      {items.length > 0 && (
        <ul className="watchlist">
          {items.map((item) => (
            <li key={item.id} className="watchlist-item">
              <div className="watchlist-info">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => onSelectDeputy(item.deputy_id)}
                >
                  {item.name}
                </button>
                <span className="watchlist-party">
                  {item.party} - {item.state}
                </span>
              </div>

              {editingId === item.id ? (
                <div className="note-editor">
                  <label htmlFor={`note-${item.id}`}>Observação</label>
                  <textarea
                    id={`note-${item.id}`}
                    value={noteDraft}
                    maxLength={500}
                    rows={3}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    disabled={saving}
                  />
                  <span className="note-counter">{noteDraft.length}/500</span>

                  <div className="note-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void saveNote(item.id)}
                      disabled={saving}
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="watchlist-note">
                    {item.note ?? "Sem observação."}
                  </p>

                  <div className="watchlist-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => startEditing(item)}
                      disabled={saving}
                    >
                      Editar observação
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => void removeItem(item.id)}
                      disabled={saving}
                    >
                      Remover
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
