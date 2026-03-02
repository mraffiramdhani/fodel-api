use axum::{
    extract::{Extension, Multipart, State},
    response::IntoResponse,
    Json,
};
use chrono::{Duration, Utc};
use serde_json::json;

use crate::{
    middleware::AuthUser,
    models::{
        CheckTokenPayload, Claims, ForgotPasswordPayload, LoginPayload, RegisterPayload,
        UpdateUserPayload, User,
    },
    utils::{
        compare_password, err_msg, forgot_password_email, hash_password, ok, ok_msg, random_string,
        role_name_from_id, send_email, sign_token, upload::save_image_field, verify_token,
    },
    AppState,
};

pub async fn register_user(
    State(state): State<AppState>,
    Json(payload): Json<RegisterPayload>,
) -> impl IntoResponse {
    if payload.name.is_empty() || payload.username.is_empty() || payload.email.is_empty() || payload.password.is_empty() {
        return err_msg("Please provide a valid data.");
    }

    let hashed = hash_password(&payload.password);

    let insert_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO users (name, email, username, password, role_id, photo) VALUES ($1, $2, $3, $4, 3, 'default.png') RETURNING id",
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.username)
    .bind(hashed)
    .fetch_one(&state.db)
    .await;

    let Ok(id) = insert_id else {
        return err_msg("Error.");
    };

    let claims = Claims {
        id,
        name: payload.name.clone(),
        username: payload.username.clone(),
        role_id: 3,
        exp: (Utc::now() + Duration::days(7)).timestamp() as usize,
    };

    let token = sign_token(&claims);
    let _ = sqlx::query("INSERT INTO revoked_token (token, is_revoked) VALUES ($1, false)")
        .bind(&token)
        .execute(&state.db)
        .await;

    ok(
        "User Created Successfully.",
        json!({
            "token": token,
            "name": payload.name,
            "email": payload.email,
            "username": payload.username,
            "photo": "default.png",
            "role": "customer"
        }),
    )
}

pub async fn login_user(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> impl IntoResponse {
    if payload.username.is_empty() || payload.password.is_empty() {
        return err_msg("Please Provide a Valid Data.");
    }

    let found = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE username = $1 LIMIT 1",
    )
    .bind(&payload.username)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(user)) = found else {
        return err_msg("User Not Found.");
    };

    if !compare_password(&payload.password, user.password.as_deref().unwrap_or_default()) {
        return err_msg("Invalid Password.");
    }

    let claims = Claims {
        id: user.id,
        name: user.name.clone().unwrap_or_default(),
        username: user.username.clone().unwrap_or_default(),
        role_id: user.role_id.unwrap_or(3),
        exp: (Utc::now() + Duration::days(7)).timestamp() as usize,
    };

    let token = sign_token(&claims);
    let _ = sqlx::query("INSERT INTO revoked_token (token, is_revoked) VALUES ($1, false)")
        .bind(&token)
        .execute(&state.db)
        .await;

    ok(
        "User Logged In Successfuly.",
        json!({
            "token": token,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "photo": user.photo,
            "role": role_name_from_id(user.role_id.unwrap_or(3))
        }),
    )
}

pub async fn check_token(
    State(state): State<AppState>,
    Json(payload): Json<CheckTokenPayload>,
) -> impl IntoResponse {
    let revoked = sqlx::query_scalar::<_, bool>(
        "SELECT is_revoked FROM revoked_token WHERE token = $1 AND is_revoked = true LIMIT 1",
    )
    .bind(&payload.token)
    .fetch_optional(&state.db)
    .await;

    if matches!(revoked, Ok(Some(_))) {
        return err_msg("Session Expired. Please Login Again.");
    }

    let claims = verify_token(&payload.token);
    let Ok(claims) = claims else {
        return err_msg("Invalid or expired token.");
    };

    ok(
        "Authentication Success.",
        json!({
            "role": role_name_from_id(claims.role_id),
            "name": claims.name
        }),
    )
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordPayload>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE username = $1 LIMIT 1",
    )
    .bind(&payload.username)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(found)) = user else {
        return err_msg("Username Not Found.");
    };

    if found.email.as_deref().unwrap_or_default() != payload.email {
        return err_msg("Email not Found.");
    }

    let new_password = random_string(10);
    let hashed = hash_password(&new_password);

    let updated = sqlx::query("UPDATE users SET password = $1 WHERE id = $2")
        .bind(hashed)
        .bind(found.id)
        .execute(&state.db)
        .await;

    if updated.is_err() {
        return err_msg("Password Reset Failed. Please Try Again.");
    }

    let html = forgot_password_email(&new_password);
    let _ = send_email(&payload.email, "Reset Password Request Email.", html).await;

    ok_msg("Password Reset Success.")
}

