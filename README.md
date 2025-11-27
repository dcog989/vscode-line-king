# Line King

**The Ultimate Line Manipulation Tool for VS Code.**

Line King replaces the need for multiple single-purpose extensions by combining sorting, tidying, cleaning, and text manipulation into one powerful, lightweight utility.

## Features

### 1. Sorting
*Works on selection or entire document.*
- **Sort Ascending/Descending**: Standard alphabetical sort.
- **Natural Sort**: Intelligently sorts numbers (e.g., `A2` comes before `A10`).
- **Sort by Length**: Organize lines by their character count.
- **Unique Sort**: Sorts and removes duplicates in one go.
- **Shuffle**: Randomize line order.
- **CSS Properties**: Sorts CSS/SCSS/LESS properties alphabetically within their rule blocks.

### 2. Tidying & Cleaning
- **Remove Blank Lines**: Deletes all empty lines.
- **Condense Blank Lines**: Reduces multiple consecutive blank lines to a single one.
- **Remove Duplicates**: Keeps the first occurrence, removes the rest.
- **Keep Only Duplicates**: Useful for finding repeated data; removes all unique lines.
- **Trim Trailing Whitespace**: Cleans up end-of-line spaces.

### 3. Manipulation
- **Duplicate Line/Selection**: Smarter duplication that handles newlines correctly.
- **Join Lines**: Combines selected lines using a configurable separator.
- **Split Lines**: Splits text based on a custom separator you type.
- **Case Conversion**:
  - UPPERCASE
  - lowercase
  - camelCase
  - kebab-case
  - snake_case
  - PascalCase

### 4. Utilities
- **Toggle Line Endings**: visualizes `LF` (↓) and `CRLF` (↵) characters to help debug mixed line endings.
- **Cleanup on Save**: Configure Line King to automatically remove blank lines or trim whitespace when you save.

## Configuration

| Setting                    | Description                                                                                        | Default        |
| :------------------------- | :------------------------------------------------------------------------------------------------- | :------------- |
| `lineKing.joinSeparator`   | Character used when joining lines.                                                                 | `" "` (Space)  |
| `lineKing.cleanupOnSave`   | Action to run on save (`none`, `removeBlankLines`, `trimTrailingWhitespace`, `sortCssProperties`). | `none`         |
| `lineKing.cssSortStrategy` | Strategy for CSS sorting.                                                                          | `alphabetical` |

## Commands
Access all commands via the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) by typing **"Line King"**.
