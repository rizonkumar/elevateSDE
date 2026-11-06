# Feature Plan: Engagement and Social

> **Status: DONE.** Approved with the default answers to the open questions. All four phases are implemented. Branch: `feature/engagement-and-social` (cut from `main`).

Four improvements that make progress visible and shared:

1. **Public profile.** A shareable `/u/[handle]` page with the heatmap, badges, contest rating and solved stats.
2. **Contest ratings.** An Elo-style rating with history, alongside the existing contest points.
3. **Real-time updates.** Socket.io for live contest standings, live notifications and peer practice presence.
4. **Study groups.** Cohorts inside an organization with shared goals and a group leaderboard.

The order is A → B → C → D. Each phase is its own commit series and works without the later ones. B feeds the profile built in A, and D uses the real-time layer from C. Phases are self-contained, so the branch can be split into separate PRs if review gets too large.

---

## 0. What exists today

- `User` has `firstName`, `lastName` and `headline`, but no handle, bio, links or visibility setting. The only profile is the private `dashboard/profile` page, fed by `profile.store`.
- `ContributionHeatmap` renders `SubmissionHeatmapCellDto[]`. The data comes from `dashboard/submission-heatmap.controller.ts`, which only serves the caller's own submissions.
- `UserStats` holds points, streaks and `badges`; `UserBadge` holds the awards.
- Contests are platform-wide: `Contest.tenantId` exists, but the repository does not filter on it. `ContestFinalizationService` ranks participants with `rankContestParticipants`, awards `CONTEST_RESULT` points and writes `finalRank`, `finalScore` and `finalPenaltySeconds` on `ContestParticipant`. The scheduler drives it.
- Standings are computed at read time. `contests/[slug]/standings/page.tsx` polls every 15 s, and `notifications.store` polls the unread count every 45 s.
- `NotificationService.notify` checks preferences, then writes a row. Events go through `@nestjs/event-emitter`, and `code-execution.processor` emits `SUBMISSION_ACCEPTED`.
- Socket.io is in `architecture.md` but not installed anywhere. Auth is a Bearer access token (`ExtractJwt.fromAuthHeaderAsBearerToken`), and `@elevatesde/api-client` renews it with the refresh token.
- `PeerPracticeSession` links an organizer and an invitee and stores an external `meetingUrl`.
- Organizations are `Tenant` rows with `TENANT_ADMIN` users. `PointLedger` records every point award with `userId`, `tenantId`, `source`, `refId` and `createdAt`.
- Deployment: the API runs as one PM2 fork process behind Tailscale Funnel; web and admin run on Vercel.
- `main` includes plan 43 (taxonomy, assisted solves, code review). The public profile can show top topics from `ProblemTopic`, and assisted solves already earn no `PROBLEM_SOLVED` points, so group goals do not count them.

---

## Phase A: Public Profile

### Schema
```prisma
enum ProfileVisibility { PRIVATE PUBLIC }

model User {
  handle             String?           @unique
  bio                String?
  location           String?
  githubUrl          String?
  linkedinUrl        String?
  websiteUrl         String?
  profileVisibility  ProfileVisibility @default(PRIVATE)
  showOrganization   Boolean           @default(false)
}

model Tenant {
  allowPublicProfiles Boolean @default(true)
}
```
- Handles are stored in lowercase. They must match `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$` (3 to 30 characters) and must not be on a reserved list (`admin`, `api`, `me`, `settings`, `u`, `login`, `register`, `dashboard`, `support`, and similar).
- Existing users start with no handle and a private profile, so nothing becomes public without the user acting.

### Backend (new DDD module `public-profile`)
- It is read only. It assembles data from `users`, `dashboard`, `achievement`, `leaderboard` and (after Phase B) `contest`, through their application services, and never queries their tables directly.
- `GET /v1/public/profiles/:handle` needs no auth and is rate limited per IP with the existing rate-limit guard. It returns `404` both when the handle does not exist and when the profile is private or the tenant disallows public profiles, so the endpoint cannot be used to find out which handles exist. It sends `Cache-Control: public, max-age=60`.
- The response holds:
  - Display name, handle, headline, bio, location, links, the month the user joined, and the organization name only if `showOrganization` is on.
  - Solved counts by difficulty against the published totals, and the top 8 topics by problems solved.
  - Current and longest streak, and total points.
  - Earned badges with their award dates.
  - The heatmap for the last 365 days.
  - The 10 most recent accepted problems (titles and slugs, published problems only, no code).
  - After Phase B: the current rating, peak rating and rating history.
