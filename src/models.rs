use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

// ── Users ──────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: u32,
    pub name: Option<String>,
    pub username: Option<String>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    pub email: Option<String>,
    pub photo: Option<String>,
    pub role_id: Option<u32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub role_id: Option<u32>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserPayload {
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub photo: Option<String>,
    pub role_id: Option<u32>,
}

// ── Roles ──────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Role {
    pub id: u32,
    pub name: Option<String>,
    pub description: Option<String>,
}

// ── Revoked Tokens ─────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct RevokedToken {
    pub id: u64,
    pub token: Option<String>,
    pub is_revoked: Option<i8>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// ── Categories ─────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: u32,
    pub name: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryPayload {
    pub name: String,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryPayload {
    pub name: Option<String>,
    pub icon: Option<String>,
}

// ── Restaurants ────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Restaurant {
    pub id: u32,
    pub name: Option<String>,
    pub logo: Option<String>,
    pub longitude: Option<String>,
    pub latitude: Option<String>,
    pub description: Option<String>,
    pub user_id: Option<u32>,
    pub active: Option<i8>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateRestaurantPayload {
    pub name: String,
    pub logo: Option<String>,
    pub longitude: Option<String>,
    pub latitude: Option<String>,
    pub description: Option<String>,
    pub user_id: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRestaurantPayload {
    pub name: Option<String>,
    pub logo: Option<String>,
    pub longitude: Option<String>,
    pub latitude: Option<String>,
    pub description: Option<String>,
    pub active: Option<i8>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRestaurantPayload {
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub restaurant_name: String,
}

// ── Items ──────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Item {
    pub id: u32,
    pub name: Option<String>,
    pub price: Option<Decimal>,
    pub description: Option<String>,
    pub restaurant_id: Option<u32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateItemPayload {
    pub name: String,
    pub price: Decimal,
    pub description: Option<String>,
    pub restaurant_id: Option<u32>,
    pub category_ids: Option<Vec<u32>>, 
}

#[derive(Debug, Deserialize)]
pub struct UpdateItemPayload {
    pub name: Option<String>,
    pub price: Option<Decimal>,
    pub description: Option<String>,
    pub restaurant_id: Option<u32>,
}

// ── Item Images ────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ItemImage {
    pub id: u32,
    pub item_id: Option<u32>,
    pub filename: Option<String>,
}

// ── Carts ──────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Cart {
    pub id: u32,
    pub item_id: Option<u32>,
    pub quantity: Option<i32>,
    pub description: Option<String>,
    pub user_id: Option<u32>,
    pub is_complete: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct AddToCartPayload {
    pub item_id: u32,
    pub quantity: i32,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCartPayload {
    pub quantity: Option<i32>,
    pub description: Option<String>,
}

// ── Reviews ────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Review {
    pub id: u32,
    pub rating: Option<i8>,
    pub review: Option<String>,
    pub item_id: Option<u32>,
    pub user_id: Option<u32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewPayload {
    pub rating: i8,
    pub review: Option<String>,
    pub item_id: u32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReviewPayload {
    pub rating: Option<i8>,
    pub review: Option<String>,
}

// ── Auth Payloads ──────────────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterPayload {
    pub name: String,
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ForgotPasswordPayload {
    pub username: String,
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct CheckTokenPayload {
    pub token: String,
}

// ── Pagination ─────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct Pagination {
    pub current: u32,
    pub per_page: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prev: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<u32>,
}

// ── JWT Claims ─────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub id: u32,
    pub name: String,
    pub username: String,
    pub role_id: u32,
    pub exp: usize,
}
