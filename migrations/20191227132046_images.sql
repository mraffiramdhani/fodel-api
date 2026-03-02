CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NULL,
    filename VARCHAR(255) NULL,
    CONSTRAINT item_images_item_id_foreign FOREIGN KEY (item_id)
        REFERENCES items (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
