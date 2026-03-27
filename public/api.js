const API_URL = ''; // Same origin

const api = {
    async fetch(endpoint, options = {}) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'API Error');
        }
        return res.json();
    },

    async login(email, password) {
        return this.fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async signup(data) {
        return this.fetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getLogements() {
        return this.fetch('/api/logements');
    },

    async getLogementsByOwner(email) {
        return this.fetch(`/api/logements/owner/${email}`);
    },

    async getUser(email) {
        return this.fetch(`/api/users/${email}`);
    },

    async updateProfile(data) {
        return this.fetch('/api/users/update', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async toggleFavori(email, logementId) {
        return this.fetch('/api/favorites/toggle', {
            method: 'POST',
            body: JSON.stringify({ email, logementId })
        });
    },

    async getFavoris(email) {
        return this.fetch(`/api/favorites/${email}`);
    },

    async requestVisit(logementId, userEmail, preferredDate) {
        return this.fetch('/api/visits/request', {
            method: 'POST',
            body: JSON.stringify({ logementId, userEmail, preferredDate })
        });
    },

    async deleteVisitRequest(logementId, userEmail) {
        return this.fetch('/api/visits/request', {
            method: 'DELETE',
            body: JSON.stringify({ logementId, userEmail })
        });
    },

    async postLogement(data) {
        return this.fetch('/api/logements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getMessages(email) {
        return this.fetch(`/api/messages/${email}`);
    },

    async sendMessage(from, to, text) {
        return this.fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ from, to, text })
        });
    },

    async getSupport() {
        return this.fetch('/api/support');
    },

    async getStudents() {
        return this.fetch('/api/users/students');
    },

    async getStudentsByOwner(email) {
        return this.fetch(`/api/users/students/owner/${email}`);
    },

    async addPayment(data) {
        return this.fetch('/api/users/payment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async setLoyer(studentEmail, montant) {
        return this.fetch('/api/users/loyer', {
            method: 'POST',
            body: JSON.stringify({ studentEmail, montant })
        });
    },

    async quitterLogement(studentEmail) {
        return this.fetch('/api/users/leave', {
            method: 'POST',
            body: JSON.stringify({ studentEmail })
        });
    }
};
