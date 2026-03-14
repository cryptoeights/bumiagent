# Decisions

<!-- Append-only register of architectural and pattern decisions -->

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D001 | Pin OpenZeppelin v5.1.0 | v5.6.1 uses `mcopy` (cancun opcode), Celo L2 runs shanghai EVM | 2026-03-14 |
| D002 | Agent/Job IDs start at 1 | 0 used as sentinel for walletToAgent reverse lookup and job existence checks | 2026-03-14 |
