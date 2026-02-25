# 🗺️ ROADMAP ADAPTADO - HubMercurius
**Análise Estratégica & Plano de Implementação**
*Documento de Planejamento de Produto | Feb 2026*

---

## 📊 ANÁLISE: Planejamento Proposto vs Realidade Atual

| Feature | Status Proposto | Status Atual | Esforço | Prioridade |
|---------|-----------------|--------------|---------|-----------|
| **Homepage** | ✅ Novo | 🔴 Não existe | ALTO | 🔴 P0 |
| **Portfolio com Abas** | ✅ Novo | 🟡 Parcial | MÉDIO | 🔴 P0 |
| **Model Portfolios** | ✅ Novo | 🔴 Mock | ALTO | 🟡 P1 |
| **Hub Research** | ✅ Novo | 🔴 Mock | ALTO | 🟡 P1 |
| **Hub DeFi Strategies** | ✅ Novo | 🟡 Partial | MÉDIO | 🟡 P1 |
| **DeFi Positions UI** | ✅ Redesign | 🟡 Existe | ALTO | 🟡 P1 |
| **Assessor Dashboard** | ✅ Melhorias | ✅ Existe | BAIXO | 🟢 P2 |
| **Admin CMS Expansion** | ✅ Novo | ✅ Existe Base | MÉDIO | 🟡 P1 |

---

## 🎯 VISÃO ESTRATÉGICA

### Objetivo Geral
Transformar o HubMercurius de um **Multi-tool Dashboard** em um **Platform de Gestão Patrimonial Premium** com:
- ✅ **Percepção de Valor Imediata** (Homepage como "Centro de Comando")
- ✅ **Organização Profissional** (Portfolio com abas, DeFi como DeBank)
- ✅ **Conteúdo Estratégico** (Research + Model Portfolios = Diferencial vs Concorrentes)
- ✅ **Ferramentas B2B** (Assessor Dashboard com relacionamento cliente-assessor)

### Filosofia de Implementação
> **"Excelente UX/Arquitetura da Informação > Recursos Técnicos Complexos"**

- ❌ Evitar: Cloud Functions pesadas, integração de wallets nativas (por agora)
- ✅ Focar: Frontend React + Firestore Básico + Reutilizar componentes existentes
- ✅ Métrica: Cada feature deve levar ≤ 2 sprints (com plano-implementer)

---

## 📋 BREAKDOWN DETALHADO POR FEATURE

### 🏠 FEATURE 1: HOMEPAGE (Dashboard de Entrada)
**Status**: 🔴 Não Implementado | **Esforço**: ALTO | **Prioridade**: P0

#### Descrição
Primeira página após login. "Centro de Comando" em 5 segundos que mostra:
- Patrimônio Total (Portfolio + DeFi consolidado)
- Evolução 24h
- Alertas & Oportunidades
- Novidades nos Hubs
- Top 3 ativos do dia

#### Arquitetura
```
/src/pages/Dashboard.jsx (NOVA)
├── Header Pessoal
│   ├── "Bom dia, [Nome]"
│   └── Botão "Adicionar Transação" (link para /portfolio?modal=add)
├── Hero Section
│   ├── KPI Consolidado: Patrimônio Total
│   │   └── Soma: portfolio_value + defi_total_value
│   ├── Evolução 24h (% + R$)
│   └── Status: Gain/Loss com cor
├── Alertas & Ações
│   ├── OpportunityBanner (reutilizar)
│   └── RemindersWidget (consumir RemindersContext)
├── Novidades (Grid 3 colunas)
│   ├── Latest Research
│   ├── Latest Airdrop
│   └── Latest DeFi Strategy
└── Mini Portfolio Overview
    ├── Top 3 Winners of the Day
    └── Top 3 Losers of the Day

Dados Necessários:
- portfolioContext.totalValue ✅ (já existe)
- portfolioContext.portfolioAssets ✅ (já existe)
- defiPositions (precisa agregar) ⏳
- reminders do Reminders.jsx ⏳
- últimos research/airdrops/strategies (via query Firestore)
```

#### Tasks
1. **Task 1.1**: Criar `/src/pages/Dashboard.jsx` com layout estrutural
2. **Task 1.2**: Integrar dados consolidados (Portfolio + DeFi)
3. **Task 1.3**: Criar widget de Novidades (query últimos docs)
4. **Task 1.4**: Atualizar routing: `/dashboard` → Dashboard home
5. **Task 1.5**: Criar breadcrumb/navegação visual

