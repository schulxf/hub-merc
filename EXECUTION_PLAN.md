# 🎯 PLANO DE EXECUÇÃO PERFEITA
**HubMercurius Roadmap - Fase de Implementação**
*Documento de Operação | Feb 25, 2026*

---

## 📋 FASE 0: PRÉ-IMPLEMENTAÇÃO (Semana 1)

### 0.1 Refatoração Crítica de Débito Técnico
**Por que?** Diminuir risco de bugs durante nova implementação
**Onde?** Files: `AdminPanel.jsx` (923 LOC), `Portfolio.jsx` (820 LOC)

#### Task 0.1.1: Decomposição AdminPanel
- **Objetivo**: Quebrar mega-component em 5 sub-componentes
- **Tempo**: 2 dias
- **Código Atual**: 923 linhas, 7 `useState`
- **Estrutura Proposta**:
  ```
  AdminPanel.jsx (container, 150 LOC)
  ├── AdminUsersTab.jsx (usuario management)
  ├── AdminPermissionsTab.jsx (feature flags)
  ├── AdminAirdropsTab.jsx (CMS - EXISTENTE)
  ├── AdminAgendaTab.jsx (calendar)
  └── AdminContentTab.jsx (NEW - Research, DeFi, Carteiras)
  ```
- **Método**: Extract components com `useCallback` para callbacks, manter Firestore write logic no parent
- **Teste**: Build deve passar, visualmente idêntico

#### Task 0.1.2: Portfolio State Management
- **Objetivo**: Reduzir 10 `useState` → `useReducer` (1 state object)
- **Tempo**: 1.5 dias
- **Benefício**: Menos re-renders, lógica modal/form centralizada
- **Estrutura**:
  ```javascript
  // Antes: 10 useState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  // ... 7 mais

  // Depois: 1 useReducer
  const [state, dispatch] = useReducer(portfolioReducer, initialState);
  // state = { modal: { isOpen, editingAsset, selectedCoin, ... } }
  ```
- **Teste**: Modal flow deve funcionar identicamente

#### Task 0.1.3: TypeScript Zod Enforcement
- **Objetivo**: Adicionar validação de dados em Firestore reads/writes
- **Tempo**: 1 dia
- **Código**: Ampliar schemas existentes em `src/schemas/`
- **Focos**:
  - Portfolio assets (já parcial)
  - DeFi positions (novo)
  - Research articles (novo)
  - Model portfolios (novo)
  - Recommendations (novo)
- **Teste**: Zod parsing com dados inválidos deve falhar graciosamente

#### Task 0.1.4: Firestore Security Rules Audit
- **Objetivo**: Validar rules estão corretas (read/write by tier)
- **Tempo**: 4 horas
- **Ferramenta**: `firebase_validate_security_rules` MCP
- **Checklist**:
  - ✓ Users podem ler seu próprio portfolio
  - ✓ Assessores podem ler portfolio de clientes
  - ✓ Apenas admins editam CMS (airdrops, research, etc)
  - ✓ Transação tem campo userId para isolation
- **Saída**: Rules validadas ou atualizadas

#### Task 0.1.5: Testing Foundation
- **Objetivo**: Setup CI/CD básico + cobertura
- **Tempo**: 1 dia
- **Setup**:
  - Criar `jest.config.js` (se não existir)
  - Adicionar `--coverage` flag no package.json
  - 3-5 testes exemplo (Portfolio render, AdminPanel tabs, PortfolioContext)
  - GitHub Actions workflow (opcional)
- **Métrica**: Target 10% coverage após essa phase

**Total Semana 0**: ~6 dias (parallelizável)

---

## 🚀 FASE 1: FEATURES CRÍTICAS (Semana 1-2)

### Sprint 1.1: HOMEPAGE (Task 1)
**Proprietário**: 1 dev (frontend)
**Tempo**: 6 dias
**Dependências**: PortfolioContext ✅

#### 1.1.1 Criar estrutura base
```
src/pages/Dashboard.jsx (NOVA)
├── Hook: useDashboardData() (consolidação)
├── Componentes:
│   ├── DashboardHeader.jsx
│   ├── HeroCard.jsx (Patrimônio Total + 24h)
│   ├── AlertsSection.jsx (OpportunityBanner + Reminders)
│   ├── NewsSection.jsx (3-column grid)
│   └── PortfolioOverview.jsx (Top 3 winners/losers)
```

