const menu = document.querySelector('#menu');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true')));
document.querySelector('#links').addEventListener('click', closeMenu);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
const cover = document.querySelector('#cover');
document.querySelector('#flip').addEventListener('click', event => {
    const showBack = cover.getAttribute('src') === 'media/cubierta.webp';
    cover.src = showBack ? 'media/contracubierta.webp' : 'media/cubierta.webp';
    cover.alt = showBack ? 'Contracubierta con la sinopsis de la novela' : 'Cubierta de Por si alguien me escucha';
    event.currentTarget.textContent = showBack ? 'Ver cubierta ↻' : 'Ver contracubierta ↻';
});
document.querySelector('#key-form').addEventListener('submit', event => {
    event.preventDefault();
    const correct = ['8','ocho','eight'].includes(event.target.elements.clave.value.trim().toLowerCase());
    document.querySelector('#reward').hidden = !correct;
    document.querySelector('#key-state').textContent = correct ? 'Clave correcta. Has abierto AUREA.' : 'Esa clave no abre el portal. Puedes consultar la pista.';
});
const reviewUrl = 'https://script.google.com/macros/s/AKfycbzUMsQTqgP8jq6aIp1EHtHX1n7IKTX-e1_n2W5wI921eRvdVmxbP-l1C7RV1aZvkZXHyw/exec';
async function loadReviews() {
    const state = document.querySelector('#review-state');
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
    } catch { state.textContent = 'Las reseñas no están disponibles en este momento.'; }
}
loadReviews();
document.querySelector('#review-form').addEventListener('submit', async event => {
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
