use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use serde_json::{json, Value};

pub fn api_response(
    status: StatusCode,
    success: bool,
    message: &str,
    data: Option<Value>,
) -> Response {
    let mut body = json!({
        "success": success,
        "message": message,
    });
    if let Some(d) = data {
        body["data"] = d;
    }
    (status, Json(body)).into_response()
}

pub fn ok<S: Serialize>(message: &str, data: S) -> Response {
    api_response(
        StatusCode::OK,
        true,
        message,
        Some(serde_json::to_value(data).unwrap_or(Value::Null)),
    )
}

pub fn ok_msg(message: &str) -> Response {
    api_response(StatusCode::OK, true, message, None)
}

pub fn err_msg(message: &str) -> Response {
    api_response(StatusCode::OK, false, message, None)
}
