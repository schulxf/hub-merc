# 🔒 Security Policy - HubMercurius

**Last Updated**: Feb 25, 2026 (PHASE 0.4)
**Status**: Production-ready for MVP

---

## 📋 Security Architecture

### Authentication
- **Provider**: Firebase Authentication
- **Methods**: Email/Password, OAuth (Google), Anonymous
- **Current**: Email/Password only (MVP phase)
- **Future**: Google OAuth integration (Phase 2)

### Authorization (RBAC)
- **Model**: Role-Based Access Control via Firestore `tier` field
- **Roles**:
  - `free` - Free users (limited features)
  - `pro` - Premium users (standard features)
  - `vip` - VIP users (consultoria + all features)
  - `admin` - Platform admins (full access)
  - `assessor` - Financial advisors (client-scoped read-only)

- **Enforcement**: Firestore security rules (client-side verification via rule functions)
- **Future**: JWT-based RBAC via Cloud Functions custom claims (Phase 8+, Blaze plan)

---

## 🔐 Firestore Security Rules

### Collection Access Matrix

```
/users/{uid}
├─ READ:  owner | admin | assigned_assessor
├─ WRITE: owner (self only) | admin (tier changes only)
└─ ROLE:  Tier field is validated enum (no privilege escalation)

/users/{uid}/{subcollection=**}  (portfolio, defi, wallets, transactions, snapshots)
├─ READ:  owner | admin | assigned_assessor (read-only)
├─ WRITE: owner only
└─ ROLE:  Subcollection isolation per user

/airdrops/{document=**}
├─ READ:  any signed-in user
├─ WRITE: admin only
└─ ROLE:  CMS content, public read

/settings/{document=**}  (permissions, calendar_events, feature_flags)
├─ READ:  any signed-in user
├─ WRITE: admin only
└─ ROLE:  Global config, client-side enforcement of feature availability

/public_content/{document=**}
├─ READ:  any signed-in user
├─ WRITE: admin only
└─ ROLE:  Announcements and shared content

/{catch-all}
├─ READ:  DENIED
├─ WRITE: DENIED
└─ ROLE:  Default-deny; all other paths blocked
```

### Future Collections (Phase 3+)

These collections will be implemented when features launch:
- `/strategies/{strategyId}` - assessor-created, client-readable
- `/model_portfolios/{modelId}` - admin/assessor CMS
- `/research/{researchId}` - admin/assessor CMS
- `/recommendations/{recommendationId}` - assessor writes, client reads

Until implemented, they fall through to the default-deny catch-all (safe).

---

## 🛡️ Security Guardrails

### 1. Tier Validation (Enum-based)
```javascript
// Admin can only set tier to known values (no escalation)
allow update: if isAdmin()
  && request.resource.data.tier in ['free', 'pro', 'vip', 'admin', 'assessor']
```

### 2. User Isolation
- Users can only read/write their own subcollections
- Assessors can read assigned clients (via assessorIds array)
- Admins can read all users (audit/support)

### 3. Assessor Assignment
- Assessor access requires:
  1. User is authenticated with `tier == 'assessor'`
  2. User's UID is in client's `assessorIds[]` array
  3. Access is read-only (no write permissions)

### 4. Admin-Only Mutations
- Tier changes only by admin (prevents privilege escalation)
- Settings mutations only by admin (feature flags, calendar)
- Airdrop CMS mutations only by admin (content management)

### 5. Default Deny
- All unlisted paths are blocked (fail-secure)
- New collections must have explicit rules before use

---

## 🔄 Data Flow & Validation

### Client-to-Server
```
User Input
    ↓
[Client-side validation with Zod schemas]
    ↓
[Firebase Authentication check]
    ↓
Firestore Security Rules
    ↓
[Server-side Zod validation via Cloud Functions (future)]
    ↓
Firestore Database
```

### Server-to-Client
```
Firestore Query
    ↓
[Firestore Security Rules check]
    ↓
[Returns only authorized documents]
    ↓
Client receives data
    ↓
[Client-side Zod validation]
    ↓
Component renders
```

---

## 📝 Validation Layers

### Layer 1: Client-Side (Zod Schemas)
**Purpose**: User experience, early error detection
- File: `/src/lib/validation.js`
- Schemas: `/src/schemas/*.schema.js` (5 main schemas)
- Pattern: `safeValidate*()` for soft errors, `validate*()` for strict

**Schemas**:
- `portfolioAsset.schema.js` - Portfolio entry validation
- `defiPosition.schema.js` - DeFi position validation
- `modelPortfolio.schema.js` - Model portfolio validation
- `research.schema.js` - Research document validation
- `strategy.schema.js` - Strategy validation

