# ![Line King logo](https://raw.githubusercontent.com/dcog989/vscode-line-king/main/assets/icon-64.png) Line King

*Line King* sorts, changes case, removes dups, removes blank lines, splits and joins lines, encodes to Base64, etc. It's the ultimate toolbox for line / text manipulation.  It's also smart, only displaying what is relevant to what is selected.

The best line manipulation extension for VS Code ever? Many people are saying so.

![Line King screenshot](https://raw.githubusercontent.com/dcog989/vscode-line-king/main/assets/screen-1.png)

## Features

### Sorting
*Works on selection or entire document.*

- **Sort Ascending/Descending** - Standard alphabetical sort (case-sensitive or case-insensitive)
- **Natural Sort** - Intelligently sorts numbers (e.g., `A2` comes before `A10`)
- **Sort by Length** - Organize lines by their character count (shortest or longest first)
- **Unique Sort** - Sorts and removes duplicates in one operation
- **Reverse** - Reverses the order of lines
- **IP Address Sort** - Sorts lines containing IPv4 addresses numerically
- **Shuffle** - Randomize line order
- **CSS Properties Sort** - Sorts CSS/SCSS/LESS properties alphabetically or by length within rule blocks

### Tidying & Cleaning

- **Remove Blank Lines** - Deletes all empty lines
- **Condense Blank Lines** - Reduces multiple consecutive blank lines to just one
- **Remove Duplicates** - Keeps the first occurrence, removes the rest (preserves order)
- **Keep Only Duplicates** - Useful for finding repeated data; removes all unique lines
- **Trim Whitespace** - Remove leading, trailing, or both from each line

### Text Transformation

- **Case Conversion**:
  - UPPERCASE
  - lowercase
  - Sentence case
  - Title Case
  - camelCase
  - PascalCase
  - kebab-case
  - snake_case

- **Encoding/Decoding**:
  - URL Encode/Decode
  - Base64 Encode/Decode
  - JSON String Escape/Unescape

### Utilities

- **Duplicate Line/Selection** - Smarter duplication that handles newlines correctly
- **Join Lines** - Combines selected lines using a configurable separator
- **Split Lines** - Splits text based on a custom separator you specify
- **Align to Separator** - Aligns text around a separator (e.g., `=`, `:`, `,`)
- **Insert Numeric Sequence** - Replaces selection with sequential numbers (1, 2, 3...)
- **Show Whitespace Characters** - Display line endings `LF` (↓), `CRLF` (↵), spaces (·), and tabs (→)
- **Convert Line Endings** - Convert between LF (Unix) and CRLF (Windows) formats
- **Cleanup on Save** - Automatically tidy files when you save

## Usage

### Context Menu

1. Select text or place cursor in the document
2. Right-click to open the context menu
3. Look for the **Line King** submenu
4. Choose your desired operation

### Command Palette

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Line King" to see all available commands
3. Select the command you want to run

### Behavior

- **Line Operations (Sort, Tidy, Join, Align)**:
  - **With selection**: Automatically expands selection to encompass the full lines.
  - **Without selection**: Operates on the entire document.

- **Text Operations (Case, Encode, Transform)**:
  - **With selection**: Operates **strictly** on the selected text characters.
  - **Without selection**: Operates on the entire document.

- **Multiple selections**: All commands handle multiple cursors/selections intelligently.

## Configuration

Access settings via: File > Preferences > Settings > Extensions > Line King

| Setting                    | Description                                                                                          | Default        |
| :------------------------- | :--------------------------------------------------------------------------------------------------- | :------------- |
| `lineKing.joinSeparator`   | Character or string used when joining lines together.                                                | `" "` (Space)  |
| `lineKing.cleanupOnSave`   | Action to run on save: `none`, `removeBlankLines`, `trimTrailingWhitespace`, or `sortCssProperties`. | `none`         |
| `lineKing.cssSortStrategy` | Strategy for CSS sorting: `alphabetical` (by property name) or `length` (by line length).            | `alphabetical` |

### Example Configuration

```json
{
  "lineKing.joinSeparator": ", ",
  "lineKing.cleanupOnSave": "trimTrailingWhitespace",
  "lineKing.cssSortStrategy": "alphabetical"
}
```

## Commands

All commands are available through the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

### Sort Commands
- `Line King: Sort: Ascending (A-Z)`
- `Line King: Sort: Ascending (Case Insensitive)`
- `Line King: Sort: Descending (Z-A)`
- `Line King: Sort: Descending (Case Insensitive)`
- `Line King: Sort: Unique (Remove Duplicates)`
- `Line King: Sort: Unique (Case Insensitive)`
- `Line King: Sort: Natural (Alphanumeric)`
- `Line King: Sort: By Length (Shortest)`
- `Line King: Sort: By Length (Longest)`
- `Line King: Sort: Reverse Order`
- `Line King: Sort: By IP Address`
- `Line King: Sort: Shuffle`
- `Line King: Sort: Sort CSS Properties`

### Tidy Commands
- `Line King: Tidy: Remove Blank Lines`
- `Line King: Tidy: Condense Blank Lines`
- `Line King: Tidy: Remove Duplicate Lines`
- `Line King: Tidy: Keep Only Duplicates`
- `Line King: Tidy: Trim Trailing Whitespace`
- `Line King: Tidy: Trim Leading Whitespace`
- `Line King: Tidy: Trim Both Ends`

### Case Commands
- `Line King: Case: UPPERCASE`
- `Line King: Case: lowercase`
- `Line King: Case: Sentence case`
- `Line King: Case: Title Case`
- `Line King: Case: camelCase`
- `Line King: Case: kebab-case`
- `Line King: Case: snake_case`
- `Line King: Case: PascalCase`

### Dev Tools Commands
- `Line King: Dev: URL Encode`
- `Line King: Dev: URL Decode`
- `Line King: Dev: Base64 Encode`
- `Line King: Dev: Base64 Decode`
- `Line King: Dev: JSON String Escape`
- `Line King: Dev: JSON String Unescape`

### Utility Commands
- `Line King: Tools: Duplicate Selection`
- `Line King: Tools: Join Lines`
- `Line King: Tools: Split Lines...`
- `Line King: Tools: Align to Separator...`
- `Line King: Tools: Insert Numeric Sequence (1,2,3...)`
- `Line King: Util: Show Whitespace Characters`
- `Line King: Util: Hide Whitespace Characters`
- `Line King: Util: Convert to LF (Unix)`
- `Line King: Util: Convert to CRLF (Windows)`

## Examples

### Sorting a List
**Before:**
```
Zebra
Apple
banana
Cherry
```

**After** (Ascending, Case Insensitive):
```
Apple
banana
Cherry
Zebra
```

### Sorting CSS Properties
**Before:**
```css
.container {
    z-index: 10;
    background-color: white;
    padding: 20px;
    margin: 0 auto;
    display: flex;
}
```

**After**:
```css
.container {
    background-color: white;
    display: flex;
    margin: 0 auto;
    padding: 20px;
    z-index: 10;
}
```

### Aligning to Separator
**Before:**
```
name = "John"
age = 30
email = "john@example.com"
```

**After** (Align to `=`):
```
name  = John
age   = 30
email = john@example.com
```

## Requirements

- Visual Studio Code version 1.106.1 or higher
- No additional dependencies required

## Extension Compatibility

Line King is designed to work in:
- ✅ Local VS Code
- ✅ VS Code Web (browser)
- ✅ Virtual Workspaces
- ✅ Untrusted Workspaces

## Support

Please report issues and feature requests to [Line King issues](https://github.com/dcog989/vscode-line-king/issues).

## License

MIT.
