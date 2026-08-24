# Marblescape

Marblescape is an offline, browser-based 3D marble-run builder. Build a track
from procedural toy pieces, release physics-driven marbles, and save layouts
locally in the browser.

## Development

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Quality checks are:

```bash
CI=true pnpm vitest run
CI=true pnpm biome check .
pnpm build
```

## GitHub Pages deployment

The repository includes `.github/workflows/deploy-pages.yml`. To publish it:

1. Push this repository to GitHub.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Push to `master` or run **Deploy to GitHub Pages** from the Actions tab.

The workflow builds with the repository-name base path and publishes `dist/`.
The resulting URL is `https://<owner>.github.io/<repository>/`.

All runtime assets are generated or bundled locally. Save slots use IndexedDB
and remain local to each browser origin; no account or backend is required.

For a local production check:

```bash
pnpm build
pnpm preview
```