#### Firestore Collections Necessárias
✅ Já existem:
- `users/{uid}/portfolio/*`
- `airdrops/*`
- `defi_positions/*` (manual)

Novas:
- `research/*` (será criada no Hub)
- `defi_strategies/*` (será criada no Hub)

#### Estimativa
**Esforço**: 5-8 dias | **Dependências**: Nenhuma | **Bloqueadores**: Nenhum

---

### 📊 FEATURE 2: PORTFOLIO COM SISTEMA DE ABAS
**Status**: 🟡 Parcialmente Implementado | **Esforço**: MÉDIO | **Prioridade**: P0

#### Descrição Atual
Portfolio.jsx mostra tudo em uma página (KPIs, Charts, Tabela).

#### Novo Design
```
/src/pages/Portfolio.jsx (REFACTOR)
├── PortfolioHeader (✅ já limpo)
│   └── Buttons: [Sync] [Ativo] [Refresh]
└── Tabs Container
    ├── [TAB 1] Visão Geral
    │   ├── KpiCards (existente)
    │   ├── ChartArea - Donut (existente)
    │   └── ChartAreaEvolution - Line (existente)
    │
    ├── [TAB 2] Gestão de Ativos (NOVO)
    │   ├── Filters: Blockchain, Status
    │   ├── Advanced Table
    │   │   ├── Colunas: Asset | Qty | Avg Price | Current Price | P&L $ | P&L % | Allocation %
    │   │   ├── Sorting: Click header
    │   │   └── Click Row → Slide-over com "Extrato" do ativo
    │   │       └── Histórico: [Data] [Tipo] [Qty] [Preço] [Notas]
    │   └── Ações: [+ Compra] [- Venda] [Editar] [Deletar]
    │
    └── [TAB 3] Histórico (NOVO)
        ├── Timeline de transações
        ├── Filters: Data, Tipo, Ativo
        └── Export CSV

Componentes Necessários:
- PortfolioTabs.jsx (wrapper das abas)
- AdvancedAssetTable.jsx (tabela com sorting/filtering)
- AssetDetailSlideOver.jsx (modal lateral)
- TransactionHistory.jsx (timeline)
```

#### Dados Necessários
Precisa de Schema de Transações:
```javascript
// users/{uid}/portfolio/{coinId}/transactions (subcoleção NOVA)
{
  id: string,
  type: "BUY" | "SELL",
  quantity: number,
  price: number,
  date: ISO string,
  notes: string (opcional),
  usdValue: number
}
```

#### Tasks
1. **Task 2.1**: Criar estrutura de Abas (TabContext ou useState)
2. **Task 2.2**: Extrair `AdvancedAssetTable.jsx` (melhorar AssetTable.jsx)
3. **Task 2.3**: Criar `AssetDetailSlideOver.jsx`
4. **Task 2.4**: Implementar `TransactionHistory.jsx`
5. **Task 2.5**: Migrar dados: adicionar Firestore schema de transações
6. **Task 2.6**: Atualizar button dropdown: "Adicionar" → "Compra/Venda"

#### Estimativa
**Esforço**: 8-10 dias | **Dependências**: Dashboard (abas é padrão) | **Bloqueadores**: Schema de transações

---

### 🎯 FEATURE 3: MODEL PORTFOLIOS (Carteiras Recomendadas)
**Status**: 🔴 Não Implementado | **Esforço**: ALTO | **Prioridade**: P1

#### Descrição
Página que mostra carteiras recomendadas pelos analistas. Cada carteira tem:
- Tabela de alocação (Protocol | Token | % | Setor | Categoria)
- Gráfico Donut
- Análise textual semanal (Markdown)
- Magic Feature: "Comparar com meu Portfólio"

