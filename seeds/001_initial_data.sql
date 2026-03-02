TRUNCATE TABLE
    reviews,
    carts,
    item_images,
    item_category,
    items,
    categories,
    restaurants,
    users,
    roles,
    revoked_token
RESTART IDENTITY CASCADE;

INSERT INTO roles (id, name) VALUES
(1, 'administrator'),
(2, 'restaurant'),
(3, 'customer');

INSERT INTO users (id, name, email, username, password, photo, role_id) VALUES
(1, 'Admin User', 'admin@fodel.local', 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 1),
(2, 'Restaurant User 1', 'rest1@fodel.local', 'resto1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 2),
(3, 'Restaurant User 2', 'rest2@fodel.local', 'resto2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 2),
(4, 'Restaurant User 3', 'rest3@fodel.local', 'resto3', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 2),
(5, 'Restaurant User 4', 'rest4@fodel.local', 'resto4', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 2),
(6, 'Customer User 1', 'cust1@fodel.local', 'customer1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 3),
(7, 'Customer User 2', 'cust2@fodel.local', 'customer2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 3),
(8, 'Customer User 3', 'cust3@fodel.local', 'customer3', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 3),
(9, 'Customer User 4', 'cust4@fodel.local', 'customer4', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 3),
(10, 'Customer User 5', 'cust5@fodel.local', 'customer5', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'default.png', 3);

INSERT INTO restaurants (id, name, logo, longitude, latitude, description, user_id, active) VALUES
(1, 'Fodel Resto 1', 'https://picsum.photos/seed/r1/640/480', '106.816666', '-6.200000', 'Restaurant seed data 1', 2, 1),
(2, 'Fodel Resto 2', 'https://picsum.photos/seed/r2/640/480', '106.816667', '-6.200001', 'Restaurant seed data 2', 3, 1),
(3, 'Fodel Resto 3', 'https://picsum.photos/seed/r3/640/480', '106.816668', '-6.200002', 'Restaurant seed data 3', 4, 1),
(4, 'Fodel Resto 4', 'https://picsum.photos/seed/r4/640/480', '106.816669', '-6.200003', 'Restaurant seed data 4', 5, 1);

INSERT INTO categories (id, name, icon) VALUES
(1, 'makanan', NULL),
(2, 'minuman', NULL),
(3, 'pedas', NULL),
(4, 'manis', NULL),
(5, 'kue', NULL),
(6, 'aneka nasi', NULL),
(7, 'bakso & soto', NULL),
(8, 'cepat saji', NULL),
(9, 'bakmie', NULL),
(10, 'boba', NULL);

INSERT INTO items (id, name, price, description, restaurant_id) VALUES
(1, 'Menu 1-1', 15000.00, 'Seed item 1', 1),
(2, 'Menu 1-2', 17000.00, 'Seed item 2', 1),
(3, 'Menu 1-3', 19000.00, 'Seed item 3', 1),
(4, 'Menu 1-4', 21000.00, 'Seed item 4', 1),
(5, 'Menu 1-5', 23000.00, 'Seed item 5', 1),
(6, 'Menu 1-6', 25000.00, 'Seed item 6', 1),
(7, 'Menu 1-7', 27000.00, 'Seed item 7', 1),
(8, 'Menu 1-8', 29000.00, 'Seed item 8', 1),
(9, 'Menu 1-9', 31000.00, 'Seed item 9', 1),
(10, 'Menu 1-10', 33000.00, 'Seed item 10', 1),
(11, 'Menu 2-1', 15500.00, 'Seed item 11', 2),
(12, 'Menu 2-2', 17500.00, 'Seed item 12', 2),
(13, 'Menu 2-3', 19500.00, 'Seed item 13', 2),
(14, 'Menu 2-4', 21500.00, 'Seed item 14', 2),
(15, 'Menu 2-5', 23500.00, 'Seed item 15', 2),
(16, 'Menu 2-6', 25500.00, 'Seed item 16', 2),
(17, 'Menu 2-7', 27500.00, 'Seed item 17', 2),
(18, 'Menu 2-8', 29500.00, 'Seed item 18', 2),
(19, 'Menu 2-9', 31500.00, 'Seed item 19', 2),
(20, 'Menu 2-10', 33500.00, 'Seed item 20', 2),
(21, 'Menu 3-1', 16000.00, 'Seed item 21', 3),
(22, 'Menu 3-2', 18000.00, 'Seed item 22', 3),
(23, 'Menu 3-3', 20000.00, 'Seed item 23', 3),
(24, 'Menu 3-4', 22000.00, 'Seed item 24', 3),
(25, 'Menu 3-5', 24000.00, 'Seed item 25', 3),
(26, 'Menu 3-6', 26000.00, 'Seed item 26', 3),
(27, 'Menu 3-7', 28000.00, 'Seed item 27', 3),
(28, 'Menu 3-8', 30000.00, 'Seed item 28', 3),
(29, 'Menu 3-9', 32000.00, 'Seed item 29', 3),
(30, 'Menu 3-10', 34000.00, 'Seed item 30', 3),
(31, 'Menu 4-1', 16500.00, 'Seed item 31', 4),
(32, 'Menu 4-2', 18500.00, 'Seed item 32', 4),
(33, 'Menu 4-3', 20500.00, 'Seed item 33', 4),
(34, 'Menu 4-4', 22500.00, 'Seed item 34', 4),
(35, 'Menu 4-5', 24500.00, 'Seed item 35', 4),
(36, 'Menu 4-6', 26500.00, 'Seed item 36', 4),
(37, 'Menu 4-7', 28500.00, 'Seed item 37', 4),
(38, 'Menu 4-8', 30500.00, 'Seed item 38', 4),
(39, 'Menu 4-9', 32500.00, 'Seed item 39', 4),
(40, 'Menu 4-10', 34500.00, 'Seed item 40', 4);

INSERT INTO item_category (item_id, category_id)
SELECT i.id, ((i.id - 1) % 10) + 1 FROM items i;

INSERT INTO item_category (item_id, category_id)
SELECT i.id, ((i.id + 3) % 10) + 1 FROM items i;

INSERT INTO reviews (rating, review, item_id, user_id)
SELECT ((i.id + u.id) % 5) + 1,
    'Review for item ' || i.id || ' by user ' || u.id,
       i.id,
       u.id
FROM items i
JOIN users u ON u.id BETWEEN 6 AND 10;

INSERT INTO item_images (item_id, filename)
SELECT id, 'item-' || id || '.jpg'
FROM items;
