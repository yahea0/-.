import * as THREE from 'three';
import { SpacetimeDistortionShader } from '../shaders/EchoShaders.js';

/**
 * Stylized Gravity-Manipulating Sphere suspended mid-air
 */
export class EchoSphere {
  constructor(scene) {
    this.scene = scene;
    this.isFrozen = true;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.storedImpulses = [];
    this.chargePercentage = 0;

    this.group = new THREE.Group();
    this.group.position.set(0, 2.2, -6.5);

    this.buildSphere();
    this.scene.add(this.group);
  }

  buildSphere() {
    // Core Gravity Sphere
    const coreGeo = new THREE.IcosahedronGeometry(0.65, 4);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x060612,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.3
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.group.add(this.coreMesh);

    // Orbiting Geometric Rings
    const ringGeo = new THREE.TorusGeometry(0.9, 0.02, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });

    this.ring1 = new THREE.Mesh(ringGeo, ringMat);
    this.ring2 = new THREE.Mesh(ringGeo, ringMat);
    this.ring2.rotation.x = Math.PI / 2;
    this.group.add(this.ring1);
    this.group.add(this.ring2);

    // Spacetime 'Echo' Distortion Envelope
    const distortionGeo = new THREE.SphereGeometry(1.2, 32, 32);
    this.distortionMat = new THREE.ShaderMaterial({
      vertexShader: SpacetimeDistortionShader.vertexShader,
      fragmentShader: SpacetimeDistortionShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(SpacetimeDistortionShader.uniforms),
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.distortionField = new THREE.Mesh(distortionGeo, this.distortionMat);
    this.group.add(this.distortionField);
  }

  toggleStasis() {
    this.isFrozen = !this.isFrozen;
    const readout = document.getElementById('stasis-status');

    if (this.isFrozen) {
      this.distortionField.visible = true;
      this.distortionMat.uniforms.uDistortionIntensity.value = 1.0;
      this.coreMat.emissive.setHex(0xd946ef);
      readout.textContent = "LOCKED [STASIS]";
      readout.className = "val magenta-glow";
    } else {
      // Release stored kinetic force
      this.distortionField.visible = false;
      this.coreMat.emissive.setHex(0x00f0ff);
      readout.textContent = "KINETIC DISCHARGE";
      readout.className = "val cyan-glow";
      this.dischargeStoredForce();
    }
    return this.isFrozen;
  }

  injectKineticPulse(aimDirection) {
    if (this.isFrozen) {
      // Accumulate impulse vector
      this.storedImpulses.push(aimDirection.clone().multiplyScalar(0.45));
      this.chargePercentage = Math.min(100, this.chargePercentage + 25);
      this.updateHUD();

      // Visual reaction to pulse hit
      this.coreMat.emissiveIntensity = 2.0;
    } else {
      // Direct push
      this.velocity.add(aimDirection.multiplyScalar(0.35));
    }
  }

  dischargeStoredForce() {
    this.velocity.set(0, 0, 0);
    this.storedImpulses.forEach(impulse => {
      this.velocity.add(impulse);
    });
    this.storedImpulses = [];
    this.chargePercentage = 0;
    this.updateHUD();
  }

  updateHUD() {
    const fill = document.getElementById('kinetic-fill');
    const numeric = document.getElementById('kinetic-numeric');
    if (fill && numeric) {
      fill.style.width = `${this.chargePercentage}%`;
      numeric.textContent = `${this.chargePercentage}% STORED FORCE`;
    }
  }

  update(time, delta) {
    this.distortionMat.uniforms.uTime.value = time;

    // Ring rotations
    this.ring1.rotation.y = time * 0.8;
    this.ring2.rotation.z = time * 0.6;

    if (this.isFrozen) {
      // Slight floating stasis oscillation
      this.group.position.y = 2.2 + Math.sin(time * 3.0) * 0.08;
    } else {
      // Physics flight
      this.group.position.addScaledVector(this.velocity, delta * 30.0);
      this.velocity.multiplyScalar(0.985); // Space drag

      // Boundary rebounds
      ['x', 'y', 'z'].forEach(axis => {
        if (Math.abs(this.group.position[axis]) > 14) {
          this.velocity[axis] *= -0.8;
        }
      });
    }

    // Decay flash
    if (this.coreMat.emissiveIntensity > 0.3) {
      this.coreMat.emissiveIntensity -= delta * 3.0;
    }
  }
}
