# Security

Please do not report credentials or private details in a public issue.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository when it is
enabled. If that option is unavailable, contact the maintainer privately
through the GitHub profile for from-america and include reproduction steps,
impact, and a minimal fix if known.

## Deployment secrets

The Cloudflare Pages workflow reads only these protected GitHub Environment
secrets:

- CLOUDFLARE_API_TOKEN: a token scoped to Pages deployment for the target
  account; do not use an account-wide global API key.
- CLOUDFLARE_ACCOUNT_ID: the target Cloudflare account identifier.

Secrets belong in the repository's production Environment, never in source,
workflow text, issue comments, or regular repository variables. The workflow
has read-only contents permission and cancels superseded deployments.
