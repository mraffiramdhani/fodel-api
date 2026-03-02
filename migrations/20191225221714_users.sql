CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NULL,
    email VARCHAR(60) NULL,
    username VARCHAR(40) NULL,
    password VARCHAR(191) NULL,
    photo VARCHAR(191) NULL,
    role_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_username_email_unique UNIQUE (username, email),
    CONSTRAINT users_role_id_foreign FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
