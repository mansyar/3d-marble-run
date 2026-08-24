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
and publishes it to GitHub Container Registry on pushes to `master` or a
manual workflow run. Valid version tags are published by the `Release`
workflow after its quality gate succeeds.

Pull and run the latest image:

```bash
docker pull ghcr.io/mansyar/3d-marble-run:latest
docker run --rm -p 8080:80 ghcr.io/mansyar/3d-marble-run:latest
```

Open `http://localhost:8080`. Build the image locally with:

```bash
docker build -t marblescape:local .
```

## Tagged releases

`package.json` is the release source of truth. Releases use stable
`vMAJOR.MINOR.PATCH` tags, and the tag must exactly match the package version.
Use pnpm's version command from a clean branch:

```bash
pnpm version patch # or: minor, major
git push origin master --follow-tags
```

The version command creates the version commit and `vX.Y.Z` tag. Pushing both
starts `.github/workflows/release.yml`, which first installs dependencies with
the frozen lockfile and runs the release check, tests, Biome, TypeScript, and
the production build. A successful gate then creates a GitHub Release with
GitHub-generated notes, deploys GitHub Pages, and publishes GHCR images.

The release check rejects prereleases, malformed tags, and mismatches before
any output is published. To rehearse it locally:

```bash
pnpm check:release -- v0.1.0 # succeeds while package.json is 0.1.0
pnpm check:release -- v0.1.1 # fails until package.json is 0.1.1
```

Each valid release produces:

- Pages: `https://<owner>.github.io/<repository>/`
- GitHub Release: `vX.Y.Z` with generated notes
- GHCR: `ghcr.io/mansyar/3d-marble-run:X.Y.Z`, `:latest`, and `:sha-<commit>`

Pull an immutable release or the moving latest image with:

```bash
docker pull ghcr.io/mansyar/3d-marble-run:0.1.0
docker pull ghcr.io/mansyar/3d-marble-run:latest
docker run --rm -p 8080:80 ghcr.io/mansyar/3d-marble-run:0.1.0
```

Before the first release, enable **Settings → Pages → GitHub Actions** and
allow repository Actions to use read/write workflow permissions. The release
workflow needs contents write permission for generated GitHub Releases, Pages
write plus OIDC for deployment, and packages write for GHCR; its jobs request
only those permissions. GHCR must be enabled for the repository, and the
resulting package may need its visibility or access configured in **Packages**.

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
