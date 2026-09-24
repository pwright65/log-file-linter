export type Severity = "error" | "warning";

export interface RuleMatch {
  column?: number;
  message: string;
  severity: Severity;
}

export interface Finding extends RuleMatch {
  ruleId: string;
  line: number;
}

export interface Rule {
  id: string;
  check(line: string): RuleMatch[];
}

export const trailingWhitespace: Rule = {
  id: "trailing-whitespace",
  check(line) {
    const match = /[ \t]+$/.exec(line);
    if (!match) return [];
    return [
      {
        column: match.index + 1,
        message: "trailing whitespace",
        severity: "warning",
      },
    ];
  },
};

export const tabCharacter: Rule = {
  id: "tab-character",
  check(line) {
    const index = line.indexOf("\t");
    if (index === -1) return [];
    return [
      {
        column: index + 1,
        message: "tab character in log line (mixes badly with fixed-width parsers)",
        severity: "warning",
      },
    ];
  },
};

export const crlfLineEnding: Rule = {
  id: "crlf-line-ending",
  check(line) {
    if (!line.endsWith("\r")) return [];
    return [
      {
        column: line.length,
        message: "carriage return before newline (CRLF mixed into an otherwise LF file)",
        severity: "warning",
      },
    ];
  },
};

export function maxLineLength(limit: number): Rule {
  return {
    id: "max-line-length",
    check(line) {
      if (line.length <= limit) return [];
      return [
        {
          column: limit + 1,
          message: `line exceeds ${limit} characters (${line.length}) - likely a stack trace flood or stray binary data`,
          severity: "error",
        },
      ];
    },
  };
}

export const defaultRules: Rule[] = [
  trailingWhitespace,
  tabCharacter,
  crlfLineEnding,
  maxLineLength(4000),
];
