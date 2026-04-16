import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

// ── Snake game ──────────────────────────────────────
function SnakeGame({ onClose }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ snake: [], dir: { x: 1, y: 0 }, food: {}, score: 0, interval: null });
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(parseInt(localStorage.getItem('ssp_snake_hi') || '0'));

  const placeFood = (snake) => {
    const gs = 14;
    let f;
    do { f = { x: Math.floor(Math.random() * gs), y: Math.floor(Math.random() * gs) }; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  };

  const draw = (over) => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'), cs = 20;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, 280, 280);
    ctx.fillStyle = dark ? '#161B22' : '#f8faff'; ctx.fillRect(0, 0, 280, 280);
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, 280, 280);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over! Score: ' + stateRef.current.score, 140, 128);
      ctx.font = '13px sans-serif'; ctx.fillText('Press Restart to play again', 140, 155); return;
    }
    ctx.strokeStyle = dark ? '#21262D' : '#e5e5f0'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, 280); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cs); ctx.lineTo(280, i * cs); ctx.stroke(); }
    const { food, snake } = stateRef.current;
    ctx.fillStyle = '#EF4444'; ctx.beginPath(); ctx.arc(food.x * cs + cs / 2, food.y * cs + cs / 2, 8, 0, Math.PI * 2); ctx.fill();
    snake.forEach((s, i) => { ctx.fillStyle = i === 0 ? '#1A56DB' : '#6B7FE3'; ctx.beginPath(); ctx.rect(s.x * cs + 1, s.y * cs + 1, cs - 2, cs - 2); ctx.fill(); });
  };

  const gameLoop = () => {
    const { snake, dir, food } = stateRef.current;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= 14 || head.y < 0 || head.y >= 14 || snake.some(s => s.x === head.x && s.y === head.y)) {
      clearInterval(stateRef.current.interval);
      const cur = stateRef.current.score;
      const best = parseInt(localStorage.getItem('ssp_snake_hi') || '0');
      if (cur > best) { localStorage.setItem('ssp_snake_hi', cur); setHi(cur); }
      draw(true); return;
    }
    const newSnake = [head, ...snake];
    if (head.x === food.x && head.y === food.y) {
      const ns = stateRef.current.score + 10;
      stateRef.current.score = ns; setScore(ns);
      stateRef.current.food = placeFood(newSnake);
    } else newSnake.pop();
    stateRef.current.snake = newSnake;
    draw(false);
  };

  const init = () => {
    clearInterval(stateRef.current.interval);
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    stateRef.current = { snake, dir: { x: 1, y: 0 }, food: placeFood(snake), score: 0, interval: null };
    setScore(0); draw(false);
    stateRef.current.interval = setInterval(gameLoop, 150);
  };

  useEffect(() => {
    init();
    const kd = (e) => {
      const d = stateRef.current.dir;
      if ((e.key === 'ArrowUp' || e.key === 'w') && d.y === 0) stateRef.current.dir = { x: 0, y: -1 };
      else if ((e.key === 'ArrowDown' || e.key === 's') && d.y === 0) stateRef.current.dir = { x: 0, y: 1 };
      else if ((e.key === 'ArrowLeft' || e.key === 'a') && d.x === 0) stateRef.current.dir = { x: -1, y: 0 };
      else if ((e.key === 'ArrowRight' || e.key === 'd') && d.x === 0) stateRef.current.dir = { x: 1, y: 0 };
    };
    document.addEventListener('keydown', kd);
    return () => { clearInterval(stateRef.current.interval); document.removeEventListener('keydown', kd); };
  }, []);

  return (
    <div>
      <div className="snake-score">Score: <span>{score}</span> &nbsp;|&nbsp; Best: <span>{hi}</span></div>
      <canvas ref={canvasRef} id="snakeCanvas" width="280" height="280" />
      <div className="game-controls">
        <button className="game-btn" onClick={init}>Restart</button>
        <button className="game-btn" onClick={onClose}>Close</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Arrow keys or WASD to move</div>
    </div>
  );
}

