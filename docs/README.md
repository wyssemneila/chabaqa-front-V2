# Docs

This folder contains repository-level operational and deployment documentation.

## Purpose

Use this folder for guides that are broader than a single app or module, especially when they describe:

- infrastructure setup
- deployment flows
- CI/CD configuration
- environment provisioning
- branch and release process
- edge or proxy configuration

## Current Documents

- `BRANCHING_AND_RELEASE.md`
  - Branching strategy and release workflow.
- `CICD_SETUP.md`
  - CI/CD setup instructions and expectations.
- `CLOUDFLARE_VPS_SETUP.md`
  - Cloudflare and VPS deployment setup notes.
- `OPENCODE_WEB_CLOUDFLARE.md`
  - OpenCode web deployment notes with Cloudflare-related configuration.

## When To Add A Document Here

Add a file here when the topic applies to more than one part of the repo or helps operators deploy and maintain the system.

Examples:

- production rollout steps
- DNS and reverse proxy setup
- environment bootstrap steps
- infrastructure migration notes

## What Does Not Belong Here

- Backend module implementation details
- Frontend feature walkthroughs tied to a single app area
- One-off personal notes

Those should live closer to the relevant code.
