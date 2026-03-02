use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Cart {
    pub id: i32,
    pub item_id: Option<i32>,
    pub quantity: Option<i32>,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub is_complete: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct AddToCartPayload {
    pub item_id: i32,
    pub quantity: i32,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCartPayload {
    pub quantity: Option<i32>,
    pub description: Option<String>,
}
