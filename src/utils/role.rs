pub fn role_name_from_id(role_id: i32) -> &'static str {
    match role_id {
        1 => "administrator",
        2 => "restaurant",
        3 => "customer",
        _ => "unknown",
    }
}
