/**
 * CHESS_SEQUENCE — Pre-scripted cinematic chess film
 * Scholar's Mate: e4 e5 | Bc4 Nc6 | Qh5 Nf6?? | Qxf7#
 *
 * Each frame defines:
 *   progress    — scroll 0-1 trigger point
 *   fen         — board state (FEN string)
 *   cameraPos   — [x, y, z] camera world position
 *   cameraTarget— [x, y, z] look-at point
 *   dangerSqs   — squares to highlight red
 *   evalScore   — centipawn advantage (positive = White winning)
 *   shake       — trigger camera shake
 *   glowMate    — activate checkmate ring glow
 *   label       — human-readable label
 *   capturedAt  — square that just lost a piece (for fall-off animation)
 */

export const CHESS_SEQUENCE = [
  {
    progress: 0,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    cameraPos:    [0, 14, 18],
    cameraTarget: [0, 0, 0],
    dangerSqs:    [],
    evalScore:    0,
    shake:        false,
    glowMate:     false,
    label:        'Starting Position',
  },
  {
    progress: 0.12,
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    cameraPos:    [3, 12, 16],
    cameraTarget: [0.5, 0, 0],
    dangerSqs:    [],
    evalScore:    0.2,
    shake:        false,
    glowMate:     false,
    label:        '1. e4',
    capturedAt:   null,
  },
  {
    progress: 0.20,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    cameraPos:    [4, 11, 15],
    cameraTarget: [0, 0, -0.5],
    dangerSqs:    [],
    evalScore:    0.1,
    shake:        false,
    glowMate:     false,
    label:        '1...e5',
    capturedAt:   null,
  },
  {
    progress: 0.30,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2',
    cameraPos:    [3.5, 9, 13],
    cameraTarget: [0, 0.5, -0.5],
    dangerSqs:    [],
    evalScore:    0.3,
    shake:        false,
    glowMate:     false,
    label:        '2. Bc4 — Bishop targets f7',
    capturedAt:   null,
  },
  {
    progress: 0.38,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
    cameraPos:    [3, 8, 12],
    cameraTarget: [0, 0.5, -1],
    dangerSqs:    [],
    evalScore:    0.2,
    shake:        false,
    glowMate:     false,
    label:        '2...Nc6',
    capturedAt:   null,
  },
  {
    progress: 0.48,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
    cameraPos:    [2, 6.5, 10],
    cameraTarget: [1, 0.5, -1.5],
    dangerSqs:    ['f7'],
    evalScore:    0.8,
    shake:        false,
    glowMate:     false,
    label:        '3. Qh5 — The trap is set',
    capturedAt:   null,
  },
  {
    progress: 0.58,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    cameraPos:    [1.5, 5, 8],
    cameraTarget: [0.5, 0.5, -1.5],
    dangerSqs:    ['f7', 'e5', 'f6'],
    evalScore:    3.5,
    shake:        true,
    glowMate:     false,
    label:        '3...Nf6?? — The fatal mistake',
    capturedAt:   null,
  },
  {
    progress: 0.70,
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    cameraPos:    [1, 4, 6],
    cameraTarget: [-0.5, 0.3, -2.5],
    dangerSqs:    ['e8', 'f7'],
    evalScore:    99,
    shake:        true,
    glowMate:     false,
    label:        '4. Qxf7# — Checkmate!',
    capturedAt:   'f7',
  },
  {
    progress: 0.82,
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    cameraPos:    [0.8, 2.8, 4],
    cameraTarget: [-1, 0.4, -3],
    dangerSqs:    ['e8', 'f7'],
    evalScore:    99,
    shake:        false,
    glowMate:     true,
    label:        'Checkmate position',
    capturedAt:   null,
  },
  {
    progress: 1.0,
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    cameraPos:    [0.4, 1.6, 2.2],
    cameraTarget: [-1.5, 0.3, -3.8],
    dangerSqs:    ['e8', 'f7'],
    evalScore:    99,
    shake:        false,
    glowMate:     true,
    label:        'Final cinematic position',
    capturedAt:   null,
  },
];

/** Convert square string (e.g. "e4") to 3D world [x, z] coordinates */
export const SQUARE_SIZE = 1.2;
export function squareToWorld(square) {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1]) - 1;   // 1=0, 8=7
  return [
    (file - 3.5) * SQUARE_SIZE,
    (7 - rank - 3.5) * SQUARE_SIZE,
  ];
}

/** Parse FEN board section into a map of {square → piece_char} */
export function parseFenBoard(fen) {
  const board = {};
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((row, rankIdx) => {
    let fileIdx = 0;
    for (const ch of row) {
      if (isNaN(ch)) {
        const file = String.fromCharCode(97 + fileIdx);
        const rank = 8 - rankIdx;
        board[`${file}${rank}`] = ch;
        fileIdx++;
      } else {
        fileIdx += parseInt(ch);
      }
    }
  });
  return board;
}

/** Get the current frame index given a scroll progress 0-1 */
export function getFrameIndex(progress) {
  let idx = 0;
  for (let i = 0; i < CHESS_SEQUENCE.length; i++) {
    if (progress >= CHESS_SEQUENCE[i].progress) idx = i;
    else break;
  }
  return idx;
}

/** Linearly interpolate camera position between two frames */
export function interpolateCameraPos(frameA, frameB, t) {
  return frameA.cameraPos.map((v, i) => v + (frameB.cameraPos[i] - v) * t);
}
export function interpolateCameraTarget(frameA, frameB, t) {
  return frameA.cameraTarget.map((v, i) => v + (frameB.cameraTarget[i] - v) * t);
}
