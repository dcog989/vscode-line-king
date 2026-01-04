export const CONFIG = {
    NAMESPACE: 'lineKing',
    JOIN_SEPARATOR: 'joinSeparator',
    CLEANUP_ON_SAVE: 'cleanupOnSave',
    CSS_SORT_STRATEGY: 'cssSortStrategy'
} as const;

export const CONTEXT_KEYS = {
    IS_MULTI_LINE: 'lineKing.isMultiLine',
    ALL_CHARS_VISIBLE: 'lineKing.whitespaceCharsVisible'
};

// Timing constants
export const TIMING = {
    SELECTION_DEBOUNCE_MS: 50,
    DECORATION_DEBOUNCE_MS: 150
};

// Line ending detection constants
export const LINE_ENDINGS = {
    LF_BYTE_LENGTH: 1,
    CRLF_BYTE_LENGTH: 2
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
    CONVERT_CRLF: 'lineKing.util.eol.crlf'
};
