// Authentication handlers for CampusHome

async function handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const password = document.getElementById('login-pass').value;

    try {
        const data = await api.login(email, password);
        if (data.success) {
            currentUser = data.user.role;
            currentUserEmail = data.user.email;
            saveSession(currentUser, currentUserEmail);
            
            const closeBtn = document.querySelector('.close-modal');
            if (closeBtn) closeBtn.style.display = 'block';
            
            closeAuth();
            await updateUI();
            alert("Connexion réussie !");
            
            if (currentUser === 'owner') showOwnerDashboard();
            else showStudentDashboard();
        }
    } catch (err) {
        alert(err.message);
    }
}

async function handleSignup(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value.toLowerCase().trim();
    const pass = document.getElementById('signup-pass').value;
    const roleInput = document.querySelector('input[name="role"]:checked');
    const role = roleInput ? roleInput.value : 'student';
    const filiere = document.getElementById('signup-filiere') ? document.getElementById('signup-filiere').value : '';

    const profilePicPreview = document.getElementById('signup-pic-preview');
    const profilePic = (profilePicPreview && profilePicPreview.src && profilePicPreview.src.startsWith('data:image')) ? profilePicPreview.src : "";

    try {
        const data = await api.signup({ name, email, role, password: pass, filiere, phone, profilePic });
        if (data.success) {
            currentUser = role;
            currentUserEmail = email;
            saveSession(role, email);
            closeAuth();
            await updateUI();
            if (role === 'owner') showOwnerDashboard();
            else showStudentDashboard();
        }
    } catch (err) {
        alert(err.message);
    }
}

async function handleRecoveryVerify(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const phone = document.getElementById('recovery-phone').value;

    try {
        const user = await api.getUser(email);
        if (user && user.phone.trim() === phone.trim()) {
            document.getElementById('recovery-step-1').classList.add('hidden');
            document.getElementById('recovery-step-2').classList.remove('hidden');
        } else {
            alert("Les informations saisies ne correspondent à aucun compte.");
        }
    } catch (e) {
        alert("Une erreur est survenue lors de la vérification.");
    }
}

async function handlePasswordReset(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const phone = document.getElementById('recovery-phone').value;
    const newPass = document.getElementById('recovery-new-pass').value;

    try {
        await api.resetPassword(email, phone, newPass);
        alert("Mot de passe mis à jour avec succès ! Connectez-vous maintenant.");
        closeRecovery();
        openAuth();
    } catch (e) {
        alert("Erreur lors de la réinitialisation: " + e.message);
    }
}

async function restoreSession() {
    const role = localStorage.getItem('campus_current_role');
    const email = localStorage.getItem('campus_current_email');
    if (role && email) {
        try {
            const user = await api.getUser(email);
            if (user) {
                currentUser = user.role;
                currentUserEmail = user.email;
                await updateUI();
                
                if (currentUser === 'owner') showOwnerDashboard();
                else showStudentDashboard();
            }
        } catch (e) {
            localStorage.clear();
        }
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function openAuth() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuth() {
    if (!currentUser) return; 
    document.getElementById('auth-modal').classList.add('hidden');
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
