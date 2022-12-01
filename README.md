# Boids simulation

-----------

## Disclaimer
This project builds on [Ben Eater's Boids algorithm demonstration repo](https://github.com/beneater/boids) (copyright 2020 Ben Eater).

Check out his repo, ⭐️ it and read the original project's readme for more details!

This code is [MIT licensed](http://en.wikipedia.org/wiki/MIT_License).

-----------

## What is this

This is a boids (bird-oid objects) simulation done for a Multi-Agents Systems class, taken on 2022 at ENSTA Paris.

### Improvements

We have developed on Ben's original code by adding some functionalities:

- Predators (red triangles) that scare the boids
- Leaders (yellow triangles) that leave traces of their direction behind, helping other boids find their way running away from the predator – this was done to create an *indirect communication* scenario
- Turbulence areas (yellow circles), that throw boids away on a given direction
- Obstacles (black circles), that block boids from passing
- Optional use of the mouse as a leader (in this case, it does not leave traces behind)

## How do I run this code?
> *This section has been kept from Ben's original Readme*

It ought to run in any web browser. Download (or clone) the files. Then, just double-clicking on `index.html` on most computers will open the simulation in your web browser.

You can then edit `boids.js` to tweak and experiment with the algorithm. Simply save your changes and reload the web browser page to see the effect.


## Authors
- [Bruno Sanches](https://github.com/brunosanches)
- [Caio Lang](https://github.com/caiolang)
- [Pedro Morel](https://github.com/pmorelr)

Built on top of [Ben Eater](https://github.com/beneater)'s awesome work. 