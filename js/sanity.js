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

const ALLOWED_URL_HOSTS = new Set([
    'cdn.sanity.io'
]);

function isAllowedUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'https:' && ALLOWED_URL_HOSTS.has(url.host);
    } catch {
        return false;
    }
}

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

    offersGrid.innerHTML = '';
    offers.forEach((offer) => {
        const card = document.createElement('div');
        card.className = 'offer-card';

        const status = document.createElement('div');
        status.className = 'offer-status status-active';
        status.innerHTML = '<i class="fas fa-bolt"></i> Active Offer';

        const thumbnailWrap = document.createElement('div');
        thumbnailWrap.className = 'offer-thumbnail';
        const thumbnail = document.createElement('img');
        if (isAllowedUrl(offer.thumbnail)) {
            thumbnail.src = offer.thumbnail;
        }
        thumbnail.alt = offer.title || 'Offer thumbnail';
        thumbnailWrap.appendChild(thumbnail);

        const content = document.createElement('div');
        content.className = 'offer-content';

        const title = document.createElement('h3');
        title.className = 'offer-title';
        title.textContent = offer.title || '';

        const desc = document.createElement('p');
        desc.className = 'offer-desc';
        desc.textContent = offer.description || '';

        const meta = document.createElement('div');
        meta.className = 'offer-meta';

        const dateWrap = document.createElement('div');
        dateWrap.className = 'offer-date';
        const dateLabel = document.createElement('span');
        dateLabel.className = 'offer-date-label';
        dateLabel.textContent = 'Expires on:';
        const dateValue = document.createElement('span');
        dateValue.className = 'offer-date-value';
        dateValue.textContent = offer.expiryDate
            ? new Date(offer.expiryDate).toLocaleDateString()
            : '';

        dateWrap.appendChild(dateLabel);
        dateWrap.appendChild(dateValue);

        const actions = document.createElement('div');
        actions.className = 'offer-actions';
        const previewButton = document.createElement('button');
        previewButton.className = 'action-btn btn-preview';
        previewButton.type = 'button';
        if (isAllowedUrl(offer.pdfUrl)) {
            previewButton.dataset.pdfUrl = offer.pdfUrl;
        }
        previewButton.innerHTML = '<i class="fas fa-eye"></i> Preview';
        actions.appendChild(previewButton);

        meta.appendChild(dateWrap);
        meta.appendChild(actions);

        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(meta);

        card.appendChild(status);
        card.appendChild(thumbnailWrap);
        card.appendChild(content);

        offersGrid.appendChild(card);
    });

    // Attach modal preview functionality
    document.querySelectorAll('.btn-preview').forEach((button) => {
        button.addEventListener('click', () => {
            const pdfUrl = button.dataset.pdfUrl || '';
            pdfIframe.src = isAllowedUrl(pdfUrl) ? pdfUrl : '';
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
