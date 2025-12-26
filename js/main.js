// ==========================================
// LIVING NEURAL NETWORK - MAIN 3D SCENE
// ==========================================
import * as THREE from 'three';

// ==========================================
// SCENE SETUP
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// ==========================================
// LOADING MANAGER
// ==========================================
const loadingManager = new THREE.LoadingManager();
const loader = document.getElementById('loader');
const loaderPercentage = document.querySelector('.loader-percentage');
const loaderProgress = document.querySelector('.loader-progress-terminal');

// Typing effect for Hero Title
// Typing effect for Hero Subtitle
const typeHeroText = () => {
    const subtitleSpan = document.getElementById('typing-subtitle');
    if (!subtitleSpan) return;

    const phrases = ["Python Developer", "Gen AI Enthusiast"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    const type = () => {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            subtitleSpan.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // Faster deletion
        } else {
            subtitleSpan.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // Normal typing
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Finished typing phrase
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting phrase
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause before new phrase
        }

        setTimeout(type, typeSpeed);
    };

    type();
};

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loaderPercentage.textContent = `${Math.round(progress)}%`;
    loaderProgress.style.width = `${progress}%`;
};

loadingManager.onLoad = () => {
    setTimeout(() => {
        const terminalBody = document.querySelector('.terminal-body');
        const completionLine = document.createElement('div');
        completionLine.className = 'terminal-line';
        completionLine.innerHTML = '<span class="success-text">✓ Neural network initialized</span>';
        terminalBody.insertBefore(completionLine, document.querySelector('.cursor-blink'));

        const accessLine = document.createElement('div');
        accessLine.className = 'terminal-line';
        accessLine.innerHTML = '<span class="success-text">✓ Access granted - Welcome to the Vysakh Portfolio</span>';
        terminalBody.insertBefore(accessLine, document.querySelector('.cursor-blink'));

        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
                // Trigger typing effect if exists
                if (typeof typeHeroText === 'function') typeHeroText();
            }, 800);
        }, 800);
    }, 500);
};

// ==========================================
// ENVIRONMENT
// ==========================================
scene.fog = new THREE.FogExp2(0x000510, 0.012);
scene.background = new THREE.Color(0x000510);

// ==========================================
// LIGHTING
// ==========================================
const ambientLight = new THREE.AmbientLight(0x001525, 0.3);
scene.add(ambientLight);

// Mouse-following point light (will be updated in animation loop)
const mouseLight = new THREE.PointLight(0x00ffff, 2, 50);
mouseLight.position.set(0, 0, 10);
scene.add(mouseLight);

// Additional atmospheric lights
const light1 = new THREE.PointLight(0x00ffff, 1.5, 60);
light1.position.set(-30, 20, -20);
scene.add(light1);

const light2 = new THREE.PointLight(0x0099ff, 1.3, 60);
light2.position.set(30, -20, -20);
scene.add(light2);

const light3 = new THREE.PointLight(0x00ff66, 1.2, 60);
light3.position.set(0, 30, -30);
scene.add(light3);

// ==========================================
// NEURAL NETWORK NODES (PARTICLES)
// ==========================================
const nodeCount = 80;
const nodes = [];
const nodeGeometry = new THREE.BufferGeometry();
const nodePositions = new Float32Array(nodeCount * 3);
const nodeColors = new Float32Array(nodeCount * 3);
const nodeSizes = new Float32Array(nodeCount);

// Initialize node data
for (let i = 0; i < nodeCount; i++) {
    const node = {
        position: new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        ),
        originalPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.5 + 0.5
    };

    node.originalPosition.copy(node.position);
    nodes.push(node);

    // Set positions
    nodePositions[i * 3] = node.position.x;
    nodePositions[i * 3 + 1] = node.position.y;
    nodePositions[i * 3 + 2] = node.position.z;

    // Set colors (cyan, blue, green variations)
    const colorChoice = Math.random();
    if (colorChoice < 0.5) {
        nodeColors[i * 3] = 0;
        nodeColors[i * 3 + 1] = 1;
        nodeColors[i * 3 + 2] = 1; // Cyan
    } else if (colorChoice < 0.8) {
        nodeColors[i * 3] = 0;
        nodeColors[i * 3 + 1] = 0.6;
        nodeColors[i * 3 + 2] = 1; // Blue
    } else {
        nodeColors[i * 3] = 0;
        nodeColors[i * 3 + 1] = 1;
        nodeColors[i * 3 + 2] = 0.4; // Green
    }

    // Set sizes
    nodeSizes[i] = Math.random() * 2 + 1;
}

nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
nodeGeometry.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));
nodeGeometry.setAttribute('size', new THREE.BufferAttribute(nodeSizes, 1));

const nodeMaterial = new THREE.PointsMaterial({
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
scene.add(nodePoints);

// ==========================================
// PLEXUS CONNECTIONS (LINES BETWEEN NODES)
// ==========================================
const connectionDistance = 25; // Max distance for connections
const connections = [];
const lineGeometry = new THREE.BufferGeometry();
const linePositions = [];
const lineColors = [];

// Pre-calculate connections
function updateConnections() {
    linePositions.length = 0;
    lineColors.length = 0;
    connections.length = 0;

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const distance = nodes[i].position.distanceTo(nodes[j].position);

            if (distance < connectionDistance) {
                connections.push({ nodeA: i, nodeB: j });

                // Add line vertices
                linePositions.push(
                    nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
                    nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
                );

                // Line color based on distance (fade with distance)
                const opacity = 1 - (distance / connectionDistance);
                lineColors.push(0, 1, 1, opacity); // Cyan with opacity
                lineColors.push(0, 1, 1, opacity);
            }
        }
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 4));
}

const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});

const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(lineSegments);

// Initial connection calculation
updateConnections();

// ==========================================
// DATA FLOW PULSES
// ==========================================
const pulses = [];
const pulseCount = 40;

for (let i = 0; i < pulseCount; i++) {
    const pulseGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0x00ffff : 0x00ff66,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseMesh);

    // Assign to random connection
    const connectionIndex = Math.floor(Math.random() * Math.min(connections.length, pulseCount));

    pulses.push({
        mesh: pulseMesh,
        connectionIndex: connectionIndex,
        progress: Math.random(),
        speed: Math.random() * 0.008 + 0.003
    });
}

// ==========================================
// BINARY RAIN (0s and 1s)
// ==========================================
const binaryCount = 60;
const binaryParticles = [];

// Create canvas texture for binary characters
function createBinaryTexture(char) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const zeroTexture = createBinaryTexture('0');
const oneTexture = createBinaryTexture('1');

for (let i = 0; i < binaryCount; i++) {
    const texture = Math.random() < 0.5 ? zeroTexture : oneTexture;
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 100 + 50,
        (Math.random() - 0.5) * 150
    );
    sprite.scale.set(2, 2, 1);

    scene.add(sprite);

    binaryParticles.push({
        sprite: sprite,
        speed: Math.random() * 0.05 + 0.02,
        resetY: sprite.position.y
    });
}

// ==========================================
// MOUSE INTERACTION - FLUID CURSOR EFFECT
// ==========================================
const mouse = {
    x: 0,
    y: 0,
    smoothX: 0,
    smoothY: 0,
    world: new THREE.Vector3()
};

const raycaster = new THREE.Raycaster();
const mouseLerp = 0.1; // Smoothness factor (lower = smoother/heavier)

// Track mouse movement
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Update mouse world position with lerp
function updateMousePosition() {
    // Smooth lerp for mouse coordinates
    mouse.smoothX += (mouse.x - mouse.smoothX) * mouseLerp;
    mouse.smoothY += (mouse.y - mouse.smoothY) * mouseLerp;

    // Convert screen coordinates to world coordinates (project to z=0 plane)
    raycaster.setFromCamera({ x: mouse.smoothX, y: mouse.smoothY }, camera);

    // Calculate intersection with z=0 plane for better interaction accuracy
    // Ray: P = Origin + t * Direction
    // 0 = Origin.z + t * Direction.z  =>  t = -Origin.z / Direction.z
    // Avoid division by zero if looking parallel to plane
    if (Math.abs(raycaster.ray.direction.z) > 0.01) {
        const t = -camera.position.z / raycaster.ray.direction.z;
        mouse.world.copy(camera.position).add(raycaster.ray.direction.multiplyScalar(t));
    } else {
        // Fallback if ray is parallel
        mouse.world.copy(camera.position).add(raycaster.ray.direction.multiplyScalar(30));
    }

    // Update mouse light position (glowing trail)
    mouseLight.position.copy(mouse.world);
    mouseLight.position.z += 5; // Lift light slightly for better illumination
}