#### 1.1.2 Dados consolidados
```javascript
// useDashboardData()
const portfolioValue = portfolioContext.totalValue; // Soma assets
const defiValue = defiPositions.reduce(...); // Agregação manual por enquanto
const totalPatrimônio = portfolioValue + defiValue;
const evolution24h = calculateEvolution(snapshots); // Portfolio snapshots
```

#### 1.1.3 NewsGrid component
- Query Firestore: `airdrops.limit(1).orderBy('createdAt', 'desc')`
- Query Firestore: `research_articles.limit(1).orderBy('publishedAt', 'desc')`
- Query Firestore: `defi_strategies.limit(1).orderBy('createdAt', 'desc')`
- Fallback se collection vazia: placeholder cards

#### 1.1.4 Routing
- Atualizar `App.jsx`: `/dashboard` → Dashboard (antes ia direto para Portfolio)
- Adicionar sidebar nav: Dashboard é first item
- Backward compat: `/dashboard/portfolio` continua funcionando

#### 1.1.5 Teste & Verificação
- Build: `npm run build` ✓
- Visual: Screenshot em 3 resoluções (mobile, tablet, desktop)
- Performance: Lighthouse score > 80

**Checklist**:
- [ ] `/dashboard` mostra homepage
- [ ] Patrimônio Total é dinâmico
- [ ] Novidades populam corretamente
- [ ] Sem console errors
- [ ] Responsive em mobile

---

### Sprint 1.2: PORTFOLIO COM ABAS (Task 2)
**Proprietário**: 1 dev (frontend) - pode ter overlap com 1.1
**Tempo**: 8 dias
**Dependências**: Firestore transaction schema ⏳

#### 1.2.1 Estrutura de Schema - BLOCKER
**Necessário antes de implementar**:
```javascript
// users/{uid}/portfolio/{coinId}/transactions (NEW subcollection)
{
  id: string (auto-gerado),
  type: "BUY" | "SELL",
  quantity: number,
  price: number, // preço na transação
  date: ISO string (Timestamp.now()),
  notes: string (opcional),
  usdValue: number (qty * price)
}
```

**Ação**:
- Criar Firestore migration script (ou manual seed)
- Adicionar 2-3 transações de teste por ativo
- Validar com Zod schema novo

#### 1.2.2 UI: Sistema de Abas
```jsx
// Portfolio.jsx refactored
const [activeTab, setActiveTab] = useState('overview');

return (
  <>
    <PortfolioHeader ... />
    <TabNavigation
      activeTab={activeTab}
      onChange={setActiveTab}
    />
    {activeTab === 'overview' && <OverviewTab />}
    {activeTab === 'assets' && <AssetsTab />}
    {activeTab === 'transactions' && <TransactionsTab />}
  </>
);
```

#### 1.2.3 Tab 1: Visão Geral
- Reutilizar componentes existentes:
  - KpiCards (já existe)
  - ChartArea - Donut (já existe)
  - ChartAreaEvolution - Line (já existe)
- Change: remover AssetTable daqui (vai para Tab 2)

#### 1.2.4 Tab 2: Gestão de Ativos (NOVO)
- Criar `AdvancedAssetTable.jsx` (melhoria do AssetTable existente)
- Colunas: Asset | Qty | Avg Price | Current Price | P&L $ | P&L % | Allocation %
- Sorting: click header → reordenar
- Click row → Slide-over modal com extrato (todas transações do ativo)
- Dropdown principal: "Adicionar" → [+ Compra] [- Venda]

#### 1.2.5 Tab 3: Histórico (NOVO)
- Componente `TransactionHistory.jsx`
- Timeline de todas as transações (ordem reversa: mais recente primeiro)
- Filters: [Data range] [Tipo: Compra/Venda] [Ativo]
- Botão: [Export CSV]

#### 1.2.6 Teste & Verificação
- Build ✓
- Tab switching funciona sem re-render de data
- AssetTable slide-over abre/fecha
- Transaction history carrega dados corretos

**Checklist**:
- [ ] 3 abas navegáveis
- [ ] Overview tab == Portfolio atual
- [ ] Assets tab tem sorting + slide-over
- [ ] Transactions tab tem filters
- [ ] Sem layout shifts on tab change

---

## 🏗️ FASE 2: ADMIN CMS (Semana 2-3)