// ── Sudoku game ─────────────────────────────────────
const PUZZLES = [
  [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]],
  [[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]]
];

function SudokuGame({ onClose, showToast }) {
  const [puzzle] = useState(() => { const idx = Math.floor(Math.random() * PUZZLES.length); return PUZZLES[idx]; });
  const [grid, setGrid] = useState(() => puzzle.map(r => [...r]));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const kd = (e) => {
      if (!selected) return;
      const [r, c] = selected;
      const isPre = puzzle[r][c] !== 0;
      if (isPre) return;
      if (e.key >= '1' && e.key <= '9') setGrid(g => { const ng = g.map(row => [...row]); ng[r][c] = parseInt(e.key); return ng; });
      else if (e.key === '0' || e.key === 'Backspace') setGrid(g => { const ng = g.map(row => [...row]); ng[r][c] = 0; return ng; });
    };
    document.addEventListener('keydown', kd);
    return () => document.removeEventListener('keydown', kd);
  }, [selected, puzzle]);

  const check = () => {
    if (grid.some(row => row.some(v => v === 0))) { showToast('Fill all cells first!'); return; }
    const valid = grid.every(row => new Set(row).size === 9 && row.every(v => v >= 1 && v <= 9));
    showToast(valid ? '🎉 Correct! Sudoku solved!' : '❌ Some cells are wrong. Keep trying!');
  };

  return (
    <div>
      <div style={{ margin: '0 auto 10px', width: 260 }}>
        <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => {
                  const given = puzzle[r][c] !== 0;
                  const sel = selected && selected[0] === r && selected[1] === c;
                  const bt = r % 3 === 0 ? '2px solid var(--text2)' : '1px solid var(--border2)';
                  const bl = c % 3 === 0 ? '2px solid var(--text2)' : '1px solid var(--border2)';
                  const bb = r === 8 ? '2px solid var(--text2)' : '1px solid var(--border2)';
                  const br = c === 8 ? '2px solid var(--text2)' : '1px solid var(--border2)';
                  return (
                    <td key={c}
                      onClick={() => !given && setSelected([r, c])}
                      style={{ width: 28, height: 28, textAlign: 'center', borderTop: bt, borderLeft: bl, borderBottom: bb, borderRight: br, background: sel ? 'var(--blue-mid)' : given ? 'var(--blue-light)' : 'var(--surface)', color: given ? 'var(--blue)' : 'var(--text)', fontWeight: given ? 800 : 400, cursor: given ? 'default' : 'pointer', fontSize: 14 }}>
                      {v || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Click a cell then press a number key (1–9). 0 to clear.</div>
      <div className="game-controls">
        <button className="game-btn" onClick={() => setGrid(puzzle.map(r => [...r]))}>New puzzle</button>
        <button className="game-btn" onClick={check}>Check</button>
        <button className="game-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ── Game Modal ──────────────────────────────────────
export default function GameModal() {
  const { gameModalOpen, closeGameModal, showToast } = useApp();
  const [view, setView] = useState('choice'); // 'choice' | 'snake' | 'sudoku'

  useEffect(() => { if (!gameModalOpen) setView('choice'); }, [gameModalOpen]);

  if (!gameModalOpen) return null;
  return (
    <div className="modal-overlay open">
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={closeGameModal}>✕</button>
        {view === 'choice' && (
          <>
            <div className="modal-icon">🎉</div>
            <div className="modal-title">Day Complete!</div>
            <div className="modal-sub">You ticked every slot today — outstanding! Unlock your daily reward:</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="modal-btn" onClick={() => setView('snake')}>🐍 Play Snake</button>
              <button className="modal-btn" style={{ background: 'var(--teal)' }} onClick={() => setView('sudoku')}>🔢 Play Sudoku</button>
            </div>
          </>
        )}
        {view === 'snake' && <SnakeGame onClose={closeGameModal} />}
        {view === 'sudoku' && <SudokuGame onClose={closeGameModal} showToast={showToast} />}
      </div>
    </div>
  );
}
