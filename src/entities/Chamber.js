import * as THREE from 'three';
import { CrystalShader, NonNewtonianFluidShader } from '../shaders/EchoShaders.js';

/**
 * Non-Euclidean surreal chamber with destructible crystalline resonance pylons
 */
export class Chamber {
  constructor(scene) {
    this.scene = scene;
    this.pylons = [];
    this.debrisParticles = null;
    this.debrisVelocities = [];

    this.buildChamberRoom();
    this.buildNonNewtonianFluidStream();
    this.buildResonancePylons();
    this.buildChaosDebrisSystem();
  }

  buildChamberRoom() {
    // Non-Euclidean Hall Geometry
    const roomGeo = new THREE.BoxGeometry(32, 22, 32);
    const roomMat = new THREE.MeshStandardMaterial({
      color: 0x070612,
      metalness: 0.9,
      roughness: 0.25,
      side: THREE.BackSide
    });
    const room = new THREE.Mesh(roomGeo, roomMat);
    room.position.y = 8;
    this.scene.add(room);

    // Glowing Geometric Floor Inlays
    const gridHelper = new THREE.GridHelper(30, 15, 0x00f0ff, 0x3b0764);
    gridHelper.position.y = 0.02;
    this.scene.add(gridHelper);
  }

  buildNonNewtonianFluidStream() {
    // Arching gravitational fluid curve
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-12, 1, -10),
      new THREE.Vector3(-6, 9, -8),
      new THREE.Vector3(0, 12, -4),
      new THREE.Vector3(8, 7, -9),
      new THREE.Vector3(12, 2, -12)
    ]);

    const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.35, 12, false);
    this.fluidMat = new THREE.ShaderMaterial({
      vertexShader: NonNewtonianFluidShader.vertexShader,
      fragmentShader: NonNewtonianFluidShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(NonNewtonianFluidShader.uniforms),
      transparent: true,
      side: THREE.DoubleSide
    });

    const streamMesh = new THREE.Mesh(tubeGeo, this.fluidMat);
    this.scene.add(streamMesh);
  }

  buildResonancePylons() {
    // 3 Crystalline Puzzle Pylons to be shattered
    const pylonPositions = [
      new THREE.Vector3(-4.5, 0, -8),
      new THREE.Vector3(0, 0, -11),
      new THREE.Vector3(4.5, 0, -8)
    ];

    pylonPositions.forEach((pos, index) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      // Crystalline Obelisk
      const crystalGeo = new THREE.ConeGeometry(0.8, 4.2, 5);
      crystalGeo.translate(0, 2.1, 0);

      this.crystalMat = new THREE.ShaderMaterial({
        vertexShader: CrystalShader.vertexShader,
        fragmentShader: CrystalShader.fragmentShader,
        uniforms: THREE.UniformsUtils.clone(CrystalShader.uniforms),
        transparent: true
      });

      const mesh = new THREE.Mesh(crystalGeo, this.crystalMat);
      group.add(mesh);

      // Bioluminescent Conduit Base
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        metalness: 0.9
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.3;
      group.add(base);

      this.scene.add(group);
      this.pylons.push({
        id: index,
        group,
        destroyed: false,
        boundingSphere: new THREE.Sphere(new THREE.Vector3(pos.x, 2.1, pos.z), 1.6)
      });
    });
  }

  buildChaosDebrisSystem() {
    // 150 Instanced Shards & Gears flying upon kinetic impact
    const count = 160;
    const shardGeo = new THREE.TetrahedronGeometry(0.18, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0xd946ef,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.1
    });

    this.debrisParticles = new THREE.InstancedMesh(shardGeo, shardMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.set(0, -999, 0); // Hide initially
      dummy.updateMatrix();
      this.debrisParticles.setMatrixAt(i, dummy.matrix);
      this.debrisVelocities.push(new THREE.Vector3());
    }

    this.debrisParticles.instanceMatrix.needsUpdate = true;
    this.scene.add(this.debrisParticles);
  }

  triggerPylonShatter(pylon) {
    if (pylon.destroyed) return;
    pylon.destroyed = true;
    pylon.group.visible = false;

    // Spawn Chaos Shards
    const dummy = new THREE.Object3D();
    const origin = pylon.group.position.clone().add(new THREE.Vector3(0, 2.1, 0));

    for (let i = 0; i < 50; i++) {
      const idx = (pylon.id * 50) + i;
      dummy.position.copy(origin);
      dummy.updateMatrix();
      this.debrisParticles.setMatrixAt(idx, dummy.matrix);

      // Random kinetic explosion velocity
      this.debrisVelocities[idx].set(
        (Math.random() - 0.5) * 8.0,
        Math.random() * 6.0 + 2.0,
        (Math.random() - 0.5) * 8.0
      );
    }
    this.debrisParticles.instanceMatrix.needsUpdate = true;
  }

  update(time, delta) {
    this.fluidMat.uniforms.uTime.value = time;
    this.crystalMat.uniforms.uTime.value = time;

    // Simulate Shattered Debris Physics
    if (this.debrisParticles) {
      const dummy = new THREE.Object3D();
      let needsUpdate = false;

      for (let i = 0; i < this.debrisVelocities.length; i++) {
        const vel = this.debrisVelocities[i];
        if (vel.lengthSq() > 0.01) {
          needsUpdate = true;
          this.debrisParticles.getMatrixAt(i, dummy.matrix);
          dummy.position.setFromMatrixPosition(dummy.matrix);

          // Apply Gravity & Velocity
          vel.y -= 9.8 * delta * 0.5;
          dummy.position.addScaledVector(vel, delta);

          // Floor bounce
          if (dummy.position.y < 0.1) {
            dummy.position.y = 0.1;
            vel.y *= -0.5;
            vel.x *= 0.8;
            vel.z *= 0.8;
          }

          dummy.rotation.x += delta * 4;
          dummy.rotation.y += delta * 5;
          dummy.updateMatrix();
          this.debrisParticles.setMatrixAt(i, dummy.matrix);
        }
      }
      if (needsUpdate) {
        this.debrisParticles.instanceMatrix.needsUpdate = true;
      }
    }
  }
}
