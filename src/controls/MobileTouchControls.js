import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Mobile Touch & Dual Joystick Manager
 * Handles multi-touch look and movement, with Haptic feedback on Android 13.
 */
export class MobileTouchControls {
  constructor(camera, domElement, onPulse, onStasis) {
    this.camera = camera;
    this.domElement = domElement;
    this.onPulse = onPulse;
    this.onStasis = onStasis;

    this.moveVector = { x: 0, z: 0 };
    this.isLooking = false;
    this.lookTouchId = null;
    this.previousTouch = { x: 0, y: 0 };

    this.pitch = 0;
    this.yaw = 0;

    this.joystickZone = document.getElementById('joystick-boundary');
    this.joystickKnob = document.getElementById('joystick-knob');
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };

    this.initTouchEvents();
    this.initActionButtons();
  }

  // Trigger Android Vibration
  async triggerHaptic(style = ImpactStyle.Medium) {
    try {
      await Haptics.impact({ style });
    } catch {
      // Fallback if running outside native container
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
  }

  initTouchEvents() {
    // Touch Joystick (Left Screen Area)
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      const rect = this.joystickZone.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystick(touch.clientX, touch.clientY);
        } else if (touch.identifier === this.lookTouchId) {
          const deltaX = touch.clientX - this.previousTouch.x;
          const deltaY = touch.clientY - this.previousTouch.y;

          this.yaw -= deltaX * 0.0035;
          this.pitch -= deltaY * 0.0035;
          this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));

          this.camera.rotation.order = 'YXZ';
          this.camera.rotation.y = this.yaw;
          this.camera.rotation.x = this.pitch;

          this.previousTouch.x = touch.clientX;
          this.previousTouch.y = touch.clientY;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.moveVector.x = 0;
          this.moveVector.z = 0;
          this.joystickKnob.style.transform = 'translate(0px, 0px)';
        } else if (touch.identifier === this.lookTouchId) {
          this.lookTouchId = null;
          this.isLooking = false;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    // Free Look Touch on Right Screen Area
    this.domElement.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.35 && this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this.previousTouch.x = touch.clientX;
          this.previousTouch.y = touch.clientY;
          this.isLooking = true;
          break;
        }
      }
    });
  }

  updateJoystick(clientX, clientY) {
    const maxRadius = 38;
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(distance, maxRadius);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    this.moveVector.x = knobX / maxRadius;
    this.moveVector.z = knobY / maxRadius;
  }

  initActionButtons() {
    const pulseBtn = document.getElementById('btn-pulse');
    const stasisBtn = document.getElementById('btn-stasis');

    pulseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.triggerHaptic(ImpactStyle.Heavy);
      this.onPulse();
    });

    stasisBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.triggerHaptic(ImpactStyle.Medium);
      this.onStasis();
    });
  }

  updateMovement(speed = 0.12) {
    if (this.moveVector.x !== 0 || this.moveVector.z !== 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.camera.position.addScaledVector(forward, -this.moveVector.z * speed);
      this.camera.position.addScaledVector(right, this.moveVector.x * speed);

      // Chamber Bounds
      this.camera.position.x = Math.max(-14, Math.min(14, this.camera.position.x));
      this.camera.position.z = Math.max(-14, Math.min(14, this.camera.position.z));
      this.camera.position.y = 1.6; // Eye level
    }
  }
}
