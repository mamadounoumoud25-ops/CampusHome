// --- FRONTEND LOGIC ---
// Utilise l'objet 'db' défini dans data.js

let currentUser = null; // 'student', 'owner', 'admin'
let currentUserEmail = null; // Email de l'utilisateur connecté

// Fonction pour déformater le prix
function formatPrix(prix) {
    return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " GNF";
}

// Utilitaire pour éviter les injections XSS
function escapeHTML(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Générateur de Carte Logement
function generateCard(logement, isOwnerView = false) {
    const isFav = currentUserEmail ? db.isFavori(currentUserEmail, logement.id) : false;
    const favIcon = isFav ? 'heart' : 'heart-outline';
    const favColor = isFav ? '#ef4444' : 'inherit';

    // Définition du badge de statut
    const statusBadge = logement.disponible
        ? `<span class="status-badge success">Disponible</span>`
        : `<span class="status-badge error">Loué</span>`;

    // Moyenne des avis
    const reviews = logement.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "N/A";
    const ratingDisplay = `
        <div style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #f59e0b;">
            <ion-icon name="star"></ion-icon> ${avgRating} (${reviews.length})
        </div>
    `;

    // Lien Google Maps intelligent
    const mapsUrl = logement.googleMaps || `https://www.google.com/maps/search/${encodeURIComponent(logement.quartier + ', Labé, Guinée')}`;
    const mapsBtn = `
        <a href="${mapsUrl}" target="_blank" class="btn-location-link" title="Voir sur Google Maps" style="color: #3b82f6; display: flex; align-items: center; gap: 4px; text-decoration: none; font-size: 0.85rem; margin-top: 5px;">
            <ion-icon name="map-outline"></ion-icon> ${logement.googleMaps ? 'Maps' : 'Localiser le quartier'}
        </a>
    `;

    const shareBtn = `
        <button onclick="partagerWhatsApp(${logement.id})" class="btn-share-wa" style="background: #22c55e; color: white; border: none; padding: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s;" title="Partager sur WhatsApp">
            <ion-icon name="logo-whatsapp" style="font-size: 1.2rem;"></ion-icon>
        </button>
    `;

    const ownerControls = isOwnerView ? `
        <div class="owner-controls" style="display:flex; flex-direction: column; gap: 10px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(0,0,0,0.05);">
            <div style="display: flex; gap: 10px;">
                <button onclick="toggleStatus(${logement.id})" class="btn-sm" style="flex:1; background:${logement.disponible ? '#f59e0b' : 'var(--gray)'}; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">
                    <ion-icon name="${logement.disponible ? 'lock-closed-outline' : 'lock-open-outline'}"></ion-icon> 
                    ${logement.disponible ? 'Loué' : 'Libre'}
                </button>
                <button onclick="deleteLogement(${logement.id})" class="btn-sm" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
            <button onclick="viewVisitRequests(${logement.id})" class="btn-sm" style="background: var(--dark); color: white; width: 100%; border: none; padding: 10px; border-radius: 8px; cursor: pointer;">
                <ion-icon name="calendar-outline"></ion-icon> Voir les demandes
            </button>
        </div>
    ` : `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding-top: 1rem;">
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="card-action" style="flex: 1;" onclick="contacterProprietaire(${logement.id})" ${!logement.disponible ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                    <ion-icon name="call-outline"></ion-icon> ${logement.disponible ? 'Contacter' : 'Indisponible'}
                </button>
                ${shareBtn}
            </div>
            <button onclick="requestVisit(${logement.id})" style="background: var(--white); border: 2px solid var(--dark); color: var(--dark); padding: 0.8rem; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <ion-icon name="calendar-outline"></ion-icon> Demander une visite
            </button>
            <button onclick="openReviewsModal(${logement.id})" style="background: none; border: none; color: var(--gray); font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                Lire les avis
            </button>
        </div>
    `;

    return `
    <div class="listing-card reveal">
        <div class="card-image-container" onclick="openGallery(${logement.id})">
            <img src="${logement.image}" alt="${logement.titre}" class="card-image">
            <div style="position:absolute; top:10px; left:10px; background: rgba(0,0,0,0.5); color: white; padding: 4px 8px; border-radius: 5px; font-size: 0.7rem; pointer-events: none;">
                <ion-icon name="images-outline"></ion-icon> Voir photos
            </div>
            <div style="position:absolute; top:10px; right:10px; display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                ${statusBadge}
                <button onclick="handleToggleFavori(event, ${logement.id})" style="background: white; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: ${favColor};">
                    <ion-icon name="${favIcon}" style="font-size: 1.5rem;"></ion-icon>
                </button>
            </div>
        </div>
        <div class="card-content">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                <span class="card-price">${formatPrix(logement.prix)}/mois</span>
                ${ratingDisplay}
            </div>
            <h3 class="card-title" style="margin-bottom: 0.2rem;">${escapeHTML(logement.titre)}</h3>
            <div class="card-location">
                <ion-icon name="location"></ion-icon>
                <span>${escapeHTML(logement.quartier)}, Labé</span>
            </div>
            ${mapsBtn}
            <div class="card-features" style="margin-top: 1rem;">
                <div class="feature" title="Électricité"><ion-icon name="flash-outline"></ion-icon> ${logement.electricite ? 'Oui' : 'Non'}</div>
                <div class="feature" title="Eau"><ion-icon name="water-outline"></ion-icon> ${logement.eau ? 'Oui' : 'Non'}</div>
                <div class="feature" title="Toilettes"><ion-icon name="home-outline"></ion-icon> ${logement.wcInterne ? 'Int' : 'Ext'}</div>
            </div>
            ${ownerControls}
        </div>
    </div>
    `;
}

// Affichage principal
function afficherLogements(data, containerId = 'listings-container', isOwner = false) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = data.map(l => generateCard(l, isOwner)).join('');
            container.style.opacity = '1';
            container.style.transition = 'opacity 0.4s ease';
            initScrollReveal(); // Ré-observer les nouveaux éléments
        }, 50);
    }
}

// Filtrage
function handleSmartSearch() {
    const query = document.getElementById('smart-search').value.toLowerCase().trim();
    if (query === "") {
        filtrerLogements();
        return;
    }

    let filtered = db.getLogements().filter(l => l.disponible);
    filtered = filtered.filter(l =>
        l.titre.toLowerCase().includes(query) ||
        l.quartier.toLowerCase().includes(query) ||
        l.type.toLowerCase().includes(query)
    );

    afficherLogements(filtered);
}

function handlePriceSlider() {
    const slider = document.getElementById('price-slider');
    const display = document.getElementById('price-display');
    const val = parseInt(slider.value);

    if (val >= 2000000) {
        display.textContent = "Illimité";
    } else {
        display.textContent = formatPrix(val);
    }
    filtrerLogements();
}

function filtrerLogements() {
    const query = document.getElementById('smart-search') ? document.getElementById('smart-search').value.toLowerCase().trim() : "";
    const maxPrice = document.getElementById('price-slider') ? parseInt(document.getElementById('price-slider').value) : 2000000;

    let filtered = db.getLogements().filter(l => l.disponible);

    if (query) {
        filtered = filtered.filter(l =>
            l.titre.toLowerCase().includes(query) ||
            l.quartier.toLowerCase().includes(query)
        );
    }

    if (maxPrice < 2000000) {
        filtered = filtered.filter(l => l.prix <= maxPrice);
    }

    afficherLogements(filtered);
}

function filterTag(type) {
    document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    let filtered = db.getLogements().filter(l => l.disponible);
    if (type !== 'all') {
        filtered = filtered.filter(l => l.type === type);
    }
    afficherLogements(filtered);
}

// --- GESTION PROPRIÉTAIRE ---

function switchOwnerTab(tab) {
    // Redirection directe vers la page étudiants si demandé, sinon gestion affichage
    if (tab === 'students') {
        window.location.href = 'etudiants.html';
        return;
    }

    // Si on est encore là, c'est pour les annonces
    const listingsDiv = document.getElementById('owner-listings');
    if (listingsDiv) listingsDiv.classList.remove('hidden');
}

// Changer le statut (Libre / Loué)
function toggleStatus(id) {
    if (db.toggleLogementStatus(id, currentUserEmail)) {
        showOwnerDashboard(); // Rafraichir
    } else {
        alert("Action interdite : vous n'êtes pas le propriétaire.");
    }
}

// Supprimer une annonce
function deleteLogement(id) {
    if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
        if (db.deleteLogement(id, currentUserEmail)) {
            showOwnerDashboard();
        } else {
            alert("Action interdite : vous n'êtes pas le propriétaire.");
        }
    }
}

// --- AUTHENTIFICATION ---

