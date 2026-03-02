use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: i32,
    pub name: Option<String>,
    pub username: Option<String>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    pub email: Option<String>,
    pub photo: Option<String>,
    pub role_id: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub role_id: Option<i32>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserPayload {
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub photo: Option<String>,
    pub role_id: Option<i32>,
}
