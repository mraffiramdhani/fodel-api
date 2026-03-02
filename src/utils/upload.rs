use std::{path::Path, time::{SystemTime, UNIX_EPOCH}};

use axum::extract::multipart::Field;

const MAX_UPLOAD_SIZE: usize = 2 * 1024 * 1024;

fn is_allowed_extension(extension: &str) -> bool {
    matches!(extension, "jpg" | "jpeg" | "png")
}

fn extension_from_filename(filename: &str) -> Option<String> {
    Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
}

fn safe_millis_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

pub async fn save_image_field(
    field: Field<'_>,
    directory: &str,
    filename_prefix: &str,
) -> Result<String, String> {
    let original_filename = field
        .file_name()
        .map(str::to_string)
        .ok_or_else(|| "Invalid upload payload.".to_string())?;

    let extension = extension_from_filename(&original_filename)
        .ok_or_else(|| "Error: File upload only supports jpg, jpeg, png.".to_string())?;

    if !is_allowed_extension(&extension) {
        return Err("Error: File upload only supports jpg, jpeg, png.".to_string());
    }

    let content_type = field
        .content_type()
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    if !content_type.is_empty() && !content_type.starts_with("image/") {
        return Err("Error: File upload only supports image MIME types.".to_string());
    }

    let bytes = field
        .bytes()
        .await
        .map_err(|_| "Failed to read uploaded file.".to_string())?;

    if bytes.len() > MAX_UPLOAD_SIZE {
        return Err("Error: File upload max size is 2MB.".to_string());
    }

    tokio::fs::create_dir_all(directory)
        .await
        .map_err(|_| "Failed to prepare upload directory.".to_string())?;

    let filename = format!("{}-{}.{}", filename_prefix, safe_millis_timestamp(), extension);
    let full_path = format!("{}/{}", directory.trim_end_matches('/'), filename);

    tokio::fs::write(full_path, bytes)
        .await
        .map_err(|_| "Failed to save uploaded file.".to_string())?;

    Ok(filename)
}