### Layer 2: Firestore Rules (Authentication & Authorization)
**Purpose**: Enforce access control at database level
- File: `/firestore.rules`
- Validation: Enum-based tier checking, UID matching

### Layer 3: Backend Cloud Functions (Future - Phase 8+)
**Purpose**: Server-side validation, audit logging
- Will add Zod validation to Cloud Functions
- Will sync tier changes to Firebase Auth custom claims
- Will log sensitive operations for audit trail

---

## 🚨 Known Issues & Mitigations

### Issue 1: Tier Validation in Rules Function
**Problem**: Initial implementation had unused `getUserTier()` helper that violated Firebase rules linter
**Resolution**: Removed unused function; embedded tier check directly in `isAdmin()` / `isAssessor()`
**Status**: ✅ Resolved in PHASE 0.4

### Issue 2: No Server-Side Validation (MVP)
**Problem**: Cloud Functions not yet implemented; only client-side + Firestore rules
**Risk**: Low (rules provide access control; client-side validation is UX-only)
**Mitigation**: Add Cloud Functions validation in Phase 8+ (Blaze plan upgrade)

### Issue 3: No JWT Custom Claims (MVP)
**Problem**: Every Firestore rule requires a `get()` call to check tier
**Impact**: Higher latency + higher read cost
**Mitigation**: Will upgrade to custom claims in Phase 8+ (Blaze plan)

### Issue 4: Assessor Access (MVP)
**Problem**: `assessorIds` array must be manually maintained
**Risk**: Low (admin-only operation, well-controlled)
**Mitigation**: UI for managing assessor assignments (TASK 7 - Admin Dashboard)

---

## 🔍 Audit Checklist

- [x] User document isolation: users can only read/write their own data
- [x] Assessor read-only access: assessors can read assigned clients (not write)
- [x] Admin-only CMS: airdrops, settings mutations blocked to non-admins
- [x] Tier validation: enum-based to prevent privilege escalation
- [x] Default deny: all unlisted paths blocked
- [x] Zod schema validation: 5 schemas with 34 test cases
- [x] Client-side validation: `safeValidate*()` helpers for UI error handling
- [x] Helper functions: `isSignedIn()`, `isOwner()`, `isAdmin()`, `isAssessor()`, `isAssessorForClient()`
- [x] Documentation: inline comments + detailed access matrix
- [x] Test coverage: schemas tested (34 tests), rules logic verified

---

## 📊 Security Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Unauthenticated access | BLOCKED | ✅ |
| Default-deny coverage | 100% | ✅ |
| Tier enum validation | 5 roles | ✅ |
| Zod schema tests | 34/34 passing | ✅ |
| Client validation functions | 8 helpers | ✅ |
| Future collections | 4 planned | ⏳ |
| Cloud Functions validation | Not yet implemented | ⏳ Phase 8+ |
| JWT custom claims | Not yet implemented | ⏳ Phase 8+ |

---

## 🚀 Deployment Checklist

- [x] Firestore rules syntax validated
- [x] Security audit documented
- [x] Role-based access matrix defined
- [x] Zod validation helpers implemented
- [x] Test coverage verified (34/34 passing)
- [x] Known issues documented + mitigated
- [x] Future enhancements roadmapped
- [ ] Staging environment testing (pre-deployment)
- [ ] Production deployment (when ready)

---

## 📚 Related Files

- **Firestore Rules**: `/firestore.rules` (193 lines)
- **Validation Helpers**: `/src/lib/validation.js` (170 lines)
- **Schema Definitions**: `/src/schemas/` (5 main schemas)
- **Schema Tests**: `/src/schemas/__tests__/schemas.test.js` (300 lines, 34 tests)
- **Reducer Tests**: `/src/pages/__tests__/portfolioReducer.test.js` (243 lines, 19 tests)

---

## 🔮 Future Enhancements

### Phase 8+ (Blaze Plan Required)
1. **Cloud Functions Validation**
   - Server-side Zod validation for all mutations
   - Audit logging for sensitive operations
   - Rate limiting per user/IP

2. **JWT Custom Claims**
   - Sync tier changes to Firebase Auth tokens
   - Remove `get()` calls from rule functions
   - Reduce latency & read costs

3. **Advanced RBAC**
   - Granular permissions per collection/document
   - Temporary role elevation (with expiry)
   - Audit trails for all role changes

4. **Data Encryption**
   - Client-side encryption for sensitive data
   - End-to-end encryption for advisor notes
   - Key management system

---

## 📞 Contact

- **Security Issues**: security@hubmercurius.com (implement when deployed)
- **Questions**: DevOps team
- **Escalations**: CTO

---

**Classification**: Internal Use - Security Sensitive
