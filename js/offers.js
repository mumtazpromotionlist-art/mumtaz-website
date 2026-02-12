const DEFAULT_API_BASE = 'http://localhost:3001';
const API_BASE = window.CMS_API_BASE || DEFAULT_API_BASE;

document.addEventListener('DOMContentLoaded', () => {
  const offersGrid = document.querySelector('.offers-grid');
  const modal = document.getElementById('pdfModal');
  const pdfIframe = modal?.querySelector('.pdf-iframe');
  const closeModal = document.getElementById('closeModal');

  function isSafeAssetPath(pathValue) {
    return typeof pathValue === 'string' && pathValue.startsWith('/uploads/');
  }

  async function loadOffers() {
    try {
      const response = await fetch(`${API_BASE}/api/offers?limit=3`);
      if (!response.ok) throw new Error('Failed to fetch offers');

      const offers = await response.json();
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
        if (isSafeAssetPath(offer.thumbnailPath)) {
          thumbnail.src = `${API_BASE}${offer.thumbnailPath}`;
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
        dateLabel.textContent = 'Available:';
        const dateValue = document.createElement('span');
        dateValue.className = 'offer-date-value';
        if (offer.startAt || offer.endAt) {
          const start = offer.startAt ? new Date(offer.startAt).toLocaleString() : 'Now';
          const end = offer.endAt ? new Date(offer.endAt).toLocaleString() : 'Open';
          dateValue.textContent = `${start} - ${end}`;
        } else {
          dateValue.textContent = '';
        }

        dateWrap.appendChild(dateLabel);
        dateWrap.appendChild(dateValue);

        const actions = document.createElement('div');
        actions.className = 'offer-actions';
        const previewButton = document.createElement('button');
        previewButton.className = 'action-btn btn-preview';
        previewButton.type = 'button';
        if (isSafeAssetPath(offer.pdfPath)) {
          previewButton.dataset.pdfUrl = `${API_BASE}${offer.pdfPath}`;
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

      document.querySelectorAll('.btn-preview').forEach((button) => {
        button.addEventListener('click', () => {
          const pdfUrl = button.dataset.pdfUrl || '';
          if (pdfIframe) {
            pdfIframe.src = pdfUrl;
          }
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        });
      });
    } catch (err) {
      if (offersGrid) offersGrid.innerHTML = '';
    }
  }

  closeModal?.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (pdfIframe) pdfIframe.src = '';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (pdfIframe) pdfIframe.src = '';
    }
  });

  loadOffers();
});
