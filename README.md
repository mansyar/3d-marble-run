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

## Container image

The `Publish container image` workflow builds the production site with Nginx
and publishes it to GitHub Container Registry on pushes to `master`, version
tags, or a manual workflow run.

Pull and run the latest image:

```bash
docker pull ghcr.io/mansyar/3d-marble-run:latest
docker run --rm -p 8080:80 ghcr.io/mansyar/3d-marble-run:latest
```

Open `http://localhost:8080`. Build the image locally with:

```bash
docker build -t marblescape:local .
```

### Coolify deployment trigger

The container workflow can trigger a Coolify redeploy after a successful GHCR
publish on `master` (or a manual workflow run). Configure Coolify to pull
`ghcr.io/mansyar/3d-marble-run:latest`, then add these GitHub repository
settings:

1. Create an Actions secret named `COOLIFY_DEPLOY_WEBHOOK` containing the
   deploy webhook URL from Coolify.
2. Create an Actions secret named `COOLIFY_DEPLOY_TOKEN` containing the
   Coolify bearer token.
3. Create an Actions variable named `COOLIFY_DEPLOY_ENABLED` with the value
   `true`.
4. Push to `master` or run **Publish container image** manually.

The webhook URL stays out of the repository and is never printed by the
workflow. Leave the variable unset or set it to `false` to publish images
without triggering Coolify.
