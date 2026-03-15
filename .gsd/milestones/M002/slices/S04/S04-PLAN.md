# S04: Mobile-Responsive UI

**Goal:** All pages render correctly on 375px mobile viewport with no horizontal overflow, readable text, and usable navigation.
**Demo:** Browse all 6 pages at 375px — navbar has hamburger menu, layouts stack vertically, no horizontal scroll.

## Must-Haves

- Navbar hamburger menu on mobile (hidden nav links, slide/toggle menu)
- All pages render without horizontal overflow at 375px
- Chat sidebar auto-collapsed on mobile
- Grid layouts stack to single column on mobile
- Touch-friendly tap targets (min 44px)

## Verification

- `cd frontend && npx next build` passes
- Visual check at 375px viewport on all pages via browser tools

## Tasks

- [x] **T01: Make all pages mobile-responsive at 375px** `est:20m`
  - Why: Single task covering Navbar hamburger menu and responsive fixes across all pages
  - Files: `frontend/src/components/Navbar.tsx`, `frontend/src/app/chat/[agentId]/page.tsx`, `frontend/src/app/agent/[agentId]/page.tsx`, `frontend/src/app/deploy/page.tsx`, `frontend/src/app/page.tsx`
  - Do: Add hamburger menu to Navbar. Fix chat sidebar (auto-close on mobile, overlay instead of push). Fix grid layouts (grid-cols-1 on mobile). Reduce padding on mobile. Ensure no horizontal overflow.
  - Verify: `cd frontend && npx next build` passes; visual check at 375px
  - Done when: All 6 pages render correctly at 375px with usable navigation

## Files Likely Touched

- `frontend/src/components/Navbar.tsx`
- `frontend/src/app/chat/[agentId]/page.tsx`
- `frontend/src/app/agent/[agentId]/page.tsx`
- `frontend/src/app/deploy/page.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/registry/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
