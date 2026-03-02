use axum::{
    extract::{Extension, Path, Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::{Postgres, QueryBuilder};

use crate::{
    middleware::AuthUser,
    models::{CreateUserPayload, UpdateUserPayload, User},
    utils::{cache, err_msg, hash_password, ok, ok_msg},
    AppState,
};

use super::{pagination, role_guard, ListQuery};

fn user_order_clause(sort: Option<&str>) -> &'static str {
    match sort.unwrap_or_default().to_ascii_lowercase().as_str() {
        "name_asc" => " ORDER BY name ASC",
        "name_desc" => " ORDER BY name DESC",
        "username_asc" => " ORDER BY username ASC",
        "username_desc" => " ORDER BY username DESC",
        "id_asc" => " ORDER BY id ASC",
        _ => " ORDER BY id DESC",
    }
}

fn user_cache_key(query: &ListQuery) -> String {
    format!(
        "user_index:page={}:perPage={}:search={}:sort={}",
        query.page.unwrap_or(1),
        query.per_page.unwrap_or(10),
        query.search.clone().unwrap_or_default(),
        query.sort.clone().unwrap_or_default(),
    )
}

pub async fn get_users(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let cache_key = user_cache_key(&query);
    if let Some(cached_data) = cache::get(&cache_key).await {
        return ok("Data Found - Redis Cache", cached_data);
    }

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).max(1);
    let offset = (page - 1) * per_page;

    let mut qb = QueryBuilder::<Postgres>::new(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users",
    );

    if let Some(search) = &query.search {
        let pattern = format!("%{}%", search);
        qb.push(" WHERE name LIKE ")
            .push_bind(pattern.clone())
            .push(" OR username LIKE ")
            .push_bind(pattern);
    }

    qb.push(user_order_clause(query.sort.as_deref()))
        .push(" LIMIT ")
        .push_bind(per_page as i64)
        .push(" OFFSET ")
        .push_bind(offset as i64);

    let rows = qb.build_query_as::<User>().fetch_all(&state.db).await;

    let Ok(mut users) = rows else {
        return err_msg("Error. Fetching User Count Failed.");
    };

    users.iter_mut().for_each(|u| u.password = None);

    let data = json!({"users": users, "pagination": pagination(&query, users.len())});
    cache::set(cache_key, 10, data.clone()).await;

    ok("Data Found - Database Query", data)
}

pub async fn get_user_by_id(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(mut found)) = user else {
        return err_msg("Data not Found.");
    };

    found.password = None;
    ok("Data Found.", found)
}

pub async fn create_user(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateUserPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let hashed = hash_password(&payload.password);
    let role = payload.role_id.unwrap_or(3);

    let inserted_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO users (name, email, username, password, role_id, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    )
    .bind(payload.name)
    .bind(payload.email)
    .bind(payload.username)
    .bind(hashed)
    .bind(role)
    .bind(payload.photo.unwrap_or_else(|| "default.png".into()))
    .fetch_one(&state.db)
    .await;

    let Ok(inserted_id) = inserted_id else {
        return err_msg("Creating User Failed. Please Try Again.");
    };

    get_user_by_id(State(state), Path(inserted_id))
        .await
        .into_response()
}

pub async fn update_user(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
    Json(mut payload): Json<UpdateUserPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let current = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(existing)) = current else {
        return err_msg("Fetching User Data Failed. Please Try Again");
    };

    let password = payload
        .password
        .take()
        .map(|p| hash_password(&p))
        .or(existing.password)
        .unwrap_or_default();

    let updated = sqlx::query(
        "UPDATE users SET name = $1, username = $2, email = $3, password = $4, photo = $5, role_id = $6 WHERE id = $7",
    )
    .bind(payload.name.or(existing.name))
    .bind(payload.username.or(existing.username))
    .bind(payload.email.or(existing.email))
    .bind(password)
    .bind(payload.photo.or(existing.photo))
    .bind(payload.role_id.or(existing.role_id))
    .bind(id)
    .execute(&state.db)
    .await;

    if updated.is_err() {
        return err_msg("Updating User Failed. Please Try Again.");
    }

    get_user_by_id(State(state), Path(id)).await.into_response()
}

pub async fn delete_user(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let deleted = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    match deleted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("User Deleted Successfuly."),
        _ => err_msg("Deleting User Failed. Please Try Again"),
    }
}
