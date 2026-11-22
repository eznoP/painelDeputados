// formatos devolvidos pelas rotas da aplicação

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

export type DeputyList = {
  data: Deputy[];
  page: number;
  hasNext: boolean;
};

export type ExpenseByType = {
  type: string;
  total: number;
};

export type ExpenseByMonth = {
  month: number;
  total: number;
};

export type ExpensesSummary = {
  deputyId: number;
  year: number;
  total: number;
  byType: ExpenseByType[];
  byMonth: ExpenseByMonth[];
};

export type WatchlistItem = {
  id: number;
  deputy_id: number;
  name: string;
  party: string;
  state: string;
  note: string | null;
  created_at: string;
};

export type Filters = {
  uf: string;
  party: string;
  name: string;
};
