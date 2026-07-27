---
name: implement
description: Executes the implementation of a specific ticket or technical spec, adhering to project coding rules, step-by-step code writing, automated testing, and empirical verification. Use this skill when implementing features or fixing assigned tickets.
---

# `implement` Skill

This skill guides the agent in writing high-quality code to fulfill a specific ticket or technical specification.

## Core Rules for Implementation
1. **Never Guess Code Logic or Schemas**: Inspect source code, existing tests, and graphify knowledge graphs before editing.
2. **Preserve Contracts**: Keep existing function signatures, API interfaces, and docstrings intact unless explicitly part of the ticket.
3. **No Superficial Patches**: Fix underlying root causes rather than suppressing errors, swallowing exceptions, or returning mock data.
4. **Empirical Verification**: Never declare success without running tests or build commands to prove clean completion.

## Workflow Execution Steps

### Step 1: Context & Ticket Assessment
- Read the target ticket and linked specification (`/to-ticket` / `/to-spec`).
- Inspect target files and relevant imports using `view_file` or `grep_search`.

### Step 2: Test & Code Construction
- Write or update unit tests for the targeted behavior (Test-Driven Development preferred).
- Write clean, production-grade code modifications matching project design patterns.

### Step 3: Local Verification & Linting
- Execute build commands, linters, and unit tests using `run_command`.
- Inspect command output directly to confirm zero failures and clean passes.

### Step 4: Knowledge Graph Update
- If `graphify` is present in the repository, update the knowledge graph (`graphify update .`).

### Step 5: Summary & Completion Report
- Summarize modified files, test outputs, and verification evidence for the user.