// Apply force field effect to nodes
function applyMouseForce() {
    const forceRadius = 35; // Increased radius for wider influence
    const forceStrength = 0.6; // Increased strength for visible fluid effect

    nodes.forEach((node, index) => {
        const distance = node.position.distanceTo(mouse.world);

        if (distance < forceRadius) {
            // Calculate repulsion vector
            const direction = new THREE.Vector3()
                .subVectors(node.position, mouse.world)
                .normalize();

            const force = (1 - distance / forceRadius) * forceStrength;

            // Apply force to velocity
            node.velocity.add(direction.multiplyScalar(force));
        }

        // Apply spring force back to original position
        const springForce = new THREE.Vector3()
            .subVectors(node.originalPosition, node.position)
            .multiplyScalar(0.05);

        node.velocity.add(springForce);

        // Apply damping
        node.velocity.multiplyScalar(0.92);

        // Update position
        node.position.add(node.velocity);

        // Update BufferGeometry positions
        nodePositions[index * 3] = node.position.x;
        nodePositions[index * 3 + 1] = node.position.y;
        nodePositions[index * 3 + 2] = node.position.z;
    });

    nodeGeometry.attributes.position.needsUpdate = true;
}

// ==========================================
// SCROLLYTELLING - CAMERA MOVEMENT
// ==========================================
function moveCamera() {
    const t = document.body.getBoundingClientRect().top;

    // Camera position based on scroll (flying through network)
    camera.position.z = 30 + t * -0.01;
    camera.position.y = t * -0.002;
    camera.position.x = t * -0.001;
    camera.rotation.x = t * 0.0001;
    camera.rotation.y = t * 0.00005;
}

document.body.onscroll = moveCamera;
moveCamera();

// ==========================================
// ANIMATION LOOP
// ==========================================
let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    frameCount++;

    // Update mouse position with lerp
    updateMousePosition();

    // Apply mouse force field to nodes
    applyMouseForce();

    // Update connections every 3 frames (performance optimization)
    if (frameCount % 3 === 0) {
        updateConnections();
    }

    // Animate pulsating lights
    light1.intensity = 1.5 + Math.sin(time * 1.5) * 0.3;
    light2.intensity = 1.3 + Math.sin(time * 1.8 + 1) * 0.3;
    light3.intensity = 1.2 + Math.sin(time * 1.2 + 2) * 0.3;
    mouseLight.intensity = 2 + Math.sin(time * 2) * 0.5;

    // Animate data pulses along connections
    pulses.forEach((pulse) => {
        if (pulse.connectionIndex < connections.length) {
            const conn = connections[pulse.connectionIndex];
            const nodeA = nodes[conn.nodeA];
            const nodeB = nodes[conn.nodeB];

            pulse.progress += pulse.speed;

            if (pulse.progress >= 1) {
                pulse.progress = 0;
                // Randomly reassign to new connection
                pulse.connectionIndex = Math.floor(Math.random() * connections.length);
            }

            // Interpolate position along connection
            pulse.mesh.position.lerpVectors(
                nodeA.position,
                nodeB.position,
                pulse.progress
            );

            // Glow effect
            const glowScale = 1 + Math.sin(pulse.progress * Math.PI) * 0.8;
            pulse.mesh.scale.set(glowScale, glowScale, glowScale);
            pulse.mesh.material.opacity = 0.9 * Math.sin(pulse.progress * Math.PI);
        }
    });

    // Animate binary rain
    binaryParticles.forEach((binary) => {
        binary.sprite.position.y -= binary.speed;

        // Reset to top when falling below view
        if (binary.sprite.position.y < -60) {
            binary.sprite.position.y = binary.resetY;
            binary.sprite.position.x = (Math.random() - 0.5) * 150;
            binary.sprite.position.z = (Math.random() - 0.5) * 150;
        }

        // Gentle floating rotation
        binary.sprite.material.rotation = time * 0.1;
    });

    // Subtle rotation of node cloud
    nodePoints.rotation.y = time * 0.02;
    nodePoints.rotation.x = Math.sin(time * 0.15) * 0.05;

    // Gentle camera sway (subtle orbital motion)
    const orbitStrength = 0.005;
    camera.position.x += Math.sin(time * 0.2) * orbitStrength;
    camera.position.y += Math.cos(time * 0.15) * orbitStrength;

    renderer.render(scene, camera);
}

animate();

// ==========================================
// RESPONSIVE RESIZE HANDLER
// ==========================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// SIMULATE LOADING
// ==========================================
const simulateLoading = () => {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress > 100) progress = 100;

        loadingManager.onProgress('', progress, 100);

        if (progress === 100) {
            clearInterval(interval);
            loadingManager.onLoad();
        }
    }, 100);
};

simulateLoading();

// ==========================================
// EXPORT FOR EXTERNAL USE (OPTIONAL)
// ==========================================
export { scene, camera, renderer, nodes, connections };
