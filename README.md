# Mob forge

Roll mobs and bosses for the Dungeon Crawler Carl RPG in the browser, keep them in a local library, and export them as:

- **Obsidian notes** (`.md`, or a `.zip` for several) in the shape of the [Carl RPG Obsidian plugin](https://github.com/matalina/obsidian-carlrpg)'s mob template, with the `carl-creature` block.
- **Crawler Forge packs** (`.json`) that import into [Crawler Forge](https://crawlerforge.com/guides/file-formats), pack schema version 106.

The generator is ported from the plugin's mob forge (`src/forge/`), built on the Core Rulebook's "Create Your Own Mobs and Bosses" (pp. 270–273, Tables 50 and 51).

## Install and offline

Mob forge is a progressive web app. After the first visit it works with no connection; your library is already stored on the device.

- **Chrome, Edge, Android:** select **Install app** in the header (or the install icon in the address bar).
- **iPhone and iPad:** Safari → **Share** → **Add to Home Screen**.
- **Mac Safari:** **File** → **Add to Dock**.

When a new version is deployed, the app shows **A new version of Mob forge is ready** with an **Update** button. It never reloads by itself, so nothing you're editing is lost. Open tabs check for updates every hour.

Icons are generated from `public/favicon.svg` with `npm run icons` (config in `pwa-assets.config.ts`).

## Library and exports

Downloading a mob as a note or in a pack marks it **Exported** (editing it afterwards clears the mark). **Select not exported** picks the mobs that aren't in any download yet. Under **Clean up**, **Clear exported** deletes only exported mobs and **Clear all** empties the library; both ask first, and nothing is ever cleared automatically.

Pack files are named after the pack name, slugified: "Floor 3: Gutter Kings" downloads as `floor-3-gutter-kings.json`.

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

## Versioning

The app shows its version next to the title, and the version, commit and build date in the footer.

The version changes on every push by itself: the first two numbers come from `package.json` and the last is the number of commits on `main`. With `0.2.0` in `package.json` and 15 commits, the app shows `0.2.15`; the next push shows `0.2.16`. Netlify's build command fetches the full git history so the count is right.

For a bigger jump, edit the first two numbers in `package.json` (`0.3.0`, `1.0.0`); the last number in `package.json` is ignored.
