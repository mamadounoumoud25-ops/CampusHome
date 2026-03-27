// Utility functions for CampusHome

function formatPrix(prix) {
    if (prix === undefined || prix === null) return "0 GNF";
    return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " GNF";
}

function escapeHTML(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function saveSession(role, email) {
    localStorage.setItem('campus_current_role', role);
    localStorage.setItem('campus_current_email', email);
}

function initTheme() {
    const savedTheme = localStorage.getItem('campus_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.name = savedTheme === 'dark' ? 'sunny-outline' : 'moon-outline';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('campus_theme', newTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.name = newTheme === 'dark' ? 'sunny-outline' : 'moon-outline';
}