function openAuth() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuth() {
    document.getElementById('auth-modal').classList.add('hidden');
    // Reset profile preview
    const preview = document.getElementById('signup-pic-preview');
    const icon = document.getElementById('signup-pic-icon');
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }
    if (icon) icon.style.display = "block";
}

function switchAuthTab(tab) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('btn-login-tab').classList.remove('active');
    document.getElementById('btn-signup-tab').classList.remove('active');

    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('btn-login-tab').classList.add('active');
    } else {
        document.getElementById('signup-form').classList.remove('hidden');
        document.getElementById('btn-signup-tab').classList.add('active');
    }
}

// ... (formatPrix, generateCard, etc.)

async function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email').value;
    const email = emailInput.toLowerCase().trim();
    const password = document.getElementById('login-pass').value;

    console.log("Tentative de connexion pour:", email);

    if (email === 'admin@campus.com') {
        currentUser = 'admin';
        currentUserEmail = email;
        saveSession(currentUser, currentUserEmail);
        alert("Bienvenue Admin. (Accès complet)");
        closeAuth();
        updateUI();
        return;
    }

    const user = db.getUserByEmail(email);

    if (user) {
        const isAuth = await db.checkPassword(email, password);
        if (!isAuth) {
            alert("Mot de passe incorrect.");
            return;
        }
        currentUser = user.role;
        currentUserEmail = user.email;
        saveSession(currentUser, currentUserEmail);

        closeAuth();
        updateUI();

        if (currentUser === 'owner') {
            alert("Bon retour, Propriétaire " + user.name + " !");
            showOwnerDashboard();
        } else {
            alert("Bienvenue Étudiant " + user.name + " !");
            showStudentDashboard(); // Rediriger l'étudiant vers son dashboard par défaut
        }
    } else {
        alert("Email inconnu. Veuillez créer un compte ou vérifier l'adresse.");
    }
}

// --- RÉCUPÉRATION DE MOT DE PASSE ---

function openRecovery() {
    closeAuth();
    document.getElementById('recovery-modal').classList.remove('hidden');
    document.getElementById('recovery-step-1').classList.remove('hidden');
    document.getElementById('recovery-step-2').classList.add('hidden');
}

function closeRecovery() {
    document.getElementById('recovery-modal').classList.add('hidden');
}

