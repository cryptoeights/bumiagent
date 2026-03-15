---
id: T01
parent: S04
milestone: M002
provides:
  - Mobile hamburger menu in Navbar
  - Responsive layouts across all 6 pages at 375px
  - Chat sidebar overlay on mobile
key_files:
  - frontend/src/components/Navbar.tsx
  - frontend/src/app/chat/[agentId]/page.tsx
  - frontend/src/app/agent/[agentId]/page.tsx
  - frontend/src/app/deploy/page.tsx
  - frontend/src/app/page.tsx
  - frontend/src/app/registry/page.tsx
  - frontend/src/app/dashboard/page.tsx
duration: 12m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Make all pages mobile-responsive at 375px

**Added hamburger menu to Navbar, fixed all grid layouts and padding for mobile viewport across all 6 pages.**

## What Happened

**Navbar**: Added hamburger menu with open/close toggle (☰/✕ SVG icons). Desktop nav links hidden on mobile (`hidden md:flex`). Mobile shows Connect Wallet + hamburger. Menu expands to show Deploy/Registry/Dashboard links with backdrop blur.

**Chat page**: Sidebar defaults to closed (was open). On mobile, sidebar overlays with dark backdrop instead of pushing content. Reduced padding throughout (px-3 sm:px-6). Model selector capped at 140px width on mobile.

**AgentScan**: Call breakdown grid changed from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`. Reduced outer padding to `px-4 sm:px-6`.

**Deploy**: Service grid changed from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`. Reduced outer padding.

**Landing page**: Hero text reduced to `text-4xl` on mobile (was `text-5xl`). Template grid gets `sm:grid-cols-3` breakpoint. All section padding reduced to `px-4 sm:px-6`. Footer stacks vertically on mobile.

**Registry & Dashboard**: Reduced outer padding to `px-4 sm:px-6`.

## Verification

- `cd frontend && npx next build` — passes clean
- Visual verification at 390x844 (mobile preset) across all 6 pages — no horizontal overflow, readable text, usable navigation
- Hamburger menu opens/closes correctly, nav links functional
