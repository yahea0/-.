import * as THREE from 'three';

/**
 * First-person gravitational gauntlet gripping the lower right frame
 */
export class Gauntlet {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.recoilOffset = 0;

    this.buildGauntletMesh();
    this.camera.add(this.group);

    // Initial position in bottom-right view frame
    this.basePosition = new THREE.Vector3(0.38, -0.28, -0.6);
    this.group.position.copy(this.basePosition);
    this.group.rotation.set(0.1, -0.25, 0.05);
  }

  buildGauntletMesh() {
    // Gauntlet Arm Chassis
    const armGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.55, 12);
    armGeo.rotateX(Math.PI / 2);
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      metalness: 0.9,
      roughness: 0.2
    });
    const armMesh = new THREE.Mesh(armGeo, darkMetal);
    this.group.add(armMesh);

    // Iridescent Plating
    const plateGeo = new THREE.BoxGeometry(0.15, 0.04, 0.4);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c2b,
      metalness: 0.95,
      roughness: 0.15
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, 0.08, 0);
    this.group.add(plateMesh);

    // Pulsing Bioluminescent Conduit
    const conduitGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
    conduitGeo.rotateX(Math.PI / 2);
    this.conduitMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });
    const conduitMesh = new THREE.Mesh(conduitGeo, this.conduitMat);
    conduitMesh.position.set(0.04, 0.09, -0.02);
    this.group.add(conduitMesh);

    // Gravitational Emitter Ring on Gauntlet Tip
    const ringGeo = new THREE.TorusGeometry(0.055, 0.012, 16, 24);
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 0.8,
      metalness: 0.8
    });
    this.emitterRing = new THREE.Mesh(ringGeo, this.ringMat);
    this.emitterRing.position.set(0, 0.03, -0.29);
    this.group.add(this.emitterRing);

    // Targeting Laser Ray
    const rayGeo = new THREE.CylinderGeometry(0.002, 0.002, 10, 6);
    rayGeo.rotateX(Math.PI / 2);
    rayGeo.translate(0, 0, -5);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45
    });
    this.laser = new THREE.Mesh(rayGeo, rayMat);
    this.laser.position.set(0, 0.03, -0.3);
    this.group.add(this.laser);
  }

  triggerRecoil() {
    this.recoilOffset = 0.12;
  }

  update(time) {
    // Pulse conduit glow
    const pulse = Math.sin(time * 6.0) * 0.4 + 0.6;
    this.conduitMat.color.setRGB(0, 0.94 * pulse, pulse);

    // Gauntlet breathing sway + recoil recovery
    this.recoilOffset *= 0.85;
    const swayX = Math.sin(time * 1.5) * 0.008;
    const swayY = Math.cos(time * 2.2) * 0.008;

    this.group.position.set(
      this.basePosition.x + swayX,
      this.basePosition.y + swayY,
      this.basePosition.z + this.recoilOffset
    );
  }
}
