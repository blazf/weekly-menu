# Recipes

30 recipes, all in one format (9 of them photo-only placeholders still waiting for ingredients and method). Self-contained: no images, no external links, nothing
that can rot or 404.

There's a small web app in [`web/`](web/README.md) that serves this collection on the
home server and runs the weekly lunch vote. It reads these markdown files directly —
adding a recipe means writing a file here, nothing else. See [AGENTS.md](AGENTS.md).

## Format

Every recipe is `frontmatter → # Title → one-line description → ## Ingredients → ## Method → ## Notes`.
Copy [TEMPLATE.md](TEMPLATE.md) to add a new one; use
[TEMPLATE-incomplete.md](TEMPLATE-incomplete.md) if something is missing.
[AGENTS.md](AGENTS.md) is the full contract for adding recipes programmatically.

Frontmatter is always the same seven fields, in the same order:

```yaml
title:  category:  servings:  time:  language:  status:  missing:
```

`status` is one of three:

| Status | Meaning | Banner |
|---|---|---|
| `complete` | Everything came from the original source. | — |
| `reconstructed` | Usable end-to-end, but part was inferred rather than recorded. A `reconstructed:` field names what. | ℹ️ |
| `incomplete` | Still has a real hole. A `missing:` field names what. | ⚠️ |

Nine recipes are currently `incomplete` — placeholder entries added with a photo but no
recipe text yet (see the ⚠️ rows below). Recipes marked `reconstructed` are cookable, but the
invented parts are untested — worth a trial run before serving them to company.

Conventions: ingredients are flat bullets, grouped with **bold labels** when a recipe
has real components. Method steps are numbered and imperative. Temperatures and times
are **bolded** so they're findable mid-cook. Headings never go deeper than `##`.

## Mains
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [Pizza](recipes/mains/pizza.md) | 4 | 2 h | en | ⚠️ |
| [Meatballs in Tomato Sauce](recipes/mains/meatballs-in-tomato-sauce.md) | 4 | 45 min | en | ⚠️ |
| [Bacon-Wrapped Chicken (Gordon Ramsay)](recipes/mains/bacon-wrapped-chicken.md) | 4 | 45 min | en | ⚠️ |
| [Chicken Schnitzel](recipes/mains/chicken-schnitzel.md) | 4 | 30 min | en | ⚠️ |
| [Ribeye Steak](recipes/mains/ribeye-steak.md) | 2 | 20 min | en | ⚠️ |
| [Burgers](recipes/mains/burgers.md) | 4 | 40 min | en | ⚠️ |

## Pasta & rice
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [Lasagna](recipes/pasta-and-rice/lasagna.md) | 6–8 | 60 min | en | |
| [Gnocchi](recipes/pasta-and-rice/gnocchi.md) | 4 | 75 min | en | |
| [Mushroom Risotto](recipes/pasta-and-rice/mushroom-risotto.md) | 6 | 40 min | en | |
| [Seafood Risotto](recipes/pasta-and-rice/seafood-risotto.md) | 8–10 | 50 min | en | |
| [Chicken Alfredo](recipes/pasta-and-rice/chicken-alfredo.md) | 8 | 35 min | en | ℹ️ |
| [Lobster Pasta](recipes/pasta-and-rice/lobster-pasta.md) | 4 | 1 h 15 min | en | ℹ️ |

## Sauces
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [Gobova omaka](recipes/sauces/gobova-omaka.md) | ~4 | 20 min | sl | |

## Seafood
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [Sesame-Crusted Tuna Steak](recipes/seafood/tuna-steak.md) | 4 | 40 min | en | |
| [Korean Fried Shrimp](recipes/seafood/korean-fried-shrimp.md) | 4 | 40 min | en | |
| [Creamy Garlic Shrimp](recipes/seafood/creamy-garlic-shrimp.md) | 4 | 20 min | en | |
| [Honey Garlic Shrimp](recipes/seafood/honey-garlic-shrimp.md) | 4 | 20 min | en | |
| [Salmon Steak & Fries](recipes/seafood/salmon-steak-and-fries.md) | 4 | 30 min | en | ⚠️ |
| [Fish & Chips](recipes/seafood/fish-and-chips.md) | 4 | 45 min | en | ⚠️ |
| [Whole Sea Bass & Potatoes](recipes/seafood/whole-sea-bass-and-potatoes.md) | 2 | 45 min | en | ⚠️ |

