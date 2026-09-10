-- Drop tables if they exist (in reverse order of dependencies to avoid constraint errors)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- 1. COMPANIES TABLE
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255) NULL,
    logo TEXT NULL,
    banner TEXT NULL,
    tagline VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('PRODUCT_MANAGER', 'ORGANIZER', 'PARTICIPANT') NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- 3. EVENTS TABLE
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    venue VARCHAR(255),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT UNSIGNED NOT NULL,
    price      VARCHAR(100) NULL,
    image_url  TEXT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'CANCELLED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

-- 4. REGISTRATIONS TABLE
-- Why these fields?
--   ticket_count      → Number of seats the user is reserving
--   phone_number      → Emergency contact number for event organizers
--   registration_code → Unique confirmation code (ticket ID: EVT-XXXX-XXXX)
--   UNIQUE KEY        → Ensures a user can only register once per event (database-level constraint)
CREATE TABLE registrations (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    event_id          INT NOT NULL,
    ticket_count      INT NOT NULL DEFAULT 1,
    phone_number      VARCHAR(20) NULL,
    registration_code VARCHAR(20) NOT NULL UNIQUE,
    status            ENUM('REGISTERED', 'CANCELLED') DEFAULT 'REGISTERED',
    registered_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE RESTRICT,
    FOREIGN KEY (event_id) REFERENCES events(id)  ON DELETE RESTRICT,
    UNIQUE KEY unique_registration (user_id, event_id)
);

-- 5. ATTENDANCE TABLE
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    status ENUM('PRESENT', 'ABSENT') DEFAULT 'PRESENT',
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE RESTRICT
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
    payment_method VARCHAR(50),
    gateway VARCHAR(50) DEFAULT 'JAZZCASH',
    status VARCHAR(30) DEFAULT 'PENDING',
    gateway_response TEXT,
    paid_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (id),
    
    -- Unique constraint: one transaction per registration
    UNIQUE KEY unique_transaction (registration_id),
    
    -- Foreign key
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);