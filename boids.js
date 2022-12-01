// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numBoids = 100;
const numPredators = 1;
const numObstacles = 4;
const numWindCircles = 4;
var visualRange = 75;
var centeringFactor = 0.005; // Coherence
var avoidFactor = 0.05; // Separation
var matchingFactor = 0.05; // Alignment
var leaderWeight = 0.3; // How much the boids will go towards the leader

// Colors
const YELLOW = "#f4df55";
const BLUE = "#558cf4";
const ALPHA_BLUE = "#558cf466";
const RED = "#800000";
const ALPHA_RED = "#80000066";
const ALPHA_YELLOW = "#f4df5566"

// Simulation config
var mouseLeaderMode = false;
const DRAW_TRAIL = true;

// Simulation constants
const BOID_SPEED_LIMIT = 15;

// Color config
const LEADER_COLOR = YELLOW;
const BOID_COLOR = BLUE;
const BOID_PATH_COLOR = ALPHA_BLUE;

var mouse = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
};

// Predation variables
var predationFactor = 0.005; // How much the predator will pursue the flock
var avoidPredatorFactor = 0.05; // How much the flock try to avoid the predator
var eatRange = 10;

var boids = [];
var predatorBoids = []
var obstacles = []
var windCircles = []

const boidsColors = {
  "normalBoid": BLUE,
  "predatorBoid": RED
}

const boidsTrails = {
  "normalBoid": ALPHA_BLUE,
  "predatorBoid": ALPHA_RED
}

function mouse_position(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY - 120;
}

function initBoids() {
  boids = [];
  for (var i = 0; i < numBoids; i += 1) {
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
  predatorBoids = []
  for (var i = 0; i < numPredators; i+= 1) {
    predatorBoids[predatorBoids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
      type: "predatorBoid"
    }
  }
}

function initObstacles() {
  obstacles = []
  for (var i = 0; i < numObstacles; i+= 1) {
    obstacles[obstacles.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 40,
    }
  }
}

function initWindCircles() {
  windCircles = []
  for (var i = 0; i < numWindCircles; i+= 1) {
    windCircles[windCircles.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random()*40,
      dx: Math.random() * 20,
      dy: Math.random() * 20
    }
  }
}

function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y)
  );
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
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
function flyTowardsCenter(boid, leader) {
  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    if (mouseLeaderMode) {
      centerX = mouse.x * leaderWeight + centerX * (1 - leaderWeight);
      centerY = mouse.y * leaderWeight + centerY * (1 - leaderWeight);
    }

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }

  // boid.dx += (centerX - boid.x) * centeringFactor;
  // boid.dy += (centerY - boid.y) * centeringFactor;
}

// The predator flies towards the center of the flock it is huntinh
// The predator have a larger visual range
function flyTowardsCenterPredator(boid) {
  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < 1.5*visualRange) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors > 0) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;
  
    boid.dx += (centerX - boid.x) * predationFactor;
    boid.dy += (centerY - boid.y) * predationFactor;
  } 


}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  const minDistance = 20; // The distance to stay away from other boids
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance(boid, otherBoid) < minDistance) {
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
    if (distance(boid, predator) < visualRange) {
      moveX += boid.x - predator.x;
      moveY += boid.y - predator.y;
    }
  }

  boid.dx += moveX * avoidPredatorFactor;
  boid.dy += moveY * avoidPredatorFactor;
}

// Boids will try to avoid obstacles, the near it gets more it will avoid.
function avoidObstacle(boid) {
  let moveX = 0;
  let moveY = 0;
  let changeDirectionFactor = 0
  for (let obstacle of obstacles) {
    if (distance(boid, obstacle) - obstacle.r < visualRange) {
      moveX += boid.x - obstacle.x;
      moveY += boid.y - obstacle.y;
      changeDirectionFactor += 20/(distance(boid, obstacle) - obstacle.r + 1e-3)
    }
  }

  boid.dx += moveX * avoidFactor*changeDirectionFactor;
  boid.dy += moveY * avoidFactor*changeDirectionFactor;
}

