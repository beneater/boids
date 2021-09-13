// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numBoids = 100;
const visualRange = 75;
let centeringFactor = 0.005; // adjust velocity by this %
let centeringFactorChangeInterval = 100; // Time interval of anti flocking. After this, the boids again centralise at center of mass
const minDistance = 20; // The distance to stay away from other boids
const avoidFactor = 0.05; // Adjust velocity by this %
const minPredDistance = 100; // Minimum distance from predator to respond
const predAvoidFactor = 2; // How quick the boids respond to predator in range
const matchingFactor = 0.05; // Adjust by this % of average velocity
let matchingFactorWind = 0.1; // Adjust to make boids more/less resistive to wind vector
let placeTendFactor = 0.001; // Factor effecting the velocity vector directing towards a particular coordinate
// let placeTendFactorChangeInterval = 10;
const speedLimit = 15;
const wind = {x: randomBetween(-1,1), y: randomBetween(-1,1) }; // Generate constant wind vector
// const wind = {x: 1, y: 0};
let place = {x: 100, y: 100};
const perchTimeRange = {min: 50, max: 100}; // To randomize the perching time of boids
const DRAW_TRAIL = false;

var boids = [];

// Single predator boid
// TODO: Add multiple predators for complex behaviour
var predBoid = {};

function initBoids() {
  for (var i = 0; i < numBoids; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 7,
      dy: Math.random() * 10 - 7,
      perching: false,
      perch_time: randomBetween(perchTimeRange.min, perchTimeRange.max),
      history: [],
      pred: false,
    };
  }

  // Predator boid init
  predBoid = {
    x: Math.random() * width,
    y: Math.random() * height,
    dx: Math.random() * 10 - 7,
    dy: Math.random() * 10 - 7,
    history: [],
    pred: true,
  };

}

// Util function to calculate distance between two given boids
function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// Util function to generate randon interger between given numbers
function randomBetween(min, max) {
    if (min < 0) {
        return Math.floor(min + Math.random() * (Math.abs(min)+max));
    }else {
        return Math.floor(min + Math.random() * max);
    }
}

// Change: Used Schwartzian transform.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.map(b => [distance(boid, b), b]);
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => a[0] - b[0]);
  // Return the `n` closest
  return sorted.slice(1, n + 1).map(obj => obj[1]);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const marginX = 80;
  const marginY = 80;
  const turnFactor = 1;

  if (boid.x < marginX) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - marginX) {
    boid.dx -= turnFactor
  }
  if (boid.y < marginY) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - marginY) {
    boid.dy -= turnFactor;
  }

  // Preching behaviour: one in every 3 boids when closer to ground perches
  if ((boid.y > height) & randomBetween(1,3) == 2) {
    boid.y = height - 30;
    boid.perching = true;
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid, factor = centeringFactor) {
  
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

    boid.dx += (centerX - boid.x) * factor;
    boid.dy += (centerY - boid.y) * factor;
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {

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

// Move away from pedator that are close (within minPredDistance) to avoid predation
function avoidPredator(boid) {

  let moveX = 0;
  let moveY = 0;
  if (predBoid !== boid) {
    if (distance(boid, predBoid) < minPredDistance) {
      moveX += boid.x - predBoid.x;
      moveY += boid.y - predBoid.y;
    }
  }

  boid.dx += moveX * predAvoidFactor;
  boid.dy += moveY * predAvoidFactor;
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

// Action of a strong wind or current
// This function returns the same value independent of the boid being examined; 
// hence the entire flock will have the same push due to the wind.
function matchWind(boid){

  boid.dx += wind.x * matchingFactorWind;
  boid.dy += wind.y * matchingFactorWind;

}

// Add tendency to move towards a particular coordinate: place{x,y}
function tendToPlace(boid) {

  boid.dx += (place.x*(width/150) - boid.x) * placeTendFactor;
  boid.dy += (place.y*(height/150) - boid.y) * placeTendFactor;
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}


function drawBoid(ctx, boid) {
  let angle = Math.atan2(boid.dy, boid.dx);
  let fillStyle = "#558cf4";
  let strokeStyle = "#558cf466";
  // angle of boid if perching: pointing up. Also predators don't perch
  if (boid.perching && boid.pred == false) {
    angle = Math.atan2(-1, 0);
  }
  //Change color of predator boid
  if(boid.pred == true){
    fillStyle = "#fc3503";
    strokeStyle = "#fc350366";
  }
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  if(boid.pred == false){
    ctx.lineTo(boid.x - 15, boid.y + 5);
    ctx.lineTo(boid.x - 15, boid.y - 5);
    ctx.lineTo(boid.x, boid.y);
  }
  else {
    ctx.lineTo(boid.x - 20, boid.y + 10);
    ctx.lineTo(boid.x - 20, boid.y - 10);
    ctx.lineTo(boid.x, boid.y);
  }
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

// Main animation loop
function animationLoop() {
  // Update each boid
  for (let boid of boids) {
    if (boid.perching){
      if (boid.perch_time > 0  && distance(boid, predBoid) > visualRange) { // Don't perch if predator is close
        boid.perch_time -= 1;
        continue;
      }
      else {
        boid.perching = false;
        boid.perch_time = randomBetween(perchTimeRange.min, perchTimeRange.max);
      }
    }
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    avoidPredator(boid);
    matchVelocity(boid);
    matchWind(boid);
    tendToPlace(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    boid.history.push([boid.x, boid.y])
    boid.history = boid.history.slice(-50);
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  // Calculating behaviour of Predator boid (predBoid)
  flyTowardsCenter(predBoid,0.02);
  matchWind(predBoid);
  limitSpeed(predBoid);
  keepWithinBounds(predBoid);
  predBoid.x += predBoid.dx;
  predBoid.y += predBoid.dy;
  predBoid.history.push([predBoid.x, predBoid.y])
  predBoid.history = predBoid.history.slice(-50);
  drawBoid(ctx, predBoid);

  // Change conditions dynamically
  // Randomly change the centering factor for real life behaviour
  let r = randomBetween(1,100);
  // console.log(r);
  if (r == 1) {
    // console.log(r);
    centeringFactor *= -1;
    if (centeringFactorChangeInterval > 0) centeringFactorChangeInterval -= 1;
    else {
      centeringFactor *= -1;
      centeringFactorChangeInterval = 100;
    }
  }

  // Dynamic place tendency is causing severe divergent behaviour. So Droped
  // TODO: Realistically implement dynamic place tendency 
  // if ( randomBetween(1,1000) == 50) {
  //   // console.log(r);
  //   placeTendFactor *= -0.1;
  //   if (placeTendFactorChangeInterval > 0) placeTendFactorChangeInterval -= 1;
  //   else {
  //     placeTendFactor = 0.001;
  //     placeTendFactorChangeInterval = 10;
  //   }
  // }


  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
