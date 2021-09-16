# Boids algorithm demonstration

## What is this?
This is a simple demonstration of the boids algorithm.

This simulation is running on [my website](https://nivyanth.cloudns.cl/animations/boids) if you’d like to check it out.

## How does it work?

Each of the boids (bird-oid objects) obeys three simple rules:

### 1. Coherence

Each boid flies towards the the other boids. But they don't just immediately fly directly at each other. They gradually steer towards each other at a rate that you can adjust with the `centeringFactor` variable. In the demo, you can adjust this from 0 to 0.01 with the "coherence" slider.

### 2. Separation

Each boid also tries to avoid running into the other boids. If it gets too close to another boid it will steer away from it. You can control how quickly it steers with the `avoidFactor` variable. In the demo, you can adjust this from 0 to 0.1 with the "separation" slider.

### 3. Alignment

Finally, each boid tries to match the vector (speed and direction) of the other boids around it. Again, you can control how quickly they try to match vectors using the `centeringFactor` variable. In the demo, you can adjust this from 0 to 0.1 with the "coherence" slider.

## Visual range

There are a ton of ways to extend this simple model to better simulate the behavior of different animals. An example I showed in the video is to limit the "visual range" of each boid. Real animals can't see the entire flock; they can only see the other animals around them. By adjusting the `visualRange` variable, you can adjust how far each boid can "see"—that is which other boids it considers when applying the three rules above.

## How do I run this code?

It ought to run in any web browser. Download (or clone) the files. Then, just double-clicking on `index.html` on most computers will open the simulation in your web browser. You can then edit `boids.js` to tweak and experiment with the algorithm. Simply save your changes and reload the web browser page to see the effect.

## What else is done?

There are lots of features apart from the above:

- A predator that the boids try to avoid that scatters the flock if it gets too close.
- A strong wind or current to see what effect it has on the flock.
- "Perching" behavior. If a boid gets close to the bottom of the screen, have it land and hang out on the ground for a bit before taking off again and rejoining the flock.

## To Do: 
- Make it 3D! The boids' velocity is currently represented as a 2D vector. You could change them to 3D vectors and update the vector math to work. To draw in 3D, you could just change the size of the boids to represent how far away they are.

See [this link](http://www.kfish.org/boids/pseudocode.html) for more details of logic.
