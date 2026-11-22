// nomes curtos dos meses usados nas despesas
const MONTH_NAMES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

// formata um valor em reais
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// devolve o nome curto do mês
export function formatMonth(month: number) {
  return MONTH_NAMES[month - 1] ?? String(month);
}
