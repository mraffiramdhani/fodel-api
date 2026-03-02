use axum::response::Response;
use serde::{Deserialize, Serialize};

use crate::{middleware::AuthUser, utils::{err_msg, role_name_from_id}};

pub mod auth;
pub mod cart;
pub mod category;
pub mod home;
pub mod item;
pub mod restaurant;
pub mod review;
pub mod user;

pub use auth::{
    check_token, forgot_password, get_profile, login_user, logout_user, register_user, update_profile,
    update_profile_photo,
};
pub use cart::{
    add_item_to_cart, checkout_cart, delete_item_in_cart, get_cart, get_cart_by_id, update_item_in_cart,
};
pub use category::{create_category, delete_category, get_categories, get_category, update_category};
pub use home::home;
pub use item::{create_item, delete_item, get_item, get_item_count, get_items, last_ordered_items, update_item};
pub use restaurant::{
    approve_restaurant, create_restaurant, delete_restaurant, get_restaurant, get_restaurants,
    register_restaurant, update_restaurant,
};
pub use review::{create_review, delete_review, get_item_review, get_user_review, update_review};
pub use user::{create_user, delete_user, get_user_by_id, get_users, update_user};

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub page: Option<u32>,
    #[serde(rename = "perPage")]
    pub per_page: Option<u32>,
    pub search: Option<String>,
    pub sort: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct IdsPayload {
    pub ids: Vec<i32>,
}

#[derive(Debug, Serialize)]
pub struct Pagination {
    current: u32,
    per_page: u32,
    prev: Option<u32>,
    next: Option<u32>,
}

pub(super) fn role_guard(auth: &AuthUser, roles: &[&str]) -> Option<Response> {
    let role_name = role_name_from_id(auth.0.role_id);
    if roles.contains(&role_name) {
        None
    } else {
        Some(err_msg("Access Denied. User Role Unidentified."))
    }
}

pub(super) fn pagination(query: &ListQuery, data_len: usize) -> Pagination {
    let current = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).max(1);
    let next = if data_len as u32 >= per_page {
        Some(current + 1)
    } else {
        None
    };

    Pagination {
        current,
        per_page,
        prev: if current > 1 { Some(current - 1) } else { None },
        next,
    }
}
