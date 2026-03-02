use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Item {
    pub id: i32,
    pub name: Option<String>,
    pub price: Option<Decimal>,
    pub description: Option<String>,
    pub restaurant_id: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ItemImage {
    pub id: i32,
    pub item_id: Option<i32>,
    pub filename: Option<String>,
}
