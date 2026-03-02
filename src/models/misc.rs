use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct Role {
    pub id: i32,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct RevokedToken {
    pub id: u64,
    pub token: Option<String>,
    pub is_revoked: Option<i8>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct Pagination {
    pub current: i32,
    pub per_page: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prev: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<i32>,
}
