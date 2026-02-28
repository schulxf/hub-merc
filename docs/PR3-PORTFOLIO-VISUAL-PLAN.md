# PR3 - Épico do Portfólio Visual 📊

## 📋 Overview

**Objetivo:** Refatorar Portfolio.jsx em componentes reutilizáveis, implementar visualizações de dados (Donut Chart + Line Chart), otimizar bundle size via code splitting, e melhorar performance com memoization e virtualization.

**Estimativa:** 3-4 dias
**Impacto:** Bundle -340KB (849KB → 500KB), Performance +40%, UX +100%

---

## 🏗️ Decisões Arquiteturais

### 1. Decomposição em Componentes
- **PortfolioSidebar** - Painel esquerdo com lista de ativos
- **PortfolioHeader** - Cabeçalho com título e botões de ação
- **KpiCards** - Cards com métricas (Total, 24h Change, Yield)
- **ChartArea** - Área com Donut + Line Charts
- **AssetTable** - Tabela de detalhes com virtualization
- **PortfolioContext** - Context para estado compartilhado

### 2. Charts com Recharts
- **PieChart** (Donut) - Alocação de carteira por moeda
- **LineChart** - Evolução histórica (últimos 30/90/365 dias)
- **ResponsiveContainer** - Auto-resize em diferentes viewports

### 3. Code Splitting Strategy
- `components/portfolio/` - Componentes do portfólio (lazy loaded)
- Dynamic imports no routing principal
- Recharts como vendor chunk separado

### 4. Performance Optimizations
- `React.memo()` para componentes puros
- `useMemo()` para cálculos custosos
- `useCallback()` para handlers
- Virtualization (react-window) para 1000+ assets
- Image optimization com `next/image` (futuro)

### 5. State Management
- Manter context para dados compartilhados
- TanStack Query para sync com Firestore
- localStorage para snapshots históricos

---

## 📋 Tarefas de Implementação

### Task 1: Criar Estrutura de Pastas e Context
**File:** `src/components/portfolio/PortfolioContext.jsx`
**Dependência:** Nenhuma (base)

**Descrição:** Criar Context para compartilhar estado (portfolioAssets, prices, loading) entre componentes filhos

**Detalhes:**
- Extrair estado de Portfolio.jsx para PortfolioContext
- Provider em `<Portfolio>`
- Hooks: `usePortfolioContext()` para acesso
- Inicial: portfolioAssets, livePrices, isLoading, syncTrigger

**Verificação:**
- ✓ Context criado
- ✓ Provider testado
- ✓ Hooks exportados

---

### Task 2: PortfolioHeader Component
**File:** `src/components/portfolio/PortfolioHeader.jsx`
**Dependência:** Task 1 (Context)

**Descrição:** Componente do cabeçalho com título, botões de ação (Sync, Add Asset, Refresh)

**Detalhes:**
- Props: `onSync()`, `onAddAsset()`, `isSyncing`
- Botões: Sync, + Ativo, Refresh
- Icons: RefreshCw, Plus
- Loading state com spinner
- Wrapped com `React.memo()`

**Verificação:**
- ✓ Botões funcionam
- ✓ Props corretos
- ✓ Styling consistente

---

### Task 3: KpiCards Component
**File:** `src/components/portfolio/KpiCards.jsx`
**Dependência:** Task 1 (Context)

**Descrição:** Cards com métricas principais (Total Value, 24h Change, Yield)

**Detalhes:**
- 3 cards em grid
- Card 1: Total Portfolio Value (USD)
- Card 2: 24h Change (%)
- Card 3: Yield (%)
- Usa `useMemo()` para cálculos
- Cores dinâmicas (green/red)
- `React.memo()` wrapper

**Cálculos:**
```javascript
totalValue = sum(asset.amount * currentPrice)
change24h = ((current - previous) / previous) * 100
yield = ((current - buyPrice) / buyPrice) * 100
```

**Verificação:**
- ✓ Cálculos corretos
- ✓ Cores dinâmicas
- ✓ Formatting USD/percentual

---

### Task 4: PortfolioSidebar Component
**File:** `src/components/portfolio/PortfolioSidebar.jsx`
**Dependência:** Task 1 (Context)

**Descrição:** Sidebar esquerdo com lista de ativos do portfólio

**Detalhes:**
- Lista scrollável de assets
- Item: Coin icon + name + balance + USD value
- Hover effect com delete button
- Search/filter opcional (futuro)
- Max-height com scroll
- `React.memo()` para items

**Estrutura Item:**
```
[🟠] Bitcoin         0.5 BTC
     $21,500.00      +5.2%
```

**Verificação:**
- ✓ Assets carregam
- ✓ Valores corretos
- ✓ Delete funciona

---

### Task 5: ChartArea - Donut Chart
**File:** `src/components/portfolio/ChartArea.jsx`
**Dependência:** Task 1 (Context), Task 3 (KpiCards)

**Descrição:** Área com Donut Chart (PieChart) mostrando alocação por moeda

