# CineGrade web rework plan

## Context

CineGrade is the social side of the desktop grading app: people share `.cgedit` and `.cube` looks. Today the web app is only a register, activate and login demo, it is publicly reachable at cinegrade.duckdns.org from a home PC, and the activation flow is broken. The goal is a fresh-start rebuild of auth plus the core product.

**Is 2 days enough?** Yes for the core below, if they are two real working days. Admin UI, comments and replies are cut first, as you decided. Desktop integration is the riskiest remaining item.

**Who does what:** you write the backend, the Angular wiring and the desktop changes. Claude writes the Angular UI only (templates, CSS, typed component state, with `// WIRE:` markers where your service calls go).

**Before starting:** commit the current uncommitted package rename, so the rework starts from a clean diff.

## What actually went wrong

You were never really logged in on the other device. Activation returns no token, and `/home` has no guard, so anyone can open it.

| Problem | Where | Fix |
|---|---|---|
| Activation code can be reused until it expires, `validatedAt` is written but never checked | `AuthenticationService.java:95` | Single use |
| Code is not tied to an account, so a guess can activate a stranger. 6 digits, public endpoint, no attempt limit | `AuthenticationController.java:41`, `TokenRepository.findByToken` | `POST` with email + code, max 5 attempts |
| Two users holding the same code makes `findByToken` throw | `Token.java:28` | Look up by user |
| An expired code re-sends mail, so anyone can trigger email spam | `AuthenticationService.java:100` | Separate resend endpoint, 60 s cooldown |
| No route guards, no HTTP interceptor | `app.routes.ts`, `main.ts` | Guard + interceptor |
| Bad or expired JWT throws inside the filter instead of giving 401. The `/api/v1/auth` skip never matches because `getServletPath()` excludes the context path | `JwtFilter.java:33,52` | Catch `JwtException`, continue as anonymous, delete the skip |
| Authorities have no `ROLE_` prefix, so `hasRole` never matches. ADMIN is never seeded | `User.java:73`, `CinegradeApplication.java:23` | Add prefix, seed both roles |
| Filter never checks enabled/locked, so banned users keep working | `JwtService.isTokenValid` | Check on every request |
| Validation errors return 500, catch-all leaks `e.getMessage()` | `GlobalExceptionHandler.java:59,67` | 400, 409, generic 500 |
| `/api/...png` hits the nginx static-file regex and 404s | `nginx.conf:34` | Change to `location ^~ /api/` |

The employee manager app has no security code, so there is no RBAC to reuse.

## Your design questions

- **Four roles?** Two: `USER` and `ADMIN`. "Not activated" is the existing `enabled` flag. A visitor is simply a request with no token, so there is no row to store.
- **Move description out of the users table?** No. A separate table adds no protection. The real risk is serializing the entity, since `User` carries the password hash. Controllers only ever return DTOs.
- **Likes on the user or the post?** Neither, a `likes` table with primary key `(post_id, user_id)`. That enforces one like per person, and counts come from a query.
- **`tag_ids` column?** Use a `post_tags` join table, otherwise you can't index or filter by tag.
- **Sign username + password into a token?** Never put the password in a token. A signed token also can't be revoked, and refreshing it on every request needs database state anyway. That need is what refresh tokens solve.
- **Kick idle users after 15 minutes?** No, that's for banking-style sites. The 15 minutes applies to the access token, which renews silently.
- **Desktop role?** No. Role says who you are, client type says what you're using. It goes in the token.
- **Bloom filter:** fine, and it's honest if used correctly (below).

### Things you missed

- **Preview image on posts.** Without it the feed is a list of text, so it's required.
- **File storage details:** storage key, original name, owner, content type.
- **Upload validation**, since files land on your home PC.
- **Timestamps** on posts, a `download_count`, and indexes.
- Avatar doesn't need its own table, it's a `files` row of type `IMAGE`.

## Schema

`ddl-auto: update` is fine after the wipe. Usernames and emails are stored lowercase, so the plain unique constraint is case-insensitive.