#### Arquitetura
```
/src/pages/ModelPortfolios.jsx (NOVA)
├── Grid de Cards de Carteiras
│   ├── "Carteira Conservadora" (4-5 cards)
│   ├── "Carteira Balanceada"
│   └── "Carteira Agressiva"
└── Clique → /dashboard/model-portfolios/[slug]

/src/pages/ModelPortfolioDetail.jsx (NOVA)
├── Header
│   ├── Título: "Carteira Perfeita"
│   ├── Seletor de Edição: "20 Fevereiro ▾" (histórico)
│   └── Status: Last Updated X days ago
├── Layout 2-col
│   ├── [COL 1] Dados Estruturados
│   │   ├── Tabela de Alocação
│   │   │   └── Protocolo | Token | % | Setor | Categoria | Entry Date
│   │   ├── Gráfico Donut (Recharts)
│   │   └── Botão: "Comparar com meu Portfólio"
│   │       → Modal: "Ações Necessárias"
│   │           ├── "Comprar +0.05 BTC"
│   │           ├── "Vender -10 LINK"
│   │           └── "Manter +100 SOL"
│   │
│   └── [COL 2] Análise Semanal (Markdown)
│       ├── 🎯 Alocação (mudanças)
│       ├── 🌡️ Sentimento de Mercado
│       ├── 🌍 Macro
│       ├── ⚖️ Regulatório
│       └── 🛡️ Posicionamento (conclusão)

Componentes:
- ModelPortfolioGrid.jsx (lista de carteiras)
- ModelPortfolioDetail.jsx (detalhe)
- AllocationTable.jsx (reutilizável)
- PortfolioComparator.jsx (lógica de comparação)
```

#### Firestore Schema
```javascript
// Coleção: model_portfolios
{
  carteira-conservadora: {
    name: "Carteira Conservadora",
    description: "Foco em segurança e renda...",
    riskLevel: "Baixo",
    expectedAPY: 8.5,
    tier: "pro", // quem pode acessar
    editions: {
      2026-02-20: {
        date: ISO string,
        assets: [
          {
            protocol: "Bitcoin",
            symbol: "BTC",
            percentage: 40,
            sector: "Reserva",
            category: "Segura",
            entryDate: "nov/20",
            group: "main"
          },
          // ... mais assets
        ],
        commentary: {
          allocation: "Não houve alterações...",
          marketSentiment: "Fear index...",
          macro: "Cenário macroeconômico...",
          regulatory: "Lei CLARITY...",
          positioning: "Recomendação final..."
        }
      }
    }
  }
}
```

#### Tasks
1. **Task 3.1**: Criar Firestore collection `model_portfolios` com seed data
2. **Task 3.2**: Criar `ModelPortfoliosHub.jsx` (lista de carteiras)
3. **Task 3.3**: Criar `ModelPortfolioDetail.jsx` (detalhe com tabs/histórico)
4. **Task 3.4**: Criar `AllocationTable.jsx` (tabela reutilizável)
5. **Task 3.5**: Implementar `PortfolioComparator.jsx` (lógica & modal)
6. **Task 3.6**: Integrar Markdown renderer para análise
7. **Task 3.7**: Adicionar ao Sidebar em `/dashboard/model-portfolios`
8. **Task 3.8**: Aplicar permission: `tier >= 'pro'`

#### Estimativa
**Esforço**: 10-12 dias | **Dependências**: Admin CMS (Task 8) | **Bloqueadores**: CMS para analistas criarem/editarem

---

### 📰 FEATURE 4: HUB DE RESEARCH (Análises/Blog)
**Status**: 🔴 Não Implementado | **Esforço**: ALTO | **Prioridade**: P1

#### Descrição
Página estilo Medium/Substack com artigos categorizados.

#### Arquitetura
```
/src/pages/ResearchHub.jsx (NOVA)
├── Category Pills: [Todas] [Macro] [On-Chain] [Gemas] [Relatórios]
├── Featured Article (Topo)
│   └── Grande card com cover image
└── Articles Grid (3-colunas)
    └── Card Padrão
        ├── Cover image (Cloudinary)
        ├── Título (2 linhas)
        ├── Resumo (2 linhas)
        ├── Autor + Data + "5 min read"
        └── Click → /research/[slug]

/src/pages/ResearchArticle.jsx (NOVA)
├── Breadcrumb + Back Button
├── Header
│   ├── Título grande
│   ├── Cover image full-width
│   ├── Autor | Data | Read time | Share buttons
│   └── Categorias (Pills)
├── Artigo (max-width 700px, font otimizado para leitura)
│   ├── Markdown renderer (remark + rehype)
│   ├── Suporte a images inline
│   └── Code blocks com syntax highlighting
└── Footer
    ├── Autor card (foto, bio, link)
    ├── Related articles (3 items)
    └── Newsletter CTA (opcional)

Componentes:
- ResearchHub.jsx (listing)
- ResearchArticle.jsx (detalhe)
- ArticleCard.jsx (reutilizável)
- MarkdownRenderer.jsx (prose styling)
```