### Sprint 2: Admin CMS Expansion (Task 8) - BLOCKER para Tasks 3, 4, 5
**Proprietário**: 1 dev (fullstack)
**Tempo**: 10 dias
**Bloqueador crítico**

#### 2.1 Setup de Componentes Reutilizáveis
- `MarkdownEditor.jsx` (usar react-markdown + textarea, ou Tiptap se houver orçamento)
- `ImageUploader.jsx` (integrar Cloudinary)
- `FormBuilder.jsx` (para tabelas dinâmicas)

#### 2.2 Tab: Research CMS
```
AdminPanel → [CMS] → Research Articles
├── Tabela: [Título] [Categoria] [Data] [Status] [Ações]
├── Botão: [+ Novo Artigo]
│   → Modal:
│       ├── Título
│       ├── Slug (auto)
│       ├── Categoria: enum [macro, on-chain, gems, reports]
│       ├── Cover Image: Upload
│       ├── Excerpt
│       ├── Conteúdo: MarkdownEditor
│       ├── Autor
│       ├── Tier: [free, pro, vip]
│       ├── Featured: ☐
│       └── [Publicar] [Rascunho] [Cancelar]
└── Click artigo → edit (mesmos campos)
```

**Firestore**: `research_articles` collection
- Schemas: Zod validação

#### 2.3 Tab: DeFi Strategies CMS
```
AdminPanel → [CMS] → DeFi Strategies
├── Similar a Research, mas:
├── Campos:
│   ├── Nome
│   ├── Protocolo (Aave, Uniswap, etc)
│   ├── Blockchain
│   ├── APY esperada
│   ├── Risk level
│   ├── Min deposit
│   ├── Phases: [{ name, steps: [{ title, description, actions }] }]
└── Publicar
```

#### 2.4 Tab: Model Portfolios CMS (MAIS COMPLEXO)
```
AdminPanel → [CMS] → Model Portfolios
├── Tabela: [Nome] [Risco] [Edições] [Última]
├── Click → Editor de Edição
│   ├── [Histórico ▾] Dropdown de edições
│   ├── Checkbox: "Copiar da última edição?"
│   ├── Tabela Dinâmica (Dynamic Form)
│   │   ├── Colunas: Protocol | Token | % | Sector | Category | Entry
│   │   ├── Cada row editável
│   │   ├── [+ Add Row] [- Remove]
│   │   └── Validação: Sum % === 100%
│   ├── Preview: Gráfico Donut (Recharts)
│   ├── Análise (5 seções):
│   │   ├── Alocação
│   │   ├── Sentimento
│   │   ├── Macro
│   │   ├── Regulatório
│   │   └── Posicionamento
│   └── [Publicar] [Rascunho]
```

**Firestore**: `model_portfolios/{id}/editions/{date}` (subcollection)

#### 2.5 Integração Firestore
- Criar/atualizar/deletar com error handling
- Timestamps automáticos
- Permission check (admin-only)
- Zod validation antes de setDoc

#### 2.6 Teste & Verificação
- Admin pode criar research article ✓
- Slug auto-generated sem conflitos ✓
- Model portfolio table valida 100% ✓
- Edições antigas acessíveis via dropdown ✓

---

## 📚 FASE 3: HUBS (Semana 3-4)

### Sprint 3.1: Research Hub (Task 4)
**Proprietário**: 1 dev
**Tempo**: 8 dias
**Dependência**: Task 8 (Admin CMS Research) ✅

#### 3.1.1 Frontend
```
/src/pages/ResearchHub.jsx
├── Category Pills: [Todas] [Macro] [On-Chain] [Gemas] [Relatórios]
├── Featured Article (top)
├── Articles Grid (3-col)
│   └── ArticleCard.jsx (image, title, excerpt, author, read-time)
└── /research/[slug] → ResearchArticle.jsx
    ├── Markdown renderer (tailwind prose)
    ├── Author card
    ├── Related articles (3)
    └── Newsletter CTA
```

#### 3.1.2 Componentes
- `ResearchHub.jsx` (listing)
- `ResearchArticle.jsx` (detail)
- `ArticleCard.jsx` (card, reutilizável)
- `MarkdownRenderer.jsx` (prose + tailwind)

#### 3.1.3 Dados
- Query Firestore: `research_articles.orderBy('publishedAt', 'desc')`
- Filter by category
- Pagination: 10 por página

