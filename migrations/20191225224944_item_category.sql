CREATE TABLE IF NOT EXISTS item_category (
    item_id INTEGER NULL,
    category_id INTEGER NULL,
    CONSTRAINT item_category_item_id_foreign FOREIGN KEY (item_id)
        REFERENCES items (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT item_category_category_id_foreign FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
