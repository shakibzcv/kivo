<div align="center">

<img src="./assets/logo.svg" alt="Kivo Logo" width="120" />

# Kivo

**A high-performance modern monorepo powering web, desktop, mobile, documentation, and backend API services.**

[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-000000?logo=turborepo&logoColor=white)](https://turborepo.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Electron](https://img.shields.io/badge/Electron-30.x-47848F?logo=electron&logoColor=white)](https://electronjs.org)
[![Expo](https://img.shields.io/badge/Expo-57.x-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

## 📌 Overview

**Kivo** is an enterprise-grade fullstack ecosystem engineered with **Turborepo** and **pnpm workspaces**. It brings together web applications, native desktop applications, cross-platform mobile apps, shared UI design systems, and modular backend API services (with PostgreSQL pooling, Google GenAI Gemini, and S3 object storage) in a unified, type-safe repository.

---

## 🏗️ Monorepo Architecture

```
kivo/
├── apps/
│   ├── web/               # Next.js 16 Web Application with Tailwind CSS v4 & Lucide (Port 3000)
│   ├── desktop/           # Electron 30 + Vite + React 19 Desktop Client
│   ├── mobile/            # Expo SDK 57 & React Native Mobile App (iOS / Android / Web)
│   └── api/               # Express 5 + PostgreSQL (pg) + Gemini AI + S3 Storage + Google OAuth (Port 5000)
├── packages/
│   ├── ui/                # Shared 60+ shadcn UI Component Library (@repo/ui)
│   ├── typescript-config/ # Monorepo TypeScript presets (@repo/typescript-config)
│   └── eslint-config/     # Monorepo ESLint presets (@repo/eslint-config)
├── assets/                # Official brand identity & vector assets
├── .github/               # Issue templates, PR template & automated CI workflows
└── .vscode/               # Recommended workspace settings & extensions
```

---

## 🚀 Applications & Packages

### 📱 Applications

| Application   | Technology Stack                                                                      | Description                                                                      | Dev Command                  | Port / Output           |
| :------------ | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------- | :--------------------------- | :---------------------- |
| **`web`**     | Next.js 16 (App Router), React 19, Tailwind CSS v4                                    | High-performance responsive web client                                           | `pnpm --filter web dev`      | `http://localhost:3000` |
| **`desktop`** | Electron 30, Vite 5, React 19, Tailwind CSS v4                                        | Native cross-platform desktop application                                        | `pnpm --filter desktop dev`  | Electron Desktop Window |
| **`mobile`**  | Expo SDK 57, React Native 0.86, Expo Router                                           | Cross-platform mobile app (iOS, Android, Web)                                    | `pnpm --filter mobile start` | Expo Metro Bundler      |
| **`api`**     | Express 5, PostgreSQL (`pg`), Google GenAI (`@google/genai`), AWS S3 SDK, Passport.js | REST API service with database pooling, Gemini AI text/streaming, and S3 storage | `pnpm --filter api dev`      | `http://localhost:5000` |

### 📦 Shared Packages

- **`@repo/ui`**: Centralized component library featuring 60+ shadcn UI components built with OKLCH theme tokens, accessible primitives, and Tailwind CSS v4 compatibility.
- **`@repo/typescript-config`**: Centralized TypeScript configurations (`base.json`, `nextjs.json`, `react-library.json`).
- **`@repo/eslint-config`**: Shared ESLint rules (`base`, `next-js`, `react-internal`).

---

## 🛠️ Prerequisites

Ensure the following tools are installed on your environment:

- **Node.js**: `>= 24.0.0`
- **pnpm**: `>= 11.0.0` (Enable via `corepack enable pnpm` or install globally via `npm install -g pnpm`)

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shakibzcv/kivo.git
cd kivo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start development servers

Run all applications and services in parallel:

```bash
pnpm dev
```

Or target individual applications:

```bash
# Start Web client
pnpm --filter web dev

# Start Desktop client
pnpm --filter desktop dev

# Start Mobile app
pnpm --filter mobile start

# Start Backend API
pnpm --filter api dev
```

---

## 📜 Available Scripts

| Script                 | Command                               | Description                                         |
| :--------------------- | :------------------------------------ | :-------------------------------------------------- |
| **`pnpm dev`**         | `turbo run dev`                       | Start development servers across all workspaces     |
| **`pnpm build`**       | `turbo run build`                     | Build all apps and packages with dependency caching |
| **`pnpm lint`**        | `turbo run lint`                      | Run ESLint across all projects                      |
| **`pnpm check-types`** | `turbo run check-types`               | Run static TypeScript type checks                   |
| **`pnpm format`**      | `prettier --write "**/*.{ts,tsx,md}"` | Format source code and documentation                |

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes using conventional commit messages (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request using our [PR Template](.github/pull_request_template.md).

---

## 📬 Contact & Support

For questions, collaborations, feature proposals, or security inquiries:

- **Author**: Shakib Khan
- **GitHub**: [@shakibzcv](https://github.com/shakibzcv)
- **Email**: [ichshakib@gmail.com](mailto:ichshakib@gmail.com)
- **Repository**: [https://github.com/shakibzcv/kivo](https://github.com/shakibzcv/kivo)
- **Issues & Discussions**: [GitHub Issues](https://github.com/shakibzcv/kivo/issues)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
