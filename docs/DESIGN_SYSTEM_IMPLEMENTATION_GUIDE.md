# 🎨 Design System Implementation Guide

## Overview
Applying the Mercurius design system across the entire dashboard (10+ pages).

**Status:** Starting Phase 1
**Estimated Duration:** 2-3 days
**Complexity:** Medium

---

## ✅ Prerequisites Completed

- [x] CSS variables extracted (`src/styles/design-system.css`)
- [x] Reusable components created (`src/components/ui/DesignSystemComponents.jsx`)
- [x] GSAP animations library installed
- [x] React Router configured
- [x] Landing + Login pages fully designed

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Today - 2-3 hours)
- [ ] Import design-system.css in main.jsx
- [ ] Implement custom cursor in App.jsx (global)
- [ ] Update Sidebar component
- [ ] Test navigation styling

### Phase 2: Core Pages (Day 1 - 4-5 hours)
- [ ] Portfolio page redesign
- [ ] DeFi Tools page redesign
- [ ] Airdrop Hub redesign
- [ ] Wallets page redesign

### Phase 3: Secondary Pages (Day 2 - 3-4 hours)
- [ ] AI Copilot redesign
- [ ] Admin Panel redesign
- [ ] Assessor Dashboard refinement
- [ ] Reminders page refinement

### Phase 4: Polish & Testing (Day 3 - 2-3 hours)
- [ ] Mobile responsiveness check
- [ ] Animation tweaking
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## 🚀 Implementation Order (Easy → Complex)

