# Rule: Always Use Ponytail Skill When Writing Code

Whenever writing, adding, refactoring, fixing, or modifying code:
1. Always invoke and apply the `ponytail` skill (`.agents/skills/ponytail/SKILL.md`).
2. Follow **The Decision Ladder** before writing any code:
   - Rung 1: Does this need to exist at all? (YAGNI)
   - Rung 2: Already in this codebase? (Reuse existing logic/helpers)
   - Rung 3: Stdlib does it?
   - Rung 4: Native platform feature covers it?
   - Rung 5: Already-installed dependency solves it?
   - Rung 6: Can it be one line?
   - Rung 7: Only then: minimum code that works.
3. Keep code minimal, clean, and safe.
4. Output format: Code first, followed by brief note on what was skipped if applicable (`[code] → skipped: [X], add when [Y]`).
