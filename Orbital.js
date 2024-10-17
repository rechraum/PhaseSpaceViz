const orbitalSketch = (p) => {
  let objects = [];
  let sun;
  let G = 6; // Gravitational constant
  let phaseSpace;
  let circularCheckbox;

  p.setup = function () {
    const canvasContainer = document.getElementById('canvas-container');
    const canvasWidth = canvasContainer.offsetWidth;
    const canvasHeight = canvasContainer.offsetHeight;

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent("canvas-container");

    p.colorMode(p.HSB, 360, 100, 100); // Set color mode to HSB

    sun = new CelestialBody(
      p.createVector(p.width / 4, p.height / 2),
      p.createVector(0, 0),
      1000, // Mass of the sun
      40,   // Size of the sun for drawing purposes
      p.color(50, 100, 100), // Bright yellow color in HSB
      true
    );
    phaseSpace = p.createGraphics(p.width / 2, p.height);

    // Use existing clear button and checkbox from HTML
    p.select('#clearObjects').mousePressed(clearObjects);
    circularCheckbox = p.select('#circularCheckbox');

    // Attach mousePressed event to the canvas only
    canvas.mousePressed(canvasMousePressed);
  };

  p.draw = function () {
    p.background(220);

    // Draw dividing line between visualizations
    p.stroke(0); // Set line color to black
    p.strokeWeight(1); // Set line thickness
    p.line(p.width / 2, 0, p.width / 2, p.height); // Vertical line

    // Draw the main simulation on the left
    p.push();
    p.translate(0, 0);
    p.fill(0);
    p.textAlign(p.CENTER);
    p.text('Click to add celestial bodies', p.width / 4, 30);
    drawXYAxes();
    sun.show();
    for (let obj of objects) {
      obj.applyGravity(sun);
      obj.update();
      obj.show(); // Show in XY plane
    }
    p.pop();

    // Clear phase space and redraw axes
    phaseSpace.background(255);
    drawPhaseSpaceAxes();

    // Draw phase space trajectories and current positions
    for (let obj of objects) {
      obj.showPhaseSpace();
    }

    // Draw the phase space on the right
    p.image(phaseSpace, p.width / 2, 0);
  };

  // Remove the global p.mousePressed function

  // New function to handle mousePressed on the canvas only
  function canvasMousePressed() {
    // Avoid clicking near UI elements if necessary
    if (p.mouseX < p.width / 2 && p.mouseY > 35) {
      let pos = p.createVector(p.mouseX, p.mouseY);
      let rVector = pos.copy().sub(sun.position);
      let distance = rVector.mag();

      // Calculate circular orbital speed
      let speedCircular = p.sqrt((G * sun.mass) / distance);

      let speed, tangent, angleOffset, velocity;

      if (circularCheckbox.checked()) {
        // Create a circular orbit
        speed = speedCircular;
        tangent = rVector.copy().rotate(p.HALF_PI).normalize();
        velocity = tangent.mult(speed);
      } else {
        // Create an elliptical orbit
        speed = speedCircular * p.random(0.5, 1.5);
        tangent = rVector.copy().rotate(p.HALF_PI).normalize();
        angleOffset = p.random(-p.PI / 6, p.PI / 6);
        tangent.rotate(angleOffset);
        velocity = tangent.mult(speed);
      }

      let obj = new CelestialBody(
        pos,
        velocity,
        5,    // Mass of the object
        8,    // Size of the object for drawing purposes
        p.color(p.random(0, 360), p.random(70, 100), p.random(30, 80)), // Adjusted color selection
        false
      );
      objects.push(obj);
    }
  }

  class CelestialBody {
    constructor(position, velocity, mass, size, col, isSun) {
      this.position = position.copy();
      this.velocity = velocity.copy();
      this.acceleration = p.createVector(0, 0);
      this.mass = mass;
      this.size = size;
      this.col = col;
      this.isSun = isSun;
      this.path = [];          // For XY plane trajectory
      this.phasePath = [];     // For phase space trajectory
    }

    applyGravity(other) {
      let force = other.position.copy().sub(this.position);
      let distanceSq = p.constrain(force.magSq(), 100, 50000);
      let strength = (G * this.mass * other.mass) / distanceSq;
      force.setMag(strength / this.mass);
      this.acceleration.add(force);
    }

    update() {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);

      // Record position for path (XY plane)
      this.path.push(this.position.copy());
      if (this.path.length > 200) {
        this.path.splice(0, 1);
      }

      // Calculate and record position for phase space trajectory
      let r = this.position.copy().sub(sun.position).mag();
      let v = this.velocity.mag();
      let x = p.map(r, 0, p.width / 2, 50, phaseSpace.width - 50);
      let y = p.map(v, 0, 10, phaseSpace.height - 50, 50);

      this.phasePath.push(p.createVector(x, y));
      if (this.phasePath.length > 200) {
        this.phasePath.splice(0, 1);
      }
    }

    show() {
      // Draw the object in XY plane
      p.fill(this.col);
      p.noStroke();
      p.ellipse(this.position.x, this.position.y, this.size);

      // Draw path in XY plane
      p.noFill();
      p.stroke(this.col);
      p.beginShape();
      for (let pos of this.path) {
        p.vertex(pos.x, pos.y);
      }
      p.endShape();
    }

    showPhaseSpace() {
      // Draw the trajectory as a line in phase space
      phaseSpace.stroke(this.col);
      phaseSpace.noFill();
      phaseSpace.beginShape();
      for (let pos of this.phasePath) {
        phaseSpace.vertex(pos.x, pos.y);
      }
      phaseSpace.endShape();

      // Draw the current position as a larger dot
      let currentPos = this.phasePath[this.phasePath.length - 1];
      phaseSpace.fill(this.col);
      phaseSpace.noStroke();
      phaseSpace.ellipse(currentPos.x, currentPos.y, 8, 8); // Larger dot
    }
  }

  function drawXYAxes() {
    p.stroke(0);
    // X-axis
    p.line(0, p.height / 2, p.width / 2, p.height / 2);
    // Y-axis
    p.line(p.width / 4, 0, p.width / 4, p.height);
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
   // p.text('X', p.width / 2 - 10, p.height / 2 + 15);
   // p.text('Y', p.width / 4 + 15, 10);
  }

  function drawPhaseSpaceAxes() {
    phaseSpace.push();
    phaseSpace.stroke(200);
    phaseSpace.fill(0);
    phaseSpace.textAlign(p.CENTER, p.CENTER);

    // Draw axes
    // X-axis (Distance)
    phaseSpace.line(50, phaseSpace.height - 50, phaseSpace.width - 50, phaseSpace.height - 50);
    // Y-axis (Velocity)
    phaseSpace.line(50, phaseSpace.height - 50, 50, 50);

    // Labels
    phaseSpace.text('Distance (pixels)', phaseSpace.width / 2, phaseSpace.height - 20);
    phaseSpace.text('Velocity', 25, phaseSpace.height / 2);

    // Title
    phaseSpace.text('Phase Space', phaseSpace.width / 2, 20);

    // Ticks and scales
    for (let i = 0; i <= 5; i++) {
      let x = p.map(i, 0, 5, 50, phaseSpace.width - 50);
      let distanceValue = parseInt(p.map(i, 0, 5, 0, p.width / 2));
      phaseSpace.noStroke();
      phaseSpace.text(distanceValue, x, phaseSpace.height - 35);
      phaseSpace.stroke(100);
      phaseSpace.line(x, phaseSpace.height - 55, x, phaseSpace.height - 45);
    }
    for (let i = 0; i <= 5; i++) {
      let y = p.map(i, 0, 5, phaseSpace.height - 50, 50);
      let velocityValue = p.nf(p.map(i, 0, 5, 0, 10), 1, 1);
      phaseSpace.noStroke();
      phaseSpace.text(velocityValue, 35, y);
      phaseSpace.stroke(100);
      phaseSpace.line(45, y, 55, y);
    }
    phaseSpace.pop();
  }

  function clearObjects() {
    objects = [];
    // No need to clear phase space here; it will be cleared in draw()
  }

  // Handle window resize
  p.windowResized = function () {
    const canvasContainer = document.getElementById('canvas-container');
    p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    // Also resize the phaseSpace graphics
    phaseSpace = p.createGraphics(p.width / 2, p.height);
  };
};
