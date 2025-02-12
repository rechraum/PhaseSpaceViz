const doublePendulumSketch = (p) => {
    // Pendulum parameters
    let m1 = 10; // Mass of first pendulum
    let m2 = 10; // Mass of second pendulum
    let l1 = 150; // Length of first pendulum
    let l2 = 150; // Length of second pendulum
    let a1 = Math.PI / 2; // Angle of first pendulum
    let a2 = Math.PI / 2; // Angle of second pendulum
    let a1_v = 0; // Angular velocity of first pendulum
    let a2_v = 0; // Angular velocity of second pendulum
    let g = 1; // Gravitational acceleration
    let damping = 0.999; // Damping factor
  
    // Simulation control
    let isPaused = false;
    let isRunning = false;
  
    // DOM elements
    let startButton, pauseButton, resetButton;
    let mass1Slider, mass2Slider, length1Slider, length2Slider, dampingSlider;
    let initialAngleSlider; // New slider
    let presetSelect;
  
    // Visualization parameters
    let pendulum1Color;
    let pendulum2Color;
    let phaseSpacePaths1 = [];
    let phaseSpacePaths2 = [];
    let poincarePoints = [];
  
    // Canvas dimensions
    let canvasWidth = 1200;
    let canvasHeight = 400; // Adjusted canvas height
  
    // Phase space scaling
    let angleRange = p.PI; // Range for angle (-PI to PI)
    let angularVelocityRange = 1; // Adjusted max angular velocity (reduced by ~5x)
  
    p.setup = function () {
      const canvas = p.createCanvas(canvasWidth, canvasHeight);
      canvas.parent("canvas-container");
  
      // Get references to DOM elements
      startButton = document.getElementById("dp-start-button");
      pauseButton = document.getElementById("dp-pause-button");
      resetButton = document.getElementById("dp-reset-button");
      mass1Slider = document.getElementById("mass1-slider");
      mass2Slider = document.getElementById("mass2-slider");
      length1Slider = document.getElementById("length1-slider");
      length2Slider = document.getElementById("length2-slider");
      dampingSlider = document.getElementById("damping-slider");
      initialAngleSlider = document.getElementById("initial-angle-slider"); // New slider
      presetSelect = document.getElementById("preset-select");
  
      // Attach event listeners
      startButton.addEventListener("click", startSimulation);
      pauseButton.addEventListener("click", togglePause);
      resetButton.addEventListener("click", resetSimulation);
      mass1Slider.addEventListener("input", updateParameters);
      mass2Slider.addEventListener("input", updateParameters);
      length1Slider.addEventListener("input", updateParameters);
      length2Slider.addEventListener("input", updateParameters);
      dampingSlider.addEventListener("input", updateParameters);
      initialAngleSlider.addEventListener("input", updateParameters);
      presetSelect.addEventListener("change", applyPreset);
  
      // Initialize pendulum colors
      pendulum1Color = p.color(255, 0, 0); // Red
      pendulum2Color = p.color(0, 0, 255); // Blue
  
      // Initialize pendulum
      resetPendulum();
  
      // Show pendulum controls (if hidden by default)
      const controls = document.getElementById("doublePendulum-controls");
      if (controls) controls.style.display = "block";
    };
  
    p.draw = function () {
      p.background(255);
  
      // Draw dividers
      p.stroke(0);
      p.line(canvasWidth / 3, 0, canvasWidth / 3, canvasHeight);
      p.line((2 * canvasWidth) / 3, 0, (2 * canvasWidth) / 3, canvasHeight);
  
      // Update pendulum if running and not paused
      if (isRunning && !isPaused) {
        updatePendulum();
      }
  
      // Left Panel: Draw Double Pendulum
      p.push();
      p.translate(canvasWidth / 6, canvasHeight / 3);
      drawDoublePendulum();
      p.pop();
  
      // Middle Panel: Draw Phase Space
      p.push();
      p.translate(canvasWidth / 2, canvasHeight / 2);
      drawPhaseSpace();
      p.pop();
  
      // Right Panel: Draw Poincaré Section
      p.push();
      p.translate((5 * canvasWidth) / 6, canvasHeight / 2);
      drawPoincareSection();
      p.pop();
  
      // Draw labels
      p.fill(0);
      p.noStroke();
      p.textSize(16);
      p.textAlign(p.CENTER);
      p.text("Double Pendulum", canvasWidth / 6, 30);
      p.text("Phase Space", canvasWidth / 2, 30);
      p.text("Poincaré Section", (5 * canvasWidth) / 6, 30);
    };
  
    function resetPendulum() {
      a1_v = 0;
      a2_v = 0;
      phaseSpacePaths1 = [];
      phaseSpacePaths2 = [];
      poincarePoints = [];
  
      // Use initial angle from slider
      let initialAngleDeg = parseFloat(initialAngleSlider.value);
      let initialAngleRad = p.radians(initialAngleDeg);
      a1 = initialAngleRad;
      a2 = initialAngleRad;
    }
  
    function updatePendulum() {
      // Equations of motion for double pendulum
      let num1 = -g * (2 * m1 + m2) * Math.sin(a1);
      let num2 = -m2 * g * Math.sin(a1 - 2 * a2);
      let num3 = -2 * Math.sin(a1 - a2) * m2;
      let num4 = a2_v * a2_v * l2 + a1_v * a1_v * l1 * Math.cos(a1 - a2);
      let den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
      let a1_a = (num1 + num2 + num3 * num4) / den;
  
      num1 = 2 * Math.sin(a1 - a2);
      num2 = a1_v * a1_v * l1 * (m1 + m2);
      num3 = g * (m1 + m2) * Math.cos(a1);
      num4 = a2_v * a2_v * l2 * m2 * Math.cos(a1 - a2);
      den = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
      let a2_a = (num1 * (num2 + num3 + num4)) / den;
  
      // Update velocities and angles
      a1_v += a1_a;
      a2_v += a2_a;
      a1_v *= damping;
      a2_v *= damping;
      a1 += a1_v;
      a2 += a2_v;
  
      // Record phase space trajectories
      phaseSpacePaths1.push({ angle: a1, angularVelocity: a1_v });
      phaseSpacePaths2.push({ angle: a2, angularVelocity: a2_v });
  
      // Limit path length
      if (phaseSpacePaths1.length > 2000) {
        phaseSpacePaths1.shift();
        phaseSpacePaths2.shift();
      }
  
      // Record Poincaré section when a1 crosses zero from negative to positive
      let len = phaseSpacePaths1.length;
      if (
        len > 1 &&
        phaseSpacePaths1[len - 2].angle < 0 &&
        phaseSpacePaths1[len - 1].angle >= 0
      ) {
        poincarePoints.push({
          angle: wrapAngle(a2),
          angularVelocity: a2_v,
        });
      }
    }
  
    function drawDoublePendulum() {
      let x1 = l1 * Math.sin(a1);
      let y1 = l1 * Math.cos(a1);
  
      let x2 = x1 + l2 * Math.sin(a2);
      let y2 = y1 + l2 * Math.cos(a2);
  
      // Draw pendulum 1 arm
      p.stroke(pendulum1Color);
      p.strokeWeight(2);
      p.line(0, 0, x1, y1);
  
      // Draw pendulum 1 bob
      p.fill(pendulum1Color);
      p.ellipse(x1, y1, m1, m1);
  
      // Draw pendulum 2 arm
      p.stroke(pendulum2Color);
      p.strokeWeight(2);
      p.line(x1, y1, x2, y2);
  
      // Draw pendulum 2 bob
      p.fill(pendulum2Color);
      p.ellipse(x2, y2, m2, m2);
  
      // Display parameters at fixed positions
      p.noStroke();
      p.fill(0);
      p.textAlign(p.LEFT);
      p.textSize(14);
      p.text(`Mass 1: ${m1}`, -200, -100);
      p.text(`Mass 2: ${m2}`, -200, -80);
      p.text(`Length 1: ${l1}`, -200, -60);
      p.text(`Length 2: ${l2}`, -200, -40);
      p.text(`Damping: ${damping.toFixed(4)}`, -200, -20);
      p.text(`Initial Angle: ${initialAngleSlider.value}°`, -200, 0);
    }
  
    function drawPhaseSpace() {
      // Draw axes
      p.stroke(0);
      p.strokeWeight(1);
      p.line(-canvasWidth / 6 + 20, 0, canvasWidth / 6 - 20, 0); // Horizontal axis
      p.line(0, -canvasHeight / 2 + 40, 0, canvasHeight / 2 - 40); // Vertical axis
  
      // Label axes
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("Angular Position (rad)", 0, canvasHeight / 2 - 3);
      p.push();
      p.rotate(-p.HALF_PI);
      p.text("Angular Velocity (rad/s)", 0, -canvasWidth / 6 + 15);
      p.pop();
  
      // Draw phase space trajectories
      drawPhaseSpaceTrajectory(
        phaseSpacePaths1,
        pendulum1Color,
        "Pendulum 1"
      );
      drawPhaseSpaceTrajectory(
        phaseSpacePaths2,
        pendulum2Color,
        "Pendulum 2"
      );
    }
  
    function drawPhaseSpaceTrajectory(path, color, label) {
      if (path.length > 1) {
        p.stroke(color);
        p.strokeWeight(1);
        p.noFill();
        p.beginShape();
        for (let point of path) {
          if (
            point.angle !== undefined &&
            point.angularVelocity !== undefined
          ) {
            let x = p.map(
              wrapAngle(point.angle),
              -p.PI,
              p.PI,
              -canvasWidth / 6 + 20,
              canvasWidth / 6 - 20
            );
            let y = p.map(
              point.angularVelocity,
              -angularVelocityRange,
              angularVelocityRange,
              canvasHeight / 2 - 20,
              -canvasHeight / 2 + 20
            );
            p.vertex(x, y);
          }
        }
        p.endShape();
      }
  
      // Draw current position
      if (path.length > 0) {
        let lastPoint = path[path.length - 1];
        if (lastPoint.angle !== undefined && lastPoint.angularVelocity !== undefined) {
          let x = p.map(
            wrapAngle(lastPoint.angle),
            -p.PI,
            p.PI,
            -canvasWidth / 6 + 20,
            canvasWidth / 6 - 20
          );
          let y = p.map(
            lastPoint.angularVelocity,
            -angularVelocityRange,
            angularVelocityRange,
            canvasHeight / 2 - 20,
            -canvasHeight / 2 + 20
          );
          p.fill(color);
          p.noStroke();
          p.ellipse(x, y, 8, 8);
        }
      }
  
      // Label trajectory
      p.noStroke();
      p.fill(color);
      p.textAlign(p.LEFT);
      p.textSize(12);
      let labelYPosition = -canvasHeight / 2 + 20 + (label === "Pendulum 1" ? 0 : 15);
      p.text(label, canvasWidth / 6 - 70, labelYPosition);
    }
  
    function drawPoincareSection() {
      // Draw axes
      p.stroke(0);
      p.strokeWeight(1);
      p.line(-canvasWidth / 6 + 20, 0, canvasWidth / 6 - 20, 0); // Horizontal axis
      p.line(0, -canvasHeight / 2 + 40, 0, canvasHeight / 2 - 40); // Vertical axis
  
      // Label axes
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("Angle of Pendulum 2 (rad)", 0, canvasHeight / 2 - 3);
      p.push();
      p.rotate(-p.HALF_PI);
      p.text("Angular Velocity of Pendulum 2 (rad/s)", 0, -canvasWidth / 6 + 15);
      p.pop();
  
      // Draw points
      if (poincarePoints.length > 0) {
        p.fill(0);
        p.noStroke();
        for (let point of poincarePoints) {
          if (point.angle !== undefined && point.angularVelocity !== undefined) {
            let x = p.map(
              wrapAngle(point.angle),
              -p.PI,
              p.PI,
              -canvasWidth / 6 + 20,
              canvasWidth / 6 - 20
            );
            let y = p.map(
              point.angularVelocity,
              -angularVelocityRange,
              angularVelocityRange,
              canvasHeight / 2 - 20,
              -canvasHeight / 2 + 20
            );
            p.ellipse(x, y, 3, 3);
          }
        }
      }
    }
  
    function wrapAngle(angle) {
      // Using p.atan2 for better angle wrapping
      return p.atan2(p.sin(angle), p.cos(angle));
    }
  
    function startSimulation() {
      isRunning = true;
      isPaused = false;
      pauseButton.textContent = "Pause";
    }
  
    function togglePause() {
      if (isRunning) {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "Resume" : "Pause";
      }
    }
  
    function resetSimulation() {
      isRunning = false;
      isPaused = false;
      resetPendulum();
      pauseButton.textContent = "Pause";
    }
  
    function updateParameters() {
      m1 = parseFloat(mass1Slider.value);
      m2 = parseFloat(mass2Slider.value);
      l1 = parseFloat(length1Slider.value);
      l2 = parseFloat(length2Slider.value);
      damping = parseFloat(dampingSlider.value);

      console.log("Updated damping value:", damping);
  
      // Update initial angle
      let initialAngleDeg = parseFloat(initialAngleSlider.value);
      let initialAngleRad = p.radians(initialAngleDeg);
      a1 = initialAngleRad;
      a2 = initialAngleRad;
  
      // If simulation is not running, reset pendulum to apply new initial angle
      if (!isRunning) {
        resetPendulum();
      }
    }
  
    function applyPreset() {
      const preset = presetSelect.value;
      if (preset === "periodic") {
        mass1Slider.value = 10;
        mass2Slider.value = 10;
        length1Slider.value = 150;
        length2Slider.value = 150;
        dampingSlider.value = 0.999;
        initialAngleSlider.value = 90;
        a1_v = 0;
        a2_v = 0;
      } else if (preset === "chaotic") {
        mass1Slider.value = 10;
        mass2Slider.value = 10;
        length1Slider.value = 150;
        length2Slider.value = 150;
        dampingSlider.value = 0.999;
        initialAngleSlider.value = 90;
        a1_v = 0;
        a2_v = 0.01;
      }
      updateParameters();
      resetSimulation();
      startSimulation();
    }
  };
  
  // Instantiate the sketch
  new p5(doublePendulumSketch);
  
