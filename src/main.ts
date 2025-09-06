import './style.css'
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';
import { Player } from './player';
import { Physics } from './physics';

const stats = new Stats();
document.body.append(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
orbitCamera.position.set(-32, 16, -32);
orbitCamera.lookAt(0, 0, 0);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update()


function setupLights(scene: THREE.Scene) {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0005;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  const ambient = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambient)

  // const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHelper);
}

function initGame() {
  const scene = new THREE.Scene();
  const world = new World()
  world.generate();
  scene.add(world);

  const player = new Player(scene);
  const physics = new Physics(scene);

  setupLights(scene)
  createUI(world, player);
  let prvsTime = performance.now();

  window.addEventListener("resize", () => {
    orbitCamera.aspect = window.innerWidth / window.innerHeight;
    orbitCamera.updateProjectionMatrix();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  })

  function animate() {
    let currentTime = performance.now();
    let dt = (currentTime - prvsTime) / 1000;
    requestAnimationFrame(animate);
    player.applyInputs(dt);
    player.updateBoundsHelper();
    physics.update(dt, player, world);
    renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
    stats.update()
    prvsTime = currentTime;
  }
  
  animate();
}



document.getElementById("start-button")?.addEventListener("click", () => {
  const menu = document.getElementById("main-menu");
  menu?.classList.add("hidden");
  initGame();
})