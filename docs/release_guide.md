# Polaris AI ERP WeApp Release Guide

This repository is a mini-program application. It is not published as an npm package. Releases are created with Git tags and GitHub Releases, then built with uni-app / HBuilderX for WeChat Mini Program upload.

## Versioning

- Current version: `0.1.0`
- Tag format: `vMAJOR.MINOR.PATCH`
- Use semantic versioning:
  - `PATCH` for bug fixes and documentation-only release corrections.
  - `MINOR` for backward-compatible pages, API consumers, or UI improvements.
  - `MAJOR` for breaking API contract or release workflow changes.

## Pre-Release Checklist

Run these commands from the repository root:

```bash
npm ci
npm run test:unit
npm run build:mp-weixin
git diff --check
```

Confirm `.env` values are provided by the local build environment or CI. Do not commit production domains, tokens, customer-service identifiers, `dist/`, or `node_modules/`.

## Create A Release

1. Update `package.json` version if the version changes.
2. Update `CHANGELOG.md`.
3. Commit the release files.
4. Create and push the tag:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin main
git push origin v0.1.0
```

5. Create a GitHub Release from the tag and paste the matching `CHANGELOG.md` section.
6. Build the mini program and upload `dist/build/mp-weixin` through WeChat Mini Program Devtools or HBuilderX.

## Compatibility

- Server repository: `BennettLocke/polaris-erp-agent`
- Minimum server version for `v0.1.0`: `polaris-erp-agent >= 0.1.0`
- Component library repository: `BennettLocke/bennett-locke-ui`
