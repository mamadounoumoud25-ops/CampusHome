// Feature-specific logic for CampusHome (Search, Filters, Notifs, etc.)

// --- RECHERCHE ET FILTRES ---
async function handleSmartSearch() {
    const query = document.getElementById('smart-search').value.toLowerCase().trim();
    if (query === "") {
        filtrerLogements();
        return;
    }
    try {
        let filtered = await api.getLogements();
        filtered = filtered.filter(l => l.disponible && (
            l.titre.toLowerCase().includes(query) ||
            l.quartier.toLowerCase().includes(query) ||
            l.type.toLowerCase().includes(query)
        ));
        afficherLogements(filtered);
    } catch (e) {
        console.error(e);
    }
}

async function handlePriceSlider() {
    const slider = document.getElementById('price-slider');
    const display = document.getElementById('price-display');
    const val = parseInt(slider.value);

    if (val >= 2000000) display.textContent = "Illimité";
    else display.textContent = formatPrix(val);
    
    filtrerLogements();
}

async function filtrerLogements() {
    const query = document.getElementById('smart-search') ? document.getElementById('smart-search').value.toLowerCase().trim() : "";
    const maxPrice = document.getElementById('price-slider') ? parseInt(document.getElementById('price-slider').value) : 2000000;

    try {
        let filtered = await api.getLogements();
        filtered = filtered.filter(l => l.disponible);

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
    } catch (e) {
        console.error(e);
    }
}

async function filterTag(type) {
    document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        if (event.target.classList.contains('tag')) event.target.classList.add('active');
        else if (event.target.parentElement.classList.contains('tag')) event.target.parentElement.classList.add('active');
    }

    try {
        let filtered = await api.getLogements();
        filtered = filtered.filter(l => l.disponible);
        if (type !== 'all') {
            filtered = filtered.filter(l => l.type === type);
        }
        afficherLogements(filtered);
    } catch (e) {
        console.error(e);
    }
}

async function dbLocationFilter(location) {
    try {
        let filtered = await api.getLogements();
        filtered = filtered.filter(l => l.disponible && l.quartier === location);
        afficherLogements(filtered);
        document.getElementById('logements').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error(e);
    }
}

// --- GESTION DES NOTIFICATIONS ---
async function toggleNotifs() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
        try {
            await api.markNotifsAsRead(currentUserEmail);
            await loadNotifs();
        } catch (e) {
            console.error(e);
        }
    }
}

async function loadNotifs() {
    if (!currentUserEmail) return;
    try {
        const user = await api.getUser(currentUserEmail);
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

        if (!list) return;

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
    } catch (e) {
        console.error(e);
    }
}

async function handleDeleteNotification(idx) {
    if (confirm("Supprimer cette notification ?")) {
        try {
            await api.deleteNotification(currentUserEmail, idx);
            await loadNotifs();
        } catch (e) {
            console.error(e);
        }
    }
}

async function markAllAsRead() {
    try {
        await api.markNotifsAsRead(currentUserEmail);
        await loadNotifs();
    } catch (e) {
        console.error(e);
    }
}