#### Firestore Schema
```javascript
// Coleção: research_articles
{
  article-slug: {
    id: string,
    title: string,
    slug: string,
    coverImage: URL (Cloudinary),
    author: string,
    category: "macro" | "on-chain" | "gems" | "reports",
    excerpt: string (200 chars),
    content: string (Markdown),
    readTime: number (minutos),
    publishedAt: ISO string,
    updatedAt: ISO string,
    featured: boolean,
    tier: "free" | "pro" | "vip",
    tags: string[]
  }
}
```

#### Tasks
1. **Task 4.1**: Criar collection `research_articles` no Firestore
2. **Task 4.2**: Criar `ResearchHub.jsx` com filtros por categoria
3. **Task 4.3**: Criar `ResearchArticle.jsx` com Markdown renderer
4. **Task 4.4**: Implementar `MarkdownRenderer.jsx` (prose + tailwind)
5. **Task 4.5**: Adicionar `ArticleCard.jsx` (reutilizável)
6. **Task 4.6**: Implementar featured article lógica
7. **Task 4.7**: Adicionar ao Sidebar em `/dashboard/research`
8. **Task 4.8**: Seed data com 3-5 artigos de exemplo

#### Estimativa
**Esforço**: 8-10 dias | **Dependências**: Admin CMS (Task 8) | **Bloqueadores**: Editor Markdown no Admin

---

### ⚡ FEATURE 5: HUB DE DeFi STRATEGIES
**Status**: 🟡 Parcialmente (Airdrop Hub existe) | **Esforço**: MÉDIO | **Prioridade**: P1

#### Descrição
Irmão do Airdrop Hub, mas para estratégias DeFi (não airdrops). Mostra APY, Risco, Protocolo.

#### Arquitetura
```
/src/pages/DeFiStrategiesHub.jsx (NOVA - baseado em AirdropHub)
├── Filtros Inteligentes
│   ├── Blockchain: [Arbitrum] [Polygon] [Ethereum] [Optimism]
│   ├── Risco: [Baixo] [Médio] [Alto]
│   └── APY: Slider ou Range
├── Cards de Estratégias
│   ├── Protocolo (ex: "Aave + Uniswap")
│   ├── APY (ex: "24% ao ano")
│   ├── Risco (ex: "Impermanent Loss Moderado")
│   ├── Status: Active
│   └── Click → /defi-strategies/[id]

/src/pages/DeFiStrategyDetail.jsx (NOVA)
├── Header strategy
├── Overview cards (APY, Risco, Blockchain, Deposito Min)
├── Fases/Steps (idêntico ao AirdropDetail)
│   ├── Fase 1: Preparação
│   ├── Fase 2: Aprovação de Tokens
│   ├── Fase 3: Depositar em Pool
│   └── Fase 4: Monitorar Posição
├── Botão: "Comecei esta Estratégia"
│   → Pré-preenche DeFiPositions modal com protocolo/ativos
└── Componentes compartilhados com Airdrop
```

#### Firestore Schema
```javascript
// Coleção: defi_strategies (nova)
{
  strategy-aave-usdc: {
    id: string,
    name: string,
    protocol: "Aave + Uniswap" | etc,
    description: string,
    expectedAPY: number (24),
    riskLevel: "Low" | "Medium" | "High",
    blockchain: "Arbitrum" | "Polygon" | etc,
    minDeposit: number,
    imageUrl: Cloudinary,
    phases: [
      {
        name: "Preparação",
        steps: [
          { title: string, description: string, actions: string[] }
        ]
      }
    ],
    category: "Lending" | "Pool" | "Farming",
    tier: "free" | "pro" | "vip"
  }
}
```

#### Tasks
1. **Task 5.1**: Criar `/src/pages/DeFiStrategiesHub.jsx` (copiar AirdropHub)
2. **Task 5.2**: Criar `/src/pages/DeFiStrategyDetail.jsx` (copiar AirdropDetail)
3. **Task 5.3**: Customizar filtros (Blockchain, Risco, APY vs Type, Cost, Time)
4. **Task 5.4**: Criar Firestore collection `defi_strategies` + seed data
5. **Task 5.5**: Integrar "Comecei esta Estratégia" → DeFiPositions modal
6. **Task 5.6**: Adicionar ao Sidebar em `/dashboard/defi-strategies`
7. **Task 5.7**: Aplicar permission: `tier >= 'pro'`

