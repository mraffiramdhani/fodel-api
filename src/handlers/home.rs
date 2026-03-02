use axum::response::IntoResponse;

use crate::utils::ok_msg;

pub async fn home() -> impl IntoResponse {
    ok_msg("Success")
}
