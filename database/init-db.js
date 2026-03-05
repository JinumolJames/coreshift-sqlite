const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'coreshift.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating SQLite database schema...');

db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('✅ Users table created');
    });

    // Projects table
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            project_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            project_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating projects table:', err);
        else console.log('✅ Projects table created');
    });

    // Code files table
    db.run(`
        CREATE TABLE IF NOT EXISTS code_files (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            original_code TEXT NOT NULL,
            cleaned_code TEXT,
            detected_language TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating code_files table:', err);
        else console.log('✅ Code files table created');
    });

    // Migrations table
    db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
            migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            transformed_code TEXT NOT NULL,
            ai_model_used TEXT,
            target_language TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating migrations table:', err);
        else console.log('✅ Migrations table created');
    });

    // Explanations table
    db.run(`
        CREATE TABLE IF NOT EXISTS explanations (
            explanation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            migration_id INTEGER NOT NULL,
            explanation_text TEXT NOT NULL,
            summary_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (migration_id) REFERENCES migrations(migration_id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating explanations table:', err);
        else console.log('✅ Explanations table created');
    });

    // Admins table
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            last_login DATETIME
        )
    `, (err) => {
        if (err) console.error('Error creating admins table:', err);
        else console.log('✅ Admins table created');
    });

    // Admin analytics table
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_analytics (
            analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_users INTEGER DEFAULT 0,
            active_users INTEGER DEFAULT 0,
            total_projects INTEGER DEFAULT 0,
            total_migrations INTEGER DEFAULT 0,
            successful_migrations INTEGER DEFAULT 0,
            failed_migrations INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating admin_analytics table:', err);
        else console.log('✅ Admin analytics table created');
    });

    // Insert initial analytics record
    db.run(`
        INSERT INTO admin_analytics (total_users, active_users, total_projects, total_migrations, successful_migrations, failed_migrations)
        SELECT 0, 0, 0, 0, 0, 0
        WHERE NOT EXISTS (SELECT 1 FROM admin_analytics LIMIT 1)
    `, (err) => {
        if (err) console.error('Error inserting initial analytics:', err);
        else console.log('✅ Initial analytics record created');
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('\n🎉 Database schema created successfully!');
        console.log('Database file location:', dbPath);
    }
});
