use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Review {
    pub id: i32,
    pub rating: Option<i8>,
    pub review: Option<String>,
    pub item_id: Option<i32>,
    pub user_id: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewPayload {
    pub rating: i8,
    pub review: Option<String>,
    pub item_id: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReviewPayload {
    pub rating: Option<i8>,
    pub review: Option<String>,
}
