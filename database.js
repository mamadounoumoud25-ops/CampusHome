const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'campus.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        profilePic TEXT,
        filiere TEXT,
        date TEXT,
        currentLogementId INTEGER,
        loyerTotal INTEGER DEFAULT 0,
        montantPaye INTEGER DEFAULT 0,
        resteAPayer INTEGER DEFAULT 0,
        omNumber TEXT,
        momoNumber TEXT,
        notifications TEXT DEFAULT '[]',
        documents TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS logements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        type TEXT NOT NULL,
        prix INTEGER NOT NULL,
        quartier TEXT NOT NULL,
        image TEXT,
        wcInterne BOOLEAN,
        electricite BOOLEAN,
        eau BOOLEAN,
        disponible BOOLEAN DEFAULT 1,
        ownerEmail TEXT NOT NULL,
        googleMaps TEXT,
        reviews TEXT DEFAULT '[]',
        FOREIGN KEY (ownerEmail) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS visit_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        logementId INTEGER NOT NULL,
        userEmail TEXT NOT NULL,
        preferredDate TEXT,
        status TEXT DEFAULT 'pending',
        date TEXT,
        FOREIGN KEY (logementId) REFERENCES logements(id),
        FOREIGN KEY (userEmail) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderEmail TEXT NOT NULL,
        receiverEmail TEXT NOT NULL,
        text TEXT NOT NULL,
        date TEXT,
        read BOOLEAN DEFAULT 0,
        FOREIGN KEY (senderEmail) REFERENCES users(email),
        FOREIGN KEY (receiverEmail) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS support (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        role TEXT,
        desc TEXT
    );

    CREATE TABLE IF NOT EXISTS favorites (
        userEmail TEXT NOT NULL,
        logementId INTEGER NOT NULL,
        PRIMARY KEY (userEmail, logementId),
        FOREIGN KEY (userEmail) REFERENCES users(email),
        FOREIGN KEY (logementId) REFERENCES logements(id)
    );
`);

// Seed initial data if user count is 0
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
    console.log("Seeding initial data...");
    
    // Default Support
    const insertSupport = db.prepare('INSERT INTO support (name, phone, role, desc) VALUES (?, ?, ?, ?)');
    insertSupport.run("Service Médiation Labé", "+224 620 00 00 00", "Médiateur", "Pour les litiges loyers");
    insertSupport.run("Urgence Logement", "+224 611 11 11 11", "Assistance", "Problèmes techniques graves");

    // Default Users
    const saltRounds = 10;
    const hashedPassNormal = bcrypt.hashSync("1234", saltRounds);
    const hashedPassAdmin = bcrypt.hashSync("admin123", saltRounds);

    const insertUser = db.prepare('INSERT INTO users (name, email, role, password, phone, filiere, date, currentLogementId, loyerTotal, montantPaye, resteAPayer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertUser.run("Mamadou Bah", "mamadou@etu.univ-labe.gn", "student", hashedPassNormal, "+224 600 00 00 00", "Informatique", "10/02/2024", 1, 150000, 150000, 0);
    insertUser.run("Fatoumata Dalein", "fatou@proprio.gn", "owner", hashedPassNormal, "+224 622 22 22 22", "Propriétaire", "09/02/2024", null, 0, 0, 0);
    insertUser.run("Admin Admin", "admin@campus.com", "admin", hashedPassAdmin, "+224 666 66 66 66", "Admin", "01/01/2024", null, 0, 0, 0);

    // Default Logements
    const insertLogement = db.prepare('INSERT INTO logements (titre, type, prix, quartier, image, wcInterne, electricite, eau, disponible, ownerEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLogement.run("Chambre Étudiante Standard", "chamber", 150000, "Hafia", "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", 0, 1, 1, 0, "fatou@proprio.gn");
    insertLogement.run("Studio Moderne", "apartment", 450000, "Tata", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", 1, 1, 1, 1, "fatou@proprio.gn");
    insertLogement.run("Appartement 2 Chambres", "apartment", 800000, "Kouroula", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", 1, 1, 1, 0, "fatou@proprio.gn");
    insertLogement.run("Chambre Simple Économique", "chamber", 100000, "Pounthioun", "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", 0, 1, 0, 1, "fatou@proprio.gn");
}

module.exports = db;
