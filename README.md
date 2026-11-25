# Mob forge

Roll mobs and bosses for the Dungeon Crawler Carl RPG in the browser, keep them in a local library, and export them as:

- **Obsidian notes** (`.md`, or a `.zip` for several) in the shape of the [Carl RPG Obsidian plugin](https://github.com/matalina/obsidian-carlrpg)'s mob template, with the `carl-creature` block.
- **Crawler Forge packs** (`.json`) that import into [Crawler Forge](https://crawlerforge.com/guides/file-formats), pack schema version 106.

The generator is ported from the plugin's mob forge (`src/forge/`), built on the Core Rulebook's "Create Your Own Mobs and Bosses" (pp. 270–273, Tables 50 and 51).

## Privacy

Everything runs in your browser. Saved mobs and export settings live in `localStorage` on your device; nothing is sent anywhere. Clearing site data deletes the library.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # exports checked against Crawler Forge's published schema
npm run build    # type-check and build to dist/
```

Stack: Vue 3, Vite, TypeScript, Tailwind CSS v4, [fflate](https://github.com/101arrowz/fflate) for zipping notes.

## Layout

```
src/
  lib/
    tables.ts        # rulebook tables and weighted attack tables
    generate.ts      # the mob generator
    stats.ts         # stat mods and sizes
    markdown.ts      # Obsidian note export
    crawlerforge.ts  # Crawler Forge pack export
    library.ts       # localStorage library and settings
    download.ts      # file downloads and clipboard
  components/        # ForgeForm, MobCard, LibraryPanel
tests/
  export.test.ts
  fixtures/pack.schema.json   # from https://crawlerforge.com/schemas/pack.schema.json
```

When Crawler Forge bumps its schema version, download the new `pack.schema.json` into `tests/fixtures/`, update `SCHEMA_VERSION` in `src/lib/crawlerforge.ts`, and run `npm test`.

## Crawler Forge mapping

| Forge | Crawler Forge |
| --- | --- |
| Rank | `kind` (`mob`/`boss`) and `bossTier` |
| Floor | `homeFloor` |
| Type | `type` |
| Move 30/40 | `overrides.move` |
| DR above or below the floor | `overrides.drBonus` |
| Radius area | `area.shape: "blast"` |
| Debuff on any hit | `onHit` |
| Debuff on Evade Major Fail | `onFail` |
| Traits | `abilities` |
| AI description | `description` (and the note's `[!danger]` callout) |
| Attack notes | attack `notes` |

Surprise, Evade, Health slots and to-hit are left for Crawler Forge to work out; they follow the same rules the forge uses. Each mob keeps its id, so importing it again is recognized as the same piece.

## Deploy

`netlify.toml` builds with `npm run build` and publishes `dist/`. Connect the repo in Netlify and it deploys on every push to `main`.
