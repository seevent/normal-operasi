---
name: to-spec
description: Converts user intent, feature requests, or project requirements into a comprehensive, structured technical specification document (PRD/Spec) before writing code. Use this skill when asked to create a spec, write technical requirements, or plan a feature from high-level intent.
---

# `to-spec` Skill

This skill guides the agent in turning raw user requirements, feature ideas, or architecture discussions into a clear, unambiguous, and actionable **Technical Specification Document (Spec)** before any implementation starts.

## Objectives
- Establish an explicit contract between user intent and technical execution.
- Prevent "vibe coding" and unexpected scope creep.
- Uncover technical ambiguity, edge cases, and dependency bottlenecks early.

## Specification Document Structure

When invoking `/to-spec` or creating a specification, generate a structured markdown document (or artifact) following this exact schema:

```markdown
# Technical Specification: [Feature Name]

## 1. Overview & Objective
- **Problem Statement**: What problem are we solving?
- **Goal**: What is the desired end-state?
- **Value**: Why is this feature needed?

## 2. User Stories & Capabilities
- **US-1**: As a [role], I want to [action], so that [benefit].
- **US-2**: As a [role], I want to [action], so that [benefit].

## 3. Architecture & Technical Design
- **Component Changes**: Modules, services, or files affected.
- **Data Models / Schema**: API interfaces, data structures, DB schemas.
- **Control Flow & Sequences**: Logical execution flow.

## 4. Edge Cases & Error Handling
- Network failures, timeout behaviors, missing inputs.
- Concurrency, validation constraints, authorization boundaries.

## 5. Non-Functional Requirements
- Performance / Latency bounds.
- Security & Privacy standards.
- Maintainability and Code Quality constraints.

## 6. Verification & Test Strategy
- Unit test cases required.
- Integration test flows.
- Manual verification steps.

## 7. Out of Scope
- Explicitly list features, enhancements, or refactors NOT included in this spec.
```

## Workflow Execution Steps
1. **Gather Context**: Read existing relevant codebase files and knowledge graphs (`graphify-out/graph.json` if present).
2. **Identify Gaps**: Flag any missing requirements or architectural ambiguities.
3. **Generate Spec Artifact**: Draft the specification and save it as `docs/specs/[feature_name]_spec.md` or present it as an artifact.
4. **Solicit Review**: Ask the user to review and approve the specification before moving to `/to-ticket` or `/implement`.
