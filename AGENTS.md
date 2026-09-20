# Adding a recipe

Recipes are markdown files under `recipes/<category>/<slug>.md`. The web app
reads the folder on every request, so **writing the file is the entire task** —
no API call, no database write, no restart, no rebuild.

## Steps

1. Pick a category folder: `mains`, `pasta-and-rice`, `sauces`, `seafood`, `sides`,
   `breakfast`, `desserts`. Create a new folder if none fits.
2. Choose a slug: lowercase ASCII, digits and hyphens only (`[a-z0-9-]+`). It
   becomes the URL and the thumbnail id, so no spaces or accented characters —
   `malinova-torta-z-belo-cokolado`, not `Malinova torta z belo čokolado`.
3. Write the file in the format below.
4. Add a row to the table in `README.md`.

## Format

Copy `TEMPLATE.md`. Frontmatter fields, in this order, always:

```yaml
---
title: Human readable name          # may contain accents and spaces
category: pasta-and-rice            # must match the folder name
servings: 4                         # free text
time: 40 min                        # free text
language: en                        # en | sl
status: complete                    # complete | reconstructed | incomplete
---
```

Then the body:

```markdown
# Title

One-line description. Optional.

## Ingredients

- 200 g flour
- 2 eggs

## Method

1. First step, imperative mood.
2. **Bold** temperatures and times.

## Notes

- Optional. Omit the whole section if empty.
```

Slovenian recipes use `## Sestavine`, `## Postopek` and `## Nasveti` — the
parser accepts either language.

### Ingredient groups

Only when a recipe genuinely has components. Bold labels, never sub-headings:

```markdown
**For the base**
- 200 g biscuits

**For the filling**
- 600 g cream cheese
```

### Method sub-headers

A bold line inside `## Method` renders as a section label and is skipped in the
step numbering:

```markdown
**Vaniljev biskvit**

1. ...
```

## Marking gaps

If anything is missing or invented, say so — do not quietly guess.

| status | when | extra field | banner |
|---|---|---|---|
| `complete` | everything came from the source | — | none |
| `reconstructed` | usable, but you inferred part of it | `reconstructed:` | `> ℹ️ ...` |
| `incomplete` | still has a real hole | `missing:` | `> ⚠️ ...` |

The banner is a blockquote directly under the `# Title`, and the app renders it
in amber (reconstructed) or red (incomplete):

```markdown
> ℹ️ **Method reconstructed.** Inferred from the ingredient list, untested.
```

## Rules

- **Never invent quantities or steps silently.** Mark them `reconstructed` and
  say what you filled in. An honest gap beats a plausible fabrication.
- **No images, no external URLs.** The collection is deliberately self-contained
  so nothing 404s later.
- Keep headings at `##`. Nothing deeper.
- One recipe per file.

## Checking your work

```bash
# frontmatter is well formed and the app can parse it
cd web && npm run typecheck

# the recipe renders
curl -s localhost:3000/r/<slug> -o /dev/null -w '%{http_code}\n'   # expect 200
curl -s localhost:3000/api/thumb/<slug> -o /dev/null -w '%{http_code}\n'
```

A malformed file is skipped rather than crashing the site, so a missing recipe
on the index usually means bad frontmatter — check `title:` exists.
