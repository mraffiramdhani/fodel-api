CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NULL,
    quantity INT NULL,
    description TEXT NULL,
    user_id INTEGER NULL,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carts_item_id_foreign FOREIGN KEY (item_id)
        REFERENCES items (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT carts_user_id_foreign FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
