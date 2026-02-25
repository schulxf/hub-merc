# 🚀 COMECE AQUI - HubMercurius Roadmap
**Guia de Execução Rápida | Feb 25, 2026**

---

## 📚 Documentação Criada

| Documento | Propósito | Abra |
|-----------|-----------|------|
| **ROADMAP_ADAPTADO.md** | Análise estratégica + 8 features detalhadas | [Abrir](./ROADMAP_ADAPTADO.md) |
| **EXECUTION_PLAN.md** | Plano de execução com phases + tasks + timelines | [Abrir](./EXECUTION_PLAN.md) |
| **ROADMAP-TIMELINE.html** | Timeline visual interativo (4 phases) | [Abrir](./ROADMAP-TIMELINE.html) |
| **CODEBASE_HEALTH.md** | Auditoria do código (débito técnico) | [Veja abaixo](#auditoria-codebase) |

---

## 🎯 RESUMO EXECUTIVO

### O Que Vai Ser Feito
✅ **8 Features em 4 Phases, 25 dias reais**

```
PHASE 0 (Sem 1): PRÉ-IMPLEMENTAÇÃO
├─ Refactor AdminPanel/Portfolio (débito técnico)
├─ Zod validation + Firestore audit
└─ Jest setup (10% target coverage)

PHASE 1 (Sem 1-2): CRÍTICAS (P0)
├─ TASK 1: Homepage - "Centro de Comando"
└─ TASK 2: Portfolio com 3 abas

PHASE 2 (Sem 2-3): ADMIN CMS (BLOCKER)
└─ TASK 8: Research + DeFi + Model Portfolios CMS

PHASE 3 (Sem 3-4): HUBS
├─ TASK 4: Research Hub (Medium-style)
└─ TASK 5: DeFi Strategies Hub

PHASE 4 (Sem 4-5): REDESIGNS
├─ TASK 3: Model Portfolios + Magic Comparador
├─ TASK 6: DeFi Positions (DeBank-style)
└─ TASK 7: Assessor Dashboard
```

### Impacto no Negócio
- 🏠 **Homepage**: +50% perceived value (tudo em 1 lugar)
- 📊 **Portfolio Tabs**: Organização profissional vs. mistura atual
- 🎯 **Model Portfolios**: Diferencial vs. concorrentes (Mercurius vende isso)
- 📰 **Research Hub**: Retenção de usuários (padrão Medium)
- ⚡ **DeFi UI**: Profissional como DeBank/Zapper
- 👔 **Assessor Dashboard**: Ferramentas para consultoria B2B

---

## ⚠️ AUDITORIA CODEBASE

### Saúde Atual: 🟡 MÉDIO (com débito técnico)

**Débito Crítico**:
1. ❌ **Mega-componentes** (AdminPanel 923 LOC, Portfolio 820 LOC)
2. ❌ **Testing negligenciado** (~2% coverage em app financeiro)
3. ❌ **State management caótico** (10+ useState em Portfolio)
4. ⚠️ **localStorage inseguro** (sem encriptação)
5. ⚠️ **TypeScript faltando** (Zod existe mas underutilizado)

**Bom**:
- ✅ Design System centralizado
- ✅ Context API bem estruturada
- ✅ Firebase configurado corretamente
- ✅ React Router lazy loading
- ✅ Permissões dinâmicas por tier

**Recomendação**: PHASE 0 crítica (refactorações antes de features novas)

---

## 🎬 COMO COMEÇAR (AGORA)

### Passo 1: Leia os Documentos (30 min)
```bash
# Terminal
open ROADMAP-TIMELINE.html  # Timeline visual (10 min)
open ROADMAP_ADAPTADO.md    # Análise (10 min)
open EXECUTION_PLAN.md      # Plano (10 min)
```

### Passo 2: Aprovação CTO (Decisão)
**Checklist de Aprovação**:
- [ ] Entende as 4 phases?
- [ ] Concorda com priorização (P0 vs P1)?
- [ ] Timeline de 25 dias é realista?
- [ ] Features entregam valor?
- [ ] PHASE 0 (refactorações) está justificada?

### Passo 3: Prepare o Environment (1 dia)
```bash
# Setup local
git checkout -b roadmap/phase-0-preparation
npm install

# Firestore collections
# - research_articles (novo)
# - defi_strategies (novo)
# - model_portfolios (novo)
# - recommendations (novo)

# Seed data
firebase shell  # seed 5 articles + 3 strategies + 2 carteiras

# Testing
npm run test  # verificar setup Jest
npm run test:coverage  # baseline ~2%
```

### Passo 4: Kick-Off PHASE 0 (Semana 1)
**Dia 1-2: Task 0.1 - AdminPanel Decomposition**
```bash
git checkout -b feat/task-0.1-admin-decomposition

# Quebrar AdminPanel.jsx (923 LOC) em 5 componentes
# - AdminUsersTab.jsx
# - AdminPermissionsTab.jsx
# - AdminAirdropsTab.jsx
# - AdminAgendaTab.jsx
# - AdminContentTab.jsx (NEW)

npm run build  # Zero errors
npm run test   # Pass
git commit -m "refactor(admin): decompose AdminPanel into 5 sub-components"
git push origin feat/task-0.1-admin-decomposition
# → Create PR for review
```

---

## 🔨 COMO EXECUTAR PERFEITO

### Usando Skills (Recomendado)

**Por cada Task:**
```bash
# 1. Planejamento
claude-code /feature-planning -task "TASK 1: Homepage"
# → Gera sub-tasks ultra-específicas

# 2. Implementação
claude-code /plan-implementer -task "TASK 1.1: Create Dashboard.jsx"
# → Implementa automaticamente com testes

# 3. Review
claude-code /code-review -pr "PR#123"
# → Audita qualidade + security

# 4. Commit
claude-code /engineering-workflow-skills:git-pushing
# → Commits semânticos + push automático
```

### Workflow Git

```bash
# Por task
git checkout -b feat/task-N-description
# ... code
npm run build && npm run test
git add . && git commit -m "feat(feature): description"
git push origin feat/task-N-description
# Create PR → Merge

# Sprint review
git tag sprint-1-complete
git push origin --tags
```

### Quality Gates (Cada Sprint)

- [ ] **Build**: `npm run build` → Zero errors
- [ ] **Tests**: `npm run test` → Sem failures
- [ ] **Coverage**: `npm run test:coverage` → +10% (comparado ao sprint anterior)
- [ ] **Lighthouse**: Score > 80 (mobile)
- [ ] **Visual**: Screenshots 3 resoluções
- [ ] **Firestore**: Security rules validadas
- [ ] **PR Review**: 2+ approvals

---

## 📊 PARALLELIZAÇÃO (Como Acelerar)

**Semana 1**:
```
Dev A: Phase 0 (Refactorações)  ← Blocker crítica
Dev B: Task 1 (Homepage)        ← Can start in parallel
Dev C: Preparar Firestore       ← Independente
```

**Semana 2**:
```
Dev A: Task 2 (Portfolio Tabs)
Dev B: Task 8 Init (CMS setup)
Dev C: Testing base
```

**Semana 3+**: Tasks 3,4,5,6,7 em paralelo (menos dependências)

---

## 🚨 BLOQUEADORES & RISCOS

### Críticos (Resolver antes de começar)
- ⚠️ Markdown editor: Usar `react-markdown` simples (NÃO Tiptap)
- ⚠️ Cloudinary: Já está configurado?
- ⚠️ Firestore transaction schema: Criar antes de Task 2

### Médios (Monitor durante execução)
- 📌 Performance Homepage (múltiplas queries)
- 📌 Testing coverage baixa (requer disciplina)
- 📌 UI consistency nos 8 componentes novos

### Escalations
Se bloqueado > 2h → Notify CTO imediatamente

---

## ✅ CHECKLIST DE APROVAÇÃO FINAL

Antes de começar PHASE 0, CTO confirma:

- [ ] Entende o roadmap estratégico?
- [ ] Concorda com 4 phases + 8 features?
- [ ] Timeline 25 dias é realista?
- [ ] Budget/recursos disponível?
- [ ] Team alinhado (design, product, eng)?
- [ ] Firestore collections podem ser criadas?
- [ ] Feature flags podem ser modificadas?
- [ ] Deploy para produção está pronto?

---

## 📞 PRÓXIMAS AÇÕES

### IMEDIATO (Hoje)
1. ✅ Leia os 3 documentos
2. ✅ Responda checklist de aprovação
3. ✅ Decida: Go ou Not-Go

### DIA 1 (Se Go)
1. ✅ Kickoff PHASE 0
2. ✅ Setup Firestore collections
3. ✅ Criar branches Git

### SEMANA 1
1. ✅ Tasks 0.1 - 0.5 (Refactorações)
2. ✅ Task 1 Begin (Homepage)
3. ✅ Daily standup (status)

---

## 🎓 NOTAS FINAIS

### Filosofia
> **"UX/Arquitetura > Complexidade Técnica"**

Não estamos adicionando Cloud Functions pesadas ou integração de wallets complexas. Estamos focando em **percepção de valor** (design) + **arquitetura da informação** (organização).

### Métricas de Sucesso
- ✅ 8 Features implementadas no prazo
- ✅ Test coverage ≥ 20%
- ✅ Lighthouse score ≥ 80 (mobile)
- ✅ Zero breaking changes
- ✅ Pronto para produção

### Risk Mitigation
- ✅ Phase 0 reduz débito técnico
- ✅ Schemas Zod previnem bugs
- ✅ Security rules auditadas
- ✅ Testing base estabelecida
- ✅ CI/CD simples e confiável

---

**Status**: 🟢 **PRONTO PARA GO**

**Próximo Passo**: CTO aprova checklist + Team começa PHASE 0

**Documento Criado**: Feb 25, 2026
**Validade**: 4 semanas (até completion)
