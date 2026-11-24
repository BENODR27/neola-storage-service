# Shared storage API: independent deployment

Requires the complete existing/restored uploads volume and IAM for scoped MMMS licensing. It does not need a maintenance database.

This package builds from this directory only. No parent workspace, sibling source
checkout or root launcher is required. Network API dependencies remain explicit.

## Configure once

Requires Docker with Compose 2.30+; Node/npm is only needed to use the npm aliases.
On a Mac/Ubuntu shell, copy templates without replacing any existing configuration:

```sh
[ -f .env.container ] || cp .env.container.example .env.container
[ -f .env.deploy ] || cp .env.deploy.example .env.deploy
```

Edit both files before starting. Runtime values belong in `.env.container`;
port, bind address, network and image belong in `.env.deploy`. Use literal
unquoted values in `.env.container`. Existing passwords, keys and instance IDs
must be copied unchanged from the existing installation, not regenerated.
Relevant runtime settings (placeholders must be replaced):

```dotenv
JWT_SECRET=<same-existing-ERP-JWT-secret>
IAM_API_URL=http://iam:7001
STORAGE_MMMS_ONLY=true
```

Preserve all customized settings including JWT issuer/audience, subscription mode,
provider origins and signing configuration. Keep provider signing private keys only
on the provider server. These generic local manifests do not replace the signed
customer-policy Ubuntu release profiles.

Set `STORAGE_VOLUME` in `.env.deploy` to the exact existing/restored Docker upload volume. The service refuses to start if that external volume is missing. Do not create an empty replacement during migration.

Create the shared Docker network once per host, or reuse it if already present:

```sh
docker network create neola-platform
```

On different hosts, configure reachable private service DNS names/HTTPS origins
instead of Docker service aliases. `host.docker.internal` addresses a Mac Docker
host; Ubuntu databases should use their real private DNS name or a container
attached to the shared network. No database is created by this manifest.

## Start this package only

```sh
docker compose --env-file .env.deploy -f compose.independent.yaml config --quiet
docker compose --env-file .env.deploy -f compose.independent.yaml up -d --build
docker compose --env-file .env.deploy -f compose.independent.yaml ps
docker compose --env-file .env.deploy -f compose.independent.yaml logs --tail=100
```

Equivalent aliases: `npm run docker:config`, `npm run docker:up`,
`npm run docker:logs`. `npm run docker:build` builds without starting containers.
Default local endpoint: http://localhost:5004. `HTTP_PORT` changes this without
changing the container's internal port. `BIND_ADDRESS=0.0.0.0` permits LAN access;
keep APIs private and use HTTPS for production frontends.

After changing environment values, rerun `docker:up` to recreate this service.
Frontend upstream changes take effect at container startup without an Angular rebuild.

Never commit `.env.container`, `.env.deploy`, upload files, database backups or
private keys. Do not delete volumes to fix configuration failures.
