const energyLandscapeSketch = (p) => {
    let terrain; // The grayscale image representing the potential energy gradient
    let terrainWidth;
    let terrainHeight;
    let balls = []; // Array to store the rolling balls
    let phaseSpace;
    let terrainGenerated = false;
    let maxRadialDistance = 1; // For scaling in phase space, initialized to 1
    let heights; // 2D array to store height values
    const criticalVelocity = 0.1; // Threshold for 'stuck' balls
  
    p.setup = function () {
      const canvasContainer = document.getElementById('canvas-container');
      const canvasWidth = canvasContainer.offsetWidth;
      const canvasHeight = canvasContainer.offsetHeight;
  
      const canvas = p.createCanvas(canvasWidth, canvasHeight);
      canvas.parent("canvas-container");
  
      // Set pixel density to 1 to avoid high-DPI scaling issues
      p.pixelDensity(1);
  
      p.colorMode(p.HSB, 360, 100, 100); // Set color mode to HSB
  
      phaseSpace = p.createGraphics(p.width / 2, p.height);
      phaseSpace.pixelDensity(1); // Set pixel density for phaseSpace graphics
  
      // Attach event listener to the create landscape button
      p.select('#createLandscape').mousePressed(createLandscape);
  
      // Attach mousePressed event to the canvas only
      canvas.mousePressed(canvasMousePressed);
    };
  
    p.draw = function () {
      p.background(220);
  
      // Draw dividing line between visualizations
      p.stroke(0); // Set line color to black
      p.strokeWeight(1); // Set line thickness
      p.line(p.width / 2, 0, p.width / 2, p.height); // Vertical line
  
      // Draw terrain and balls
      p.push();
      p.translate(0, 0);
      if (terrainGenerated) {
        p.image(terrain, 0, 0, p.width / 2, p.height); // Correctly scale terrain image
        for (let ball of balls) {
          ball.update();
          ball.show();
        }
      } else {
        p.fill(0);
        p.textAlign(p.CENTER);
        p.text('Click "Create Landscape" to generate terrain', p.width / 4, p.height / 2);
      }
      p.pop();
  
      // Draw phase space visualization
      phaseSpace.background(255);
      drawPhaseSpaceAxes();
      drawPhaseSpaceData();
  
      // Display phase space on the right
      p.image(phaseSpace, p.width / 2, 0);
    };
  
    function createLandscape() {
      // Reset balls and maxRadialDistance
      balls = [];
      maxRadialDistance = 1; // Reset to 1 to avoid division by zero
  
      terrainWidth = Math.floor(p.width / 2);
      terrainHeight = Math.floor(p.height);
  
      // Create a 2D array to hold the heights
      heights = [];
      for (let x = 0; x < terrainWidth; x++) {
        heights[x] = [];
        for (let y = 0; y < terrainHeight; y++) {
          heights[x][y] = 0.5; // Initialize to medium height
        }
      }
  
      // Define exponent for steepness
      const exponent = 2; // Adjust for steeper or gentler slopes
  
      // Create high spots (maxima) with circular areas
      let numHighPoints = 3;
      let highValue = 5; // Max height
      let highSpots = [];
      for (let i = 0; i < numHighPoints; i++) {
        let x0 = p.floor(p.random(terrainWidth));
        let y0 = p.floor(p.random(terrainHeight));
        let radius = p.random(20, 40); // Adjust radius as needed
        highSpots.push({ x: x0, y: y0, radius: radius });
      }
  
      // Create low spots (minima) with circular areas
      let numLowPoints = 2;
      let lowValue = -5; // Min height
      let lowSpots = [];
      for (let i = 0; i < numLowPoints; i++) {
        let x0 = p.floor(p.random(terrainWidth));
        let y0 = p.floor(p.random(terrainHeight));
        let radius = p.random(20, 40); // Adjust radius as needed
        lowSpots.push({ x: x0, y: y0, radius: radius });
      }
  
      // Generate the terrain heights
      for (let x = 0; x < terrainWidth; x++) {
        for (let y = 0; y < terrainHeight; y++) {
          let heightValue = 0.5; // Base height
  
          // Check if the point is inside any high spot
          for (let spot of highSpots) {
            let dx = Math.min(Math.abs(x - spot.x), terrainWidth - Math.abs(x - spot.x));
            let dy = Math.min(Math.abs(y - spot.y), terrainHeight - Math.abs(y - spot.y));
            let distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance <= spot.radius) {
              // Calculate height using non-linear function
              let normalizedDistance = distance / spot.radius;
              heightValue = highValue - Math.pow(normalizedDistance, exponent) * (highValue - 0.5);
              break; // Stop checking other spots
            }
          }
  
          // Check if the point is inside any low spot
          for (let spot of lowSpots) {
            let dx = Math.min(Math.abs(x - spot.x), terrainWidth - Math.abs(x - spot.x));
            let dy = Math.min(Math.abs(y - spot.y), terrainHeight - Math.abs(y - spot.y));
            let distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance <= spot.radius) {
              // Calculate height using non-linear function
              let normalizedDistance = distance / spot.radius;
              heightValue = lowValue + Math.pow(normalizedDistance, exponent) * (0.5 - lowValue);
              break; // Stop checking other spots
            }
          }
  
          heights[x][y] = heightValue;
        }
      }
  
      // Now create the terrain image based on the heights array
      terrain = p.createGraphics(terrainWidth, terrainHeight);
      terrain.pixelDensity(1); // Set pixel density for terrain graphics
      terrain.loadPixels();
  
      for (let x = 0; x < terrainWidth; x++) {
        for (let y = 0; y < terrainHeight; y++) {
          let index = (x + y * terrainWidth) * 4;
          let brightness = p.floor(heights[x][y] * 255);
          terrain.pixels[index] = brightness;
          terrain.pixels[index + 1] = brightness;
          terrain.pixels[index + 2] = brightness;
          terrain.pixels[index + 3] = 255;
        }
      }
  
      terrain.updatePixels();
      terrainGenerated = true;
    }
  
    function canvasMousePressed() {
      if (terrainGenerated && p.mouseX < p.width / 2) {
        let x = p.mouseX;
        let y = p.mouseY;
        let col = p.color(p.random(0, 360), p.random(70, 100), p.random(30, 80));
        balls.push(new Ball(x, y, col));
      }
    }
  
    class Ball {
      constructor(x, y, col) {
        this.position = p.createVector(x, y);
        this.startPosition = this.position.copy(); // Store starting position
        this.velocity = p.createVector(0, 0);
        this.acceleration = p.createVector(0, 0);
        this.size = 10;
        this.col = col;
        this.path = []; // For path tracking
        this.radialDistance = 0;
        this.stuck = false; // Indicates if the ball is stuck
      }
  
      update() {
        if (this.stuck) {
          return; // Do not update if the ball is stuck
        }
  
        // Calculate acceleration based on gradient
        let gradient = this.getGradient(this.position.x, this.position.y);
        this.acceleration = gradient.mult(-1); // Move downhill, adjust multiplier for speed control
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
  
        // Update radial distance from starting position
        this.radialDistance = this.getRadialDistance();
  
        // Update maxRadialDistance for scaling in phase space
        if (this.radialDistance > maxRadialDistance) {
          maxRadialDistance = this.radialDistance;
        }
  
        // Check if the ball is 'stuck'
        if (this.velocity.mag() < criticalVelocity) {
          this.stuck = true;
        }
  
        // Record position for path
        this.path.push(this.position.copy());
        if (this.path.length > 200) {
          this.path.splice(0, 1);
        }
  
        // Wrap around if ball goes out of bounds
        this.position.x = (this.position.x + terrainWidth) % terrainWidth;
        this.position.y = (this.position.y + terrainHeight) % terrainHeight;
      }
  
      show() {
        // Draw the ball
        p.fill(this.col);
        p.noStroke();
        if (this.stuck) {
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(this.size);
          p.text('X', this.position.x, this.position.y);
        } else {
          p.ellipse(this.position.x, this.position.y, this.size);
        }
  
        // Draw the path
        p.noFill();
        p.stroke(this.col);
        p.beginShape();
        for (let pos of this.path) {
          p.vertex(pos.x, pos.y);
        }
        p.endShape();
      }
  
      getGradient(x, y) {
        // Get the gradient of the terrain at the current position with wrapping
        let x0 = (Math.floor(x) + terrainWidth) % terrainWidth;
        let y0 = (Math.floor(y) + terrainHeight) % terrainHeight;
        let xL = (x0 - 1 + terrainWidth) % terrainWidth;
        let xR = (x0 + 1) % terrainWidth;
        let yU = (y0 - 1 + terrainHeight) % terrainHeight;
        let yD = (y0 + 1) % terrainHeight;
  
        let hL = this.getHeight(xL, y0);
        let hR = this.getHeight(xR, y0);
        let hU = this.getHeight(x0, yU);
        let hD = this.getHeight(x0, yD);
  
        let dx = (hR - hL) / 2;
        let dy = (hD - hU) / 2;
  
        return p.createVector(dx, dy);
      }
  
      getHeight(x, y) {
        x = (Math.floor(x) + terrainWidth) % terrainWidth;
        y = (Math.floor(y) + terrainHeight) % terrainHeight;
        return heights[x][y]; // Return the normalized height value
      }
  
      getRadialDistance() {
        // Calculate radial distance considering wrapping
        let dx = Math.min(Math.abs(this.position.x - this.startPosition.x), terrainWidth - Math.abs(this.position.x - this.startPosition.x));
        let dy = Math.min(Math.abs(this.position.y - this.startPosition.y), terrainHeight - Math.abs(this.position.y - this.startPosition.y));
        return Math.sqrt(dx * dx + dy * dy);
      }
    }
  
    function drawPhaseSpaceData() {
      // Plot radial distance vs. velocity for each ball
      for (let ball of balls) {
        phaseSpace.stroke(ball.col);
        phaseSpace.noFill();
        phaseSpace.beginShape();
        for (let i = 0; i < ball.path.length; i++) {
          let v = ball.velocity.mag();
          let r = ball.radialDistance;
  
          let x = p.map(r, 0, maxRadialDistance, 50, phaseSpace.width - 50);
          let y = p.map(v, 0, 10, phaseSpace.height - 50, 50);
  
          phaseSpace.vertex(x, y);
        }
        phaseSpace.endShape();
  
        // Draw current point as a larger dot or 'X' if stuck
        let v = ball.velocity.mag();
        let r = ball.radialDistance;
        let x = p.map(r, 0, maxRadialDistance, 50, phaseSpace.width - 50);
        let y = p.map(v, 0, 10, phaseSpace.height - 50, 50);
  
        if (ball.stuck) {
          phaseSpace.fill(ball.col);
          phaseSpace.noStroke();
          phaseSpace.textAlign(p.CENTER, p.CENTER);
          phaseSpace.textSize(12);
          phaseSpace.text('X', x, y);
        } else {
          phaseSpace.fill(ball.col);
          phaseSpace.noStroke();
          phaseSpace.ellipse(x, y, 8, 8);
        }
      }
    }
  
    function drawPhaseSpaceAxes() {
      phaseSpace.push();
      phaseSpace.stroke(0);
      phaseSpace.strokeWeight(1);
      phaseSpace.fill(0);
      phaseSpace.textAlign(p.CENTER, p.CENTER);
  
      // Draw axes
      // X-axis (Radial Distance from Start)
      phaseSpace.line(
        50,
        phaseSpace.height - 50,
        phaseSpace.width - 50,
        phaseSpace.height - 50
      );
      // Y-axis (Velocity)
      phaseSpace.line(50, phaseSpace.height - 50, 50, 50);
  
      // Labels
      phaseSpace.text(
        'Radial Distance',
        phaseSpace.width / 2,
        phaseSpace.height - 20
      );
      phaseSpace.push();
      phaseSpace.translate(20, phaseSpace.height / 2); // Adjusted position
      phaseSpace.rotate(-p.HALF_PI);
      phaseSpace.text('Velocity', 0, 0);
      phaseSpace.pop();
  
      // Title
      phaseSpace.text('Phase Space', phaseSpace.width / 2, 20);
  
      phaseSpace.pop();
    }
  
    // Handle window resize
    p.windowResized = function () {
      const canvasContainer = document.getElementById('canvas-container');
      p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
      // Also resize the phaseSpace graphics
      phaseSpace = p.createGraphics(p.width / 2, p.height);
      phaseSpace.pixelDensity(1);
      if (terrainGenerated) {
        // Regenerate terrain at new size
        createLandscape();
      }
    };
  };
  