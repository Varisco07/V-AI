import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

// ── Working game templates ───────────────────────────────────────────────────

const GAMES: Record<string, { name: string; html: string }> = {

  snake: {
    name: 'snake-game',
    html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Snake</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Segoe UI', sans-serif; color: #eee; }
h1 { font-size: 2rem; margin-bottom: 10px; color: #4ade80; letter-spacing: 3px; }
#score-board { display: flex; gap: 30px; margin-bottom: 16px; font-size: 1.1rem; }
#score-board span { color: #a3e635; font-weight: bold; }
canvas { border: 3px solid #4ade80; border-radius: 8px; box-shadow: 0 0 30px rgba(74,222,128,0.3); }
#message { margin-top: 16px; font-size: 1.1rem; color: #fbbf24; height: 28px; }
#restart { margin-top: 12px; padding: 10px 28px; background: #4ade80; color: #1a1a2e; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; display: none; }
#restart:hover { background: #86efac; }
</style>
</head>
<body>
<h1>🐍 SNAKE</h1>
<div id="score-board">Punteggio: <span id="score">0</span> &nbsp; Record: <span id="best">0</span></div>
<canvas id="c" width="400" height="400"></canvas>
<div id="message">Premi un tasto freccia per iniziare</div>
<button id="restart" onclick="init()">Ricomincia</button>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const TILE = 20, COLS = 20, ROWS = 20;
let snake, dir, nextDir, food, score, best = 0, running = false, loop;

function rand(n) { return Math.floor(Math.random() * n); }

function spawnFood() {
  let pos;
  do { pos = { x: rand(COLS), y: rand(ROWS) }; }
  while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function init() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  food = spawnFood();
  score = 0;
  document.getElementById('score').textContent = 0;
  document.getElementById('message').textContent = '';
  document.getElementById('restart').style.display = 'none';
  running = true;
  clearInterval(loop);
  loop = setInterval(tick, 130);
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(loop); running = false;
    if (score > best) { best = score; document.getElementById('best').textContent = best; }
    document.getElementById('message').textContent = '💀 Game Over! Punteggio: ' + score;
    document.getElementById('restart').style.display = 'inline-block';
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++; document.getElementById('score').textContent = score;
    food = spawnFood();
  } else { snake.pop(); }
  draw();
}

function draw() {
  ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, 400, 400);
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, 400); ctx.stroke(); }
  for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(400, i * TILE); ctx.stroke(); }
  // Food
  ctx.fillStyle = '#f87171';
  ctx.beginPath(); ctx.arc(food.x * TILE + TILE/2, food.y * TILE + TILE/2, TILE/2 - 2, 0, Math.PI * 2); ctx.fill();
  // Snake
  snake.forEach((s, i) => {
    const g = ctx.createLinearGradient(s.x*TILE, s.y*TILE, s.x*TILE+TILE, s.y*TILE+TILE);
    g.addColorStop(0, i === 0 ? '#86efac' : '#4ade80');
    g.addColorStop(1, i === 0 ? '#4ade80' : '#16a34a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(s.x*TILE+1, s.y*TILE+1, TILE-2, TILE-2, 4); ctx.fill();
  });
}

document.addEventListener('keydown', e => {
  const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
  if (map[e.key]) {
    e.preventDefault();
    const nd = map[e.key];
    if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
    if (!running) init();
  }
});

