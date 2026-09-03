import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface NewHeroProps {
  onNavigate?: (page: string, data?: any) => void;
}

// ─── Three.js Robot Canvas ─────────────────────────────────────────────────────
function RobotCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene Setup ───────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7f6f3, 10, 30); // Matches background

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.0, 10.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.10;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── ROBOT GROUP ───────────────────────────────────────────────────────────
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0, -1.10, 0);
    scene.add(robotGroup);

    // Physics & GLTF variables
    let headNode: THREE.Object3D | null = null;
    let initialHeadRot = new THREE.Euler();
    let mixer: THREE.AnimationMixer | null = null;
    let loadedModel: THREE.Group | null = null;
    let rawModelSizeY = 0;

    const updateModelLayout = () => {
      if (!loadedModel || rawModelSizeY <= 0) return;
      const isMobile = window.innerWidth < 768;
      const targetHeight = isMobile ? 4.0 : 4.8;
      const scale = targetHeight / rawModelSizeY;
      loadedModel.scale.set(scale, scale, scale);
      
      loadedModel.position.set(0, 0, 0);
      const currentBox = new THREE.Box3().setFromObject(loadedModel);
      const center = new THREE.Vector3();
      currentBox.getCenter(center);
      
      loadedModel.position.x = -center.x - (isMobile ? 0.6 : 0);
      loadedModel.position.z = -center.z;
      loadedModel.position.y = -currentBox.min.y - 1.10;
    };

    // Load the Cute Robot GLB
    const loader = new GLTFLoader();
    loader.load('/cute_robot.glb', (gltf) => {
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

      // Setup baked animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
    }, undefined, (error) => {
      console.error("Error loading cute_robot.glb:", error);
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
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', minHeight: 'clamp(360px, 45vw, 520px)', cursor: 'pointer' }}
    />
  );
}

// ─── Main Hero Component ───────────────────────────────────────────────────────
const NewHero: React.FC<NewHeroProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim(); const loc = location.trim();
    if (!term && !loc) return;
    onNavigate?.('job-listings', { searchTerm: term, location: loc });
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-[#FAFBFC]"
      style={{ 
        minHeight: 'clamp(680px, calc(100vh - 68px), 860px)',
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
        
        {/* Left Side: Intricate Parametric Wave Mesh (Reference Match) */}
        <svg className="hidden md:block absolute left-0 top-0 h-full w-[35%] max-w-[450px] text-blue-500/[0.08] pointer-events-none overflow-hidden" viewBox="0 0 500 1000" fill="none" preserveAspectRatio="none">
          {/* Sweeping curves anchored to the left */}
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

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12
                      grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center h-full"
        style={{ minHeight: 'clamp(680px, calc(100vh - 68px), 860px)' }}>

        {/* ════ LEFT — Content ════ */}
        <motion.div
          className="w-full max-w-2xl space-y-7 py-12 sm:py-16 lg:py-20"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-indigo-600 font-semibold text-base sm:text-lg tracking-wide">
            Let AI Find Your Next Move
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight">
            Your <span className="text-orange-500">Dream</span> Job Is<br/>Waiting For You
          </h1>
          
          <p className="text-xs sm:text-lg text-gray-600 leading-relaxed font-medium pb-2 whitespace-nowrap max-w-none">
            AI career platform for jobs, skills, interview prep, and ATS-ready resumes.
          </p>

          <form onSubmit={handleSearch} className="w-full bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Search className="text-indigo-500 w-5 h-5 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Job Title, Keyword" 
                className="bg-transparent w-full min-w-0 outline-none text-gray-800 placeholder-gray-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <MapPin className="text-indigo-500 w-5 h-5 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="City Or Country" 
                className="bg-transparent w-full min-w-0 outline-none text-gray-800 placeholder-gray-400 font-medium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <button type="submit" className="bg-blue-600 text-white font-semibold px-6 sm:px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap">
              Find Job
            </button>
          </form>

          <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base font-medium">
            <span className="text-gray-900 font-bold">Popular Searches:</span>
            <span className="text-indigo-600 cursor-pointer hover:underline">Chemical</span>
            <span className="text-indigo-600 cursor-pointer hover:underline">Data analyst</span>
            <span className="text-indigo-600 cursor-pointer hover:underline">Power bi developer</span>
          </div>
        </motion.div>

        {/* ════ RIGHT — Three.js 3D Robot ════ */}
        <div className="flex items-center justify-center h-full min-h-[360px] lg:min-h-[600px] relative">
          {/* 3D Canvas */}
          <RobotCanvas />
          
          {/* HTML Overlay Chat Bubble */}
          <motion.div 
            className="absolute right-4 md:right-auto md:left-[84%] top-[10%] md:top-[12%] bg-white rounded-3xl px-6 py-4 shadow-xl border border-gray-100 flex items-center z-10 w-max max-w-[200px] md:max-w-none"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, type: 'spring', bounce: 0.5 }}
            style={{ 
              borderBottomLeftRadius: '0px', // sharp tail for SMS effect
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
            }}
          >
            <div className="font-bold text-gray-800 text-base md:text-lg">
              Hi, I am <span className="text-orange-500">ZYNC BOT!</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NewHero;
