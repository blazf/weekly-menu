# lunch@home

A small terminal-styled web app for the family, meant to run on the local server.
Two jobs: browse the recipe collection, and vote on next week's lunches.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · SQLite

## Run it

```bash
cd web
cp .env.example .env      # then edit it — see below
npm install
npm run build
npm start                 # listens on 0.0.0.0:3000
```

Open `http://<server-ip>:3000`.

## Develop

`npm start` only serves the last build — code changes don't show until you
rebuild and restart. For live updates run the dev server **next to it**:

```bash
cd web
npm run dev               # http://localhost:3001, hot reload
```

It uses port 3001 so it doesn't collide with the production server, and reads
the same recipes folder and `lunch.db`. When you're happy, `npm run build` and
restart `npm start`. (Recipe `.md` edits never need a rebuild — both servers
read them on every request.)

## Configure

Everything lives in `web/.env`:

| Variable | What it does |
|---|---|
| `ADMIN_PASSWORD` | Password for `/admin`. **Change it.** |
| `SECRET` | Signs admin cookies and vote links. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `APP_URL` | Base URL family members click, e.g. `http://192.168.1.10:3000`. Wrong value = dead vote links. |
| `FAMILY` | `Name:email` pairs, comma separated. Email may be blank for copy-link-only. |
| `SMTP_*` | Optional. Leave `SMTP_HOST` empty to stay in preview mode. |

## How recipes work

**Recipes are the markdown files in `../recipes/`. There is no database for them
and no CRUD screen.** The app reads the folder on every request, so adding a
recipe is exactly one action: write a new `.md` file.

That is the whole integration surface for an AI agent — see `AGENTS.md` in the
repo root. No API call, no restart, no rebuild.

`web/lunch.db` (SQLite, gitignored) holds only voting rounds, ballots and the
chosen weekly menus.

## Thumbnails

`/api/thumb/<slug>` serves a photo from `public/thumbs/<slug>.jpg` when one
exists, and otherwise falls back to a generated SVG built from the recipe
itself (category-tinted, deterministic). All 30 current recipes ship with a
photo; a newly added recipe gets the generated fallback until you drop a file
in.

To change one, save your own image as `public/thumbs/<slug>.jpg` — `.png`,
`.webp` and `.avif` work too. It's picked up on the next request, no code
change and no restart. 800x600 is the size used here.

The bundled photos come from Wikimedia Commons under the licences listed in
[`public/thumbs/CREDITS.md`](public/thumbs/CREDITS.md). They are placeholders,
not original work — replace them with your own as you cook.

## Voting

1. **Admin creates a round.** `/admin` → `new round`. Defaults to the coming
   Sat–Fri week.
2. **Admin marks days away.** Toggle off any day the family won't eat at home.
   Quotas shrink automatically — switch off both weekend days and the weekend
   section disappears from the ballot.
3. **Admin sends invites.** Each person gets a link containing their name plus
   an HMAC, so no login is needed and the name can't be forged. Without SMTP
   configured, the admin page lists the links to copy manually.
4. **Family votes.** 3–5 weekday lunches, 1–2 weekend lunches (capped by how
   many days are actually active). Re-voting overwrites; there's one ballot per
   person per round.
5. **Admin closes voting** and reads the tally.
6. **Admin sets the menu.** The `menu` panel assigns a dish to each day at
   home — "Fill from votes" seeds it from the tally, every day has a dropdown
   with the voted dishes first and every other lunch-shaped recipe below, so
   the cook can override with something nobody asked for (shown as *chef's
   pick*). "Save menu" stores it; "Email menu to family" sends the week to
   everyone (or, without SMTP, just share the link).
7. **Family sees the result** at `/menu/<round>` — the week's lunches with
   photos and how the vote went. **Vote counts per dish only, never who
   voted for what.** The home page links to it once a menu is saved.

Quotas are enforced server-side in `/api/vote`, not just in the UI. A round
expires on its own once its week is over.

## Layout

```
src/lib/       recipes.ts (markdown parser) · db.ts · thumb.ts · mail.ts · menu.ts
               family.ts (vote tokens) · auth.ts · week.ts
src/app/       / · /r/[slug] · /vote/[round]/[token] · /menu/[round] · /admin
               api/thumb/[slug] · api/vote · api/admin
src/components/ chrome.tsx (Panel/Tag) · ballot.tsx · admin-console.tsx · ui/
```

## Notes

- `SECRET` is required; the app throws on startup without it rather than
  signing tokens with a default.
- Changing `SECRET` invalidates outstanding vote links and admin sessions.
- Vote links are unguessable but not secret-proof — anyone who gets one can
  vote as that person. That's the intended trade for "no login".
- The app binds `0.0.0.0`. Keep it on the LAN; don't port-forward it.
