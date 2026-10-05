# Indicadores de Fraudes — ACREFI

Formulário web em que instituições financeiras associadas à **ACREFI** (Associação Nacional das Instituições de Crédito, Financiamento e Investimento) calculam e enviam seus indicadores mensais de fraude.

## O que a ferramenta faz

A pessoa responsável na instituição informa os números do mês e a página calcula dois indicadores, sempre na base de 10.000:

| Indicador | Significado | Fórmula |
| --- | --- | --- |
| **BP 1** — Fraudes por Clientes | Casos de fraude a cada 10.000 clientes ativos | `(casos fraudulentos ÷ carteira ativa) × 10.000` |
| **BP 2** — Fraudes por Transações | Transações fraudulentas a cada 10.000 transações | `(transações fraudulentas ÷ total de transações) × 10.000` |

**Campos preenchidos:**
- Instituição financeira e mês de referência.
- BP 1: quantidade de casos fraudulentos e carteira ativa.
- BP 2: quantidade de transações fraudulentas, tipo de fraude (opcional) e total de transações.

**Validações:**
- O numerador não pode ser maior que o denominador.
- O denominador precisa ser maior que zero.
- O envio só é liberado quando a instituição, o mês e os dois indicadores estão válidos.

**Envio:** depois de calcular, o usuário confirma e envia as informações. Há também o botão "Limpar dados", com confirmação.

## Privacidade

- O cálculo roda inteiramente no navegador.
- O app **não armazena nenhum dado**: não usa banco de dados, `localStorage` nem cookies.
- Os dados só saem do navegador quando o usuário confirma o envio, e vão para um serviço externo (Google Apps Script) configurado em `VITE_API_ENDPOINT`.
- Cada envio leva um `submissionId` (UUID) para evitar duplicidade em reenvios.

## Tecnologias

React 19, TanStack Start/Router, Tailwind CSS 4, componentes shadcn/ui (Radix), Vite e Vitest. Fontes (Manrope e Sora) empacotadas localmente, por causa da política de segurança (CSP) restritiva da página.

## Estrutura

- `src/routes/index.tsx`: a página inteira (cálculo, formulário e envio).
- `src/routes/__root.tsx`: layout raiz, metadados e CSP.
- `src/lib/submit-fraud-indicators.ts`: envio ao endpoint externo.
- `src/styles.css`: tema e cores.

## Desenvolvimento local

Requer Node.js e npm.

```sh
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes
npm run lint     # lint
```

Crie um arquivo `.env` na raiz com o endpoint que recebe os envios:

```
VITE_API_ENDPOINT=https://script.google.com/macros/s/.../exec
```

## Publicação no Firebase Hosting

O site é gerado como página estática (SPA). O build para o Firebase é separado do build padrão.

```sh
npx firebase-tools login          # uma vez
npx firebase-tools use --add      # escolher o projeto (uma vez)
npm run deploy:firebase           # gera o build e publica
```

O `.env` é embutido no build, então faça o build em uma máquina que tenha o `.env`.

## Lovable

O projeto foi criado no [Lovable](https://lovable.dev) e continua conectado a ele: commits na branch principal sincronizam com o editor. Evite reescrever o histórico já publicado (force push, rebase ou squash).
