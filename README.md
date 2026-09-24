# log-file-linter

Log files pick up junk over time in ways that don't show until something
downstream trips on it: trailing whitespace that throws off diffs and
line-based hashing, tabs mixed in with space-padded fields that break
fixed-width parsers, CRLF line endings smuggled in from a Windows box that
confuse tools expecting plain LF, a stack trace or a stray binary dump that
turns one line into megabytes and stalls a log shipper. None of this is
visible in `less` or `tail -f`. `loglint` walks a log file line by line and
reports exactly where this stuff is.

## Usage

Lint a file:

```
$ loglint app.log
app.log
  42:17  warning  trailing whitespace  (trailing-whitespace)
  108:1  warning  tab character in log line (mixes badly with fixed-width parsers)  (tab-character)
```

Pipe from anything - this is the case the tool is built around, since most
real log inspection starts with `tail`, `ssh`, or `kubectl logs`, not a file
sitting on disk:

```
$ kubectl logs my-pod | loglint
$ tail -n 500 /var/log/syslog | loglint
```

Lint several files in one pass - each gets its own findings, and the exit
code is 1 if any finding is an error:

```
$ loglint app.log worker.log
```

With no arguments and nothing piped in, `loglint` reads from stdin and
blocks waiting for it, same as `cat`.

## Rules

| id | severity | checks for |
| --- | --- | --- |
| `trailing-whitespace` | warning | spaces or tabs at the end of a line |
| `tab-character` | warning | a tab anywhere in the line |
| `crlf-line-ending` | warning | a line ending in `\r\n` instead of `\n` |
| `max-line-length` | error | a line over 4000 characters |

Rules are plain objects with a `check(line)` function (see `src/rules.ts`);
there's no plugin system yet, just a list you can edit.

## Building

```
$ npm run build
$ node dist/cli.js app.log
```

No dependencies to install - this is standard library only, so `npm run
build` just invokes `tsc`.

## Status

Early. The rule set is small and there's no config file yet - see the
in-progress notes in the repo for what's next.
