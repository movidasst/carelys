module.exports = {
    content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        'abismo': '#0F172A',    /* Fondo principal */
        'dorado': '#D4AF37',    /* Color primario / Esperanza */
        'dorado-light': '#F3C969',
        'cian-electrico': '#00D4FF', /* Acentos / Portal */
        'piedra': '#94A3B8',    /* Textos secundarios */
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
      backgroundImage: {
        'portal-gradient': 'radial-gradient(circle at center, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 1) 70%)',
      }
    }
  }
};
