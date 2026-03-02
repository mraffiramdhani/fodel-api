use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: i32,
    pub name: Option<String>,
    pub icon: Option<String>,
}
