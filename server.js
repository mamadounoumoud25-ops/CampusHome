const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- AUTH API ---

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } else {
        res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, role, password, phone, filiere, profilePic } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const date = new Date().toLocaleDateString('fr-FR');
        const info = db.prepare(`
            INSERT INTO users (name, email, role, password, phone, filiere, date, profilePic, notifications, documents)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]')
        `).run(name, email, role, hashedPassword, phone, filiere, date, profilePic);
        
        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
        const { password: _, ...userWithoutPassword } = newUser;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Email déjà utilisé ou erreur de saisie' });
    }
});

// --- LOGEMENTS API ---

app.get('/api/logements', (req, res) => {
    const rows = db.prepare('SELECT * FROM logements').all();
    const logements = rows.map(r => ({ ...r, reviews: JSON.parse(r.reviews || '[]') }));
    res.json(logements);
});

app.get('/api/logements/owner/:email', (req, res) => {
    const rows = db.prepare('SELECT * FROM logements WHERE ownerEmail = ?').all(req.params.email);
    const logements = rows.map(r => ({ ...r, reviews: JSON.parse(r.reviews || '[]') }));
    res.json(logements);
});

app.put('/api/logements/:id', (req, res) => {
    const { id } = req.params;
    const fields = Object.entries(req.body).filter(([k,v]) => k !== 'id' && k !== 'reviews');
    if (fields.length === 0) return res.json({ success: true });
    
    const setClause = fields.map(([k,v]) => `${k} = ?`).join(', ');
    const values = fields.map(([k,v]) => v);
    
    try {
        db.prepare(`UPDATE logements SET ${setClause} WHERE id = ?`).run(...values, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/logements/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM logements WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/logements/:id/reviews', (req, res) => {
    const { id } = req.params;
    const { author, text, rating } = req.body;
    try {
        const logement = db.prepare('SELECT reviews FROM logements WHERE id = ?').get(id);
        if (!logement) return res.status(404).json({ success: false, message: 'Logement not found' });
        
        const reviews = JSON.parse(logement.reviews || '[]');
        reviews.push({ author, text, rating, date: new Date().toLocaleDateString('fr-FR') });
        
        db.prepare('UPDATE logements SET reviews = ? WHERE id = ?').run(JSON.stringify(reviews), id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/logements', (req, res) => {
    const { titre, type, prix, quartier, image, wcInterne, electricite, eau, ownerEmail } = req.body;
    try {
        db.prepare(`
            INSERT INTO logements (titre, type, prix, quartier, image, wcInterne, electricite, eau, ownerEmail, reviews)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
        `).run(titre, type, prix, quartier, image, wcInterne, electricite, eau, ownerEmail);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- VISITS API ---

app.post('/api/visits/request', (req, res) => {
    const { logementId, userEmail, preferredDate } = req.body;
    try {
        const date = new Date().toLocaleDateString('fr-FR');
        db.prepare(`
            INSERT INTO visit_requests (logementId, userEmail, preferredDate, date)
            VALUES (?, ?, ?, ?)
        `).run(logementId, userEmail, preferredDate, date);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/visits/student/:email', (req, res) => {
    const visits = db.prepare(`
        SELECT vr.*, l.titre as logementTitle 
        FROM visit_requests vr
        JOIN logements l ON vr.logementId = l.id
        WHERE vr.userEmail = ?
    `).all(req.params.email);
    res.json(visits);
});

app.get('/api/visits/logement/:id', (req, res) => {
    const visits = db.prepare(`
        SELECT vr.*, u.name as userName, u.phone as userPhone
        FROM visit_requests vr
        JOIN users u ON vr.userEmail = u.email
        WHERE vr.logementId = ?
    `).all(req.params.id);
    res.json(visits);
});

app.delete('/api/visits/request', (req, res) => {
    const { logementId, userEmail } = req.body;
    try {
        db.prepare('DELETE FROM visit_requests WHERE logementId = ? AND userEmail = ?').run(logementId, userEmail);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- FAVORITES API ---

app.post('/api/favorites/toggle', (req, res) => {
    const { email, logementId } = req.body;
    try {
        const existing = db.prepare('SELECT * FROM favorites WHERE userEmail = ? AND logementId = ?').get(email, logementId);
        if (existing) {
            db.prepare('DELETE FROM favorites WHERE userEmail = ? AND logementId = ?').run(email, logementId);
            res.json({ success: true, isFav: false });
        } else {
            db.prepare('INSERT INTO favorites (userEmail, logementId) VALUES (?, ?)').run(email, logementId);
            res.json({ success: true, isFav: true });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/favorites/:email', (req, res) => {
    const favs = db.prepare('SELECT logementId FROM favorites WHERE userEmail = ?').all(req.params.email);
    res.json(favs.map(f => f.logementId));
});

// --- USER UPDATE API ---

app.post('/api/users/update', (req, res) => {
    const { email, name, profilePic, phone, omNumber } = req.body;
    try {
        db.prepare(`
            UPDATE users 
            SET name = COALESCE(?, name), 
                profilePic = COALESCE(?, profilePic),
                phone = COALESCE(?, phone),
                omNumber = COALESCE(?, omNumber)
            WHERE email = ?
        `).run(name, profilePic, phone, omNumber, email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- MESSAGES API ---

app.get('/api/messages/:email', (req, res) => {
    const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE senderEmail = ? OR receiverEmail = ?
        ORDER BY date ASC
    `).all(req.params.email, req.params.email);
    res.json(messages);
});

// --- USER DATA API (Notifs, Docs) ---

app.post('/api/users/notifications/delete', (req, res) => {
    const { email, index } = req.body;
    try {
        const user = db.prepare('SELECT notifications FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const notifs = JSON.parse(user.notifications || '[]');
        notifs.splice(index, 1);
        
        db.prepare('UPDATE users SET notifications = ? WHERE email = ?').run(JSON.stringify(notifs), email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users/notifications/read', (req, res) => {
    const { email } = req.body;
    try {
        const user = db.prepare('SELECT notifications FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const notifs = JSON.parse(user.notifications || '[]').map(n => ({ ...n, read: true }));
        
        db.prepare('UPDATE users SET notifications = ? WHERE email = ?').run(JSON.stringify(notifs), email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users/documents', (req, res) => {
    const { email, name, type, data } = req.body;
    try {
        const user = db.prepare('SELECT documents FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const docs = JSON.parse(user.documents || '[]');
        docs.push({ id: Date.now(), name, type, data, date: new Date().toLocaleDateString('fr-FR') });
        
        db.prepare('UPDATE users SET documents = ? WHERE email = ?').run(JSON.stringify(docs), email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users/documents/delete', (req, res) => {
    const { email, docId } = req.body;
    try {
        const user = db.prepare('SELECT documents FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const docs = JSON.parse(user.documents || '[]').filter(d => d.id != docId);
        
        db.prepare('UPDATE users SET documents = ? WHERE email = ?').run(JSON.stringify(docs), email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/auth/reset-password', (req, res) => {
    const { email, phone, newPass } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user && user.phone === phone) {
            const hashedPassword = bcrypt.hashSync(newPass, 10);
            db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Informations incorrectes' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- SUPPORT API ---

app.get('/api/support', (req, res) => {
    const support = db.prepare('SELECT * FROM support').all();
    res.json(support);
});

// --- USER API ---

app.get('/api/users/students', (req, res) => {
    const students = db.prepare('SELECT * FROM users WHERE role = "student"').all();
    res.json(students);
});

app.get('/api/users/students/owner/:email', (req, res) => {
    const students = db.prepare(`
        SELECT u.* 
        FROM users u
        JOIN logements l ON u.currentLogementId = l.id
        WHERE l.ownerEmail = ? AND u.role = "student"
    `).all(req.params.email);
    res.json(students);
});

app.post('/api/users/payment', (req, res) => {
    const { studentEmail, montant, type } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(studentEmail);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const nouveauPaye = (user.montantPaye || 0) + parseInt(montant);
        const nouveauReste = (user.loyerTotal || 0) - nouveauPaye;

        db.prepare(`
            UPDATE users 
            SET montantPaye = ?, resteAPayer = ?
            WHERE email = ?
        `).run(nouveauPaye, nouveauReste, studentEmail);

        // Logique simplifiée pour les notifications
        const date = new Date().toLocaleDateString('fr-FR');
        // On pourrait insérer dans une table notifications si elle existait, 
        // ou l'ajouter au champ notifications JSON si on utilisait JSON.
        // Pour l'instant on se contente de mettre à jour le user.

        res.json({ success: true, nouveauPaye, nouveauReste });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users/loyer', (req, res) => {
    const { studentEmail, montant } = req.body;
    try {
        db.prepare('UPDATE users SET loyerTotal = ?, resteAPayer = ? - montantPaye WHERE email = ?').run(montant, montant, studentEmail);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users/leave', (req, res) => {
    const { studentEmail } = req.body;
    try {
        db.prepare('UPDATE users SET currentLogementId = NULL, loyerTotal = 0, montantPaye = 0, resteAPayer = 0 WHERE email = ?').run(studentEmail);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/users/:email', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        userWithoutPassword.notifications = JSON.parse(user.notifications || '[]');
        userWithoutPassword.documents = JSON.parse(user.documents || '[]');
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur CampusHome démarré sur http://localhost:${PORT}`);
});
