// ano mínimo aceito pela api da câmara
export const MIN_YEAR = 2008;

// ano atual usado como padrão nas despesas
export const CURRENT_YEAR = new Date().getFullYear();

// anos disponíveis no seletor de despesas
export const EXPENSE_YEARS = Array.from(
  { length: CURRENT_YEAR - MIN_YEAR + 1 },
  (_, index) => CURRENT_YEAR - index,
);