#### Estimativa
**Esforço**: 4-6 dias | **Dependências**: Airdrop Hub (já existe) | **Bloqueadores**: Nenhum

---

### 💼 FEATURE 6: DeFi POSITIONS - REDESIGN "ABSURDO"
**Status**: 🟡 Existe mas precisa redesign | **Esforço**: ALTO | **Prioridade**: P1

#### Descrição Atual
Página crua com cards misturados. Precisa ser profissional (estilo DeBank/Zapper).

#### Novo Design
```
/src/pages/DeFiPositions.jsx (REFACTOR)
├── Painel Consolidado (Topo)
│   ├── KPI 1: Total em DeFi (USD)
│   ├── KPI 2: APY Médio Ponderado (%)
│   └── KPI 3: Lucro Realizado (USD)
│
├── Filtros/Controles
│   ├── Blockchain selector
│   ├── Status: [Ativo] [Encerrado]
│   └── Sort by: APY, Value, Risk
│
└── Accordion por Blockchain
    ├── [Arbitrum Logo] Arbitrum - $5.000 (3 posições)
    │   └── Expand
    │       ├── Position 1: Aave Lending
    │       │   ├── Token: USDC
    │       │   ├── Deposito: $2.000
    │       │   ├── APY: 8.5%
    │       │   ├── Health Factor: 2.5 (🟢 Green)
    │       │   ├── Rendimento Gerado: $50.30
    │       │   ├── Ações: [Editar] [Recolher Yield] [Fechar]
    │       │   └── Last harvest: 2 days ago
    │       │
    │       ├── Position 2: Uniswap V3 Pool
    │       │   ├── Token Pair: ETH/USDC
    │       │   ├── Liquidity: $3.000
    │       │   ├── Range: [1500 - 2500] 🎯 (Visual bar)
    │       │   ├── APY: 12% (+ fees)
    │       │   ├── Fees Earned: $120
    │       │   ├── Ações: [Ajustar Range] [Coletar Taxas] [Remover]
    │       │   └── Última coleta: ontem
    │       │
    │       └── Position 3: Curve Yield
    │           ├── Similar card...
    │
    ├── [Polygon Logo] Polygon - $1.200
    │   └── 2 posições...
    │
    └── [Ethereum Logo] Ethereum - $800
        └── 1 posição...

Componentes:
- DeFiPositionsOverview.jsx (KPIs consolidados)
- BlockchainAccordion.jsx (wrapper acordeon)
- DeFiPositionCard.jsx (card individual)
- PoolRangeVisualization.jsx (visualização de range Uniswap)
- HealthFactorBadge.jsx (Health factor com cores)
```

#### Dados Necessários
Schema DeFi Position (já existe, mas precisa melhorar):
```javascript
// users/{uid}/defi_positions/{positionId}
{
  id: string,
  type: "Lending" | "Pool" | "Farming",
  protocol: "Aave" | "Uniswap" | "Curve" | etc,
  blockchain: "Arbitrum" | "Polygon" | etc,
  tokenPair: "ETH/USDC" | "USDC" (lending),

  // Valores
  deposited: { amount: number, date: ISO string },
  currentValue: number,

  // Specific para Lending
  apy: number,
  healthFactor: number (opcional),

  // Specific para Pool (Uniswap V3)
  rangeMin: number,
  rangeMax: number,
  feesEarned: number,

  // Histórico
  harvests: [
    { date: ISO string, amount: number, notes: string }
  ],

  // Status
  status: "active" | "closed",
  closedAt: ISO string (opcional)
}
```

#### Tasks
1. **Task 6.1**: Refactor DeFiPositions.jsx → Accordion by blockchain
2. **Task 6.2**: Criar `DeFiPositionCard.jsx` (substituir cards atuais)
3. **Task 6.3**: Criar `PoolRangeVisualization.jsx` (barra visual para ranges)
4. **Task 6.4**: Criar `HealthFactorBadge.jsx` (cor dinâmica por health)
5. **Task 6.5**: Implementar consolidação de KPIs (total, APY médio, lucro)
6. **Task 6.6**: Adicionar ações: [Editar] [Recolher Yield] [Fechar]
7. **Task 6.7**: Criar modal para "Registrar Coleta de Taxas"
8. **Task 6.8**: Atualizar schema no Firestore se necessário

