export const CONFIG = {
    NAMESPACE: 'lineKing',
    JOIN_SEPARATOR: 'joinSeparator',
    CLEANUP_ON_SAVE: 'cleanupOnSave',
    CSS_SORT_STRATEGY: 'cssSortStrategy'
};

export const CONTEXT_KEYS = {
    IS_MULTI_LINE: 'lineKing.isMultiLine',
    LINE_ENDINGS_VISIBLE: 'lineKing.lineEndingsVisible'
};

export const COMMANDS = {
    DEBUG_CONTEXT: 'lineKing.debug.checkContext',
    SHOW_LINE_ENDINGS: 'lineKing.util.showLineEndings',
    HIDE_LINE_ENDINGS: 'lineKing.util.hideLineEndings',
    SORT_CSS: 'lineKing.sort.css',
    SPLIT_LINES: 'lineKing.manipulate.split',
    ALIGN_LINES: 'lineKing.manipulate.align',
    INSERT_SEQUENCE: 'lineKing.manipulate.sequence',
    DUPLICATE_SELECTION: 'lineKing.manipulate.duplicate',
    CONVERT_LF: 'lineKing.util.eol.lf',
    CONVERT_CRLF: 'lineKing.util.eol.crlf'
};
