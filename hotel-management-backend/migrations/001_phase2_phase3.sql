

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(30),
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'hotel_owner', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prt_token_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_id       INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approved_by    INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMP WITH TIME ZONE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'hotels' AND constraint_name = 'hotels_approval_status_check'
    ) THEN
        ALTER TABLE hotels ADD CONSTRAINT hotels_approval_status_check
            CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotels_approval_status ON hotels(approval_status);

CREATE TABLE IF NOT EXISTS amenities (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT amenities_name_unique UNIQUE (name)
);

INSERT INTO amenities (name, icon) VALUES
    ('Wi-Fi', 'wifi'),
    ('Parking', 'parking'),
    ('Swimming Pool', 'pool'),
    ('Restaurant', 'restaurant'),
    ('Air Conditioning', 'ac'),
    ('Gym', 'gym'),
    ('Spa', 'spa'),
    ('Room Service', 'room_service'),
    ('Bar', 'bar'),
    ('Laundry', 'laundry')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS hotel_amenities (
    hotel_id   INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (hotel_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS hotel_images (
    id         SERIAL PRIMARY KEY,
    hotel_id   INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_id ON hotel_images(hotel_id);

CREATE TABLE IF NOT EXISTS rooms (
    room_id                    SERIAL PRIMARY KEY,
    hotel_id                   INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type                  VARCHAR(50) NOT NULL DEFAULT 'Standard',
    description                TEXT,
    room_number                VARCHAR(50),
    capacity                   INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
    adults_capacity            INTEGER NOT NULL DEFAULT 2 CHECK (adults_capacity >= 0),
    children_capacity          INTEGER NOT NULL DEFAULT 0 CHECK (children_capacity >= 0),
    bed_type                   VARCHAR(50),
    price_per_night            DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    total_quantity             INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity > 0),
    status                     VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at                 TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

CREATE TABLE IF NOT EXISTS room_images (
    id         SERIAL PRIMARY KEY,
    room_id    INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images(room_id);

CREATE TABLE IF NOT EXISTS room_amenities (
    room_id    INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, amenity_id)
);

