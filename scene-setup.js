import * as THREE from 'three';

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = [];
    this.clock = new THREE.Clock();
  }

  async init() {
    this.setupLighting();
    this.setupEnvironment();
    this.createInteractiveObjects();
  }

  setupLighting() {
    // Hemisphere light for general illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.8);
    hemisphereLight.position.set(0.5, 1, 0.25);
    this.scene.add(hemisphereLight);

    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(2, 4, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 10;
    this.scene.add(directionalLight);

    // Ambient light for subtle fill
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);
  }

  setupEnvironment() {
    // Create a simple floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Add some background elements
    this.createBackgroundElements();
  }

  createBackgroundElements() {
    // Create a few background cubes
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6)
      });
      const cube = new THREE.Mesh(geometry, material);
      
      cube.position.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 2 + 0.5,
        (Math.random() - 0.5) * 4 - 2
      );
      cube.castShadow = true;
      this.scene.add(cube);
    }
  }

  createInteractiveObjects() {
    // Main interactive cube
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.3,
      metalness: 0.7
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 1.5, -1);
    cube.castShadow = true;
    cube.userData = { 
      type: 'interactive',
      originalColor: 0x00ff00,
      highlightColor: 0xff0000
    };
    this.scene.add(cube);
    this.interactiveObjects.push(cube);

    // Additional interactive sphere
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0066ff,
      roughness: 0.2,
      metalness: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0.5, 1.3, -1.2);
    sphere.castShadow = true;
    sphere.userData = { 
      type: 'interactive',
      originalColor: 0x0066ff,
      highlightColor: 0xffff00
    };
    this.scene.add(sphere);
    this.interactiveObjects.push(sphere);
  }

  update(timestamp) {
    const elapsed = this.clock.getElapsedTime();
    
    // Animate interactive objects
    this.interactiveObjects.forEach((obj, index) => {
      obj.rotation.x = elapsed * 0.5 + index;
      obj.rotation.y = elapsed * 0.3 + index * 0.5;
      
      // Subtle floating animation
      obj.position.y += Math.sin(elapsed * 2 + index) * 0.001;
    });
  }

  highlightObject(object, highlight = true) {
    if (object.userData.type === 'interactive') {
      const color = highlight ? object.userData.highlightColor : object.userData.originalColor;
      object.material.color.setHex(color);
    }
  }

  getInteractiveObjects() {
    return this.interactiveObjects;
  }
}

