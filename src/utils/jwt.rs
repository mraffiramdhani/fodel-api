use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

use crate::models::Claims;

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
