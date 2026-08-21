# Lightweight local-database production stack

Start this stack instead of `docker-compose.yml`:

```bash
docker compose -f docker-compose.lightweight.yml up -d --build
```

It keeps the existing `chabaqa_mongo-data` volume and the existing
`backend/uploads` directory. It has no destructive commands and does not remove
those data stores. Before the first start, make a Mongo dump:

```bash
docker exec chabaqa-mongo mongodump --archive --gzip > mongo-before-lightweight.archive.gz
```

View only the application logs:

```bash
docker compose -f docker-compose.lightweight.yml logs -f backend frontend
```

View each separately:

```bash
docker compose -f docker-compose.lightweight.yml logs -f backend
docker compose -f docker-compose.lightweight.yml logs -f frontend
```

The new active stack has local MongoDB, Redis, backend, and frontend only. It
uses local disk uploads because MinIO was removed. Existing MinIO-only objects
must be copied to `backend/uploads` before removing the old MinIO volume, or
they will no longer be served.