function handleRecoveryVerify(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const phone = document.getElementById('recovery-phone').value;

    const user = db.getUserByEmail(email);
    if (user && user.phone.trim() === phone.trim()) {
        document.getElementById('recovery-step-1').classList.add('hidden');
        document.getElementById('recovery-step-2').classList.remove('hidden');
    } else {
        alert("Les informations saisies ne correspondent à aucun compte.");
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const phone = document.getElementById('recovery-phone').value;
    const newPass = document.getElementById('recovery-new-pass').value;

    if (await db.resetPassword(email, phone, newPass)) {
        alert("Mot de passe mis à jour avec succès ! Connectez-vous maintenant.");
        closeRecovery();
        openAuth();
    } else {
        alert("Une erreur est survenue lors de la réinitialisation.");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const roleInput = document.querySelector('input[name="role"]:checked');
    if (!roleInput) {
        alert("Veuillez sélectionner un rôle (Étudiant ou Propriétaire).");
        return;
    }
    const role = roleInput.value;
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value.toLowerCase().trim();
    const filiere = document.getElementById('signup-filiere') ? document.getElementById('signup-filiere').value : '';
    const pass = document.getElementById('signup-pass').value;

    if (db.getUserByEmail(email)) {
        alert("Cet email est déjà utilisé.");
        return;
    }

    const profilePicPreview = document.getElementById('signup-pic-preview');
    const profilePic = (profilePicPreview && profilePicPreview.src && profilePicPreview.src.startsWith('data:image')) ? profilePicPreview.src : "";

    await db.addUser(name, email, role, pass, filiere, phone, profilePic);

    currentUser = role;
    currentUserEmail = email;
    saveSession(currentUser, currentUserEmail);

    closeAuth();
    updateUI();

    if (role === 'owner') {
        alert("Compte propriétaire créé avec succès ! Bienvenue " + name);
        showOwnerDashboard();
    } else {
        alert("Compte étudiant créé avec succès ! Bienvenue " + name);
        showStudentDashboard();
    }
}

function previewProfilePic(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('signup-pic-preview').src = e.target.result;
            document.getElementById('signup-pic-preview').style.display = 'block';
            document.getElementById('signup-pic-icon').style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function saveSession(role, email) {
    localStorage.setItem('campus_current_role', role);
    localStorage.setItem('campus_current_email', email);
}

function restoreSession() {
    const role = localStorage.getItem('campus_current_role');
    const email = localStorage.getItem('campus_current_email');
    if (role && email) {
        currentUser = role;
        currentUserEmail = email;

        updateUI();

        // Si on est sur la page d'accueil, rediriger vers le dashboard approprié
        if (currentUser === 'owner') {
            showOwnerDashboard();
        } else if (currentUser === 'student') {
            // Pour l'étudiant, on peut soit aller au dashboard, soit rester sur la vue recherche
            // Ici on choisit d'aller au dashboard par défaut pour plus de clarté
            showStudentDashboard();
        }
    }
}

function updateUI() {
    const authBtn = document.getElementById('auth-btn');
    const notifWrapper = document.getElementById('notif-wrapper');
    const propLink = document.querySelector('.nav-links a[href="#"][onclick*="switchAuthTab(\'signup\')"]');
    const user = db.getUserByEmail(currentUserEmail);

    if (currentUser) {
        // Masquer le lien "Propriétaires" (inscription) si déjà connecté
        if (propLink) propLink.style.display = 'none';

        if (currentUser === 'owner') {
            if (authBtn) {
                authBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${user ? user.profilePic : ''}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                        Espace Proprio
                    </div>
                `;
                authBtn.onclick = showOwnerDashboard;
            }
        } else if (currentUser === 'admin') {
            if (authBtn) {
                authBtn.textContent = 'Mode Admin';
                authBtn.onclick = () => alert('Connecté en tant que Administrateur');
            }
        } else {
            if (authBtn) {
                authBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${user ? user.profilePic : ''}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                        Mon Compte
                    </div>
                `;
                authBtn.onclick = showStudentDashboard;
            }
        }
        if (notifWrapper) notifWrapper.style.display = 'block';
        if (typeof loadNotifs === 'function') loadNotifs();
    } else {
        // Afficher le lien "Propriétaires" si déconnecté
        if (propLink) propLink.style.display = 'inline-block';

        if (authBtn) {
            authBtn.textContent = 'Connexion';
            authBtn.onclick = openAuth;
        }
        if (notifWrapper) notifWrapper.style.display = 'none';
    }
}

function renderStudentSpace() {
    const studentSpace = document.getElementById('student-space');
    const infoContainer = document.getElementById('current-rental-info');
    if (!studentSpace || !infoContainer) return;

    studentSpace.classList.remove('hidden');
    const user = db.getUserByEmail(currentUserEmail);

    if (user && user.currentLogementId) {
        const log = db.getLogements().find(l => l.id === user.currentLogementId);
        if (log) {
            infoContainer.innerHTML = `
                <div style="display:flex; gap:1.5rem; align-items:center; background:#f8fafc; padding:1.5rem; border-radius:15px; border:1px solid #e2e8f0;">
                    <img src="${log.image}" style="width:120px; height:90px; border-radius:10px; object-fit:cover;">
                    <div style="flex:1">
                        <h4 style="margin:0">${log.titre}</h4>
                        <p style="margin:5px 0; color:#64748b;">${log.quartier} • ${formatPrix(log.prix)}/mois</p>
                        <div style="font-size:0.9rem; margin-top:0.5rem; color:#10b981; font-weight:bold;">
                            Paiement : ${user.montantPaye.toLocaleString()} / ${user.loyerTotal.toLocaleString()} GNF
                        </div>
                    </div>
                    <button onclick="handleDeménagement()" style="background:#ef4444; color:white; border:none; padding:0.8rem 1.2rem; border-radius:50px; cursor:pointer; font-weight:bold;">
                        🚪 Quitter le logement
                    </button>
                </div>
            `;
        }
    } else {
        infoContainer.innerHTML = `
            <p style="text-align:center; color:#94a3b8; padding:2rem; border:2px dashed #f1f5f9; border-radius:15px;">
                Vous n'avez pas de logement enregistré pour le moment.
            </p>
        `;
    }
}

function handleDeménagement() {
    if (confirm("Voulez-vous vraiment signaler votre départ de ce logement ? Cela libérera la place pour d'autres étudiants.")) {
        db.quitterLogement(currentUserEmail);
        alert("Départ enregistré. Le logement est désormais disponible sur le site.");
        renderStudentSpace();
        showStudentView(); // Rafraîchir la liste
    }
}

function toggleSignupField(role) {
    const input = document.getElementById('signup-filiere');
    if (input) {
        if (role === 'student') {
            input.placeholder = "Département / Filière (ex: Informatique)";
            input.style.display = 'block';
        } else {
            // Pour un propriétaire, on peut soit masquer, soit demander le quartier
            input.placeholder = "Quartier de résidence";
            input.style.display = 'block';
        }
    }
}

function dbLocationFilter(location) {
    let filtered = db.getLogements().filter(l => l.disponible && l.quartier === location);
    afficherLogements(filtered);
    document.getElementById('logements').scrollIntoView({ behavior: 'smooth' });
}

// Vues
function showOwnerDashboard() {
    document.getElementById('accueil').style.display = 'none';
    document.getElementById('logements').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.getElementById('student-dashboard').classList.add('hidden');
    const dash = document.getElementById('owner-dashboard');
    dash.classList.remove('hidden');

    // On ne montre que les logements de ce propriétaire
    const ownerListings = db.getLogementsByOwner(currentUserEmail);
    afficherLogements(ownerListings, 'owner-listings', true);

    // Stats Premium
    const stats = db.getOwnerStats(currentUserEmail);
    const statsContainer = document.querySelector('#owner-dashboard .stats-grid') || document.querySelector('#owner-dashboard > .container > div:nth-child(2)');

    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="financial-card glass-panel" style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: space-around; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
                <div style="text-align: center;">
                    <div style="opacity: 0.8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Revenus Totaux</div>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 5px;">${formatPrix(stats.totalPrevu)}</div>
                </div>
                <div style="width: 2px; height: 50px; background: rgba(255,255,255,0.1); display: none; @media (min-width: 600px) { display: block; }"></div>
                <div style="text-align: center;">
                    <div style="opacity: 0.8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Déjà Encaissé</div>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 5px; color: #34d399;">${formatPrix(stats.collecte)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="opacity: 0.8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">En attente</div>
                    <div style="font-size: 2rem; font-weight: 800; margin-top: 5px; color: #fca5a5;">${formatPrix(stats.enAttente)}</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; width: 100%;">
                 <div class="glass-panel" style="padding: 1.5rem; border-radius: 20px; text-align: center; border-bottom: 4px solid var(--primary);">
                    <div style="color: var(--gray); font-size: 0.8rem;">Annonces actives</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: var(--dark);">${ownerListings.length}</div>
                </div>
                <div class="glass-panel" style="padding: 1.5rem; border-radius: 20px; text-align: center; border-bottom: 4px solid #10b981;">
                    <div style="color: var(--gray); font-size: 0.8rem;">Étudiants inscrits</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: var(--dark);">${db.getStudentsByOwner(currentUserEmail).length}</div>
                </div>
                <div onclick="window.location.href='etudiants.html'" class="glass-panel" style="padding: 1.5rem; border-radius: 20px; text-align: center; background: var(--primary); color: white; cursor: pointer; transition: transform 0.2s;">
                    <ion-icon name="people-outline" style="font-size: 1.5rem;"></ion-icon>
                    <div style="font-weight: 800; margin-top: 5px;">GÉRER MES LOCATAIRES</div>
                </div>
            </div>
        `;
    }

    // Bouton Edit Profile
    const user = db.getUserByEmail(currentUserEmail);
    const welcomeSection = document.querySelector('#owner-dashboard h2').parentElement;
    if (welcomeSection && !document.getElementById('owner-edit-btn')) {
        const btn = document.createElement('button');
        btn.id = 'owner-edit-btn';
        btn.innerHTML = '<ion-icon name="create-outline"></ion-icon> Modifier mon profil';
        btn.className = 'btn-sm';
        btn.style = 'margin-bottom: 1rem; background: var(--light); border: 1px solid #ddd; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: 600;';
        btn.onclick = openEditProfile;
        welcomeSection.insertBefore(btn, welcomeSection.querySelector('.stats-grid'));
    }
}

function showStudentDashboard() {
    document.getElementById('accueil').style.display = 'none';
    document.getElementById('logements').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.getElementById('owner-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');

    const user = db.getUserByEmail(currentUserEmail);
    if (user) {
        // En-tête avec photo
        const header = document.querySelector('#student-dashboard h2');
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${user.profilePic}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">
                <span>👋 ${user.name}</span>
            </div>
            <button onclick="openEditProfile()" class="btn-sm" style="margin-top: 1rem; background: var(--light); border: 1px solid #ddd; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: 600;">
                <ion-icon name="create-outline"></ion-icon> Modifier mon profil
            </button>
        `;

        document.getElementById('stu-paid-text').textContent = formatPrix(user.montantPaye || 0);
        document.getElementById('stu-fav-count').textContent = (user.favoris || []).length;

        let status = "Aucun logement";
        const rentalCont = document.getElementById('stu-current-rental');

        if (user.currentLogementId) {
            status = user.resteAPayer <= 0 ? "✅ En règle" : "⏳ Reste " + formatPrix(user.resteAPayer);
            const log = db.getLogements().find(l => l.id === user.currentLogementId);
            if (log) {
                rentalCont.innerHTML = `
                    <div class="glass-panel" style="padding:1.5rem; border-radius:25px; border: 2px solid var(--primary); display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
                        <img src="${log.image}" style="width:150px; height:100px; border-radius:15px; object-fit:cover;">
                        <div style="flex:1">
                            <div style="font-size:0.8rem; color:var(--gray); text-transform:uppercase; letter-spacing:1px;">Mon Logement Actuel</div>
                            <h3 style="margin:5px 0 0 0; font-size:1.5rem;">${log.titre}</h3>
                            <p style="margin:5px 0; color:var(--gray);">${log.quartier} • ${formatPrix(log.prix)}/mois</p>
                        </div>
                        <button onclick="handleCancelRental()" style="background:#fff1f2; color:#e11d48; border:none; padding:1rem 1.5rem; border-radius:15px; cursor:pointer; font-weight:800; display:flex; align-items:center; gap:8px;">
                            <ion-icon name="exit-outline" style="font-size:1.2rem;"></ion-icon>
                            Annuler la location / Quitter
                        </button>
                    </div>
                `;
            }
        } else {
            rentalCont.innerHTML = `
                <div style="text-align:center; padding:3rem; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:25px; color:var(--gray);">
                    <ion-icon name="home-outline" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></ion-icon>
                    <p style="margin:0; font-weight:600;">Vous n'avez aucune location active pour le moment.</p>
                    <a href="#logements" onclick="showStudentView()" style="display:inline-block; margin-top:1rem; color:var(--primary); font-weight:800; text-decoration:none;">Trouver un logement →</a>
                </div>
            `;
        }
        document.getElementById('stu-status-text').textContent = status;
    }

    switchStudentDashboardTab('favs');
}



function switchStudentDashboardTab(tab) {
    const favsBtn = document.getElementById('stu-tab-favs');
    const reqsBtn = document.getElementById('stu-tab-reqs');
    const paysBtn = document.getElementById('stu-tab-pays');
    const docsBtn = document.getElementById('stu-tab-docs');
    const msgsBtn = document.getElementById('stu-tab-msgs');

    const favsCont = document.getElementById('stu-gallery-content');
    const reqsCont = document.getElementById('stu-reqs-content');
    const paysCont = document.getElementById('stu-pays-content');
    const docsCont = document.getElementById('stu-docs-content');
    const msgsCont = document.getElementById('stu-msgs-content');

    if (favsBtn) favsBtn.classList.remove('active');
    if (reqsBtn) reqsBtn.classList.remove('active');
    if (paysBtn) paysBtn.classList.remove('active');
    if (docsBtn) docsBtn.classList.remove('active');
    if (msgsBtn) msgsBtn.classList.remove('active');

    if (favsCont) favsCont.classList.add('hidden');
    if (reqsCont) reqsCont.classList.add('hidden');
    if (paysCont) paysCont.classList.add('hidden');
    if (docsCont) docsCont.classList.add('hidden');
    if (msgsCont) msgsCont.classList.add('hidden');

    if (tab === 'favs') {
        if (favsBtn) favsBtn.classList.add('active');
        if (favsCont) favsCont.classList.remove('hidden');
        renderStudentFavs();
    } else if (tab === 'reqs') {
        if (reqsBtn) reqsBtn.classList.add('active');
        if (reqsCont) reqsCont.classList.remove('hidden');
        renderStudentRequests();
    } else if (tab === 'pays') {
        if (paysBtn) paysBtn.classList.add('active');
        if (paysCont) paysCont.classList.remove('hidden');
        renderStudentReceipts();
    } else if (tab === 'docs') {
        if (docsBtn) docsBtn.classList.add('active');
        if (docsCont) docsCont.classList.remove('hidden');
        renderStudentDocs();
    } else if (tab === 'msgs') {
        if (msgsBtn) msgsBtn.classList.add('active');
        if (msgsCont) msgsCont.classList.remove('hidden');
        renderMessaging();
    }
}

function renderStudentRequests() {
    const container = document.getElementById('student-requests-container');
    if (!container) return;

    const reqs = db.getStudentRequests(currentUserEmail);
    if (reqs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray);">Aucune demande en cours.</p>';
        return;
    }

    container.innerHTML = reqs.map(r => `
        <div class="glass-panel" style="padding: 1.2rem; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #f59e0b;">
            <div>
                <div style="font-weight: 800;">Demande de visite pour : ${r.logementTitle}</div>
                <div style="color: var(--gray); font-size: 0.85rem;">📅 Prévue le : ${r.preferredDate}</div>
            </div>
            <button onclick="handleCancelRequest(${r.logementId})" class="btn-sm" style="background:#fff1f2; color:#e11d48; border:none; padding:8px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">
                Annuler
            </button>
        </div>
    `).join('');
}

function handleCancelRequest(logId) {
    if (confirm("Voulez-vous vraiment annuler cette demande de visite ?")) {
        db.cancelVisitRequest(logId, currentUserEmail);
        renderStudentRequests();
        alert("Demande annulée avec succès.");
    }
}

function renderStudentFavs() {
    const container = document.getElementById('student-favs-container');
    const user = db.getUserByEmail(currentUserEmail);
    const favIds = user.favoris || [];
    const favs = db.getLogements().filter(l => favIds.includes(l.id));

    if (favs.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 0.5rem; color: var(--gray);">Vous n\'avez pas encore de favoris.</p>';
        return;
    }
    container.innerHTML = favs.map(l => generateCard(l, false)).join('');
}

function renderStudentReceipts() {
    const container = document.getElementById('student-receipts-container');
    const user = db.getUserByEmail(currentUserEmail);
    const history = user.paiementsHistory || [];
    const summary = db.getStudentFinancialSummary(currentUserEmail);

    if (!summary) return;

    let summaryHTML = `
        <div class="financial-card reveal active">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin: 0; opacity: 0.8; font-size: 0.9rem;">Situation Financière</h4>
                    <div style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">${formatPrix(summary.resteAPayer)}</div>
                    <p style="margin: 0; font-size: 0.85rem; opacity: 0.7;">Reste à payer sur un total de ${formatPrix(summary.totalDu)}</p>
                </div>
                <div class="status-label ${summary.status === 'paid' ? 'status-paid' : 'status-pending'}">
                    ${summary.status === 'paid' ? 'À Jour' : 'En Attente'}
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-fill" style="width: ${summary.pourcentage}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
                <span>Progression : ${summary.pourcentage}%</span>
                <span>Payé : ${formatPrix(summary.montantPaye)}</span>
            </div>
        </div>
        <h4 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
            <ion-icon name="time-outline"></ion-icon> Historique des Paiements
        </h4>
    `;

    if (history.length === 0) {
        container.innerHTML = summaryHTML + '<p style="text-align: center; padding: 2rem; color: var(--gray); background: white; border-radius: 15px;">Aucun paiement enregistré.</p>';
        return;
    }

    const historyHTML = history.sort((a, b) => b.timestamp - a.timestamp).map(p => `
        <div class="glass-panel history-item" style="padding: 1.2rem; border-radius: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <ion-icon name="cash-outline" style="font-size: 1.5rem;"></ion-icon>
                </div>
                <div>
                    <div style="font-weight: 800;">Versement du ${p.date}</div>
                    <div style="color: var(--gray); font-size: 0.75rem;">${p.logTitle || 'Logement'}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="color: #22c55e; font-weight: 800; font-size: 1.1rem;">+ ${formatPrix(p.montant)}</div>
                <button onclick="downloadReceipt(${p.id}, ${p.montant}, '${p.date}', '${user.name.replace(/'/g, "\\'")}', '${(p.logTitle || 'Logement').replace(/'/g, "\\'")}')" 
                        style="background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 5px 0;">
                    Télécharger Reçu
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = summaryHTML + historyHTML;
}

function showStudentView() {
    document.getElementById('accueil').style.display = 'flex';
    document.getElementById('logements').style.display = 'block';
    document.querySelector('.features').style.display = 'flex';
    document.getElementById('owner-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');

    // Étudiants ne voient que les dispos
    afficherLogements(db.getLogements().filter(l => l.disponible), 'listings-container', false);
}

function logout() {
    currentUser = null;
    currentUserEmail = null;
    localStorage.removeItem('campus_current_role');
    localStorage.removeItem('campus_current_email');

    // Fermer les dashboards
    document.getElementById('owner-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');

    // Retour à la vue publique
    showStudentView();
    updateUI();

    alert("Vous avez été déconnecté.");
}

// Modal ajout
function showAddListingModal() {
    document.getElementById('add-listing-modal').classList.remove('hidden');
}

function closeAddListing() {
    document.getElementById('add-listing-modal').classList.add('hidden');
}

// Fonction utilitaire pour compresser une image via Canvas
function compressImage(base64Str, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
    });
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Alerte préventive pour les fichiers énormes
        if (file.size > 10 * 1024 * 1024) {
            alert("Cette image est trop volumineuse pour être traitée localement.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById('image-preview');
            const container = document.querySelector('.file-upload-container');

            if (img) {
                img.src = e.target.result;
                img.style.display = 'block';
            }
            if (container) {
                const p = container.querySelector('p');
                const icon = container.querySelector('ion-icon');
                if (p) p.style.display = 'none';
                if (icon) icon.style.display = 'none';
            }
        }
        reader.readAsDataURL(file);
    }
}

async function handleAddListing(e) {
    e.preventDefault();

    const preview = document.getElementById('image-preview');
    let finalImage = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60";

    if (preview && preview.src && preview.src.startsWith('data:image')) {
        try {
            // Compression automatique avant sauvegarde pour économiser le localStorage
            finalImage = await compressImage(preview.src);
        } catch (err) {
            console.error("Erreur compression:", err);
        }
    }

    const newLogement = {
        id: Date.now(),
        titre: escapeHTML(document.getElementById('new-title').value),
        type: document.getElementById('new-type').value,
        prix: parseInt(document.getElementById('new-price').value) || 0,
        quartier: escapeHTML(document.getElementById('new-location').value),
        image: finalImage,
        electricite: document.getElementById('new-elec').checked,
        eau: document.getElementById('new-water').checked,
        wcInterne: document.getElementById('new-wc').checked,
        disponible: true,
        ownerEmail: currentUserEmail,
        googleMaps: document.getElementById('new-maps') ? escapeHTML(document.getElementById('new-maps').value) : ''
    };

    try {
        db.addLogement(newLogement);
        alert("Annonce publiée !");
        closeAddListing();
        document.getElementById('add-listing-form').reset();

        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
            const container = document.querySelector('.file-upload-container');
            if (container) {
                const p = container.querySelector('p');
                const icon = container.querySelector('ion-icon');
                if (p) p.style.display = 'block';
                if (icon) icon.style.display = 'block';
            }
        }
        showOwnerDashboard();
    } catch (error) {
        console.error(error);
        alert("Désolé, l'image est encore trop lourde pour le stockage de votre navigateur. Essayez une image plus petite.");
    }
}

// --- GESTION PROFIL PROPRIÉTAIRE (PAIEMENT / CONTACT) ---

function showPaymentConfigModal() {
    if (!currentUserEmail) return;

    // Récupérer les infos de l'utilisateur connecté
    const owner = db.getUserByEmail(currentUserEmail);

    if (owner) {
        if (document.getElementById('config-phone')) document.getElementById('config-phone').value = owner.phone || '';
        if (document.getElementById('config-om')) document.getElementById('config-om').value = owner.omNumber || '';
    }

    document.getElementById('payment-config-modal').classList.remove('hidden');
}

function handlePaymentConfig(e) {
    e.preventDefault();
    if (!currentUserEmail) return;

    const phone = document.getElementById('config-phone').value;
    const om = document.getElementById('config-om').value;

    // Mise à jour du profil réel de l'utilisateur connecté
    db.updateOwnerProfile(currentUserEmail, { phone: phone, omNumber: om });
    alert("Vos informations de contact et paiement ont été mises à jour !");
    document.getElementById('payment-config-modal').classList.add('hidden');
}

function contacterProprietaire(id) {
    if (!currentUser) {
        alert("Connectez-vous pour contacter le propriétaire !");
        openAuth();
        return;
    }

    // Récupérer le logement pour trouver le propriétaire
    const logement = db.getLogements().find(l => l.id === id);
    const ownerEmail = logement ? logement.ownerEmail : null;
    let owner = null;

    if (ownerEmail) {
        owner = db.getUserByEmail(ownerEmail);
    } else {
        // Fallback demo
        owner = db.getUsers().find(u => u.role === 'owner');
    }

    if (owner) {
        const modal = document.getElementById('contact-owner-modal');
        const content = document.getElementById('owner-contact-info');

        const tel = owner.phone || "Non renseigné";
        const om = owner.omNumber || "Non renseigné";

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <img src="${owner.profilePic}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary); margin-bottom: 0.5rem;">
                <h4 style="margin: 0; font-size: 1.2rem;">${owner.name}</h4>
                <p style="color: var(--gray); font-size: 0.9rem;">Propriétaire vérifié</p>
            </div>
            
            <div style="background:#f8fafc; padding:1.5rem; border-radius:10px; margin-bottom:1rem;">
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <a href="tel:${tel}" class="btn-secondary" style="background:#3b82f6; color:white; text-decoration:none; padding:0.8rem; border-radius:8px; display:block;">
                        📞 Appeler : ${tel}
                    </a>
                    <a href="https://wa.me/224${tel.replace(/\s/g, '')}" target="_blank" class="btn-secondary" style="background:#22c55e; color:white; text-decoration:none; padding:0.8rem; border-radius:8px; display:block;">
                        💬 WhatsApp
                    </a>
                </div>
            </div>
            
            <div style="background:#fff7ed; padding:1.5rem; border-radius:10px; border:1px solid #fdba74; color: #000;">
                <h4 style="color:#c2410c; margin-top:0;"><ion-icon name="wallet"></ion-icon> Paiement Orange Money</h4>
                <p style="font-size:1.2rem; font-weight:bold; letter-spacing:1px; margin:0.5rem 0; color: #000;">${om}</p>
                <p style="font-size:0.9rem; color:#64748b;">Copiez ce numéro pour effectuer votre dépôt.</p>
            </div>
        `;

        modal.classList.remove('hidden');
    } else {
        alert("Impossible de trouver les infos du propriétaire.");
    }
}

// --- SYSTÈME DE MISE À JOUR (PWA) ---

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker enregistré !'))
            .catch(err => console.log('Erreur SW:', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prévenir l'affichage automatique du prompt par le navigateur
    e.preventDefault();
    // Garder l'événement pour plus tard
    deferredPrompt = e;
    // Afficher notre propre bouton d'installation
    const installWrapper = document.getElementById('install-btn-wrapper');
    if (installWrapper) installWrapper.style.display = 'block';
});

function installPWA() {
    if (deferredPrompt) {
        // Cacher notre bouton
        const installWrapper = document.getElementById('install-btn-wrapper');
        if (installWrapper) installWrapper.style.display = 'none';

        // Afficher le prompt natif
        deferredPrompt.prompt();

        // Attendre la réponse de l'utilisateur
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install');
            } else {
                console.log('User dismissed the PWA install');
            }
            deferredPrompt = null;
        });
    } else {
        // Fallback si le bouton est cliqué mais prompt non dispo
        alert("Pour installer CampusHome sur votre iPhone : cliquez sur 'Partager' puis 'Sur l'écran d'accueil'.");
    }
}

