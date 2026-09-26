import * as fs from "node:fs";
import {
  Rule,
  trailingWhitespace,
  tabCharacter,
  crlfLineEnding,
  maxLineLength,
} from "./rules";

export const CONFIG_FILENAME = ".loglintrc";
const DEFAULT_MAX_LINE_LENGTH = 4000;

export interface LoglintConfig {
  maxLineLength?: number;
  rules?: Record<string, boolean>;
}

// Order here is the order findings are checked in, and it's what config
// validation checks rule names against, so it's the single source of truth
// for "what rules exist".
function buildRuleTable(limit: number): Record<string, Rule> {
  return {
    "trailing-whitespace": trailingWhitespace,
    "tab-character": tabCharacter,
    "crlf-line-ending": crlfLineEnding,
    "max-line-length": maxLineLength(limit),
  };
}

function readConfigFile(path: string): string | undefined {
  try {
    return fs.readFileSync(path, "utf8");
  } catch (err) {
    if ((err as { code?: string }).code === "ENOENT") return undefined;
    throw err;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Reads .loglintrc from the current directory. Returns an empty config
// (all defaults) when the file doesn't exist. Throws with a message meant
// to be printed directly - the caller doesn't need to add context.
export function loadConfig(path: string = CONFIG_FILENAME): LoglintConfig {
  const raw = readConfigFile(path);
  if (raw === undefined) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${path}: invalid JSON (${(err as Error).message})`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${path}: expected a JSON object`);
  }

  const config: LoglintConfig = {};
  const knownRuleIds = Object.keys(buildRuleTable(DEFAULT_MAX_LINE_LENGTH));

  if (parsed.maxLineLength !== undefined) {
    const value = parsed.maxLineLength;
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${path}: "maxLineLength" must be a positive integer`);
    }
    config.maxLineLength = value;
  }

  if (parsed.rules !== undefined) {
    if (!isPlainObject(parsed.rules)) {
      throw new Error(`${path}: "rules" must be an object`);
    }
    const rules: Record<string, boolean> = {};
    for (const [ruleId, enabled] of Object.entries(parsed.rules)) {
      if (!knownRuleIds.includes(ruleId)) {
        throw new Error(
          `${path}: unknown rule "${ruleId}" (known rules: ${knownRuleIds.join(", ")})`,
        );
      }
      if (typeof enabled !== "boolean") {
        throw new Error(`${path}: rule "${ruleId}" must be true or false`);
      }
      rules[ruleId] = enabled;
    }
    config.rules = rules;
  }

  return config;
}

// Turns a config into the ordered rule list the linter actually runs.
export function resolveRules(config: LoglintConfig): Rule[] {
  const limit = config.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
  const table = buildRuleTable(limit);
  const enabled = config.rules ?? {};

  return Object.keys(table)
    .filter((ruleId) => enabled[ruleId] !== false)
    .map((ruleId) => table[ruleId]);
}
