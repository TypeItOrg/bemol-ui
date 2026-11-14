---
description: Run front checks, then commit the requested changes with the conventional-commit skill
argument-hint: [paths, hunks or context to commit]
allowed-tools: Bash(git *), Bash(make *), Bash(pnpm *), Read, Edit
---

Create commit(s) for the requested changes: $ARGUMENTS

1. Read `.agents/skills/conventional-commit/SKILL.md` and follow it for message format, grouping and staging.
2. Inspect `git status` and `git diff`. Commit only the requested changes; preserve unrelated files and existing staged work.
3. Before committing, run from the repo root:
   - `make format`
   - `make test`
   - `pnpm lint`
     If a check fails because of the selected changes, fix it and rerun. Report failures from unrelated code without fixing them or bypassing hooks.
4. If `make format` touched files outside the selection, leave them unstaged and do not include them.
5. Do not add `Co-Authored-By` or any other attribution line to the commit message.
6. Do not push, amend or rewrite history unless the user explicitly asks.
7. Report the commit hashes and a short description of each commit's scope, plus the results of each check.
