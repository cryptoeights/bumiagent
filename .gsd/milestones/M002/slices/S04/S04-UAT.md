# S04: Mobile-Responsive UI — UAT

**Milestone:** M002
**Written:** 2026-03-15

## UAT Type

- UAT mode: human-experience
- Why this mode is sufficient: Mobile responsiveness is a visual/interaction quality — requires human viewport verification.

## Preconditions

- Frontend running locally or deployed
- Browser with device emulation (Chrome DevTools) or actual mobile device

## Smoke Test

Open any page at 375px viewport width — hamburger menu icon (☰) should be visible in top-right of navbar, nav links should be hidden.

## Test Cases

### 1. Navbar hamburger menu

1. Set viewport to 375px wide
2. Open any page
3. **Expected:** Navbar shows logo + Connect Wallet + hamburger icon (☰). No text nav links visible.
4. Tap hamburger icon
5. **Expected:** Menu slides down showing Deploy, Registry, Dashboard links
6. Tap a link
7. **Expected:** Navigates to page, menu closes

### 2. Landing page at 375px

1. Open `/` at 375px
2. **Expected:** Hero text fits without overflow, "Launch Agent" and "Browse Agents" buttons visible, 3 stat badges visible in a row, template grid in 2 columns
3. Scroll to bottom
4. **Expected:** Footer text centered, no horizontal overflow

### 3. Deploy page at 375px

1. Open `/deploy` at 375px
2. **Expected:** Form fields full width, all inputs reachable, template selector dropdown works

### 4. Registry page at 375px

1. Open `/registry` at 375px
2. **Expected:** Search bar full width, agent cards stack in single column, no horizontal overflow

### 5. Dashboard at 375px

1. Open `/dashboard` at 375px
2. **Expected:** Stat grid in 2 columns, agent cards readable

### 6. Chat page at 375px

1. Open `/chat/:agentId` at 375px
2. **Expected:** Sidebar hidden, chat area full-width, input and send button visible at bottom, model selector compact
3. Tap sidebar toggle (▷)
4. **Expected:** Sidebar overlays with dark backdrop, doesn't push content
5. Tap outside sidebar or toggle
6. **Expected:** Sidebar closes

### 7. AgentScan at 375px

1. Open `/agent/:agentId` at 375px
2. **Expected:** Stat grid 2 columns, call breakdown stacks to single column, trust tier progress bar full width

### 8. No horizontal scroll on any page

1. Visit each of the 6 pages at 375px
2. Try to scroll horizontally
3. **Expected:** No horizontal scroll on any page

## Edge Cases

### Navbar menu z-index

1. Open hamburger menu on a page with floating elements
2. **Expected:** Menu appears above all page content

### Chat with long agent name

1. Open chat for agent with 20+ character name at 375px
2. **Expected:** Name truncates or wraps cleanly, no layout break

## Failure Signals

- Horizontal scrollbar appears at 375px — layout overflow
- Hamburger icon missing — Navbar responsive breakpoint wrong
- Chat input hidden behind keyboard — padding/position issue
- Nav links visible on mobile without hamburger open — responsive hiding broken

## Requirements Proved By This UAT

- All pages pass mobile viewport visual check at 375px (M002 success criterion)

## Not Proven By This UAT

- Touch gesture interactions (swipe, pinch)
- Actual mobile browser rendering (tested via Chrome emulation)

## Notes for Tester

- Console errors about "ERR_CONNECTION_REFUSED" are expected if backend isn't running — these are API calls, not layout issues.
- Test at exactly 375px width for iPhone SE (smallest common smartphone) and 390px for iPhone 14.
