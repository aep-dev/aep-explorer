# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the UI project.

## Workflows

### `pr-checks.yml` - Pull Request Checks

Runs on every pull request to `main` or `master` branches:

- ✅ **Install dependencies** - `npm ci`
- 🔍 **Lint code** - `npm run lint` (continues on error)
- 🔧 **Type check** - `npx tsc --noEmit`
- 🧪 **Run tests** - `npm test -- --run`
- 🏗️ **Build project** - `npm run build`

### `test.yml` - Comprehensive Tests

Runs on pull requests and pushes to `main`/`master` branches:

- 🧪 **Test Matrix** - Node.js 18 & 20
- 📊 **Coverage reporting** - Uploads to Codecov (optional)
- 🔄 **Full CI pipeline** - All checks above

## Requirements

### Required Checks

- ✅ Tests must pass
- ✅ TypeScript compilation must succeed
- ✅ Build must complete successfully

### Optional Checks

- 🔍 Linting (will show warnings but won't fail CI)

## Local Development

Run the same checks locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm test -- --run

# Build project
npm run build
```