### Tier 1: Foundation (MUST DO FIRST)
1. **Sidebar** ⭐⭐ (1 hour)
   - Apply bg-secondary (#0B0D12)
   - Active states with cyan accent
   - Hover effects with transitions
   - Lock icons styling

2. **Buttons & Links** ⭐⭐ (30 min)
   - Replace all buttons with design system
   - Primary buttons: cyan background
   - Secondary buttons: bordered style
   - Magnetic effects on hover

### Tier 2: Core Pages (PRIORITY)
3. **Portfolio Dashboard** ⭐⭐⭐ (2 hours)
   - KPI cards with StatCard component
   - Charts area update
   - Table styling
   - Asset list redesign

4. **DeFi Tools** ⭐⭐⭐ (1.5 hours)
   - Swap widget styling
   - Calculator UI
   - Pool cards
   - Transaction history

5. **Airdrop Hub** ⭐⭐ (1 hour)
   - Airdrop cards
   - Filter buttons
   - Status badges
   - Detail view

### Tier 3: Secondary Pages
6. **Wallets Management** ⭐⭐ (1 hour)
   - Wallet cards
   - Add/remove buttons
   - Balance displays

7. **AI Copilot** ⭐⭐⭐ (1.5 hours)
   - Chat bubble styling
   - Input area
   - Message backgrounds
   - Loading states

8. **Admin Panel** ⭐⭐⭐ (2 hours)
   - Table styling
   - Form inputs
   - Modal dialogs
   - Permission toggles

### Tier 4: Polish
9. **Assessor Dashboard** ⭐⭐ (1 hour)
   - Client list styling
   - Privacy toggle integration
   - Stats display

10. **Reminders Page** ⭐ (30 min)
    - List styling
    - Checkbox design
    - Delete button styling

---

## 🔧 Step-by-Step Implementation

### Step 1: Import Design System CSS

**File:** `src/main.jsx`

```javascript
import './styles/design-system.css'  // Add this import
import './index.css'
```

### Step 2: Add Global Custom Cursor

**File:** `src/App.jsx`

Add this inside the App component (after Router):

```javascript
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function App() {
  const curRef = useRef(null);
  const curRRef = useRef(null);

  useEffect(() => {
    // Custom cursor implementation
    const cursor = curRef.current;
    const cursorRing = curRRef.current;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      gsap.to(cursor, {
        left: mouseX,
        top: mouseY,
        duration: 0,
      });

      gsap.to(cursorRing, {
        left: mouseX,
        top: mouseY,
        duration: 0.1,
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AppContent />
          </Router>
        </QueryClientProvider>
      </GlobalErrorBoundary>

      {/* Custom Cursor */}
      <div
        ref={curRef}
        className="fixed w-1 h-1 bg-cyan rounded-full pointer-events-none z-[9998]"
        style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
      />
      <div
        ref={curRRef}
        className="fixed w-7 h-7 border-2 border-cyan rounded-full pointer-events-none z-[9998]"
        style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
}
```

### Step 3: Redesign Sidebar

**File:** `src/components/layout/Sidebar.jsx`

Replace styled elements with design system classes:

```javascript
// BEFORE
<div className="bg-[#0B0D12] border-r border-gray-800">

// AFTER
<div className="bg-secondary border-r border-subtle">
```

Common replacements:
```javascript
// Colors
'bg-[#07090C]'      → 'bg-primary'
'bg-[#0B0D12]'      → 'bg-secondary'
'bg-[#0F1117]'      → 'bg-tertiary'
'text-blue-500'     → 'text-blue'
'border-gray-800'   → 'border-subtle'

// Transitions
'transition-colors' → 'transition-fast'
'transition-all'    → 'transition-normal'

// Typography
Use var(--font-display), var(--font-ui), var(--font-mono)
```

### Step 4: Update Page Components

**Pattern for each page:**

```javascript
import {
  PageHeader,
  Section,
  DesignCard,
  PrimaryButton,
  StatCard,
  Divider,
} from '../ui/DesignSystemComponents';

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfólio"
        subtitle="Sua visão on-chain"
        action={<PrimaryButton>Novo Ativo</PrimaryButton>}
      />

      <Section title="Resumo">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Value"
            value="$42,567"
            unit="USD"
            change="+12.5%"
            changeType="positive"
          />
          {/* More stats */}
        </div>
      </Section>

      <Section title="Ativos">
        <DesignCard>
          {/* Content */}
        </DesignCard>
      </Section>
    </div>
  );
}
```

---

## 🎨 Color Replacement Guide

### Quick Find & Replace

Use your editor's find and replace:

```
Find: text-gray-400
Replace: text-text-secondary

Find: bg-\[#111\]
Replace: bg-tertiary

Find: border-gray-800
Replace: border-subtle

Find: hover:bg-gray-800
Replace: hover:bg-quaternary

Find: text-blue-500
Replace: text-cyan

Find: shadow-lg
Replace: shadow-md-glow
```

---

## ✨ Animation Patterns

### Entrance Animation
```javascript
<div className="animate-fade-in">
  {/* Content */}
</div>
```

### Hover Effects with GSAP
```javascript
useEffect(() => {
  const element = ref.current;

  element.addEventListener('mousemove', (e) => {
    gsap.to(element, {
      x: (e.clientX - rect.left - rect.width/2) * 0.1,
      y: (e.clientY - rect.top - rect.height/2) * 0.1,
      duration: 0.3
    });
  });
}, []);
```

### Loading States
```javascript
<div className="animate-pulse-subtle">
  {/* Skeleton or loading content */}
</div>
```

---

## 📱 Responsive Design

The design system uses `clamp()` for responsive typography:

```css
/* Automatically scales based on viewport */
--text-2xl: clamp(1.4rem, 2.2vw, 1.5rem);
```

No media queries needed for text sizes!

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Colors match design system
- [ ] Typography is consistent
- [ ] Spacing is even
- [ ] Borders and shadows are correct

### Interactive Testing
- [ ] Buttons respond to hover (cyan glow)
- [ ] Custom cursor shows
- [ ] Animations are smooth
- [ ] No console errors

### Responsive Testing
- [ ] Mobile: 375px width
- [ ] Tablet: 768px width
- [ ] Desktop: 1024px width
- [ ] Extra large: 1536px width

### Performance Testing
- [ ] Build size didn't increase significantly
- [ ] No layout shifts
- [ ] Animations 60fps (Chrome DevTools)
- [ ] Load time < 3s

---

## 🐛 Common Issues & Solutions

### Issue: CSS Variables Not Working
**Solution:** Ensure `design-system.css` is imported in `main.jsx` BEFORE other styles

### Issue: Colors Look Different
**Solution:** Check Tailwind isn't overriding with higher specificity
```css
/* Add !important if needed */
.my-element {
  color: var(--color-cyan) !important;
}
```

### Issue: Custom Cursor Not Showing
**Solution:** Set `cursor: none` on the element
```javascript
<div style={{ cursor: 'none' }}>
  {/* Content */}
</div>
```

### Issue: GSAP Animations Stuttering
**Solution:** Use `gsap.ticker` for consistent RAF
```javascript
gsap.ticker.add((time) => {
  // Animation logic
});
```

---

## 🔄 Rollback Plan

If something breaks:

1. **Revert last file:** `git checkout -- src/components/...`
2. **Check imports:** Ensure design-system.css is imported
3. **Clear cache:** `npm run build && npm run dev`
4. **Check console:** Look for CSS variable errors

---

## 📊 Progress Tracking

Track progress as you implement:

```
Tier 1 (Foundation):
├─ Sidebar: ████░░░░░░ 40%
└─ Buttons: ████████░░ 80%

Tier 2 (Core Pages):
├─ Portfolio: ░░░░░░░░░░ 0%
├─ DeFi: ░░░░░░░░░░ 0%
└─ Airdrop: ░░░░░░░░░░ 0%

Tier 3 (Secondary):
├─ AI Copilot: ░░░░░░░░░░ 0%
└─ Admin: ░░░░░░░░░░ 0%

Overall: 0%
```

---

## 🎯 Next Actions

1. **Today:**
   - [ ] Import design-system.css
   - [ ] Add global custom cursor
   - [ ] Redesign Sidebar

2. **Tomorrow:**
   - [ ] Portfolio page
   - [ ] DeFi Tools page
   - [ ] Airdrop Hub

3. **After Tomorrow:**
   - [ ] Remaining pages
   - [ ] Polish & testing
   - [ ] Deploy

---

## 📝 Files Created/Modified

### New Files
- `src/styles/design-system.css` ✅
- `src/components/ui/DesignSystemComponents.jsx` ✅
- `DESIGN_SYSTEM_IMPLEMENTATION_GUIDE.md` ✅

### Files to Modify
- `src/main.jsx` (import CSS)
- `src/App.jsx` (global cursor)
- `src/components/layout/Sidebar.jsx` (colors/spacing)
- `src/pages/Portfolio.jsx` (use new components)
- `src/pages/DeFiToolsLanding.jsx` (styling)
- `src/pages/AirdropHub.jsx` (cards)
- ... and more

---

## ❓ FAQ

**Q: Do I need to rewrite all components?**
A: No! Just replace Tailwind classes with design system variables and components.

**Q: Will this break existing functionality?**
A: No! We're only changing styling, not logic.

**Q: Can I use both old and new styles?**
A: Yes, but aim for consistency. Gradual migration is fine.

**Q: How long per page?**
A: 30 min to 2 hours depending on complexity.

**Q: Any performance concerns?**
A: CSS variables are optimized. GSAP is already used in Landing/Login.

---

**Status:** Ready to start Phase 1! 🚀

Start with the Sidebar, then move to core pages.
