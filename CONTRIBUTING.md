# Contributing

1. Create a focused branch and explain the user-visible problem.
2. Use Python 3.12, Node 22, and the repository locks.
3. Keep model downloads out of normal startup and tests.
4. Add tests at the boundary your change affects. Use temporary data and never commit private files.
5. Run Ruff, the applicable tests, TypeScript, and a frontend build for UI changes.
6. Update the requirements coverage and validation reports when a capability becomes genuinely verified.
7. Open a pull request with behavior, tradeoffs, and exact checks run.

Do not claim accuracy, latency, security, or production readiness without a reproducible measurement. Dependency upgrades should update locks and pass the same gates as product changes.
