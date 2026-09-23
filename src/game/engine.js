import { planAutopilot } from './autopilot.js';
import { ScrollController } from '../portfolio/scrollController.js';
import { PortfolioOverlay } from '../portfolio/portfolioOverlay.js';
import { portfolioData } from '../data/portfolioData.js';

'use strict';
  window.portfolioData = portfolioData;
  const $ = id => document.getElementById(id);
  $('retry-button').onclick = () => location.reload();

  async function startCloudRail() {
    const THREE = await import('./three.module.js');
    $('loading-fill').style.width = '32%';
    $('loading-status').textContent = 'Laying the rails. Lighting the windows...';
    await new Promise(resolve => requestAnimationFrame(resolve));

    const TAU = Math.PI * 2;
    const UP = new THREE.Vector3(0, 1, 0);
    const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    const clamp = THREE.MathUtils.clamp;
    const lerp = THREE.MathUtils.lerp;
    const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallScreen = () => innerWidth < 581;
    let seed = 72138;
    function random(a = 0, b = 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return a + (seed / 4294967296) * (b - a);
    }
    const pick = array => array[Math.floor(random(0, array.length))];
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, smallScreen() ? 1.5 : 1.75));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    $('world').appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'A green tram on a wooden railway between floating Mediterranean islands');
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#b8b6c9', 160, 690);
    const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .15, 2200);
    const workshopScene = new THREE.Scene();
    workshopScene.background = new THREE.Color('#738b87');
    workshopScene.fog = new THREE.Fog('#738b87', 52, 170);
    const workshopCamera = new THREE.OrthographicCamera(-23, 23, 23, -23, .1, 220);
    const world = new THREE.Group();
    scene.add(world);
    const movingWorld = new THREE.Group();
    scene.add(movingWorld);
    const workshopWorld = new THREE.Group();
    workshopScene.add(workshopWorld);
    const materialCache = new Map();
    function material(color, extras = {}) {
      const key = color + JSON.stringify(extras);
      if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: .84, flatShading: true, ...extras }));
      return materialCache.get(key);
    }
    const M = {
      grass: material('#8b9a61'), grassLight: material('#acaf76'), stone: material('#d2c3a6'),
      wood: material('#8b6246'), woodLight: material('#b78554'), darkWood: material('#574b40'),
      green: material('#244f43'), greenLight: material('#55765a'), cream: material('#e9dabc'),
      brass: material('#cba16a', { metalness: .45, roughness: .42 }), iron: material('#475551', { metalness: .5, roughness: .6 }),
      rail: material('#bbb6a1', { metalness: .7, roughness: .32 }), roof: material('#bd6a4d'), roofDark: material('#935544'),
      glow: material('#ffe1a1', { emissive: '#ffd17d', emissiveIntensity: 1.25, roughness: .3 }),
      window: material('#ffd398', { emissive: '#ffbf6b', emissiveIntensity: .65 }),
      glass: material('#a9d4cc', { transparent: true, opacity: .2, depthWrite: false, roughness: .2, metalness: .15, side: THREE.DoubleSide }),
      leaves: [material('#668558'), material('#7d955d'), material('#a1a86b'), material('#456f56')],
      cloud: [material('#eee4d9', { flatShading: false }), material('#cfd4dd', { flatShading: false })]
    };
    const geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
      cone: new THREE.ConeGeometry(1, 1, 9),
      sphere: new THREE.IcosahedronGeometry(1, 1),
      softSphere: new THREE.IcosahedronGeometry(1, 2),
      plane: new THREE.PlaneGeometry(1, 1)
    };
    function mesh(parent, geometry, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
      const object = new THREE.Mesh(geometry, mat);
      object.position.set(x, y, z);
      object.scale.set(sx, sy, sz);
      object.castShadow = !mat.transparent;
      object.receiveShadow = true;
      parent.add(object);
      return object;
    }
    const box = (p, m, x, y, z, w, h, d) => mesh(p, geo.box, m, x, y, z, w, h, d);
    const sphere = (p, m, x, y, z, a, b = a, c = a) => mesh(p, geo.sphere, m, x, y, z, a, b, c);
    const cylinder = (p, m, x, y, z, r, h, rz = r) => mesh(p, geo.cylinder, m, x, y, z, r, h, rz);
    function beam(parent, a, b, radius, mat, square = false) {
      const delta = b.clone().sub(a);
      const object = mesh(parent, square ? geo.box : geo.cylinder, mat);
      object.position.copy(a).add(b).multiplyScalar(.5);
      object.scale.set(radius * (square ? 1 : 1), delta.length(), radius * (square ? 1 : 1));
      object.quaternion.setFromUnitVectors(UP, delta.normalize());
      return object;
    }
    function tube(parent, curve, radius, mat, segments = 64, sides = 5, closed = false) {
      return mesh(parent, new THREE.TubeGeometry(curve, segments, radius, sides, closed), mat);
    }
    function group(parent, x = 0, y = 0, z = 0) {
      const object = new THREE.Group();
      object.position.set(x, y, z);
      parent.add(object);
      return object;
    }

    // Merge static meshes by material. The detailed world stays inexpensive to draw.
    function bake(root) {
      root.updateMatrixWorld(true);
      const inverse = root.matrixWorld.clone().invert();
      const batches = new Map();
      const originals = [];
      root.traverse(object => {
        if (!object.isMesh || Array.isArray(object.material)) return;
        let geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        const key = object.material.uuid;
        if (!batches.has(key)) batches.set(key, { mat: object.material, geometries: [], count: 0, cast: false });
        const batch = batches.get(key);
        batch.geometries.push(geometry);
        batch.count += geometry.attributes.position.count;
        batch.cast ||= object.castShadow;
        originals.push(object);
      });
      originals.forEach(object => object.removeFromParent());
      for (const batch of batches.values()) {
        const result = new THREE.BufferGeometry();
        for (const [name, itemSize] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]]) {
          const data = new Float32Array(batch.count * itemSize);
          let offset = 0;
          for (const part of batch.geometries) {
            const attribute = part.attributes[name];
            const size = part.attributes.position.count * itemSize;
            if (attribute) data.set(attribute.array, offset);
            else if (name === 'color') data.fill(1, offset, offset + size);
            offset += size;
          }
          result.setAttribute(name, new THREE.BufferAttribute(data, itemSize));
        }
        const object = mesh(root, result, batch.mat);
        object.castShadow = batch.cast;
        batch.geometries.forEach(part => part.dispose());
      }
    }

    function canvasTexture(width, height, draw) {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      draw(canvas.getContext('2d'), width, height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }
    const glowTexture = canvasTexture(64, 64, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,224,157,.75)');
      gradient.addColorStop(.18, 'rgba(255,204,125,.24)');
      gradient.addColorStop(1, 'rgba(255,183,110,0)');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    });
    const glowMat = new THREE.SpriteMaterial({ map: glowTexture, color: '#ffe3af', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    function halo(parent, x, y, z, size = 1.6) {
      const sprite = new THREE.Sprite(glowMat);
      sprite.position.set(x, y, z); sprite.scale.set(size, size, 1); parent.add(sprite);
      return sprite;
    }
    function textPlane(parent, text, x, y, z, width, height, bg = '#254d41', fg = '#f4dfae', font = '600 34px Georgia') {
      const texture = canvasTexture(512, 128, (ctx, w, h) => {
        if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font;
        ctx.fillText(text, w / 2, h / 2 + 2, w - 32);
      });
      return mesh(parent, geo.plane, new THREE.MeshStandardMaterial({ map: texture, transparent: !bg, roughness: .9, side: THREE.DoubleSide, emissive: '#ad9865', emissiveIntensity: .16 }), x, y, z, width, height, 1);
    }

    const hemi = new THREE.HemisphereLight('#bcd2ed', '#667461', 2.1);
    scene.add(hemi, new THREE.AmbientLight('#dac6d0', .32));
    const sun = new THREE.DirectionalLight('#ffcca0', 3.05);
    sun.position.set(-75, 130, 45); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 360 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .055; sun.shadow.bias = -.00015;
    scene.add(sun, sun.target);
    const rimLight = new THREE.DirectionalLight('#d7b7e3', .65); rimLight.position.set(90, 65, -180); scene.add(rimLight);

    const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 20), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { topColor: { value: new THREE.Color('#495775') }, horizonColor: { value: new THREE.Color('#d4b1ad') }, lowColor: { value: new THREE.Color('#a2b6ca') } },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 lowColor;
        varying vec3 vPosition;
        void main() {
          vec3 dir = normalize(vPosition);
          float h = dir.y;
          vec3 col = mix(horizonColor, topColor, smoothstep(-0.015, 0.29, h));
          col = mix(col, lowColor, 1.0 - smoothstep(-0.45, -0.04, h));
          float glow = pow(max(0.0, dot(dir, normalize(vec3(-0.52, 0.11, -0.84)))), 14.0);
          col += vec3(0.19, 0.065, 0.006) * glow;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    }));
    scene.add(sky);
    const starPositions = [];
    for (let i = 0; i < 480; i++) {
      const angle = random(0, TAU), height = random(.13, .93), horizontal = Math.sqrt(1 - height * height);
      starPositions.push(Math.cos(angle) * horizontal * 1100, height * 1100, Math.sin(angle) * horizontal * 1100);
    }
    const starsGeometry = new THREE.BufferGeometry(); starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#fff1d6', size: 1.55, transparent: true, opacity: .72, depthWrite: false, fog: false }));
    scene.add(stars);
    const moon = mesh(scene, new THREE.SphereGeometry(10, 40, 20), new THREE.MeshBasicMaterial({ color: '#fff0d8', fog: false }), 620, 150, -330);
    moon.castShadow = false;

    const seaUniforms = { time: { value: 0 }, deep: { value: new THREE.Color('#428f98') }, light: { value: new THREE.Color('#79b6b8') }, mist: { value: new THREE.Color('#b9c1cd') } };
    const twilight = {
      top: new THREE.Color('#495775'), horizon: new THREE.Color('#d4b1ad'), low: new THREE.Color('#a2b6ca'), fog: new THREE.Color('#b8b6c9'), sea: new THREE.Color('#428f98')
    };
    const midnight = {
      top: new THREE.Color('#283651'), horizon: new THREE.Color('#818aa8'), low: new THREE.Color('#7a93aa'), fog: new THREE.Color('#7f8ea9'), sea: new THREE.Color('#346a80')
    };
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600, 90, 90), new THREE.ShaderMaterial({
      uniforms: seaUniforms,
      vertexShader: `
        uniform float time;
        varying vec3 vWorld;
        void main() {
          vec3 p = position;
          p.z += sin(p.x * 0.026 + time * 0.3) * 0.35 + cos(p.y * 0.035 + time * 0.2) * 0.24;
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 deep;
        uniform vec3 light;
        uniform vec3 mist;
        varying vec3 vWorld;
        void main() {
          float wave = sin(vWorld.x * 0.11 + vWorld.z * 0.21 + time * 0.38) * sin(vWorld.z * 0.29 - time * 0.25);
          float fine = pow(max(0.0, wave), 18.0);
          vec3 col = mix(deep, light, 0.28 + 0.13 * sin(vWorld.z * 0.014));
          col += vec3(0.16, 0.17, 0.135) * fine;
          float distanceFog = smoothstep(200.0, 950.0, length(vWorld - cameraPosition));
          col = mix(col, mist, distanceFog);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -51; scene.add(sea);

    const clouds = [];
    function cloud(x, y, z, scale = 1) {
      const root = group(movingWorld, x, y, z);
      for (let i = 0; i < 8; i++) {
        const size = random(3, 7);
        mesh(root, geo.softSphere, M.cloud[i % 2], (i - 3.5) * 4.2, random(-.8, 2.5), random(-3.5, 3.5), size * 1.65, size * .57, size);
      }
      root.scale.setScalar(scale); bake(root);
      root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      clouds.push({ root, x, phase: random(0, TAU) });
    }
    [[-30,-20,15,1.5],[35,-14,-43,1.1],[112,-13,-55,1.8],[-80,-25,-90,1.9],[-38,6,-175,1.45],[65,-13,-203,2.1],[-170,-10,60,1.5],[145,-27,42,1.8],[-135,14,-230,1.6],[220,19,-260,2.5],[-240,7,-130,2.4],[34,-26,145,2.5],[260,-14,125,2.7],[-90,-29,235,3.1],[90,13,-380,3.5],[32,-1,-100,1.6],[-300,88,-430,2.5],[260,88,-620,3.6]].forEach(a => cloud(...a));

    // The closed, arc-length sampled spline is the source of truth for rails and physics.
    const route = new THREE.CatmullRomCurve3([
      V(-116,30,76), V(-85,30.3,65), V(-54,32,45), V(-30,35,20), V(-15,37,-8),
      V(-4,38,-42), V(18,39.3,-70), V(49,40,-78), V(78,40.7,-85), V(102,45,-112),
      V(94,52,-149), V(51,54,-168), V(3,49,-151), V(-31,44,-124), V(-71,38,-119),
      V(-109,34,-95), V(-142,31,-54), V(-158,28,-5), V(-148,28,42)
    ], true, 'catmullrom', .45);
    route.arcLengthDivisions = 3000; route.updateArcLengths();
    const routeLength = route.getLength();
    function routeU(distance) { return ((distance % routeLength) + routeLength) % routeLength / routeLength; }
    function pointAt(distance) { return route.getPointAt(routeU(distance)); }
    function tangentAt(distance) { return route.getTangentAt(routeU(distance)); }
    function closestDistance(position) {
      let best = Infinity, found = 0;
      for (let i = 0; i < 4000; i++) {
        const d = route.getPointAt(i / 4000).distanceToSquared(position);
        if (d < best) { best = d; found = i / 4000 * routeLength; }
      }
      return found;
    }
    function railFrame(distance) {
      const p = pointAt(distance), forward = tangentAt(distance);
      const right = new THREE.Vector3().crossVectors(UP, forward).normalize();
      const up = new THREE.Vector3().crossVectors(forward, right).normalize();
      const rotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward));
      return { p, forward, right, up, rotation };
    }
    const stations = [
      { name: 'Saltlight / About', distance: closestDistance(V(-116,30,76)), queue: [], alighting: [], island: V(-117,28.8,53) },
      { name: 'Mango Tide / Works', distance: closestDistance(V(49,40,-78)), queue: [], alighting: [], island: V(53,38.8,-100) }
    ];
    function nearStation(distance, radius = 15) {
      return stations.some(s => Math.min(Math.abs(distance - s.distance), routeLength - Math.abs(distance - s.distance)) < radius);
    }
    const railPoints = [[], []], edgePoints = [[], []], wirePoints = [];
    for (let i = 0; i < 900; i++) {
      const f = railFrame(i / 900 * routeLength);
      [-1, 1].forEach((sign, side) => {
        railPoints[side].push(f.p.clone().addScaledVector(f.right, sign * 1.12).addScaledVector(f.up, .13));
        edgePoints[side].push(f.p.clone().addScaledVector(f.right, sign * 1.87).addScaledVector(f.up, -.56));
      });
      wirePoints.push(f.p.clone().add(V(0, 6.7 - Math.sin(i / 900 * routeLength / 28 * Math.PI) ** 2 * .35, 0)));
    }
    railPoints.forEach(points => tube(world, new THREE.CatmullRomCurve3(points, true), .105, M.rail, 1600, 7, true));
    edgePoints.forEach(points => tube(world, new THREE.CatmullRomCurve3(points, true), .19, M.darkWood, 1200, 5, true));
    tube(world, new THREE.CatmullRomCurve3(wirePoints, true), .022, M.iron, 1600, 4, true);
    const tieMaterials = [M.wood, M.woodLight, material('#9a754e')];
    for (let d = 0; d < routeLength; d += .93) {
      const f = railFrame(d);
      const tie = box(world, tieMaterials[Math.floor(d) % 3], 0, 0, 0, 3.8, .22, .56);
      tie.position.copy(f.p).addScaledVector(f.up, -.14); tie.quaternion.copy(f.rotation);
    }
    for (let d = 0; d < routeLength; d += 16) {
      if (nearStation(d, 24)) continue;
      const a = railFrame(d), b = railFrame(d + 16);
      for (const side of [-1, 1]) {
        const pa = a.p.clone().addScaledVector(a.right, side * 1.6).add(V(0,-.8,0));
        const pb = b.p.clone().addScaledVector(b.right, side * 1.6).add(V(0,-.8,0));
        const lowerA = pa.clone().add(V(0,-9,0)), lowerB = pb.clone().add(V(0,-9,0));
        beam(world, pa, lowerA, .25, M.darkWood, true);
        beam(world, lowerA, lowerB, .23, M.wood, true);
        beam(world, lowerA, pb, .18, M.wood, true);
        beam(world, pa, lowerB, .18, M.darkWood, true);
        if (d % 48 < 16) {
          const archPoints = [pa.clone().add(V(0,-27,0)), pa.clone().lerp(pb,.16).add(V(0,-7,0)), pa.clone().lerp(pb,.5).add(V(0,-2.5,0)), pa.clone().lerp(pb,.84).add(V(0,-7,0)), pb.clone().add(V(0,-27,0))];
          tube(world, new THREE.CatmullRomCurve3(archPoints), .48, material('#b4ab9b'), 20, 6);
        }
      }
      beam(world, a.p.clone().addScaledVector(a.right,-1.7).add(V(0,-9.2,0)), a.p.clone().addScaledVector(a.right,1.7).add(V(0,-9.2,0)), .2, M.darkWood, true);
    }
    for (let d = 0; d < routeLength; d += 28) {
      if (nearStation(d, 13)) continue;
      const f = railFrame(d), base = f.p.clone().addScaledVector(f.right, 2.25);
      beam(world, base.clone().add(V(0,-.5,0)), base.clone().add(V(0,7.25,0)), .105, M.darkWood);
      beam(world, base.clone().add(V(0,6.8,0)), f.p.clone().addScaledVector(f.right,-.3).add(V(0,6.8,0)), .065, M.iron);
      beam(world, base.clone().add(V(0,5.5,0)), f.p.clone().addScaledVector(f.right,.2).add(V(0,6.8,0)), .045, M.iron);
      const lightPos = base.clone().addScaledVector(f.right,-.35).add(V(0,3.7,0));
      cylinder(world, M.iron, lightPos.x, lightPos.y+.3, lightPos.z, .23, .1);
      sphere(world, M.glow, lightPos.x, lightPos.y, lightPos.z, .14,.24,.14);
      halo(world, lightPos.x, lightPos.y, lightPos.z, 1.4);
    }

    function island(parent, x, y, z, radius, depth = 31, stretch = 1) {
      const root = group(parent, x, y, z);
      const count = 17, angles = [];
      for (let i = 0; i < count; i++) angles.push({ angle: i / count * TAU, size: random(.84, 1.06) });
      const levels = [[0,1],[-2.1,1.025],[-depth*.29,.98],[-depth*.72,.57],[-depth,.13]];
      const vertices = [], colors = [];
      const palette = ['#a39699','#958f99','#7a8390','#b09c91','#717e8b','#899199'].map(c => new THREE.Color(c));
      const rings = levels.map(([h, scale], level) => angles.map((a, i) => V(Math.cos(a.angle) * radius * a.size * scale, h + (level > 1 ? random(-2,2) : 0), Math.sin(a.angle) * radius * a.size * scale * stretch)));
      function tri(a,b,c,color) { [a,b,c].forEach(p => { vertices.push(p.x,p.y,p.z); colors.push(color.r,color.g,color.b); }); }
      for (let l = 0; l < rings.length - 1; l++) for (let i = 0; i < count; i++) {
        const n = (i + 1) % count;
        tri(rings[l][i],rings[l+1][i],rings[l][n],pick(palette));
        tri(rings[l][n],rings[l+1][i],rings[l+1][n],pick(palette));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3)); geometry.computeVertexNormals();
      mesh(root,geometry,material('#ffffff',{vertexColors:true,side:THREE.DoubleSide}));
      const top = [];
      for (let i = 0; i < count; i++) {
        const a = rings[0][i], b = rings[0][(i+1)%count];
        top.push(0,.02,0,b.x,.02,b.z,a.x,.02,a.z);
      }
      const topGeometry = new THREE.BufferGeometry(); topGeometry.setAttribute('position',new THREE.Float32BufferAttribute(top,3)); topGeometry.computeVertexNormals();
      mesh(root,topGeometry,M.grass);
      for (let i=0;i<22;i++) {
        const a=random(0,TAU), r=random(.78,.99)*radius;
        sphere(root,pick(M.leaves),Math.cos(a)*r,random(.1,.65),Math.sin(a)*r*stretch,random(1,2.6),random(.4,1.1),random(.7,2));
      }
      for(let i=0;i<7;i++) {
        const a=random(0,TAU), r=radius*random(.5,.85);
        sphere(root,material('#8a9094'),Math.cos(a)*r,-depth*random(.5,.85),Math.sin(a)*r*stretch,random(2,4),random(3,7),random(2,4));
      }
      return root;
    }
    function tree(parent,x,y,z,size=1,type='round') {
      const root=group(parent,x,y,z);
      cylinder(root,M.darkWood,0,size*1.65,0,.18*size,3.3*size);
      if(type==='cypress') {
        sphere(root,M.leaves[3],0,3.7*size,0,.91*size,3.2*size,.91*size);
        sphere(root,M.leaves[0],.08*size,5.5*size,0,.52*size,2*size,.58*size);
      } else {
        for(let i=0;i<6;i++) {
          const a=i/6*TAU;
          sphere(root,M.leaves[i%4],Math.cos(a)*size*.9,3.6*size+random(-.3,.6)*size,Math.sin(a)*size*.9,size*random(1.1,1.6),size*random(1,1.35),size*1.25);
        }
        sphere(root,M.leaves[1],0,4.7*size,0,1.5*size,1.2*size,1.4*size);
        if(type==='fruit') for(let i=0;i<8;i++) sphere(root,material('#dfa451'),random(-1.3,1.3)*size,random(2.9,4.5)*size,random(-1.3,1.3)*size,.16*size);
      }
      return root;
    }
    function pot(parent,x,y,z,size=.5) {
      const root=group(parent,x,y,z);
      cylinder(root,M.roof,0,size*.52,0,size*.57,size);
      cylinder(root,M.roofDark,0,size,0,size*.64,size*.13);
      for(let i=0;i<4;i++) sphere(root,M.leaves[i%3],random(-.3,.3)*size,size*1.3,random(-.3,.3)*size,size*.7,size*.6,size*.65);
      return root;
    }
    function gable(parent,width,height,depth,x,y,z,mat) {
      const shape=new THREE.Shape(); shape.moveTo(-width/2,0); shape.lineTo(0,height); shape.lineTo(width/2,0); shape.closePath();
      return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),mat,x,y,z-depth/2);
    }
    function house(parent,x,y,z,width=5,height=6,depth=5,rotation=0,tint='#e2cbae') {
      const root=group(parent,x,y,z); root.rotation.y=rotation;
      box(root,material(tint),0,height/2,0,width,height,depth);
      box(root,M.stone,0,.25,0,width+.3,.5,depth+.3);
      box(root,M.cream,0,height-.12,0,width+.28,.25,depth+.25);
      gable(root,width+.75,height*.32,depth+.9,0,height-.05,0,M.roof);
      for(let i=0;i<9;i++) {
        const zz=-depth/2-.37+i*(depth+.74)/8;
        beam(root,V(-width/2-.38,height,zz),V(0,height+height*.32,zz),.055,M.roofDark);
        beam(root,V(0,height+height*.32,zz),V(width/2+.38,height,zz),.055,M.roofDark);
      }
      for(let i=1;i<4;i++) for(const side of [-1,1]) {
        const xx=side*width*.5*i/4;
        box(root,material('#cf7c58'),xx,height+height*.32*(1-i/4)+.015,0,.055,.065,depth+.86);
      }
      box(root,M.cream,width*.24,height+height*.28,-depth*.21,.66,1.65,.72);
      box(root,M.roofDark,width*.24,height+height*.28+.83,-depth*.21,.83,.18,.88);
      const levels=height>6.1?2:1;
      for(let floor=0;floor<levels;floor++) for(const side of [-1,1]) {
        const yy=levels===1?height*.59:height*.36+floor*height*.37;
        const xx=side*width*.25;
        box(root,M.darkWood,xx,yy,depth/2+.045,1.16,1.5,.09);
        box(root,M.window,xx,yy,depth/2+.097,.85,1.23,.05);
        box(root,M.cream,xx,yy,depth/2+.135,.075,1.3,.065);
        box(root,M.cream,xx,yy,depth/2+.135,.94,.075,.065);
        for(const shutter of [-1,1]) box(root,M.greenLight,xx+shutter*.72,yy,depth/2+.12,.37,1.48,.09);
        box(root,M.stone,xx,yy-.79,depth/2+.2,1.43,.16,.4);
        if(floor===0&&random()>.4) { box(root,M.wood,xx,yy-.63,depth/2+.34,1.3,.25,.36); for(let j=0;j<4;j++) sphere(root,pick(M.leaves),xx-.45+j*.3,yy-.38,depth/2+.35,.24,.18,.23); }
      }
      box(root,M.darkWood,0,1,depth/2+.03,1.1,2,.12);
      box(root,M.green,0,1,depth/2+.11,.86,1.82,.08);
      sphere(root,M.brass,.28,.9,depth/2+.18,.06);
      box(root,M.stone,0,.11,depth/2+.6,1.8,.22,1.1);
      for(const side of [-1,1]) {
        box(root,M.darkWood,side*(width/2+.025),height*.63,0,.08,1.6,1.15);
        box(root,M.window,side*(width/2+.073),height*.63,0,.03,1.32,.91);
        box(root,M.cream,side*(width/2+.105),height*.63,0,.055,1.4,.08);
      }
      pot(root,width*.38,.2,depth/2+.65,.62);
      return root;
    }
    function pathStones(parent,points,width=2.6) {
      const curve=new THREE.CatmullRomCurve3(points);
      const length=curve.getLength();
      for(let d=0;d<length;d+=1.15) {
        const p=curve.getPointAt(d/length), t=curve.getTangentAt(d/length);
        const stone=box(parent,pick([M.stone,M.cream,material('#c7bb9b')]),p.x,p.y+.065,p.z,width,.12,1.05);
        stone.rotation.y=Math.atan2(t.x,t.z)+random(-.06,.06);
      }
    }
    function streetLamp(parent,x,y,z,height=4.8) {
      const root=group(parent,x,y,z);
      cylinder(root,M.iron,0,height/2,0,.075,height);
      cylinder(root,M.iron,0,.15,0,.24,.3);
      box(root,M.iron,0,height,0,.6,.14,.6);
      box(root,M.glow,0,height-.4,0,.3,.57,.3);
      for(const xx of [-.19,.19]) for(const zz of [-.19,.19]) box(root,M.iron,xx,height-.4,zz,.045,.67,.045);
      mesh(root,geo.cone,M.green,0,height+.15,0,.5,.42,.5);
      halo(root,0,height-.3,0,2.3);
      return root;
    }
    function bench(parent,x,y,z,rotation=0) {
      const root=group(parent,x,y,z);root.rotation.y=rotation;
      for(let i=0;i<3;i++) box(root,M.woodLight,0,.72,-.24+i*.24,2.3,.13,.19);
      for(let i=0;i<2;i++) box(root,M.woodLight,0,1.14+i*.24,-.45,2.3,.17,.12);
      for(const xx of [-.85,.85]) { box(root,M.iron,xx,.4,0,.13,.75,.58);box(root,M.iron,xx,1,-.44,.12,1.3,.12); }
    }
    function person(parent,x,y,z,color='#be795e',skin='#d6ae8a',sitting=false,hat=false) {
      const root=group(parent,x,y,z);
      const coat=material(color), skinMat=material(skin), trousers=material('#48596a'), hair=material(pick(['#5b4539','#9c7550','#493e37','#c5b498']));
      const leg=sitting ? .32 : .64, hip=sitting ? .55 : .77;
      box(root,coat,0,hip+.3,0,.48,.65,.32);
      sphere(root,skinMat,0,hip+.93,0,.24,.29,.23);
      sphere(root,hair,0,hip+1.08,-.025,.25,.17,.23);
      sphere(root,skinMat,0,hip+.91,.23,.067,.073,.06);
      for(const side of [-1,1]) {
        box(root,trousers,side*.13,leg/2, sitting ? .19 : 0,.17,leg,.21);
        if(sitting) box(root,trousers,side*.13,.46,.16,.18,.18,.49);
        box(root,M.darkWood,side*.13,.065,sitting ? .27 : .08,.19,.13,.32);
        const arm=box(root,coat,side*.32,hip+.2,.04,.16,.52,.18);arm.rotation.z=side*.12;
        sphere(root,skinMat,side*.33,hip-.04,.07,.095);
        sphere(root,material('#393b37'),side*.085,hip+.96,.207,.021);
      }
      if(hat) { cylinder(root,material('#cbb187'),0,hip+1.19,0,.31,.05);cylinder(root,material('#cbb187'),0,hip+1.28,0,.21,.17); }
      bake(root);return root;
    }
    const mango = island(world,53,38.8,-100,33,42,.83);
    pathStones(mango,[V(-20,0,8),V(-8,0,4),V(0,0,-4),V(14,0,-6),V(19,0,-14)],3.2);
    pathStones(mango,[V(-8,0,4),V(-4,0,15),V(1,0,21)],3.3);
    house(mango,-13,0,-4,5.9,7.2,5.7,.08,'#e8ccb1');
    house(mango,-3,0,-11,6.1,9.7,6.1,-.12,'#efd7ba');
    house(mango,7,0,-11,5.6,6.8,5.1,-.2,'#dba88a');
    house(mango,13,0,3,5.8,6.4,5.3,-.4,'#e7cca7');
    house(mango,-20,0,6,4.6,5.4,5,-.3,'#d5bda4');
    house(mango,-11,0,-16,4.5,5.8,4.2,.22,'#efdbb4');
    house(mango,4,0,4,4.7,5.3,4.9,.15,'#d8b199');
    [[-23,-8,1.6,'round'],[-20,-17,1,'cypress'],[-17,-17,1.15,'cypress'],[4,-22,1.1,'cypress'],[11,-20,1.4,'round'],[23,4,1.15,'fruit'],[21,10,1.1,'round'],[-7,10,.9,'fruit'],[10,13,.8,'fruit'],[-27,2,.9,'round']].forEach(a=>tree(mango,a[0],0,a[1],a[2],a[3]));
    [[-9,4],[7,-3],[16,9],[-23,11],[0,14]].forEach(a=>streetLamp(mango,a[0],0,a[1]));
    bench(mango,-7,0,8,.1);bench(mango,11,0,-3,-.4);
    person(mango,-7,.15,4,'#d7aa65','#bb8968',false,true);
    person(mango,6,.15,-3,'#8d96aa','#e5b996');
    const lighthouse=group(mango,20,0,-11);
    const towerGeometry=new THREE.CylinderGeometry(1.65,2.55,19,12);
    mesh(lighthouse,towerGeometry,M.cream,0,9.5,0);
    for(const yy of [4.5,10.5,16.5]) cylinder(lighthouse,M.roof,0,yy,0,2.55-(yy/19)*.9,.8);
    cylinder(lighthouse,M.stone,0,.3,0,3.05,.6);
    cylinder(lighthouse,M.cream,0,19.1,0,2.7,.35);
    cylinder(lighthouse,M.green,0,21.6,0,2.23,.2);
    cylinder(lighthouse,M.window,0,20.3,0,1.46,2.1);
    for(let i=0;i<10;i++) {
      const a=i/10*TAU;
      box(lighthouse,M.green,Math.cos(a)*1.56,20.35,Math.sin(a)*1.56,.12,2.5,.12);
      cylinder(lighthouse,M.iron,Math.cos(a)*2.5,19.8,Math.sin(a)*2.5,.047,1.3);
    }
    const balconyCurve=new THREE.CatmullRomCurve3(Array.from({length:24},(_,i)=>V(Math.cos(i/24*TAU)*2.5,20.35,Math.sin(i/24*TAU)*2.5)),true);
    tube(lighthouse,balconyCurve,.055,M.iron,48,5,true);
    mesh(lighthouse,geo.cone,M.green,0,22.45,0,2.55,1.8,2.55);
    cylinder(lighthouse,M.brass,0,23.65,0,.08,.9);
    halo(lighthouse,0,20.3,0,7);
    for(const yy of [5,11,16]) {box(lighthouse,M.darkWood,0,yy,2.5-(yy/19)*.9,.66,1.25,.1);box(lighthouse,M.window,0,yy,2.58-(yy/19)*.9,.44,1.03,.05);}
    house(lighthouse,-3.3,0,1.6,3.6,4.1,4.2,0,'#eddbc0');
    const lighthouseBeacon=new THREE.PointLight('#ffc278',14,42,2);lighthouseBeacon.position.set(73,59.2,-111);scene.add(lighthouseBeacon);
    const dock=group(mango,26,0,9);dock.rotation.y=-.45;
    for(let i=0;i<15;i++) box(dock,M.woodLight,0,-.1,i*.58,3.3,.2,.52);
    for(const xx of [-1.45,1.45]) for(const zz of [0,4,8]) {cylinder(dock,M.darkWood,xx,-1.7,zz,.14,5);cylinder(dock,M.woodLight,xx,1,zz,.18,.7);}
    box(dock,M.wood,0,.45,4,1,.9,1.15);box(dock,M.woodLight,.5,1.1,4,.6,.45,.8);
    streetLamp(dock,-1.4,0,7.8,3.7);

    const saltlight=island(world,-117,28.8,53,35,38,.88);
    pathStones(saltlight,[V(-23,0,2),V(-8,0,4),V(5,0,0),V(8,0,18)],3.6);
    [[-15,5,6,7,5,.18,'#dcc5a1'],[-8,-8,6,9,6,-.08,'#eadac0'],[3,-12,7,7,5.5,.15,'#d4aa8d'],[13,-3,5,8,5,-.13,'#e2c7a9'],[-22,-6,4.4,5.5,5,.3,'#e9d7b8'],[2,5,5,5.6,5,.05,'#dcb6a1']].forEach(a=>house(saltlight,a[0],0,a[1],...a.slice(2)));
    [[-24,-14,1.6],[-14,-20,1.3],[10,-18,1.35],[22,-5,1.4],[19,10,1.1],[-23,12,.8],[-5,12,.8]].forEach(a=>tree(saltlight,a[0],0,a[1],a[2],random()>.5?'round':'cypress'));
    [[-11,8],[7,7],[13,15],[-20,4]].forEach(a=>streetLamp(saltlight,a[0],0,a[1]));
    const clockTower=group(saltlight,16,0,-13);
    box(clockTower,M.cream,0,7,0,4.3,14,4.3);gable(clockTower,5.1,3.7,5.1,0,14,0,M.roof);
    const clockTexture=canvasTexture(128,128,(ctx,w,h)=>{ctx.fillStyle='#eee0b8';ctx.beginPath();ctx.arc(64,64,57,0,TAU);ctx.fill();ctx.strokeStyle='#46584d';ctx.lineWidth=4;ctx.stroke();for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(64+Math.sin(a)*43,64-Math.cos(a)*43);ctx.lineTo(64+Math.sin(a)*49,64-Math.cos(a)*49);ctx.stroke();}ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(43,55);ctx.lineTo(64,64);ctx.lineTo(83,34);ctx.stroke();});
    mesh(clockTower,geo.plane,new THREE.MeshStandardMaterial({map:clockTexture,transparent:true,emissive:'#d6a967',emissiveIntensity:.25}),0,11,2.17,2.5,2.5,1);

    const distantIslands=[[-175,17,-242,29], [188,12,-280,41], [28,5,-370,45], [-280,0,43,40], [257,13,55,34], [-61,70,-330,18], [172,17,-74,26]];
    distantIslands.forEach(([x,y,z,r],idx)=>{
      const root=island(world,x,y,z,r,r*1.2,.8);
      for(let i=0;i<3;i++) house(root,-r*.38+i*r*.35,0,random(-r*.25,r*.1),random(3.5,5),random(5,8),4.5,random(-.2,.2),pick(['#ddbea3','#e8cfb0','#d4b4a0']));
      for(let i=0;i<7;i++) {const a=random(0,TAU),rr=random(.4,.8)*r;tree(root,Math.cos(a)*rr,0,Math.sin(a)*rr*.8,random(.8,1.7),i%2?'cypress':'round');}
      if(idx<3) {
        const points=Array.from({length:35},(_,i)=>{const a=i/34*TAU*1.25;return V(x+Math.cos(a)*(r+12),y+2+i*.42,z+Math.sin(a)*(r+10));});
        const line=new THREE.CatmullRomCurve3(points);
        tube(world,line,.22,M.darkWood,230,5);
        const parallel=points.map(p=>p.clone().add(V(1.8,.08,0)));tube(world,new THREE.CatmullRomCurve3(parallel),.1,M.rail,230,5);
        for(let i=0;i<90;i++){const p=line.getPointAt(i/90);const tie=box(world,M.wood,p.x,p.y-.1,p.z,3.5,.16,.38);const t=line.getTangentAt(i/90);tie.rotation.y=Math.atan2(t.x,t.z);}
      }
    });

    function buildStation(station,index) {
      const f=railFrame(station.distance), root=group(world);root.position.copy(f.p);root.quaternion.copy(f.rotation);
      box(root,M.stone,4.5,-.65,0,5.2,1.6,19);
      for(let i=0;i<3;i++) box(root,M.stone,7.4+i*.56,-.23-i*.35,0,.65,.32,4.5);
      for(let i=0;i<19;i++) box(root,M.cream,2.04,.14,-8.7+i*.95,.3,.06,.71);
      for(const z of [-6.5,6.5]) {box(root,M.darkWood,6.1,2.95,z,.2,6,.2);beam(root,V(6.1,4.8,z),V(3.4,5.95,z),.13,M.darkWood,true);}
      const canopy=box(root,M.greenLight,4.55,6.05,0,5.4,.18,15);canopy.rotation.z=-.085;
      for(let i=0;i<11;i++) box(root,i%2?M.cream:M.greenLight,4.6,5.93,-7+i*1.4,5.4,.11,.68).rotation.z=-.085;
      box(root,M.cream,2,5.72,0,.16,.43,15);
      const sign=textPlane(root,station.name.toUpperCase(),4.25,4.6,6.61,4.6,.84,'#315745','#f0dfb4','500 29px Georgia');
      sign.rotation.y=0;
      textPlane(root,station.name.toUpperCase(),4.25,4.6,-6.61,4.6,.84,'#315745','#f0dfb4','500 29px Georgia').rotation.y=Math.PI;
      textPlane(root,index?'MANGO TIDE':'SALTLIGHT',6.05,3.7,0,4,.82,'#315745','#f0dfb4','500 32px Georgia').rotation.y=-Math.PI/2;
      box(root,M.wood,5.4,1.45,-7.6,2.1,2.9,1.7);
      box(root,M.window,5.4,1.8,-6.72,1.4,1.1,.055);
      box(root,M.green,5.4,3.06,-7.6,2.5,.27,2.1);
      bench(root,5.7,.12,2,-Math.PI/2);pot(root,5.6,.12,7.6,.9);
      streetLamp(root,2.4,.14,-8.4,4.5);
      for(const z of [-4.5,4.5]) {sphere(root,M.glow,4.2,5.5,z,.14,.23,.14);halo(root,4.2,5.45,z,2.5);}
      const queueRoot=group(movingWorld);queueRoot.position.copy(f.p);queueRoot.quaternion.copy(f.rotation);
      const colors=['#bf8066','#7b91a0','#d5b67a','#85886c','#a88391','#748b6d'];
      for(let i=0;i<6;i++) {
        const p=person(queueRoot,3.35,.16,-4.6+i*1.53,colors[i],pick(['#ddae88','#ad7c61','#eed0ae','#8d6451']),false,i%3===0);
        p.rotation.y=-Math.PI/2;p.userData.home=p.position.clone();station.queue.push(p);
      }
      for(let i=0;i<3;i++) {
        const p=person(queueRoot,1.71,.95,2.5,colors[5-i],pick(['#ddae88','#ad7c61','#eed0ae']),false,i===1);
        p.rotation.y=Math.PI/2;p.visible=false;station.alighting.push(p);
      }
      station.queueRoot=queueRoot;
    }
    stations.forEach(buildStation);
    bake(world);

    const birds=[];
    for(let i=0;i<10;i++) {
      const bird=group(movingWorld);const body=sphere(bird,material('#f0e9d5'),0,0,0,.19,.14,.4);
      const wings=[];
      for(const side of [-1,1]) {const wing=box(bird,material('#f0e9d5'),side*.43,.02,0,.8,.035,.25);wing.rotation.z=side*.16;wings.push(wing);}
      birds.push({root:bird,wings,phase:random(0,TAU),radius:random(12,32),height:random(63,80),speed:random(.06,.12)});
    }

    // A single tram is reparented into the workshop; every fitted part comes back with it.
    const tram=group(scene), suspension=group(tram), body=group(suspension);
    const doors=[], wheels=[], riders=[];
    let destinationBoardTexture;
    box(body,M.darkWood,0,.67,0,3.55,.34,7.65);
    box(body,M.woodLight,0,.91,0,3.65,.25,7.8);
    box(body,M.wood,0,1.08,0,3.48,.15,7.5);
    for(const side of [-1,1]) {
      box(body,M.green,side*1.68,1.62,-.92,.16,1.1,5.56);
      box(body,M.green,side*1.68,1.62,3.52,.16,1.1,.36);
      box(body,M.brass,side*1.785,1.36,-.92,.035,.06,5.56);
      box(body,M.cream,side*1.785,2.05,-.92,.045,.16,5.56);
      box(body,M.woodLight,side*1.7,3.97,0,.13,.17,7.4);
      box(body,M.cream,side*1.735,4.14,0,.14,.12,7.52);
      for(let i=0;i<8;i++) sphere(body,M.brass,side*1.79,1.12,-3.2+i*.91,.034,.034,.034);
      const lettering=textPlane(body,'C L O U D L I N E',side*1.791,1.7,-.65,3.8,.39,null,'#dfc38b','500 35px Georgia');lettering.rotation.y=side*Math.PI/2;
      box(body,M.woodLight,side*1.96,.65,2.55,.5,.16,1.5);
      box(body,M.iron,side*2.1,.37,2.55,.43,.12,1.5);
      for(const z of [-3.57,-1.88,-.25,1.35,3.56]) box(body,M.woodLight,side*1.68,3,z,.14,2,.12);
    }
    function archShape(w,h,inset=0) {
      const s=new THREE.Shape();const r=w/2;
      s.moveTo(-r,inset);s.lineTo(r,inset);s.lineTo(r,h-r);s.quadraticCurveTo(r,h,r*.28,h);s.lineTo(-r*.28,h);s.quadraticCurveTo(-r,h,-r,h-r);s.closePath();return s;
    }
    function archWindow(parent,x,y,z,w,h,rotation=0) {
      const root=group(parent,x,y,z);root.rotation.y=rotation;
      const outer=archShape(w,h),hole=archShape(w-.14,h-.11,.09);outer.holes.push(hole);
      mesh(root,new THREE.ExtrudeGeometry(outer,{depth:.09,bevelEnabled:false}),M.cream);
      mesh(root,new THREE.ShapeGeometry(archShape(w-.15,h-.12,.08)),M.glass,0,0,.045);
      box(root,M.woodLight,0,.11,.12,w,.09,.13);
      return root;
    }
    for(const side of [-1,1]) {
      for(const z of [-2.71,-1.06,.55]) archWindow(body,side*1.76,2.1,z,1.47,1.85,side*Math.PI/2);
      const door=group(suspension,side*1.77,0,2.49);
      box(door,M.woodLight,0,1.56,0,.105,1.1,1.54);
      box(door,M.green,side*.064,1.57,0,.04,.85,1.28);
      archWindow(door,0,2.1,0,1.47,1.85,side*Math.PI/2);
      box(door,M.brass,side*.09,2.03,.48,.06,.36,.065);
      bake(door);doors.push(door);
    }
    for(const sign of [-1,1]) {
      box(body,M.green,0,1.63,sign*3.68,3.35,1.1,.18);
      box(body,M.cream,0,2.09,sign*3.79,3.45,.13,.06);
      box(body,M.brass,0,1.3,sign*3.8,3.22,.055,.04);
      for(const x of [-1.57,0,1.57]) box(body,M.woodLight,x,3.04,sign*3.67,.14,1.98,.16);
      for(const x of [-.81,.81]) archWindow(body,x,2.14,sign*3.77,1.37,1.75,sign===1?0:Math.PI);
      box(body,M.cream,0,4.04,sign*3.72,3.45,.25,.22);
      const board=textPlane(body,sign===1?'MANGO TIDE':'COASTAL LINE',0,4.03,sign*3.847,2.48,.31,'#264f42','#efddb0','600 34px Georgia');
      board.rotation.y=sign===1?0:Math.PI;
      if(sign===1)destinationBoardTexture=board.material.map;
      box(body,M.iron,0,.63,sign*4.02,2.75,.25,.34);
      cylinder(body,M.brass,0,1.68,sign*3.86,.32,.16).rotation.x=Math.PI/2;
      sphere(body,M.glow,0,1.68,sign*3.99,.245,.245,.09);
      halo(body,0,1.68,sign*4.07,1.5);
      for(const x of [-1.24,1.24]) sphere(body,material('#d98e58',{emissive:'#db752a',emissiveIntensity:.4}),x,1.39,sign*3.85,.12,.1,.07);
      textPlane(body,'07',.9,1.72,sign*3.81,.45,.34,null,'#eedab1','600 70px Georgia').rotation.y=sign===1?0:Math.PI;
    }
    for(const z of [-2.43,2.43]) {
      beam(body,V(-1.55,.49,z),V(1.55,.49,z),.14,M.iron);
      for(const side of [-1,1]) {
        const wheel=group(tram,side*1.12,.48,z);
        const tire=cylinder(wheel,M.iron,0,0,0,.48,.25);tire.rotation.z=Math.PI/2;
        const hub=cylinder(wheel,M.brass,side*.15,0,0,.23,.075);hub.rotation.z=Math.PI/2;
        for(let i=0;i<6;i++) {const a=i/6*TAU;beam(wheel,V(side*.2,0,0),V(side*.2,Math.cos(a)*.36,Math.sin(a)*.36),.027,M.woodLight);}
        bake(wheel);wheels.push(wheel);
      }
      box(body,M.iron,0,.43,z,1.5,.28,1);
    }
    for(const side of [-1,1]) {
      box(body,M.woodLight,side*1.1,1.35,-.55,.75,.16,5.1);
      box(body,material('#768363'),side*1.36,1.8,-.55,.16,.85,5.1);
      for(let i=0;i<5;i++) {
        const rider=person(suspension,side*1.07,1.42,-2.52+i*1.04,pick(['#c38a66','#8da2ae','#b99e76','#ba9290','#7e977d']),pick(['#b78665','#e3b892','#eed1ae','#946750']),true,i%4===0);
        rider.scale.setScalar(.83);rider.rotation.y=side===1?-Math.PI/2:Math.PI/2;riders.push(rider);
      }
    }
    for(let i=0;i<6;i++) {
      const rider=person(suspension,(i%2?-.42:.42),1.1,1.78-Math.floor(i/2)*1.8,pick(['#75858e','#caa275','#b98c7e']),pick(['#ddb493','#a9795c']),false,i===0);
      rider.scale.setScalar(.79);rider.rotation.y=i%2?Math.PI:0;riders.push(rider);
    }
    bake(body);
    const roof=group(suspension,0,4.2,0);
    const roofMaterial=material('#3e6552');
    const roofProfile=new THREE.Shape();roofProfile.moveTo(-1.94,0);roofProfile.quadraticCurveTo(0,1.24,1.94,0);roofProfile.lineTo(1.94,-.14);roofProfile.quadraticCurveTo(0,.96,-1.94,-.14);roofProfile.closePath();
    mesh(roof,new THREE.ExtrudeGeometry(roofProfile,{depth:8.12,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:1,steps:1}),roofMaterial,0,0,-4.06);
    for(const side of [-1,1]) box(roof,M.brass,side*1.97,-.03,0,.085,.15,8.15);
    for(const z of [-2.6,2.6]) box(roof,M.darkWood,0,.69,z,2.7,.13,.13);
    for(const side of [-1,1]) box(roof,M.brass,side*1.3,.98,-.4,.07,.06,5.3);
    for(const z of [-2.9,2.1]) for(const side of [-1,1]) cylinder(roof,M.brass,side*1.3,.82,z,.035,.36);
    const luggageRoot=group(roof);
    function suitcase(parent,x,y,z,w,h,d,color) {
      const root=group(parent,x,y,z);box(root,material(color),0,h/2,0,w,h,d);
      for(const xx of [-w*.31,w*.31]) {box(root,M.woodLight,xx,h+.018,0,.09,.035,d+.035);box(root,M.woodLight,xx,h/2,d/2+.02,.09,h,.035);}
      for(const xx of [-w/2,w/2]) for(const zz of [-d/2,d/2]) box(root,M.brass,xx*.98,h*.9,zz*.98,.13,.13,.12);
      box(root,M.darkWood,0,h+.085,0,w*.25,.09,.09);return root;
    }
    suitcase(luggageRoot,-.38,.69,-1.85,1.35,.68,.9,'#aa7450');
    suitcase(luggageRoot,.57,.65,-.64,.86,.58,.85,'#c49a67');
    bake(roof);
    const pantograph=group(roof,0,.64,2.16);
    for(const x of [-.5,.5]) {beam(pantograph,V(x,0,-.65),V(x,.65,.2),.035,M.iron);beam(pantograph,V(x,.65,.2),V(x,1.47,-.25),.035,M.iron);}
    box(pantograph,M.iron,0,1.47,-.25,1.65,.08,.2);bake(pantograph);
    const ivy=group(suspension), companion=group(suspension);
    for(const side of [-1,1]) {
      const points=[];
      for(let i=0;i<14;i++) {const z=-3.85+i*.59;points.push(V(side*1.99,4.2+Math.sin(i*.8)*.1,z));sphere(ivy,pick(M.leaves),side*2,4.25+Math.sin(i*.8)*.12,z,.28,.18,.3);if(i%3===0)for(let j=1;j<4;j++)sphere(ivy,M.leaves[j%3],side*1.89,4.2-j*.22,z+.07*j,.18,.2,.19);}
      tube(ivy,new THREE.CatmullRomCurve3(points),.035,M.greenLight,32,4);
    }
    for(let i=0;i<8;i++) sphere(ivy,pick(M.leaves),random(-1.5,1.5),4.89,random(-3,0),.36,.19,.32);
    bake(ivy);ivy.visible=false;
    suitcase(companion,.25,5.18,-1.8,1.05,.5,.7,'#66877b');
    suitcase(companion,-.47,4.94,.45,1.45,.78,1.1,'#b97c4f');
    const cat=group(companion,.4,5.22,-.24);
    const catMat=material('#d6b484');sphere(cat,catMat,0,.14,0,.39,.25,.28);sphere(cat,catMat,.29,.27,.08,.22,.22,.22);
    for(const side of [-1,1]) mesh(cat,geo.cone,catMat,.3+side*.12,.5,.075,.09,.19,.08);
    tube(cat,new THREE.CatmullRomCurve3([V(-.3,.13,0),V(-.5,.12,.23),V(-.2,.18,.32),V(.08,.2,.26)]),.073,catMat,13,5);
    for(const z of [-.01,.15]) box(cat,M.darkWood,.48,.29,z,.013,.025,.055);
    const lantern=group(companion,-1.98,3.36,-3.35);beam(lantern,V(0,.8,0),V(0,.35,0),.024,M.brass);box(lantern,M.glow,0,0,0,.3,.45,.3);box(lantern,M.green,0,.29,0,.45,.1,.45);box(lantern,M.brass,0,-.28,0,.43,.08,.43);for(const x of [-.19,.19])for(const z of [-.19,.19])box(lantern,M.brass,x,0,z,.032,.55,.032);halo(lantern,0,0,0,2.4);
    bake(companion);companion.visible=false;
    const interiorLight=new THREE.PointLight('#ffcf88',3.2,6,2);interiorLight.position.set(0,3.3,0);tram.add(interiorLight);

    $('loading-fill').style.width='74%';
    $('loading-status').textContent='Oliver is putting the kettle on...';
    await new Promise(resolve => requestAnimationFrame(resolve));

    // The workshop is a roof-cutaway diorama rendered with a true orthographic camera.
    workshopScene.add(new THREE.HemisphereLight('#d9e1d3','#65796a',2.3));
    const shopSun=new THREE.DirectionalLight('#ffe0ad',3.2);shopSun.position.set(-16,28,17);shopSun.castShadow=true;shopSun.shadow.mapSize.set(2048,2048);Object.assign(shopSun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:90});shopSun.shadow.normalBias=.035;workshopScene.add(shopSun);
    shopSun.shadow.camera.updateProjectionMatrix();
    const workshopIsland=island(workshopWorld,0,-.55,0,17,18,1.02);
    box(workshopWorld,M.darkWood,0,-.06,0,19,.65,22);
    for(let i=0;i<32;i++) box(workshopWorld,i%3===0?M.wood:M.woodLight,0,.34,-10.55+i*.68,18.8,.13,.62);
    box(workshopWorld,material('#d6c4a1'),0,3.65,-9.8,19,6.8,.55);
    box(workshopWorld,material('#baa987'),-9.3,2.65,0,.5,4.8,19.8);
    for(const x of [-9,0,9]) {box(workshopWorld,M.darkWood,x,4.6,-9.45,.35,8.4,.35);box(workshopWorld,M.darkWood,x,7.8,-7.4,.3,.3,4.2);}
    box(workshopWorld,M.darkWood,0,7.8,-9.3,18.5,.4,.4);
    box(workshopWorld,M.roof,0,8.15,-8.7,20,.3,3.2).rotation.x=.08;
    textPlane(workshopWorld,'OLIVER CLOUDWORKS',0,5.62,-9.48,7.3,1.1,'#42604a','#ecdeb7','500 32px Georgia');
    textPlane(workshopWorld,'BUILT WITH A LITTLE WONDER',0,4.79,-9.47,5.4,.35,null,'#756b51','400 25px Georgia');
    for(const x of [-6.45,6.3]) {box(workshopWorld,M.darkWood,x,4.55,-9.46,2.3,2.8,.16);box(workshopWorld,M.window,x,4.55,-9.33,2.04,2.53,.06);box(workshopWorld,M.cream,x,4.55,-9.22,.12,2.55,.09);box(workshopWorld,M.cream,x,4.55,-9.22,2.1,.12,.09);}
    for(const x of [-1.12,1.12]) box(workshopWorld,M.rail,x,.54,1,.12,.13,25);
    for(let z=-10;z<14;z+=.9) box(workshopWorld,M.darkWood,0,.43,z,3.55,.18,.36);
    for(const x of [-5.4,5.4]) {box(workshopWorld,M.green,x,4.48,-.5,.35,8.15,.4);box(workshopWorld,M.brass,x,.6,-.5,1.5,.3,1.3);}
    box(workshopWorld,M.green,0,8.55,-.5,11.7,.5,.65);
    box(workshopWorld,M.brass,0,8.21,-.5,1.25,.35,.9);
    const hoist=group(workshopScene,0,8.05,-.5);
    cylinder(hoist,M.iron,0,-1.1,0,.036,2.2);
    tube(hoist,new THREE.CatmullRomCurve3([V(0,-2.13,0),V(.2,-2.35,0),V(0,-2.51,0),V(-.19,-2.36,0)]),.075,M.brass,10,6);bake(hoist);
    box(workshopWorld,M.green,-6.7,1.23,-4.1,3.5,1.65,5.5);
    box(workshopWorld,M.woodLight,-6.7,2.11,-4.1,3.8,.2,5.9);
    for(let z=-6;z<-1;z+=1.2) {box(workshopWorld,material('#789075'),-4.91,1.27,z,.08,.64,.86);box(workshopWorld,M.brass,-4.83,1.29,z,.06,.065,.25);}
    for(let i=0;i<9;i++) {const x=random(-7.8,-5.8),z=random(-6.5,-2);box(workshopWorld,pick([M.iron,M.brass,M.roof]),x,2.27,z,.15,.12,random(.25,.8)).rotation.y=random(0,TAU);}
    pot(workshopWorld,-7.3,2.2,-6.3,.63);streetLamp(workshopWorld,-7.9,.45,6.6,4.5);
    for(const x of [6.8,8.45]) box(workshopWorld,M.darkWood,x,2.25,-5.6,.16,3.7,4.5);
    for(const yy of [.65,2.15,3.75]) {
      box(workshopWorld,M.woodLight,7.62,yy,-5.6,2,.14,5);
      for(let z=-7.2;z<-3.5;z+=1.2) box(workshopWorld,pick([M.roof,M.greenLight,M.woodLight,M.cream]),7.62,yy+.43,z,random(.8,1.3),.72,.83);
    }
    for(let i=0;i<4;i++) {const barrel=cylinder(workshopWorld,M.wood,6.7+i%2*1.5,.99,3.8+Math.floor(i/2)*1.6,.55,1.17);for(const yy of [.61,1.35])cylinder(workshopWorld,M.iron,barrel.position.x,yy,barrel.position.z,.565,.055);}
    box(workshopWorld,material('#a76651'),5.2,.45,0,2.5,.08,3.8);
    cylinder(workshopWorld,M.woodLight,-4.3,1.24,2.8,.62,.17);for(let i=0;i<3;i++){const a=i/3*TAU;beam(workshopWorld,V(-4.3+Math.cos(a)*.4,.45,2.8+Math.sin(a)*.4),V(-4.3+Math.cos(a)*.28,1.2,2.8+Math.sin(a)*.28),.055,M.darkWood);}
    const stringPoints=[V(-9,7,-7),V(-4,6.5,-6.7),V(1,6.2,-6.5),V(5,6.5,-6.7),V(9,7,-7)];
    const stringCurve=new THREE.CatmullRomCurve3(stringPoints);tube(workshopWorld,stringCurve,.025,M.darkWood,40,4);
    for(let i=0;i<9;i++){const p=stringCurve.getPointAt(i/8);sphere(workshopWorld,M.glow,p.x,p.y-.14,p.z,.09,.15,.09);halo(workshopWorld,p.x,p.y-.14,p.z,1.5);}
    tree(workshopWorld,-13,-.35,-6,1.4,'round');tree(workshopWorld,12,-.35,6,1.4,'fruit');tree(workshopWorld,12,-.35,-11,1.8,'cypress');
    pot(workshopWorld,-8,.45,8.5,1.1);pot(workshopWorld,8,.45,8.5,.9);bench(workshopWorld,-12,-.2,6,-Math.PI/2);
    const oliver=person(workshopScene,-3.2,.5,1.6,'#a98155','#d2aa87',false,true);oliver.rotation.y=Math.PI*.35;oliver.scale.setScalar(1.08);
    const shopWarmLight=new THREE.PointLight('#ffd699',25,25,2);shopWarmLight.position.set(-3,6,-4);workshopScene.add(shopWarmLight);
    bake(workshopWorld);
    const workshopClouds=group(workshopScene);
    for(let i=0;i<18;i++){const a=i/18*TAU,r=random(23,42);mesh(workshopClouds,geo.softSphere,pick(M.cloud),Math.cos(a)*r,-11+random(-2,2),Math.sin(a)*r,random(6,10),random(1.3,2.7),random(5,9));}bake(workshopClouds);

    let stored={};
    try { stored=JSON.parse(localStorage.getItem('cloudrail-v1')||'{}')||{}; } catch(error) { stored={}; }
    const initialDistance=closestDistance(V(-22,36,-.5));
    const state={
      distance:initialDistance,speed:0,acceleration:0,throttle:0,brake:0,comfort:96,aboard:12,
      coins:Number.isFinite(stored.coins)?Math.max(0,stored.coins):1280,streak:1,
      leaves:stored.leaves===true,companion:stored.companion===true,
      mode:'driving',paused:false,autopilot:false,autoTarget:0,from:0,to:1,nextStop:stations[1].distance,legStart:stations[0].distance,
      stationTime:0,stationBoarded:false,stationUnloaded:false,arrivalGiven:false,lastArrivalTips:0,doorOpen:0,
      stableTime:0,roughTime:0,broken:false,legQuality:0,legSamples:0,wind:0,wasWind:false,
      cameraMode:0,cameraOrbit:0,cameraOrbitTarget:0,roll:0,approachNotified:false,
      fitting:null,exitTime:0,savedDriveMode:'driving',savedSpeed:0,transitioning:false,started:false
    };
    if(state.nextStop<state.distance) state.nextStop+=routeLength;
    
    const scrollCtrl = new ScrollController(state, routeLength);
    const portfolioOverlay = new PortfolioOverlay(scrollCtrl);
    window.scrollController = scrollCtrl;
    window.portfolioOverlay = portfolioOverlay;

    const input={power:false,brake:false,left:false,right:false};
    let elapsed=0,subtitleUntil=0,toastUntil=0,lastUI=0,lastTime=performance.now(),wasHidden=false;
    let soundEnabled=false,audio=null,lastRailSound=0;
    function save(){try{localStorage.setItem('cloudrail-v1',JSON.stringify({coins:state.coins,leaves:state.leaves,companion:state.companion}));}catch(error){/* Storage is optional, including on file:// pages. */}}
    function applyUpgrades(){ivy.visible=state.leaves;companion.visible=state.companion;roofMaterial.color.set(state.leaves?'#779061':'#3e6552');}
    applyUpgrades();
    function updateRiders(){riders.forEach((r,i)=>r.visible=i<state.aboard);}
    updateRiders();
    function updateDestinationBoard(){
      const canvas=destinationBoardTexture.image,ctx=canvas.getContext('2d');
      ctx.fillStyle='#264f42';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#efddb0';ctx.font='600 34px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(stations[state.to].name.toUpperCase(),canvas.width/2,canvas.height/2+2,canvas.width-30);
      destinationBoardTexture.needsUpdate=true;
    }
    function subtitle(text,duration=5,small='') {
      $('subtitle').replaceChildren(document.createTextNode(text));
      if(small){const note=document.createElement('small');note.textContent=small;$('subtitle').appendChild(note);}
      $('subtitle').classList.add('visible');subtitleUntil=elapsed+duration;
    }
    function toast(text,duration=4,warning=false,detail='') {

    window.toast = toast;
    window.audioGesture = audioGesture;

      $('toast').replaceChildren(document.createTextNode(text));
      if(detail){const note=document.createElement('small');note.textContent=detail;$('toast').appendChild(note);}
      $('toast').classList.toggle('warning',warning);$('toast').classList.add('show');toastUntil=elapsed+duration;
    }
    function clearInput(){Object.keys(input).forEach(key=>input[key]=false);$('power-button')?.classList.remove('is-held');$('brake-button')?.classList.remove('is-held');}

    function setAutopilot(enabled, notify=true){
      state.autopilot=enabled;state.autoTarget=0;clearInput();
      if(notify)toast(enabled?'Autopilot enabled':'Manual control restored',4,false,enabled?'Automatic speed, station stops, and departures after boarding.':'Hold Power or Brake to drive the tram.');
      updateUI(true);
    }
    function takeManualControl(){if(state.autopilot)setAutopilot(false);}
    function toggleAutopilot(){
      if(state.paused||state.transitioning||!['driving','station'].includes(state.mode))return;
      setAutopilot(!state.autopilot);audioGesture();
    }
    $('autopilot-button').onclick=toggleAutopilot;

    // Procedural audio needs a gesture; it never downloads or autoplays a sound file.
    function ensureAudio(){
      if(audio)return;
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)throw new Error('Audio is not supported in this browser.');
      const ctx=new Context(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      const motor=ctx.createOscillator(),motorGain=ctx.createGain(),filter=ctx.createBiquadFilter();
      motor.type='triangle';motor.frequency.value=45;filter.type='lowpass';filter.frequency.value=160;motorGain.gain.value=0;
      motor.connect(filter);filter.connect(motorGain);motorGain.connect(master);motor.start();
      const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.15;
      const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;
      const windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=360;
      const windGain=ctx.createGain();windGain.gain.value=.045;wind.connect(windFilter);windFilter.connect(windGain);windGain.connect(master);wind.start();
      audio={ctx,master,motor,motorGain,windGain};
    }
    function audioGesture(){if(!soundEnabled)return;try{ensureAudio();audio?.ctx.resume().catch(()=>{});}catch(error){soundEnabled=false;updateSoundButton();toast('Sound is not available in this browser. The coast is still yours.',4);}}
    function chime(frequency=660,duration=.3,volume=.1){
      if(!audio||!soundEnabled)return;
      const t=audio.ctx.currentTime,osc=audio.ctx.createOscillator(),gain=audio.ctx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(audio.master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }
    function updateSoundButton(){$('sound-icon').setAttribute('href',soundEnabled?'#i-sound':'#i-muted');$('sound-button').setAttribute('aria-label',soundEnabled?'Turn sound off':'Turn sound on');$('sound-button').setAttribute('aria-pressed',String(soundEnabled));}
    function toggleSound(){soundEnabled=!soundEnabled;audioGesture();updateSoundButton();if(audio)audio.master.gain.setTargetAtTime(soundEnabled ? .5 : 0,audio.ctx.currentTime,.15);if(soundEnabled)chime(784,.5,.08);}
    $('sound-button').onclick=toggleSound;
    function updateAudio(){
      if(!audio)return;
      const t=audio.ctx.currentTime,active=soundEnabled&&!state.paused;
      audio.master.gain.setTargetAtTime(active ? .5 : 0,t,.15);
      audio.motor.frequency.setTargetAtTime(38+state.speed*6,t,.2);
      audio.motorGain.gain.setTargetAtTime(state.mode==='driving'?Math.min(.12,state.speed*.012):.006,t,.2);
      audio.windGain.gain.setTargetAtTime(.035+state.wind*.07+state.speed*.002,t,.6);
      if(active&&state.speed>.5&&state.mode==='driving'&&elapsed-lastRailSound>Math.max(.095,1.1/state.speed)) {lastRailSound=elapsed;chime(110+Math.random()*55,.065,.035);}
    }
    function heldButton(id,key){
      const button=$(id);
      if(!button)return;
      button.addEventListener('pointerdown',event=>{
        if(state.paused||state.mode!=='driving'||state.transitioning)return;
        event.preventDefault();takeManualControl();button.setPointerCapture(event.pointerId);input[key]=true;button.classList.add('is-held');audioGesture();
      });
      const release=event=>{input[key]=false;button.classList.remove('is-held');if(event&&button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);};
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
      button.addEventListener('contextmenu',event=>event.preventDefault());
      button.addEventListener('keydown',event=>{
        if(event.code!=='Space'&&event.code!=='Enter')return;
        event.preventDefault();event.stopPropagation();
        if(state.paused||state.mode!=='driving'||state.transitioning)return;
        takeManualControl();input[key]=true;button.classList.add('is-held');audioGesture();
      });
      button.addEventListener('keyup',event=>{
        if(event.code!=='Space'&&event.code!=='Enter')return;
        event.preventDefault();event.stopPropagation();release();
      });
      button.addEventListener('blur',()=>release());
    }
    heldButton('power-button','power');heldButton('brake-button','brake');
    function cycleView(){if(state.mode==='workshop'||state.mode==='exiting')return;state.cameraMode=(state.cameraMode+1)%3;state.cameraOrbitTarget=0;$('view-label').textContent=['Postcard view',"Driver's view",'Scenic view'][state.cameraMode];toast(['A little postcard from the coast.','The view from the front seat.','A little more sky.'][state.cameraMode],2.5);}
    $('view-button').onclick=cycleView;
    const dialog=$('pause-dialog');
    function openGuide(help=false){
      if(state.transitioning||state.mode==='workshop'||state.mode==='exiting')return;
      clearInput();state.paused=true;
      $('dialog-title').textContent=help?'A gentler way to travel.':'Take a little breather.';
      $('dialog-description').textContent=help?'Carry your neighbours between the islands. Find your rhythm, not the fastest time.':"Your passengers can wait. The view isn't going anywhere.";
      if(!dialog.open)dialog.showModal();
    }
    function closeGuide(){dialog.close();state.paused=false;lastTime=performance.now();}
    $('pause-button').onclick=()=>openGuide(false);$('help-button').onclick=()=>openGuide(true);$('resume-button').onclick=closeGuide;$('dialog-close').onclick=closeGuide;
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeGuide();});dialog.addEventListener('close',()=>{state.paused=false;clearInput();});
    $('quality').onchange=event=>{
      const value=event.target.value;
      renderer.setPixelRatio(Math.min(devicePixelRatio,value==='crisp'?2:value==='battery'?1:1.5));
      renderer.shadowMap.enabled=value!=='battery';renderer.setSize(innerWidth,innerHeight);
      scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});workshopScene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});
    };
    function restartJourney(){
      clearInput();Object.assign(state,{distance:initialDistance,speed:0,acceleration:0,throttle:0,brake:0,comfort:96,aboard:12,streak:1,mode:'driving',autopilot:false,autoTarget:0,from:0,to:1,nextStop:stations[1].distance,legStart:stations[0].distance,stationTime:0,doorOpen:0,stableTime:0,roughTime:0,broken:false,legQuality:0,legSamples:0,approachNotified:false,started:false});
      if(state.nextStop<state.distance)state.nextStop+=routeLength;
      stations.forEach(s=>{s.queue.forEach(p=>{p.visible=true;p.position.copy(p.userData.home);});s.alighting.forEach(p=>p.visible=false);});updateRiders();updateDestinationBoard();closeGuide();updateTram(0);updateCamera(0,true);subtitle('Hold W or Power. Your little adventure starts here.',9,'There is no hurry.');updateUI(true);
    }
    $('restart-button').onclick=restartJourney;
    addEventListener('keydown',event=>{
      if(event.target instanceof HTMLSelectElement)return;
      const code=event.code;
      if(dialog.open&&code!=='Escape')return;
      if(event.target instanceof HTMLButtonElement&&(code==='Space'||code==='Enter'))return;
      if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code))event.preventDefault();
      if(code==='Escape'){event.preventDefault();if(dialog.open){closeGuide();return;}if(state.mode==='workshop'){leaveWorkshop();return;}if(state.mode==='driving'||state.mode==='station')openGuide();return;}
      if(dialog.open||state.transitioning)return;
      if(!event.repeat){
        if(code==='KeyP'){event.preventDefault();toggleAutopilot();}
        if(code==='KeyM')toggleSound();if(code==='KeyH')openGuide(true);if(code==='KeyC')cycleView();if(code==='KeyG')enterWorkshop();
      }
      if(state.paused||state.mode!=='driving')return;
      if(code==='KeyW'||code==='ArrowUp'){takeManualControl();input.power=true;$('power-button')?.classList.add('is-held');audioGesture();}
      if(code==='KeyS'||code==='ArrowDown'||code==='Space'){takeManualControl();input.brake=true;$('brake-button')?.classList.add('is-held');audioGesture();}
      if(code==='KeyA'||code==='ArrowLeft')input.left=true;
      if(code==='KeyD'||code==='ArrowRight')input.right=true;
    });
    addEventListener('keyup',event=>{
      const code=event.code;
      if(code==='KeyW'||code==='ArrowUp'){input.power=false;$('power-button')?.classList.remove('is-held');}
      if(code==='KeyS'||code==='ArrowDown'||code==='Space'){input.brake=false;$('brake-button')?.classList.remove('is-held');}
      if(code==='KeyA'||code==='ArrowLeft')input.left=false;
      if(code==='KeyD'||code==='ArrowRight')input.right=false;
    });
    addEventListener('blur',clearInput);
    document.addEventListener('visibilitychange',()=>{clearInput();wasHidden=document.hidden;lastTime=performance.now();if(document.hidden&&audio)audio.master.gain.setTargetAtTime(0,audio.ctx.currentTime,.05);});

    function breakStreak(){
      if(state.broken)return;
      state.streak=0;state.broken=true;state.stableTime=0;
      toast('Streak broken.',6,true,'Find your balance to rebuild your tips.');
    }
    function arrive(speed){
      const hardStop=speed>3.8;
      if(hardStop){state.comfort=clamp(state.comfort-(speed-3)*4,0,100);breakStreak();}
      state.distance=state.nextStop;state.speed=0;state.acceleration=0;state.throttle=0;state.brake=0;state.mode='station';state.stationTime=0;
      state.stationUnloaded=false;state.stationBoarded=false;state.arrivalGiven=false;clearInput();
      subtitle('Doors opening - '+stations[state.to].name,4,'Please wait...');chime(660,.6,.12);
      state.boardingTarget=clamp(state.aboard-3+Math.floor(random(3,7)),6,16);
      state.boardingCount=state.boardingTarget-Math.max(3,state.aboard-3);
    }
    function updateDriving(dt){
      if((input.power||state.autopilot)&&!state.started){state.started=true;subtitle('The sea below. The whole evening ahead.',5);}
      const remaining=state.nextStop-state.distance;
      const tangent=tangentAt(state.distance),nextTangent=tangentAt(state.distance+3.5);
      const curvature=tangent.angleTo(nextTangent)/3.5;
      const signedCurve=new THREE.Vector3().crossVectors(tangent,nextTangent).y;
      const exposed=remaining>24&&tangent.y>-.12;
      const gust=exposed?Math.max(0,Math.sin(elapsed*.19+routeU(state.distance)*TAU*3)-.61)/.39:0;
      state.wind=damp(state.wind,gust,1.1,dt);
      let power=input.power&&!input.brake?1:0,brake=input.brake?1:0;
      if(state.autopilot){
        const curves=[0,6,14,26,42].map(distance=>({distance,curvature:tangentAt(state.distance+distance).angleTo(tangentAt(state.distance+distance+3.5))/3.5}));
        const controls=planAutopilot({speed:state.speed,remaining,grade:tangent.y,wind:state.wind,curves});
        power=controls.power;brake=controls.brake;state.autoTarget=controls.target;
      }
      state.throttle=damp(state.throttle,power,2.3,dt);
      state.brake=damp(state.brake,brake,7,dt);
      const rollingResistance=state.speed>0 ? .14+state.speed*.015 : 0;
      let acceleration=state.throttle*2.35-state.brake*5.2-rollingResistance-tangent.y*3;
      // The platform's safety brake prevents missed stops, but cannot rescue a rough arrival.
      if(remaining<21){
        const safeSpeed=Math.sqrt(Math.max(0,remaining-.35)*4.6);
        if(state.speed>safeSpeed)acceleration=Math.min(acceleration,-2.3);
      }
      const oldSpeed=state.speed;
      state.speed=clamp(state.speed+acceleration*dt,0,18);
      state.acceleration=(state.speed-oldSpeed)/Math.max(dt,.0001);
      state.distance+=state.speed*dt;
      const lateral=state.speed*state.speed*curvature;
      const accelerationStrain=Math.max(0,Math.abs(state.acceleration)-1.85)*1.65;
      const corneringStrain=Math.max(0,lateral-2.4)*1.45;
      const windStrain=state.wind*Math.max(.3,state.speed/8)*1.35;
      const strain=(accelerationStrain+corneringStrain+windStrain)*(state.leaves ? .72 : 1);
      if(state.speed>.4){
        state.comfort=clamp(state.comfort+(strain>.15?-strain:.8)*dt,0,100);
        state.legQuality+=state.comfort*dt;state.legSamples+=dt;
        if(strain>1.9)state.roughTime+=dt;else state.roughTime=Math.max(0,state.roughTime-dt*.75);
        if(state.roughTime>3||state.comfort<48)breakStreak();
        if(strain<.8&&state.comfort>71)state.stableTime+=dt;else state.stableTime=Math.max(0,state.stableTime-dt*.6);
        if(state.stableTime>16&&state.streak<5){state.stableTime=0;state.streak++;state.broken=false;state.roughTime=0;toast(state.streak===1?'Finding your rhythm again.':'Lovely and steady. '+state.streak+'x smooth streak.',3.5);}
      }
      state.roll=damp(state.roll,clamp(-signedCurve*state.speed*.15,-.075,.075)+state.wind*Math.sin(elapsed*2)*.025,3.1,dt);
      if(remaining<55&&!state.approachNotified){state.approachNotified=true;subtitle(stations[state.to].name+' is just ahead.',6,state.autopilot?'Autopilot is slowing down for a gentle arrival.':'Ease into the brake. Give your neighbours a gentle arrival.');}
      if(state.distance>=state.nextStop||(remaining<2.4&&state.speed<1.4)){arrive(state.speed);return;}
      if(input.left)state.cameraOrbitTarget=clamp(state.cameraOrbitTarget-dt*.7,-1.2,1.2);
      if(input.right)state.cameraOrbitTarget=clamp(state.cameraOrbitTarget+dt*.7,-1.2,1.2);
      if(!input.left&&!input.right)state.cameraOrbitTarget=damp(state.cameraOrbitTarget,0,.8,dt);
    }
    function updateStation(dt){
      state.stationTime+=dt;const time=state.stationTime,station=stations[state.to];
      state.doorOpen=damp(state.doorOpen,time<7.2?1:0,4,dt);
      if(time>1.4&&!state.stationUnloaded){state.stationUnloaded=true;state.aboard=Math.max(3,state.aboard-3);updateRiders();}
      station.alighting.forEach((passenger,i)=>{
        const progress=clamp((time-.85-i*.4)/1.5,0,1);
        passenger.visible=time>.85+i*.4;
        passenger.position.lerpVectors(V(1.71,.95,2.5),V(5.55,.16,4.1+i*1.1),progress);
        passenger.position.y+=Math.sin(progress*Math.PI*5)*.025;
      });
      for(let i=0;i<station.queue.length;i++) {
        const passenger=station.queue[i];
        if(i>=state.boardingCount){passenger.visible=true;passenger.position.copy(passenger.userData.home);continue;}
        const progress=clamp((time-2.8-i*.32)/1.15,0,1);
        passenger.position.lerpVectors(passenger.userData.home,V(1.71,.95,2.5),progress);
        passenger.position.y+=Math.sin(progress*Math.PI)*.18;
        passenger.visible=progress<.96;
      }
      if(time>5.8&&!state.stationBoarded){state.stationBoarded=true;state.aboard=state.boardingTarget;updateRiders();subtitle('A few new faces. A few familiar ones.',3,'Please wait...');}
      if(time>6.1&&!state.arrivalGiven){
        state.arrivalGiven=true;const quality=state.legSamples?state.legQuality/state.legSamples:state.comfort;
        const smooth=quality>72&&state.comfort>64;
        const tips=smooth?75*Math.max(1,state.streak):20;
        state.coins+=tips;state.lastArrivalTips=tips;
        if(smooth){state.streak=Math.min(5,state.streak+1);state.broken=false;toast('A lovely arrival. +'+tips+' travel fund',4,false,'Your neighbours appreciate the gentle ride.');chime(880,.65,.11);}
        else toast('Everyone is safely here. +20 travel fund',4,false,'A gentler next leg will earn a little extra.');
        save();
      }
      if(time>8.1){
        const reached=state.to;state.from=reached;state.to=1-reached;state.legStart=state.nextStop;
        let next=stations[state.to].distance+Math.floor(state.distance/routeLength)*routeLength;
        if(next<=state.distance+1)next+=routeLength;state.nextStop=next;
        state.mode='driving';state.doorOpen=0;state.approachNotified=false;state.legQuality=0;state.legSamples=0;state.roughTime=0;state.comfort=Math.min(100,state.comfort+12);
        stations[state.to].queue.forEach(p=>{p.visible=true;p.position.copy(p.userData.home);});
        stations[state.to].alighting.forEach(p=>p.visible=false);
        updateDestinationBoard();
        subtitle('All aboard. Next stop: '+stations[state.to].name+'.',5,state.autopilot?'Boarding complete. Autopilot is taking us onward.':'Hold W or Power when you are ready.');chime(784,.45,.1);updateUI(true);
      }
    }

    function refreshWorkshopUI(){
      $('workshop-coins').textContent=state.coins.toLocaleString('en-US');
      for(const [key,id,cost] of [['leaves','fit-leaves',180],['companion','fit-companion',260]]){
        const button=$(id);button.disabled=state[key]||Boolean(state.fitting)||state.coins<cost;
        button.title=state[key]?'Already fitted to your tram':state.coins<cost?'Earn a few more tips on the Coastal Line.':'Fit this little upgrade for '+cost+' coins';
        if(state[key])button.innerHTML='<span>Made for you</span><span>Installed <svg><use href="#i-check"/></svg></span>';
        else button.innerHTML='<span>Make it yours <svg><use href="#i-arrow"/></svg></span><span><svg><use href="#i-coin"/></svg>'+cost+'</span>';
      }
      $('workshop-back').disabled=Boolean(state.fitting)||state.mode==='exiting';
    }
    function transition(action){
      if(state.transitioning)return;state.transitioning=true;clearInput();$('transition').classList.add('active');
      setTimeout(()=>{action();setTimeout(()=>{$('transition').classList.remove('active');state.transitioning=false;lastTime=performance.now();},120);},560);
    }
    function enterWorkshop(){
      if(state.paused||state.transitioning||state.mode==='workshop'||state.mode==='exiting')return;
      transition(()=>{
        state.savedDriveMode=state.mode;state.savedSpeed=state.speed;state.speed=0;state.mode='workshop';state.doorOpen=0;
        state.throttle=0;state.brake=0;state.fitting=null;
        workshopScene.add(tram);tram.position.set(0,.55,1);tram.quaternion.identity();suspension.rotation.set(0,0,0);suspension.position.set(0,0,0);roof.position.y=4.2;
        $('driving-hud').hidden=true;$('workshop-hud').hidden=false;requestAnimationFrame(()=>$('workshop-hud').classList.add('visible'));
        $('upgrade-options').hidden=false;$('fitting-progress').hidden=true;$('workbench-title').hidden=false;$('workbench-intro').hidden=false;
        $('back-label').textContent='Back to the line';refreshWorkshopUI();resize();toast('Welcome to Oliver\'s home island.',4);chime(523,.6,.1);
      });
    }
    function startFitting(kind){
      const cost=kind==='leaves'?180:260;
      if(state.mode!=='workshop'||state.fitting||state[kind]||state.coins<cost)return;
      state.fitting={kind,time:0,cost};$('upgrade-options').hidden=true;$('fitting-progress').hidden=false;$('workbench-title').hidden=true;$('workbench-intro').hidden=true;
      $('fitting-meter').setAttribute('aria-valuenow','0');
      $('fitting-name').textContent=kind==='leaves'?'Hearth leaves':'Little Companion';$('fitting-stage').textContent=kind==='leaves'?'Lifting the old part':'Preparing the tram';$('fitting-fill').style.width='0%';$('fitting-percent').textContent='0%';refreshWorkshopUI();audioGesture();chime(392,.45,.08);
    }
    function updateWorkshop(dt){
      if(state.mode==='exiting'){
        state.exitTime+=dt;tram.position.z=1+state.exitTime*state.exitTime*3.4;wheels.forEach(w=>w.rotation.x+=dt*state.exitTime*4);
        if(state.exitTime>1.65&&!state.transitioning)transition(()=>{
          scene.add(tram);state.mode=state.savedDriveMode;state.speed=state.mode==='driving'?Math.min(state.savedSpeed,5):0;
          roof.position.y=4.2;hoist.scale.y=1;$('workshop-hud').classList.remove('visible');$('workshop-hud').hidden=true;$('driving-hud').hidden=false;state.exitTime=0;
          updateTram(0);updateCamera(0,true);subtitle('All aboard. Next stop: the Coastal Line.',7,'Your little tram is ready for another story.');updateUI(true);
        });
        return;
      }
      tram.position.y=.55+Math.sin(elapsed*.9)*.012;
      if(!state.fitting)return;
      const fit=state.fitting;fit.time+=dt;const p=clamp(fit.time/8.5,0,1);
      $('fitting-fill').style.width=(p*100)+'%';$('fitting-percent').textContent=Math.round(p*100)+'%';
      $('fitting-meter').setAttribute('aria-valuenow',Math.round(p*100));
      if(fit.kind==='leaves'){
        const lift=p<.28?Math.sin(p/.28*Math.PI/2):p<.58?1:1-clamp((p-.58)/.27,0,1);
        roof.position.y=4.2+lift*1.6;hoist.scale.y=1-lift*.6;
        $('fitting-stage').textContent=p<.3?'Lifting the old part':p<.6?'Making room for a little green':'Settling the new canopy';
        if(p>.56){
          const growth=clamp((p-.56)/.3,.01,1);
          ivy.visible=true;ivy.scale.setScalar(growth);ivy.position.y=4.2*(1-growth)+(roof.position.y-4.2);
          roofMaterial.color.set('#779061');
        }
      }else{
        $('fitting-stage').textContent=p<.3?'Preparing the tram':p<.65?'Packing a little piece of home':'Making a friend comfortable';
        if(p>.3){companion.visible=true;companion.position.y=(1-clamp((p-.3)/.48,0,1))*2.7;}
        hoist.scale.y=1-Math.sin(p*Math.PI)*.18;
      }
      oliver.position.x=-3.2+Math.sin(p*TAU)*.5;oliver.rotation.y=Math.PI*.35+Math.sin(p*TAU)*.15;
      if(p>=1){
        state[fit.kind]=true;state.coins-=fit.cost;state.fitting=null;roof.position.y=4.2;hoist.scale.y=1;ivy.scale.setScalar(1);ivy.position.y=0;companion.position.y=0;applyUpgrades();save();
        $('fitting-progress').hidden=true;$('upgrade-options').hidden=false;$('workbench-title').hidden=false;$('workbench-intro').hidden=false;
        $('workbench-title').innerHTML='A little more<br>you.';$('back-label').textContent='All aboard';refreshWorkshopUI();toast('A little care makes a lovely difference.',4);chime(784,.6,.12);
      }
    }
    function leaveWorkshop(){
      if(state.mode!=='workshop'||state.fitting||state.transitioning)return;
      state.mode='exiting';state.exitTime=0;$('workshop-back').disabled=true;toast('All aboard.',3);chime(660,.5,.12);
    }
    $('workshop-button').onclick=enterWorkshop;$('workshop-back').onclick=leaveWorkshop;$('fit-leaves').onclick=()=>startFitting('leaves');$('fit-companion').onclick=()=>startFitting('companion');

    const cameraLook=V(),cameraGoal=V();
    function updateTram(dt){
      const f=railFrame(state.distance);
      tram.position.copy(f.p).addScaledVector(f.up,.235);
      tram.quaternion.copy(f.rotation);
      const motion=reduceMotion ? .28 : 1;
      suspension.rotation.z=state.roll*motion+Math.sin(elapsed*1.55)*.004*motion;
      suspension.rotation.x=damp(suspension.rotation.x,-state.acceleration*.007,4,dt);
      suspension.position.y=(Math.sin(state.distance*5.4)*Math.min(.025,state.speed*.0025)+Math.sin(elapsed*1.4)*.01)*motion;
      wheels.forEach(w=>w.rotation.x=state.distance/.48);
      doors.forEach(door=>door.position.z=2.49+state.doorOpen*1.24);
      if(state.mode==='driving')state.doorOpen=damp(state.doorOpen,0,5,dt);
      sun.position.copy(f.p).add(V(-70,105,55));sun.target.position.copy(f.p);
    }
    function updateCamera(dt,snap=false){
      const p=tram.position,f=tangentAt(state.distance),side=new THREE.Vector3().crossVectors(f,UP).normalize();
      state.cameraOrbit=damp(state.cameraOrbit,state.cameraOrbitTarget,4,dt);
      const portrait=smallScreen();
      let back=portrait?28:22.5,height=portrait?14.2:11.6,offset=portrait?-11.2:-13.2,lookAhead=portrait?6.5:7.5,lookHeight=3;
      if(state.cameraMode===1){back=-2.55;height=3.12;offset=.7;lookAhead=35;lookHeight=3.15;}
      if(state.cameraMode===2){back=33;height=23;offset=-26;lookAhead=8;lookHeight=2.4;}
      const vector=f.clone().multiplyScalar(-back).addScaledVector(side,offset).applyAxisAngle(UP,state.cameraOrbit);
      cameraGoal.copy(p).add(vector).add(V(0,height,0));
      const look=p.clone().addScaledVector(f,lookAhead).add(V(0,lookHeight,0));
      if(snap){camera.position.copy(cameraGoal);cameraLook.copy(look);}else{camera.position.lerp(cameraGoal,1-Math.exp(-dt*(state.cameraMode===1?8:3)));cameraLook.lerp(look,1-Math.exp(-dt*3.8));}
      camera.lookAt(cameraLook);
      if(!reduceMotion&&state.cameraMode!==2)camera.rotateZ(state.roll*.13);
      tram.visible=true;
    }
    function resize(){
      camera.aspect=innerWidth/innerHeight;camera.fov=smallScreen()?52:46;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
      const aspect=innerWidth/innerHeight,extent=smallScreen()?19/Math.max(aspect,.3):Math.max(20.6,28/aspect);
      workshopCamera.left=-extent*aspect;workshopCamera.right=extent*aspect;workshopCamera.top=extent;workshopCamera.bottom=-extent;workshopCamera.updateProjectionMatrix();
      if(smallScreen()){workshopCamera.position.set(29,32,35);workshopCamera.lookAt(0,2.3,0);workshopCamera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.17,innerWidth,innerHeight);}
      else {workshopCamera.clearViewOffset();workshopCamera.position.set(27,27,32);workshopCamera.lookAt(0,1,0);workshopCamera.setViewOffset(innerWidth,innerHeight,innerWidth*(innerWidth<900 ? .18 : .12),0,innerWidth,innerHeight);}
      workshopCamera.updateProjectionMatrix();
    }
    addEventListener('resize',resize);resize();
    function updateUI(force=false){
      if(!force&&elapsed-lastUI<.1)return;lastUI=elapsed;
      const speed=Math.round(state.speed*3.6),comfort=Math.round(state.comfort),remaining=Math.max(0,state.nextStop-state.distance);
      $('speed').textContent=speed;$('speed-fill').style.width=(speed/65*100)+'%';$('speed-meter').setAttribute('aria-valuenow',speed);
      $('coins').textContent=state.coins.toLocaleString('en-US');$('streak-value').textContent=state.streak;$('mobile-streak-value').textContent=state.streak;$('passengers').textContent=state.aboard+'/16';
      $('comfort-value').textContent=comfort+'%';$('comfort-fill').style.width=comfort+'%';$('comfort-fill').style.background=comfort<55?'#eab581':'#d8edbd';$('comfort-value').style.color=comfort<55?'#eab581':'#d8edbd';$('comfort-meter').setAttribute('aria-valuenow',comfort);
      const progress=clamp((state.distance-state.legStart)/(state.nextStop-state.legStart),0,1)*100;
      $('route-progress').style.width=progress+'%';$('route-tram').style.left=progress+'%';$('route-meter').setAttribute('aria-valuenow',Math.round(progress));
      $('origin-name').textContent=stations[state.from].name;$('route-destination').textContent=stations[state.to].name;$('destination-name').textContent=stations[state.to].name;
      $('next-label').textContent=state.mode==='station'?'A moment at,':'Next stop,';
      $('distance-label').textContent=state.mode==='station'?'A few hellos. A few goodbyes.':Math.round(remaining)+' m of lovely views';
      $('road-label').textContent=state.mode==='station'?'At the platform':state.wind>.35?'Crosswind':'Steady';
      const averageComfort=state.legSamples ? state.legQuality/state.legSamples : state.comfort;
      const estimatedTips=averageComfort>72&&state.comfort>64 ? 75*Math.max(1,state.streak) : 20;
      $('arrival-bonus').textContent='+'+(state.mode==='station'&&state.arrivalGiven ? state.lastArrivalTips : estimatedTips);
      $('control-hint').textContent=state.mode==='station'?'Doors open. Please wait...':state.wind>.35?'A little slower through the breeze.':'A gentle touch goes a long way.';
      if(state.autopilot)$('control-hint').textContent=state.mode==='station'?'Departing automatically after boarding.':'Auto speed · Power or Brake to take over.';
      const autoButton=$('autopilot-button');
      autoButton.setAttribute('aria-pressed',String(state.autopilot));
      autoButton.setAttribute('aria-label',state.autopilot?'Disable autopilot (P)':'Enable autopilot (P)');
      autoButton.classList.toggle('is-active',state.autopilot);
      autoButton.disabled=state.transitioning||!['driving','station'].includes(state.mode);
      $('autopilot-label').textContent=state.autopilot?'Autopilot on':'Autopilot';
      $('autopilot-status').textContent=state.autopilot?(state.mode==='station'?'Boarding':'Auto speed'):'Manual mode';
      const disabled=state.mode!=='driving';$('power-button').disabled=disabled;$('brake-button').disabled=disabled;
    }
    function animate(now){
      requestAnimationFrame(animate);
      const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;
      if(wasHidden)return;
      if(!state.paused){
        elapsed+=dt;
        
        if (scrollCtrl.isStoryMode) {
          scrollCtrl.update(dt);
        }
        if(!state.transitioning){

          if(state.mode==='driving')updateDriving(dt);
          else if(state.mode==='station')updateStation(dt);
          else updateWorkshop(dt);
        }
        if(state.mode==='driving'||state.mode==='station'){updateTram(dt);updateCamera(dt);}
        else {tram.visible=true;doors.forEach(door=>door.position.z=2.49);}
        seaUniforms.time.value=elapsed;
        const night=(1-Math.cos(elapsed/260))*.5;
        for(const key of ['top','horizon','low'])sky.material.uniforms[key+'Color'].value.lerpColors(twilight[key],midnight[key],night);
        scene.fog.color.lerpColors(twilight.fog,midnight.fog,night);
        seaUniforms.deep.value.lerpColors(twilight.sea,midnight.sea,night);
        seaUniforms.mist.value.copy(scene.fog.color);
        sun.intensity=lerp(3.05,.85,night);hemi.intensity=lerp(2.1,1.15,night);stars.material.opacity=lerp(.62,.95,night);
        clouds.forEach(c=>{c.root.position.x=c.x+Math.sin(elapsed*.016+c.phase)*4.5;});
        birds.forEach((b,i)=>{
          const angle=elapsed*b.speed+b.phase;b.root.position.set(49+Math.cos(angle)*b.radius,b.height+Math.sin(angle*2)*2,-104+Math.sin(angle)*b.radius*.75);b.root.rotation.y=-angle;
          b.wings.forEach((wing,j)=>wing.rotation.z=(j===0?-1:1)*(.14+Math.sin(elapsed*3.3+b.phase)*.3));
        });
        lighthouseBeacon.intensity=12+Math.sin(elapsed*.8)*3;
        if(elapsed>subtitleUntil)$('subtitle').classList.remove('visible');
        if(elapsed>toastUntil)$('toast').classList.remove('show');
        updateUI();
      }
      updateAudio();
      if(state.mode==='workshop'||state.mode==='exiting')renderer.render(workshopScene,workshopCamera);
      else renderer.render(scene,camera);
    }
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();state.paused=true;$('loading').classList.remove('finished');$('loading-status').textContent='The graphics context took a little break. Reload to return to the coast. Your upgrades are saved.';$('retry-button').hidden=false;});
    updateTram(0);updateCamera(0,true);updateUI(true);
    renderer.render(scene,camera);
    $('loading-fill').style.width='100%';
    $('loading-status').textContent='All aboard.';
    setTimeout(()=>{$('loading').classList.add('finished');subtitle('Welcome to Cloud Rail. Scroll to travel through my portfolio.',10,'Or switch to Free Drive mode to explore.');},350);
    lastTime=performance.now();requestAnimationFrame(animate);
    // Read-only diagnostics are available in the browser console without altering a journey.
    window.cloudrail={
      get state(){return {...state,fitting:state.fitting?{...state.fitting}:null};},
      get routeLength(){return routeLength;},
      get drawCalls(){return renderer.info.render.calls;},
      check(){
        const frames=Array.from({length:128},(_,i)=>railFrame(i/128*routeLength));
        return {
          closedRailway:route.getPointAt(0).distanceTo(route.getPointAt(1))<.001,
          finiteTrackFrames:frames.every(f=>[...f.p.toArray(),...f.rotation.toArray()].every(Number.isFinite)),
          distinctStops:Math.abs(stations[0].distance-stations[1].distance)>20,
          nextStopAhead:state.nextStop>=state.distance,
          validPassengerCount:state.aboard>=0&&state.aboard<=16,
          upgradesConnected:ivy.parent===suspension&&companion.parent===suspension,
          shadersReady:renderer.info.programs.every(program=>program.diagnostics?.runnable!==false)
        };
      }
    };
  }
  startCloudRail().catch(error=>{
    console.error('Cloud Rail could not start:',error);
    const message=String(error?.message||error);
    $('loading-status').textContent=/WebGL|context/i.test(message)
      ? 'This little world needs WebGL. Try enabling hardware acceleration or opening a current Chrome, Edge, Firefox, or Safari browser.'
      : /fetch|import|module|network|CORS/i.test(message)
        ? 'The coast is just out of reach. Check your connection and try again.'
        : 'Something on the line needs a little care. Please reload to try again. Technical details are in the browser console.';
    $('retry-button').hidden=false;$('loading-fill').style.width='8%';
  });