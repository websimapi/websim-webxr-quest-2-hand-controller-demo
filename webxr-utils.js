import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

export class WebXRManager {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.controllers = [];
    this.hands = [];
    this.controllerFactory = new XRControllerModelFactory();
    this.handFactory = new XRHandModelFactory();
    this.raycaster = new THREE.Raycaster();
    this.intersectedObjects = new Set();
  }

  async init() {
    await this.setupControllers();
    await this.setupHands();
  }

  async setupControllers() {
    for (let i = 0; i < 2; i++) {
      const handedness = i === 0 ? 'left' : 'right';
      
      // Controller for input events
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', (event) => this.onSelectStart(event, handedness));
      controller.addEventListener('selectend', (event) => this.onSelectEnd(event, handedness));
      controller.addEventListener('squeezestart', (event) => this.onSqueezeStart(event, handedness));
      controller.addEventListener('squeezeend', (event) => this.onSqueezeEnd(event, handedness));
      
      controller.userData = { handedness, index: i };
      this.scene.add(controller);
      this.controllers.push(controller);

      // Controller grip model (physical controller representation)
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(this.controllerFactory.createControllerModel(grip));
      this.scene.add(grip);

      // Add a simple ray visualization
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
      const line = new THREE.Line(geometry, material);
      line.name = 'ray';
      line.scale.z = 5;
      controller.add(line);
    }
  }

  async setupHands() {
    for (let i = 0; i < 2; i++) {
      const handedness = i === 0 ? 'left' : 'right';
      
      // Hand model with joint meshes
      const hand = this.renderer.xr.getHand(i);
      hand.add(this.handFactory.createHandModel(hand));
      hand.userData = { handedness, index: i };
      this.scene.add(hand);
      this.hands.push(hand);
    }
  }

  onSelectStart(event, handedness) {
    console.log(`${handedness} trigger pressed`);
    const controller = event.target;
    this.handleControllerRaycast(controller, true);
  }

  onSelectEnd(event, handedness) {
    console.log(`${handedness} trigger released`);
  }

  onSqueezeStart(event, handedness) {
    console.log(`${handedness} grip pressed`);
  }

  onSqueezeEnd(event, handedness) {
    console.log(`${handedness} grip released`);
  }

  handleControllerRaycast(controller, isSelecting = false) {
    // Set up raycaster from controller position and direction
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Get scene manager from the scene (assuming it's attached)
    const sceneManager = this.scene.userData.sceneManager;
    if (!sceneManager) return;

    const interactiveObjects = sceneManager.getInteractiveObjects();
    const intersects = this.raycaster.intersectObjects(interactiveObjects);

    // Handle highlighting
    this.intersectedObjects.forEach(obj => sceneManager.highlightObject(obj, false));
    this.intersectedObjects.clear();

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      sceneManager.highlightObject(intersected, true);
      this.intersectedObjects.add(intersected);

      if (isSelecting) {
        console.log('Selected object:', intersected.userData.type);
      }
    }
  }

  isPinched(hand) {
    const thumb = hand.joints['thumb-tip'];
    const index = hand.joints['index-finger-tip'];
    
    if (!thumb || !index) return false;
    
    const distance = thumb.position.distanceTo(index.position);
    return distance < 0.03;
  }

  detectGestures(inputSource, hand) {
    if (this.isPinched(hand)) {
      console.log(`${inputSource.handedness} pinch gesture detected`);
      return 'pinch';
    }
    return null;
  }

  handleControllerInput(inputSource) {
    if (inputSource.gamepad) {
      const gamepad = inputSource.gamepad;
      
      // Trigger button (index 0)
      if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
        console.log(`${inputSource.handedness} controller trigger pressed`);
      }

      // Grip button (index 1)
      if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
        console.log(`${inputSource.handedness} controller grip pressed`);
      }

      // Thumbstick (if available)
      if (gamepad.axes.length >= 2) {
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
          console.log(`${inputSource.handedness} thumbstick: ${x.toFixed(2)}, ${y.toFixed(2)}`);
        }
      }
    }
  }

  update(frame) {
    const session = this.renderer.xr.getSession();
    if (!frame || !session) return;

    // Update controller raycasting
    this.controllers.forEach(controller => {
      if (controller.visible) {
        this.handleControllerRaycast(controller);
      }
    });

    // Handle input sources
    for (const inputSource of session.inputSources) {
      // Hand tracking
      if (inputSource.hand) {
        const handIndex = inputSource.handedness === 'left' ? 0 : 1;
        const hand = this.hands[handIndex];
        
        if (hand) {
          this.detectGestures(inputSource, hand);
        }
      }
      
      // Controller input
      this.handleControllerInput(inputSource);
    }
  }
}

