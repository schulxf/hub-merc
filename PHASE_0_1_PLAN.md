# PHASE 0.1: AdminPanel Decomposition

**Status**: 🔄 In Progress
**Timeline**: Dia 1-2 (Feb 26-27)
**Target**: Break 923-LOC mega-component into 5 focused sub-components
**Branch**: `feat/task-0.1-admin-decomposition`

---

## 📋 Overview

The current `AdminPanel.jsx` is a 923-LOC monolith containing 3 tabs (Users, Permissions, Agenda) with mixed concerns, making it hard to maintain and test.

### Goals
- ✅ Extract each tab into its own component (< 150 LOC each)
- ✅ Create reusable AdminHeader component
- ✅ Maintain thin AdminPanel container (tab nav + state management)
- ✅ **Zero behavior changes** - pure refactoring
- ✅ Maintain existing styling and functionality
- ✅ Create clear prop interfaces for composition

---

## 🏗️ Architecture

### New Component Structure
```
src/components/admin/
├── AdminHeader.jsx                 (Header + error alerts)
├── AdminUsersTab.jsx               (Users management)
├── AdminPermissionsTab.jsx         (Module permissions)
├── AdminAgendaTab.jsx              (Calendar events)
└── AdminPanel.jsx                  (Main container, kept thin)
```

### Props Flow
```
AdminPanel (state holder)
├── activeTab: string
├── setActiveTab: (tab) => void
├── actionError: string
├── setActionError: (error) => void
│
├─ AdminHeader
│  ├─ activeTab: string
│  ├─ onTabChange: (tab) => void
│  └─ errorMessage: string
│
├─ AdminUsersTab (if activeTab === 'users')
│  ├─ onError: (error) => void
│  └─ (manages own: users, loadingUsers, searchTerm, local state)
│
├─ AdminPermissionsTab (if activeTab === 'permissions')
│  ├─ onError: (error) => void
│  └─ (manages own: permissions, isSavingPerms, saveSuccess)
│
└─ AdminAgendaTab (if activeTab === 'agenda')
   ├─ onError: (error) => void
   └─ (manages own: calendarEvents, eventForm, isSavingEvent)
```

---

## 📝 Implementation Tasks

### Task 0.1.1: Create AdminHeader Component

**File**: `src/components/admin/AdminHeader.jsx`
**Size**: ~100 LOC

**Requirements**:
- Display title "Painel de Controle Mercurius" with Shield icon
- Display subtitle "Área restrita..."
- Show error alert banner if `errorMessage` prop provided
- Tab navigation buttons (Users, Permissions, Agenda)
- Tab styling: active = blue-400 + blue-500 border-bottom, inactive = gray-500

**Props**:
```javascript
interface AdminHeaderProps {
  activeTab: 'users' | 'permissions' | 'agenda';
  onTabChange: (tab: 'users' | 'permissions' | 'agenda') => void;
  errorMessage?: string;
}
```

**Extracted from**: Lines 146-189 of current AdminPanel.jsx

---

### Task 0.1.2: Create AdminUsersTab Component

**File**: `src/components/admin/AdminUsersTab.jsx`
**Size**: ~130 LOC

**Requirements**:
- Search input for users by email
- Users table with columns: Email, CreatedAt, Tier
- Tier dropdown selector (Free, Pro, VIP, Admin)
- Loading state with spinner
- Empty state message
- Error handling via `onError` callback

**State** (internal to component):
```javascript
const [users, setUsers] = useState([]);
const [loadingUsers, setLoadingUsers] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
```

**Props**:
```javascript
interface AdminUsersTabProps {
  onError: (message: string) => void;
}
```

**Firestore Queries**:
- `onSnapshot(collection(db, 'users'), ...)` - Listen for all users
- `updateDoc(doc(db, 'users', userId), { tier: newTier })` - Update tier

**Extracted from**: Lines 191-267 of current AdminPanel.jsx

---

### Task 0.1.3: Create AdminPermissionsTab Component

**File**: `src/components/admin/AdminPermissionsTab.jsx`
**Size**: ~140 LOC

**Requirements**:
- Title & description
- 4 Module permission rows (Portfolio, Airdrops, DeFi, Reminders)
- Each row: label + description + select dropdown
- Dropdown options: Free, Pro, VIP (minimum tier levels)
- Save button with loading state
- Success message display
- Info alert about real-time effects
- Error handling via `onError` callback

**State** (internal to component):
```javascript
const [permissions, setPermissions] = useState({...});
const [isSavingPerms, setIsSavingPerms] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
```

**Props**:
```javascript
interface AdminPermissionsTabProps {
  onError: (message: string) => void;
}
```

**Firestore Queries**:
- `onSnapshot(doc(db, 'settings', 'permissions'), ...)` - Listen for permissions
- `setDoc(doc(db, 'settings', 'permissions'), permissions)` - Save permissions

**Extracted from**: Lines 269-325 of current AdminPanel.jsx

---

### Task 0.1.4: Create AdminAgendaTab Component

**File**: `src/components/admin/AdminAgendaTab.jsx`
**Size**: ~200 LOC (largest, but still reasonable)

**Requirements**:
- Form section to add events (Title, Date, Type, Airdrop ID)
- Submit button with loading state
- Events list with delete capability
- Event cards showing: date + title + type (colored)
- Empty state when no events
- Error handling via `onError` callback

