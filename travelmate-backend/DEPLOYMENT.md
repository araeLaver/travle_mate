# TravelMate Backend Deployment

## Database ownership

Production uses Flyway as the schema owner. Hibernate must only validate the schema:

- `SPRING_PROFILES_ACTIVE=prod`
- `spring.jpa.hibernate.ddl-auto=validate`
- `spring.flyway.enabled=true`
- `spring.flyway.schemas=travelmate`
- `spring.flyway.default-schema=travelmate`

Development and tests intentionally keep Flyway disabled so local H2/dev schema creation remains fast.

## Existing production database

If the production PostgreSQL database already has application tables that were created by Hibernate, deploy with the current `baseline-on-migrate=true` and `baseline-version=6` settings. Flyway will create `travelmate.flyway_schema_history`, mark legacy versions `1` through `6` as already represented by the live schema, and only run future migrations such as `V7__...`.

Before first deploy, confirm the app user can create objects in the `travelmate` schema or can create the schema:

```sql
CREATE SCHEMA IF NOT EXISTS travelmate;
GRANT USAGE, CREATE ON SCHEMA travelmate TO <app_user>;
```

Do not edit a versioned migration after it has run in a shared database. Add a new `V{next}__description.sql` migration instead.

## Fresh production database

For an empty PostgreSQL database, Flyway runs all versioned migrations from `V1` onward. The legacy index migrations are guarded so optional tables or columns that are not present yet do not stop a fresh install.

Recommended preflight command:

```bash
SPRING_PROFILES_ACTIVE=prod \
DB_URL='jdbc:postgresql://localhost:5432/travelmate?options=-c%20search_path%3Dtravelmate,public' \
DB_USERNAME=travelmate_user \
DB_PASSWORD=... \
JWT_SECRET=... \
TOSS_SECRET_KEY=... \
TOSS_CLIENT_KEY=... \
./mvnw -DskipTests package
```

After deploy, check the Flyway history and schema validation:

```sql
SELECT installed_rank, version, description, success
FROM travelmate.flyway_schema_history
ORDER BY installed_rank;
```
