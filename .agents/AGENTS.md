# VS Code Line King Guidelines

Line King is an extension for VS Code that provides comprehensive sorting, case change, line manipulation, etc. functions via context menu and command palette. It is highly performant, with minimal resource usage, fast initialization time.

## Tech Stack

- **TypeScript 5.9** with strict mode enabled
- **VS Code Extension API** (^1.109)
- **Node.js** runtime (ES2024 target)
- **esbuild** for bundling (production builds)
- **Bun** for package management and scripts
- **Bun test** for testing
- **ESLint** for linting

## Entry Points

- `src/extension.ts` - Extension activation/deactivation, command registration, save handler
- `src/commands.ts` - Orchestrates command registration from sub-modules

## Build Output

- **Bundled**: `dist/extension.js` (for both Node and browser)
- **Compiled**: `out/` directory (TypeScript compilation for testing)

## Key Architecture

```
extension.ts
├── commands/           # Command modules (sorting, cleaning, transformation, utility)
│   └── factory.ts      # CommandFactory for consistent command registration
├── lib/                # Core logic (sorter, cleaner, transformer, css-sorter, visualizer)
├── utils/              # Helpers (editor, config-cache, Logger, text-utils, performance)
├── context-manager.ts  # VS Code context state management, event listeners
├── constants.ts        # CONFIG, CONTEXT_KEYS, TIMING, REGEX, PERFORMANCE
└── schemas/            # JSON schema for configuration
```

## Coding Principles

- Use current coding standards and patterns
- KISS, Occam's razor, DRY, YAGNI
- Optimize for actual and perceived performance
- Self-documenting code via clear naming
- Comments only for workarounds/complex logic
- No magic numbers - use constants like `CHUNK_SIZE_LINES`, `VISIBLE_LINE_BUFFER`
- **Do NOT create docs files** (summary, reference, testing, etc.) unless explicitly instructed

## Common Patterns

- **CommandFactory**: Use `registerLineCommand`/`registerAsyncCommand` to add commands
- **Lazy loading**: Heavy modules loaded on-demand via dynamic `import()` to keep startup fast
- **Debouncing**: Selection/decoration updates use `TIMING` constants for debounce delays
- **Context caching**: `ContextManager` caches state to avoid redundant `setContext` calls
- **Config access**: Use `configCache` from `utils/config-cache.js` for settings

## File System Access

### Allowed

- all root folders and files unless excluded below

### Disallowed

- `.assets/`, `.context/`, `.docs/`, `.git/`, `node_modules/`
- `repomix.config.json`, `bun.lock`, `.repomixignore`, `LICENSE`

## Verification Commands

After making changes, run: `bun run check` (typecheck + lint + format check)