#### 3.1.4 Teste & Verificação
- Artigos carregam ✓
- Category filter funciona ✓
- Markdown renderiza corretamente ✓
- Mobile responsive ✓

---

### Sprint 3.2: DeFi Strategies Hub (Task 5)
**Proprietário**: 1 dev (pode paralelizar com 3.1)
**Tempo**: 5 dias
**Dependência**: Task 8 (Admin CMS DeFi) + Airdrop Hub exists ✅

#### 3.2.1 Copiar de Airdrop Hub
- Base: `/src/pages/AirdropHub.jsx` → `/src/pages/DeFiStrategiesHub.jsx`
- Customizações:
  - Filtros: Blockchain + Risk + APY (vs Type + Cost + Time)
  - Cards mostram: Protocol + APY + Risk (vs Type + Cost + Time)
  - Click → `/defi-strategies/[id]` detail page

#### 3.2.2 DeFi Strategy Detail
- Fases idênticas ao Airdrop
- Botão "Comecei esta Estratégia" → Pré-preenche DeFiPositions modal

#### 3.2.3 Integração DeFiPositions
- Quando user clica "Comecei", modal DeFiPositions abre com:
  ```javascript
  {
    protocol: strategy.protocol,
    blockchain: strategy.blockchain,
    type: strategy.category,
    expectedAPY: strategy.expectedAPY,
    // user preenche: deposited amount
  }
  ```

#### 3.2.4 Teste & Verificação
- Estratégias listam ✓
- Filtros funcionam ✓
- Detail page abre ✓
- "Comecei" pré-popula form ✓

---

## 🎨 FASE 4: REDESIGNS (Semana 4-5)

### Sprint 4.1: Model Portfolios (Task 3)
**Proprietário**: 1 dev + UI/UX
**Tempo**: 10 dias
**Dependência**: Admin CMS Model Portfolios ✅

#### 4.1.1 Frontend
```
/src/pages/ModelPortfolios.jsx
├── Grid de Cards (3-col)
│   ├── "Carteira Conservadora"
│   ├── "Carteira Balanceada"
│   └── "Carteira Agressiva"
└── /model-portfolios/[slug] → ModelPortfolioDetail.jsx
    ├── Header + Edition Selector
    ├── Layout 2-col:
    │   ├── [Esq] Table + Donut
    │   └── [Dir] Análise Markdown
    └── Botão: "Comparar com meu Portfólio"
        → Modal: "Ações Necessárias"
```

#### 4.1.2 Componentes
- `ModelPortfoliosHub.jsx`
- `ModelPortfolioDetail.jsx`
- `AllocationTable.jsx` (tabela de alocação, reutilizável)
- `PortfolioComparator.jsx` (lógica + modal)

#### 4.1.3 Magic Feature: Comparador
```javascript
// Lógica
const comparison = comparePortfolios(
  modelPortfolio.assets,  // target
  userPortfolio.assets    // current
);

// Output
[
  { action: 'BUY', asset: 'BTC', amount: 0.05 },
  { action: 'SELL', asset: 'LINK', amount: 100 },
  { action: 'HOLD', asset: 'ETH', amount: 0 }
]
```

#### 4.1.4 Teste & Verificação
- Carteiras listam ✓
- Edition selector muda dados ✓
- Donut chart renderiza ✓
- Comparação calcula corretamente ✓

---

### Sprint 4.2: DeFi Positions Redesign (Task 6)
**Proprietário**: 1 dev
**Tempo**: 10 dias
**Dependência**: Nenhuma (refactor puro)

#### 4.2.1 Novo Layout
```
DeFiPositions.jsx (refactor)
├── Painel Consolidado (KPIs)
│   ├── Total em DeFi
│   ├── APY Médio Ponderado
│   └── Lucro Realizado
├── Filtros/Controles
└── Acordeon por Blockchain
    ├── [Arbitrum] $5.000
    │   └── Expand → Posições
    └── [Polygon] $1.200
        └── Expand → Posições
```

#### 4.2.2 Card de Posição (por tipo)
**Lending (Aave)**:
- Token, deposito, APY
- Health Factor (badge colorido)
- Rendimento gerado
- Ações: [Editar] [Recolher Yield] [Fechar]

**Pool (Uniswap V3)**:
- Token Pair, liquidity, range visual
- APY + Fees earned
- Ações: [Ajustar Range] [Coletar Taxas] [Remover]

