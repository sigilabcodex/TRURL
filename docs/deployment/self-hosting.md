# TRURL Self-Hosting Design Draft

This document is a first draft for a future self-hosted TRURL deployment profile. It is documentation only. It does not define a supported production package yet, and it does not add Docker, authentication, reverse proxy configuration, deployment scripts, or backend behavior.

TRURL's self-hosted direction is a secure personal writing cockpit: repository-first, Markdown-first, Git-native, local-first where practical, and compatible with OSER for rendering/export. It is not a pivot to public SaaS or realtime collaboration.

## Supported Deployment Modes

### Local-Only

Local-only is the current baseline. TRURL runs on the author's machine and is reached through localhost.

Expected properties:

- Manuscript, story-bible, notes, and revision files stay in a local Git repository.
- The backend listens only for local development access.
- No public network exposure is required.
- Existing local Git workflows remain authoritative.

### LAN or Private Network

A LAN/private-network deployment may be useful for a personal workstation, home server, studio machine, or private workshop server.

Expected properties:

- Access is limited to trusted devices on a private network.
- HTTPS is strongly preferred, and required if traffic may cross untrusted networks.
- Firewall rules should deny unsolicited public access.
- The writing repository remains a mounted or local persistent workspace.

### Tailscale/WireGuard Private VPS

A private VPS can host TRURL safely when access is limited to a VPN-style private network such as Tailscale or WireGuard.

Expected properties:

- TRURL is not directly exposed to the public internet.
- Only authenticated private-network devices can reach the service.
- HTTPS should still be used where practical, especially if a reverse proxy terminates traffic.
- Server updates must not overwrite mounted writing repositories.

### Identity-Gated Public Domain

A public DNS name may be acceptable when protected by an identity gate such as Cloudflare Access or an equivalent zero-trust access layer.

Expected properties:

- HTTPS is required.
- The public endpoint is protected before requests reach TRURL.
- Access is limited to explicitly allowed identities.
- App-level authentication may be added later, but should not be the only boundary for public exposure in the initial self-hosting profile.

## Discouraged Deployment Mode

Do not expose TRURL directly to the public internet with only an app login or with no access gate. TRURL reads and presents private writing repositories. A public endpoint invites probing, credential attacks, accidental data exposure, and pressure to support SaaS-style account boundaries that TRURL does not currently have.

## Future Deployment Profile

A future approved deployment slice should define a small, explicit deployment profile.

Likely artifacts:

- Docker Compose or equivalent runtime definition.
- Reverse proxy guidance for Caddy or nginx.
- HTTPS setup guidance for exposed deployments.
- `.env.example` documenting supported deployment settings.
- Persistent workspace volume strategy for repositories.
- Clear secret handling rules.
- Backup and restore guidance for writing repositories and configuration.
- Safe update path that updates TRURL code without overwriting user writing repositories.

## Workspace Persistence

Writing repositories must be treated as user data, not as application build artifacts.

Design expectations:

- Mount repositories as persistent volumes or bind mounts.
- Keep app code, generated build output, runtime cache, and user repositories separate.
- Do not bake manuscript/story-bible content into images.
- Do not overwrite mounted repositories during container rebuilds or application updates.
- Document restore steps before calling a deployment profile production-ready.

## Updates

A safe update path should preserve the distinction between TRURL application code and user writing repositories.

Future update guidance should ensure:

- Pulling or rebuilding TRURL never deletes or replaces user repositories.
- Database migrations are not required for the core workspace model.
- Configuration changes are explicit and reviewable.
- Backup steps are documented before upgrades that affect paths, volumes, or repository layout.

## Backups and Restore

TRURL's source of truth is the Git repository plus deployment configuration.

Backups should include:

- Writing repositories, including `.git` history.
- `.trurl/project.json` and project-local configuration.
- Deployment configuration such as environment files, reverse proxy site definitions, and access-control settings.
- Any generated export artifacts only if the user treats them as important derived records.

Restore guidance should verify:

- The repository opens as a normal Git repository.
- Markdown manuscript and story-bible files are intact.
- TRURL can load the workspace without needing external SaaS services.
- Access controls are restored before exposing the service.

## Non-Goals

- No public multi-user SaaS.
- No open user registration.
- No realtime collaboration.
- No database-backed workspace model.
- No arbitrary backend shell command execution.
- No write-capable Git automation until a dedicated Git workflow is designed.
- No requirement that TRURL phone home or depend on external cloud services.
