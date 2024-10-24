// LorenzAttractor.js
const lorenzSketch = (p) => {
    // Parameters for the Lorenz attractor
    let sigma = 10;
    let rho = 28;
    let beta = 8 / 3;
  
    // DOM elements
    let sigmaInput, rhoInput, betaInput;
    let standardButton, bifurcationButton, chaosButton;
    let pauseButton, restartButton;
    let resetViewButton;

  
    // Simulation control
    let isPaused = false;
  
    // Arrays to hold multiple particles for the chaos demonstration
    let particles = [];
    let numParticles = 1;
  
    // Equilibrium points
    let equilibriumPoints = [];
  
    p.setup = function() {
      const canvasContainer = document.getElementById('canvas-container');
      const canvasWidth = canvasContainer.offsetWidth;
      const canvasHeight = canvasContainer.offsetHeight;
  
      const canvas = p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);
      canvas.parent("canvas-container");
  
      p.colorMode(p.HSB, 360, 100, 100, 255);
  
      // Get references to DOM elements
      sigmaInput = document.getElementById('sigma-input');
      rhoInput = document.getElementById('rho-input');
      betaInput = document.getElementById('beta-input');
  
      standardButton = document.getElementById('lorenz-standard-parameters');
      bifurcationButton = document.getElementById('lorenz-bifurcation-visualization');
      chaosButton = document.getElementById('lorenz-chaos-demonstration');
      pauseButton = document.getElementById('lorenz-pause-button');
      restartButton = document.getElementById('lorenz-restart-button');
      resetViewButton = document.getElementById('lorenz-reset-view-button');
  
      // Attach event listeners
      sigmaInput.addEventListener('change', updateParameters);
      rhoInput.addEventListener('change', updateParameters);
      betaInput.addEventListener('change', updateParameters);
  
      standardButton.addEventListener('click', () => {
        numParticles = 1;
        setParameters(10, 28, 8 / 3);
      });
  
      bifurcationButton.addEventListener('click', () => {
        numParticles = 1;
        setParameters(10, 99.96, 8 / 3);
      });
  
      chaosButton.addEventListener('click', () => {
        numParticles = 3;
        setParameters(10, 28, 8 / 3);
      });
  
      pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
      });
  
      restartButton.addEventListener('click', () => {
        resetSimulation();
      });

      resetViewButton.addEventListener('click', resetView);
  
      resetSimulation();
    };
  
    p.draw = function() {
        p.background(0);
        p.orbitControl();
      
        // Draw axes
        drawAxes();
      
        p.scale(5);
        p.noFill();
      
        if (!isPaused) {
          // Update the Lorenz attractor(s)
          for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
      
            // Update Lorenz equations
            for (let j = 0; j < 5; j++) { // Increase iterations for smoother lines
              let dt = 0.01;
              let dx = sigma * (particle.y - particle.x) * dt;
              let dy = (particle.x * (rho - particle.z) - particle.y) * dt;
              let dz = (particle.x * particle.y - beta * particle.z) * dt;
              particle.x += dx;
              particle.y += dy;
              particle.z += dz;
              particle.path.push(new p5.Vector(particle.x, particle.y, particle.z));
              if (particle.path.length > 2000) {
                particle.path.shift();
              }
            }
          }
        }
      
        // Draw the Lorenz attractor(s)
        for (let i = 0; i < particles.length; i++) {
          let particle = particles[i];
      
          // Set stroke color based on particle index
          p.stroke((360 / particles.length) * i, 100, 100);
      
          p.beginShape();
          for (let v of particle.path) {
            p.vertex(v.x, v.y, v.z);
          }
          p.endShape();
        }
      
        // Draw equilibrium points
        p.push();
        p.noStroke();
        p.fill(60, 100, 100, 150); // Partially transparent yellow
        for (let eq of equilibriumPoints) {
          p.push();
          p.translate(eq.x, eq.y, eq.z); // Adjust scaling
          p.sphere(1); // Adjust size as needed
          p.pop();
        }
        p.pop();
      };
      
  
    function updateParameters() {
      sigma = parseFloat(sigmaInput.value) || sigma;
      rho = parseFloat(rhoInput.value) || rho;
      beta = parseFloat(betaInput.value) || beta;
      numParticles = 1; // Reset to 1 particle when parameters change
      resetSimulation();
    }
  
    function setParameters(newSigma, newRho, newBeta) {
      sigma = newSigma;
      rho = newRho;
      beta = newBeta;
  
      // Update input fields
      sigmaInput.value = sigma;
      rhoInput.value = rho;
      betaInput.value = beta;
  
      resetSimulation();
    }
  
    function resetSimulation() {
      particles = [];
      if (numParticles === 1) {
        particles.push({
          x: 0.01,
          y: 0,
          z: 0,
          path: []
        });
      } else {
        // For chaos demonstration, initialize particles with slightly different initial conditions
        for (let i = 0; i < numParticles; i++) {
          particles.push({
            x: 0.01 + p.random(-0.01, 0.01),
            y: 0 + p.random(-0.01, 0.01),
            z: 0 + p.random(-0.01, 0.01),
            path: []
          });
        }
      }
      calculateEquilibriumPoints();
    }
  
    function calculateEquilibriumPoints() {
      equilibriumPoints = [];
      if (rho > 1) {
        let temp = beta * (rho - 1);
        if (temp >= 0) {
          let x0 = Math.sqrt(temp);
          let y0 = x0;
          let z0 = rho - 1;
  
          equilibriumPoints.push({ x: x0, y: x0, z: z0 });
          equilibriumPoints.push({ x: -x0, y: -x0, z: z0 });
        }
      }
      // Origin is always an equilibrium point
      equilibriumPoints.push({ x: 0, y: 0, z: 0 });
    }
  
    function drawAxes() {
      let axisLength = 200;
  
      p.push();
      p.stroke(255); // White color
      p.strokeWeight(1);
      // X-axis
      p.line(-axisLength, 0, 0, axisLength, 0, 0);
      // Y-axis
      p.line(0, -axisLength, 0, 0, axisLength, 0);
      // Z-axis
      p.line(0, 0, -axisLength, 0, 0, axisLength);
      p.pop();
    }

    function resetView() {
        // Reset the camera to its default position and orientation
        p.camera(); // Resets the camera parameters to default
    }        
  };
  
  