- It never includes the email, job tracker, resumes, notes, private lists, mock interviews or submission code.
- `GET /v1/users/me/handle-availability?handle=` returns `{ available, reason }`, where `reason` is `TAKEN`, `RESERVED` or `INVALID`.
- `PATCH /v1/users/me/public-profile` updates the handle, bio, location, links, visibility and `showOrganization`. Links must be `https` URLs; GitHub and LinkedIn links must be on those domains. A unique-constraint violation maps to `409`. Making a profile `PUBLIC` requires a handle.
- `PATCH /v1/organization/settings` lets a `TENANT_ADMIN` set `allowPublicProfiles`.
- `DashboardService.getSubmissionHeatmap` is reused as is. The public module passes the profile owner's id.

### Web
- New route `app/u/[handle]/page.tsx`. It sits outside `/dashboard`, so the `proxy.ts` auth matcher does not apply.
  - It is a Server Component. It awaits `params`, as Next.js 16 requires, and fetches the public endpoint with `next: { revalidate: 60 }`. It calls `notFound()` on `404`.
  - `generateMetadata` sets the title, description and Open Graph tags. `opengraph-image.tsx` renders a share card with the name, rating and solved count.
  - Sections: a header card with links; solved stats with difficulty rings, reusing the dashboard ring; the heatmap (`ContributionHeatmap` is already a client component, so the server passes it the cells); badges; a rating card and chart after Phase B; recent solves.
  - A light top bar with the logo and either "Open dashboard" or "Sign in".
- `dashboard/profile` gets a **Public profile** settings card. It has a handle field with a debounced availability check, bio, location, links, a visibility toggle, a "Show organization" toggle, and **Copy link** and **View** actions.
- Leaderboard and contest standings rows link to `/u/[handle]` when that profile is public. The row DTOs get a nullable `publicHandle`.
- `dashboard/org` gets an "Allow public profiles" toggle for tenant admins.

---

## Phase B: Contest Ratings

### Schema
```prisma
model Contest {
  isRated  Boolean   @default(true)
  ratedAt  DateTime?
}

model UserRating {
  userId        String    @id
  rating        Int       @default(1500)
  peakRating    Int       @default(1500)
  contestsRated Int       @default(0)
  lastRatedAt   DateTime?
  updatedAt     DateTime  @updatedAt
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([rating(sort: Desc)])
}

model ContestRatingChange {
  id          String   @id @default(uuid())
  contestId   String
  userId      String
  tenantId    String?
  rank        Int
  oldRating   Int
  newRating   Int
  delta       Int
  performance Int
  createdAt   DateTime @default(now())
  contest     Contest  @relation(fields: [contestId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([contestId, userId])
  @@index([userId, createdAt])
  @@index([tenantId])
}
```

### Rating algorithm (pure domain function `computeRatingChanges`)
This is a simplified Codeforces-style multiplayer Elo.
1. Everyone starts at 1500. The probability that A beats B is `1 / (1 + 10^((Rb − Ra) / 400))`.
2. Expected rank (seed): `seed_i = 1 + Σ_{j≠i} P(j beats i)`.
3. Target rank: `m_i = sqrt(seed_i × actualRank_i)`. Tied participants share the average of their positions.
4. Performance: binary search over `[0, 4000]` for the rating `R` whose seed against the other participants equals `m_i`.
5. Raw change: `delta_i = (performance_i − rating_i) / 2`.
6. Zero-sum correction: shift every delta by `−Σdelta / n`, never upwards, so the total rating in the pool does not inflate.
7. Round to integers and floor ratings at 0.

This runs in O(n² · log R), which is fine up to a few thousand participants. Unit tests use fixed golden inputs: two players, all tied, an upset, a newcomer against veterans, the zero-sum property, and deterministic output.

### Who is rated
- Only participants with at least one judged submission on a contest problem inside the contest window. Users who registered but never submitted are not rated and their rating does not change.
- A contest with fewer than 2 rated participants is marked `ratedAt` with no changes.
- `isRated = false` contests are skipped. Admins can toggle `isRated` until the contest ends; after that it is locked.

