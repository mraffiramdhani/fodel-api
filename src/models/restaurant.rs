use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Restaurant {
    pub id: i32,
    pub name: Option<String>,
    pub logo: Option<String>,
    pub longitude: Option<String>,
    pub latitude: Option<String>,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub active: Option<i8>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRestaurantPayload {
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub restaurant_name: String,
}