function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.update();
                alert("Vérification en cours... Si une nouvelle version est disponible, elle sera installée au prochain démarrage.");
            } else {
                alert("L'application est déjà à jour (Mode Local).");
            }
        });
    } else {
        alert("Les mises à jour ne sont pas disponibles sur ce navigateur.");
    }
}

function showDonationModal() {
    document.getElementById('donation-modal').classList.remove('hidden');
}

function showSupportModal() {
    const contacts = db.getSupport();
    const list = document.getElementById('support-list');

    // Bouton ajouter si admin
    const adminAddBtn = currentUser === 'admin' ? `
        <button onclick="editSupportContact(-1)" style="width:100%; padding:0.8rem; background:var(--primary); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-bottom:1rem;">
            + Ajouter un Intermédiaire
        </button>
    ` : '';

    list.innerHTML = adminAddBtn + contacts.map((c, index) => `
        <div style="background:#fff1f2; border:1px solid #fecdd3; padding:1rem; border-radius:10px; position:relative;">
            <div style="font-weight:bold; color:#be123c;">${c.name} (${c.role})</div>
            <div style="font-size:0.9rem; color:#475569; margin: 0.3rem 0;">${c.desc}</div>
            <a href="tel:${c.phone}" style="display:inline-block; margin-top:0.5rem; background:#e11d48; color:white; padding:5px 12px; border-radius:5px; text-decoration:none; font-weight:bold;">
                📞 ${c.phone}
            </a>
            ${currentUser === 'admin' ? `
                <div style="position:absolute; top:10px; right:10px; display:flex; gap:5px;">
                    <button onclick="editSupportContact(${index})" style="background:#cbd5e1; border:none; padding:5px; border-radius:5px; cursor:pointer;"><ion-icon name="create-outline"></ion-icon></button>
                    <button onclick="deleteSupportContact(${index})" style="background:#fecdd3; border:none; padding:5px; border-radius:5px; cursor:pointer; color:#e11d48;"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            ` : ''}
        </div>
    `).join('') + `
        <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px dashed #e2e8f0; text-align:center;">
            <p style="font-size:0.85rem; color:var(--gray); margin-bottom:1rem;">Besoin de contacter le créateur du projet ?</p>
            <a href="https://wa.me/224611760045" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#22c55e; color:white; padding:0.8rem; border-radius:10px; text-decoration:none; font-weight:bold; width:100%;">
                <ion-icon name="logo-whatsapp"></ion-icon> Discuter avec le Créateur (Aide Directe)
            </a>
        </div>
    `;
    document.getElementById('support-modal').classList.remove('hidden');
}

