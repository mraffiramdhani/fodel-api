CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    rating SMALLINT NULL,
    review TEXT NULL,
    item_id INTEGER NULL,
    user_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_item_id_foreign FOREIGN KEY (item_id)
        REFERENCES items (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT reviews_user_id_foreign FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
