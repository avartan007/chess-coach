import React, { useRef, useMemo, useEffect } from 'react';
import {
  CHESS_SEQUENCE,
  parseFenBoard,
  squareToWorld,
  getFrameIndex,
} from './CHESS_SEQUENCE.js';
import Piece3D from './Piece3D.jsx';

/**
 * ChessPieces — renders all pieces based on the current scrollProgress frame.
 * Manages piece lifecycle: appearing, moving, and captured (falling) pieces.
 */
export default function ChessPieces({ scrollProgress = 0 }) {
  const frameIndex = getFrameIndex(scrollProgress);
  const currentFrame = CHESS_SEQUENCE[frameIndex];

  const { dangerSqs = [], glowMate = false } = currentFrame;

  // Parse current board state
  const currentBoard = useMemo(
    () => parseFenBoard(currentFrame.fen),
    [currentFrame.fen]
  );

  // Track previous board state to detect captures
  const prevBoardRef = useRef({});
  const prevFrameIndexRef = useRef(frameIndex);

  // Captured squares: squares that existed in prev board but NOT in current
  const capturedSquares = useMemo(() => {
    if (prevFrameIndexRef.current === frameIndex) return {};
    const captured = {};
    for (const [sq, piece] of Object.entries(prevBoardRef.current)) {
      if (!currentBoard[sq]) {
        captured[sq] = piece;
      }
    }
    return captured;
  }, [frameIndex, currentBoard]);

  // Update previous board tracking after renders
  useEffect(() => {
    if (prevFrameIndexRef.current !== frameIndex) {
      prevBoardRef.current = { ...currentBoard };
      prevFrameIndexRef.current = frameIndex;
    }
  });

  const dangerSet = useMemo(() => new Set(dangerSqs), [dangerSqs]);

  return (
    <group>
      {/* Active pieces on the board */}
      {Object.entries(currentBoard).map(([square, pieceChar]) => {
        const [wx, wz] = squareToWorld(square);
        const isWhite = pieceChar === pieceChar.toUpperCase() && !/\d/.test(pieceChar);
        const type = pieceChar.toUpperCase();
        const isGlowing =
          dangerSet.has(square) || (glowMate && square === 'f7');

        return (
          <Piece3D
            key={square}
            type={type}
            isWhite={isWhite}
            position={[wx, 0.5, wz]}
            visible={true}
            opacity={1}
            glowing={isGlowing}
          />
        );
      })}

      {/* Captured / disappearing pieces — animate falling off board */}
      {Object.entries(capturedSquares).map(([square, pieceChar]) => {
        const [wx, wz] = squareToWorld(square);
        const isWhite = pieceChar === pieceChar.toUpperCase() && !/\d/.test(pieceChar);
        const type = pieceChar.toUpperCase();

        return (
          <Piece3D
            key={`captured-${square}`}
            type={type}
            isWhite={isWhite}
            position={[wx, 0.5, wz]}
            visible={false}
            opacity={0}
            glowing={false}
          />
        );
      })}
    </group>
  );
}
