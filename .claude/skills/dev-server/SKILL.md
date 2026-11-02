---
name: dev-server
description: Start the lunch web app in dev mode (hot reload) on http://localhost:18625 so code changes show up in the browser as they happen. Use when asked to run, start, or preview the app during development.
---

# Dev server

The production server (`npm start`) usually already occupies port 18624 and only
serves the last `npm run build`. Dev mode runs alongside it on **port 18625**
with hot reload — edit a file, the browser updates.

```bash
cd web && npm run dev
```

Then open http://localhost:18625. Both servers read the same `../recipes/` folder
and the same `web/lunch.db`, so recipes and voting rounds look identical on both.

## Notes

- Run it in the background (`run_in_background`) and tail the log; wait for
  "Ready" before curling.
- Check it's alive: `curl -s -o /dev/null -w '%{http_code}' localhost:18625/`.
- Vote links generated in admin use `APP_URL` from `.env`, so they point at the
  :18624 server even when created from :18625. Swap the port by hand to test a
  ballot in dev.
- Stop it with `pkill -f "next dev -p 18625"`. The :18624 production server is
  untouched.
- When done and happy: `cd web && npm run build` then restart `npm start` so
  the family-facing server picks up the change.
