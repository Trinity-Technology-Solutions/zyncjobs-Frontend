Created At: 2026-08-31T13:45:03+05:30
Completed At: 2026-08-31T13:45:03+05:30
File Path: `file:///c:/Users/Joel%20Iman/zyncjobs-Frontend/src/components/NewHero.tsx`
Total Lines: 393
Total Bytes: 17124
Showing lines 1 to 393
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import React, { useState, useEffect, useRef } from "react";
2: import { motion, AnimatePresence } from 'framer-motion';
3: import { Search, MapPin, Sparkles } from 'lucide-react';
4: import * as THREE from 'three';
5: import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
6: import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
7: 
8: interface NewHeroProps {
9:   onNavigate?: (page: string, data?: any) => void;
10: }
11: 
12: // ─── Three.js Robot Canvas ─────────────────────────────────────────────────────
13: function RobotCanvas() {
14:   const mountRef = useRef<HTMLDivElement>(null);
15: 
16:   useEffect(() => {
17:     const mount = mountRef.current;
18:     if (!mount) return;
19: 
20:     // ── Scene Setup ───────────────────────────────────────────────────────────
21:     const scene = new THREE.Scene();
22:     scene.fog = new THREE.Fog(0xf7f6f3, 10, 30); // Matches background
23: 
24:     const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
25:     camera.position.set(0, 2.0, 10.5);
26:     camera.lookAt(0, 0.5, 0);
27: 
28:     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
29:     renderer.setSize(mount.clientWidth, mount.clientHeight);
30:     renderer.setPixelR
<truncated 15434 bytes>
tespace-nowrap">
354:               Find Job
355:             </button>
356:           </form>
357: 
358:           <div className="pt-6 flex flex-wrap items-center gap-3 text-sm font-medium">
359:             <span className="text-gray-900 font-bold">Popular Searches:</span>
360:             <span className="text-indigo-600 cursor-pointer hover:underline">Chemical</span>
361:             <span className="text-indigo-600 cursor-pointer hover:underline">Data analyst</span>
362:             <span className="text-indigo-600 cursor-pointer hover:underline">Power bi developer</span>
363:           </div>
364:         </motion.div>
365: 
366:         {/* ════ RIGHT — Three.js 3D Robot ════ */}
367:         <div className="flex items-center justify-center h-full relative" style={{ minHeight: '600px' }}>
368:           {/* 3D Canvas */}
369:           <RobotCanvas />
370:           
371:           {/* HTML Overlay Chat Bubble */}
372:           <motion.div 
373:             className="absolute left-[78%] md:left-[84%] top-[10%] md:top-[12%] bg-white rounded-3xl px-6 py-4 shadow-xl border border-gray-100 flex items-center z-10 w-max max-w-[200px] md:max-w-none"
374:             initial={{ opacity: 0, scale: 0.8, x: 20 }}
375:             animate={{ opacity: 1, scale: 1, x: 0 }}
376:             transition={{ duration: 0.6, delay: 0.5, type: 'spring', bounce: 0.5 }}
377:             style={{ 
378:               borderBottomLeftRadius: '0px', // sharp tail for SMS effect
379:               boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
380:             }}
381:           >
382:             <div className="font-bold text-gray-800 text-base md:text-lg">
383:               Hi, I am <span className="text-orange-500">ZYNC BOT!</span>
384:             </div>
385:           </motion.div>
386:         </div>
387:       </div>
388:     </div>
389:   );
390: };
391: 
392: export default NewHero;
393: 
The above content shows the entire, complete file contents of the requested file.
