// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

// ---------------------
// Simulation constants
// ---------------------
const NUM_BOIDS = 100;
const NUM_PREDATORS = 1;
const NUM_LEADERS = 1;
const NUM_OBSTACLES = 4;
const BOID_SPEED_LIMIT = 8;
const LEADER_VISUAL_RANGE_MULT = 3;
const COMM_INTERVAL = 500;
// Colors constants
const YELLOW = "#f4df55";
const BLUE = "#558cf4";
const RED = "#d8315b";
const ALPHA_BLUE = "#558cf466";
const ALPHA_RED = "#d8315b66";
const ALPHA_YELLOW = "#f4df5566";
// Colors config
const boidsColors = {
  normalBoid: BLUE,
  predatorBoid: RED,
  leaderBoid: YELLOW,
};
const boidsTrails = {
  normalBoid: ALPHA_BLUE,
  predatorBoid: ALPHA_RED,
  leaderBoid: ALPHA_YELLOW,
};

// ---------------------
// Simulation parameters
// ---------------------
let visualRange = 75;
let centeringFactor = 0.005; // Coherence
let avoidFactor = 0.05; // Separation
let matchingFactor = 0.05; // Alignment
// Mouse leader
let mouseLeaderMode = false;
let mouseLeaderWeight = 0.3; // How much the boids will go towards the leader
// Predation
let predationFactor = 0.005; // How much the predator will pursue the flock
let avoidPredatorFactor = 0.05; // How much the flock try to avoid the predator
// Visual
let drawTrail = true;

// Interaction
let mouse = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
};

// Entities
let boids = [];
let predatorBoids = [];
let leaderBoids = [];
let obstacles = [];
let arrows = [];

function mouse_position(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY - 220;
}

function initBoids() {
  boids = [];
  for (var i = 0; i < NUM_BOIDS; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
      type: "normalBoid",
    };
  }
}

function initPredators() {
  predatorBoids = [];
  for (var i = 0; i < NUM_PREDATORS; i += 1) {
    predatorBoids[predatorBoids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
      type: "predatorBoid",
    };
  }
}

function initLeaders() {
  leaderBoids = [];
  for (var i = 0; i < NUM_LEADERS; i += 1) {
    dx0 = Math.random() * 10 - 5;
    dy0 = Math.random() * 10 - 5;
    x0 = Math.random() * width;
    y0 = Math.random() * height;
    leaderBoids[leaderBoids.length] = {
      x: x0,
      y: y0,
      dx: dx0,
      dy: dy0,
      arrow_dx: dx0,
      arrow_dy: dy0,
      arrow_x: x0,
      arrow_y: y0,
      history: [],
      type: "leaderBoid",
    };
  }
}

// Used by the leaders to leave an indication on the map, hinting boids where to go
function updateArrows() {
  for (leader of leaderBoids) {
    leader.arrow_dx = leader.dx;
    leader.arrow_dy = leader.dy;
    leader.arrow_x = leader.x;
    leader.arrow_y = leader.y;
  }
}

function reactToArrow(boid) {
  for (leader of leaderBoids) {
    // If boid can see an arrow
    if (
      positionDistance(boid.x, boid.y, leader.arrow_x, leader.arrow_y) <
      visualRange
    ) {
      boid.dx += leader.arrow_dx;
      boid.dy += leader.arrow_dy;
    }
  }
}

function boidDistance(A, B) {
  return Math.sqrt((A.x - B.x) * (A.x - B.x) + (A.y - B.y) * (A.y - B.y));
}

function positionDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => boidDistance(boid, a) - boidDistance(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");

  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;

  canvas.width = width;
  canvas.height = height;
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const margin = 100;
  const turnFactor = 1;

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor;
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
// If leader is visible, go towards leader with a greater weight.
function flyTowardsCenter(boid) {
  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (otherBoid of boids) {
    if (boidDistance(boid, otherBoid) < visualRange) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }
  if (numNeighbors) {
    if (boid.type == "normalBoid") {
      // if (boid.type == "normalBoid" || boid.type == "leaderBoid" ) {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;

      // Weighting in mouse leader position if mouse leader is visible
      if (mouseLeaderMode) {
        if (
          boidDistance(boid, mouse) <
          visualRange * LEADER_VISUAL_RANGE_MULT
        ) {
          centerX =
            mouse.x * mouseLeaderWeight + centerX * (1 - mouseLeaderWeight);
          centerY =
            mouse.y * mouseLeaderWeight + centerY * (1 - mouseLeaderWeight);
        }
      }

      boid.dx += (centerX - boid.x) * centeringFactor;
      boid.dy += (centerY - boid.y) * centeringFactor;
    } else if (boid.type == "predatorBoid") {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;

      boid.dx += (centerX - boid.x) * predationFactor;
      boid.dy += (centerY - boid.y) * predationFactor;
    }
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  const minDistance = 20; // The distance to stay away from other boids
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (boidDistance(boid, otherBoid) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Run away from predators
function avoidPredators(boid) {
  let moveX = 0;
  let moveY = 0;
  for (let predator of predatorBoids) {
    if (
      boidDistance(boid, predator) <
      (boid.type == "leaderBoid"
        ? visualRange * LEADER_VISUAL_RANGE_MULT
        : visualRange)
    ) {
      moveX += boid.x - predator.x;
      moveY += boid.y - predator.y;
    }
  }

  boid.dx += moveX * avoidPredatorFactor;
  boid.dy += moveY * avoidPredatorFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (boidDistance(boid, otherBoid) < visualRange) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > BOID_SPEED_LIMIT) {
    boid.dx = (boid.dx / speed) * BOID_SPEED_LIMIT;
    boid.dy = (boid.dy / speed) * BOID_SPEED_LIMIT;
  }
}

function drawTriangle(ctx, x, y, dx, dy, fillStyle) {
  const angle = Math.atan2(dy, dx);
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.translate(-x, -y);
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 15, y + 5);
  ctx.lineTo(x - 15, y - 5);
  ctx.lineTo(x, y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawBoid(ctx, boid) {
  drawTriangle(ctx, boid.x, boid.y, boid.dx, boid.dy, boidsColors[boid.type]);

  if (drawTrail) {
    ctx.strokeStyle = boidsTrails[boid.type];
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }

  // If leader, draw arrow indicating last taken direction
  if (boid.type == "leaderBoid") {
    drawTriangle(
      ctx,
      boid.arrow_x,
      boid.arrow_y,
      boid.arrow_dx,
      boid.arrow_dy,
      boidsTrails[boid.type]
    );
  }
}

function drawMouseLeader(ctx, mouse) {
  ctx.fillStyle = YELLOW;

  // Draw square
  ctx.beginPath();
  ctx.moveTo(mouse.x - 5, mouse.y - 5);
  ctx.lineTo(mouse.x - 5, mouse.y + 5);
  ctx.lineTo(mouse.x + 5, mouse.y + 5);
  ctx.lineTo(mouse.x + 5, mouse.y - 5);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// -------------------
// Main animation loop
// -------------------
function animationLoop() {
  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    avoidPredators(boid);
    reactToArrow(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    boid.history.push([boid.x, boid.y]);
    boid.history = boid.history.slice(-50);
  }

  for (let predatorBoid of predatorBoids) {
    flyTowardsCenter(predatorBoid);
    matchVelocity(predatorBoid);
    limitSpeed(predatorBoid);
    keepWithinBounds(predatorBoid);

    predatorBoid.x += predatorBoid.dx;
    predatorBoid.y += predatorBoid.dy;
    predatorBoid.history.push([predatorBoid.x, predatorBoid.y]);
    predatorBoid.history = predatorBoid.history.slice(-50);
  }

  for (let leader of leaderBoids) {
    flyTowardsCenter(leader);
    // Leader avoids predator with higher visual range
    avoidPredators(leader);
    matchVelocity(leader);
    limitSpeed(leader);
    keepWithinBounds(leader);

    leader.x += leader.dx;
    leader.y += leader.dy;
    leader.history.push([leader.x, leader.y]);
    leader.history = leader.history.slice(-50);
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (boid of boids) {
    drawBoid(ctx, boid);
  }
  if (mouseLeaderMode) drawMouseLeader(ctx, mouse);

  for (predatorBoid of predatorBoids) {
    drawBoid(ctx, predatorBoid);
  }

  for (leaderBoid of leaderBoids) {
    drawBoid(ctx, leaderBoid);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();
  initPredators();
  initLeaders();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);

  // Update the indicating arrows left by the leaders
  window.setInterval(updateArrows, COMM_INTERVAL);

  // Define sliders behaviors
  document.getElementById("slider-coherence").value = centeringFactor * 1000;
  document.getElementById("slider-coherence").oninput = (ev) => {
    //TODO: Find maximum value to centeringFactor, after 0.05 the boid already display a high centering behavior
    centeringFactor = ev.target.value / 1000;
  };

  document.getElementById("slider-separation").value = avoidFactor * 100;
  document.getElementById("slider-separation").oninput = (ev) => {
    avoidFactor = ev.target.value / 100;
  };

  document.getElementById("slider-alignment").value = matchingFactor * 100;
  document.getElementById("slider-alignment").oninput = (ev) => {
    matchingFactor = ev.target.value / 100;
  };

  document.getElementById("slider-visual-range").value = visualRange;
  document.getElementById("slider-visual-range").oninput = (ev) => {
    visualRange = ev.target.value;
  };

  document.getElementById("toggle-mouse").value = mouseLeaderMode;
  document.getElementById("toggle-mouse").oninput = (ev) => {
    mouseLeaderMode = ev.target.checked;
  };

  document.getElementById("slider-predator-coherence").value =
    predationFactor * 1000;
  document.getElementById("slider-predator-coherence").oninput = (ev) => {
    predationFactor = ev.target.value / 1000;
  };

  document.getElementById("slider-avoid-predator").value =
    avoidPredatorFactor * 100;
  document.getElementById("slider-avoid-predator").oninput = (ev) => {
    avoidPredatorFactor = ev.target.value / 100;
  };

  document.getElementById("reset-button").onclick = (ev) => {
    initBoids();
  };
};
