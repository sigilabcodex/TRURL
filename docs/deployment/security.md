# TRURL Self-Hosting Security Design Draft

This document describes the security posture expected for future self-hosted TRURL deployments. It is documentation only. It does not implement authentication, deployment scripts, reverse proxy configuration, Docker files, or backend changes.

TRURL handles private manuscripts, canon records, notes, revision context, and Git history. Self-hosting must keep those files protected while preserving TRURL's repository-first architecture.

## Security Principles

### Private by Default

TRURL should default to local or private-network access. A self-hosted instance should not be reachable from the public internet unless an explicit access-control layer is in front of it.

Acceptable access models include:

- Localhost-only access.
- LAN access limited by firewall and trusted network boundaries.
- Tailscale/WireGuard private network access.
- Cloudflare Access or equivalent identity-gated public domain.

### HTTPS for Exposed Deployments

Any deployment reachable beyond localhost should use HTTPS. Public domains must use HTTPS. Private-network deployments should use HTTPS where practical, especially when traffic crosses networks not fully controlled by the author.

### No Open Registration

TRURL is not designed as a public account service. Future authentication, if added, should protect a personal or private workshop instance. It should not imply open registration, tenancy boundaries, billing, public profiles, or SaaS account recovery flows.

### No SaaS Assumption

Self-hosting should not require TRURL to phone home or depend on external cloud services. Identity gates, DNS providers, or hosted AI services may be optional integrations, but the core writing workspace should remain repository-first and able to run privately.

### No Arbitrary Shell Execution

Backend requests must not execute arbitrary shell commands. Any future operational commands must be explicit, allowlisted, validated, and tested. This is especially important for network-exposed deployments.

### Git Remains Controlled

Git endpoints should remain read-only until a dedicated write workflow is designed. Future write-capable Git automation must be explicit, reviewable, constrained to repository-safe operations, and protected against destructive commands.

### Markdown and Git Are Source of Truth

Markdown files, frontmatter, and Git history remain authoritative. Deployment infrastructure must not replace the workspace with an opaque database or hidden server-side state model.

## Threat Model

### Unauthorized Access to Manuscripts

Risk: An attacker or unintended user can read private manuscript, notes, canon, or revision files.

Controls:

- Keep deployments private by default.
- Require HTTPS for exposed deployments.
- Put public domains behind an identity gate or private network.
- Avoid open registration and shared public instances.
- Keep repository mounts outside public static directories.

### Repository Corruption or Data Loss

Risk: Application bugs, bad updates, unsafe volume configuration, or destructive commands damage user repositories.

Controls:

- Keep app code and workspace volumes separate.
- Back up repositories including `.git` history.
- Do not overwrite mounted repositories during updates.
- Keep Git write automation disabled until a dedicated workflow exists.
- Prefer read-only diagnostics and explicit user actions.

### Secrets Leakage

Risk: Tokens, AI provider keys, reverse proxy credentials, or access-control secrets are committed or exposed through logs/UI.

Controls:

- Provide `.env.example` with placeholder names only.
- Never commit real secrets or environment-specific values.
- Keep secret values out of frontend bundles.
- Redact secrets from diagnostics and logs.
- Document rotation steps for any future supported secret.

### Malicious Prompts or AI-Assisted Edits

Risk: AI output attempts to override project rules, leak private text, or produce unsafe edits.

Controls:

- AI remains assistant, not owner.
- AI proposals should be structured and reviewable.
- Do not apply AI changes automatically.
- Require visible diffs and explicit user action before writes.
- Keep manuscript/story-bible writes constrained by the safe save model.

### Public Endpoint Probing

Risk: A public TRURL endpoint is scanned, fuzzed, or attacked through API routes.

Controls:

- Avoid direct public exposure.
- Use private networks or identity gates.
- Require HTTPS for exposed deployments.
- Keep backend routes narrow and validated.
- Avoid arbitrary command execution and broad filesystem access.

### Accidental Destructive Git Operations

Risk: A UI action, backend route, or deployment script runs destructive Git commands against a writing repository.

Controls:

- Keep Git UI read-only until a dedicated workflow is designed.
- Do not expose arbitrary Git command execution.
- Avoid destructive commands in automation.
- Require reviewable diffs before applying changes.
- Document backup and restore before enabling write-capable Git features.

## Discouraged Public Exposure

A TRURL instance should not be placed directly on the public internet with no access gate. An app login alone is also discouraged for the initial self-hosting profile because the app is not yet designed as an internet-facing identity boundary.

Publicly reachable deployments should use one of these patterns:

- Private network only, such as Tailscale or WireGuard.
- Identity-gated domain, such as Cloudflare Access or an equivalent tool.
- Future app-level authentication combined with, not replacing, an outer access-control layer unless the security model is redesigned and reviewed.

## Future Security Documentation

A later implementation slice should add concrete operational docs after deployment artifacts exist.

Future docs should cover:

- Reverse proxy hardening for Caddy or nginx.
- HTTPS certificate handling.
- Environment variable inventory.
- Secret rotation.
- Backup and restore drills.
- Logging and redaction policy.
- Safe update procedure.
- Security checklist before exposing an instance.

## Non-Goals

- No public SaaS.
- No open user registration.
- No realtime collaboration.
- No database-backed workspace mode.
- No direct public exposure without a private network, identity gate, or equivalent access control.
