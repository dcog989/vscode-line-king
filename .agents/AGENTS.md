# VS Code Line King Guidelines

Line King is an extension for VS Code that provides a wide range of sorting, case change, and line manipulation functions via context menu and command palette. It aims for fast performance, minimal resource usage, fast startup time in VS Code.

## Tech Stack

- **TypeScript 5.9** with strict mode enabled
- **VS Code Extension API** (^1.106)
- **Node.js** runtime (ES2024 target)
- **esbuild** for bundling (production builds)
- **Bun** for package management and scripts
- **Mocha** for testing
- **ESLint** for linting

## Entry Points

### Extension Entry Point

- ?

### Core Components

- ?

### Build Output

- **Bundled**: `dist/extension.js` (for both Node and browser)
- **Compiled**: `out/` directory (TypeScript compilation for testing)

## Key Architecture

### Performance Optimizations

- ?

### Caching Strategy

- ?

### Event Handling

- ?

### Decorator System

- ?

## Coding Principles

- Use current coding standards and patterns
- KISS, Occam's razor, DRY, YAGNI
- Optimize for actual and perceived performance
- Self-documenting code via clear naming
- Comments only for workarounds/complex logic
- No magic numbers - use constants like `CHUNK_SIZE_LINES`, `VISIBLE_LINE_BUFFER`
- **Do NOT create docs files** (summary, reference, testing, etc.) unless explicitly instructed

## File System Access

### Allowed

- `.agents/`, `.github/`, `.vscode/`
- `scripts/`, `src/`
- Root files: `README.md`, `.editorconfig`, `.gitignore`, `eslint.config.mjs`, `package.json`, `tsconfig.json`, etc.

### Disallowed

- `.ai/`, `.assets/`, `.docs/`, `.git/`, `node_modules/`
- `repomix.config.json`, `bun.lock`, `.repomixignore`

## Common Patterns

- ?