### Backend (inside the `contest` module, new `ContestRatingService`)
- After `finalizeEnded`, the scheduler calls `ratePending()`. It loads finalized, rated contests with `ratedAt IS NULL`, **oldest `endsAt` first**, and rates them one at a time, so ratings are always applied in chronological order.
- Each contest is rated in one transaction:
  1. Claim it with `updateMany where ratedAt is null`.
  2. Read the current `UserRating` rows.
  3. Compute the changes.
  4. Insert the `ContestRatingChange` rows.
  5. Upsert `UserRating`.
  If the claim fails, another run already did the work and this one exits.
- Rating does not change contest points. `CONTEST_RESULT` points keep flowing to the leaderboard as they do today.
- A `CONTEST_RATING_UPDATED` notification goes to each rated participant, for example "Weekly Contest 12: 1540 → 1588 (+48)". The dedupe key is `rating:{contestId}:{userId}`.
- Endpoints:
  - `GET /v1/contests/ratings/me` returns the current rating, peak, number of rated contests and history.
  - `GET /v1/contests/ratings/leaderboard?scope=platform|tenant` lists rated users by rating, paginated.
  - The contest detail and standings DTOs get `ratingDelta` per row once the contest is rated.
- Backfill: a one-off command, `pnpm --filter api ratings:backfill`, replays every finalized contest in `endsAt` order through the same service. It is idempotent because of `ratedAt`.

### Web and admin
- A rating card on `dashboard/contests` and on the profile pages: the current rating, peak, a tier label, and a line chart of the history built with Recharts. Each point links to its contest.
- Tier labels are for display only: Newcomer (< 1400), Specialist (1400–1599), Expert (1600–1899), Master (1900–2199), Grandmaster (2200+). A user with fewer than 3 rated contests is marked "Provisional".
- Final standings show a `+48` or `−12` delta column after rating.
- The leaderboard page gets a **Contest rating** tab next to the points tabs.
- Admin: an `isRated` switch in the contest form, and a "Rated" or "Unrated" chip in the contest list.

---

## Phase C: Real-time Updates (Socket.io)

### Dependencies
- API: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `@socket.io/redis-adapter`.
- Web: `socket.io-client`.
- The Redis adapter uses the existing `REDIS_URL`. There is only one PM2 instance today, but the adapter makes it safe to scale out later, and the cost is one extra Redis connection pair.

### Backend (new infrastructure module `realtime`)
- `RealtimeGateway` uses the `/realtime` namespace, with CORS taken from `CORS_ALLOWED_ORIGINS`.
- **Handshake auth:**
  - The client sends `auth: { token }`.
  - Middleware verifies the token with the same secret, checks `isAccessTokenPayload`, and loads the user through `UsersService`. Anyone who is not `ACTIVE` is rejected.
  - The server schedules a disconnect at the token's `exp`. The client then refreshes the token through the api-client and reconnects.
- **Rooms:** `user:{id}` is joined automatically. `contest:{id}`, `peer:{sessionId}` and `group:{id}` are joined on request after an authorization check:
  - Contests: anyone authenticated, but the contest must not be a draft.
  - Peer sessions: only the organizer or the invitee.
  - Groups: members only.
- Subscribe messages are rate limited per socket, at 20 per 10 s.
- **Port:** `RealtimePublisher` in the domain has `toUser`, `toContest`, `toPeerSession` and `toGroup`. The Socket.io adapter implements it, and a no-op fake is used in tests. Feature modules depend only on the port and never on Socket.io.
- Event payloads are typed in `@elevatesde/shared-types` as a `ServerToClientEvents` and `ClientToServerEvents` map, which both sides use.

### Live notifications
- After the row is written, `NotificationService.notify` publishes `notification:new` with `{ notification, unreadCount }` to `user:{id}`. Marking items read publishes `notification:unread-count`.
- Web: `notifications.store` subscribes to both events. Polling only runs while the socket is disconnected, at the existing 45 s interval, and stops once the socket connects.

### Live contest standings
- `code-execution.processor` emits a new `SUBMISSION_JUDGED` event with `{ submissionId, userId, problemId, status, judgedAt }` for every final status, because wrong answers affect the penalty.
- `ContestLiveListener` finds the `LIVE` contests that contain the problem and in which the user is registered.
- For each such contest it debounces with a 2 s trailing window, then:
  1. Recomputes the standings once through `ContestStandingsService`.
  2. Maps them to the same row DTO that the REST endpoint returns, without the viewer flag; clients match their own `userId`.
  3. Publishes `contest:standings` with `{ contestId, rows, generatedAt }`.
