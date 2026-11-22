import { EXPENSE_YEARS } from "@/app/constants";
import type {
  DeputyDetail as DeputyDetailData,
  ExpensesSummary,
} from "@/app/types";
import { formatCurrency, formatMonth } from "@/lib/format";

type DeputyDetailProps = {
  deputy: DeputyDetailData | null;
  expenses: ExpensesSummary | null;
  year: number;
  loading: boolean;
  expensesLoading: boolean;
  error: string;
  followed: boolean;
  onYearChange: (year: number) => void;
  onAdd: (id: number) => void;
};

// mostra os dados do deputado e o resumo das despesas
export default function DeputyDetail({
  deputy,
  expenses,
  year,
  loading,
  expensesLoading,
  error,
  followed,
  onYearChange,
  onAdd,
}: DeputyDetailProps) {
  return (
    <div className="deputy-detail-wrapper">
      {loading && <p className="status-message">Carregando detalhes...</p>}

      {!loading && error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !deputy && (
        <p className="empty-state">
          Selecione um deputado na lista para ver os detalhes.
        </p>
      )}

      {!loading && deputy && (
        <article>
          <header className="detail-header">
            <img
              className="detail-photo"
              src={deputy.photoUrl}
              alt={`Foto de ${deputy.name}`}
              width={96}
              height={128}
            />

            <div className="detail-info">
              <h3>{deputy.name}</h3>
              <p className="detail-party">
                {deputy.party} - {deputy.state}
              </p>

              <dl className="detail-facts">
                <div>
                  <dt>Situação</dt>
                  <dd>{deputy.status}</dd>
                </div>
                <div>
                  <dt>Legislatura</dt>
                  <dd>{deputy.legislatureId}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>
                    {deputy.email ? (
                      <a href={`mailto:${deputy.email}`}>{deputy.email}</a>
                    ) : (
                      "Não informado"
                    )}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="button button-primary"
                onClick={() => onAdd(deputy.id)}
                disabled={followed}
              >
                {followed ? "Acompanhado" : "Acompanhar"}
              </button>
            </div>
          </header>

          <section className="expenses" aria-labelledby="expenses-title">
            <div className="expenses-header">
              <h4 id="expenses-title">Despesas da cota parlamentar</h4>

              <div className="form-field">
                <label htmlFor="expense-year">Ano</label>
                <select
                  id="expense-year"
                  value={year}
                  onChange={(event) => onYearChange(Number(event.target.value))}
                  disabled={expensesLoading}
                >
                  {EXPENSE_YEARS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {expensesLoading && (
              <p className="status-message">Carregando despesas...</p>
            )}

            {!expensesLoading && !expenses && !error && (
              <p className="empty-state">Nenhuma despesa carregada.</p>
            )}

            {!expensesLoading && expenses && (
              <>
                <p className="expenses-total">
                  Total em {expenses.year}:{" "}
                  <strong>{formatCurrency(expenses.total)}</strong>
                </p>

                <h5>Por tipo de despesa</h5>

                {expenses.byType.length === 0 ? (
                  <p className="empty-state">
                    Nenhuma despesa registrada neste ano.
                  </p>
                ) : (
                  <table className="expenses-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.byType.map((item) => (
                        <tr key={item.type}>
                          <td>{item.type}</td>
                          <td>{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <h5>Por mês</h5>

                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.byMonth.map((item) => (
                      <tr key={item.month}>
                        <td>{formatMonth(item.month)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </article>
      )}
    </div>
  );
}
