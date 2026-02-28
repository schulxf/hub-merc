# HubMercurius

## RBAC (Role-Based Access Control)

Access control uses the `tier` field stored directly in the Firestore `users/{uid}` document.
No Cloud Functions or Firebase Blaze plan is required.

- `tier: 'admin'` — full access, admin panel
- `tier: 'assessor'` — access to the assessor dashboard and assigned client data
- `tier: 'pro'` / `tier: 'vip'` — premium feature access
- `tier: 'free'` (default) — base access only

The `useAuthRole()` hook maps these tier values to a `role` string (`'admin'`, `'assessor'`, or `'user'`) for backwards compatibility with components that gate access by role.

If the project is upgraded to the Firebase Blaze plan in the future, Cloud Functions can be added to sync the `tier` field to Firebase Auth custom claims (`role`), enabling JWT-level access control without Firestore reads on every rule evaluation.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
