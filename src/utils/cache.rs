use std::{collections::HashMap, sync::OnceLock, time::{Duration, Instant}};

use serde_json::Value;
use tokio::sync::RwLock;

#[derive(Clone)]
struct CacheEntry {
    expires_at: Instant,
    data: Value,
}

type CacheStore = RwLock<HashMap<String, CacheEntry>>;

fn store() -> &'static CacheStore {
    static CACHE: OnceLock<CacheStore> = OnceLock::new();
    CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

pub async fn get(key: &str) -> Option<Value> {
    let mut cache = store().write().await;
    if let Some(entry) = cache.get(key) {
        if Instant::now() < entry.expires_at {
            return Some(entry.data.clone());
        }
    }
    cache.remove(key);
    None
}

pub async fn set(key: String, ttl_seconds: u64, data: Value) {
    let mut cache = store().write().await;
    cache.insert(
        key,
        CacheEntry {
            expires_at: Instant::now() + Duration::from_secs(ttl_seconds),
            data,
        },
    );
}