## Sides
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [Gratiniran krompir](recipes/sides/gratiniran-krompir.md) | 2–4 | 1 h 15 min | sl | |
| [Hrenovke v listnatem testu](recipes/sides/hrenovke-v-listnatem-testu.md) | 15 kosov | 30 min | sl | |

## Breakfast
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [American Pancakes](recipes/breakfast/american-pancakes.md) | 4 | 20 min | en | |
| [Palačinke](recipes/breakfast/palacinke.md) | 4 | 30 min | sl | |
| [Belgian Waffles](recipes/breakfast/belgian-waffles.md) | 6 | 20 min | en | |
| [Wafer-Thin Waffles](recipes/breakfast/wafer-thin-waffles.md) | 12 | 20 min | en | |

## Desserts
| Recipe | Servings | Time | Lang | |
|---|---|---|---|---|
| [New York Cheesecake](recipes/desserts/ny-cheesecake.md) | 12 | 7 h 30 min | en | |
| [Baked Tangerine Cheesecake](recipes/desserts/baked-tangerine-cheesecake.md) | 8–10 | 5 h | en | |
| [Rolada s kislo smetano](recipes/desserts/rolada-s-kislo-smetano.md) | 10 rezin | 40 min | sl | |
| [Malinova torta z belo čokolado](recipes/desserts/malinova-torta-z-belo-cokolado.md) | 1 torta | 2 h + noč | sl | ℹ️ |

---

## ⚠️ Placeholder recipes

Added as photo-only stubs so they can be voted on; ingredients and method are still to
be written. Servings and times are rough guesses.

- [Salmon Steak & Fries](recipes/seafood/salmon-steak-and-fries.md)
- [Pizza](recipes/mains/pizza.md)
- [Meatballs in Tomato Sauce](recipes/mains/meatballs-in-tomato-sauce.md)
- [Bacon-Wrapped Chicken (Gordon Ramsay)](recipes/mains/bacon-wrapped-chicken.md)
- [Chicken Schnitzel](recipes/mains/chicken-schnitzel.md)
- [Fish & Chips](recipes/seafood/fish-and-chips.md)
- [Whole Sea Bass & Potatoes](recipes/seafood/whole-sea-bass-and-potatoes.md)
- [Ribeye Steak](recipes/mains/ribeye-steak.md)
- [Burgers](recipes/mains/burgers.md)

## ℹ️ Reconstructed recipes

These three had gaps in the original notes. The gaps are now filled with sensible
defaults so every recipe is cookable — but the filled-in parts are **invented, not
sourced, and untested**.

| Recipe | What was filled in |
|---|---|
| [Lobster Pasta](recipes/pasta-and-rice/lobster-pasta.md) | **The entire method.** Worked out from the ingredients: shell stock from the lobster bodies, reduced into the cream. The biggest leap of the three. |
| [Chicken Alfredo](recipes/pasta-and-rice/chicken-alfredo.md) | Ricotta quantity — 1 cup, to balance the pint of cream and cup of Parmesan. |
| [Malinova torta](recipes/desserts/malinova-torta-z-belo-cokolado.md) | Decoration: fresh raspberries, white chocolate shavings, mint, icing sugar — plus a final assembly step. Cake itself is original. |

## History

Organized from an Apple Notes export. The original export — including all the
screenshots and the eight dropped recipes — is preserved untouched at `notes/`.

**Dropped:** Bolognese omaka, Gobova omaka (milk version), Steak, Tiramisu,
Rižev narastek, Vanilijevi rogljički, Otroška tortilja, Klobasice na zelenem.

**Never imported:** Orloff (empty note) and the sausage narastek (page photo cut off
mid-recipe).
