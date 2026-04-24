# Scripts

This folder contains repository helper scripts that support setup, Git workflows, and operational tasks.

## Current Structure

```text
scripts/
|- git/
```

## Git Scripts

The `git/` subfolder currently contains repository management helpers such as:

- branch setup
- branch protection helpers

These scripts are meant to standardize repository workflow and reduce manual setup steps.

## Usage Guidance

- Read each script before running it in a shared environment.
- Prefer running repository-management scripts from the repository root unless the script states otherwise.
- Validate any branch protection or remote-related script before using it against a production repository.

## Related Root Scripts

Some important operational scripts live at the repository root rather than inside this folder:

- `deploy.sh`
- `deploy-pm2.sh`
- `setup-cicd.sh`

Those are root-level because they act on the full repository and deployment environment.
