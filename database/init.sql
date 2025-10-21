-- Database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(15) NULL,
    login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    birth_date DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create publishers table
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    founded_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_available BOOLEAN DEFAULT true,
    publication_date DATE,
    pages INTEGER,
    description TEXT,
    image_url VARCHAR(500),
    author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
    publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
    genre_id UUID REFERENCES genres(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create audit_logs table for logging operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_publisher_id ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_books_genre_id ON books(genre_id);
CREATE INDEX IF NOT EXISTS idx_books_is_available ON books(is_available);
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);
CREATE INDEX IF NOT EXISTS idx_books_deleted_at ON books(deleted_at);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_publishers_name ON publishers(name);
CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert sample data for development
INSERT INTO genres (name, description) VALUES 
    ('Ficción', 'Obras narrativas imaginarias'),
    ('No Ficción', 'Obras basadas en hechos reales'),
    ('Ciencia Ficción', 'Narrativa especulativa sobre el futuro y la tecnología'),
    ('Romance', 'Historias centradas en relaciones amorosas'),
    ('Misterio', 'Historias de suspense y enigmas'),
    ('Biografía', 'Relatos de vidas reales'),
    ('Historia', 'Obras sobre eventos históricos'),
    ('Autoayuda', 'Libros de desarrollo personal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, biography, nationality) VALUES 
    ('Gabriel García Márquez', 'Escritor colombiano, Nobel de Literatura 1982', 'Colombiana'),
    ('Isabel Allende', 'Escritora chilena de renombre internacional', 'Chilena'),
    ('Mario Vargas Llosa', 'Escritor peruano, Nobel de Literatura 2010', 'Peruana'),
    ('Jorge Luis Borges', 'Escritor argentino, maestro del cuento', 'Argentina')
ON CONFLICT DO NOTHING;

INSERT INTO publishers (name, country, founded_year) VALUES 
    ('Penguin Random House', 'Estados Unidos', 1927),
    ('Editorial Planeta', 'España', 1949),
    ('Alfaguara', 'España', 1964),
    ('Anagrama', 'España', 1969)
ON CONFLICT DO NOTHING;

-- Insert a default admin user (password: admin123)
-- Hash generated with bcrypt for password "admin123"
INSERT INTO users (email, password, first_name, last_name, role) VALUES 
    ('admin@cmpc-libros.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;