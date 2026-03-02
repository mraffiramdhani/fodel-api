use axum::{
    body::Body,
    extract::State,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

use crate::{models::Claims, utils::verify_token, AppState};

/// Extension inserted by `auth` middleware – available in handlers via `Extension<AuthUser>`.
#[derive(Clone, Debug)]
pub struct AuthUser(pub Claims);

/// Checks for a valid Bearer JWT, verifies it is not revoked, then injects `AuthUser`.
pub async fn auth(
    State(state): State<AppState>,
    mut req: Request<Body>,
    next: Next,
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

    let token = header_str[7..].to_string();

    // Check revoked token table
    let revoked: Result<Option<bool>, _> = sqlx::query_scalar(
        "SELECT is_revoked FROM revoked_token WHERE token = $1 AND is_revoked = true",
    )
    .bind(&token)
    .fetch_optional(&state.db)
    .await;

    match revoked {
        Ok(Some(_)) => return unauthorized("Session Expired. Please Log In Again."),
        Err(_) => return unauthorized("Error At Validating Session."),
        Ok(None) => {}
    }

    match verify_token(&token) {
        Ok(claims) => {
            req.extensions_mut().insert(AuthUser(claims));
            req.extensions_mut().insert(token); // raw token for logout
            next.run(req).await
        }
        Err(_) => unauthorized("Invalid or expired token."),
    }
}

fn unauthorized(msg: &str) -> Response {
    (
        StatusCode::OK,
        Json(json!({ "success": false, "message": msg }))
    )
    .into_response()
}