// --- GESTION DES DOCUMENTS ---
async function renderStudentDocs() {
    const container = document.getElementById('student-docs-container');
    if (!container) return;
    
    try {
        const user = await api.getUser(currentUserEmail);
        const docs = user.documents || [];

        if (docs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; color: var(--gray);">
                    <ion-icon name="document-attach-outline" style="font-size: 3rem; opacity: 0.2;"></ion-icon>
                    <p style="margin-top: 1rem; font-weight: 600;">Aucun document ajouté.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = docs.map(d => `
            <div class="glass-panel history-item" style="padding: 1rem; border-radius: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <ion-icon name="document-text-outline" style="font-size: 1.5rem; color: var(--primary);"></ion-icon>
                    <div>
                        <div style="font-weight: 800;">${d.name}</div>
                        <div style="font-size: 0.75rem; color: var(--gray);">Ajouté le ${d.date}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewDoc('${d.id}')" class="btn-sm">Voir</button>
                    <button onclick="deleteDoc(${d.id})" class="btn-sm" style="color: #e11d48;">Supprimer</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function handleDocUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const name = document.getElementById('doc-name-input').value || file.name;
        const type = document.getElementById('doc-type-input').value;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await api.addDocument(currentUserEmail, name, type, e.target.result);
                await renderStudentDocs();
                document.getElementById('doc-name-input').value = "";
            } catch (err) {
                console.error(err);
            }
        };
        reader.readAsDataURL(file);
    }
}

async function deleteDoc(id) {
    if (confirm("Supprimer ce document ?")) {
        try {
            await api.deleteDocument(currentUserEmail, id);
            await renderStudentDocs();
        } catch (e) {
            console.error(e);
        }
    }
}

// --- MESSAGERIE ---
let activeChatWith = null;

async function renderMessaging() {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    try {
        const logements = await api.getLogements();
        const owners = [...new Set(logements.map(l => l.ownerEmail))];
        
        let html = '';
        for(let email of owners) {
            if (email !== currentUserEmail) {
                const u = await api.getUser(email);
                html += `
                    <div onclick="selectContact('${u.email}')" class="contact-item ${activeChatWith === u.email ? 'active' : ''}">
                        <div style="font-weight: 700;">${escapeHTML(u.name)}</div>
                        <div style="font-size: 0.7rem; color: var(--gray);">Propriétaire</div>
                    </div>
                `;
            }
        }
        list.innerHTML = html;
        document.getElementById('chat-text-input').disabled = !activeChatWith;
        document.getElementById('chat-send-btn').disabled = !activeChatWith;
    } catch (e) {
        console.error(e);
    }
}

function selectContact(email) {
    activeChatWith = email;
    renderMessaging();
    // Load chat history here if needed
}

async function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-text-input');
    const text = input.value.trim();
    if (text && activeChatWith) {
        try {
            await api.sendMessage(currentUserEmail, activeChatWith, text);
            input.value = '';
            // Refresh or push to UI
        } catch (e) {
            console.error(e);
        }
    }
}

// Bottom Nav Mobile
function updateBottomNav(activeId) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === activeId || item.getAttribute('href') === (window.location.hash || '#accueil')) {
            item.classList.add('active');
        }
    });
}

// --- LOGEMENTS ACTIONS ---
async function toggleStatus(id) {
    try {
        const logs = await api.getLogements();
        const log = logs.find(l => l.id === id);
        if (log) {
            await api.updateLogement(id, { disponible: !log.disponible });
            showOwnerDashboard();
        }
    } catch (e) {
        console.error(e);
    }
}

async function deleteLogement(id) {
    if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
        try {
            await api.deleteLogement(id);
            showOwnerDashboard();
        } catch (e) {
            console.error(e);
        }
    }
}

async function handleToggleFavori(event, id) {
    if (event) event.stopPropagation();
    if (!currentUserEmail) {
        openAuth();
        return;
    }
    try {
        const res = await api.toggleFavori(currentUserEmail, id);
        // Refresh UI
        if (typeof renderStudentFavs === 'function') renderStudentFavs();
        // Optional: toast notification
    } catch (e) {
        console.error(e);
    }
}

function contacterProprietaire(id) {
    api.getLogements().then(logs => {
        const log = logs.find(l => l.id === id);
        if (log) {
            api.getUser(log.ownerEmail).then(owner => {
                const info = document.getElementById('owner-contact-info');
                info.innerHTML = `
                    <p style="font-weight: 800; font-size: 1.2rem; margin-bottom: 1rem;">${escapeHTML(owner.name)}</p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <a href="tel:${owner.phone}" class="btn-primary" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <ion-icon name="call-outline"></ion-icon> Appeler (${owner.phone})
                        </a>
                        <a href="https://wa.me/${owner.phone.replace(/\s/g, '')}" class="btn-secondary" style="text-decoration: none; background: #22c55e; color: white; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <ion-icon name="logo-whatsapp"></ion-icon> WhatsApp
                        </a>
                    </div>
                `;
                document.getElementById('contact-owner-modal').classList.remove('hidden');
            });
        }
    });
}

async function requestVisit(id) {
    if (!currentUserEmail) {
        openAuth();
        return;
    }
    const date = prompt("Quelle date de visite préférez-vous ? (ex: 15 Mars à 10h)");
    if (date) {
        try {
            await api.requestVisit(id, currentUserEmail, date);
            alert("Votre demande de visite a été envoyée au propriétaire !");
        } catch (e) {
            alert("Erreur: " + e.message);
        }
    }
}

function openGallery(id) {
    api.getLogements().then(logs => {
        const log = logs.find(l => l.id === id);
        if (log) {
            // Logic for gallery modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.style.zIndex = '2000';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; width: 95%; background: var(--dark);">
                    <span class="close-modal" style="color: white;" onclick="this.parentElement.parentElement.remove()">&times;</span>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <img src="${log.image}" style="width: 100%; border-radius: 15px; border: 2px solid white;">
                        <p style="color: white; font-weight: bold;">${log.titre}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    });
}

function openReviewsModal(id) {
    api.getLogements().then(logs => {
        const log = logs.find(l => l.id === id);
        if (log) {
            const reviews = log.reviews || [];
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
                    <h3>Avis pour ${escapeHTML(log.titre)}</h3>
                    <div style="margin-top: 1rem; max-height: 400px; overflow-y: auto;">
                        ${reviews.length === 0 ? '<p>Aucun avis pour le moment.</p>' : reviews.map(r => `
                            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>${escapeHTML(r.author)}</strong>
                                    <span style="color: #f59e0b;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                                </div>
                                <p style="font-size: 0.9rem; margin-top: 5px;">${escapeHTML(r.text)}</p>
                                <small style="color: #94a3b8;">${r.date}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    });
}

function partagerWhatsApp(id) {
    api.getLogements().then(logs => {
        const log = logs.find(l => l.id === id);
        if (log) {
            const text = `Regarde ce logement sur CampusHome : ${log.titre} à ${log.quartier} pour ${log.prix} GNF/mois.`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });
}

async function renderStudentFavs() {
    const container = document.getElementById('student-favs-container');
    if (!container) return;
    try {
        const favors = await api.getFavoris(currentUserEmail);
        if (favors.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--gray);">Aucun favori.</p>';
            return;
        }
        const logs = await api.getLogements();
        const favLogs = logs.filter(l => favors.includes(l.id));
        afficherLogements(favLogs, 'student-favs-container', false);
    } catch (e) {
        console.error(e);
    }
}

async function openEditProfile() {
    try {
        const user = await api.getUser(currentUserEmail);
        const name = prompt("Votre nouveau nom:", user.name);
        const phone = prompt("Votre nouveau numéro:", user.phone);
        if (name && phone) {
            await api.updateProfile({ email: currentUserEmail, name, phone });
            alert("Profil mis à jour !");
            location.reload();
        }
    } catch (e) {
        console.error(e);
    }
}

function switchStudentDashboardTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.dash-view').forEach(view => view.classList.add('hidden'));
    
    if (tab === 'favs') {
        document.getElementById('view-favs').classList.remove('hidden');
        renderStudentFavs();
    } else if (tab === 'docs') {
        document.getElementById('view-docs').classList.remove('hidden');
        renderStudentDocs();
    } else if (tab === 'messages') {
        document.getElementById('view-messages').classList.remove('hidden');
        renderMessaging();
    }
}

// Global exposure
Object.assign(window, {
    toggleStatus, deleteLogement, handleToggleFavori, contacterProprietaire, 
    requestVisit, openGallery, openReviewsModal, partagerWhatsApp,
    handleSmartSearch, handlePriceSlider, filtrerLogements, filterTag,
    dbLocationFilter, toggleNotifs, markAllAsRead, handleDeleteNotification,
    renderStudentDocs, handleDocUpload, deleteDoc, updateBottomNav, handleMobileProfileClick,
    selectContact, handleSendMessage, openEditProfile, switchStudentDashboardTab
});