#### Estimativa
**Esforço**: 10-12 dias | **Dependências**: DeFi Strategies (complementar) | **Bloqueadores**: Nenhum

---

### 👔 FEATURE 7: ASSESSOR DASHBOARD - MELHORIAS
**Status**: ✅ Existe | **Esforço**: BAIXO | **Prioridade**: P2

#### O que Já Existe
- ✅ Listagem de clientes (cards)
- ✅ Ver portfolio do cliente (read-only)
- ✅ Relação assessor-cliente no Firestore

#### Melhorias Propostas
```
/src/pages/AssessorDashboard.jsx (MELHORIA)
├── Topo - Painel Consolidado
│   ├── AUA (Assets Under Advisement): Sum de portfolio_value
│   ├── Clientes Totais: count
│   ├── Alertas: "3 clientes com descuido"
│   └── Último dia de revisão (avg)
│
├── Tabela de Clientes (substituir cards)
│   ├── Nome
│   ├── Patrimônio Total
│   ├── Nível de Risco (baseado na alocação)
│   ├── Data da Última Revisão
│   └── Status: [Em dia] [Precisa atenção]
│   └── Click row → ClientPortfolioView
│
└── ClientPortfolioView (melhoria)
    ├── Portfolio read-only ✅
    ├── [NOVO TAB] Anotações Internas
    │   └── Textarea salvo em Firestore
    │       └── users/{clientId}/assessorNotes/{assessorId}
    └── [NOVO TAB] Gerar Recomendação
        └── Modal para escrever mensagem para o cliente
            └── Salvo em recommendations collection
            └── Aparecer na Homepage do cliente

Componentes:
- AssessorClientsTable.jsx (tabela vs cards)
- AssessorNotesTab.jsx (textarea com autosave)
- GenerateRecommendationModal.jsx
```

#### Firestore Schema
```javascript
// users/{clientId}/assessorNotes/{assessorId}
{
  assessorId: string,
  note: string (textarea),
  updatedAt: ISO string
}

// recommendations/{recommendationId}
{
  id: string,
  assessorId: string,
  clientId: string,
  message: string,
  createdAt: ISO string,
  read: boolean
}
```

#### Tasks
1. **Task 7.1**: Criar `AssessorClientsTable.jsx` (refactor de cards)
2. **Task 7.2**: Implementar cálculo de AUA (sum de clients)
3. **Task 7.3**: Implementar cálculo de "Risk Level" (portfolio allocation)
4. **Task 7.4**: Criar `AssessorNotesTab.jsx` (com autosave)
5. **Task 7.5**: Criar `GenerateRecommendationModal.jsx`
6. **Task 7.6**: Integrar recommendations na Homepage do cliente

#### Estimativa
**Esforço**: 4-5 dias | **Dependências**: Dashboard (Task 1) | **Bloqueadores**: Nenhum

---

### ⚙️ FEATURE 8: ADMIN PANEL - CMS EXPANSION
**Status**: ✅ Existe parcial | **Esforço**: MÉDIO | **Prioridade**: P1

#### O que Já Existe
- ✅ Tab: Gestão de Usuários
- ✅ Tab: Permissões (Feature Flags)
- ✅ Tab: CMS de Airdrops
- ✅ Tab: Agenda Global