```
roles        id, name UNIQUE, created_at
users        id, role_id FK, username UNIQUE, email UNIQUE, password, avatar_file_id FK NULL,
             description(500) NULL, enabled, account_locked, created_at, updated_at
files        id, owner_id FK, type(LUT|CGEDIT|IMAGE), storage_key UUID UNIQUE, original_name,
             content_type, size, width NULL, height NULL, created_at
posts        id, user_id FK, title, description, preview_file_id FK NOT NULL,
             cgedit_file_id FK NULL, lut_file_id FK NULL, download_count, created_at, updated_at
             CHECK (cgedit_file_id IS NOT NULL OR lut_file_id IS NOT NULL)
tags         id, name UNIQUE, description, color
post_tags    post_id, tag_id                   PK(post_id, tag_id)
likes        post_id, user_id, created_at      PK(post_id, user_id)
registration_tokens  id, user_id FK, code, attempts, created_at, expires_at, validated_at
sessions     id, user_id FK, token_hash UNIQUE, client_type(WEB|DESKTOP), device_name NULL,
             created_at, last_used_at, expires_at, revoked_at NULL

If time allows:
comments     id, user_id FK, post_id FK, text, created_at   + posts.comments_enabled
```

Indexes: `posts(created_at)`, `posts(user_id)`, `likes(user_id)`, `post_tags(tag_id)`, `registration_tokens(user_id)`. Replies are dropped. Tags are seeded at startup, since the admin UI is cut.

## Sessions and tokens

| | Web | Desktop |
|---|---|---|
| Access token | JWT, 15 min, kept in memory (not `localStorage`) | JWT, 15 min |
| Refresh token | `HttpOnly; Secure; SameSite=Strict` cookie, `Path=/api/v1/auth` | In the response body, stored encrypted with DPAPI (`Crypt32Util`, jna-platform) |
| Lifetime | Sliding 14 days | Sliding 90 days |

- JWT `sub` becomes the immutable user id, so changing username doesn't break sessions. Add a `client` claim. Access tokens aren't stored.
- Refresh tokens are 256-bit random values, only the SHA-256 is stored in `sessions`. Revoking means setting `revoked_at`.
- Changing password revokes all sessions.
- Make the cookie's `Secure` flag configurable, because dev is plain HTTP.
- Rotation of refresh tokens is deliberately left out: on the web, two tabs refreshing at once log each other out.
- Login takes `login` (username or email) + password. Usernames match `^[a-z0-9_]{3,30}$`, so no `@` and no ambiguity.

## RBAC

Deny by default. `JwtFilter` loads the user and grants `ROLE_x` plus `CLIENT_WEB` or `CLIENT_DESKTOP`.

