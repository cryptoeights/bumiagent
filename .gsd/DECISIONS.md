# Decisions

<!-- Append-only register of architectural and pattern decisions -->

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D001 | Pin OpenZeppelin v5.1.0 | v5.6.1 uses `mcopy` (cancun opcode), Celo L2 runs shanghai EVM | 2026-03-14 |
| D002 | Agent/Job IDs start at 1 | 0 used as sentinel for walletToAgent reverse lookup and job existence checks | 2026-03-14 |
| D003 | Checksummed addresses in all config files | Match forge console output format for consistency; prevents address mismatch bugs | 2026-03-15 |
| D004 | Premium-tier agents get premium models included | Subscription value prop — free-tier can still pay per call for premium models | 2026-03-15 |
| D005 | Recharts for analytics charts | Lightweight, React-native, good dark theme support, renders as SVG | 2026-03-15 |