draw();
</script>
</body>
</html>`,
  },

  '2048': {
    name: 'game-2048',
    html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2048</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #faf8ef; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
h1 { font-size: 3rem; font-weight: 900; color: #776e65; margin-bottom: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; width: 460px; margin-bottom: 12px; }
.score-box { background: #bbada0; border-radius: 6px; padding: 8px 20px; text-align: center; color: #eee; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
.score-box .val { display: block; font-size: 1.5rem; color: white; }
#new-game { background: #8f7a66; color: white; border: none; border-radius: 6px; padding: 12px 20px; font-size: 1rem; font-weight: bold; cursor: pointer; }
#new-game:hover { background: #9f8875; }
#board { background: #bbada0; border-radius: 10px; padding: 12px; display: grid; grid-template-columns: repeat(4, 100px); grid-gap: 12px; }
.tile { width: 100px; height: 100px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; transition: all 0.1s; }
.t0 { background: #cdc1b4; }
.t2 { background: #eee4da; color: #776e65; }
.t4 { background: #ede0c8; color: #776e65; }
.t8 { background: #f2b179; color: white; }
.t16 { background: #f59563; color: white; font-size: 1.6rem; }
.t32 { background: #f67c5f; color: white; font-size: 1.6rem; }
.t64 { background: #f65e3b; color: white; font-size: 1.6rem; }
.t128 { background: #edcf72; color: white; font-size: 1.4rem; }
.t256 { background: #edcc61; color: white; font-size: 1.4rem; }
.t512 { background: #edc850; color: white; font-size: 1.4rem; }
.t1024 { background: #edc53f; color: white; font-size: 1.1rem; }
.t2048 { background: #edc22e; color: white; font-size: 1.1rem; }
.tmax { background: #3c3a32; color: white; font-size: 1rem; }
#msg { margin-top: 20px; font-size: 1.4rem; font-weight: bold; color: #776e65; height: 32px; }
</style>
</head>
<body>
<h1>2048</h1>
<div class="header">
  <div><div class="score-box">Punteggio<span id="score" class="val">0</span></div></div>
  <div><div class="score-box">Record<span id="best" class="val">0</span></div></div>
  <button id="new-game" onclick="newGame()">Nuova partita</button>
</div>
<div id="board"></div>
<div id="msg"></div>
<script>
let grid, score, best = 0, moved;

function newGame() {
  grid = Array.from({length:4}, () => Array(4).fill(0));
  score = 0; moved = false;
  document.getElementById('msg').textContent = '';
  addTile(); addTile(); render();
}

function addTile() {
  const empty = [];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(!grid[r][c]) empty.push([r,c]);
  if(!empty.length) return;
  const [r,c] = empty[Math.floor(Math.random()*empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  grid.flat().forEach(v => {
    const d = document.createElement('div');
    d.className = 'tile ' + (v ? (v <= 2048 ? 't'+v : 'tmax') : 't0');
    d.textContent = v || '';
    board.appendChild(d);
  });
  document.getElementById('score').textContent = score;
  if(score > best) { best = score; document.getElementById('best').textContent = best; }
}

function slide(row) {
  let r = row.filter(x => x);
  let merged = false;
  for(let i=0;i<r.length-1;i++) {
    if(r[i]===r[i+1] && !merged) { r[i]*=2; score+=r[i]; r.splice(i+1,1); merged=true; }
    else merged=false;
  }
  while(r.length<4) r.push(0);
  return r;
}

function move(dir) {
  let g = grid.map(r=>[...r]);
  if(dir==='left') grid = grid.map(r=>slide(r));
  else if(dir==='right') grid = grid.map(r=>slide(r.reverse()).reverse());
  else if(dir==='up') {
    grid = grid[0].map((_,c)=>grid.map(r=>r[c])).map(r=>slide(r));
    grid = grid[0].map((_,c)=>grid.map(r=>r[c]));
  } else if(dir==='down') {
    let t = grid[0].map((_,c)=>grid.map(r=>r[c]).reverse()).map(r=>slide(r).reverse());
    grid = t[0].map((_,c)=>t.map(r=>r[c]));
  }
  const changed = JSON.stringify(grid) !== JSON.stringify(g);
  if(changed) { addTile(); render(); checkEnd(); }
}

function checkEnd() {
  if(grid.flat().includes(2048)) { document.getElementById('msg').textContent = '🎉 Hai vinto! Continua a giocare.'; return; }
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
    if(!grid[r][c]) return;
    if(c<3 && grid[r][c]===grid[r][c+1]) return;
    if(r<3 && grid[r][c]===grid[r+1][c]) return;
  }
  document.getElementById('msg').textContent = '😞 Game Over!';
}

document.addEventListener('keydown', e => {
  const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
  if(map[e.key]) { e.preventDefault(); move(map[e.key]); }
});

let tx, ty;
document.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; });
document.addEventListener('touchend', e => {
  const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
  else move(dy>0?'down':'up');
});

newGame();
</script>
</body>
</html>`,
  },

  memory: {
    name: 'memory-game',
    html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memory</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1e1b4b; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 24px; color: #eee; }
h1 { font-size: 2.2rem; font-weight: 900; color: #a78bfa; margin-bottom: 6px; letter-spacing: 2px; }
.stats { display: flex; gap: 24px; margin-bottom: 20px; font-size: 0.95rem; color: #c4b5fd; }
.stats span { font-weight: bold; color: white; }
#grid { display: grid; grid-template-columns: repeat(4, 90px); gap: 12px; }
.card { width: 90px; height: 90px; cursor: pointer; perspective: 600px; }
.card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.4s; }
.card.flipped .card-inner, .card.matched .card-inner { transform: rotateY(180deg); }
.front, .back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; }
.back { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: rgba(255,255,255,0.2); font-size: 1.8rem; }
.front { background: linear-gradient(135deg, #6d28d9, #4f46e5); transform: rotateY(180deg); border: 2px solid rgba(167,139,250,0.4); }
.card.matched .front { background: linear-gradient(135deg, #065f46, #047857); border-color: #34d399; box-shadow: 0 0 16px rgba(52,211,153,0.5); }
#msg { margin-top: 20px; font-size: 1.3rem; font-weight: bold; color: #fbbf24; height: 32px; }
button { margin-top: 12px; padding: 11px 28px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
button:hover { background: #6d28d9; }
</style>
</head>
<body>
<h1>🃏 MEMORY</h1>
<div class="stats">Mosse: <span id="moves">0</span> &nbsp; Coppie: <span id="pairs">0</span>/8</div>
<div id="grid"></div>
<div id="msg"></div>
<button onclick="init()">Nuova partita</button>
<script>
const EMOJIS = ['🦊','🐼','🦁','🐸','🦋','🐙','🦄','🐬'];
let cards, flipped, moves, pairs, lock;

function shuffle(a) { for(let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function init() {
  cards = shuffle([...EMOJIS,...EMOJIS]);
  flipped = []; moves = 0; pairs = 0; lock = false;
  document.getElementById('moves').textContent = 0;
  document.getElementById('pairs').textContent = 0;
  document.getElementById('msg').textContent = '';
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.i = i;
    card.dataset.emoji = emoji;
    card.innerHTML = '<div class="card-inner"><div class="back">?</div><div class="front">'+emoji+'</div></div>';
    card.addEventListener('click', () => flip(card));
    grid.appendChild(card);
  });
}

function flip(card) {
  if(lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  flipped.push(card);
  if(flipped.length === 2) {
    lock = true; moves++;
    document.getElementById('moves').textContent = moves;
    if(flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
      flipped.forEach(c => c.classList.add('matched'));
      pairs++; document.getElementById('pairs').textContent = pairs;
      if(pairs === 8) document.getElementById('msg').textContent = '🎉 Hai vinto in '+moves+' mosse!';
      flipped = []; lock = false;
    } else {
      setTimeout(() => {
        flipped.forEach(c => c.classList.remove('flipped'));
        flipped = []; lock = false;
      }, 900);
    }
  }
}

init();
</script>
</body>
</html>`,
  },

  tetris: {
    name: 'tetris-game',
    html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tetris</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:'Segoe UI',sans-serif; color:#eee; }
h1 { font-size:2.2rem; font-weight:900; letter-spacing:4px; color:#a78bfa; margin-bottom:12px; }
#wrap { display:flex; gap:24px; align-items:flex-start; }
canvas { border:2px solid #4f46e5; box-shadow:0 0 30px rgba(99,102,241,0.4); }
#panel { width:120px; }
.box { background:#1a1a2e; border:1px solid #3730a3; border-radius:8px; padding:12px; margin-bottom:12px; text-align:center; }
.box label { font-size:0.7rem; color:#818cf8; text-transform:uppercase; display:block; margin-bottom:4px; }
.box .val { font-size:1.4rem; font-weight:bold; color:white; }
#next-canvas { display:block; margin:0 auto; }
button { width:100%; padding:10px; background:#4f46e5; color:white; border:none; border-radius:8px; font-size:0.9rem; font-weight:bold; cursor:pointer; margin-top:4px; }
button:hover { background:#6366f1; }
#msg { font-size:0.9rem; color:#fbbf24; text-align:center; margin-top:8px; min-height:20px; }
</style>
</head>
<body>
<h1>TETRIS</h1>
<div id="wrap">
  <canvas id="c" width="200" height="400"></canvas>
  <div id="panel">
    <div class="box"><label>Score</label><div id="score" class="val">0</div></div>
    <div class="box"><label>Level</label><div id="level" class="val">1</div></div>
    <div class="box"><label>Next</label><canvas id="next-canvas" width="80" height="80"></canvas></div>
    <button onclick="start()">Inizia</button>
    <div id="msg">Premi Inizia</div>
  </div>
</div>
<script>
const C=document.getElementById('c'),ctx=C.getContext('2d');
const NC=document.getElementById('next-canvas'),nctx=NC.getContext('2d');
const S=20,COLS=10,ROWS=20;
const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
const COLORS=['#06b6d4','#fbbf24','#a78bfa','#f97316','#60a5fa','#f43f5e','#34d399'];
let board,piece,next,score,level,lines,running,tid;

function newBoard(){return Array.from({length:ROWS},()=>Array(COLS).fill(0));}
function newPiece(){const i=Math.floor(Math.random()*7);return{s:SHAPES[i],c:COLORS[i],x:3,y:0};}
function valid(p,dx=0,dy=0,s=p.s){return s.every((r,ri)=>r.every((v,ci)=>!v||((p.y+ri+dy>=0)&&(p.y+ri+dy<ROWS)&&(p.x+ci+dx>=0)&&(p.x+ci+dx<COLS)&&!board[p.y+ri+dy][p.x+ci+dx])));}
function rotate(s){return s[0].map((_,i)=>s.map(r=>r[i]).reverse());}

function start(){
  board=newBoard();score=0;level=1;lines=0;running=true;
  document.getElementById('score').textContent=0;
  document.getElementById('level').textContent=1;
  document.getElementById('msg').textContent='';
  piece=newPiece();next=newPiece();
  clearInterval(tid);tid=setInterval(tick,Math.max(100,500-level*40));
  draw();
}

function tick(){
  if(!valid(piece,0,1)){place();return;}
  piece.y++;draw();
}

function place(){
  piece.s.forEach((r,ri)=>r.forEach((v,ci)=>{if(v)board[piece.y+ri][piece.x+ci]=piece.c;}));
  let cleared=0;
  for(let r=ROWS-1;r>=0;r--){
    if(board[r].every(v=>v)){board.splice(r,1);board.unshift(Array(COLS).fill(0));cleared++;r++;}
  }
  if(cleared){lines+=cleared;score+=cleared*100*level;level=Math.floor(lines/10)+1;
    document.getElementById('score').textContent=score;
    document.getElementById('level').textContent=level;
    clearInterval(tid);tid=setInterval(tick,Math.max(100,500-level*40));}
  piece=next;next=newPiece();
  if(!valid(piece)){running=false;clearInterval(tid);document.getElementById('msg').textContent='💀 Game Over!';}
  draw();
}

function draw(){
  ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,COLS*S,ROWS*S);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(board[r][c]){ctx.fillStyle=board[r][c];ctx.fillRect(c*S+1,r*S+1,S-2,S-2);}
  // Ghost
  if(running){
    let gy=piece.y;while(valid(piece,0,gy-piece.y+1))gy++;
    piece.s.forEach((r,ri)=>r.forEach((v,ci)=>{if(v&&gy+ri!==piece.y+ri){ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect((piece.x+ci)*S+1,(gy+ri)*S+1,S-2,S-2);}}));
    // Piece
    piece.s.forEach((r,ri)=>r.forEach((v,ci)=>{if(v){ctx.fillStyle=piece.c;ctx.fillRect((piece.x+ci)*S+1,(piece.y+ri)*S+1,S-2,S-2);}}));
  }
  // Next
  nctx.fillStyle='#0a0a14';nctx.fillRect(0,0,80,80);
  const os=Math.floor((4-next.s[0].length)/2)*S,ot=Math.floor((4-next.s.length)/2)*S;
  next.s.forEach((r,ri)=>r.forEach((v,ci)=>{if(v){nctx.fillStyle=next.c;nctx.fillRect(os+ci*S+1,ot+ri*S+1,S-2,S-2);}}));
}

document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowLeft'&&valid(piece,-1,0)){piece.x--;draw();}
  else if(e.key==='ArrowRight'&&valid(piece,1,0)){piece.x++;draw();}
  else if(e.key==='ArrowDown'&&valid(piece,0,1)){piece.y++;score+=1;document.getElementById('score').textContent=score;draw();}
  else if(e.key==='ArrowUp'){const r=rotate(piece.s);if(valid(piece,0,0,r))piece.s=r;draw();}
  else if(e.key===' '){while(valid(piece,0,1)){piece.y++;score+=2;}document.getElementById('score').textContent=score;place();}
  if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();
});

draw();
</script>
</body>
</html>`,
  },

}

// Detect which game from a keyword string
function detectGame(keyword: string): string {
  const k = keyword.toLowerCase()
  if (k.includes('snake') || k.includes('serpente')) return 'snake'
  if (k.includes('2048')) return '2048'
  if (k.includes('memory') || k.includes('memoria')) return 'memory'
  if (k.includes('tetris')) return 'tetris'
  // default
  return 'snake'
}

export async function POST(req: NextRequest) {
  try {
    const { keyword = '' } = await req.json()
    const key = detectGame(keyword)
    const game = GAMES[key]

    const zip = new JSZip()
    const folder = zip.folder(game.name)!
    folder.file('index.html', game.html)

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${game.name}.zip"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    console.error('create-game error:', err)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
