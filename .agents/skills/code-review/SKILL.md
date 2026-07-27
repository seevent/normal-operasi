---
name: code-review
description: Performs a spec-aware, rigorous code review evaluating proposed changes against project specifications, security, architecture, performance, error handling, and test coverage. Use this skill when reviewing code diffs, pull requests, or newly implemented tickets.
---

# `code-review` Skill

This skill guides the agent in conducting a comprehensive, spec-aligned code review of proposed or executed code changes.

## Review Objectives
- Validate that the implementation satisfies 100% of the specification requirements and acceptance criteria.
- Uncover edge cases, race conditions, security vulnerabilities, and memory leaks.
- Ensure strict adherence to style guidelines, type safety, and project design patterns.

## Code Review Checklist

Evaluate code changes against these key dimensions:

1. **Spec Alignment & Correctness**: Does the code fulfill all requirements in the spec/ticket without unintended side effects?
2. **Architecture & Design**: Are modular boundaries preserved? Are public contracts clean and un-polluted?
3. **Error Handling & Resilience**: Are errors handled explicitly without swallowing exceptions or hiding failures?
4. **Security & Data Protection**: Is user input sanitized? Are authentication/authorization boundaries enforced?
5. **Performance & Resources**: Are there unnecessary database queries, un-indexed lookups, or un-closed connections?
6. **Test Coverage & Verification**: Are unit and integration tests present, reliable, and passing?

## Output Schema

When invoking `/code-review`, produce a structured review report:

```markdown
# Code Review Report

## Summary
- **Status**: APPROVED | CHANGES_REQUESTED | COMMENT
- **Target Changes**: [Files / Diff reviewed]
- **Spec Alignment**: Fully aligned / Partial gap identified

## Key Findings & Ratings

| Category | Rating | Notes |
| :--- | :--- | :--- |
| Spec Compliance | Pass / Fail | Fulfills US-1, US-2 |
| Security & Safety | Pass / Fail | Input validation verified |
| Error Handling | Pass / Fail | Explicit error propagation |
| Test Coverage | Pass / Fail | Unit tests included |

## Critical / Blocking Issues (Must Fix)
- [ ] **[Issue 1]**: Location `path/to/file.ext#L45`. Explanation of bug/defect and suggested fix.

## Non-Blocking Suggestions & Improvements
- [ ] **[Improvement 1]**: Refactoring suggestion or readability polish.

## Verification Evidence
- Test logs, build results, or manual verification steps checked.
```

## Workflow Execution Steps
1. **Fetch Changes & Spec**: Inspect modified files, git diffs, and corresponding spec/tickets.
2. **Execute Checklist**: Evaluate changes against the 6 review dimensions.
3. **Synthesize Feedback**: Generate a clear, constructve code review report.
