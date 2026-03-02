use axum::{
    extract::{Extension, Multipart, Path, Query, State},
    response::IntoResponse,
    Json,
};
use rust_decimal::Decimal;
use serde_json::json;
use sqlx::{Postgres, QueryBuilder};
use std::str::FromStr;

use crate::{
    middleware::AuthUser,
    models::Item,
    utils::{err_msg, ok, ok_msg, upload::save_image_field},
    AppState,
};

use super::{pagination, role_guard, IdsPayload, ListQuery};

#[derive(Default)]
struct ItemMultipartPayload {
    name: Option<String>,
    price: Option<Decimal>,
    description: Option<String>,
    restaurant_id: Option<i32>,
    category_ids: Option<Vec<i32>>,
    images: Option<Vec<String>>,
}

fn append_category_ids(current: &mut Option<Vec<i32>>, raw: &str) {
    let mut parsed = current.take().unwrap_or_default();
    for segment in raw.split(',') {
        if let Ok(value) = segment.trim().parse::<i32>() {
            parsed.push(value);
        }
    }
    if !parsed.is_empty() {
        *current = Some(parsed);
    }
}

async fn parse_item_multipart(mut multipart: Multipart) -> Result<ItemMultipartPayload, String> {
    let mut payload = ItemMultipartPayload::default();

    loop {
        let Some(field) = multipart
            .next_field()
            .await
            .map_err(|_| "Invalid multipart payload.".to_string())?
        else {
            break;
        };

        let field_name = field.name().unwrap_or_default().to_string();
        if field_name == "images" && field.file_name().is_some() {
            let filename = save_image_field(field, "Public/Image", "images").await?;
            payload.images.get_or_insert_with(Vec::new).push(filename);
            continue;
        }

        let text_value = field
            .text()
            .await
            .map_err(|_| "Invalid form field value.".to_string())?;

        match field_name.as_str() {
            "name" => payload.name = Some(text_value),
            "price" => {
                payload.price = Decimal::from_str(text_value.trim()).ok();
            }
            "description" => {
                if !text_value.trim().is_empty() {
                    payload.description = Some(text_value);
                }
            }
            "restaurant_id" => {
                payload.restaurant_id = text_value.trim().parse::<i32>().ok();
            }
            "category" | "category_ids" => append_category_ids(&mut payload.category_ids, &text_value),
            "images" => {
                if !text_value.trim().is_empty() {
                    payload.images.get_or_insert_with(Vec::new).push(text_value);
                }
            }
            _ => {}
        }
    }

    Ok(payload)
}

pub async fn get_items(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).max(1);
    let offset = (page - 1) * per_page;

    let mut qb = QueryBuilder::<Postgres>::new(
        "SELECT id, name, price, description, restaurant_id, created_at, updated_at FROM items",
    );

    let mut has_where = false;

    if let Some(search) = &query.search {
        has_where = true;
        qb.push(" WHERE name LIKE ").push_bind(format!("%{}%", search));
    }

    if auth.0.role_id == 2 {
        let restaurant_id = sqlx::query_scalar::<_, i32>("SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1")
            .bind(auth.0.id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();

        if let Some(rid) = restaurant_id {
            if has_where {
                qb.push(" AND restaurant_id = ").push_bind(rid);
            } else {
                qb.push(" WHERE restaurant_id = ").push_bind(rid);
            }
        }
    }

    qb.push(" ORDER BY id DESC LIMIT ")
        .push_bind(per_page as i64)
        .push(" OFFSET ")
        .push_bind(offset as i64);

    let items = qb.build_query_as::<Item>().fetch_all(&state.db).await;

    let Ok(items) = items else {
        return err_msg("Error. Fetching Item Count Failed.");
    };

    ok(
        "Data Found.",
        json!({"items": items, "pagination": pagination(&query, items.len())}),
    )
}

pub async fn get_item(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let item = sqlx::query_as::<_, Item>(
        "SELECT id, name, price, description, restaurant_id, created_at, updated_at FROM items WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    match item {
        Ok(Some(i)) => ok("Data Found.", i),
        _ => err_msg("Data not Found."),
    }
}

pub async fn get_item_count(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    let count = if auth.0.role_id == 2 {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM items WHERE restaurant_id = (SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1)",
        )
        .bind(auth.0.id)
        .fetch_one(&state.db)
        .await
    } else {
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM items")
            .fetch_one(&state.db)
            .await
    };

    match count {
        Ok(value) => ok("Data Found.", value),
        Err(_) => err_msg("Error. Fetching Item Count Failed."),
    }
}

