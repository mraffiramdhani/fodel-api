# Fodel API (Rust + Axum)

Backend API for Fodel, implemented in Rust with Axum and SQLx.

## Requirements

- Rust toolchain
- PostgreSQL database (Supabase supported)

## Environment

Create `.env` in project root:

```env
APP_PORT=4040
API_VERSION=1
APP_KEY=y0u12_4pp_k3y

DB_SERVER=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASS=secret
DB_DATABASE=fodel

# Optional shortcut instead of DB_* vars
# DATABASE_URL=postgresql://postgres:secret@127.0.0.1:5432/fodel

# Supabase example
# DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require

MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_password

# Optional: run SQL seed script on startup
RUN_SQL_SEED=false
```

## Run

```bash
cargo run
```

Base URL:

`http://localhost:4040/api/v1`

## Database

- SQL migrations are in [migrations](migrations) and run automatically on startup via `sqlx::migrate!`.
- Seed SQL is in [seeds/001_initial_data.sql](seeds/001_initial_data.sql).

Manual seed example:

```bash
psql "$DATABASE_URL" -f seeds/001_initial_data.sql
```

## Static Assets

- Uploaded images: `Public/Image`
- Uploaded icons: `Public/Icon`
- Frontend static build served from `Client/build`
