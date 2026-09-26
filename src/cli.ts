#!/usr/bin/env node
import * as fs from "node:fs";
import { lint } from "./linter";
import { Finding, Rule } from "./rules";
import { loadConfig, resolveRules } from "./config";

function readStdin(): string {
  // fd 0 is stdin; readFileSync blocks until EOF, which is fine for a
  // linter that needs the whole input before it can report anything.
  return fs.readFileSync(0, "utf8");
}

function formatFinding(f: Finding): string {
  const location = f.column ? `${f.line}:${f.column}` : `${f.line}`;
  return `  ${location}  ${f.severity}  ${f.message}  (${f.ruleId})`;
}

function lintTarget(target: string, rules: Rule[]): { findings: Finding[]; error?: string } {
  try {
    const text = target === "-" ? readStdin() : fs.readFileSync(target, "utf8");
    return { findings: lint(text, rules) };
  } catch (err) {
    return { findings: [], error: (err as Error).message };
  }
}

function main(): number {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : ["-"];
  let hasError = false;

  let rules: Rule[];
  try {
    rules = resolveRules(loadConfig());
  } catch (err) {
    console.error((err as Error).message);
    return 1;
  }

  for (const target of targets) {
    const label = target === "-" ? "<stdin>" : target;
    const { findings, error } = lintTarget(target, rules);

    if (error) {
      console.error(`${label}: ${error}`);
      hasError = true;
      continue;
    }

    if (findings.length === 0) continue;

    console.log(label);
    for (const finding of findings) {
      console.log(formatFinding(finding));
      if (finding.severity === "error") hasError = true;
    }
  }

  return hasError ? 1 : 0;
}

process.exit(main());
