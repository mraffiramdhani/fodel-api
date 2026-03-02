use bcrypt::{hash, verify, DEFAULT_COST};

pub fn hash_password(password: &str) -> String {
    hash(password, DEFAULT_COST).expect("Failed to hash password")
}

pub fn compare_password(password: &str, hashed: &str) -> bool {
    verify(password, hashed).unwrap_or(false)
}
