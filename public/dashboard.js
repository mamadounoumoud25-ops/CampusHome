// Dashboard logic for owners and students

async function showOwnerDashboard() {
    document.getElementById('accueil').style.display = 'none';
    document.getElementById('logements').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.getElementById('student-dashboard').classList.add('hidden');
    const dash = document.getElementById('owner-dashboard');
    dash.classList.remove('hidden');

    try {
        const ownerListings = await api.getLogementsByOwner(currentUserEmail);
        afficherLogements(ownerListings, 'owner-listings', true);
        
        const statsContainer = document.querySelector('#owner-dashboard .stats-grid') || document.querySelector('#owner-dashboard > .container > div:nth-child(2)');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="financial-card glass-panel" style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: space-around; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
                    <div style="text-align: center;">
                        <div style="opacity: 0.8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Annonces</div>
                        <div style="font-size: 2rem; font-weight: 800; margin-top: 5px;">${ownerListings.length}</div>
                    </div>
                </div>
            `;
        }

        const user = await api.getUser(currentUserEmail);
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
    } catch (e) {
        console.error(e);
    }
}

async function showStudentDashboard() {
    document.getElementById('accueil').style.display = 'none';
    document.getElementById('logements').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.getElementById('owner-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');

    try {
        const user = await api.getUser(currentUserEmail);
        if (user) {
            const header = document.querySelector('#student-dashboard h2');
            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${user.profilePic || ''}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">
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
                const logements = await api.getLogements();
                const log = logements.find(l => l.id === user.currentLogementId);
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
    } catch (e) {
        console.error(e);
    }

    switchStudentDashboardTab('favs');
}

function showStudentView() {
    document.getElementById('owner-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
    if (document.getElementById('accueil')) document.getElementById('accueil').style.display = 'block';
    if (document.getElementById('logements')) document.getElementById('logements').style.display = 'block';
    if (document.querySelector('.features')) document.querySelector('.features').style.display = 'grid';

    api.getLogements().then(logements => {
        afficherLogements(logements.filter(l => l.disponible), 'listings-container', false);
    }).catch(console.error);
}