**Detalhes:**
- Importar: `recharts` (PieChart, Cell, ResponsiveContainer)
- Data: { name: 'Bitcoin', value: 45000 }, etc
- Cores: usar asset.color
- Legend: bottom
- Hover tooltip com percentual
- Responsive height
- `useMemo()` para data transformation

**Data Transformation:**
```javascript
chartData = portfolioAssets.map(asset => ({
  name: asset.name,
  value: asset.amount * livePrices[asset.coinId],
}))
```

**Verificação:**
- ✓ Chart renders
- ✓ Colors correct
- ✓ Responsive

---

### Task 6: ChartArea - Line Chart (Evolution)
**File:** `src/components/portfolio/ChartAreaEvolution.jsx`
**Dependência:** Task 5 (Donut), Task 1 (Context)

**Descrição:** Line Chart mostrando evolução do portfólio nos últimos 30/90/365 dias

**Detalhes:**
- Importar: `recharts` (LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend)
- Data: Array de snapshots históricos com timestamps
- Buttons: 30D, 90D, 365D
- Y-axis: USD value
- X-axis: Dates (formatadas)
- Responsive
- `useMemo()` para filtering por período

**Data Storage:**
```javascript
// Firestore: users/{uid}/portfolio_history
{
  timestamp: ISO string,
  totalValue: 45000,
  assets: { BTC: 0.5, ETH: 2.0 }
}
```

**Mock Data (até ter real):**
- Gerar 30 dias de dados com variação realista

**Verificação:**
- ✓ Chart renders
- ✓ Period buttons work
- ✓ Dates formatted

---

### Task 7: AssetTable Component
**File:** `src/components/portfolio/AssetTable.jsx`
**Dependência:** Task 1 (Context), Task 4 (Sidebar)

**Descrição:** Tabela detalhada de ativos com virtualization para 1000+ items

**Detalhes:**
- Colunas: Name, Symbol, Balance, Buy Price, Current Price, Value, Change%
- Importar: `react-window` (FixedSizeList)
- Altura: 400px max, scroll interno
- Item height: 50px
- Delete button on hover
- `React.memo()` para rows

**Estrutura Row:**
```
Bitcoin | BTC | 0.5 | $40,000 | $43,000 | $21,500 | +7.5% [Delete]
```

**Verificação:**
- ✓ Renders with virtualization
- ✓ Scroll smooth
- ✓ Delete works

---

### Task 8: Refactor Portfolio.jsx Principal
**File:** `src/pages/Portfolio.jsx`
**Dependência:** Tasks 1-7 (todos componentes)

**Descrição:** Remover lógica de Portfolio.jsx e compor com componentes novos

**Detalhes:**
- Remover JSX inline
- Manter: State logic, Firestore hooks, context setup
- Importar componentes do `src/components/portfolio/`
- Layout: Grid com Sidebar + Main area
- Provider wrapper: `<PortfolioProvider>`

**Nova Estrutura:**
```jsx
<PortfolioProvider>
  <div className="flex gap-4">
    <PortfolioSidebar />
    <div className="flex-1">
      <PortfolioHeader onSync={...} />
      <KpiCards />
      <div className="grid grid-cols-2 gap-4">
        <ChartArea />           {/* Donut */}
        <ChartAreaEvolution />  {/* Line */}
      </div>
      <AssetTable />
    </div>
  </div>
</PortfolioProvider>
```

**Verificação:**
- ✓ All components render
- ✓ Data flows correctly
- ✓ No regressions

---

### Task 9: Dynamic Imports (Code Splitting)
**File:** `src/App.jsx` (modificar routing)
**Dependência:** Task 8 (Portfolio refactored)

**Descrição:** Implementar lazy loading de Portfolio e outros componentes pesados

**Detalhes:**
- Importar: `React.lazy`, `Suspense`
- Lazy load: Portfolio, UniswapCalc, DeFi (páginas pesadas)
- Fallback: Loading spinner
- Path: `src/pages/Portfolio.jsx` → lazy loaded

**Implementação:**
```javascript
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const UniswapCalc = React.lazy(() => import('./pages/UniswapCalc'));

// Em routing
<Suspense fallback={<LoadingScreen />}>
  <Portfolio />
</Suspense>
```

**Verificação:**
- ✓ Lazy load works
- ✓ Bundle reduced
- ✓ Fallback shows

---

### Task 10: Performance Optimization - Memoization
**File:** `src/components/portfolio/*.jsx`
**Dependência:** Tasks 2-7 (componentes)

**Descrição:** Aplicar React.memo, useMemo, useCallback em todos componentes

**Detalhes:**
- Wrap componentes com `React.memo()`
- Usar `useMemo()` para: calculations, data transformations, array sorts
- Usar `useCallback()` para: handlers, event listeners
- Check: DevTools React Profiler para re-renders desnecessários

**Padrão:**
```javascript
export default React.memo(function ComponentName() {
  const expensiveValue = useMemo(() => {
    return complexCalculation(data)
  }, [data])

  const handleClick = useCallback(() => {
    doSomething()
  }, [])

  return <div>...</div>
})
```

**Verificação:**
- ✓ No unnecessary re-renders
- ✓ Profiler shows <100ms render
- ✓ Memory stable

---