pub async fn last_ordered_items(
    State(state): State<AppState>,
    Extension(_auth): Extension<AuthUser>,
    Json(payload): Json<IdsPayload>,
) -> impl IntoResponse {
    if payload.ids.is_empty() {
        return err_msg("Fetching Data Failed. Please Try Again.");
    }

    let mut qb = QueryBuilder::<Postgres>::new(
        "SELECT id, name, price, description, restaurant_id, created_at, updated_at FROM items WHERE id IN (",
    );

    let mut separated = qb.separated(", ");
    for id in payload.ids {
        separated.push_bind(id);
    }
    separated.push_unseparated(") ORDER BY id DESC");

    let items = qb.build_query_as::<Item>().fetch_all(&state.db).await;

    match items {
        Ok(rows) if !rows.is_empty() => ok("Data Found.", json!({ "items": rows })),
        _ => err_msg("Fetching Data Failed. Please Try Again."),
    }
}

pub async fn create_item(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "restaurant"]) {
        return response.into_response();
    }

    let mut payload = match parse_item_multipart(multipart).await {
        Ok(value) => value,
        Err(message) => return err_msg(&message),
    };

    let Some(name) = payload.name.take() else {
        return err_msg("Please provide item name.");
    };

    let Some(price) = payload.price.take() else {
        return err_msg("Please provide item price.");
    };

    if auth.0.role_id == 2 {
        let restaurant_id = sqlx::query_scalar::<_, i32>("SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1")
            .bind(auth.0.id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();
        payload.restaurant_id = restaurant_id;
    }

    let inserted_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO items (name, price, description, restaurant_id) VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(name)
    .bind(price)
    .bind(payload.description)
    .bind(payload.restaurant_id)
    .fetch_one(&state.db)
    .await;

    let Ok(item_id) = inserted_id else {
        return err_msg("Creating Item Failed.");
    };

    if let Some(category_ids) = payload.category_ids {
        for category_id in category_ids {
            let _ = sqlx::query("INSERT INTO item_category (item_id, category_id) VALUES ($1, $2)")
                .bind(item_id)
                .bind(category_id)
                .execute(&state.db)
                .await;
        }
    }

    if let Some(images) = payload.images {
        for filename in images {
            let _ = sqlx::query("INSERT INTO item_images (item_id, filename) VALUES ($1, $2)")
                .bind(item_id)
                .bind(filename)
                .execute(&state.db)
                .await;
        }
    }

    ok_msg("Item Created Successfuly.")
}

pub async fn update_item(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
    multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "restaurant"]) {
        return response.into_response();
    }

    let payload = match parse_item_multipart(multipart).await {
        Ok(value) => value,
        Err(message) => return err_msg(&message),
    };

    let current = sqlx::query_as::<_, Item>(
        "SELECT id, name, price, description, restaurant_id, created_at, updated_at FROM items WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(existing)) = current else {
        return err_msg("Updating Item Failed. Please Try Again.");
    };

    let updated = sqlx::query("UPDATE items SET name = $1, price = $2, description = $3, restaurant_id = $4 WHERE id = $5")
        .bind(payload.name.or(existing.name))
        .bind(payload.price.or(existing.price))
        .bind(payload.description.or(existing.description))
        .bind(payload.restaurant_id.or(existing.restaurant_id))
        .bind(id)
        .execute(&state.db)
        .await;

    let Ok(result) = updated else {
        return err_msg("Error At Updating Item");
    };

    if result.rows_affected() == 0 {
        return err_msg("Updating Item Failed. Please Try Again.");
    }

    if let Some(category_ids) = payload.category_ids {
        let _ = sqlx::query("DELETE FROM item_category WHERE item_id = $1")
            .bind(id)
            .execute(&state.db)
            .await;
        for category_id in category_ids {
            let _ = sqlx::query("INSERT INTO item_category (item_id, category_id) VALUES ($1, $2)")
                .bind(id)
                .bind(category_id)
                .execute(&state.db)
                .await;
        }
    }

    if let Some(images) = payload.images {
        let _ = sqlx::query("DELETE FROM item_images WHERE item_id = $1")
            .bind(id)
            .execute(&state.db)
            .await;
        for filename in images {
            let _ = sqlx::query("INSERT INTO item_images (item_id, filename) VALUES ($1, $2)")
                .bind(id)
                .bind(filename)
                .execute(&state.db)
                .await;
        }
    }

    ok_msg("Item Updated Successfuly.")
}

pub async fn delete_item(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "restaurant"]) {
        return response.into_response();
    }

    let deleted = sqlx::query("DELETE FROM items WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    match deleted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Item Deleted Successfuly."),
        _ => err_msg("Deleting Item Failed. Please Try Again"),
    }
}
