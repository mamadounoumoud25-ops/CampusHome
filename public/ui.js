// UI rendering functions for CampusHome

function generateCard(logement, isOwnerView = false) {
    const isFav = false; // Note: Favoris logic needs API update later
    const favIcon = isFav ? 'heart' : 'heart-outline';
    const favColor = isFav ? '#ef4444' : 'inherit';

    const statusBadge = logement.disponible
        ? `<span class="status-badge success">Disponible</span>`
        : `<span class="status-badge error">Loué</span>`;

    const reviews = logement.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "N/A";
    const ratingDisplay = `
        <div style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #f59e0b;">
            <ion-icon name="star"></ion-icon> ${avgRating} (${reviews.length})
        </div>
    `;

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

function afficherLogements(data, containerId = 'listings-container', isOwner = false) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = data.map(l => generateCard(l, isOwner)).join('');
            container.style.opacity = '1';
            container.style.transition = 'opacity 0.4s ease';
            if (typeof initScrollReveal === 'function') initScrollReveal();
        }, 50);
    }
}
