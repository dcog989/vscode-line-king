# Line King

**The Ultimate Line Manipulation Tool for VS Code.**

Line King replaces the need for multiple single-purpose extensions by combining sorting, tidying, cleaning, and text manipulation into one powerful, lightweight utility.

![Version](https://img.shields.io/badge/version-0.0.2-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.106.1-brightgreen.svg)

## Features

### 📊 Sorting
*Works on selection or entire document.*

- **Sort Ascending/Descending** - Standard alphabetical sort (case-sensitive or case-insensitive)
- **Natural Sort** - Intelligently sorts numbers (e.g., `A2` comes before `A10`)
- **Sort by Length** - Organize lines by their character count (shortest or longest first)
- **Unique Sort** - Sorts and removes duplicates in one operation
- **Reverse** - Reverses the order of lines
- **IP Address Sort** - Sorts lines containing IPv4 addresses numerically
- **Shuffle** - Randomize line order
- **CSS Properties Sort** - Sorts CSS/SCSS/LESS properties alphabetically or by length within rule blocks

### 🧹 Tidying & Cleaning

- **Remove Blank Lines** - Deletes all empty lines
- **Condense Blank Lines** - Reduces multiple consecutive blank lines to a single one
- **Remove Duplicates** - Keeps the first occurrence, removes the rest (preserves order)
- **Keep Only Duplicates** - Useful for finding repeated data; removes all unique lines
- **Trim Whitespace** - Remove leading, trailing, or both from each line

### ✨ Text Transformation

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

### 🛠️ Utilities

- **Duplicate Line/Selection** - Smarter duplication that handles newlines correctly
- **Join Lines** - Combines selected lines using a configurable separator
- **Split Lines** - Splits text based on a custom separator you specify
- **Align to Separator** - Aligns text around a separator (e.g., `=`, `:`, `,`)
- **Insert Numeric Sequence** - Replaces selection with sequential numbers (1, 2, 3...)
- **Toggle Line Endings** - Visualizes `LF` (↓) and `CRLF` (↵) characters to help debug mixed line endings
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
- **With selection**: Commands operate on the selected lines (expanded to full lines)
- **Without selection**: Most commands operate on the entire document
- **Multiple selections**: Commands handle multiple selections intelligently

## Configuration

Access settings via: File > Preferences > Settings > Extensions > Line King

| Setting                        | Description                                                                                                 | Default        |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------- |
| `lineKing.joinSeparator`       | Character or string used when joining lines together.                                                       | `" "` (Space)  |
| `lineKing.cleanupOnSave`       | Action to run on save: `none`, `removeBlankLines`, `trimTrailingWhitespace`, or `sortCssProperties`.       | `none`         |
| `lineKing.cssSortStrategy`     | Strategy for CSS sorting: `alphabetical` (by property name) or `length` (by line length).                  | `alphabetical` |

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
- `Line King: Util: Toggle Line Endings Visibility`
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

## Known Issues

None currently. Please report issues on [GitHub](https://github.com/dcog989/vscode-line-king/issues).

## Release Notes

### 0.0.2
- Enhanced browser compatibility for Base64 encoding/decoding
- Improved error handling for all encoding operations
- Added comprehensive JSDoc documentation
- Better type safety with explicit return types
- Enhanced `removeDuplicates` to preserve line order
- Improved CSS property sorting with better regex
- Added keywords for better discoverability

### 0.0.1
- Initial release

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Support

If you encounter any issues or have feature requests, please file them on the [GitHub repository](https://github.com/dcog989/vscode-line-king/issues).

---

**Enjoy using Line King!** 👑
