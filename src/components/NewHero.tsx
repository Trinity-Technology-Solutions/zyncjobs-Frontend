import React, { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface NewHeroProps {
  onNavigate?: (page: string, data?: any) => void;
}

// ─── Three.js Robot Canvas ─────────────────────────────────────────────────────
function RobotCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let stopRender: (() => void) | undefined;
    const startRenderer = () => {
    // ── Scene Setup ───────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7f6f3, 10, 30); // Matches background

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.8, 10.0);
    camera.lookAt(0, 0.9, 0);

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { return; }
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // ── Environment & Lights (3-Point Lighting) ──────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.001;
    keyLight.shadow.camera.left = -15;
    keyLight.shadow.camera.right = 15;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-10, 5, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // ── FLOOR (Shadow fix) ──────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.10;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── ROBOT GROUP ───────────────────────────────────────────────────────────
    const robotGroup = new THREE.Group();
    const getRobotX = () => {
      const w = window.innerWidth;
      if (w >= 1536) return -0.85;
      if (w >= 1280) return -0.75;
      if (w >= 1024) return -0.70;
      if (w >= 768) return -0.60;
      return 0;
    };
    robotGroup.position.set(getRobotX(), -1.10, 0);
    scene.add(robotGroup);

    // Physics & GLTF variables
    let headNode: THREE.Object3D | null = null;
    let initialHeadRot = new THREE.Euler();
    let mixer: THREE.AnimationMixer | null = null;
    let loadedModel: THREE.Group | null = null;
    let rawModelSizeY = 0;
    const baseCenter = new THREE.Vector3();
    let baseMinY = 0;

    const updateModelLayout = () => {
      if (!loadedModel || rawModelSizeY <= 0) return;
      const w = window.innerWidth;
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1024;
      const isLargeScreen = w >= 1536;

      let targetHeight = 5.6;
      if (isMobile) {
        targetHeight = 4.2;
      } else if (isTablet) {
        targetHeight = 4.6;
      } else if (isLargeScreen) {
        targetHeight = 6.0;
      } else {
        targetHeight = 5.6;
      }

      camera.lookAt(0, isMobile || isTablet ? 0.9 : targetHeight / 2 - 2.20, 0);
      // Leave room for the antenna as the original head follows the pointer.
      camera.zoom = isMobile ? 1 : 0.92;
      camera.updateProjectionMatrix();
      const scale = targetHeight / rawModelSizeY;
      loadedModel.scale.set(scale, scale, scale);
      
      // Deterministic positioning based on invariant rest-pose bounding box
      // Prevents shifts caused by animation bones or head tracking during resize/refresh
      loadedModel.position.x = -baseCenter.x * scale;
      loadedModel.position.z = -baseCenter.z * scale;
      loadedModel.position.y = -baseMinY * scale - 1.10;
      robotGroup.position.x = getRobotX();
    };

    // Load the Cute Robot GLB
    const loader = new GLTFLoader();
    loader.load('/cute_robot.glb', (gltf) => {
      if (disposed) return;
      const model = gltf.scene as THREE.Group;
      
      // Auto-detect the head node FIRST before altering transforms
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // Make it metallic and shiny!
          if (mesh.material) {
            // @ts-ignore
            mesh.material.metalness = 0.8;
            // @ts-ignore
            mesh.material.roughness = 0.2;
            // @ts-ignore
            mesh.material.needsUpdate = true;
          }

          // Hide any baked-in chat bubble/cloud/plane/text meshes
          const meshName = mesh.name.toLowerCase();
          if (meshName.includes('chat') || meshName.includes('cloud') || meshName.includes('bubble') || meshName.includes('text') || meshName.includes('plane') || meshName.includes('dot') || meshName.includes('bezier') || meshName.includes('curve') || meshName.includes('cube') || meshName.includes('circle') || meshName.includes('sphere')) {
            mesh.visible = false;
          }
        }

        const name = child.name.toLowerCase();
        if (
          !headNode && 
          (child.type === 'Bone' || child.type === 'Object3D' || child.type === 'Mesh' || child.type === 'Group') &&
          (name.includes('head') || name.includes('neck') || name.includes('helmet') || name.includes('mixamorighead'))
        ) {
          headNode = child;
          initialHeadRot.copy(child.rotation);
          console.log("Successfully auto-detected head node:", child.name);
        }
      });

      // Auto-scale to ensure the model is visible (approx 4 units tall)
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(baseCenter);
      baseMinY = box.min.y;
      
      console.log("Model bounding box size:", size);
      
      if (size.y > 0) {
        loadedModel = model;
        rawModelSizeY = size.y;
        updateModelLayout();
      } else {
        console.warn("Model size.y is 0, applying fallback scale");
        model.scale.set(2, 2, 2);
      }

      robotGroup.add(model);
      setReady(size.y > 0);

      // Setup baked animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
    }, undefined, () => {
      if (!disposed) setReady(false);
      stopRender?.();
      stopRender = undefined;
    });

    // ── PHYSICS REFS ──────────────────────────────────────────────────────────
    let headYaw = 0, headPitch = 0;
    let tgtYaw = 0, tgtPitch = 0;
    let floatT = 0;
    let prevTime = performance.now();
    let isIdle = false;
    let idleTimer: ReturnType<typeof setTimeout>;

    // ── CURSOR TRACKING ───────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
      
      // Calculate target rotations based on cursor
      tgtYaw   =  nx * (Math.PI / 8);
      tgtPitch =  ny * (Math.PI / 12);

      isIdle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { isIdle = true; }, 600);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ── RENDER LOOP ───────────────────────────────────────────────────────────
    let rafId: number;
    const render = (now: number) => {
      const dt = Math.min((now - prevTime) / 16.667, 4);
      prevTime = now;
      floatT += dt * 0.013;
      const timeSec = now * 0.001;

      // Animation mixer update
      if (mixer) mixer.update(dt * 0.016667);

      if (isIdle) { 
        tgtYaw *= 0.93; 
        tgtPitch *= 0.93; 
      }

      // Smooth interpolation for head motion
      const hf = 1 - Math.pow(1 - 0.15, dt);
      headYaw   += (tgtYaw   - headYaw)   * hf;
      headPitch += (tgtPitch - headPitch) * hf;

      // Base idle float
      let floatY = Math.sin(floatT * Math.PI * 2 * (16.667 / 3200)) * 0.15;
      let floatR = Math.sin(floatT * Math.PI * 2 * 0.65) * 0.026;

      if (headNode) {
        headNode.rotation.y = initialHeadRot.y + headYaw;
        headNode.rotation.x = initialHeadRot.x + headPitch;
        headNode.rotation.z = initialHeadRot.z + floatR;
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      updateModelLayout();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
      resizeObserver.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    };
    const controller = new AbortController();
    // Vite returns HTML for missing public assets; keep the vector fallback in that case.
    fetch('/cute_robot.glb', { method: 'HEAD', signal: controller.signal }).then(response => {
      if (!disposed && response.ok && !response.headers.get('content-type')?.includes('text/html')) stopRender = startRenderer();
    }).catch(() => { /* The branded fallback remains visible. */ });
    return () => { disposed = true; controller.abort(); stopRender?.(); };
  }, []);

  return (
    <div className={`hero-bot-renderer ${ready ? 'has-model' : ''}`} aria-hidden="true">
      <div ref={mountRef} className="hero-bot-webgl" />
      {!ready && <span className="hero-original-bot-loading" />}
    </div>
  );
}

