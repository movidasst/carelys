// Conserva los enlaces compartidos antes de la navegación por páginas.
const oldSections = {
    '#sinopsis': '/libros/por-si-alguien-me-escucha/', '#trailer': '/trailer/',
    '#autora': '/autora/', '#lectores': '/lectores/', '#resenas': '/resenas/', '#aurea': '/aurea/'
};
function openLegacySection() {
    const destination = oldSections[location.hash];
    if (location.pathname === '/' && destination) location.replace(destination + location.search);
}
openLegacySection();
window.addEventListener('hashchange', openLegacySection);

document.querySelector('#play-trailer')?.addEventListener('click', event => {
    event.preventDefault();
    const player = document.createElement('iframe');
    player.src = 'https://www.youtube.com/embed/ciTFFUCd5X0?autoplay=1&playsinline=1&cc_load_policy=1';
    player.title = 'Tráiler de Por si alguien me escucha';
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    event.currentTarget.replaceWith(player);
    player.focus();
});

// Eventos de salida para el contenedor de analítica del dominio.
const destinations = [
    ['read.amazon.com', 'leer_muestra'], ['www.amazon.com', 'ver_libro_amazon'],
    ['/media/guia-de-lectura.pdf', 'descargar_guia'], ['www.whatsapp.com', 'abrir_canal']
];
const campaign = new URLSearchParams(location.search);
try {
    if (campaign.has('utm_source')) {
        sessionStorage.setItem('campana-lectura', JSON.stringify(Object.fromEntries(
            ['utm_source','utm_medium','utm_campaign'].map(key => [key, campaign.get(key)])
        )));
    }
} catch { /* Almacenamiento opcional. */ }
document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const match = destinations.find(([key]) => key === link.hostname || key === link.pathname);
    if (!match) return;
    let attribution = {};
    try { attribution = JSON.parse(sessionStorage.getItem('campana-lectura')) || {}; } catch { /* Opcional. */ }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event: match[1], pagina: location.pathname, ...attribution});
});
const cover = document.querySelector('#cover');
document.querySelector('#flip')?.addEventListener('click', event => {
    const showBack = cover.getAttribute('src') === '/media/cubierta.webp';
    cover.src = showBack ? '/media/contracubierta.webp' : '/media/cubierta.webp';
    cover.alt = showBack ? 'Contracubierta con la sinopsis de la novela' : 'Cubierta de Por si alguien me escucha';
    event.currentTarget.textContent = showBack ? 'Ver cubierta ↻' : 'Ver contracubierta ↻';
});
document.querySelector('#key-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const correct = ['8','ocho','eight'].includes(event.target.elements.clave.value.trim().toLowerCase());
    document.querySelector('#reward').hidden = !correct;
    document.querySelector('#key-state').textContent = correct ? 'Clave correcta. Has abierto AUREA.' : 'Esa clave no abre el portal. Puedes consultar la pista.';
});
const reviewUrl = 'https://script.google.com/macros/s/AKfycbzUMsQTqgP8jq6aIp1EHtHX1n7IKTX-e1_n2W5wI921eRvdVmxbP-l1C7RV1aZvkZXHyw/exec';
async function loadReviews() {
    const state = document.querySelector('#review-state');
    const retry = document.querySelector('#retry');
    retry.hidden = true;
    state.textContent = 'Cargando reseñas…';
    try {
        const response = await fetch(reviewUrl, {signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw Error();
        const rows = await response.json();
        if (!Array.isArray(rows)) throw Error();
        const reviews = rows.filter(row => row && typeof row.opinion === 'string' && row.opinion.trim());
        const container = document.querySelector('#reviews');
        for (const review of reviews) {
            const card = document.createElement('article');
            card.className = 'review';
            const opinion = document.createElement('p');
            opinion.textContent = review.opinion;
            const by = document.createElement('small');
            const rating = Number(review.valoracion);
            by.textContent = (review.nombre || 'Lector anónimo') + (Number.isInteger(rating) && rating >= 1 && rating <= 5 ? ' · ' + rating + '/5' : '');
            card.append(opinion, by);
            container.append(card);
        }
        state.textContent = reviews.length ? '' : 'Todavía no hay reseñas publicadas. ¿Ya leíste la novela?';
    } catch { retry.hidden = false; state.textContent = 'Las reseñas no están disponibles en este momento.'; }
}
if (document.querySelector('#reviews')) {
    loadReviews();
    document.querySelector('#retry').addEventListener('click', loadReviews);
}
document.querySelector('#review-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button');
    if (button.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    const state = document.querySelector('#send-state');
    data.nombre = data.nombre.trim();
    data.opinion = data.opinion.trim();
    if (!data.nombre || !data.opinion) { state.textContent = 'Escribe tu nombre y tu opinión.'; return; }
    data.valoracion = Number(data.valoracion);
    button.disabled = true;
    state.textContent = 'Enviando…';
    try {
        const response = await fetch(reviewUrl, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
        if (!response.ok) throw Error();
        const body = await response.text();
        if (/^\s*</.test(body)) throw Error();
        if (body.trim().startsWith('{')) {
            const result = JSON.parse(body);
            if (result.error || result.success === false || result.status === 'error') throw Error();
        }
        form.reset();
        state.textContent = 'Gracias. Tu reseña se ha enviado para revisión.';
    } catch { state.textContent = 'No pudimos confirmar el envío. Tu texto sigue aquí.'; }
    finally { button.disabled = false; }
});
