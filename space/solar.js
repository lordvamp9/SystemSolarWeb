// Global THREE variable is available from the CDN script
const container = document.getElementById('solar-system');
const loadingScreen = document.getElementById('loading');

let scene, camera, renderer, controls;
let planets = [];
let sun;
let stars, nebula;

// Movement State
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 2
};

// Planet Data
const planetData = [
    { name: 'Mercury', size: 2, distance: 40, speed: 0.02, color: 0xaaaaaa },
    { name: 'Venus', size: 3, distance: 60, speed: 0.015, color: 0xe3bb76 },
    { name: 'Earth', size: 3.2, distance: 80, speed: 0.01, color: 0x2233ff },
    { name: 'Mars', size: 2.5, distance: 100, speed: 0.008, color: 0xff4500 },
    { name: 'Jupiter', size: 8, distance: 150, speed: 0.004, color: 0xd8ca9d },
    { name: 'Saturn', size: 7, distance: 200, speed: 0.002, color: 0xc5ab6e, ring: true },
    { name: 'Uranus', size: 5, distance: 250, speed: 0.001, color: 0x4fd0e7 },
    { name: 'Neptune', size: 5, distance: 300, speed: 0.0005, color: 0x2990b5 }
];

function init() {
    try {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);
        scene.fog = new THREE.FogExp2(0x050510, 0.0005);

        // Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 100, 300);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controls (Global THREE.OrbitControls)
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 2000;
        controls.enablePan = false;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x444444);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 2, 800);
        scene.add(pointLight);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
        sun = new THREE.Mesh(sunGeometry, sunMaterial);

        // Sun Glow
        const sunGlowGeo = new THREE.SphereGeometry(24, 64, 64);
        const sunGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        sun.add(sunGlow);
        scene.add(sun);

        // Planets
        planetData.forEach(data => {
            const planet = createPlanet(data);
            planets.push(planet);
            scene.add(planet.mesh);
            scene.add(planet.orbit);
        });

        // Stars
        createStars();

        // Nebula
        createNebula();

        // Event Listeners
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Hide Loading
        loadingScreen.style.display = 'none';

        animate();

    } catch (error) {
        console.error(error);
        loadingScreen.innerHTML = "Error loading 3D Scene: " + error.message;
    }
}

function createPlanet(data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.7,
        metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);

    const angle = Math.random() * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * data.distance;
    mesh.position.z = Math.sin(angle) * data.distance;

    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.3, data.distance + 0.3, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.08
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;

    if (data.ring) {
        const ringGeo = new THREE.RingGeometry(data.size + 3, data.size + 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xaa8866,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }

    return { mesh, orbit, data, angle };
}

function createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < 5000; i++) {
        vertices.push(
            THREE.MathUtils.randFloatSpread(4000),
            THREE.MathUtils.randFloatSpread(4000),
            THREE.MathUtils.randFloatSpread(4000)
        );

        const type = Math.random();
        if (type > 0.9) color.setHex(0xaaaaff);
        else if (type > 0.7) color.setHex(0xffddaa);
        else color.setHex(0xffffff);

        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createNebula() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    // Generate a simple circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            THREE.MathUtils.randFloatSpread(1000),
            THREE.MathUtils.randFloatSpread(200),
            THREE.MathUtils.randFloatSpread(1000)
        );

        // Nebula colors: Purple, Pink, Blue
        const type = Math.random();
        if (type > 0.6) color.setHex(0x8800ff); // Purple
        else if (type > 0.3) color.setHex(0xff0088); // Pink
        else color.setHex(0x0088ff); // Blue

        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 100,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    nebula = new THREE.Points(geometry, material);
    scene.add(nebula);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'ShiftLeft': moveState.speed = 5; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
        case 'ShiftLeft': moveState.speed = 2; break;
    }
}

function updateMovement() {
    if (!moveState.forward && !moveState.backward && !moveState.left && !moveState.right) return;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;

    const forward = direction.clone().normalize();
    const rightVec = new THREE.Vector3().crossVectors(direction, camera.up).normalize();

    if (moveState.forward) {
        camera.position.addScaledVector(forward, moveState.speed);
        controls.target.addScaledVector(forward, moveState.speed);
    }
    if (moveState.backward) {
        camera.position.addScaledVector(forward, -moveState.speed);
        controls.target.addScaledVector(forward, -moveState.speed);
    }
    if (moveState.right) {
        camera.position.addScaledVector(rightVec, moveState.speed);
        controls.target.addScaledVector(rightVec, moveState.speed);
    }
    if (moveState.left) {
        camera.position.addScaledVector(rightVec, -moveState.speed);
        controls.target.addScaledVector(rightVec, -moveState.speed);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    updateMovement();

    sun.rotation.y += 0.002;
    stars.rotation.y -= 0.0002;
    nebula.rotation.y -= 0.0001;

    planets.forEach(planet => {
        planet.angle += planet.data.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.data.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.data.distance;
        planet.mesh.rotation.y += 0.01;
    });

    controls.update();
    renderer.render(scene, camera);
}

init();
