import * as THREE from 'three';
import { MobileTouchControls } from './controls/MobileTouchControls.js';
import { Gauntlet } from './entities/Gauntlet.js';
import { EchoSphere } from './entities/EchoSphere.js';
import { Chamber } from './entities/Chamber.js';
import { SoundFX } from './audio/SoundFX.js';

/**
 * Main Application Orchestrator
 * High-performance 3D loop optimized for Realme GT Master Edition 120Hz display
 */
class GravityEchoApp {
  constructor() {
    this.container = document.getElementById('game-canvas-container');
    this.clock = new THREE.Clock();

    this.initEngine();
    this.initLighting();
    this.initWorld();
    this.initInputs();
    this.setupResizeListener();

    // Start Procedural Loop
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);

    // Audio ambience activation on first user contact
    window.addEventListener('touchstart', () => {
      SoundFX.startChamberAmbience();
    }, { once: true });
  }

  initEngine() {
    // WebGL2 Renderer configured for mobile battery & high refresh rate
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020108, 0.035);

    this.camera = new THREE.PerspectiveCamera(
      72,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 2.5);
    this.scene.add(this.camera);
  }

  initLighting() {
    // Dynamic Lumen-Style Bounce Simulation
    const ambientLight = new THREE.AmbientLight(0x0c0b20, 1.8);
    this.scene.add(ambientLight);

    // Bioluminescent Electric Blue Source
    this.cyanPointLight = new THREE.PointLight(0x00f0ff, 3.5, 25);
    this.cyanPointLight.position.set(-6, 8, -5);
    this.scene.add(this.cyanPointLight);

    // Neon Purple Stasis Field Light
    this.purplePointLight = new THREE.PointLight(0xd946ef, 3.0, 22);
    this.purplePointLight.position.set(6, 6, -7);
    this.scene.add(this.purplePointLight);
  }

  initWorld() {
    this.chamber = new Chamber(this.scene);
    this.echoSphere = new EchoSphere(this.scene);
    this.gauntlet = new Gauntlet(this.camera);
  }

  initInputs() {
    this.touchControls = new MobileTouchControls(
      this.camera,
      this.renderer.domElement,
      () => this.handlePulseAction(),
      () => this.handleStasisAction()
    );
  }

  handlePulseAction() {
    SoundFX.playPulseSound();
    this.gauntlet.triggerRecoil();

    // Raycast direction along camera orientation
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    // Check hit on Echo Sphere
    const spherePos = this.echoSphere.group.position;
    const toSphere = spherePos.clone().sub(this.camera.position);
    const dot = dir.dot(toSphere.clone().normalize());

    // Aimed directly at the gravity sphere
    if (dot > 0.94) {
      this.echoSphere.injectKineticPulse(dir);
    }
  }

  handleStasisAction() {
    const isFrozen = this.echoSphere.toggleStasis();
    SoundFX.playStasisSound(isFrozen);
  }

  checkPuzzleCollisions() {
    const sphereBox = new THREE.Sphere(this.echoSphere.group.position, 0.85);

    this.chamber.pylons.forEach(pylon => {
      if (!pylon.destroyed && sphereBox.intersectsSphere(pylon.boundingSphere)) {
        this.chamber.triggerPylonShatter(pylon);
        SoundFX.playShatterSound();
        this.touchControls.triggerHaptic();

        // Update Remaining Count
        const remaining = this.chamber.pylons.filter(p => !p.destroyed).length;
        const countDisplay = document.getElementById('pylons-count');
        if (countDisplay) {
          countDisplay.textContent = `${remaining} / 3`;
        }

        if (remaining === 0) {
          const directive = document.getElementById('directive-text');
          if (directive) {
            directive.textContent = "CHAMBER COMPLETE: ALL RESONANCE PYLONS DESTABILIZED. GRAVITATIONAL EQUILIBRIUM ACHIEVED.";
            directive.style.color = "#00f0ff";
          }
        }
      }
    });
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  render() {
    requestAnimationFrame(this.render);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.getElapsedTime();

    // Update Controls & Movement
    this.touchControls.updateMovement(0.12);

    // Update Entities
    this.gauntlet.update(time);
    this.echoSphere.update(time, delta);
    this.chamber.update(time, delta);

    // Physics Resolution
    this.checkPuzzleCollisions();

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate Mobile Engine
window.addEventListener('DOMContentLoaded', () => {
  new GravityEchoApp();
});
