// @types/node would pull in a dependency we don't have, and this CLI only
// touches a handful of Node globals. Declaring just that surface keeps the
// build self-contained without a package install.

declare const process: {
  argv: string[];
  exit(code: number): never;
};

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

declare module "node:fs" {
  export function readFileSync(path: string | number, encoding: "utf8"): string;
}