// ─── Main Hero Component ───────────────────────────────────────────────────────
const NewHero: React.FC<NewHeroProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim(); const loc = location.trim();
    onNavigate?.('job-listings', { searchTerm: term, location: loc });
  };

  return (
    <div
      className="home-existing-hero relative w-full overflow-hidden bg-slate-50"
      style={{ 
        paddingTop: 'var(--header-h, 86px)',
      }}
    >
      {/* Background Decoratives - Professional Corporate Aesthetic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Subtle Atmospheric Glows for Depth */}
        <div className="absolute left-[-10%] top-[10%] w-[50%] h-[70%] bg-[#f0f4f8]/60 rounded-full blur-[100px]" />
        <div className="absolute right-[-5%] bottom-[-10%] w-[40%] h-[60%] bg-[#eef2f6]/60 rounded-full blur-[100px]" />

        {/* Subtle Dotted Grid in the center-right transition area */}
        <div
          className="absolute left-[45%] lg:left-[50%] top-[30%] w-[250px] h-[350px] opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
          }}
        />

        {/* Left Side: Intricate Parametric Wave Mesh */}
        <svg className="hidden md:block absolute left-0 top-0 h-full w-[35%] max-w-[450px] text-blue-500/[0.08] pointer-events-none overflow-hidden" viewBox="0 0 500 1000" fill="none" preserveAspectRatio="none">
          {Array.from({ length: 45 }).map((_, i) => (
            <path
              key={`wave-${i}`}
              d={`M -50 ${-100 + i * 25} C ${150 + i * 8} ${100 + i * 15}, ${300 - i * 4} ${500 + i * 12}, ${50 + i * 15} 1100`}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-8 xl:gap-12 items-center">

        {/* ════ LEFT — Content ════ */}
        <motion.div
          className="hero-main-copy w-full max-w-2xl space-y-3.5 sm:space-y-4 lg:space-y-5 py-6 sm:py-8 lg:py-10 xl:py-12"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-blue-600 font-semibold text-xs sm:text-sm tracking-wide uppercase">
            Let AI Find Your Next Move
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            <span>Your <span className="text-blue-600">Dream</span> Job Is</span><br />
            <span>Waiting For You</span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed font-medium pb-1 sm:pb-2 max-w-xl">
            AI career platform for jobs, skills, interview prep, and ATS-ready resumes.
          </p>

          <form role="search" aria-label="Search jobs" onSubmit={handleSearch} className="home-existing-search">
            <div className="hero-search-field">
              <Search size={19} aria-hidden="true" />
              <div className="hero-search-input-wrap">
              <label className="sr-only" htmlFor="hero-job-keywords">Keywords</label>
              <input 
                id="hero-job-keywords"
                type="text" 
                aria-label="Job title, skills, or company"
                placeholder="Job title, skills, or company"
                className="bg-transparent w-full min-w-0 outline-none text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              </div>
            </div>
            
            <div className="hero-search-field">
              <MapPin size={19} aria-hidden="true" />
              <div className="hero-search-input-wrap">
              <label className="sr-only" htmlFor="hero-job-location">Location</label>
              <input 
                id="hero-job-location"
                type="text" 
                aria-label="City or country"
                placeholder="City or country"
                className="bg-transparent w-full min-w-0 outline-none text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              </div>
            </div>

            <button type="submit" className="hero-search-submit">
              Find jobs <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <div className="hero-popular-searches">
            <span>Popular Searches:</span>
            <div className="hero-search-chips">
            {['Chemical', 'Data analyst', 'Power BI developer'].map(term => (
              <button key={term} type="button" onClick={() => onNavigate?.('job-listings', { searchTerm: term })}>{term}<ArrowRight size={12} aria-hidden="true" /></button>
            ))}
            </div>
          </div>
        </motion.div>

        <div className="home-existing-robot hero-original-robot">
          <span className="hero-original-greeting">Hi, I am <strong>ZYNC BOT!</strong></span>
          <div className="hero-original-canvas"><RobotCanvas /></div>
        </div>
      </div>
    </div>
  );
};

export default NewHero;
