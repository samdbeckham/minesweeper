const rows = 36;
const columns = 70;
const cellSize = 20;
const barHeight = 5;
const initialMines = 250;
const smileySize = 30;

let grid = [];
let revealedCells = 0;
let remainingMines = 0;
let lost = false;
let won = false;

function setup() {
  createGame();
}

function generateGlasses() {
  const y = smileySize / 2 - 7;
  noStroke();
  fill('#333');
  rect(width / 2 - 10, y, 9, 7);
  rect(width / 2 + 1, y, 9, 7);
  rect(width / 2 - 13, y, 26, 2);
}

function generateSmiley() {
  fill('#eb0');
  if (lost) { fill('#900'); }
  ellipse(width / 2, smileySize / 2, smileySize, smileySize);
  if (won) { generateGlasses(); }
}

function createGame() {
  const width = columns * cellSize + 1;
  const height = rows * cellSize + barHeight + smileySize + cellSize;
  let c, r;
  let mines = initialMines;

  grid = [];
  remainingMines = initialMines;
  revealedCells = 0;
  lost = false;
  won = false;

  for (c = 0; c < columns; c++) {
    for (r = 0; r < rows; r++) {
      grid.push(createCell(c, r));
    }
  }

  while (mines) {
    const position = Math.floor(Math.random() * grid.length);
    if (!grid[position].mine) {
      grid[position].mine = true;
      mines --;
    }
  }

  grid.map((cell) => {
    cell.nearby = getNearbyCells(cell).filter(cell => cell.mine).length;
  });

  resetCells();
  createCanvas(width, height);
}

function resetCells() {
  grid.forEach(cell => cell.touched = false);
}

function getNearbyCells(cell) {
  const cells = [];
  const { index, edges, touched } = cell;
  const { top, right, bottom, left } = edges;

  if (!top) {
    cells.push(grid[index - 1]);

    if (!right) { cells.push(grid[index + rows - 1]); }
    if (!left) { cells.push(grid[index - rows - 1]); }
  }
  if (!right) { cells.push(grid[index + rows]); }
  if (!bottom) {
    cells.push(grid[index + 1]);

    if (!right) { cells.push(grid[index + rows + 1]); }
    if (!left) { cells.push(grid[index - rows + 1]); }
  }
  if (!left) { cells.push(grid[index - rows]); }

  cell.touched = true;

  return cells;
}

function createCell(c, r) {
  const cell = {};

  cell.index = grid.length;
  cell.x = c * cellSize;
  cell.y = r * cellSize + smileySize + cellSize / 2;
  cell.mine = false;
  cell.nearby = 0;
  cell.revealed = false;
  cell.flagged = false;
  cell.touched = false;
  cell.edges = {
    top: r === 0,
    right: c === columns - 1,
    bottom: r === rows - 1,
    left: c === 0
  };

  return cell;
}

function getCellBackground(cell) {
  if (cell.flagged) { return '#09c'; }
  if (!cell.revealed) { return '#ccc'; }
  if (cell.mine) { return '#900'; }
  return '#f9f9f9';
}

function getNearbyColor(nearby) {
  const colors = ['#09c', '#090', '#c09', '#0c9', '#009', '#9cc', '#909', '#c90'];
  return colors[nearby - 1];
}

function reveal(cell) {
  const { edges, revealed, mine, index, nearby, flagged, touched } = cell;
  const { top, right, bottom, left } = edges;
  const nearbyCells = getNearbyCells(cell).filter(cell => !cell.touched);

  if (revealed || flagged) { return; }
  cell.revealed = true;
  revealedCells ++;

  if (mine) { return lose(); }
  if (revealedCells + initialMines === grid.length) { return win(); }
  if (nearby) { return; }

  nearbyCells.forEach(cell => cell.touched = true);
  nearbyCells.forEach(cell => reveal(cell));
}

function lose() {
  console.log('you lose!');
  lost = true;
}

function win() {
  console.log('you win!');
  const remainingCells = grid.filter(cell => !cell.revealed && !cell.flagged);
  remainingCells.forEach(cell => flag(cell));
  won = true;
}

function draw() {
  stroke('#fff');
  grid.map(cell => {
    const { x, y, mine, nearby, revealed } = cell;
    fill(getCellBackground(cell));
    rect(x, y, cellSize, cellSize);

    if (!revealed) { return }

    if (nearby && !mine) {
      fill(getNearbyColor(cell.nearby));
      textStyle('bold');
      text(nearby, x + 8, y + 15);
    }
  });

  const percentage = Math.floor(revealedCells / (grid.length - initialMines) * 100);

  fill(`hsl(${percentage}, 50%, 50%)`);
  rect(0, height - barHeight - 1, (width / (grid.length - initialMines)) * revealedCells , barHeight);

  generateSmiley();
}

function flag(cell) {
  if (cell.revealed) { return; }
  if (cell.flagged) {
    cell.flagged = false;
    remainingMines ++;
  } else {
    if (remainingMines) {
      cell.flagged = true;
      remainingMines --;
    }
  }
}

function areaReveal(cell) {
  const { nearby } = cell;
  const nearbyCells = getNearbyCells(cell);
  const nearbyFlags = nearbyCells.filter(cell => cell.flagged);
  const nearbyActiveCells = nearbyCells.filter(cell => !cell.revealed && !cell.flagged);

  if (nearbyFlags.length === nearby && nearbyActiveCells) {
    nearbyActiveCells.forEach(cell => reveal(cell));
  }
}

function mousePressed() {
  if (mouseY < smileySize) {
    if (
      mouseX > (width - smileySize) / 2
      && mouseX < ((width - smileySize) / 2) + smileySize
    ) {
      createGame();
    }
    return;
  }
  if (won || lost) { return; }
  const clickedCell = grid.filter(cell => {
    return (
      mouseX >= cell.x
      && mouseX < cell.x + cellSize
      && mouseY >= cell.y
      && mouseY < cell.y + cellSize
    );
  })[0];

  if (clickedCell) {
    if (clickedCell.revealed) {
      if (clickedCell.nearby) {
        areaReveal(clickedCell);
      }
    } else {
      if (mouseButton === LEFT) {
        reveal(clickedCell);
      }
      if (mouseButton === RIGHT) {
        flag(clickedCell);
      }
    }
  }
}