- The scheduler publishes `contest:status` when a contest goes live, ends, is finalized or is rated.
- Web: the standings page subscribes on mount and replaces its rows from each event. It shows a "Live" indicator and falls back to the existing 15 s polling while disconnected. The contest detail page reacts to `contest:status`.

### Peer practice presence
- `peer:{sessionId}` broadcasts `peer:presence` with `{ userId, online }` when a participant opens or leaves the session page.
- Session status changes (accepted, cancelled, rescheduled) are pushed as `peer:session-changed`. They still create the existing `PEER_SESSION_CHANGED` notification.
- Web: `PeerPracticePanel` shows "Partner is here" and a shared countdown to `startsAt`, and refreshes on status changes.
- A collaborative code editor is **out of scope**. It needs CRDT syncing (Yjs) and deserves its own plan.

### Web client
- `lib/realtime.ts` creates one lazily connected socket per session. The `auth` callback reads the current access token. If `connect_error` reports `unauthorized`, the client refreshes through the api-client and reconnects. The socket disconnects on logout.
- `realtime.store` (Zustand) tracks the connection state. `useRealtimeRoom(room)` subscribes and unsubscribes with the component lifecycle.

### Deployment
- Tailscale Funnel proxies WebSocket upgrades. Socket.io also falls back to long polling, so it keeps working if upgrades fail.
- Add a step to the smoke test in `docs/deployment-self-hosted.md` that opens a socket from the Vercel origin and receives a test notification.
- Update `architecture.md` to describe the real-time layer as implemented.

---

## Phase D: Study Groups

### Schema
```prisma
enum StudyGroupRole { OWNER MEMBER }
enum StudyGroupJoinPolicy { OPEN INVITE_ONLY }
enum StudyGoalMetric { PROBLEMS_SOLVED POINTS DAILY_CHALLENGES CONTESTS_ENTERED }
enum StudyGoalScope { GROUP_TOTAL EACH_MEMBER }

model StudyGroup {
  id          String               @id @default(uuid())
  tenantId    String
  name        String
  description String?
  joinPolicy  StudyGroupJoinPolicy @default(INVITE_ONLY)
  createdById String?
  archivedAt  DateTime?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  tenant      Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy   User?                @relation("StudyGroupCreator", fields: [createdById], references: [id], onDelete: SetNull)
  members     StudyGroupMember[]
  goals       StudyGroupGoal[]

  @@unique([tenantId, name])
  @@index([tenantId, archivedAt])
}

model StudyGroupMember {
  id       String         @id @default(uuid())
  groupId  String
  userId   String
  tenantId String
  role     StudyGroupRole @default(MEMBER)
  joinedAt DateTime       @default(now())
  group    StudyGroup     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([userId])
  @@index([tenantId])
}

model StudyGroupGoal {
  id          String          @id @default(uuid())
  groupId     String
  tenantId    String
  title       String
  metric      StudyGoalMetric
  scope       StudyGoalScope
  target      Int
  startsAt    DateTime
  endsAt      DateTime
  completedAt DateTime?
  createdAt   DateTime        @default(now())
  group       StudyGroup      @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@index([groupId, endsAt])
  @@index([tenantId])
}
```
- Limits: 200 members per group and 5 active goals per group.

### Progress is derived, not stored
These values are computed at read time, the same way contest standings are:
- **Goal progress** comes from `PointLedger` rows for the group's members inside `[startsAt, endsAt)`:
  - `PROBLEMS_SOLVED` counts `PROBLEM_SOLVED` rows.
  - `POINTS` sums `delta`.
  - `DAILY_CHALLENGES` counts `DAILY_CHALLENGE` rows.
  - `CONTESTS_ENTERED` counts `ContestParticipant` rows whose contest ended inside the window.
- **The group leaderboard** ranks members by points over a window: the current goal, this week, or all time. Ties are broken by problems solved.
- **The activity feed** is the latest 50 `PointLedger` rows for members, joined to problem, daily challenge or contest titles.
- No counters are stored, so there is nothing to drift out of sync.
- Members are filtered to users whose `tenantId` still matches the group's, so someone who leaves the organization drops out without a cleanup job.

