const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const hudScoreEl = document.getElementById( 'hud-score' );
const hudLivesEl = document.getElementById( 'hud-lives' );
const hudHighScoreEl = document.getElementById( 'hud-highscore' );

const state = {
  screen: 'start', // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  highScore: 0,
};

const paddle = {
  x: 320,
  y: 570,
  w: 162,
  h: 14,
  speed: 8, // px/frame al usar teclado
};

const ball = {
  x: 400,
  y: 300,
  w: 16,
  h: 16,
  vx: 4,
  vy: -4, // px/frame
};

const BALL_SPEED = Math.hypot( ball.vx, ball.vy );

const BLOCK_ROWS = [
  'gray',
  'red',
  'yellow',
  'cyan',
  'magenta',
  'hotpink',
  'green',
];
const BLOCK_COLS = 10;
const BLOCK_W = 74;
const BLOCK_H = 24;
const BLOCK_GAP = 6;
const BLOCK_MARGIN_TOP = 50;
const BLOCK_MARGIN_LEFT = ( canvas.width - ( BLOCK_COLS * BLOCK_W + ( BLOCK_COLS - 1 ) * BLOCK_GAP ) ) / 2;

let blocks = []; // se regenera en resetGame()

const keys = { left: false, right: false };

const sounds = {
  ballBounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  breakBlock: new Audio( 'assets/sounds/break-sound.mp3' ),
};

const HIGH_SCORE_KEY = 'arkanoid-high-score';

function loadHighScore() {
  try {
    const stored = localStorage.getItem( HIGH_SCORE_KEY );
    state.highScore = stored ? Number( stored ) : 0;
  } catch ( e ) {
    state.highScore = 0;
  }
}

function saveHighScoreIfNeeded() {
  if ( state.score <= state.highScore ) return;
  state.highScore = state.score;
  try {
    localStorage.setItem( HIGH_SCORE_KEY, String( state.highScore ) );
  } catch ( e ) {
    // localStorage deshabilitado: el high score no persiste esta sesión
  }
  updateHud();
}

function playSound( audio ) {
  audio.currentTime = 0;
  audio.play().catch( () => {} );
}

function updateHud() {
  hudScoreEl.textContent = `Puntaje: ${ state.score }`;
  hudLivesEl.textContent = `Vidas: ${ state.lives }`;
  hudHighScoreEl.textContent = `High Score: ${ state.highScore }`;
}

function clampPaddle() {
  if ( paddle.x < 0 ) paddle.x = 0;
  if ( paddle.x + paddle.w > canvas.width ) paddle.x = canvas.width - paddle.w;
}

function updatePaddle() {
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  clampPaddle();
}

function resetBall() {
  ball.x = 400;
  ball.y = 300;
  ball.vx = 4;
  ball.vy = -4;
}

function generateBlocks() {
  blocks = [];
  for ( let row = 0; row < BLOCK_ROWS.length; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        row,
        col,
        x: BLOCK_MARGIN_LEFT + col * ( BLOCK_W + BLOCK_GAP ),
        y: BLOCK_MARGIN_TOP + row * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color: BLOCK_ROWS[ row ],
        exploding: null,
      } );
    }
  }
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  paddle.x = 320;
  paddle.y = 570;
  resetBall();
  generateBlocks();
  updateHud();
}

function checkBlockCollision() {
  for ( const block of blocks ) {
    if ( block.exploding ) continue;

    const overlaps = ball.x < block.x + block.w && ball.x + ball.w > block.x &&
      ball.y < block.y + block.h && ball.y + ball.h > block.y;
    if ( !overlaps ) continue;

    const overlapLeft = ball.x + ball.w - block.x;
    const overlapRight = block.x + block.w - ball.x;
    const overlapTop = ball.y + ball.h - block.y;
    const overlapBottom = block.y + block.h - ball.y;
    const minOverlapX = Math.min( overlapLeft, overlapRight );
    const minOverlapY = Math.min( overlapTop, overlapBottom );

    if ( minOverlapX < minOverlapY ) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }

    block.exploding = { frame: 0, startedAt: performance.now() };
    state.score += 10;
    updateHud();
    playSound( sounds.breakBlock );
    break; // un solo bloque por frame
  }
}

function updateExplosions() {
  const now = performance.now();
  blocks = blocks.filter( ( block ) => {
    if ( !block.exploding ) return true;
    const elapsed = now - block.exploding.startedAt;
    if ( elapsed >= EXPLOSION_DURATION ) return false;
    block.exploding.frame = Math.min( 3, Math.floor( elapsed / ( EXPLOSION_DURATION / 4 ) ) );
    return true;
  } );
}

function loseLife() {
  state.lives -= 1;
  updateHud();
  resetBall();
}

