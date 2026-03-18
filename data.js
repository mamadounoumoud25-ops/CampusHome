// --- SIMULATION BACKEND / BASE DE DONNÉES ---
// Ce fichier gère toutes les données de l'application.

const DB_KEYS = {
    LOGEMENTS: 'campusHome_logements',
    USERS: 'campusHome_users',
    SUPPORT: 'campusHome_support',
    MESSAGES: 'campusHome_messages',
    LANG: 'campus_lang'
};

const defaultSupport = [
    { name: "Service Médiation Labé", phone: "+224 620 00 00 00", role: "Médiateur", desc: "Pour les litiges loyers" },
    { name: "Urgence Logement", phone: "+224 611 11 11 11", role: "Assistance", desc: "Problèmes techniques graves" }
];

// Utilitaire simple pour le hachage (Simulation asynchrone pour compatibilité futures APIs)
// En production locale sans serveur, on utilise une version simplifiée ou WebCrypto
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str + "campus_salt_2024"); // Ajout d'un sel
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Données par défaut (pour le premier démarrage)
const mockLogements = [
    {
        id: 1,
        titre: "Chambre Étudiante Standard",
        type: "chamber",
        prix: 150000,
        quartier: "Hafia",
        image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        wcInterne: false,
        electricite: true,
        eau: true,
        disponible: true,
        ownerEmail: "fatou@proprio.gn"
    },
    {
        id: 2,
        titre: "Studio Moderne",
        type: "apartment",
        prix: 450000,
        quartier: "Tata",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        wcInterne: true,
        electricite: true,
        eau: true,
        disponible: true,
        ownerEmail: "fatou@proprio.gn"
    },
    {
        id: 3,
        titre: "Appartement 2 Chambres",
        type: "apartment",
        prix: 800000,
        quartier: "Kouroula",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        wcInterne: true,
        electricite: true,
        eau: true,
        disponible: false,
        ownerEmail: "fatou@proprio.gn"
    },
    {
        id: 4,
        titre: "Chambre Simple Économique",
        type: "chamber",
        prix: 100000,
        quartier: "Pounthioun",
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        wcInterne: false,
        electricite: true,
        eau: false,
        disponible: true,
        ownerEmail: "fatou@proprio.gn"
    }
];

const mockUsers = [
    { name: "Mamadou Bah", email: "mamadou@etu.univ-labe.gn", role: "student", filiere: "Informatique", date: "2024-02-10", currentLogementId: 1, loyerTotal: 150000, montantPaye: 150000, resteAPayer: 0 },
    { name: "Fatoumata Dalein", email: "fatou@proprio.gn", role: "owner", filiere: "Propriétaire", date: "2024-02-09" }
];

// --- CLASSE DATABASE ---
class DataManager {
    constructor() {
        this.logements = this.load(DB_KEYS.LOGEMENTS, mockLogements);
        this.users = this.load(DB_KEYS.USERS, mockUsers);
        this.support = this.load(DB_KEYS.SUPPORT, defaultSupport);
        this.messages = this.load(DB_KEYS.MESSAGES, []);
    }

    // ... (load/save)

    getSupport() {
        return this.support;
    }

    updateSupport(newSupportList) {
        this.support = newSupportList;
        this.save(DB_KEYS.SUPPORT, this.support);
    }

