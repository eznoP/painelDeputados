# Painel de Deputados Federais

Trabalho da 2ª avaliação de Programação Web (UESPI). A aplicação consulta os deputados
federais em exercício na API de Dados Abertos da Câmara, mostra os gastos de cada um com a
cota parlamentar e guarda uma lista de deputados acompanhados pelo usuário.

O backend está pronto. O frontend ainda está em desenvolvimento.

## Integrantes

- Enzo Rios (eznoP)

> Se a equipe tiver um segundo integrante, adicionar o nome aqui.

## Funcionalidades

- Listagem de deputados com filtro por UF, partido e nome, com paginação.
- Detalhe do deputado (partido, UF, foto, e-mail, situação).
- Resumo das despesas da cota parlamentar de um ano: total anual, total por tipo de
  despesa (do maior para o menor) e total por mês.
- Lista de deputados acompanhados, com observação opcional de até 500 caracteres.
- Inclusão, edição da observação e remoção de deputados da lista.

## API externa

- **Base:** `https://dadosabertos.camara.leg.br/api/v2`
- **Documentação:** https://dadosabertos.camara.leg.br/swagger/api.html

Endpoints usados pelo backend:

| Método | Endpoint | Para quê |
| --- | --- | --- |
| GET | `/deputados` | listar deputados com os filtros `siglaUf`, `siglaPartido`, `nome` |
| GET | `/deputados/{id}` | pegar os dados de um deputado (nome, partido, UF e foto ficam dentro de `ultimoStatus`) |
| GET | `/deputados/{id}/despesas?ano=` | pegar as despesas do ano, paginando de 100 em 100 |

Todas as chamadas são feitas pelo backend, em tempo de execução, com o cabeçalho
`User-Agent: painelDeputados (UESPI - Programacao Web)`, que é a identificação recomendada
pela Câmara.

Detalhes que o código trata:

- a paginação das despesas é percorrida em ordem, uma página por vez;
- quando a API responde `429`, a requisição é repetida até 3 vezes com uma pequena espera;
- se a Câmara estiver fora do ar ou responder com erro, a nossa API devolve `502`;
- o valor usado nas somas é o `valorLiquido` em módulo, porque a Câmara devolve esse valor
  negativo (é débito).

## Tecnologias

- Next.js 16 (App Router) com Route Handlers
- React 19
- TypeScript em modo estrito (`"strict": true`)
- CSS puro
- SQLite com `better-sqlite3`
- `fetch` nativo do Node

**Node.js utilizado:** v26.12.1 (o Next.js 16 exige Node 20.9 ou superior).

## Como rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

Na primeira execução o banco `data/app.db` é criado automaticamente com os registros
iniciais. Para voltar ao estado inicial, basta apagar o arquivo e reiniciar:

```bash
npm run db:reset
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | sobe o servidor de desenvolvimento |
| `npm run build` | gera o build de produção |
| `npm start` | executa o build |
| `npm run typecheck` | confere os tipos TypeScript |
| `npm run db:reset` | apaga o arquivo do banco |

## Endpoints do backend

Todas as respostas são em JSON. As listas vêm dentro de `data` e os erros seguem sempre o
formato `{ "error": "mensagem em português" }`.

### Deputados

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/api/deputies` | listar deputados em exercício |
| GET | `/api/deputies/[id]` | dados de um deputado |
| GET | `/api/deputies/[id]/expenses` | resumo das despesas de um ano |

Parâmetros de `/api/deputies` (todos opcionais):

| Parâmetro | Validação |
| --- | --- |
| `uf` | duas letras, ex.: `PI` |
| `party` | de 2 a 20 letras, ex.: `PT` |
| `name` | pelo menos 2 caracteres |
| `page` | inteiro a partir de 1 (padrão `1`) |

Resposta de `/api/deputies`:

```json
{
  "data": [
    {
      "id": 123086,
      "name": "Átila Lira",
      "party": "PP",
      "state": "PI",
      "photoUrl": "https://www.camara.leg.br/internet/deputado/bandep/123086.jpg"
    }
  ],
  "page": 1,
  "hasNext": true
}
```

