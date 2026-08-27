# Marblescape

Marblescape is an offline, browser-based 3D marble-run builder. Build a track
from procedural toy pieces, release physics-driven marbles, and save layouts
locally in the browser.

## Build and play

The tray contains seven physical pieces: straight, curve, ramp, funnel,
splitter, bumper, and goal cup, plus a dedicated Drop point tool. Splitters
fork a channel into two branches, and bumpers are free-standing domes you can
seat anywhere — on the table or right on top of a track. The Drop point is a
separate overhead
marble entry point: place it freely above the table, then use its vertical guide
to find the first track surface below. A fresh launch includes a connected
five-piece starter route with a ready Drop point, while custom layouts remain
editable at any time.

The Track status helper explains what is needed: place a Drop point, move it
above a track piece, connect a goal cup, or drop a marble when the route is
ready. Drop and Stream stay disabled until a valid landing and goal route exist;
disconnected pieces are not blocked, so experimentation stays forgiving.
Route guidance stays ambient: connector pieces you have not joined to the route
yet pulse gently until they connect, and a soft violet glow traces each ready
path from the Drop point landing to its goal cup.
Marbles that leave the playable world are cleaned up automatically, and all
saves remain local to the browser.

### Legacy saves

Version-1 saves remain readable. A saved physical Start gate is migrated to a
Drop point using its X/Z position at the fixed overhead height, then the gate
and its graph connection are removed. Gate-less version-1 saves load without a
Drop point and can be edited normally.

## Installable PWA

Marblescape ships as a Progressive Web App. After the first visit, the service
worker precaches the whole bundle, so airplane-mode reloads stay fully playable,
and the browser offers **Install** / **Add to Home Screen** (the installed app
runs standalone with any orientation). Icons and the web manifest are generated
at build time from the single source SVG and manifest metadata:

```bash
pnpm generate:icons
```

App updates deploy silently: the next load activates the new service worker in
the background, and no prompt ever interrupts play. The service worker stays
disabled in development.

The payload budget is ≤3,500 kB minified / ≤1,250 kB gzip, measured globally
across all emitted chunks. Physics (Rapier + its embedded WASM) loads as a
separate async chunk behind the branded boot screen, keeping the initial entry
chunk tiny.

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
pnpm check:size
```

## Continuous integration

Pushes to `master` run `.github/workflows/ci.yml`, which installs from the
frozen lockfile and runs tests, Biome, TypeScript, the production build, and
the payload budget check.
Master pushes are CI-only: they do not deploy Pages, publish GHCR images, or
trigger Coolify.

## GitHub Pages deployment

The repository includes the reusable `.github/workflows/deploy-pages.yml`.
Valid version tags publish Pages through the quality-gated `Release` workflow.
For an emergency override, run **Deploy to GitHub Pages** manually from the
repository's default branch; manual dispatch bypasses the release workflow's
tag quality gate. It does not run automatically on `master` pushes.

To enable Pages:

1. Push this repository to GitHub.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.

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
and publishes it to GitHub Container Registry for valid version tags through
the quality-gated `Release` workflow. It can also be run manually from the
repository's default branch as an emergency override; manual dispatch bypasses
the release workflow's tag quality gate. It does not run on `master` pushes.

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
Cut each release from a dedicated branch — per the current CI-gating policy
the release train reaches `master` through a PR, so the tag is pushed only
after the merge:

```bash
git checkout -b chore/release-vX.Y.Z
pnpm version patch --no-git-tag-version # plain `pnpm version` fails on a dirty tree
git commit -am "X.Y.Z"                   # bump commit
git tag -a vX.Y.Z -m "vX.Y.Z"            # annotated tag, kept unpushed until merge
```

Push the branch, open a PR to `master`, and merge it once CI is green. Pushing
the tag afterwards (`git push origin vX.Y.Z`)
starts `.github/workflows/release.yml`, which first installs dependencies with
the frozen lockfile and runs the release check, tests, Biome, TypeScript, the
production build, and the payload budget check. A successful gate then creates a GitHub Release with
GitHub-generated notes, deploys GitHub Pages, and publishes GHCR images.

The release check rejects prereleases, malformed tags, and mismatches before
any output is published. To rehearse it locally:

```bash
# Replace v0.1.1 with the exact v${package.json.version} for your checkout.
pnpm check:release v0.1.1
# Use any different stable tag to verify rejection.
pnpm check:release v0.1.0
```

Each valid release produces:

- Pages: `https://<owner>.github.io/<repository>/`
- GitHub Release: `vX.Y.Z` with generated notes
- GHCR: `ghcr.io/mansyar/3d-marble-run:X.Y.Z`, `:latest`, and `:sha-<commit>`
- Optional Coolify redeploy after the successful GHCR publication when enabled

Pull an immutable release or the moving latest image with:

```bash
# Replace 0.1.1 with the immutable release you want to run.
docker pull ghcr.io/mansyar/3d-marble-run:0.1.1
docker pull ghcr.io/mansyar/3d-marble-run:latest
docker run --rm -p 8080:80 ghcr.io/mansyar/3d-marble-run:0.1.1
```

Before the first release, enable **Settings → Pages → GitHub Actions**, allow
repository Actions to use read/write workflow permissions, and configure the
`github-pages` environment to allow both the `master` branch and `v*` tags in
its deployment branch and tag policy. The release workflow needs contents
write permission for generated GitHub Releases, Pages write plus OIDC for
deployment, and packages write for GHCR; its jobs request only those
permissions. GHCR must be enabled for the repository, and the resulting
package may need its visibility or access configured in **Packages**.

### Coolify deployment trigger

The container workflow can trigger a Coolify redeploy after a successful GHCR
publish for a validated tagged release or an eligible manual run from the
repository's default branch. Master pushes are CI-only and cannot trigger
Coolify. Configure Coolify to pull
`ghcr.io/mansyar/3d-marble-run:latest`, then add these GitHub repository
settings:

1. Create an Actions secret named `COOLIFY_DEPLOY_WEBHOOK` containing the
   deploy webhook URL from Coolify.
2. Create an Actions secret named `COOLIFY_DEPLOY_TOKEN` containing the
   Coolify bearer token.
3. Create an Actions variable named `COOLIFY_DEPLOY_ENABLED` with the value
   `true`.
4. Push a valid version tag, or run **Publish container image** manually from
   the default branch.

The webhook URL stays out of the repository and is never printed by the
workflow. Leave the variable unset or set it to `false` to publish images
without triggering Coolify.
