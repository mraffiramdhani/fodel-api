use axum::{
    extract::{Extension, Multipart, Path, Query, State},
    response::IntoResponse,
};
use serde_json::json;
use sqlx::{Postgres, QueryBuilder};

use crate::{
    middleware::AuthUser,
    models::Category,
    utils::{err_msg, ok, ok_msg, upload::save_image_field},
    AppState,
};

use super::{pagination, role_guard, ListQuery};

pub async fn get_categories(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).max(1);
    let offset = (page - 1) * per_page;

    let mut qb = QueryBuilder::<Postgres>::new("SELECT id, name, icon FROM categories");

    if let Some(search) = &query.search {
        qb.push(" WHERE name LIKE ").push_bind(format!("%{}%", search));
    }

    qb.push(" ORDER BY id DESC LIMIT ")
        .push_bind(per_page as i64)
        .push(" OFFSET ")
        .push_bind(offset as i64);

    let categories = qb.build_query_as::<Category>().fetch_all(&state.db).await;

    let Ok(categories) = categories else {
        return err_msg("Error. Fetching Category Count Failed.");
    };

    ok(
        "Data Found.",
        json!({"categories": categories, "pagination": pagination(&query, categories.len())}),
    )
}

pub async fn get_category(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let category = sqlx::query_as::<_, Category>("SELECT id, name, icon FROM categories WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&state.db)
        .await;

    match category {
        Ok(Some(c)) => ok("Data Found.", c),
        _ => err_msg("Data not Found."),
    }
}

pub async fn create_category(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let mut name: Option<String> = None;
    let mut icon: Option<String> = None;

    loop {
        let Some(field) = (match multipart.next_field().await {
            Ok(value) => value,
            Err(_) => return err_msg("Invalid multipart payload."),
        }) else {
            break;
        };

        let field_name = field.name().unwrap_or_default().to_string();
        if field_name == "name" {
            match field.text().await {
                Ok(value) => name = Some(value),
                Err(_) => return err_msg("Invalid category name."),
            }
            continue;
        }

        if field_name == "icon" {
            if field.file_name().is_some() {
                match save_image_field(field, "Public/Icon", "icon").await {
                    Ok(filename) => icon = Some(filename),
                    Err(message) => return err_msg(&message),
                }
            } else {
                match field.text().await {
                    Ok(value) if !value.trim().is_empty() => icon = Some(value),
                    Ok(_) => {}
                    Err(_) => return err_msg("Invalid category icon."),
                }
            }
        }
    }

    let Some(name) = name else {
        return err_msg("Please provide category name.");
    };

    let inserted_id = sqlx::query_scalar::<_, i32>("INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING id")
        .bind(name)
        .bind(icon)
        .fetch_one(&state.db)
        .await;

    let Ok(inserted_id) = inserted_id else {
        return err_msg("Creating Category Failed. Please Try Again.");
    };

    get_category(State(state), Path(inserted_id))
        .await
        .into_response()
}

pub async fn update_category(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let mut next_name: Option<String> = None;
    let mut next_icon: Option<String> = None;

    loop {
        let Some(field) = (match multipart.next_field().await {
            Ok(value) => value,
            Err(_) => return err_msg("Invalid multipart payload."),
        }) else {
            break;
        };

        let field_name = field.name().unwrap_or_default().to_string();
        if field_name == "name" {
            match field.text().await {
                Ok(value) => next_name = Some(value),
                Err(_) => return err_msg("Invalid category name."),
            }
            continue;
        }

        if field_name == "icon" {
            if field.file_name().is_some() {
                match save_image_field(field, "Public/Icon", "icon").await {
                    Ok(filename) => next_icon = Some(filename),
                    Err(message) => return err_msg(&message),
                }
            } else {
                match field.text().await {
                    Ok(value) if !value.trim().is_empty() => next_icon = Some(value),
                    Ok(_) => {}
                    Err(_) => return err_msg("Invalid category icon."),
                }
            }
        }
    }

    let current = sqlx::query_as::<_, Category>("SELECT id, name, icon FROM categories WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&state.db)
        .await;

    let Ok(Some(existing)) = current else {
        return err_msg("Fetching Category Data Failed. Please Try Again");
    };

    let updated = sqlx::query("UPDATE categories SET name = $1, icon = $2 WHERE id = $3")
        .bind(next_name.or(existing.name))
        .bind(next_icon.or(existing.icon))
        .bind(id)
        .execute(&state.db)
        .await;

    if updated.is_err() {
        return err_msg("Updating Category Failed. Please Try Again.");
    }

    get_category(State(state), Path(id)).await.into_response()
}

pub async fn delete_category(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let deleted = sqlx::query("DELETE FROM categories WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    match deleted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Category Deleted Successfuly."),
        _ => err_msg("Deleting Category Failed. Please Try Again"),
    }
}