// --- LOGIQUE MODIFICATION PROFIL ---
function openEditProfile() {
    const user = db.getUserByEmail(currentUserEmail);
    if (!user) return;

    document.getElementById('edit-name').value = user.name;
    const preview = document.getElementById('edit-pic-preview');
    preview.src = user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;

    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function previewEditPic(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('edit-pic-preview').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function handleUpdateProfile() {
    const newName = document.getElementById('edit-name').value;
    const newPic = document.getElementById('edit-pic-preview').src;

    if (!newName) {
        alert("Le nom ne peut pas être vide.");
        return;
    }

    if (db.updateUserProfile(currentUserEmail, { name: newName, profilePic: newPic })) {
        alert("Profil mis à jour avec succès !");
        document.getElementById('edit-profile-modal').classList.add('hidden');
        updateUI(); // Mettre à jour la navbar
        if (currentUser === 'owner') showOwnerDashboard(); else showStudentDashboard();
    }
}

// --- NOTIFICATIONS AVANCÉES ---
function playNotifSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

function addNotificationWithSound(email, notif) {
    db.addNotification(email, notif);
    if (email === currentUserEmail) {
        playNotifSound();
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 2000);
        }
    }
}

function editSupportContact(index) {
    const contacts = db.getSupport();
    const contact = index === -1 ? { name: '', role: '', phone: '', desc: '' } : contacts[index];

    const newName = prompt("Nom de l'intermédiaire :", contact.name);
    if (newName === null) return;
    const newRole = prompt("Rôle (ex: Médiateur, Police, etc.) :", contact.role);
    const newPhone = prompt("Numéro de téléphone :", contact.phone);
    const newDesc = prompt("Description brève :", contact.desc);

    const newContact = { name: newName, role: newRole, phone: newPhone, desc: newDesc };

    if (index === -1) contacts.push(newContact);
    else contacts[index] = newContact;

    db.updateSupport(contacts);
    showSupportModal();
}

function deleteSupportContact(index) {
    if (confirm("Supprimer ce contact d'assistance ?")) {
        const contacts = db.getSupport();
        contacts.splice(index, 1);
        db.updateSupport(contacts);
        showSupportModal();
    }
}