#### 4.2.3 Componentes
- `DeFiPositionsOverview.jsx` (KPIs)
- `BlockchainAccordion.jsx` (wrapper acordeon)
- `DeFiPositionCard.jsx` (card individual)
- `PoolRangeVisualization.jsx` (barra visual)
- `HealthFactorBadge.jsx` (verde/amarelo/vermelho)

#### 4.2.4 Teste & Verificação
- Posições agrupam por blockchain ✓
- Cards têm ações ✓
- Health factor muda cor ✓
- Layout não quebra com muitas posições ✓

---

### Sprint 4.3: Assessor Dashboard (Task 7)
**Proprietário**: 1 dev
**Tempo**: 4 dias
**Dependência**: Dashboard (Task 1)

#### 4.3.1 Melhorias
- Tabela de clientes (vs cards)
- Anotações internas (textarea)
- Gerar recomendação (modal)
- Integração com Homepage do cliente

#### 4.3.2 Componentes
- `AssessorClientsTable.jsx`
- `AssessorNotesTab.jsx`
- `GenerateRecommendationModal.jsx`

#### 4.3.3 Teste & Verificação
- Tabela renderiza ✓
- Notas salvam ✓
- Recomendações aparecem na Homepage do cliente ✓

---

## 📊 TIMELINE VISUAL

```
SEMANA 1         SEMANA 2         SEMANA 3         SEMANA 4         SEMANA 5
│────────────│────────────│────────────│────────────│────────────│

[FASE 0: PRÉ-IMPLEMENTAÇÃO]
├─ 0.1 AdminPanel decomp  ████
├─ 0.2 Portfolio reducer  ███
├─ 0.3 Zod enforcement    ██
├─ 0.4 Firestore audit    ██
└─ 0.5 Testing setup      ██

                    [FASE 1: CRÍTICAS]
                    ├─ Task 1: Homepage          ██████
                    └─ Task 2: Portfolio Tabs    ████████

                             [FASE 2: CMS]
                             └─ Task 8: Admin CMS  ██████████

                                      [FASE 3: HUBS]
                                      ├─ Task 4: Research    ████████
                                      └─ Task 5: DeFi Strat  █████

                                              [FASE 4: REDESIGNS]
                                              ├─ Task 3: ModelPort  ██████████
                                              ├─ Task 6: DeFi Pos   ██████████
                                              └─ Task 7: Assessor   ████

TOTAL: ~25 dias de work parallelizado (pode fazer em 4 sprints reais de 2 semanas)
```

---

## ✅ QUALITY GATES

### Por Sprint
- [ ] Build passa (`npm run build`)
- [ ] Zero console errors
- [ ] Lighthouse score > 80 (mobile)
- [ ] Teste novo feature manualmente
- [ ] Screenshot em 3 resoluções

### Ao Final
- [ ] Roadmap 100% completo
- [ ] 8 Features implementadas
- [ ] Testing coverage > 20%
- [ ] Firestore rules auditadas
- [ ] Documentação atualizada
- [ ] Pronto para produção

---

## 🔧 FERRAMENTAS & SETUP

### Git Workflow
```bash
# Cada task = 1 branch
git checkout -b feat/task-1-homepage
# Commits semânticos
git commit -m "feat(dashboard): create homepage with hero section"
# PR para review
gh pr create
```

### Testing
```bash
# Rodar testes
npm run test

# Coverage
npm run test:coverage

# E2E (opcional)
npm run test:e2e
```

### Build & Deploy
```bash
# Preview build local
npm run build
npm run preview

# Deploy (quando pronto)
firebase deploy
```

---

## 📞 ESCALATIONS

**Bloqueadores**:
1. ✅ Markdown editor (usar react-markdown simples, evitar Tiptap complexo)
2. ✅ Cloudinary setup (já existe?)
3. ⏳ Firestore transaction schema (criar antes de Task 2)

**Riscos**:
- [ ] Performance em Homepage com muitas queries Firestore
- [ ] localStorage vulnerabilities (DeFi positions tracking)
- [ ] Testing coverage baixa

**Sugestões**:
- Usar `plan-implementer` agent por task (acelera execução)
- Paralelizar Tasks 1 & 2, Tasks 3 & 4 & 5
- Reviews semanais de progresso

---

**Status**: 🟢 Pronto para começar Phase 0
**Data**: Feb 25, 2026
**Próximo**: Aprovação CTO + Start Sprint 0
