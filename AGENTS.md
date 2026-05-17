# AGENTS.md
## Standing Instructions for Codex

### 1. Git & Commits
- **Atomic commits only**: One logical change per commit. Never bundle unrelated refactors, fixes, and features.
- **Commit message format**: Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Message content**: Subject line in imperative mood. Add a body if the change isn’t self-explanatory. Explain *why*, not just *what*.
- **No secrets or artifacts**: Never stage `.env`, `node_modules`, `dist/`, `build/`, `.DS_Store`. Respect `.gitignore`.
- **Small diffs**: Prefer multiple small PRs over one large PR. If a change touches >300 lines, split it.

### 2. Code Style & Quality
- **Match existing style**: Follow the conventions already in the repo. If unclear, ask before inventing new patterns.
- **Type safety**: Use TypeScript where present. No `any` unless justified in a comment.
- **No placeholders**: Don’t leave `// TODO`, `// fix later`, or commented-out code. Either implement it or explain why it’s deferred.
- **Error handling**: Handle errors explicitly. Don’t swallow exceptions silently.
- **Tests**: If you change behavior, update or add tests. Run existing tests before submitting.

### 3. Changes & Diffs
- **Minimal changes**: Change only what’s needed for the task. Avoid reformatting unrelated files.
- **Explain tradeoffs**: Before large changes, briefly outline alternatives and why you chose this approach.
- **Idempotency**: Scripts and migrations should be safe to run multiple times.

### 4. Communication
- **Be direct**: No fluff, no apologies. State what changed and why.
- **Flag risks**: Call out breaking changes, perf impacts, or security concerns upfront.
- **Ask when stuck**: If requirements are ambiguous or you’d break a rule above to proceed, ask for clarification.

### 5. Project Context
- **Stack**: [Fill this in: e.g., Next.js 14, Prisma, Postgres, Tailwind]
- **Commands**: 
    - Run tests: `npm test`
    - Lint: `npm run lint`
    - Build: `npm run build`
- **Do not**: [Add any project-specific bans, e.g., “Do not introduce lodash. Use native JS.”]