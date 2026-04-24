# GitHub Configuration

This folder contains GitHub-specific repository automation and collaboration templates.

## Contents

- `workflows/`
  - GitHub Actions workflows for CI and deployment automation.
- `pull_request_template.md`
  - Pull request template used to standardize change descriptions.
- `CODEOWNERS`
  - Ownership rules for review routing.

## Workflows

Current workflows include:

- `ci.yml`
  - Continuous integration checks.
- `deploy-production.yml`
  - Production deployment automation.

## Purpose

Use this folder to keep GitHub repository behavior explicit and versioned, including:

- CI pipelines
- deployment pipelines
- contribution templates
- code ownership rules

## Maintenance Guidelines

- Keep workflow names descriptive.
- Prefer small, reviewable workflow changes.
- Update this README when new top-level GitHub automation is added.
