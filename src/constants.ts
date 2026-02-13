export const CONFIG = {
    NAMESPACE: 'lineKing',
    JOIN_SEPARATOR: 'joinSeparator',
    CLEANUP_ON_SAVE: 'cleanupOnSave',
    CSS_SORT_STRATEGY: 'cssSortStrategy',
} as const;

export const CONTEXT_KEYS = {
    IS_MULTI_LINE: 'lineKing.isMultiLine',
    ALL_CHARS_VISIBLE: 'lineKing.whitespaceCharsVisible',
};

// Timing constants
export const TIMING = {
    SELECTION_DEBOUNCE_MS: 50,
    DECORATION_DEBOUNCE_MS: 150,
};

// Line ending detection constants
export const LINE_ENDINGS = {
    LF_BYTE_LENGTH: 1,
    CRLF_BYTE_LENGTH: 2,
};

// Command identifiers
export const COMMANDS = {
    DEBUG_CONTEXT: 'lineKing.debug.checkContext',
    SHOW_ALL_CHARS: 'lineKing.util.showWhitespaceChars',
    HIDE_ALL_CHARS: 'lineKing.util.hideWhitespaceChars',
    SORT_CSS: 'lineKing.sort.css',
    SPLIT_LINES: 'lineKing.manipulate.split',
    ALIGN_LINES: 'lineKing.manipulate.align',
    INSERT_SEQUENCE: 'lineKing.manipulate.sequence',
    DUPLICATE_SELECTION: 'lineKing.manipulate.duplicate',
    CONVERT_LF: 'lineKing.util.eol.lf',
    CONVERT_CRLF: 'lineKing.util.eol.crlf',
};

export const REGEX = {
    LINE_SPLIT: /\r?\n/,
    TRAILING_WHITESPACE: /\s+$/,
    LEADING_WHITESPACE: /^\s+/,
    IP_ADDRESS: /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/,
    CSS_PROPERTY: /^\s{2,}[-a-z]+(?:-[a-z0-9]+)*\s*:\s*[^:;{}]+;?\s*$/i,
    CSS_VALUE:
        /(?:[\d.]+(?:px|em|rem|%|vh|vw|ex|ch|cm|mm|in|pt|pc|deg|rad|turn|s|ms)?|#[0-9a-f]{3,8}|rgba?|hsla?|var\(|calc\(|url\(|['"]|\b(?:auto|none|inherit|initial|unset|normal|bold|italic|flex|block|inline|absolute|relative|fixed|hidden|visible|transparent|currentColor|red|blue|white|black)\b)/i,
    WHITESPACE: /\s/,
    INDENTATION: /^\s{2,}/,
    LIST_ITEM: /^[-*]\s/,
    EXCESS_WHITESPACE: /\s{3,}/,
};

// Performance thresholds and limits
export const PERFORMANCE = {
    /** Threshold for large file processing (lines) - 50,000 lines */
    LARGE_FILE_LINE_THRESHOLD: 50000,
    /** Threshold for streaming processing (bytes) - 1MB */
    STREAMING_THRESHOLD_BYTES: 1024 * 1024,
    /** Chunk size for efficient line joining - 10,000 lines */
    JOIN_CHUNK_SIZE: 10000,
    /** Maximum CSS lines to safely process - 100,000 lines */
    MAX_SAFE_CSS_LINES: 100000,
    /** Maximum lines to scan when finding CSS rule blocks - 500 lines */
    MAX_CSS_SCAN_LINES: 500,
} as const;