### Backend (new DDD module `study-group`)
- **Permissions:**
  - A `TENANT_ADMIN` can create, edit and archive any group in their tenant and assign owners.
  - An `OWNER` manages members and goals.
  - A `MEMBER` can read the group and leave it.
  - Any tenant member can join an `OPEN` group.
  - Users without a tenant have no access.
- Every query is scoped by the caller's `tenantId`. A group from another tenant returns `404`.
- Endpoints:
  - `GET /v1/study-groups` returns my groups and the open groups I can join.
  - `POST /v1/study-groups`, plus `PATCH` and `DELETE` (archive) on `/v1/study-groups/:id`.
  - `POST /v1/study-groups/:id/join` and `/leave`.
  - `POST /v1/study-groups/:id/members` takes `{ userIds }` (members of the same tenant only). `PATCH` and `DELETE` on `/v1/study-groups/:id/members/:userId`.
  - `POST /v1/study-groups/:id/goals`, plus `PATCH` and `DELETE` on `/v1/study-groups/:id/goals/:goalId`.
  - `GET /v1/study-groups/:id` returns the group, members, goals and progress.
  - `GET /v1/study-groups/:id/leaderboard?window=goal|week|all`.
  - `GET /v1/study-groups/:id/activity`.
- `PointsService` emits a new `POINTS_AWARDED` event after each successful award. `StudyGroupActivityListener`:
  1. Finds the active groups of the user who earned the points.
  2. Publishes `group:activity` to `group:{id}`, so the live feed and leaderboard refresh.
  3. Re-checks the active goals and, when a goal is reached, sends `STUDY_GOAL_COMPLETED`. The dedupe key is `goal:{goalId}`, or `goal:{goalId}:{userId}` for `EACH_MEMBER` goals.
- `STUDY_GROUP_ADDED` is sent when someone adds a user to a group.

### Web
- `dashboard/groups` lists my groups and the open groups, with a **Create group** button that only tenant admins see.
- `dashboard/groups/[id]` has four tabs:
  - **Overview:** goal cards with progress bars and days left. `EACH_MEMBER` goals also show how many members have reached the target.
  - **Leaderboard:** with a window switch.
  - **Members:** owners can add members from the tenant roster with a searchable picker, change roles and remove members.
  - **Activity:** a live feed through `useRealtimeRoom('group:{id}')`.
- A sidebar item, "Groups", only for users who belong to a tenant.
- `dashboard/org` gets a "Study groups" summary for tenant admins: each group's member count and active goals.

---

## Shared changes

- New `NotificationType` values `CONTEST_RATING_UPDATED`, `STUDY_GROUP_ADDED` and `STUDY_GOAL_COMPLETED`, added to `ALL_NOTIFICATION_TYPES` and the preferences UI.
- New DTOs and the real-time event maps in `@elevatesde/shared-types`.
- One Prisma migration per phase.
- `architecture.md`: add `public-profile`, `study-group` and `realtime` to the module list, and describe the rating flow.

---

## Testing

- **Unit:**
  - Handle validation and the reserved list.
  - Public profile assembly never leaks private fields; there is a snapshot test of the DTO keys.
  - The rating algorithm golden cases and the zero-sum property.
  - Rating order: the oldest contest is rated first, and repeat runs are idempotent.
  - Choosing who is rated.
  - The standings debounce coalesces bursts of submissions.
  - Goal progress for each metric and scope.
  - Group permissions.
- **Gateway:**
  - Handshakes are rejected for a missing, expired or non-access token and for an inactive user.
  - Room authorization: a non-participant cannot join a peer session room, and a non-member or another tenant's user cannot join a group room.
  - Disconnect when the token expires.
- **Authorization sweep:** public profiles return `404` for private profiles and for tenants that disallow them. Study-group endpoints reject users from other tenants.
- **Web:** Playwright specs for `/u/[handle]`, covering the public, private (404) and metadata cases, and for live standings updating without a reload against a running API.
- **Manual check:**
  - Claim a handle and share the profile in a private window.
  - Run a three-user contest, then check standings update live and ratings land after finalization.
  - Receive a notification without refreshing.
  - Create a group with a goal and watch progress move as a member solves problems.

---

## Decisions (approved defaults)

