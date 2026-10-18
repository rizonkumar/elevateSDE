# Feature Plan: Shell Navigation Redesign (Sidebar, Header, ⌘K)

Gives the web dashboard and the admin backoffice one calm, consistent app shell. The sidebar is navigation only, grouped by what the user is trying to do. The header carries page context (breadcrumb), search (⌘K command palette) and identity (notifications + account menu).

---

## 1. Problems

**Web dashboard**
- 16 links in one flat list (17 for tenant admins, plus an Admin Console footer link for admins). It scrolls on laptop screens.
- Notifications and Profile duplicate the header bell and the account menu.
- The sidebar footer mixes Admin Console, the theme toggle and the collapse button.
- "Code Editor" names a tool, not a destination.
- The header is empty on the left on desktop. The account menu shows the raw `TENANT_ADMIN` role and offers only Log out.
- In rail mode the Review count is hidden. The mobile drawer has no transition, scroll lock or focus handling, and links have no `aria-current`.

**Admin backoffice**
- 12 links in one flat list with a loud solid-fill active state.
- Matching is exact, so nested routes (`/learning-paths/<id>`) lose the highlight and the header title.
- The collapse toggle lives in the header, unlike web. Theme and logout are crammed into the sidebar footer. The Admin tag uses hardcoded `zinc-*` colors. There's no way back to the main app.

---

## 2. Information Architecture

**Web**

| Group | Links |
|---|---|
| — | Dashboard |
| Practice | Daily Challenge, Problems (`/dashboard/assessment`), Review (due badge), Prep Tracks, My Lists |
| Career | Interview Readiness, Mock Interview, Resume Analyzer, Job Tracker |
| Community | Contests, Leaderboard, Discussions (`/dashboard/forum`), Achievements |
| Manage (role-gated) | Organization (TENANT_ADMIN), Admin Console ↗ (ADMIN) |

Profile and Notifications leave the sidebar. They stay reachable from the account menu, the bell and ⌘K.

**Admin**

| Group | Links |
|---|---|
| — | Overview |
| People | Users, Tenants |
| Content | Coding Problems, Daily Challenges, Contests, Learning Paths, Badges |
| Community | Forum Moderation, Leaderboard |
| System | Feature Flags, Audit Logs |

---

## 3. Shell Anatomy (both apps)

- **Sidebar:** 56px brand row; small uppercase group labels; 36px rows. The active row uses soft accent background, an accent icon, a 2px accent bar and `aria-current="page"`. The active item is found by longest-prefix match. The footer holds only the collapse toggle (desktop). Rail mode is 64px wide, with dividers instead of labels and custom hover/focus tooltips; the Review count becomes a dot.
- **Mobile drawer:** slide-in transition, body scroll lock, Esc to close, focus moves into the drawer and back to the trigger.
- **Header (56px):** menu button (mobile) + `Group / Page` breadcrumb; a search trigger with a `⌘K` hint; the notification bell (web); the account menu.
- **Account menu:** identity + humanized role, Profile, Notifications, Appearance (Light / Dark / System), Admin Console ↗ (ADMIN), Sign out. In admin: Appearance, Open ElevateSDE ↗, Sign out.
- **Command palette:** ⌘K / Ctrl+K. Sections come from the nav config plus hidden pages and actions (switch theme, sign out), filtered by role and matched on label + keywords. Combobox/listbox ARIA, arrow keys + Enter, Esc closes.

---

## 4. Implementation

**Shared (`packages/ui/src/shell`)**: one implementation for both apps
- `ShellSidebar`, `ShellNavGroup`, `ShellNavLink`, `ShellTooltip`: take a `LinkComponent` so the package stays framework-agnostic.
- `ShellTopbar`, `ShellSearchTrigger`, `ShellAccountMenu` / `ShellMenuItem`, `AppearanceSwitch`, `CommandPalette`.
- `use-theme.ts` (light/dark/system external store), `command-palette-store.ts` (open state + ⌘K hotkey), `nav-match.ts` (longest-prefix active match).

**Web (`apps/web/src`)**
- `lib/dashboard-nav.ts`: grouped config, `buildNavGroups(role)`, `buildRouteGroups(role)`, `findActiveDashboardItem`.
- `components/dashboard/`: thin wrappers `Sidebar`, `DashboardTopbar`, `UserMenu`, `DashboardCommandPalette`, `BrandMark`.
- `hooks/use-session-role.ts`: role only after hydration, so role-gated groups don't cause a hydration mismatch.
- `lib/user-display.ts`: `getRoleLabel(role)`.

**Admin (`apps/admin/src`)**
- `lib/admin-nav.ts`: grouped config + `findActiveAdminItem`.
- `components/AdminLayout.tsx` composes the shared shell with `AdminBrandMark`, `AdminUserMenu` and `AdminCommandPalette`. Pages keep importing `AdminLayout` unchanged.
- "Open ElevateSDE" uses `NEXT_PUBLIC_WEB_URL` (falls back to same-origin `/dashboard`, which works behind the web `/admin` rewrite).

---

## 5. Tasks

- [x] Branch `feature/shell-navigation-redesign`
- [x] Web nav config + theme hook
- [x] Web sidebar, header, account menu, command palette
- [x] Admin nav config, sidebar, header, account menu, command palette
- [x] Lint + type-check both apps
- [x] Browser check (1440 + 390, light + dark, ADMIN role; API mocked because local DB is behind on migrations)

---

## 6. Verification

- `pnpm --filter @elevatesde/web lint type-check` and the same for `@elevatesde/admin`.
- Web as USER / TENANT_ADMIN / ADMIN: groups and Manage links, active state on nested routes, Review badge (expanded + rail dot), collapse persistence, drawer behaviour, immersive assessment route still hides the header.
- ⌘K: open/close, keyboard navigation, role filtering, theme action.
- Admin: grouped nav, active state + breadcrumb on `/learning-paths/<id>`, account menu actions.