// --- GESTION DU THÈME ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const isDark = body.getAttribute('data-theme') === 'dark';

    if (isDark) {
        body.removeAttribute('data-theme');
        icon.name = 'moon-outline';
        localStorage.setItem('campus_theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.name = 'sunny-outline';
        localStorage.setItem('campus_theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('campus_theme');
    const icon = document.getElementById('theme-icon');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (icon) icon.name = 'sunny-outline';
    }
}

// --- ANIMATIONS AU SCROLL ---
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- FONCTIONS NOUVELLES (FAVORIS, PARTAGE) ---
function handleToggleFavori(event, id) {
    event.stopPropagation();
    if (!currentUserEmail) {
        alert("Connectez-vous pour ajouter des favoris !");
        openAuth();
        return;
    }
    db.toggleFavori(currentUserEmail, id);
    // Rafraîchir l'affichage
    if (document.getElementById('owner-dashboard').classList.contains('hidden')) {
        showStudentView();
    } else {
        showOwnerDashboard();
    }
}

function partagerWhatsApp(id) {
    const log = db.getLogements().find(l => l.id === id);
    if (!log) return;

    const texte = `Salut ! J'ai trouvé ce logement sur CampusHome :\n\n🏠 *${log.titre}*\n📍 ${log.quartier}, Labé\n💰 ${formatPrix(log.prix)}/mois\n\nPlus d'infos sur CampusHome !`;
    const url = `https://wa.me/?text=${encodeURIComponent(texte)}`;
    window.open(url, '_blank');
}

// --- SYSTÈME D'AVIS ---
function openReviewsModal(id) {
    const log = db.getLogements().find(l => l.id === id);
    if (!log) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'reviews-modal';

    const reviews = log.reviews || [];
    const reviewsList = reviews.length > 0 ? reviews.map(r => {
        const u = db.getUserByEmail(r.userEmail);
        const pic = (u && u.profilePic) ? u.profilePic : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=6366f1&color=fff`;
        return `
        <div style="background: var(--light); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; display: flex; gap: 12px; align-items: flex-start;">
            <img src="${pic}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${r.userName}</strong>
                    <span style="color: #f59e0b;"><ion-icon name="star"></ion-icon> ${r.rating}/5</span>
                </div>
                <p style="margin-top: 5px; font-size: 0.9rem;">${r.comment}</p>
                <div style="font-size: 0.75rem; color: var(--gray); text-align: right;">${r.date}</div>
            </div>
        </div>
        `;
    }).join('') : '<p style="text-align: center; color: var(--gray);">Aucun avis pour le moment.</p>';

    modal.innerHTML = `
        <div class="modal-content" style="max-height: 80vh; overflow-y: auto;">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Avis sur ${log.titre}</h3>
            
            <div style="margin: 1.5rem 0;">
                ${reviewsList}
            </div>

            <hr style="opacity: 0.1; margin: 1.5rem 0;">
            
            <div id="add-review-section">
                <h4>Laisser un avis</h4>
                <div style="display: flex; gap: 5px; margin: 1rem 0; font-size: 1.5rem; color: #cbd5e1; cursor: pointer;" id="star-rating">
                    <ion-icon name="star-outline" onclick="setRating(1)"></ion-icon>
                    <ion-icon name="star-outline" onclick="setRating(2)"></ion-icon>
                    <ion-icon name="star-outline" onclick="setRating(3)"></ion-icon>
                    <ion-icon name="star-outline" onclick="setRating(4)"></ion-icon>
                    <ion-icon name="star-outline" onclick="setRating(5)"></ion-icon>
                </div>
                <input type="hidden" id="selected-rating" value="0">
                <textarea id="review-comment" placeholder="Votre commentaire..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; height: 100px;"></textarea>
                <button onclick="submitReview(${id})" class="btn-primary full-width" style="margin-top: 10px;">Publier l'avis</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

let currentRating = 0;
function setRating(r) {
    currentRating = r;
    const stars = document.querySelectorAll('#star-rating ion-icon');
    stars.forEach((s, idx) => {
        if (idx < r) {
            s.name = 'star';
            s.style.color = '#f59e0b';
        } else {
            s.name = 'star-outline';
            s.style.color = '#cbd5e1';
        }
    });
}

function submitReview(id) {
    if (!currentUserEmail) {
        alert("Connectez-vous pour laisser un avis !");
        return;
    }
    if (currentRating === 0) {
        alert("Veuillez choisir une note (étoiles).");
        return;
    }
    const comment = document.getElementById('review-comment').value;
    if (!comment) {
        alert("Veuillez écrire un petit commentaire.");
        return;
    }

    const user = db.getUserByEmail(currentUserEmail);
    db.addReview(id, {
        userName: escapeHTML(user.name),
        userEmail: currentUserEmail,
        rating: currentRating,
        comment: escapeHTML(comment)
    });

    alert("Merci pour votre avis !");
    document.getElementById('reviews-modal').remove();
    showStudentView();
}

// --- SYSTÈME DE DEMANDE DE VISITE ---
function requestVisit(id) {
    if (!currentUserEmail) {
        alert("Connectez-vous pour demander une visite !");
        openAuth();
        return;
    }
    const user = db.getUserByEmail(currentUserEmail);
    const date = prompt("À quelle date souhaiteriez-vous visiter ? (ex: Demain à 15h)");
    if (!date) return;

    db.addVisitRequest(id, {
        userName: user.name,
        userPhone: user.phone,
        userEmail: currentUserEmail,
        preferredDate: date
    });

    // Envoyer une notification au propriétaire
    const log = db.getLogements().find(l => l.id === id);
    if (log && log.ownerEmail) {
        addNotificationWithSound(log.ownerEmail, {
            text: `Nouvelle demande de visite de ${user.name} pour "${log.titre}" le ${date}`,
            type: 'visit'
        });
    }

    alert("Votre demande de visite a été envoyée au propriétaire ! Il vous contactera bientôt.");
}

function viewVisitRequests(id) {
    const log = db.getLogements().find(l => l.id === id);
    if (!log || !log.visitRequests) {
        alert("Aucune demande de visite pour le moment.");
        return;
    }

    const requests = log.visitRequests.map(r => {
        const u = db.getUserByEmail(r.userEmail);
        const pic = (u && u.profilePic) ? u.profilePic : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=6366f1&color=fff`;
        return `
        <div style="background: var(--light); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border-left: 5px solid var(--primary); display: flex; align-items: center; gap: 15px;">
            <img src="${pic}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1;">
                <strong>${r.userName}</strong><br>
                📅 Prévu: ${r.preferredDate}<br>
                📞 <a href="tel:${r.userPhone}">${r.userPhone}</a>
            </div>
            <button onclick="handleAcceptVisit(${id}, '${r.userEmail}')" 
                    style="background: #22c55e; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Accepter
            </button>
        </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Demandes de Visite - ${log.titre}</h3>
            <div style="margin-top: 1.5rem;">${requests}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleAcceptVisit(logementId, userEmail) {
    if (confirm("Voulez-vous accepter cet étudiant dans ce logement ? Cela marquera le logement comme occupé et fixera le loyer initial.")) {
        db.occuperLogement(userEmail, logementId);
        db.cancelVisitRequest(logementId, userEmail); // Retirer la demande une fois acceptée

        const log = db.getLogements().find(l => l.id === logementId);
        db.addNotification(userEmail, {
            text: `Votre demande pour "${log.titre}" a été acceptée ! Bienvenue chez vous.`,
            type: 'visit'
        });

        alert("Étudiant installé avec succès !");

        // Fermer le modal
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();

        // Rafraîchir le dashboard sans recharger toute la page
        showOwnerDashboard();
    }
}

// --- GALERIE PHOTO (SIMULATION) ---
function openGallery(id) {
    const log = db.getLogements().find(l => l.id === id);
    const images = [log.image]; // On simule une galerie avec l'image principale

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gallery-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 95%; background: var(--dark);">
            <span class="close-modal" style="color: white;" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                <img src="${log.image}" style="width: 100%; border-radius: 15px; border: 2px solid white;">
                <p style="color: white; font-weight: bold;">${log.titre}</p>
                <div style="display: flex; gap: 10px;">
                     <img src="${log.image}" style="width: 60px; height: 60px; border-radius: 10px; border: 2px solid var(--primary); opacity: 0.5;">
                     <div style="width: 60px; height: 60px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white;">+</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- REÇU DE PAIEMENT ---
function downloadReceipt(id, montant, date, studentName, logTitle) {
    const safeName = escapeHTML(studentName);
    const safeTitle = escapeHTML(logTitle);
    const receiptHTML = `
        <html>
        <head>
            <title>Reçu CampusHome</title>
            <style>
                body { font-family: sans-serif; padding: 40px; }
                .receipt { border: 2px solid #6366f1; padding: 30px; border-radius: 20px; max-width: 500px; margin: auto; }
                .header { text-align: center; color: #6366f1; margin-bottom: 20px; }
                .detail { margin: 10px 0; font-size: 1.2rem; }
                .footer { text-align: center; margin-top: 30px; font-size: 0.8rem; color: #64748b; }
                .btn-print { display: block; width: 100%; background: #6366f1; color: white; border: none; padding: 10px; margin-top: 20px; border-radius: 5px; cursor: pointer; }
                @media print { .btn-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h1>REÇU DE LOYER</h1>
                    <p>CampusHome - Labé</p>
                </div>
                <div class="detail"><strong>Étudiant :</strong> ${safeName}</div>
                <div class="detail"><strong>Logement :</strong> ${safeTitle}</div>
                <div class="detail"><strong>Montant :</strong> ${montant.toLocaleString()} GNF</div>
                <div class="detail"><strong>Date :</strong> ${date}</div>
                <div class="detail"><strong>Statut :</strong> ✅ Confirmé</div>
                
                <hr style="margin: 20px 0; opacity: 0.2;">
                
                <div class="footer">
                    Généré automatiquement par CampusHome le ${new Date().toLocaleDateString()}<br>
                    Merci de votre confiance.
                </div>
                <button class="btn-print" onclick="window.print()">Imprimer / Sauvegarder PDF</button>
            </div>
        </body>
        </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(receiptHTML);
        win.document.close();
    }
}

// --- GESTION NOTIFICATIONS ---
function toggleNotifs() {
    document.getElementById('notif-dropdown').classList.toggle('hidden');
    if (!document.getElementById('notif-dropdown').classList.contains('hidden')) {
        db.markNotifsAsRead(currentUserEmail);
        loadNotifs();
    }
}

function loadNotifs() {
    if (!currentUserEmail) return;
    const user = db.getUserByEmail(currentUserEmail);
    const notifs = user.notifications || [];
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');

    const unread = notifs.filter(n => !n.read).length;
    if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    if (notifs.length === 0) {
        list.innerHTML = '<p style="text-align: center; font-size: 0.8rem; color: var(--gray);">Aucune notification.</p>';
        return;
    }

    list.innerHTML = notifs.map((n, idx) => `
        <div style="padding: 10px; border-radius: 10px; background: ${n.read ? 'transparent' : 'rgba(99,102,241,0.1)'}; border-left: 3px solid ${n.type === 'visit' ? '#f59e0b' : '#6366f1'}; position: relative;">
            <div style="font-size: 0.85rem; font-weight: ${n.read ? '400' : '700'}; color: var(--dark);">${escapeHTML(n.text)}</div>
            <div style="font-size: 0.7rem; color: var(--gray); margin-top: 3px;">${escapeHTML(n.date)}</div>
            <button onclick="handleDeleteNotification(${idx})" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem;">
                <ion-icon name="close-circle-outline"></ion-icon>
            </button>
        </div>
    `).join('');
}

function handleDeleteNotification(idx) {
    if (confirm("Supprimer cette notification ?")) {
        db.deleteNotification(currentUserEmail, idx);
        loadNotifs();
    }
}

function markAllAsRead() {
    db.markNotifsAsRead(currentUserEmail);
    loadNotifs();
}

// --- TRADUCTION ---
let currentLang = 'FR';
const translations = {
    'FR': {
        'accueil': 'Accueil',
        'find': 'Trouver',
        'owners': 'Propriétaires',
        'hero_h1': 'Trouvez votre logement idéal à Labé.',
        'hero_p': 'La plateforme officielle pour les étudiants de l\'Université de Labé.',
        'login': 'Se Connecter',
        'signup': 'S\'inscrire',
        'filter_all': 'Tous les quartiers',
        'filter_price': 'Budget Max',
        'filter_type': 'Type de logement',
        'btn_search': 'Rechercher',
        'my_favs': 'Mes Favoris',
        'my_reqs': 'Mes Demandes',
        'my_pays': 'Mes Paiements',
        'contact': 'Contacter',
        'details': 'Détails',
        'auth_title': 'Bienvenue sur CampusHome',
        'auth_p': 'Connectez-vous pour louer ou gérer vos logements.',
        'dir': 'ltr'
    },
    'PL': {
        'accueil': 'Galle',
        'find': 'Hebbinde',
        'owners': 'Marɓe galleeji',
        'hero_h1': 'Heɓu galle ma moyyo e nder Labé.',
        'hero_p': 'Lowre laawɗunde wonande almuuɓe duɗal jaaɓi-haaɗtirde Labé.',
        'login': 'Seede',
        'signup': 'Winnditade',
        'filter_all': 'Dureeji fof',
        'filter_price': 'Mbeelu jawdi',
        'filter_type': 'No galle waʼi',
        'btn_search': 'Dabbude',
        'my_favs': 'Ko njiɗmi',
        'my_reqs': 'Ɓate am',
        'my_pays': 'Njoɓdi am',
        'contact': 'Haldude',
        'details': 'Faamude',
        'auth_title': 'Bismilla e CampusHome',
        'auth_p': 'Seede ngam heɓde galle walla feewnude ɗum.',
        'dir': 'ltr'
    },
    'EN': {
        'accueil': 'Home',
        'find': 'Find',
        'owners': 'Owners',
        'hero_h1': 'Find your ideal housing in Labé.',
        'hero_p': 'The official platform for students of the University of Labé.',
        'login': 'Login',
        'signup': 'Sign Up',
        'filter_all': 'All Districts',
        'filter_price': 'Max Budget',
        'filter_type': 'Housing Type',
        'btn_search': 'Search Now',
        'my_favs': 'Favorites',
        'my_reqs': 'Visit Requests',
        'my_pays': 'Payments',
        'contact': 'Contact',
        'details': 'Details',
        'auth_title': 'Welcome to CampusHome',
        'auth_p': 'Login to rent or manage your properties.',
        'dir': 'ltr'
    },
    'AR': {
        'accueil': 'الرئيسية',
        'find': 'بحث',
        'owners': 'الملاك',
        'hero_h1': 'اعثر على سكنك المثالي في لابي.',
        'hero_p': 'المنصة الرسمية لطلاب جامعة لابي.',
        'login': 'تسجيل الدخول',
        'signup': 'إنشاء حساب',
        'filter_all': 'كل الأحياء',
        'filter_price': 'الميزانية القصوى',
        'filter_type': 'نوع السكن',
        'btn_search': 'بحث الآن',
        'my_favs': 'المفضلة',
        'my_reqs': 'طلبات الزيارة',
        'my_pays': 'المدفوعات',
        'contact': 'اتصال',
        'details': 'تفاصيل',
        'auth_title': 'مرحباً بكم في CampusHome',
        'auth_p': 'سجل الدخول لاستئجار أو إدارة عقاراتك.',
        'dir': 'rtl'
    }
};

function toggleLang() {
    const langs = ['FR', 'PL', 'EN', 'AR'];
    let idx = langs.indexOf(currentLang);
    currentLang = langs[(idx + 1) % langs.length];
    document.getElementById('lang-btn').textContent = currentLang;
    updateTranslations();
}

function updateTranslations() {
    const t = translations[currentLang];
    document.documentElement.dir = t.dir;
    document.documentElement.lang = currentLang.toLowerCase();

    // Elements à traduire par sélecteur
    const setT = (sel, txt) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = txt;
    };

    setT('.nav-links a[href="#accueil"]', t.accueil);
    setT('.nav-links a[href="#logements"]', t.find);
    setT('.nav-links a[onclick*="signup"]', t.owners);
    setT('#auth-title', t.auth_title);
    setT('#auth-p', t.auth_p);
    setT('#btn-login-submit', t.login);
    setT('#btn-signup-link', t.signup);
    setT('.btn-search', t.btn_search);

    // Dashboard titles & stats
    setT('#owner-dashboard h2', currentUser === 'owner' ? (currentLang === 'PL' ? 'Espace Marɗo galle' : (currentLang === 'AR' ? 'لوحة المالك' : 'Tableau de bord Propriétaire')) : '');
    setT('#student-dashboard h2', currentUser === 'student' ? (currentLang === 'PL' ? 'Espace Almuuɗo' : (currentLang === 'AR' ? 'لوحة الطالب' : 'Mon Espace Étudiant')) : '');

    // Placeholders
    const filterAll = document.querySelector('#filter-quartier option[value=""]');
    if (filterAll) filterAll.textContent = t.filter_all;

    const heroH1 = document.querySelector('.hero h1');
    if (heroH1) heroH1.innerHTML = t.hero_h1.replace('Labé', '<span class="highlight">Labé</span>').replace('لابي', '<span class="highlight">لابي</span>');
    const heroP = document.querySelector('.hero p');
    if (heroP) heroP.textContent = t.hero_p;
}

// --- MOBILE NAVIGATION LOGIC ---
function handleMobileProfileClick() {
    if (!currentUser) {
        openAuth();
    } else {
        if (currentUser === 'owner') {
            showOwnerDashboard();
        } else {
            showStudentDashboard();
        }
    }
    updateBottomNav('mobile-profile-item');
}

function updateBottomNav(activeId) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === activeId || (activeId === 'home' && item.getAttribute('href') === '#accueil')) {
            item.classList.add('active');
        }
    });

    // Auto-active based on href if no ID
    if (!activeId) {
        const hash = window.location.hash || '#accueil';
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            }
        });
    }
}

// --- SYSTÈME DE DÉPART ET AVIS ---
let departureLogId = null;
let activeRating = 0;

function handleCancelRental() {
    const user = db.getUserByEmail(currentUserEmail);
    if (!user || !user.currentLogementId) return;

    departureLogId = user.currentLogementId;
    activeRating = 0;

    // Reset stars
    const stars = document.querySelectorAll('#review-departure-modal .star-btn');
    stars.forEach(s => s.name = 'star-outline');
    document.getElementById('review-text').value = "";

    // Ouvrir la modale d'avis
    document.getElementById('review-departure-modal').classList.remove('hidden');
}

function setRating(val) {
    activeRating = val;
    const stars = document.querySelectorAll('#review-departure-modal .star-btn');
    stars.forEach(s => {
        const starVal = parseInt(s.getAttribute('data-val'));
        s.name = starVal <= val ? 'star' : 'star-outline';
    });
}

function skipReview() {
    document.getElementById('review-departure-modal').classList.add('hidden');
    confirmDeparture();
}

function submitFinalReview() {
    const text = document.getElementById('review-text').value;
    const user = db.getUserByEmail(currentUserEmail);

    if (activeRating === 0) {
        alert("Veuillez sélectionner une note.");
        return;
    }

    db.addReview(departureLogId, {
        author: escapeHTML(user.name),
        text: escapeHTML(text) || "Super logement !",
        rating: activeRating
    });

    document.getElementById('review-departure-modal').classList.add('hidden');
    confirmDeparture();
}

function confirmDeparture() {
    db.quitterLogement(currentUserEmail);
    showStudentView();
    alert("Départ validé. Merci d'avoir utilisé CampusHome !");
}

// Global exposure
window.handleCancelRental = handleCancelRental;
window.setRating = setRating;
window.skipReview = skipReview;
window.submitFinalReview = submitFinalReview;

// --- GESTION DES DOCUMENTS ---
function renderStudentDocs() {
    const container = document.getElementById('student-docs-container');
    const user = db.getUserByEmail(currentUserEmail);
    const docs = user.documents || [];

    if (docs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; color: var(--gray);">
                <ion-icon name="document-attach-outline" style="font-size: 3rem; opacity: 0.2;"></ion-icon>
                <p style="margin-top: 1rem; font-weight: 600;">Aucun document ajouté.</p>
                <p style="font-size: 0.8rem;">Ajoutez vos justificatifs ci-dessus.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = docs.map(d => {
        const iconName = d.type === 'contract' ? 'key-outline' : (d.type === 'student_card' ? 'school-outline' : 'document-text-outline');
        const iconColor = d.type === 'contract' ? '#6366f1' : (d.type === 'student_card' ? '#10b981' : '#64748b');

        return `
        <div class="glass-panel history-item" style="padding: 1rem; border-radius: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="background: ${iconColor}15; color: ${iconColor}; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <ion-icon name="${iconName}" style="font-size: 1.5rem;"></ion-icon>
                </div>
                <div>
                    <div style="font-weight: 800;">${d.name}</div>
                    <div style="font-size: 0.75rem; color: var(--gray);">Ajouté le ${d.date}</div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="viewDoc('${d.id}')" class="btn-sm" style="background: var(--light); color: var(--dark); border: 1px solid #ddd; padding: 8px 12px; border-radius: 8px; font-weight: 700;">Voir</button>
                <button onclick="deleteDoc(${d.id})" class="btn-sm" style="background: #fff1f2; color: #e11d48; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700;">Supprimer</button>
            </div>
        </div>
        `;
    }).join('');
}

function handleDocUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const name = document.getElementById('doc-name-input').value || file.name;
        const type = document.getElementById('doc-type-input').value;

        const reader = new FileReader();
        reader.onload = (e) => {
            db.addDocument(currentUserEmail, name, type, e.target.result);
            renderStudentDocs();
            document.getElementById('doc-name-input').value = "";
        };
        reader.readAsDataURL(file);
    }
}

function deleteDoc(id) {
    if (confirm("Supprimer ce document ?")) {
        db.deleteDocument(currentUserEmail, id);
        renderStudentDocs();
    }
}

window.viewDoc = function (id) {
    const user = db.getUserByEmail(currentUserEmail);
    if (!user || !user.documents) return;
    const doc = user.documents.find(d => d.id == id);
    if (doc) {
        const win = window.open();
        win.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
}

// --- MESSAGERIE INTERNE ---
let activeChatWith = null;

function renderMessaging() {
    const contactsList = document.getElementById('contacts-list');
    if (!contactsList) return;

    const user = db.getUserByEmail(currentUserEmail);
    const allUsers = db.getUsers();

    // Pour l'étudiant, on montre ses proprios ou les admins
    let contacts = allUsers.filter(u => (u.role === 'owner' || u.role === 'admin') && u.email !== currentUserEmail);

    contactsList.innerHTML = contacts.map(c => `
        <div onclick="selectContact('${c.email}')" class="contact-item ${activeChatWith === c.email ? 'active' : ''}" 
             style="padding: 10px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; margin-bottom: 5px; transition: background 0.2s; background: ${activeChatWith === c.email ? 'var(--light)' : 'transparent'}">
            <img src="${c.profilePic}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1; overflow: hidden;">
                <div style="font-weight: 700; font-size: 0.9rem; white-space: nowrap; text-overflow: ellipsis;">${escapeHTML(c.name)}</div>
                <div style="font-size: 0.7rem; color: var(--gray);">${c.role === 'owner' ? 'Propriétaire' : 'Support'}</div>
            </div>
        </div>
    `).join('');

    if (activeChatWith) {
        const chatMessages = document.getElementById('chat-messages');
        const messages = db.getMessages(currentUserEmail).filter(m => m.from === activeChatWith || m.to === activeChatWith);

        const chatHeader = document.getElementById('chat-header');
        const otherUser = db.getUserByEmail(activeChatWith);
        chatHeader.textContent = otherUser ? "Chat avec " + otherUser.name : "Chat";

        chatMessages.innerHTML = messages.map(m => `
            <div style="align-self: ${m.from === currentUserEmail ? 'flex-end' : 'flex-start'}; 
                        background: ${m.from === currentUserEmail ? 'var(--primary)' : '#f1f5f9'};
                        color: ${m.from === currentUserEmail ? 'white' : 'var(--dark)'};
                        padding: 10px 15px; border-radius: 15px; max-width: 80%; font-size: 0.9rem; position: relative;">
                ${escapeHTML(m.text)}
                <div style="font-size: 0.6rem; margin-top: 5px; opacity: 0.7; text-align: right;">${m.date.split(' ')[1]}</div>
            </div>
        `).join('');

        chatMessages.scrollTop = chatMessages.scrollHeight;

        document.getElementById('chat-text-input').disabled = false;
        document.getElementById('chat-send-btn').disabled = false;
    }
}

function selectContact(email) {
    activeChatWith = email;
    db.markMessagesAsRead(currentUserEmail, email);
    renderMessaging();
}

function handleSendMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('chat-text-input');
    const text = input.value.trim();
    if (text && activeChatWith) {
        db.sendMessage(currentUserEmail, activeChatWith, text);
        input.value = "";
        renderMessaging();
    }
}

// Global exposure
window.handleSendMessage = handleSendMessage;
window.handleDocUpload = handleDocUpload;
window.deleteDoc = deleteDoc;
window.selectContact = selectContact;
window.skipReview = skipReview;
window.submitFinalReview = submitFinalReview;
window.setRating = setRating;

// Init
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollReveal();
    // on attend que data.js soit chargé
    restoreSession();
    if (!currentUser) showStudentView();

    // Bottom Nav Activation on scroll/click
    window.addEventListener('hashchange', () => updateBottomNav());

    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('ion-icon');
            if (icon) {
                icon.name = navLinks.classList.contains('active') ? 'close-outline' : 'menu-outline';
            }
        });
    }

    if (navLinks) {
        navLinks.querySelectorAll('a, button').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (nav && window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else if (nav) {
            nav.classList.remove('scrolled');
        }
    });

    // Fermer les notifs si on clique ailleurs
    document.addEventListener('click', (e) => {
        const drop = document.getElementById('notif-dropdown');
        const bell = document.getElementById('notif-bell');
        if (drop && !drop.contains(e.target) && !bell.contains(e.target)) {
            drop.classList.add('hidden');
        }
    });

    // PWA : Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker enregistré !', reg.scope))
                .catch(err => console.log('Échec de l\'enregistrement du Service Worker', err));
        });
    }

    // PWA : Bouton d'installation
    let deferredPrompt;
    const installWrapper = document.getElementById('install-btn-wrapper');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installWrapper) installWrapper.style.display = 'block';
    });

    window.installPWA = function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
            if (installWrapper) installWrapper.style.display = 'none';
        });
    };
});
