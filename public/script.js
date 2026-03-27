// Main entry point for CampusHome

let currentUser = null; 
let currentUserEmail = null; 

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    if (typeof initScrollReveal === 'function') initScrollReveal();
    
    await restoreSession();
    showStudentView();
    
    // Charger les logements initiaux si on est sur la vue publique
    if (!currentUser || currentUser === 'student') {
        try {
            const logements = await api.getLogements();
            afficherLogements(logements.filter(l => l.disponible));
        } catch (e) {
            console.error("Erreur chargement logements:", e);
        }
    }

    // Event Listeners
    window.addEventListener('hashchange', () => updateBottomNav());

    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('ion-icon');
            if (icon) icon.name = navLinks.classList.contains('active') ? 'close-outline' : 'menu-outline';
        });
        navLinks.querySelectorAll('a, button').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (nav && window.scrollY > 50) nav.classList.add('scrolled');
        else if (nav) nav.classList.remove('scrolled');
    });

    document.addEventListener('click', (e) => {
        const drop = document.getElementById('notif-dropdown');
        const bell = document.getElementById('notif-bell');
        if (drop && !drop.contains(e.target) && !bell.contains(e.target)) {
            drop.classList.add('hidden');
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker enregistré !', reg.scope))
                .catch(err => console.log('Échec registration SW', err));
        });
    }
});

async function updateUI() {
    const authBtn = document.getElementById('auth-btn');
    const notifWrapper = document.getElementById('notif-wrapper');
    const propLink = document.querySelector('.nav-links a[href="#"][onclick*="switchAuthTab(\'signup\')"]');
    
    if (currentUserEmail) {
        try {
            const user = await api.getUser(currentUserEmail);
            if (propLink) propLink.style.display = 'none';

            if (authBtn) {
                const pic = user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
                authBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${pic}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                        ${currentUser === 'owner' ? 'Espace Proprio' : 'Mon Compte'}
                    </div>
                `;
                authBtn.onclick = currentUser === 'owner' ? showOwnerDashboard : showStudentDashboard;
            }
            if (notifWrapper) notifWrapper.style.display = 'block';
            if (typeof loadNotifs === 'function') loadNotifs();
        } catch (e) {
            console.error(e);
        }
    } else {
        if (propLink) propLink.style.display = 'inline-block';
        if (authBtn) {
            authBtn.textContent = 'Connexion';
            authBtn.onclick = openAuth;
        }
        if (notifWrapper) notifWrapper.style.display = 'none';
    }
}

// Global exposure for HTML onclick handlers
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleRecoveryVerify = handleRecoveryVerify;
window.handlePasswordReset = handlePasswordReset;
window.logout = logout;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.switchAuthTab = switchAuthTab;
window.openRecovery = openRecovery;
window.closeRecovery = closeRecovery;

window.showOwnerDashboard = showOwnerDashboard;
window.showStudentDashboard = showStudentDashboard;
window.showStudentView = showStudentView;

window.handleSmartSearch = handleSmartSearch;
window.handlePriceSlider = handlePriceSlider;
window.filtrerLogements = filtrerLogements;
window.filterTag = filterTag;
window.dbLocationFilter = dbLocationFilter;
window.toggleNotifs = toggleNotifs;
window.handleDeleteNotification = handleDeleteNotification;
window.markAllAsRead = markAllAsRead;
window.handleMobileProfileClick = handleMobileProfileClick;

window.handleDocUpload = handleDocUpload;
window.deleteDoc = deleteDoc;
window.selectContact = selectContact;
window.handleSendMessage = handleSendMessage;
window.toggleTheme = toggleTheme;

function openRecovery() {
    closeAuth();
    document.getElementById('recovery-modal').classList.remove('hidden');
    document.getElementById('recovery-step-1').classList.remove('hidden');
    document.getElementById('recovery-step-2').classList.add('hidden');
}

function closeRecovery() {
    document.getElementById('recovery-modal').classList.add('hidden');
}