// The windCircle adds a factor to each direction of the boid
function passThroughWindCircle(boid) {
  let moveX = 0;
  let moveY = 0;
  let aerodinamicFactor = 1;
  for (let windCircle of windCircles) {
    if (distance(boid, windCircle) < windCircle.r) {
      moveX += windCircle.dx;
      moveY += windCircle.dy;
    }
  }

  boid.dx += moveX*aerodinamicFactor;
  boid.dy += moveY*aerodinamicFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
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

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function eatBoids(predator) {
  let boidsToEat = [];
  for (let i = 0; i < boids.length; i++) {
    let otherBoid = boids[i]
    if (distance(predator, otherBoid) < eatRange) {
      boidsToEat.push(i);
    }
  }

  for (let boidEaten of boidsToEat) {
    boids[boidEaten] = boids.pop();
  }
}

// Predator match the average velocity of the flock it is hunting
function matchVelocityPredator(boid) {
  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < 1.5*visualRange) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor*0.5;
    boid.dy += (avgDY - boid.dy) * matchingFactor*0.5;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
  const speedLimit = BOID_SPEED_LIMIT;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = boidsColors[boid.type];
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = boidsTrails[boid.type];
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

function drawObstacles(ctx) {
  obstacles.forEach(function(obstacle) {
    ctx.beginPath()
    ctx.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI*2);
    ctx.fillStyle = 'black'
    ctx.fill()
    // ctx.fill("black");
  })
}

function drawWindCircle(ctx) {
  windCircles.forEach(function(windCircle) {
    ctx.beginPath()
    ctx.arc(windCircle.x, windCircle.y, windCircle.r, 0, Math.PI*2);
    ctx.fillStyle = ALPHA_YELLOW
    ctx.fill()
    // ctx.fill("black");
  })
}

function drawMouseLeader(ctx, mouse) {
  ctx.fillStyle = LEADER_COLOR;

  // Draw square
  ctx.beginPath();
  ctx.moveTo(mouse.x - 5, mouse.y - 5);
  ctx.lineTo(mouse.x - 5, mouse.y + 5);
  ctx.lineTo(mouse.x + 5, mouse.y + 5);
  ctx.lineTo(mouse.x + 5, mouse.y - 5);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Main animation loop
function animationLoop() {
  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    avoidPredators(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);
    avoidObstacle(boid);
    passThroughWindCircle(boid);
  
    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    boid.history.push([boid.x, boid.y]);
    boid.history = boid.history.slice(-50);
  }


  for (let predatorBoid of predatorBoids) {
    flyTowardsCenterPredator(predatorBoid);
    matchVelocityPredator(predatorBoid);
    limitSpeed(predatorBoid);
    keepWithinBounds(predatorBoid);
    avoidObstacle(predatorBoid);
    passThroughWindCircle(predatorBoid);
    eatBoids(predatorBoid);

    predatorBoid.x += predatorBoid.dx;
    predatorBoid.y += predatorBoid.dy;
    predatorBoid.history.push([predatorBoid.x, predatorBoid.y])
    predatorBoid.history = predatorBoid.history.slice(-50);
  }
  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }
  if (mouseLeaderMode) drawMouseLeader(ctx, mouse);

  for (let predatorBoid of predatorBoids) {
    drawBoid(ctx, predatorBoid);
  }

  drawObstacles(ctx);
  drawWindCircle(ctx);

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
  initObstacles();
  initWindCircles();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);

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

  document.getElementById("slider-predator-coherence").value = predationFactor * 1000
  document.getElementById("slider-predator-coherence").oninput = (ev) => {
    predationFactor = ev.target.value / 1000
  }

  document.getElementById("slider-avoid-predator").value = avoidPredatorFactor * 100
  document.getElementById("slider-avoid-predator").oninput = (ev) => {
    avoidPredatorFactor = ev.target.value / 100
  }

  document.getElementById("reset-button").onclick = (ev) => {
    initBoids();
  };
};