### Task 11: Testing & QA
**File:** Multiple
**Dependência:** Task 10 (Optimization done)

**Descrição:** Teste todos componentes, charts, interações

**Testes Manuais:**
- [ ] Add asset → chart updates
- [ ] Edit asset → values recalculate
- [ ] Delete asset → removed from all views
- [ ] Sync on-chain → portfolio updates
- [ ] Charts responsive em mobile
- [ ] No console errors
- [ ] Performance: <200ms render

**Performance Targets:**
- [ ] Main bundle: <500KB gzip
- [ ] Portfolio component: <150KB
- [ ] Initial render: <200ms
- [ ] Chart re-render: <100ms

**Verificação:**
- ✓ All manual tests pass
- ✓ No console errors
- ✓ Performance targets met

---

### Task 12: Build & Commit
**File:** Repository
**Dependência:** Task 11 (Testing done)

**Descrição:** Build final, verificar bundle size, commit com mensagem PR3

**Build Process:**
```bash
npm run build  # Check bundle size
npm run preview  # Test production build
```

**Bundle Size Check:**
- [ ] Main bundle: <500KB gzip
- [ ] No chunk >200KB
- [ ] Portfolio component lazy loaded

**Commit Message:**
```
feat(pr3): Épico do Portfólio Visual - Refactoring + Charts

### Componentes Novos
- PortfolioContext: State management compartilhado
- PortfolioHeader: Cabeçalho com ações
- KpiCards: Métricas principais (3 cards)
- PortfolioSidebar: Lista de ativos
- ChartArea: Donut Chart (Recharts)
- ChartAreaEvolution: Line Chart histórico
- AssetTable: Tabela virtualized

### Optimizações
- Code splitting: Portfolio lazy loaded
- React.memo: Componentes puros
- useMemo: Cálculos otimizados
- Virtualization: 1000+ assets support

### Métricas
- Bundle: 849KB → 500KB (-340KB, -40%)
- Render: ~200ms → ~100ms (-50%)
- Performance Score: +40%

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Verificação:**
- ✓ Build successful
- ✓ No errors
- ✓ Bundle size OK

---

## 🧪 Testing Strategy

### Unit Tests (Future)
- [ ] KpiCards: Cálculos corretos
- [ ] ChartArea: Data transformation
- [ ] AssetTable: Sorting, filtering

### Integration Tests (Future)
- [ ] Portfolio → Firestore sync
- [ ] Charts update with new prices
- [ ] Asset add/edit/delete flow

### E2E Tests (Future)
- [ ] Full user workflow
- [ ] Performance benchmarks

---

## 📊 Acceptance Criteria

✅ **Functional:**
- [ ] Portfolio decomposto em 7 componentes reutilizáveis
- [ ] Donut Chart mostra alocação
- [ ] Line Chart mostra evolução (30/90/365D)
- [ ] Tabela virtual suporta 1000+ assets
- [ ] Sem regressions em funcionalidade

✅ **Performance:**
- [ ] Bundle: 849KB → <500KB gzip
- [ ] Portfolio render: <200ms
- [ ] Chart re-render: <100ms
- [ ] Memory stable (<50MB)

✅ **Code Quality:**
- [ ] Zero console errors
- [ ] React DevTools: <5% unnecessary re-renders
- [ ] TypeScript: 100% coverage
- [ ] Linting: 0 warnings

✅ **UX:**
- [ ] Charts responsive mobile
- [ ] Loading states smooth
- [ ] Interactions responsive (<100ms)
- [ ] Dark theme consistent

---

## 🚀 Execution Order

```
1. Task 1 (Context) ✓
   ├─ Task 2 (Header)
   ├─ Task 3 (KpiCards)
   ├─ Task 4 (Sidebar)
   └─ Task 5 (Donut Chart)
      └─ Task 6 (Line Chart)
         └─ Task 7 (AssetTable)
            └─ Task 8 (Refactor Main)
               └─ Task 9 (Code Splitting)
                  └─ Task 10 (Memoization)
                     └─ Task 11 (Testing)
                        └─ Task 12 (Build & Commit)
```

---

## 📦 Dependencies

**New Packages:**
- `react-window@^1.8.10` - Virtualization

**Existing:**
- `recharts@^3.7.0` - Already installed
- `react@^19.2.0` - Already installed
- `tailwindcss@^3.4.19` - Already installed

---

## 🔗 Related Files

- `/src/pages/Portfolio.jsx` - Main (será refactored)
- `/src/hooks/useWalletBalances.js` - TanStack Query hook
- `/src/hooks/useCryptoPrices.js` - Price fetching
- `/src/lib/firebase.js` - Firestore connection
- `/src/components/layout/DashboardLayout.jsx` - Parent layout

---

## 📝 Notes

- Manter compatibilidade com Firebase real-time updates
- Usar context ao invés de prop drilling
- Charts devem ser totalmente responsivos
- Performance é prioridade (90%+ lighthouse score)
- Manter dark theme consistente
- Documentar componentes com comentários JSDoc

---

**Status:** 🟡 Ready for Implementation
**Last Updated:** 24 Feb 2026
**Owner:** Mercurius Dev Team
