use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub id: i32,
    pub name: String,
    pub username: String,
    pub role_id: i32,
    pub exp: usize,
}
