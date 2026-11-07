# Contributing to Kivo

Thank you for your interest in contributing to **Kivo**! We are committed to fostering an inclusive, welcoming, and productive community.

Please take a moment to review this guide before submitting issues, creating feature requests, or opening pull requests.

---

## 📜 Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to [ichshakib@gmail.com](mailto:ichshakib@gmail.com).

---

## 🏗️ Monorepo Overview

Kivo is organized as a Turborepo monorepo powered by **pnpm workspaces**:

```
kivo/
├── apps/
│   ├── web/               # Next.js 16 Web App (Tailwind CSS v4)
│   ├── desktop/           # Electron 30 + Vite + React 19 App
│   ├── mobile/            # Expo SDK 57 + React Native App
│   └── api/               # Express 5 REST API (PostgreSQL, Gemini AI, S3 Storage)
└── packages/
    ├── ui/                # Shared 60+ shadcn UI components (@repo/ui)
    ├── typescript-config/ # TypeScript shared configs (@repo/typescript-config)
    └── eslint-config/     # ESLint shared configs (@repo/eslint-config)
```

---

## 🛠️ Development Setup

### 1. Prerequisites

- **Node.js**: `>= 24.0.0`
- **pnpm**: `>= 11.0.0` (`npm install -g pnpm` or `corepack enable pnpm`)
- **Git**: `>= 2.30.0`

### 2. Fork and Clone

```bash
# 1. Fork repository on GitHub: https://github.com/shakibzcv/kivo/fork

# 2. Clone your fork locally
git clone https://github.com/<your-username>/kivo.git
cd kivo

# 3. Add upstream remote
git remote add upstream https://github.com/shakibzcv/kivo.git
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Running Workspaces

```bash
# Run everything concurrently
pnpm dev

# Or run specific applications:
pnpm --filter web dev        # Web Client (http://localhost:3000)
pnpm --filter desktop dev    # Desktop App (Electron window)
pnpm --filter mobile start   # Mobile App (Expo Metro)
pnpm --filter api dev        # Backend API (http://localhost:5000)
```

---

## 🌿 Branching Strategy

Always create feature/bugfix branches off `main`:

```bash
# Pull latest changes
git checkout main
git pull upstream main

# Create a new branch
git checkout -b <type>/<short-description>
```

### Branch Naming Conventions:

- `feat/add-desktop-notifications`
- `fix/api-oauth-callback`
- `docs/update-installation-guide`
- `refactor/ui-button-variants`
- `chore/update-pnpm-dependencies`

---

## 📝 Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples:

- `feat(desktop): add tray menu support`
- `fix(api): handle expired jwt token gracefully`
- `docs(readme): add desktop app setup guide`

---

## 🧪 Quality Standards & Verification

Before submitting your pull request, verify that all static checks and builds pass:

```bash
# 1. Typecheck all packages and apps
pnpm check-types

# 2. Lint all code
pnpm lint

# 3. Build all packages and applications
pnpm build

# 4. Format all modified files
pnpm format
```

---

## 🚀 Submitting a Pull Request (PR)

1. Ensure your branch is rebased on the latest `upstream/main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Push your changes to your fork:
   ```bash
   git push origin <type>/<short-description>
   ```
3. Open a Pull Request on GitHub against the `main` branch.
4. Fill out the [Pull Request Template](.github/pull_request_template.md) completely with a clear description, related issue numbers, and screenshots/screen recordings for UI changes.
5. Participate in the code review discussion and make requested adjustments promptly.

---

## 📬 Contact & Support

If you have questions, need clarification, or want to discuss architectural proposals:

- **Maintainer**: Shakib Khan
- **GitHub**: [@shakibzcv](https://github.com/shakibzcv)
- **Email**: [ichshakib@gmail.com](mailto:ichshakib@gmail.com)
- **Repository**: [https://github.com/shakibzcv/kivo](https://github.com/shakibzcv/kivo)
- **Issues**: [GitHub Issues](https://github.com/shakibzcv/kivo/issues)

Thank you for helping build Kivo! 🎉