function updateBall() {
  const prevBottom = ball.y + ball.h;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Paredes izquierda/derecha
  if ( ball.x <= 0 ) {
    ball.x = 0;
    ball.vx = -ball.vx;
    playSound( sounds.ballBounce );
  } else if ( ball.x + ball.w >= canvas.width ) {
    ball.x = canvas.width - ball.w;
    ball.vx = -ball.vx;
    playSound( sounds.ballBounce );
  }

  // Techo
  if ( ball.y <= 0 ) {
    ball.y = 0;
    ball.vy = -ball.vy;
    playSound( sounds.ballBounce );
  }

  // Paleta (usa el rectángulo de movimiento del frame para evitar túnel)
  const newBottom = ball.y + ball.h;
  const hitsPaddleX = ball.x + ball.w >= paddle.x && ball.x <= paddle.x + paddle.w;
  if ( ball.vy > 0 && hitsPaddleX && prevBottom <= paddle.y && newBottom >= paddle.y ) {
    ball.y = paddle.y - ball.h;

    const hitPos = ( ball.x + ball.w / 2 - ( paddle.x + paddle.w / 2 ) ) / ( paddle.w / 2 );
    const clampedHitPos = Math.max( -1, Math.min( 1, hitPos ) );
    const maxAngle = Math.PI / 3; // 60°
    const angle = clampedHitPos * maxAngle;

    ball.vx = BALL_SPEED * Math.sin( angle );
    ball.vy = -Math.abs( BALL_SPEED * Math.cos( angle ) );

    playSound( sounds.ballBounce );
  }

  // Borde inferior: pérdida de vida
  if ( ball.y + ball.h >= canvas.height ) {
    loseLife();
  }
}

function drawStartScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#eee';
  ctx.textAlign = 'center';
  ctx.font = '32px "Courier New", monospace';
  ctx.fillText( 'ARKANOID', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.font = '18px "Courier New", monospace';
  ctx.fillText( 'Presiona Espacio o haz click para jugar', canvas.width / 2, canvas.height / 2 + 10 );
}

function drawBlocks() {
  for ( const block of blocks ) {
    if ( block.exploding ) {
      const frame = EXPLOSION_FRAMES[ block.color ][ block.exploding.frame ];
      drawFrame( ctx, frame, block.x, block.y, block.w, block.h );
    } else {
      drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.w, block.h );
    }
  }
}

function drawPlayingScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  drawBlocks();
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x, ball.y, ball.w, ball.h );
}

function drawGameOverScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#e74c3c';
  ctx.textAlign = 'center';
  ctx.font = '32px "Courier New", monospace';
  ctx.fillText( 'GAME OVER', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.fillStyle = '#eee';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, canvas.width / 2, canvas.height / 2 );
  ctx.fillText( 'Presiona Espacio o haz click para reiniciar', canvas.width / 2, canvas.height / 2 + 30 );
}

function drawWinScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#2ecc71';
  ctx.textAlign = 'center';
  ctx.font = '32px "Courier New", monospace';
  ctx.fillText( '¡GANASTE!', canvas.width / 2, canvas.height / 2 - 40 );

  ctx.fillStyle = '#eee';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, canvas.width / 2, canvas.height / 2 );
  ctx.fillText( 'Presiona Espacio o haz click para reiniciar', canvas.width / 2, canvas.height / 2 + 30 );
}

function update() {
  if ( state.screen === 'playing' ) {
    updatePaddle();
    updateBall();
    checkBlockCollision();
    updateExplosions();

    if ( state.lives <= 0 ) {
      state.screen = 'gameover';
      saveHighScoreIfNeeded();
    } else if ( blocks.length === 0 ) {
      state.screen = 'win';
      saveHighScoreIfNeeded();
    }
  }
}

function draw() {
  if ( state.screen === 'start' ) {
    drawStartScreen();
  } else if ( state.screen === 'playing' ) {
    drawPlayingScreen();
  } else if ( state.screen === 'gameover' ) {
    drawGameOverScreen();
  } else if ( state.screen === 'win' ) {
    drawWinScreen();
  }
}

function startGame() {
  if ( state.screen === 'start' ) {
    state.screen = 'playing';
  } else if ( state.screen === 'gameover' || state.screen === 'win' ) {
    resetGame();
    state.screen = 'playing';
  }
}

window.addEventListener( 'keydown', ( e ) => {
  if ( e.code === 'ArrowLeft' || e.code === 'KeyA' ) keys.left = true;
  if ( e.code === 'ArrowRight' || e.code === 'KeyD' ) keys.right = true;
  if ( e.code === 'Space' ) startGame();
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.code === 'ArrowLeft' || e.code === 'KeyA' ) keys.left = false;
  if ( e.code === 'ArrowRight' || e.code === 'KeyD' ) keys.right = false;
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  if ( state.screen !== 'playing' ) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = ( e.clientX - rect.left ) * scaleX;
  paddle.x = mouseX - paddle.w / 2;
  clampPaddle();
} );

canvas.addEventListener( 'click', startGame );

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loadHighScore();
  resetGame();
  updateHud();
  requestAnimationFrame( loop );
} );
