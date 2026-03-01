use axum::{
    extract::State,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use sqlx::{MySql, Pool};

use crate::{models::Claims, utils::verify_token};

/// Extension inserted by `auth` middleware – available in handlers via `Extension<AuthUser>`.
#[derive(Clone, Debug)]
pub struct AuthUser(pub Claims);

/// Checks for a valid Bearer JWT, verifies it is not revoked, then injects `AuthUser`.
pub async fn auth<B>(
    State(pool): State<Pool<MySql>>, 
    mut req: Request<B>,
    next: Next<B>,
) -> Response {
    let Some(auth_header) = req.headers().get(header::AUTHORIZATION) else {
        return unauthorized("Authorization Failed. Please Log In Again.");
    };

    let Ok(header_str) = auth_header.to_str() else {
        return unauthorized("Invalid authorization header.");
    };

    if !header_str.starts_with("Bearer ") {
        return unauthorized("Authorization Failed. Please Log In Again.");
    }

    let token = &header_str[7..];

    // Check revoked token table
    let revoked: Result<Option<i8>, _> = sqlx::query_scalar(
        "SELECT is_revoked FROM revoked_token WHERE token = ? AND is_revoked = 1",
    )
    .bind(token)
    .fetch_optional(&pool)
    .await;

    match revoked {
        Ok(Some(_)) => return unauthorized("Session Expired. Please Log In Again."),
        Err(_) => return unauthorized("Database error."),
        Ok(None) => {}
    }

    match verify_token(token) {
        Ok(claims) => {
            req.extensions_mut().insert(AuthUser(claims));
            req.extensions_mut().insert(token.to_string()); // raw token for logout
            next.run(req).await
        }
        Err(_) => unauthorized("Invalid or expired token."),
    }
}

/// Role-based guard – pass the list of allowed role names (e.g. `["administrator", "customer"]`).
pub async fn require_role<B>(
    allowed: &'static [&'static str],
    req: Request<B>,
    next: Next<B>,
) -> Response {
    let Some(AuthUser(claims)) = req.extensions().get::<AuthUser>().cloned() else {
        return forbidden("Access Denied. User not authenticated.");
    };

    let role = crate::utils::role_name_from_id(claims.role_id);
    if allowed.contains(&role) {
        next.run(req).await
    } else {
        forbidden("Access Denied. User Role Unidentified.")
    }
}

fn unauthorized(msg: &str) -> Response {
    (
        StatusCode::OK,
        Json(json!({ "success": false, "message": msg }))
    )
    .into_response()
}

fn forbidden(msg: &str) -> Response {
    (
        StatusCode::OK,
        Json(json!({ "success": false, "message": msg }))
    )
    .into_response()
}