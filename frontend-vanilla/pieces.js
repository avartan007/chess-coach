// Classical chess pieces - Highly legible Neo style standard shapes
// Each piece returns a clean, universally recognized SVG vector with high contrast outlines and fills.
// White pieces: cream-white fills with dark chocolate outlines
// Black pieces: deep charcoal-brown fills with sand-gold outlines

const PIECE_DEFS = {

  // ── KING (K) ────────────────────────────────────────────────
  K: (isWhite) => `
    <g transform="translate(4, 2) scale(0.86)">
      ${isWhite ? `
        <!-- White King: Classical Crown and Cross -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 31 L31 31 C31 31 29 27 28 26 C27 25 24 25 22 27 C20 25 17 25 16 26 C15 27 13 31 13 31" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 C13 25 15 13 20 10 C20 7 24 7 24 10 C29 13 31 25 31 31" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M22 2 L22 8 M19 5 L25 5" stroke="#2b1c14" stroke-width="2" stroke-linecap="round"/>
      ` : `
        <!-- Black King: Deep Charcoal with Sandstone Outlines -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 31 L31 31 C31 31 29 27 28 26 C27 25 24 25 22 27 C20 25 17 25 16 26 C15 27 13 31 13 31" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 C13 25 15 13 20 10 C20 7 24 7 24 10 C29 13 31 25 31 31" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M22 2 L22 8 M19 5 L25 5" stroke="#f4dac4" stroke-width="2" stroke-linecap="round"/>
      `}
    </g>`,

  // ── QUEEN (Q) ───────────────────────────────────────────────
  Q: (isWhite) => `
    <g transform="translate(4, 2) scale(0.86)">
      ${isWhite ? `
        <!-- White Queen: Coronet with Jewel Points -->
        <path d="M11 36 L29 36 L29 38 L11 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 C13 31 10 21 8 13 L14 20 L20 10 L26 20 L32 13 C30 21 27 31 27 31" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="8" cy="11" r="1.8" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <circle cx="14" cy="18" r="1.8" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <circle cx="20" cy="8" r="1.8" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <circle cx="26" cy="18" r="1.8" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <circle cx="32" cy="11" r="1.8" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <path d="M13 31 L27 31 C27 31 29 35 20 35 C11 35 13 31 13 31" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
      ` : `
        <!-- Black Queen: Deep Charcoal with Sandstone Outlines -->
        <path d="M11 36 L29 36 L29 38 L11 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 C13 31 10 21 8 13 L14 20 L20 10 L26 20 L32 13 C30 21 27 31 27 31" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="8" cy="11" r="1.8" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <circle cx="14" cy="18" r="1.8" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <circle cx="20" cy="8" r="1.8" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <circle cx="26" cy="18" r="1.8" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <circle cx="32" cy="11" r="1.8" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <path d="M13 31 L27 31 C27 31 29 35 20 35 C11 35 13 31 13 31" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
      `}
    </g>`,

  // ── ROOK (R) ────────────────────────────────────────────────
  R: (isWhite) => `
    <g transform="translate(4, 2) scale(0.86)">
      ${isWhite ? `
        <!-- White Rook: Castle Tower -->
        <path d="M11 36 L29 36 L29 38 L11 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 14 L28 14 L26 31 L14 31 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10 8 L10 14 L14 14 L14 11 L18 11 L18 14 L22 14 L22 11 L26 11 L26 14 L30 14 L30 8 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 L27 31 L28 35 L12 35 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
      ` : `
        <!-- Black Rook: Deep Charcoal with Sandstone Outlines -->
        <path d="M11 36 L29 36 L29 38 L11 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 14 L28 14 L26 31 L14 31 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10 8 L10 14 L14 14 L14 11 L18 11 L18 14 L22 14 L22 11 L26 11 L26 14 L30 14 L30 8 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 31 L27 31 L28 35 L12 35 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
      `}
    </g>`,

  // ── BISHOP (B) ──────────────────────────────────────────────
  B: (isWhite) => `
    <g transform="translate(4, 2) scale(0.86)">
      ${isWhite ? `
        <!-- White Bishop: Classical Mitre with Slash -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8"/>
        <path d="M13 31 C13 31 10 27 11 20 C12 13 18 8 20 6 C22 8 28 13 29 20 C30 27 27 31 27 31" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="20" cy="4" r="2" fill="#ffffff" stroke="#2b1c14" stroke-width="1.5"/>
        <!-- Diagonal Mitre Cut -->
        <path d="M17 14 L24 21" stroke="#2b1c14" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M13 31 L27 31 L28 35 L12 35 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
      ` : `
        <!-- Black Bishop: Deep Charcoal with Sandstone Outlines -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8"/>
        <path d="M13 31 C13 31 10 27 11 20 C12 13 18 8 20 6 C22 8 28 13 29 20 C30 27 27 31 27 31" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="20" cy="4" r="2" fill="#2d2119" stroke="#f4dac4" stroke-width="1.5"/>
        <!-- Diagonal Mitre Cut -->
        <path d="M17 14 L24 21" stroke="#f4dac4" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M13 31 L27 31 L28 35 L12 35 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
      `}
    </g>`,

  // ── KNIGHT (N) ──────────────────────────────────────────────
  N: (isWhite) => `
    <g transform="translate(4, 1) scale(0.86)">
      ${isWhite ? `
        <!-- White Knight: Classical Stallion Profile -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M28 35 C28 35 32 30 30 20 C28 10 18 5 15 5 C12 5 10 8 11 11 C12 14 14 13 13 16 C12 19 8 21 8 24 C8 27 11 31 14 31 L14 35" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Mane and muzzle details -->
        <path d="M22 6 C22 6 25 10 25 15" fill="none" stroke="#2b1c14" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M19 12 C19 12 16 11 15 13" fill="none" stroke="#2b1c14" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="15" cy="10" r="1.5" fill="#2b1c14"/>
      ` : `
        <!-- Black Knight: Deep Charcoal with Sandstone Outlines -->
        <path d="M12 36 L28 36 L28 38 L12 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M28 35 C28 35 32 30 30 20 C28 10 18 5 15 5 C12 5 10 8 11 11 C12 14 14 13 13 16 C12 19 8 21 8 24 C8 27 11 31 14 31 L14 35" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Mane and muzzle details -->
        <path d="M22 6 C22 6 25 10 25 15" fill="none" stroke="#f4dac4" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M19 12 C19 12 16 11 15 13" fill="none" stroke="#f4dac4" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="15" cy="10" r="1.5" fill="#f4dac4"/>
      `}
    </g>`,

  // ── PAWN (P) ────────────────────────────────────────────────
  P: (isWhite) => `
    <g transform="translate(4, 2) scale(0.86)">
      ${isWhite ? `
        <!-- White Pawn: Standard Pillar and Sphere -->
        <path d="M13 36 L27 36 L27 38 L13 38 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M15 28 C15 22 17 21 17 17 L23 17 C23 21 25 22 25 28" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="20" cy="11" r="6" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8"/>
        <path d="M14 28 L26 28 L27 32 L13 32 Z" fill="#ffffff" stroke="#2b1c14" stroke-width="1.8" stroke-linejoin="round"/>
      ` : `
        <!-- Black Pawn: Deep Charcoal with Sandstone Outlines -->
        <path d="M13 36 L27 36 L27 38 L13 38 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M15 28 C15 22 17 21 17 17 L23 17 C23 21 25 22 25 28" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="20" cy="11" r="6" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8"/>
        <path d="M14 28 L26 28 L27 32 L13 32 Z" fill="#2d2119" stroke="#f4dac4" stroke-width="1.8" stroke-linejoin="round"/>
      `}
    </g>`,
};

function getPieceSVG(piece) {
  if (!piece) return '';
  const type = piece.toUpperCase();
  const isWhite = piece === piece.toUpperCase();
  const fn = PIECE_DEFS[type];
  if (!fn) return '';
  return fn(isWhite);
}

function renderPieceInto(el, piece) {
  if (!piece) { el.innerHTML = ''; return; }
  const svg = `<svg viewBox="0 0 44 44" width="44" height="44" style="display:block;pointer-events:none">${getPieceSVG(piece)}</svg>`;
  el.innerHTML = svg;
}