1. **Default profile visibility.** **Default: private and opt-in.** A profile becomes public only after the user claims a handle and switches it on.
2. **Can organizations turn public profiles off?** **Default: yes**, with `Tenant.allowPublicProfiles`. B2B customers may not want their candidates to be public.
3. **Rating formula.** **Default: the simplified Codeforces-style method above.** Plain pairwise Elo is simpler but behaves badly with many players and ties.
4. **Who gets rated.** **Default: only participants who submitted at least once.** Registering without competing does not cost rating.
5. **Backfill ratings for past contests?** **Default: yes**, through the one-off replay command.
6. **Real-time peer practice scope.** **Default: presence, status updates and a shared countdown only.** A collaborative editor gets its own plan.
7. **Study groups for users without an organization.** **Default: no.** Groups are an organization feature. Friend groups for individual users can follow later.
8. **Who creates groups.** **Default: tenant admins only.** Owners they assign then manage the group.

---

## Deviations from the plan

- **Public profile settings** have their own `GET` and `PATCH /v1/users/me/public-profile` endpoints instead of extending `UserDto`. This keeps the `User` entity and the auth user loading unchanged.
- **The ratings backfill sends no notifications.** It boots a small Nest context without the notification module, so replaying past contests does not notify anyone.
- **Contest lifecycle broadcasts** come from a new every-minute `contests.broadcast-status` scheduled job. It publishes `contest:status` for contests that went live, ended, were finalized or were rated in the last 75 s, because contest status is derived from time rather than written by a transition.
- **Goal notification dedupe keys** are `goal:{goalId}:{recipientId}` for both scopes. `Notification.dedupeKey` is unique across all users, so a single `goal:{goalId}` key would let only the first member be notified. A group-total goal still completes exactly once, through the atomic `completedAt` claim.
- **Role changes** in study groups are limited to organization admins, who assign owners. Owners manage members and goals but cannot remove another owner. The last owner cannot leave; an admin can still demote or remove them.
- **Contests entered** counts a contest only when the member has a judged submission on one of its problems inside the contest window, the same participation rule used for ratings. Registering without competing does not count. Goals are also re-checked when a contest is finalized (a `contest.finalized` event), so a participant who scored nothing, and so earned no points, can still complete a contests-entered goal.
- **Group-added notifications** use the dedupe key `group-added:{groupId}:{recipientId}:{UTC date}`. The key is unique for ever, so a day bucket stops remove-and-re-add spam within a day while a later re-add still notifies.
- **Group rooms are re-checked on removal.** Removing a member, leaving, or archiving a group evicts the affected sockets from the `group:{id}` room straight away, so nobody keeps receiving activity until they reconnect.
- **Contest ratings wait for earlier contests.** `ratePending` stops before any rated contest that has ended but is not finalized yet, so ratings are always applied in chronological order.
- **Admin adjustments** do not count towards group goals, leaderboards or the activity feed, matching how they are excluded from period point totals.

---

## Verification

- `pnpm turbo run type-check lint test` passes: 12/12 tasks, 683 API tests passing (30 integration-gated skipped) and 18 api-client tests. `next build` succeeds for web.
- **Phase A:** `/u/[handle]` was rendered against a fixture API at 1280px and 375px, in light and dark mode, for a full profile, an empty profile and a 404. The profile SQL ran against the throwaway Postgres on empty data.
- **Phase B:** the backfill rated two contests in order against the throwaway Postgres, left out a participant who never submitted, and carried ratings from the first contest into the second. The rating history, both leaderboard scopes and standings ratings returned correct results.
- **Phase C:** the built API ran against the throwaway Postgres and a temporary Redis. A real JWT connected over WebSocket, `notification:new` and `notification:unread-count` arrived end to end, and the API fell back to the in-memory adapter when Redis was unreachable.
- **Phase D:** the repository integration suite (`RUN_DATABASE_INTEGRATION=1`, 6 tests) passed against the throwaway Postgres. It covers tenant-scoped member counts, every goal metric, point totals without admin adjustments, activity titles and links, roster search, duplicate names and the one-time goal completion. The groups list, group detail (all four tabs), the goal and add-member modals, the no-organization state and the organization summary card were checked against a mock API at 1280px and 375px, in light and dark mode, with no horizontal scroll.
- **Not verified:**
  - The dashboard settings card, standings, peer presence and study group pages against the live API in a logged-in browser.
  - Live standings and the group activity feed driven by a real sandboxed submission (both covered by unit tests).
  - Tailscale Funnel WebSocket behaviour.
  - A live LLM provider (not used by this plan).