    // Charger depuis LocalStorage
    load(key, defaultData) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultData;
    }

    // Sauvegarder dans LocalStorage
    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- MÉTHODES PRIVÉES / UTILITAIRES ---
    _scrub(user) {
        if (!user) return null;
        // Créer une copie sans les données sensibles
        const { password, ...cleanUser } = user;
        return cleanUser;
    }

    // --- MÉTHODES UTILISATEURS ---
    getUsers() {
        return this.users.map(u => this._scrub(u));
    }

    getStudents() {
        return this.users.filter(u => u.role === 'student').map(u => this._scrub(u));
    }

    getStudentsByOwner(ownerEmail) {
        if (!ownerEmail) return [];
        const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
        const ownerLogIds = new Set(this.getLogementsByOwner(cleanOwnerEmail).map(l => l.id));
        return this.getStudents().filter(s => ownerLogIds.has(Number(s.currentLogementId)));
    }

    async addUser(name, email, role, password = "", filiere = "", phone = "", profilePic = "") {
        const cleanEmail = email.toLowerCase().trim();
        const hashedPassword = await hashString(password || "1234");
        const newUser = {
            id: Date.now(),
            name,
            email: cleanEmail,
            role,
            password: hashedPassword,
            phone: phone,
            profilePic: profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
            filiere: filiere || (role === 'student' ? 'Non renseigné' : 'Propriétaire'),
            date: new Date().toLocaleDateString('fr-FR'),
            // Logement
            currentLogementId: null,
            // Gestion Paiement
            loyerTotal: 0,
            montantPaye: 0,
            resteAPayer: 0,
            // Info Propriétaire
            omNumber: "",
            momoNumber: "",
            // Favoris et Activités
            favoris: [],
            notifications: [],
            paiementsHistory: [],
            documents: []
        };
        this.users.push(newUser);
        this.save(DB_KEYS.USERS, this.users);
        return newUser;
    }

    getUserByEmail(email) {
        if (!email) return null;
        const cleanEmail = email.toLowerCase().trim();
        return this.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    }

    // Vérifie si le mot de passe est correct
    async checkPassword(email, password) {
        if (!email || !password) return false;
        const user = this.getUserByEmail(email);
        if (!user) return false;

        const hashedAttempt = await hashString(password.trim());
        // Support temporaire pour les anciens comptes en clair (migration auto)
        if (user.password === password.trim()) {
            user.password = hashedAttempt; // Migration
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return user.password === hashedAttempt;
    }

    // Réinitialise le mot de passe après vérification de l'email et du téléphone
    async resetPassword(email, phone, newPassword) {
        if (!email || !phone || !newPassword) return false;
        const user = this.getUserByEmail(email);
        if (user && user.phone.trim() === phone.trim()) {
            user.password = await hashString(newPassword.trim());
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    updateUserProfile(email, data) {
        const user = this.getUserByEmail(email);
        if (user) {
            if (data.name) user.name = data.name;
            if (data.profilePic) user.profilePic = data.profilePic;
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    deleteNotification(email, idx) {
        const user = this.getUserByEmail(email);
        if (user && user.notifications) {
            user.notifications.splice(idx, 1);
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    // Lie un étudiant à un logement
    occuperLogement(email, logementId) {
        const user = this.getUserByEmail(email);
        if (user) {
            user.currentLogementId = logementId;
            // On marque aussi le logement comme indisponible
            const log = this.logements.find(l => l.id === logementId);
            if (log) {
                log.disponible = false;
                // On initialise le loyer par défaut avec le prix du logement
                user.loyerTotal = log.prix;
                user.resteAPayer = user.loyerTotal - (user.montantPaye || 0);
            }

            this.save(DB_KEYS.USERS, this.users);
            this.save(DB_KEYS.LOGEMENTS, this.logements);
        }
    }

    // L'étudiant quitte le logement (Vérification propriétaire)
    quitterLogement(email, requesterEmail) {
        const user = this.getUserByEmail(email);
        if (user && user.currentLogementId) {
            const logId = user.currentLogementId;
            const log = this.logements.find(l => l.id === logId);

            // Sécurité : Seul le propriétaire ou admin peut libérer la place
            if (log && log.ownerEmail !== requesterEmail && requesterEmail !== 'admin@campus.com') {
                return false;
            }

            user.currentLogementId = null;

            // On remet le logement en disponible
            if (log) log.disponible = true;

            // On réinitialise les finances pour le prochain logement
            user.loyerTotal = 0;
            user.montantPaye = 0;
            user.resteAPayer = 0;
            user.paiementsHistory = [];

            this.save(DB_KEYS.USERS, this.users);
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    deleteUser(email) {
        if (!email) return;
        const cleanEmail = email.toLowerCase().trim();
        this.users = this.users.filter(u => u.email.toLowerCase().trim() !== cleanEmail);
        this.save(DB_KEYS.USERS, this.users);
    }

    updateOwnerProfile(email, data) {
        const user = this.getUserByEmail(email);
        if (user) {
            user.phone = data.phone;
            user.omNumber = data.omNumber;
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    // --- GESTION DES PAIEMENTS ---
    // Définit le loyer total dû par l'étudiant (Vérification propriétaire)
    setLoyer(email, montant, requesterEmail) {
        const user = this.getUserByEmail(email);
        if (user && user.currentLogementId) {
            const log = this.logements.find(l => l.id === user.currentLogementId);
            if (log && log.ownerEmail === requesterEmail) {
                user.loyerTotal = parseInt(montant);
                user.resteAPayer = user.loyerTotal - (user.montantPaye || 0);
                this.save(DB_KEYS.USERS, this.users);
                return true;
            }
        }
        return false;
    }

    // addPaiement supprimé ici (doublon plus bas avec historique)

    // --- MÉTHODES LOGEMENTS ---
    getLogements() {
        return this.logements;
    }

    getLogementsByOwner(email) {
        const cleanEmail = email.toLowerCase().trim();
        return this.logements.filter(l => l.ownerEmail.toLowerCase().trim() === cleanEmail);
    }

    addLogement(logement) {
        // Validation simple
        if (!logement.image) logement.image = "https://via.placeholder.com/500x300?text=Pas+d+image";
        if (logement.ownerEmail) logement.ownerEmail = logement.ownerEmail.toLowerCase().trim();

        this.logements.unshift(logement); // Ajouter au début
        this.save(DB_KEYS.LOGEMENTS, this.logements);
    }

    toggleLogementStatus(id, requesterEmail) {
        const log = this.logements.find(l => l.id === id);
        if (log && log.ownerEmail === requesterEmail) {
            log.disponible = !log.disponible;
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    deleteLogement(id, requesterEmail) {
        const idx = this.logements.findIndex(l => l.id === id);
        if (idx !== -1 && this.logements[idx].ownerEmail === requesterEmail) {
            this.logements.splice(idx, 1);
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    // --- GESTION DES FAVORIS ---
    toggleFavori(email, logementId) {
        const user = this.getUserByEmail(email);
        if (user) {
            if (!user.favoris) user.favoris = [];
            const index = user.favoris.indexOf(logementId);
            if (index === -1) {
                user.favoris.push(logementId);
            } else {
                user.favoris.splice(index, 1);
            }
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    isFavori(email, logementId) {
        const user = this.getUserByEmail(email);
        return user && user.favoris && user.favoris.includes(logementId);
    }

    // --- GESTION DES AVIS ---
    addReview(id, review) {
        const log = this.logements.find(l => l.id === id);
        if (log) {
            if (!log.reviews) log.reviews = [];
            log.reviews.push({
                ...review,
                date: new Date().toLocaleDateString('fr-FR'),
                id: Date.now()
            });
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    // --- GESTION DES VISITES ---
    addVisitRequest(logementId, request) {
        const log = this.logements.find(l => l.id === logementId);
        if (log) {
            if (!log.visitRequests) log.visitRequests = [];
            log.visitRequests.push({
                ...request,
                id: Date.now(),
                status: 'pending',
                date: new Date().toLocaleDateString('fr-FR')
            });
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    cancelVisitRequest(logementId, userEmail) {
        const log = this.logements.find(l => l.id === logementId);
        if (log && log.visitRequests) {
            log.visitRequests = log.visitRequests.filter(r => r.userEmail !== userEmail);
            this.save(DB_KEYS.LOGEMENTS, this.logements);
            return true;
        }
        return false;
    }

    getStudentRequests(email) {
        let requests = [];
        this.logements.forEach(l => {
            if (l.visitRequests) {
                const sub = l.visitRequests.filter(r => r.userEmail === email);
                sub.forEach(r => requests.push({ ...r, logementTitle: l.titre, logementId: l.id }));
            }
        });
        return requests;
    }

    getVisitRequests(ownerEmail) {
        const ownerLogs = this.getLogementsByOwner(ownerEmail);
        let allRequests = [];
        ownerLogs.forEach(l => {
            if (l.visitRequests) {
                l.visitRequests.forEach(req => {
                    allRequests.push({ ...req, logementTitle: l.titre });
                });
            }
        });
        return allRequests;
    }

    // --- GESTION DES PAIEMENTS (HISTORIQUE) ---
    addPaiement(email, montant) {
        const user = this.getUserByEmail(email);
        if (user) {
            const montantInt = parseInt(montant);
            user.montantPaye = (user.montantPaye || 0) + montantInt;

            let logTitle = "Logement";
            let logPrice = 0;
            if (user.currentLogementId) {
                const log = this.logements.find(l => l.id === user.currentLogementId);
                if (log) {
                    logTitle = log.titre;
                    logPrice = log.prix;
                }
            }

            if (!user.paiementsHistory) user.paiementsHistory = [];
            user.paiementsHistory.push({
                id: Date.now(),
                montant: montantInt,
                logTitle: logTitle,
                date: new Date().toLocaleDateString('fr-FR'),
                timestamp: Date.now()
            });

            // Recalculer le loyerTotal si nécessaire ou s'assurer de sa cohérence
            if (!user.loyerTotal && logPrice) user.loyerTotal = logPrice;

            user.resteAPayer = Math.max(0, (user.loyerTotal || 0) - user.montantPaye);
            this.save(DB_KEYS.USERS, this.users);
        }
    }

    getStudentFinancialSummary(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        return {
            totalDu: user.loyerTotal || 0,
            montantPaye: user.montantPaye || 0,
            resteAPayer: user.resteAPayer || 0,
            pourcentage: user.loyerTotal > 0 ? Math.min(100, Math.round((user.montantPaye / user.loyerTotal) * 100)) : 0,
            status: user.resteAPayer <= 0 ? 'paid' : 'pending'
        };
    }
    // --- GESTION DES NOTIFICATIONS ---
    addNotification(email, notif) {
        const user = this.getUserByEmail(email);
        if (user) {
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                id: Date.now(),
                text: notif.text,
                date: new Date().toLocaleString('fr-FR'),
                read: false,
                type: notif.type || 'info'
            });
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    markNotifsAsRead(email) {
        const user = this.getUserByEmail(email);
        if (user && user.notifications) {
            user.notifications.forEach(n => n.read = true);
            this.save(DB_KEYS.USERS, this.users);
        }
    }

    // --- STATISTIQUES PROPRIO ---
    getOwnerStats(email) {
        if (!email) return { collecte: 0, enAttente: 0, nombreEtudiants: 0 };
        const cleanEmail = email.toLowerCase().trim();
        const ownerLogIds = new Set(this.getLogementsByOwner(cleanEmail).map(l => l.id));

        const ownerStudents = this.getStudents().filter(s => ownerLogIds.has(Number(s.currentLogementId)));

        let totalCollecte = 0;
        let totalAttendu = 0;

        ownerStudents.forEach(s => {
            totalCollecte += (s.montantPaye || 0);
            totalAttendu += (s.loyerTotal || 0);
        });

        return {
            collecte: totalCollecte,
            enAttente: totalAttendu - totalCollecte,
            nombreEtudiants: ownerStudents.length
        };
    }

    // --- GESTION DES MESSAGES ---
    sendMessage(from, to, text) {
        const msg = {
            id: Date.now(),
            from: from.toLowerCase().trim(),
            to: to.toLowerCase().trim(),
            text,
            date: new Date().toLocaleString('fr-FR'),
            read: false
        };
        this.messages.push(msg);
        this.save(DB_KEYS.MESSAGES, this.messages);
        return msg;
    }

    getMessages(userEmail) {
        const email = userEmail.toLowerCase().trim();
        return this.messages.filter(m => m.from === email || m.to === email);
    }

    markMessagesAsRead(userEmail, otherEmail) {
        const me = userEmail.toLowerCase().trim();
        const other = otherEmail.toLowerCase().trim();
        this.messages.forEach(m => {
            if (m.to === me && m.from === other) m.read = true;
        });
        this.save(DB_KEYS.MESSAGES, this.messages);
    }

    // --- GESTION DES DOCUMENTS ---
    addDocument(email, docName, docType, fileData) {
        const user = this.getUserByEmail(email);
        if (user) {
            if (!user.documents) user.documents = [];
            user.documents.push({
                id: Date.now(),
                name: docName,
                type: docType,
                data: fileData, // Base64
                date: new Date().toLocaleDateString('fr-FR')
            });
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }

    deleteDocument(email, docId) {
        const user = this.getUserByEmail(email);
        if (user && user.documents) {
            user.documents = user.documents.filter(d => d.id !== docId);
            this.save(DB_KEYS.USERS, this.users);
            return true;
        }
        return false;
    }
}

// Initialiser et rendre global
const db = new DataManager();
console.log("Backend chargé : Base de données prête.");
