use axum::{http::StatusCode, response::IntoResponse, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use lettre::{
    message::header::ContentType, transport::smtp::authentication::Credentials, AsyncSmtpTransport,
    AsyncTransport, Message, Tokio1Executor,
};
use rand::{distributions::Alphanumeric, Rng};
use serde::Serialize;
use serde_json::{json, Value};

use crate::models::Claims;

// ── Unified JSON response ──────────────────────────────────────────────────────

pub fn api_response(
    status: StatusCode,
    success: bool,
    message: &str,
    data: Option<Value>,
) -> impl IntoResponse {
    let mut body = json!({
        "success": success,
        "message": message,
    });
    if let Some(d) = data {
        body["data"] = d;
    }
    (status, Json(body))
}

pub fn ok<S: Serialize>(message: &str, data: S) -> impl IntoResponse {
    api_response(
        StatusCode::OK,
        true,
        message,
        Some(serde_json::to_value(data).unwrap_or(Value::Null)),
    )
}

pub fn ok_msg(message: &str) -> impl IntoResponse {
    api_response(StatusCode::OK, true, message, None)
}

pub fn err_msg(message: &str) -> impl IntoResponse {
    api_response(StatusCode::OK, false, message, None)
}

// ── JWT ────────────────────────────────────────────────────────────────────────

fn app_key() -> String {
    std::env::var("APP_KEY").expect("APP_KEY must be set")
}

pub fn sign_token(claims: &Claims) -> String {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(app_key().as_bytes()),
    )
    .expect("Failed to sign token")
}

pub fn verify_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(app_key().as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

// ── Password hashing ───────────────────────────────────────────────────────────

pub fn hash_password(password: &str) -> String {
    hash(password, DEFAULT_COST).expect("Failed to hash password")
}

pub fn compare_password(password: &str, hashed: &str) -> bool {
    verify(password, hashed).unwrap_or(false)
}

// ── Random string / number ─────────────────────────────────────────────────────

pub fn random_string(len: usize) -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

// ── Role helpers ───────────────────────────────────────────────────────────────

pub fn role_name_from_id(role_id: u32) -> &'static str {
    match role_id {
        1 => "administrator",
        2 => "restaurant",
        3 => "customer",
        _ => "unknown",
    }
}

// ── Email ────────���─────────────────────────────────────────────────────────────

pub async fn send_email(to: &str, subject: &str, html_body: String) -> Result<(), String> {
    let smtp_user = std::env::var("MAIL_USER").unwrap_or_default();
    let smtp_pass = std::env::var("MAIL_PASS").unwrap_or_default();
    let smtp_host = std::env::var("MAIL_HOST").unwrap_or_else(|_| "smtp.gmail.com".into());

    let email = Message::builder()
        .from(smtp_user.parse().map_err(|e| format!("{{e}}"))?)
        .to(to.parse().map_err(|e| format!("{{e}}"))?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html_body)
        .map_err(|e| format!("{{e}}"))?;

    let creds = Credentials::new(smtp_user, smtp_pass);
    let mailer: AsyncSmtpTransport<Tokio1Executor> =
        AsyncSmtpTransport::<Tokio1Executor>::relay(&smtp_host)
            .map_err(|e| format!("{{e}}"))?
            .credentials(creds)
            .build();

    mailer.send(email).await.map_err(|e| format!("{{e}}"))?;
    Ok(())
}

pub fn forgot_password_email(new_pass: &str) -> String {
    format!(
        "<p>Your new password is: <strong>{{}}</strong></p><p>Please change it after login.</p>",
        new_pass
    )
}