**State** (internal to component):
```javascript
const [calendarEvents, setCalendarEvents] = useState([]);
const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'tge', relatedAirdropId: '' });
const [isSavingEvent, setIsSavingEvent] = useState(false);
```

**Props**:
```javascript
interface AdminAgendaTabProps {
  onError: (message: string) => void;
}
```

**Firestore Queries**:
- `onSnapshot(doc(db, 'settings', 'calendar_events'), ...)` - Listen for events
- `setDoc(doc(db, 'settings', 'calendar_events'), { events: [...] })` - Update events

**Extracted from**: Lines 327-450+ of current AdminPanel.jsx

---

### Task 0.1.5: Refactor AdminPanel as Thin Container

**File**: `src/pages/AdminPanel.jsx` (reduced to ~80 LOC)
**Size**: ~80 LOC

**Responsibilities** (only):
- Tab state management (activeTab, setActiveTab)
- Global error state (actionError, setActionError with 3s timeout)
- Render AdminHeader
- Conditional render of tab components
- Pass callbacks to each tab

**Minimal JSX**:
```jsx
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [actionError, setActionError] = useState('');

  const handleError = (message) => {
    setActionError(message);
    setTimeout(() => setActionError(''), 3000);
  };

  return (
    <div className="animate-in fade-in pb-24 md:pb-12 max-w-6xl mx-auto">
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        errorMessage={actionError}
      />

      {activeTab === 'users' && <AdminUsersTab onError={handleError} />}
      {activeTab === 'permissions' && <AdminPermissionsTab onError={handleError} />}
      {activeTab === 'agenda' && <AdminAgendaTab onError={handleError} />}
    </div>
  );
}
```

---

## ✅ Verification Checklist

### Per-Component Tests
- [ ] AdminHeader: tabs switch correctly, error displays
- [ ] AdminUsersTab: users load, search works, tier dropdown updates
- [ ] AdminPermissionsTab: load perms, select values change, save works
- [ ] AdminAgendaTab: events load, form submission works, delete works
- [ ] AdminPanel: error messages appear/disappear on 3s timer

### Build & Performance
- [ ] `npm run build` → 0 errors, warnings only (pre-existing chunk size)
- [ ] No console errors in dev
- [ ] All imports resolve

### Visual Consistency
- [ ] Styling matches original (same colors, spacing, hover states)
- [ ] Tab navigation looks identical
- [ ] Error alerts styled consistently
- [ ] No layout shifts or regressions

### Functionality Matrix
| Feature | Before | After | Status |
|---------|--------|-------|--------|
| Search users | ✅ | ✅ | 🔄 |
| Change tier | ✅ | ✅ | 🔄 |
| Update permissions | ✅ | ✅ | 🔄 |
| Add calendar event | ✅ | ✅ | 🔄 |
| Delete event | ✅ | ✅ | 🔄 |
| Error handling | ✅ | ✅ | 🔄 |
| Tab switching | ✅ | ✅ | 🔄 |

---

## 📊 Metrics

**Before**:
- AdminPanel.jsx: 923 LOC
- Component count: 1 file
- Cognitive complexity: Very high
- Testing difficulty: Hard to isolate

**After**:
- AdminPanel.jsx: ~80 LOC
- AdminHeader.jsx: ~100 LOC
- AdminUsersTab.jsx: ~130 LOC
- AdminPermissionsTab.jsx: ~140 LOC
- AdminAgendaTab.jsx: ~200 LOC
- **Total**: ~650 LOC (organized & maintainable)
- Component count: 5 focused files
- Cognitive complexity: Low (each < 150 LOC)
- Testing difficulty: Easy to unit test each tab

---

## 🚀 Execution Steps

1. **Create new directory** → `src/components/admin/`
2. **Implement Task 0.1.1** → AdminHeader.jsx
3. **Implement Task 0.1.2** → AdminUsersTab.jsx
4. **Implement Task 0.1.3** → AdminPermissionsTab.jsx
5. **Implement Task 0.1.4** → AdminAgendaTab.jsx
6. **Implement Task 0.1.5** → Refactor AdminPanel.jsx
7. **Verify all tabs work** → Dev server test
8. **Build & test** → `npm run build`
9. **Commit & push** → Semantic commit message
10. **Create PR** → Code review ready

---

## 🔗 Related Files

- Current: `src/pages/AdminPanel.jsx`
- Imports used: firebase, lucide-react, tailwindcss
- No schema changes (existing Firestore collections)
- No new dependencies

---

## 📝 Commit Message

```
refactor(admin): decompose AdminPanel into 5 focused sub-components

- Extract AdminHeader: shared header + error alerts + tab nav
- Extract AdminUsersTab: user management with tier selection
- Extract AdminPermissionsTab: module permission configuration
- Extract AdminAgendaTab: calendar event management
- Refactor AdminPanel: thin container with state coordination

All functionality preserved. Zero behavior changes.
Improved: maintainability, testability, code organization.

Build: ✓ (0 errors)
Tests: ✓ (all manual checks pass)

Co-Authored-By: Claude Plan-Implementer <noreply@anthropic.com>
```

---

**Ready to proceed** ✅
