// Board2D.jsx — 2D Chess Board for Analysis and Trainer views

function parseFen(fen) {
  const rows = fen.split(' ')[0].split('/');
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (isNaN(ch)) { board[r][f++] = ch; }
      else { f += parseInt(ch); }
    }
  });
  return board;
}

// ─── Piece SVGs ───────────────────────────────────────────────────────────────

function getPieceSVG(piece) {
  if (!piece) return null;
  const isWhite = piece === piece.toUpperCase();
  const fill = isWhite ? '#ffffff' : '#2d2119';
  const stroke = isWhite ? '#2b1c14' : '#f4dac4';
  const sw = 1.8;

  const base = `viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg"`;

  switch (piece.toLowerCase()) {
    case 'p': // Pawn
      return `<svg ${base}>
        <circle cx="22" cy="15" r="5.5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M 16 34 C 16 34, 17 22, 19 19 L 25 19 C 27 22, 28 34, 28 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <rect x="12" y="34" width="20" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    case 'r': // Rook
      return `<svg ${base}>
        <path d="M 14 12 L 14 17 L 30 17 L 30 12 L 27 12 L 27 15 L 25 15 L 25 12 L 19 12 L 19 15 L 17 15 L 17 12 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M 16 17 L 16 34 L 28 34 L 28 17 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <rect x="12" y="34" width="20" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    case 'n': // Knight
      return `<svg ${base}>
        <path d="M 22 10 C 25 10, 27 11, 29 13 C 31 15, 32 18, 30 20 C 28 22, 25 21, 28 24 C 30 26, 32 29, 31 34 L 13 34 C 12 28, 14 24, 16 22 C 14 20, 11 18, 12 14 C 13 11, 16 10, 18 11 C 19 10, 20 10, 22 10 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <circle cx="17" cy="15" r="1.5" fill="${stroke}"/>
        <rect x="11" y="34" width="22" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    case 'b': // Bishop
      return `<svg ${base}>
        <circle cx="22" cy="7" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M 22 8 C 17 12, 16 20, 16 34 L 28 34 C 28 20, 27 12, 22 8 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <line x1="18" y1="18" x2="26" y2="24" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
        <rect x="12" y="34" width="20" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    case 'q': // Queen
      return `<svg ${base}>
        <circle cx="10" cy="14" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="17" cy="12" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="22" cy="10" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="27" cy="12" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="34" cy="14" r="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M 10 15 L 15 34 L 29 34 L 34 15 L 29 23 L 27 13 L 24 23 L 22 11 L 20 23 L 17 13 L 15 23 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <rect x="12" y="34" width="20" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    case 'k': // King
      return `<svg ${base}>
        <rect x="19.5" y="4" width="5" height="1.8" rx="0.5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <rect x="21.1" y="2.5" width="1.8" height="5" rx="0.5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M 15 12 L 15 34 L 29 34 L 29 12 L 25 15 L 22 10 L 19 15 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        <line x1="15" y1="12" x2="29" y2="12" stroke="${stroke}" stroke-width="${sw}"/>
        <rect x="12" y="34" width="20" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      </svg>`;

    default:
      return null;
  }
}

// ─── Square Component ─────────────────────────────────────────────────────────

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function Square({
  piece,
  isLight,
  isSel,
  isHlFrom,
  isHlTo,
  isHint,
  isBestFrom,
  isBestTo,
  onClick,
  rank,
  file,
  showFile,
  showRank,
}) {
  const lightSq = '#DEDBC8';
  const darkSq = '#8B6250';
  const baseBg = isLight ? lightSq : darkSq;

  let bg = baseBg;
  let boxShadow = undefined;

  if (isHlFrom || isHlTo) {
    bg = isLight ? 'rgba(200,160,64,0.72)' : 'rgba(200,160,64,0.55)';
  }
  if (isBestTo) {
    bg = isLight ? 'rgba(79,174,120,0.45)' : 'rgba(79,174,120,0.35)';
  }
  if (isSel) {
    boxShadow = 'inset 0 0 0 4px #E27D38';
  } else if (isHint && piece) {
    boxShadow = 'inset 0 0 0 4px rgba(226,125,56,0.55)';
  } else if (isBestFrom) {
    boxShadow = 'inset 0 0 0 4px #4FAE78';
  } else if (isBestTo) {
    boxShadow = 'inset 0 0 0 4px #4FAE78';
  }

  const coordColor = isLight ? 'rgba(90,55,30,0.7)' : 'rgba(220,200,180,0.55)';

  return (
    <div
      onClick={onClick}
      style={{
        width: 62,
        height: 62,
        background: bg,
        boxShadow,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.12s',
        userSelect: 'none',
      }}
    >
      {/* Hint dot (empty square) */}
      {isHint && !piece && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'rgba(226,125,56,0.45)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Piece */}
      {piece && (
        <div
          style={{ position: 'relative', zIndex: 2, lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: getPieceSVG(piece) || '' }}
        />
      )}

      {/* File label (bottom of board) */}
      {showFile && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 3,
            fontSize: 8,
            fontWeight: 800,
            color: coordColor,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {file}
        </span>
      )}

      {/* Rank label (left of board) */}
      {showRank && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 3,
            fontSize: 8,
            fontWeight: 800,
            color: coordColor,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {rank}
        </span>
      )}
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function Board2D({
  fen = STARTING_FEN,
  sel = null,
  hints = [],
  hlFrom = null,
  hlTo = null,
  bestFrom = null,
  bestTo = null,
  onClick = null,
  flipped = false,
}) {
  const board = parseFen(fen);

  const hintSet = new Set(hints || []);

  // Build row/col order based on flip
  const rowIndices = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colIndices = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  function sqLabel(r, c) {
    return FILES[c] + RANKS[r];
  }

  const squares = [];
  rowIndices.forEach((r, ri) => {
    colIndices.forEach((c, ci) => {
      const sq = sqLabel(r, c);
      const piece = board[r][c];
      const isLight = (r + c) % 2 === 0;
      const isSel = sel === sq;
      const isHlFrom = hlFrom === sq;
      const isHlTo = hlTo === sq;
      const isHint = hintSet.has(sq);
      const isBestFrom = bestFrom === sq;
      const isBestTo = bestTo === sq;

      // File label: bottom row of the rendered board
      const isBottomRow = ri === 7;
      // Rank label: leftmost column of the rendered board
      const isLeftCol = ci === 0;

      squares.push(
        <Square
          key={sq}
          piece={piece}
          isLight={isLight}
          isSel={isSel}
          isHlFrom={isHlFrom}
          isHlTo={isHlTo}
          isHint={isHint}
          isBestFrom={isBestFrom}
          isBestTo={isBestTo}
          onClick={onClick ? () => onClick(sq, piece) : null}
          rank={RANKS[r]}
          file={FILES[c]}
          showFile={isBottomRow}
          showRank={isLeftCol}
        />
      );
    });
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 62px)',
        gridTemplateRows: 'repeat(8, 62px)',
        width: 496,
        height: 496,
        borderRadius: 6,
        overflow: 'hidden',
        border: '4px solid rgba(26,18,14,0.6)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      {squares}
    </div>
  );
}
