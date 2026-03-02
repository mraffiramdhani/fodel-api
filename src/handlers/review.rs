use axum::{
    extract::{Extension, Path, State},
    response::IntoResponse,
    Json,
};

use crate::{
    middleware::AuthUser,
    models::{CreateReviewPayload, Review, UpdateReviewPayload},
    utils::{err_msg, ok, ok_msg},
    AppState,
};

use super::role_guard;

pub async fn get_item_review(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, Review>(
        "SELECT id, rating, review, item_id, user_id, created_at, updated_at FROM reviews WHERE item_id = $1 ORDER BY id DESC",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(list) if !list.is_empty() => ok("Data Found.", list),
        Ok(_) => ok_msg("Your Review Is Empty."),
        Err(_) => err_msg("Error At Fetching Review Data."),
    }
}

pub async fn get_user_review(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let rows = sqlx::query_as::<_, Review>(
        "SELECT id, rating, review, item_id, user_id, created_at, updated_at FROM reviews WHERE user_id = $1 ORDER BY id DESC",
    )
    .bind(auth.0.id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(list) if !list.is_empty() => ok("Data Found.", list),
        Ok(_) => ok_msg("Your Review Is Empty."),
        Err(_) => err_msg("Error At Fetching Review Data."),
    }
}

pub async fn create_review(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateReviewPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["customer"]) {
        return response.into_response();
    }

    let inserted = sqlx::query("INSERT INTO reviews (rating, review, item_id, user_id) VALUES ($1, $2, $3, $4)")
        .bind(payload.rating)
        .bind(payload.review)
        .bind(payload.item_id)
        .bind(auth.0.id)
        .execute(&state.db)
        .await;

    match inserted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Review Added Successfuly."),
        _ => err_msg("Adding Review Failed. Please Try Again."),
    }
}

pub async fn update_review(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(item_id): Path<i32>,
    Json(payload): Json<UpdateReviewPayload>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "customer"]) {
        return response.into_response();
    }

    let updated = if auth.0.role_id == 1 {
        sqlx::query(
            "UPDATE reviews SET rating = COALESCE($1, rating), review = COALESCE($2, review) WHERE item_id = $3",
        )
        .bind(payload.rating)
        .bind(payload.review)
        .bind(item_id)
        .execute(&state.db)
        .await
    } else {
        sqlx::query(
            "UPDATE reviews SET rating = COALESCE($1, rating), review = COALESCE($2, review) WHERE item_id = $3 AND user_id = $4",
        )
        .bind(payload.rating)
        .bind(payload.review)
        .bind(item_id)
        .bind(auth.0.id)
        .execute(&state.db)
        .await
    };

    match updated {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Review Updated Successfuly."),
        _ => err_msg("Updating Review Failed. Please Try Again"),
    }
}

pub async fn delete_review(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "customer"]) {
        return response.into_response();
    }

    let deleted = if auth.0.role_id == 1 {
        sqlx::query("DELETE FROM reviews WHERE id = $1")
            .bind(id)
            .execute(&state.db)
            .await
    } else {
        sqlx::query("DELETE FROM reviews WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(auth.0.id)
            .execute(&state.db)
            .await
    };

    match deleted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Review Deleted Successfuly."),
        _ => err_msg("Deleting Review Failed. Please Try Again."),
    }
}
