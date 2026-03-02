use axum::{
    extract::{Extension, Multipart, Path, Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::{Postgres, QueryBuilder};

use crate::{
    middleware::AuthUser,
    models::{
        RegisterRestaurantPayload, Restaurant,
    },
    utils::{cache, err_msg, hash_password, ok, ok_msg, upload::save_image_field},
    AppState,
};

use super::{pagination, role_guard, ListQuery};

fn restaurant_order_clause(sort: Option<&str>) -> &'static str {
    match sort.unwrap_or_default().to_ascii_lowercase().as_str() {
        "name_asc" => " ORDER BY name ASC",
        "name_desc" => " ORDER BY name DESC",
        "id_asc" => " ORDER BY id ASC",
        _ => " ORDER BY id DESC",
    }
}

fn restaurant_cache_key(query: &ListQuery) -> String {
    format!(
        "resto_index:page={}:perPage={}:search={}:sort={}",
        query.page.unwrap_or(1),
        query.per_page.unwrap_or(10),
        query.search.clone().unwrap_or_default(),
        query.sort.clone().unwrap_or_default(),
    )
}

#[derive(Default)]
struct RestaurantMultipartPayload {
    name: Option<String>,
    logo: Option<String>,
    longitude: Option<String>,
    latitude: Option<String>,
    description: Option<String>,
    user_id: Option<i32>,
    active: Option<i8>,
}

async fn parse_restaurant_multipart(
    mut multipart: Multipart,
    allow_active: bool,
) -> Result<RestaurantMultipartPayload, String> {
    let mut payload = RestaurantMultipartPayload::default();

    loop {
        let Some(field) = multipart
            .next_field()
            .await
            .map_err(|_| "Invalid multipart payload.".to_string())?
        else {
            break;
        };

        let field_name = field.name().unwrap_or_default().to_string();
        if field_name == "logo" && field.file_name().is_some() {
            let filename = save_image_field(field, "Public/Image", "logo").await?;
            payload.logo = Some(filename);
            continue;
        }

        let text_value = field
            .text()
            .await
            .map_err(|_| "Invalid form field value.".to_string())?;

        match field_name.as_str() {
            "name" => payload.name = Some(text_value),
            "logo" => {
                if !text_value.trim().is_empty() {
                    payload.logo = Some(text_value);
                }
            }
            "longitude" => {
                if !text_value.trim().is_empty() {
                    payload.longitude = Some(text_value);
                }
            }
            "latitude" => {
                if !text_value.trim().is_empty() {
                    payload.latitude = Some(text_value);
                }
            }
            "description" => {
                if !text_value.trim().is_empty() {
                    payload.description = Some(text_value);
                }
            }
            "user_id" => payload.user_id = text_value.trim().parse::<i32>().ok(),
            "active" if allow_active => payload.active = text_value.trim().parse::<i8>().ok(),
            _ => {}
        }
    }

    Ok(payload)
}

pub async fn get_restaurants(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let cache_key = restaurant_cache_key(&query);
    if let Some(cached_data) = cache::get(&cache_key).await {
        return ok("Data Found - Redis Cache", cached_data);
    }

    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).max(1);
    let offset = (page - 1) * per_page;

    let mut qb = QueryBuilder::<Postgres>::new(
        "SELECT id, name, logo, longitude, latitude, description, user_id, active, created_at, updated_at FROM restaurants",
    );

    if let Some(search) = &query.search {
        qb.push(" WHERE name LIKE ").push_bind(format!("%{}%", search));
    }

    qb.push(restaurant_order_clause(query.sort.as_deref()))
        .push(" LIMIT ")
        .push_bind(per_page as i64)
        .push(" OFFSET ")
        .push_bind(offset as i64);

    let restaurants = qb.build_query_as::<Restaurant>().fetch_all(&state.db).await;

    let Ok(restaurants) = restaurants else {
        return err_msg("Error. Fetching Restaurant Count Failed.");
    };

    let data = json!({"restaurants": restaurants, "pagination": pagination(&query, restaurants.len())});
    cache::set(cache_key, 10, data.clone()).await;

    ok("Data Found - Database Query", data)
}

pub async fn get_restaurant(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let restaurant = sqlx::query_as::<_, Restaurant>(
        "SELECT id, name, logo, longitude, latitude, description, user_id, active, created_at, updated_at FROM restaurants WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    match restaurant {
        Ok(Some(r)) => ok("Data Found.", r),
        _ => err_msg("Data not Found."),
    }
}

