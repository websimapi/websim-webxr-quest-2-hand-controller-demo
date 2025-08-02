import * as THREE from 'three';
import { SceneManager } from './scene-setup.js';
import { WebXRManager } from './webxr-utils.js';

class App {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.sceneManager = null;
    this.webxrManager = null;
  }

  async init() {
    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Initializing WebXR...';
    document.body.appendChild(loading);

    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Initialize managers
    this.sceneManager = new SceneManager(this.scene);
    this.webxrManager = new WebXRManager(this.renderer, this.scene);

    await this.sceneManager.init();
    await this.webxrManager.init();

    // Create VR button
    document.body.appendChild(VRButton.createButton(this.renderer));

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Remove loading indicator
    loading.remove();

    // Start render loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(timestamp, frame) {
    // Update WebXR interactions
    this.webxrManager.update(frame);
    
    // Update scene animations
    this.sceneManager.update(timestamp);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
const app = new App();
app.init().catch(console.error);

