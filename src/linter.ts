import { Finding, Rule, defaultRules } from "./rules";

// A single trailing "\n" is the normal end-of-file case, not a blank last
// line, so it's stripped before splitting. Anything after that is real.
function splitLines(text: string): string[] {
  const normalized = text.endsWith("\n") ? text.slice(0, -1) : text;
  if (normalized === "") return [];
  return normalized.split("\n");
}

export function lint(text: string, rules: Rule[] = defaultRules): Finding[] {
  const findings: Finding[] = [];
  const lines = splitLines(text);

  lines.forEach((line, index) => {
    for (const rule of rules) {
      for (const match of rule.check(line)) {
        findings.push({
          ruleId: rule.id,
          line: index + 1,
          column: match.column,
          message: match.message,
          severity: match.severity,
        });
      }
    }
  });

  return findings;
}