pub async fn register_restaurant(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRestaurantPayload>,
) -> impl IntoResponse {
    let user_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO users (name, email, username, password, role_id, photo) VALUES ($1, $2, $3, $4, 3, 'default.png') RETURNING id",
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.username)
    .bind(hash_password(&payload.password))
    .fetch_one(&state.db)
    .await;

    let Ok(user_id) = user_id else {
        return err_msg("Creating Restaurant User Failed. Please Try Again");
    };

    let created = sqlx::query(
        "INSERT INTO restaurants (name, logo, longitude, latitude, description, user_id, active) VALUES ($1, NULL, NULL, NULL, NULL, $2, 0)",
    )
    .bind(payload.restaurant_name)
    .bind(user_id)
    .execute(&state.db)
    .await;

    match created {
        Ok(_) => ok_msg("Request Sended"),
        _ => err_msg("Creating Restaurant Failed. Please Try Again."),
    }
}

pub async fn create_restaurant(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let payload = match parse_restaurant_multipart(multipart, false).await {
        Ok(value) => value,
        Err(message) => return err_msg(&message),
    };

    let Some(name) = payload.name else {
        return err_msg("Please provide restaurant name.");
    };

    let inserted_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO restaurants (name, logo, longitude, latitude, description, user_id, active) VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING id",
    )
    .bind(name)
    .bind(payload.logo)
    .bind(payload.longitude)
    .bind(payload.latitude)
    .bind(payload.description)
    .bind(payload.user_id)
    .fetch_one(&state.db)
    .await;

    let Ok(inserted_id) = inserted_id else {
        return err_msg("Creating Restaurant Failed. Please Try Again.");
    };

    if let Some(user_id) = payload.user_id {
        let _ = sqlx::query("UPDATE users SET role_id = 2 WHERE id = $1")
            .bind(user_id)
            .execute(&state.db)
            .await;
    }

    get_restaurant(State(state), Path(inserted_id))
        .await
        .into_response()
}

pub async fn update_restaurant(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
    multipart: Multipart,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "restaurant"]) {
        return response.into_response();
    }

    let payload = match parse_restaurant_multipart(multipart, true).await {
        Ok(value) => value,
        Err(message) => return err_msg(&message),
    };

    let current = sqlx::query_as::<_, Restaurant>(
        "SELECT id, name, logo, longitude, latitude, description, user_id, active, created_at, updated_at FROM restaurants WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(existing)) = current else {
        return err_msg("Updating Restaurant Failed. Please Try Again.");
    };

    let updated = sqlx::query(
        "UPDATE restaurants SET name = $1, logo = $2, longitude = $3, latitude = $4, description = $5, active = $6 WHERE id = $7",
    )
    .bind(payload.name.or(existing.name))
    .bind(payload.logo.or(existing.logo))
    .bind(payload.longitude.or(existing.longitude))
    .bind(payload.latitude.or(existing.latitude))
    .bind(payload.description.or(existing.description))
    .bind(payload.active.or(existing.active))
    .bind(id)
    .execute(&state.db)
    .await;

    if updated.is_err() {
        return err_msg("Error At Updating Restaurant");
    }

    ok_msg("Restaurant Updated Successfuly.")
}

pub async fn approve_restaurant(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator"]) {
        return response.into_response();
    }

    let updated = sqlx::query("UPDATE restaurants SET active = 1 WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    let Ok(result) = updated else {
        return err_msg("Updating Restaurant Status Failed. Please Try Again.");
    };

    if result.rows_affected() == 0 {
        return err_msg("Updating Restaurant Status Failed. Please Try Again.");
    }

    let user_id = sqlx::query_scalar::<_, i32>("SELECT user_id FROM restaurants WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&state.db)
        .await;

    if let Ok(Some(uid)) = user_id {
        let _ = sqlx::query("UPDATE users SET role_id = 2 WHERE id = $1")
            .bind(uid)
            .execute(&state.db)
            .await;
    }

    ok_msg("Restaurant Approved.")
}

pub async fn delete_restaurant(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Some(response) = role_guard(&auth, &["administrator", "restaurant"]) {
        return response.into_response();
    }

    let deleted = sqlx::query("DELETE FROM restaurants WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;

    match deleted {
        Ok(result) if result.rows_affected() > 0 => ok_msg("Restaurant Deleted Successfuly."),
        _ => err_msg("Deleting Restaurant Failed. Please Try Again"),
    }
}
