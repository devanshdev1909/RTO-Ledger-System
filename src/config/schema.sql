-- RTO Ledger System - Database Schema
-- Run this script against your PostgreSQL database to create all tables

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('admin'), ('operator')
ON CONFLICT (name) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mobile VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    aadhar_number VARCHAR(12),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20),
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table (RTO services)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ledger entries table (financial transactions)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_job ON ledger_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at);
