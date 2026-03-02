CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NULL,
    price DECIMAL(12, 2) NULL,
    description TEXT NULL,
    restaurant_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT items_restaurant_id_foreign FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
