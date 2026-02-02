import {createClient} from 'https://cdn.skypack.dev/@sanity/client';
        
document.addEventListener('DOMContentLoaded', () => {
//configures sanity client
const client = createClient({
    projectId:'b93ftlvi',   //project id , copy paste from sanity.io
    dataset:'data_2026',    // name of data from sanity io
    apiVersion:'2026-01-14',
    useCdn: true
});
const offersGrid = document.querySelector('.offers-grid');
const modal = document.getElementById('pdfModal');
const pdfIframe = modal.querySelector('.pdf-iframe');
const closeModal = document.getElementById('closeModal');

// Fetch latest 3 offers from Sanity
async function loadOffers() {
    const query = `*[_type == "offer"] | order(_createdAt desc)[0..2]{
    title,
    description,
    expiryDate,
    "pdfUrl": pdf.asset->url,
    "thumbnail": thumbnail.asset->url
    }`;

    const offers = await client.fetch(query);

    offersGrid.innerHTML = offers.map(offer => `
    <div class="offer-card">
        <div class="offer-status status-active"><i class="fas fa-bolt"></i> Active Offer</div>
        <div class="offer-thumbnail">
        <img src="${offer.thumbnail}" alt="${offer.title}">
        </div>
        <div class="offer-content">
        <h3 class="offer-title">${offer.title}</h3>
        <p class="offer-desc">${offer.description}</p>
        <div class="offer-meta">
            <div class="offer-date">
            <span class="offer-date-label">Expires on:</span>
            <span class="offer-date-value">${new Date(offer.expiryDate).toLocaleDateString()}</span>
            </div>
            <div class="offer-actions">
            <button class="action-btn btn-preview" data-pdf-url="${offer.pdfUrl}">
                <i class="fas fa-eye"></i> Preview
        </button>
        </div>
    </div>
    </div>
    </div>
    `).join('');

    // Attach modal preview functionality
document.querySelectorAll('.btn-preview').forEach(button => {
    button.addEventListener('click', () => {
        pdfIframe.src = button.dataset.pdfUrl || '';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    });
}

// Close modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    }
});
loadOffers();
});