| Action | Visitor | Not activated | USER web | USER desktop | ADMIN |
|---|---|---|---|---|---|
| Landing, feed, search, post, profile | yes | yes (can't log in) | yes | via WebView, logged out | yes |
| Download | no | no | yes | yes | yes |
| Create post | no | no | yes | yes | yes |
| Like, edit or delete own post, account settings | no | no | yes | no | yes |
| Manage any user, post or tag | no | no | no | no | yes |

Ownership is checked in the service layer (`post.user_id == currentUser`, or admin). The desktop limit is least privilege for the stored token, not a limit on the person, who can still log in on the web.

## Endpoints (under `/api/v1`)

```
Auth (public)
POST /auth/register                 {username, email, password}
GET  /auth/username-available?username=
POST /auth/activate                 {email, code}
POST /auth/activate/resend          {email}
POST /auth/login                    {login, password}               -> access + cookie
POST /auth/desktop/login            {login, password, deviceName}   -> access + refresh
POST /auth/refresh                  cookie (web) or body (desktop)
POST /auth/logout

Public reads
GET  /posts?q=&tag=&author=&sort=new|popular&page=&size=
GET  /posts/{id}      /tags      /users/{username}      /users/{username}/posts
GET  /files/{id}                    IMAGE type only, never LUT or CGEDIT

Authenticated
GET    /posts/{id}/download/{lut|cgedit}                   [web + desktop]
POST   /posts      multipart: meta, preview, cgedit?, lut? [web + desktop]
GET    /users/me                                           [web + desktop]
PATCH  /posts/{id}      {title, description, tagIds}       [web only from here down]
DELETE /posts/{id}
PUT | DELETE /posts/{id}/like
PATCH  /users/me        {description}
PUT    /users/me/username
PUT    /users/me/password
PUT | DELETE /users/me/avatar
GET    /users/me/sessions      DELETE /users/me/sessions/{id}

Admin (Swagger only for now)
GET /admin/users?q=     PATCH /admin/users/{id}   {locked, role}
DELETE /admin/posts/{id}     POST | PATCH | DELETE /admin/tags

If time allows
GET | POST /posts/{id}/comments     DELETE /comments/{id}
```

Feed DTOs include `likeCount` and `likedByMe`, fetched in one batch per page to avoid N+1 queries. Search is `ILIKE` on title and description.

## Bloom filter

Used only behind `/auth/username-available`, with Guava, built from the database at startup.

- "Definitely not present" answers **available** without a query.
- "Maybe present" falls through to the database.
- Never report a name as taken from the filter alone. Renamed-away names stay in the filter and correctly fall through.
- The unique constraint stays the source of truth. A lost race at save returns 409.

## Files

- Store at `${UPLOAD_DIR}/<uuid>` in a new named volume mounted to the backend in `compose.yml`. The client's filename never touches the path.
- Validate by content: `.cgedit` parses as JSON with `formatVersion` and `editState`, `.cube` is text with `LUT_3D_SIZE`, images decode via `ImageIO` and must be JPEG or PNG. No SVG.
- Serve with a fixed content type, `Content-Disposition: attachment` for downloads, and `X-Content-Type-Options: nosniff`.
- Web downloads use `fetch` with the Bearer token, then save the blob, because a plain link can't send the header.

## Desktop

- Native JavaFX login dialog calls `/auth/desktop/login`.
- Native publish dialog in the editor calls `POST /posts`.
- `SocialsController` loads the deployed URL with `?embed=desktop` and exposes a Java bridge via `JSObject.setMember`.
- In embed mode the site hides account navigation, and Download calls the bridge, which downloads with the desktop token.
- Do a 15-minute check first that the production Angular build runs in JavaFX WebView. It hasn't been verified, and it decides whether this approach holds.

## UI (Claude)

Dark theme taken from the desktop app's `theme.css` tokens, so both products feel like one. Generated files get the `[AI-GENERATED]` marker your desktop code uses.

Pages: landing `/`, feed `/explore`, post `/post/:id`, profile `/u/:username`, new post `/new`, account `/me` (profile, username with live availability, my posts, signed-in devices), reworked login, register and activate, app shell, embed mode.

## Schedule

| When | You | Claude |
|---|---|---|
| Day 1 morning | Bugs above, roles, users, activation, sessions, refresh, security rules | Theme, shell, landing, login, register, activate |
| Day 1 afternoon | Files, posts, tags, likes, download | Feed, post detail, new post |
| Day 2 morning | `/users/me`, search, Bloom, `npm run api-gen`, interceptor, guards, wiring | Profile, account page, embed mode |
| Day 2 afternoon | Desktop, wipe prod volume `cinegrade_db_prod`, deploy, end-to-end test | Polish, responsive fixes |
| Only if time remains | Comments, then admin UI, then login rate limiting (Bucket4j) | Matching UI |

Note: `app.config.ts` is unused, `main.ts` bootstraps the app directly, so the interceptor goes in `main.ts`.

## Verification

Backend tests with MockMvc:
- A reused activation code fails. A correct code with the wrong email fails. The sixth attempt fails even with the correct code.
- An expired JWT gives 401, on protected endpoints and without breaking `/auth/login`.
- A visitor can `GET /posts` but gets 401 on download.
- A desktop token can `POST /posts` and download, and gets 403 on `PATCH /users/me`.
- User A gets 403 deleting user B's post, and admin succeeds.
- A locked user is rejected on the very next request.
- Direct `GET /files/{id}` on a cgedit file is refused.

End to end on the deployed site, using a second device: register, activate, confirm that the second device is not logged in and `/me` redirects, log in, publish, like, search, download. From the desktop app: log in, restart and stay logged in, publish, download from the WebView.
