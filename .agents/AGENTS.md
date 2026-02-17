# VS Code Line King Guidelines

Line King is an extension for VS Code that provides comprehensive sorting, case change, line manipulation, etc. functions via context menu and command palette. It is highly performant, with minimal resource usage, fast initialization time.

## Tech Stack

- **TypeScript 5.9** with strict mode enabled
- **VS Code Extension API** (^1.109)
- **Node.js** runtime (ES2024 target)
- **esbuild** for bundling (production builds)
- **Bun** for package management and scripts
- **Mocha** for testing
- **ESLint** for linting

## Entry Points

- ?

## Build Output

- **Bundled**: `dist/extension.js` (for both Node and browser)
- **Compiled**: `out/` directory (TypeScript compilation for testing)

## Key Architecture

- ?

## Coding Principles

- Use current coding standards and patterns
- KISS, Occam's razor, DRY, YAGNI
- Optimize for actual and perceived performance
- Self-documenting code via clear naming
- Comments only for workarounds/complex logic
- No magic numbers - use constants like `CHUNK_SIZE_LINES`, `VISIBLE_LINE_BUFFER`
- **Do NOT create docs files** (summary, reference, testing, etc.) unless explicitly instructed

## Common Patterns

- ?

## File System Access

### Allowed

- all root folders and files unless excluded below

### Disallowed

- `.assets/`, `.context/`, `.docs/`, `.git/`, `node_modules/`
- `repomix.config.json`, `bun.lock`, `.repomixignore`, `LICENSE`
