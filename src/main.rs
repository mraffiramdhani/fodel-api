mod handlers;
mod middleware;
mod models;
mod utils;

use std::{net::SocketAddr, time::Duration};

use axum::{
    middleware::from_fn_with_state,
    routing::{get, patch, post},
    Router,
};
use dotenvy::dotenv;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{handlers::*, middleware::auth};

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
}

fn api_router(state: AppState) -> Router {
    let protected = Router::new()
        .route("/logout", get(logout_user))
        .route("/profile", get(get_profile))
        .route("/password/reset", patch(update_profile))
        .route("/profile/photo", patch(update_profile_photo))
        .route("/user", post(create_user))
        .route("/user/:id", patch(update_user).delete(delete_user))
        .route("/cart", get(get_cart).post(add_item_to_cart))
        .route("/cart/:itemId", get(get_cart_by_id).patch(update_item_in_cart).delete(delete_item_in_cart))
        .route("/checkout/cart", patch(checkout_cart))
        .route("/category", post(create_category))
        .route("/category/:id", patch(update_category).delete(delete_category))
        .route("/item", get(get_items).post(create_item))
        .route("/item/:id", get(get_item).patch(update_item).delete(delete_item))
        .route("/count/item", get(get_item_count))
        .route("/order/item", post(last_ordered_items))
        .route("/restaurant", post(create_restaurant))
        .route("/restaurant/:id", patch(update_restaurant).delete(delete_restaurant))
        .route("/restaurant/approve/:id", patch(approve_restaurant))
        .route("/review", get(get_user_review).post(create_review))
        .route("/review/:id", patch(update_review).delete(delete_review))
        .route_layer(from_fn_with_state(state.clone(), auth));

    Router::new()
        .route("/", get(home))
        .route("/login", post(login_user))
        .route("/register", post(register_user))
        .route("/token/check", post(check_token))
        .route("/password", post(forgot_password))
        .route("/user", get(get_users))
        .route("/user/:id", get(get_user_by_id))
        .route("/category", get(get_categories))
        .route("/category/:id", get(get_category))
        .route("/restaurant", get(get_restaurants))
        .route("/restaurant/:id", get(get_restaurant))
        .route("/restaurant/register", post(register_restaurant))
        .route("/review/:id", get(get_item_review))
        .merge(protected)
        .with_state(state)
}

fn app_router(state: AppState, api_prefix: &str) -> Router {
    Router::new()
        .nest(api_prefix, api_router(state))
        .nest_service("/images", ServeDir::new("Public/Image"))
        .nest_service("/icons", ServeDir::new("Public/Icon"))
        .fallback_service(
            ServeDir::new("Client/build")
                .not_found_service(ServeFile::new("Client/build/index.html")),
        )
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(CorsLayer::new().allow_origin(Any).allow_headers(Any).allow_methods(Any))
}

async fn run_sql_seed_if_enabled(db: &Pool<Postgres>) {
    let should_seed = std::env::var("RUN_SQL_SEED")
        .map(|value| {
            let normalized = value.to_lowercase();
            normalized == "1" || normalized == "true" || normalized == "yes"
        })
        .unwrap_or(false);

    if !should_seed {
        return;
    }

    let seed_path = "./seeds/001_initial_data.sql";
    let sql = tokio::fs::read_to_string(seed_path)
        .await
        .expect("Failed to read SQL seed file");

    for statement in sql.split(';') {
        let trimmed = statement.trim();
        if trimmed.is_empty() {
            continue;
        }

        sqlx::query(trimmed)
            .execute(db)
            .await
            .expect("Failed to execute SQL seed statement");
    }

    tracing::info!("SQL seed executed from {}", seed_path);
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let (db_url, db_source) = match std::env::var("DATABASE_URL") {
        Ok(url) => (url, "DATABASE_URL"),
        Err(_) => {
            let host = std::env::var("DB_SERVER")
                .or_else(|_| std::env::var("PGHOST"))
                .unwrap_or_else(|_| "127.0.0.1".into());
            let port = std::env::var("DB_PORT")
                .or_else(|_| std::env::var("PGPORT"))
                .unwrap_or_else(|_| "5432".into());
            let user = std::env::var("DB_USER")
                .or_else(|_| std::env::var("PGUSER"))
                .unwrap_or_else(|_| "postgres".into());
            let pass = std::env::var("DB_PASS")
                .or_else(|_| std::env::var("PGPASSWORD"))
                .unwrap_or_default();
            let name = std::env::var("DB_DATABASE")
                .or_else(|_| std::env::var("PGDATABASE"))
                .unwrap_or_else(|_| "fodel".into());
            let sslmode = std::env::var("DB_SSLMODE")
                .or_else(|_| std::env::var("PGSSLMODE"))
                .unwrap_or_else(|_| "disable".into());
            (
                format!(
                    "postgresql://{}:{}@{}:{}/{}?sslmode={}",
                    user, pass, host, port, name, sslmode
                ),
                "DB_*/PG* variables",
            )
        }
    };

    tracing::info!("Using PostgreSQL config from {}", db_source);

    let max_connections = std::env::var("DB_MAX_CONNECTIONS")
        .ok()
        .and_then(|value| value.parse::<u32>().ok())
        .unwrap_or(5);

    let mut attempt = 1u32;
    let db = loop {
        match PgPoolOptions::new().max_connections(max_connections).connect(&db_url).await {
            Ok(pool) => break pool,
            Err(err) if attempt < 6 => {
                tracing::warn!(
                    "PostgreSQL connection attempt {}/6 failed: {}. Retrying in 2s...",
                    attempt,
                    err
                );
                attempt += 1;
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
            Err(err) => {
                eprintln!("Failed to connect to PostgreSQL: {}", err);
                eprintln!(
                    "Hint: set DATABASE_URL in .env, or provide DB_SERVER/DB_PORT/DB_USER/DB_PASS/DB_DATABASE (and DB_SSLMODE for remote DB). PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE/PGSSLMODE are also supported."
                );
                eprintln!(
                    "Hint: if using Supabase pooler and you see circuit breaker errors, retry after a short wait or use session mode (port 5432)."
                );
                std::process::exit(1);
            }
        }
    };

    let should_run_migrations = std::env::var("RUN_MIGRATIONS")
        .map(|value| {
            let normalized = value.to_lowercase();
            normalized == "1" || normalized == "true" || normalized == "yes"
        })
        .unwrap_or(true);

    if should_run_migrations {
        if let Err(err) = sqlx::migrate!().run(&db).await {
            eprintln!("Failed to run database migrations: {}", err);
            eprintln!(
                "Hint: Supabase transaction pooler can time out during migration locking. Run migrations with direct/session connection, or set RUN_MIGRATIONS=false for app startup."
            );
            std::process::exit(1);
        }
    } else {
        tracing::info!("Skipping migrations because RUN_MIGRATIONS=false");
    }

    run_sql_seed_if_enabled(&db).await;

    let state = AppState { db };
    let api_version = std::env::var("API_VERSION").unwrap_or_else(|_| "1".into());
    let api_prefix = format!("/api/v{}", api_version);

    let port = std::env::var("APP_PORT").ok().and_then(|x| x.parse().ok()).unwrap_or(4040);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind TCP listener");

    axum::serve(listener, app_router(state, &api_prefix)).await.expect("Server error");
}
