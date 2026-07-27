---
name: to-ticket
description: Decomposes a technical specification or complex feature request into bounded, actionable, sequential development tickets with explicit acceptance criteria. Use this skill when breaking down specs or plans into implementation tasks.
---

# `to-ticket` Skill

This skill guides the agent in breaking down a technical specification or high-level architecture into bite-sized, sequential, and fully verified development **tickets**.

## Objectives
- Deconstruct complex specifications into independent, actionable units of work.
- Ensure every ticket has measurable acceptance criteria and step-by-step verification steps.
- Maintain dependency ordering so tickets can be implemented sequentially or concurrently without conflicts.

## Ticket Breakdown Schema

When invoking `/to-ticket`, break down the spec into numbered tickets stored in `docs/tickets/` or formatted as structured task lists:

```markdown
# Ticket Decomposition: [Feature Name]

## Dependency Map
- Ticket-1 (Foundation / Schema) -> Ticket-2 (Backend Core) -> Ticket-3 (UI / Integration)

---

### [TICKET-1]: [Title]
- **Target Component / Files**: `src/models/...`, `src/services/...`
- **Objective**: Concise description of what this ticket builds.
- **Dependencies**: None / Ticket ID
- **Acceptance Criteria**:
  - [ ] Requirement 1 met
  - [ ] Requirement 2 met
- **Verification Commands**:
  - `npm test path/to/test.spec.js`
  - Manual check command or script.

---

### [TICKET-2]: [Title]
...
```

## Workflow Execution Steps
1. **Analyze Input Spec**: Read the specification document created via `/to-spec` or provided by the user.
2. **Identify Atomic Boundaries**: Group changes by data model, backend logic, frontend UI, and integration tests.
3. **Map Dependencies**: Order tickets so foundational interfaces are built and tested before dependent modules.
4. **Define Verification Steps**: Ensure every single ticket specifies how its completion will be empirically verified.
5. **Output Ticket Breakdown**: Save tickets to `docs/tickets/` or present them clearly to the user for implementation approval.