#### Novas Funcionalidades
```
/src/pages/AdminPanel.jsx (EXPANSÃO)
└── Abas existentes + Novas
    ├── [CMS] Airdrops ✅
    ├── [CMS] NOVO: Research Articles
    ├── [CMS] NOVO: DeFi Strategies
    ├── [CMS] NOVO: Model Portfolios
    ├── Permissões
    ├── Usuários
    ├── Agenda
    └── Configurações Avançadas (opcional)

[CMS] Research Articles Tab
├── Tabela de artigos (Título, Categoria, Data, Status)
├── Botão: [+ Novo Artigo]
│   → Modal/Form:
│       ├── Título
│       ├── Slug (auto-gerado)
│       ├── Categoria (dropdown)
│       ├── Cover Image Upload (Cloudinary)
│       ├── Excerpt
│       ├── Conteúdo (Markdown editor ou rich text)
│       ├── Autor
│       ├── Tier (free/pro/vip)
│       ├── Featured (checkbox)
│       └── [Publicar] [Rascunho] [Cancelar]
└── Click artigo → Edit modal (mesmos campos)

[CMS] DeFi Strategies Tab
├── Tabela (Nome, Protocol, APY, Blockchain, Status)
├── Botão: [+ Nova Estratégia]
│   → Modal/Form:
│       ├── Nome
│       ├── Protocolo
│       ├── Blockchain (dropdown)
│       ├── APY esperada
│       ├── Risk level
│       ├── Min deposit
│       ├── Description
│       ├── Image
│       ├── Fases (array de steps)
│       └── [Publicar] [Draft] [Cancelar]
└── Click → Edit modal

[CMS] Model Portfolios Tab
├── Tabela (Nome, Risco, Edições, Data última)
├── Botão: [+ Nova Carteira]
│   → Modal/Form:
│       ├── Nome
│       ├── Description
│       ├── Risk level
│       ├── Expected APY
│       └── [Criar]
│   → Abre editor de "Nova Edição"
│
├── Click carteira → Editor de Edição
│   ├── [Histórico ▾] Dropdown com edições anteriores
│   ├── "Copiar da última edição?" (checkbox)
│   ├── Tabela Dinâmica (Protocolo | Token | % | Setor | Categoria | Entrada)
│   │   ├── Cada row editável
│   │   ├── Botão [+ Linha]
│   │   ├── Botão [- Remover] por row
│   │   └── Validação: Sum % = 100%
│   ├── Gráfico Donut (preview automático)
│   ├── Campos de Análise (Markdown editor):
│   │   ├── Allocation
│   │   ├── Market Sentiment
│   │   ├── Macro
│   │   ├── Regulatory
│   │   └── Positioning
│   └── [Publicar] [Draft] [Cancelar]

Componentes:
- CMSResearchTab.jsx (com MarkdownEditor)
- CMSDefiStrategiesTab.jsx (com phase builder)
- CMSModelPortfoliosTab.jsx (com table builder + markdown)
- MarkdownEditor.jsx (reutilizável)
- ImageUploader.jsx (reutilizável - Cloudinary)
```

#### Dependências
- **react-markdown** (já presente?) ou **remark** + **rehype**
- **next-ui** ou **headless ui** para modals (já usando?)
- **cloudinary widget** (já configurado?)

#### Tasks
1. **Task 8.1**: Criar `CMSResearchTab.jsx` + MarkdownEditor
2. **Task 8.2**: Criar `CMSDefiStrategiesTab.jsx` + phase builder
3. **Task 8.3**: Criar `CMSModelPortfoliosTab.jsx` + table builder
4. **Task 8.4**: Criar componentes reutilizáveis (MarkdownEditor, ImageUploader)
5. **Task 8.5**: Implementar validação de forms
6. **Task 8.6**: Integrar com Firestore (create, update, delete)
7. **Task 8.7**: Adicionar permission check (admin-only)

#### Estimativa
**Esforço**: 8-10 dias | **Dependências**: Tasks 3, 4, 5 (para usar dados) | **Bloqueadores**: Markdown editor

---

## 🎯 PRIORIZAÇÃO & ROADMAP DE IMPLEMENTAÇÃO

### Sprint 0: Preparação (1 semana)
- [ ] Setup Firestore collections (research, defi_strategies, model_portfolios, recommendations)
- [ ] Criar schemas Zod para validação
- [ ] Seed data inicial (5 articles, 3 strategies, 2 carteiras)
- [ ] Revisar e aprovar design mockups

### Sprint 1: Features Críticas (P0)
- [ ] **Task 1** (Homepage) - 6 dias
- [ ] **Task 2** (Portfolio Tabs) - 8 dias
- [ ] **Checkpoint**: Build + Hard refresh + Visual verification

### Sprint 2: Conteúdo Admin (P1)
- [ ] **Task 8** (Admin CMS Expansion) - 10 dias
  - Research CMS
  - DeFi Strategies CMS
  - Model Portfolios CMS
- [ ] Seed content do time Mercurius

### Sprint 3: Hubs (P1)
- [ ] **Task 4** (Research Hub) - 8 dias
- [ ] **Task 5** (DeFi Strategies Hub) - 5 dias

### Sprint 4: Redesigns & Refinements (P1)
- [ ] **Task 3** (Model Portfolios) - 10 dias
- [ ] **Task 6** (DeFi Positions UI) - 10 dias
- [ ] **Task 7** (Assessor Dashboard) - 4 dias

