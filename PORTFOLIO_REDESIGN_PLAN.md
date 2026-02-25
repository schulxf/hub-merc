# 📊 Portfolio Page Redesign Plan

## Overview
The Portfolio page is the core of Mercurius. Redesigning it with the design system will make the biggest visual impact.

**Estimated Time:** 2-3 hours
**Complexity:** Medium-High
**Impact:** Very High (most visited page)

---

## 📋 Components to Redesign

### 1. PortfolioHeader ⭐⭐⭐
**Current:** Gray text, basic buttons
**Target:**
- Use `PageHeader` component from design system
- `DashboardPrimaryButton` for "Add Asset"
- Cyan accent on refresh button
- Better spacing and typography

**Changes:**
```javascript
// BEFORE
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">Portfólio</h1>
  <button className="bg-blue-600 text-white px-4 py-2">+ Novo Ativo</button>
</div>

// AFTER
<PageHeader
  title="Portfólio"
  subtitle="Visão consolidada dos seus ativos"
  action={<DashboardPrimaryButton>+ Novo Ativo</DashboardPrimaryButton>}
/>
```

---

### 2. KpiCards ⭐⭐⭐
**Current:** Hard-coded colors, inconsistent spacing
**Target:**
- Use `StatCard` component from design system
- Cyan glow on hover
- Consistent grid layout with design system spacing
- Better stat displays

**Changes:**
```javascript
// Use StatCard component
<StatCard
  label="Total Value"
  value="$42,567"
  unit="USD"
  change="+12.5%"
  changeType="positive"
/>
```

---

### 3. Warning/Alert Sections ⭐⭐
**Current:** Yellow/gray colors, basic borders
**Target:**
- Use `Alert` component from design system
- Cyan/orange/red variants for different states
- Better icon alignment
- Smooth animations

**Files:**
- Warning banner (line 217)
- SnapshotStatus component
- OpportunityBanner component

---

### 4. Charts (ChartArea, ChartAreaEvolution) ⭐⭐
**Current:** Gray backgrounds, basic borders
**Target:**
- Wrap in `DesignCard` component
- Cyan accents on hover
- Better typography for labels
- Consistent padding

**Changes:**
```javascript
// BEFORE
<div className="bg-[#111] border border-gray-800 rounded-xl">

// AFTER
<DesignCard interactive hoverGlow>
```

---

### 5. AssetTable ⭐⭐⭐
**Current:** Gray headers, inconsistent styling
**Target:**
- Use `DashboardIconButton` for edit/delete
- `DashboardTagButton` for status badges
- Consistent table styling
- Better hover effects

**Changes:**
- Header: `bg-bg-quaternary text-text-secondary`
- Rows: `hover:bg-bg-quaternary/30`
- Buttons: Replace with design system buttons
- Delete: Use `DashboardDangerButton`

---

### 6. On-Chain Tokens Section ⭐⭐
**Current:** Gray styling (line 247)
**Target:**
- Wrap in `DesignCard`
- Use `DashboardPrimaryButton` for "Add" actions
- Better table styling
- Cyan accent on important info

**Changes:**
```javascript
// BEFORE
<div className="bg-[#111] border border-gray-800">

// AFTER
<DesignCard interactive>
```

---

### 7. Modals (Add Asset, Edit, etc.) ⭐⭐
**Current:** Basic styling
**Target:**
- Use `Modal` component from design system
- `DashboardPrimaryButton` for submit
- `DashboardSecondaryButton` for cancel
- Consistent form styling

---

## 🎨 Color Replacements in Portfolio

```
bg-[#111] → bg-tertiary
bg-[#111111] → bg-tertiary
border-gray-800 → border-subtle
text-gray-400 → text-text-secondary
text-gray-500 → text-text-tertiary
text-white → text-text-primary
text-blue-400 → text-cyan
text-blue-600 → bg-cyan text-bg
bg-white/[0.02] → bg-white/[0.02] (keep as is)
text-yellow-200 → text-orange-300 (adjust if needed)
```

---

## 📦 Components to Import

```javascript
import {
  PageHeader,
  Section,
  DesignCard,
  Divider,
  Alert,
  StatCard,
  Modal,
} from '../ui/DesignSystemComponents';

import {
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardIconButton,
  DashboardTagButton,
  DashboardDangerButton,
} from '../ui/DashboardButtons';
```

---

## 🎯 Implementation Order

### Phase 1: Headers & Cards (30 min)
1. PortfolioHeader with PageHeader component
2. KpiCards with StatCard component
3. Warning banners with Alert component

### Phase 2: Main Content (45 min)
1. Charts wrapped in DesignCard
2. AssetTable with new buttons
3. On-Chain section styling

### Phase 3: Forms & Polish (30 min)
1. Modal styling
2. Button standardization
3. Final color pass
4. Animation tweaks

---

## 🔧 Key Files to Modify

1. **src/components/portfolio/PortfolioHeader.jsx**
   - Replace header styling
   - Update button components

2. **src/components/portfolio/KpiCards.jsx**
   - Use StatCard component
   - Grid layout with design system spacing

3. **src/components/portfolio/ChartArea.jsx**
   - Wrap in DesignCard
   - Update typography

4. **src/components/portfolio/ChartAreaEvolution.jsx**
   - Same as ChartArea

5. **src/components/portfolio/AssetTable.jsx**
   - Table styling
   - Button replacements
   - Hover effects

6. **src/pages/Portfolio.jsx**
   - Warning banner (line 217)
   - OnChain section (line 247)
   - Modal styling

---

## 📐 Spacing Reference

Use design system spacing variables:
```css
--space-4: 1rem      /* Padding inside cards */
--space-6: 1.5rem    /* Gap between sections */
--space-8: 2rem      /* Large gaps */
```

---

## 🧪 Testing Checklist

After redesign:
- [ ] All buttons are clickable and show loading state
- [ ] Hover effects work smoothly (GSAP)
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Tables are readable
- [ ] Modals have proper styling
- [ ] Responsive on mobile
- [ ] No console errors

---

## 📊 Expected Results

### Before
- Mixed colors (gray, blue, white)
- Inconsistent button styles
- Basic card styling
- No cohesive visual identity

### After
- Consistent design system colors
- Unified button components with magnetic effects
- Enhanced card styling with cyan glows
- Professional, polished appearance
- Smooth GSAP animations throughout

---

## ⏱️ Timeline

- **Start:** Now
- **Phase 1:** 30 minutes
- **Phase 2:** 45 minutes
- **Phase 3:** 30 minutes
- **Total:** ~2 hours
- **Buffer:** 30 minutes for polish/fixes

---

## 🚨 Potential Issues & Solutions

**Issue:** Components not re-rendering after color changes
**Solution:** Make sure to reimport design system CSS

**Issue:** GSAP animations not smooth
**Solution:** Check that gsap is imported in component files

**Issue:** Buttons look different on different pages
**Solution:** Use DashboardButtons consistently

**Issue:** Table looks squashed
**Solution:** Increase padding, check grid columns

---

**Status:** Ready to start implementation
**Next Action:** Begin Phase 1 (PortfolioHeader)