Resposta de `/api/deputies/[id]`:

```json
{
  "id": 123086,
  "name": "Átila Lira",
  "party": "PP",
  "state": "PI",
  "photoUrl": "https://www.camara.leg.br/internet/deputado/bandep/123086.jpg",
  "email": "dep.atilamlira@camara.leg.br",
  "status": "Exercício",
  "legislatureId": 57
}
```

Parâmetro de `/api/deputies/[id]/expenses`: `year`, obrigatório, inteiro entre 2008 e o
ano atual.

Resposta de `/api/deputies/[id]/expenses?year=2024`:

```json
{
  "deputyId": 123086,
  "year": 2024,
  "total": 606975.21,
  "byType": [
    { "type": "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES", "total": 152400 }
  ],
  "byMonth": [
    { "month": 1, "total": 49508.16 },
    { "month": 2, "total": 53765 }
  ]
}
```

`byMonth` sempre traz os 12 meses, com `0` nos meses sem despesa.

### Watchlist

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/api/watchlist` | listar os deputados acompanhados |
| POST | `/api/watchlist` | incluir um deputado |
| PATCH | `/api/watchlist/[id]` | atualizar a observação |
| DELETE | `/api/watchlist/[id]` | remover um deputado |

Corpo esperado no `POST` (o `deputyId` é o id do deputado na API da Câmara):

```json
{ "deputyId": 123086, "note": "gastos com combustível acima da média" }
```

O backend consulta a Câmara antes de gravar, para pegar nome, partido e UF atualizados.
Não é possível cadastrar o mesmo deputado duas vezes.

Corpo esperado no `PATCH` (só a observação pode ser alterada):

```json
{ "note": "nova observação" }
```

`note` pode ser `null` para limpar a observação. Qualquer outro campo devolve `400`.

### Códigos de status

| Código | Quando |
| --- | --- |
| 200 | consulta ou atualização feita com sucesso |
| 201 | deputado incluído na watchlist |
| 204 | deputado removido |
| 400 | parâmetro ou corpo inválido |
| 404 | deputado ou registro inexistente |
| 409 | deputado já está na watchlist |
| 502 | falha na comunicação com a API da Câmara |
| 500 | erro interno |

## Banco de dados

- **Arquivo:** `data/app.db` (não vai para o repositório, está no `.gitignore`)
- **Biblioteca:** `better-sqlite3`
- **Journal:** `DELETE` (o WAL não é usado), então o banco fica em um arquivo só
- Todas as consultas usam prepared statements

Tabela `watchlist`:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | identificador local |
| `deputy_id` | INTEGER NOT NULL UNIQUE | id do deputado na API da Câmara |
| `name` | TEXT NOT NULL | nome parlamentar |
| `party` | TEXT NOT NULL | sigla do partido |
| `state` | TEXT NOT NULL | sigla da UF |
| `note` | TEXT | observação do usuário, até 500 caracteres |
| `created_at` | TEXT NOT NULL | data de inclusão, preenchida pelo backend |

Registros iniciais (criados só quando o banco é criado):

| deputy_id | Nome | Partido | UF | Observação |
| --- | --- | --- | --- | --- |
| 123086 | Átila Lira | PP | PI | gastos com combustível bem acima da média |
| 220688 | Dr. Francisco | PT | PI | — |
| 141408 | Cleber Verde | MDB | MA | — |
| 178835 | Afonso Motta | PDT | RS | prometeu olhar a pauta da saúde |
| 220554 | Alexandre Lindenmeyer | PT | RS | — |

## Estrutura do projeto

```
app/api/deputies/route.ts                listagem com filtros
app/api/deputies/[id]/route.ts           detalhe do deputado
app/api/deputies/[id]/expenses/route.ts  resumo das despesas
app/api/watchlist/route.ts               listar e incluir
app/api/watchlist/[id]/route.ts          editar e remover

lib/db.ts       conexão com o SQLite, criação da tabela e registros iniciais
lib/camara.ts   chamadas à API da Câmara e soma das despesas
lib/api.ts      resposta de erro padrão e validações
lib/errors.ts   erros que viram 404 e 502
```