### Total Estimado
- **4 sprints** (1 mês com plano-implementer por task)
- **~80-100 dias de work** (com parallelização: 20-25 dias reais)

---

## 📊 MATRIZ DE DEPENDÊNCIAS

```
Dashboard (Task 1)
├── Precisa: Portfolio data ✅
└── Pode começar: SEM BLOQUEADORES

Portfolio Tabs (Task 2)
├── Precisa: Firestore transaction schema ⏳
└── Pode começar: Imediatamente (sem schema é 80% pronto)

Admin CMS (Task 8) ← BLOQUEADOR CRÍTICO
├── Research (4.1 depende)
├── DeFi Strategies (5.1 depende)
└── Model Portfolios (3.1 depende)

Research Hub (Task 4)
├── Depende de: Task 8 (CMS)
└── Pode começar: Semana 1

DeFi Strategies Hub (Task 5)
├── Depende de: Task 8 (CMS) + Airdrop Hub ✅
└── Pode começar: Semana 1

Model Portfolios (Task 3)
├── Depende de: Task 8 (CMS de carteiras)
└── Pode começar: Semana 2

DeFi Positions UI (Task 6)
├── Precisa: Melhorias no schema ⏳
└── Pode começar: SEM BLOQUEADORES (refactor puro)

Assessor Dashboard (Task 7)
├── Depende de: Task 1 (Dashboard home)
└── Pode começar: Semana 1
```

---

## ✅ CHECKLIST DE PRÓXIMOS PASSOS

### Para Aprovação do CTO:
- [ ] Entender priorização (P0 vs P1 vs P2)
- [ ] Confirmar esforço estimado é realista
- [ ] Validar que stack (React + Firestore) é suficiente
- [ ] Decidir: Começar Sprint 0 ou Sprint 1?
- [ ] Alocar time (1 dev full-time para paralelizar tasks)

### Para Dev Team:
- [ ] Ler este documento completamente
- [ ] Fazer PR com schemas Firestore
- [ ] Setup Firestore collections
- [ ] Criar seed data
- [ ] Começar Task 1 (Homepage) com plano-implementer

### Para Analistas (Conteúdo Mercurius):
- [ ] Preparar 3-5 artigos de Research para seed data
- [ ] Preparar 2-3 carteiras modelo com análises semanais
- [ ] Preparar 5-10 estratégias DeFi com fases

---

## 🎓 NOTAS ARQUITETURAIS

### Padrões a Manter
- ✅ Context API para estado global (PortfolioContext, etc)
- ✅ Lazy loading de páginas via React Router
- ✅ Design system com Tailwind + componentes reutilizáveis
- ✅ Firestore como source of truth
- ✅ Permission checks baseados em tier

### Novos Padrões a Introduzir
- ✅ CMS pattern (Admin edita → Firestore → Frontend consome)
- ✅ Markdown para conteúdo textual (blog + análises)
- ✅ Accordion para agrupamento (DeFi por blockchain)
- ✅ Tabs para organização (Portfolio com 3 abas)

### Performance Considerations
- 🔴 Homepage pode fazer queries pesadas → Implementar caching
- 🔴 ResearchHub com muitos artigos → Implementar pagination
- 🔴 Model Portfolios com gráficos → Lazy load Recharts charts
- ✅ Reutilizar `useCryptoPrices` hook para dados em tempo real

### Security Considerations
- ✅ Firestore Rules: Assess portfolio acesso (assessor pode ler, não editar)
- ✅ Recomendações: Apenas author assessor pode editar
- ✅ Admin CMS: Apenas admins podem editar
- ✅ Permissions: Checar tier antes de renderizar feature

---

## 📞 CONTATOS & ESCALATIONS

**Bloqueadores Identificados:**
1. Markdown editor para Admin (pesquisar: `react-markdown`, `slate`, `tiptap`)
2. Schema de transações do Portfolio (novo modelo, migração de dados)
3. Cloudinary setup para uploads (já existe?)

**Feedback esperado do CTO:**
- [ ] Priorização faz sentido?
- [ ] Esforço é realista?
- [ ] Alguma feature deveria ser removida ou adiada?
- [ ] Tem restrição técnica que não foi considerada?

---

**Documento criado:** Feb 25, 2026
**Status:** Aguardando aprovação CTO
**Próximo passo:** Sprint 0 (Preparação) se aprovado

