use axum::{
    extract::{Extension, Path, State},
    response::IntoResponse,
    Json,
};

use crate::{
    middleware::AuthUser,
    models::{AddToCartPayload, UpdateCartPayload},
    utils::{err_msg, ok, ok_msg},
    AppState,
};

use super::role_guard;

pub async fn get_cart(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let rows = sqlx::query_as::<_, crate::models::Cart>(
        "SELECT id, item_id, quantity, description, user_id, is_complete, created_at, updated_at FROM carts WHERE user_id = $1 AND is_complete = 0 ORDER BY id DESC",
    )
    .bind(auth.0.id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(list) if !list.is_empty() => ok("Data Found.", list),
        Ok(_) => ok_msg("Your Cart Is Empty."),
        Err(_) => err_msg("Error At Fetching Cart Data."),
    }
}

pub async fn get_cart_by_id(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(item_id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let row = sqlx::query_as::<_, crate::models::Cart>(
        "SELECT id, item_id, quantity, description, user_id, is_complete, created_at, updated_at FROM carts WHERE user_id = $1 AND item_id = $2 AND is_complete = 0 LIMIT 1",
    )
    .bind(auth.0.id)
    .bind(item_id)
    .fetch_optional(&state.db)
    .await;

    match row {
        Ok(Some(item)) => ok("Data Found.", item),
        _ => err_msg("Fetching Cart Data Failed. Please Try Again."),
    }
}

pub async fn add_item_to_cart(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<AddToCartPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let inserted = sqlx::query(
        "INSERT INTO carts (item_id, quantity, description, user_id, is_complete) VALUES ($1, $2, $3, $4, 0)",
    )
    .bind(payload.item_id)
    .bind(payload.quantity)
    .bind(payload.description)
    .bind(auth.0.id)
    .execute(&state.db)
    .await;

    if inserted.is_err() {
        return err_msg("Adding Item To Cart Failed. Please Try Again.");
    }

    get_cart(State(state), Extension(auth)).await.into_response()
}

pub async fn update_item_in_cart(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(item_id): Path<i32>,
    Json(payload): Json<UpdateCartPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let updated = sqlx::query(
        "UPDATE carts SET quantity = COALESCE($1, quantity), description = COALESCE($2, description) WHERE user_id = $3 AND item_id = $4 AND is_complete = 0",
    )
    .bind(payload.quantity)
    .bind(payload.description)
    .bind(auth.0.id)
    .bind(item_id)
    .execute(&state.db)
    .await;

    let Ok(result) = updated else {
        return err_msg("Error At Updating Item");
    };

    if result.rows_affected() == 0 {
        return err_msg("Updating Item Cart Failed. Please Try Again");
    }

    get_cart(State(state), Extension(auth)).await.into_response()
}

pub async fn delete_item_in_cart(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(item_id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let deleted = sqlx::query("DELETE FROM carts WHERE user_id = $1 AND item_id = $2 AND is_complete = 0")
        .bind(auth.0.id)
        .bind(item_id)
        .execute(&state.db)
        .await;

    let Ok(result) = deleted else {
        return err_msg("Error At Deleting Cart Item.");
    };

    if result.rows_affected() == 0 {
        return err_msg("Deleting Cart Item Failed. Please Try Again.");
    }

    get_cart(State(state), Extension(auth)).await.into_response()
}

pub async fn checkout_cart(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let updated = sqlx::query("UPDATE carts SET is_complete = 1 WHERE user_id = $1 AND is_complete = 0")
        .bind(auth.0.id)
        .execute(&state.db)
        .await;

    match updated {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Checkout Complete."),
        _ => err_msg("Completing Checkout Failed. Please Try Again."),
    }
}
