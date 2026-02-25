# 🗺️ Mercurius Hub - Next Steps Roadmap

## Current Status
✅ Phase 9 Complete: Landing + Login Pages with Design System + React Router

---

## 🎨 **IMMEDIATE NEXT STEP: Design System Rollout**

### Dashboard Redesign (Priority 1)
Apply the design system aesthetic to entire dashboard:

**What to Update:**
1. **Portfolio Page** (`/dashboard/portfolio`)
   - Update card backgrounds to #0F1117
   - Apply cyan accent (#00FFEF) to active stats
   - Replace buttons with design system styling
   - Add GSAP entrance animations
   - Implement custom cursor on hover

2. **DeFi Tools Page** (`/dashboard/defi`)
   - Redesign swap widget with design system
   - Update calculator UI
   - Apply consistent spacing/typography

3. **Airdrop Hub Page** (`/dashboard/airdrops`)
   - Update airdrop cards
   - Apply hover animations
   - Consistent color palette

4. **AI Copilot Page** (`/dashboard/ai`)
   - Chat interface redesign
   - Message bubbles with design system colors
   - Animated response loading

5. **Admin Panel** (`/dashboard/admin`)
   - Table styling updates
   - Button consistency
   - Modal/form updates

6. **Sidebar & Navigation**
   - Design system colors
   - Smooth transitions
   - Custom cursor interactions

**Timeline:** 2-3 days
**Effort:** Medium (CSS updates + component tweaks)
**Impact:** High (unified visual identity across entire app)

---

## 🔐 **OPTIONAL ENHANCEMENTS (Pick 1-2)**

### 1. OAuth Integration
**Effort:** 1-2 days
**What:** Replace placeholder OAuth buttons with real auth

**Steps:**
```bash
npm install @react-oauth/google github-login-button
```

**Setup:**
- [ ] Google OAuth console setup (get Client ID)
- [ ] GitHub OAuth app creation
- [ ] Update Login.jsx with real handlers
- [ ] Add MetaMask wallet connect (optional)

**Files to modify:**
- `src/pages/Login.jsx` - Replace OAuth button handlers
- `.env.local` - Add OAuth credentials

**Benefits:**
- Faster signup (no password needed)
- Better UX (one-click login)
- Social proof (trusted providers)

---

### 2. Remember Me Feature (30-day Session)
**Effort:** 1 day
**What:** Auto-login users for 30 days

**Implementation:**
```javascript
// In Login.jsx
const handleRememberMe = (user) => {
  if (rememberMeChecked) {
    localStorage.setItem('mercurius_session', {
      uid: user.uid,
      email: user.email,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
};

// In App.jsx useEffect
useEffect(() => {
  const session = JSON.parse(localStorage.getItem('mercurius_session'));
  if (session && session.expiresAt > Date.now()) {
    // Auto-login user
  }
}, []);
```

**Files to modify:**
- `src/pages/Login.jsx` - Add remember me checkbox handler
- `src/App.jsx` - Add session restoration logic

**Benefits:**
- Better UX (no need to login every time)
- Increased engagement
- Session security with expiry

---

### 3. Password Recovery
**Effort:** 1-2 days
**What:** Email-based password reset

**Flow:**
1. User clicks "Forgot Password" on login
2. Enter email
3. Firebase sends reset link to email
4. User clicks link
5. New password form
6. Password updated

**Implementation:**
```javascript
// In Login.jsx
import { sendPasswordResetEmail } from 'firebase/auth';

const handleForgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    // Show success message
  } catch (err) {
    // Handle errors
  }
};
```

**Files to add:**
- `src/pages/ForgotPassword.jsx` (new)
- Update `src/pages/Login.jsx` - Add forgot password link

**Benefits:**
- Users can recover locked accounts
- Reduced support tickets
- Security best practice

---

### 4. Two-Factor Authentication (2FA)
**Effort:** 2-3 days
**What:** SMS or Authenticator app verification

**Options:**
- **SMS 2FA** (Firebase built-in)
  ```javascript
  import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
  ```

- **Authenticator App** (Google Authenticator, Authy)
  ```bash
  npm install speakeasy qrcode.react
  ```

**Flow:**
1. After password entry
2. User chooses SMS or Authenticator
3. Verify code sent
4. Login completes

**Files to modify:**
- `src/pages/Login.jsx` - Add 2FA flow
- `src/components/2FA/` (new folder)

**Benefits:**
- Enhanced security (especially for Pro/Assessor tiers)
- Compliance with security standards
- Protects user assets

---

## 🚀 **PHASE 7: Assessor Dashboard & Privacy Mode**

**Timeline:** 3-5 days
**Effort:** High

**Features:**
1. Assessor god-mode (view client portfolios)
2. Privacy toggle (hide monetary values)
3. Client portfolio comparison
4. Assessor analytics dashboard
5. Client tier management

**Files to create:**
- `src/pages/AssessorView.jsx` (enhanced)
- `src/components/assessor/ClientList.jsx`
- `src/components/assessor/PrivacyToggle.jsx`
- `src/hooks/useAssessorClients.js`

---

## 🤖 **PHASE 8: AI & Intent-Based Execution**

**Timeline:** 5-7 days
**Effort:** Very High

**Features:**
1. Cloud Functions backend (Node.js)
2. OpenAI GPT-4 integration
3. Vector database (Pinecone) for RAG
4. 1-Click swap execution
5. Intent parsing ("swap 50% of BTC to ETH")

**Architecture:**
```
Frontend (React)
    ↓
Cloud Functions (Node.js)
    ↓
OpenAI API (GPT-4)
    ↓
1inch API (Swap execution)
```

**Files to create:**
- `functions/aiCopilot/` (Cloud Functions)
- `functions/swapExecution/` (Cloud Functions)
- `src/pages/AiCopilot.jsx` (enhanced)

---

## 📊 **Decision Matrix: What to Do Next?**

| Option | Impact | Effort | User Value | Recommendation |
|--------|--------|--------|------------|-----------------|
| **Dashboard Redesign** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **DO NOW** ✅ |
| **OAuth Integration** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | **OPTIONAL** |
| **Remember Me** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | **OPTIONAL** |
| **Password Recovery** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | **OPTIONAL** |
| **2FA** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | **OPTIONAL** |
| **Phase 7** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **AFTER REDESIGN** |
| **Phase 8** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **FINAL** |

---

## ✅ **Recommended Implementation Order**

### Week 1
1. **Dashboard Redesign** (Priority 1)
   - Apply design system to all pages
   - Unified visual identity
   - ~2-3 days

2. **Pick ONE optional** (if time permits)
   - OAuth Integration (highest user value)
   - OR 2FA (highest security value)

### Week 2
3. **Phase 7 - Assessor Dashboard**
   - Implement god-mode viewing
   - Privacy toggle feature

### Week 3+
4. **Phase 8 - AI & Intent Execution**
   - Cloud Functions setup
   - OpenAI integration
   - Swap execution

---

## 🎯 **Quick Decision Guide**

**If you want MVP ready ASAP:**
1. Dashboard redesign (MUST DO)
2. Skip optionals
3. Move to Phase 7

**If you want premium features:**
1. Dashboard redesign
2. Add OAuth + 2FA (better UX + security)
3. Phase 7 + Phase 8

**If you want maximum security:**
1. Dashboard redesign
2. Add 2FA + Password Recovery
3. Phase 7 with privacy controls
4. Phase 8 with intent verification

---

## 📝 **Notes**

- **Design System** is already created in `src/pages/Landing.jsx` and `src/pages/Login.jsx`
- CSS variables can be extracted to separate file for reuse: `src/styles/design-system.css`
- GSAP animations library is ready to use (`npm list gsap`)
- React Router v6 is configured and working

---

## 🔗 **Related Files**

- Design System Reference: `/src/pages/Landing.jsx` (lines 1-100)
- Login Reference: `/src/pages/Login.jsx` (complete design system example)
- Dashboard Layout: `/src/components/layout/DashboardLayout.jsx`
- Testing Guide: `/LOGIN_TESTING_GUIDE.md`

---

**Last Updated:** February 2026
**Status:** Ready for Phase 1 (Dashboard Redesign)
