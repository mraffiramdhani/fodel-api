CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NULL,
    logo VARCHAR(255) NULL,
    longitude VARCHAR(255) NULL,
    latitude VARCHAR(255) NULL,
    description TEXT NULL,
    user_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT restaurants_user_id_foreign FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