pub async fn get_profile(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    )
    .bind(auth.0.id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(mut found)) = user else {
        return err_msg("Fetching User Profile Failed. Please Try Again.");
    };

    found.password = None;
    ok("Data Found.", found)
}

pub async fn update_profile(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Json(mut payload): Json<UpdateUserPayload>,
) -> impl IntoResponse {
    let current = sqlx::query_as::<_, User>(
        "SELECT id, name, username, password, email, photo, role_id, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    )
    .bind(auth.0.id)
    .fetch_optional(&state.db)
    .await;

    let Ok(Some(existing)) = current else {
        return err_msg("Fetching User Data Failed. Please Try Again");
    };

    let password = payload
        .password
        .take()
        .map(|p| hash_password(&p))
        .or(existing.password)
        .unwrap_or_default();

    let updated = sqlx::query(
        "UPDATE users SET name = $1, username = $2, email = $3, password = $4, photo = $5, role_id = $6 WHERE id = $7",
    )
    .bind(payload.name.or(existing.name))
    .bind(payload.username.or(existing.username))
    .bind(payload.email.or(existing.email))
    .bind(password)
    .bind(payload.photo.or(existing.photo))
    .bind(payload.role_id.or(existing.role_id))
    .bind(auth.0.id)
    .execute(&state.db)
    .await;

    if updated.is_err() {
        return err_msg("Updating User Failed. Please Try Again.");
    }

    get_profile(State(state), Extension(auth)).await.into_response()
}

pub async fn update_profile_photo(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut photo: Option<String> = None;

    loop {
        let Some(field) = (match multipart.next_field().await {
            Ok(value) => value,
            Err(_) => return err_msg("Invalid multipart payload."),
        }) else {
            break;
        };

        let field_name = field.name().unwrap_or_default().to_string();
        if field_name == "image" && field.file_name().is_some() {
            match save_image_field(field, "Public/Image", "image").await {
                Ok(filename) => photo = Some(filename),
                Err(message) => return err_msg(&message),
            }
            continue;
        }

        if field_name == "photo" || field_name == "image" {
            match field.text().await {
                Ok(value) if !value.trim().is_empty() => photo = Some(value),
                Ok(_) => {}
                Err(_) => return err_msg("Invalid profile photo payload."),
            }
        }
    }

    let Some(photo) = photo else {
        return err_msg("Please provide profile image.");
    };

    let updated = sqlx::query("UPDATE users SET photo = $1 WHERE id = $2")
        .bind(photo)
        .bind(auth.0.id)
        .execute(&state.db)
        .await;

    if updated.is_err() {
        return err_msg("Updating Profile Photo Failed. Please Try Again");
    }

    ok_msg("Profile Photo Updated Successfuly")
}

pub async fn logout_user(
    State(state): State<AppState>,
    Extension(raw_token): Extension<String>,
) -> impl IntoResponse {
    let updated = sqlx::query("UPDATE revoked_token SET is_revoked = true WHERE token = $1")
        .bind(raw_token)
        .execute(&state.db)
        .await;

    if updated.is_err() {
        return err_msg("Error At Revoking Token.");
    }

    ok_msg("User Logged Out Successfuly.")
}
