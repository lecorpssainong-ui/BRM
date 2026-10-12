import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Sparkles, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { PainZone } from './BodyPainMapping';

export type BodyCategory = 'skeleton' | 'arms' | 'feet' | 'head' | 'trunk';

interface ThreeBodyAnatomyProps {
  selectedZones: PainZone[];
  onToggleZone: (zone: {
    zone_id: string;
    zone_name: string;
    side: 'front' | 'back';
    category: BodyCategory;
  }) => void;
  activeCategory: BodyCategory;
  skeletonSide: 'front' | 'back';
  onSideChange: (side: 'front' | 'back') => void;
}

// Camera targets per category
const CAMERA_PRESETS: Record<BodyCategory, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  skeleton: { pos: [0, 0, 5.4], lookAt: [0, 0, 0] },
  head: { pos: [0, 1.85, 2.4], lookAt: [0, 1.8, 0] },
  trunk: { pos: [0, 0.75, 2.6], lookAt: [0, 0.75, 0] },
  arms: { pos: [0, 0.65, 3.1], lookAt: [0, 0.65, 0] },
  feet: { pos: [0, -1.9, 2.4], lookAt: [0, -1.9, 0] },
};

export default function ThreeBodyAnatomy({
  selectedZones,
  onToggleZone,
  activeCategory,
  skeletonSide,
  onSideChange,
}: ThreeBodyAnatomyProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Store references for the ThreeJS loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Rotation and interaction states
  const targetRotationY = useRef<number>(0);
  const currentRotationY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const previousPointerX = useRef<number>(0);
  const pointerVelocityX = useRef<number>(0);

  // Target camera positions
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5.4));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Sync side switch to rotation angle
  useEffect(() => {
    if (skeletonSide === 'front') {
      targetRotationY.current = 0;
    } else {
      targetRotationY.current = Math.PI;
    }
  }, [skeletonSide]);

  // Sync active category to camera zoom position
  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCategory] || CAMERA_PRESETS.skeleton;
    targetCamPos.current.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    targetLookAt.current.set(preset.lookAt[0], preset.lookAt[1], preset.lookAt[2]);
  }, [activeCategory]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.4);
    cameraRef.current = camera;

    // 3. Renderer with High Performance & Alpha transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.1);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xfff0dd, 1.4);
    dirLightFront.position.set(3, 4, 5);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0xd4af37, 1.0);
    dirLightBack.position.set(-3, 3, -5);
    scene.add(dirLightBack);

    const pointLightGold = new THREE.PointLight(0xffb700, 1.2, 10);
    pointLightGold.position.set(0, 0.5, 2.5);
    scene.add(pointLightGold);

    // 5. Build Stylized Human Anatomy Mesh Hierarchy
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    // Base Material Template
    const createBodyPartMaterial = () =>
      new THREE.MeshStandardMaterial({
        color: 0xded2be,
        roughness: 0.35,
        metalness: 0.15,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });

    const meshesMap = new Map<string, THREE.Mesh>();

    const addBodyMesh = (
      zone_id: string,
      zone_name: string,
      side: 'front' | 'back',
      category: BodyCategory,
      geometry: THREE.BufferGeometry,
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ) => {
      const mat = createBodyPartMaterial();
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.scale.set(...scale);
      mesh.userData = {
        zone_id,
        zone_name,
        side,
        category,
        isBodyPart: true,
        baseScale: scale,
      };
      bodyGroup.add(mesh);
      meshesMap.set(zone_id, mesh);
      return mesh;
    };

    // --- ANATOMICAL SEGMENTS ---

    // 1. Head / Skull
    const headGeo = new THREE.SphereGeometry(0.32, 28, 28);
    headGeo.scale(0.85, 1.15, 0.95);
    addBodyMesh('tete', 'Tête / Crâne & Sinus', 'front', 'head', headGeo, [0, 2.05, 0]);

    // 2. Occiput / Back of Head
    const occiputGeo = new THREE.SphereGeometry(0.3, 20, 20);
    occiputGeo.scale(0.85, 0.95, 0.6);
    addBodyMesh('occiput', 'Nuque & Base du Crâne', 'back', 'head', occiputGeo, [0, 1.95, -0.15]);

    // 3. Neck / Cervical Spine
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.32, 20);
    addBodyMesh('cou', 'Cou & Cervicales', 'front', 'head', neckGeo, [0, 1.62, 0]);

    // 4. Shoulders (Deltoids)
    const shoulderGeoL = new THREE.SphereGeometry(0.18, 20, 20);
    shoulderGeoL.scale(1.1, 0.9, 0.9);
    addBodyMesh('epaule_g', 'Épaule Gauche & Trapèze', 'front', 'arms', shoulderGeoL, [-0.68, 1.42, 0]);

    const shoulderGeoR = new THREE.SphereGeometry(0.18, 20, 20);
    shoulderGeoR.scale(1.1, 0.9, 0.9);
    addBodyMesh('epaule_d', 'Épaule Droite & Trapèze', 'front', 'arms', shoulderGeoR, [0.68, 1.42, 0]);

    // 5. Upper Torse / Pectorals
    const chestGeo = new THREE.CylinderGeometry(0.48, 0.42, 0.52, 24);
    chestGeo.scale(1.1, 1, 0.7);
    addBodyMesh('torse', 'Torse & Pectoraux', 'front', 'trunk', chestGeo, [0, 1.22, 0.05]);

    // 6. Upper Back / Omoplates
    const upperBackGeo = new THREE.BoxGeometry(0.85, 0.5, 0.22);
    addBodyMesh('haut_dos', 'Dos Supérieur & Omoplates', 'back', 'trunk', upperBackGeo, [0, 1.24, -0.1]);

    // 7. Abdomen / Solar Plexus
    const abdomenGeo = new THREE.CylinderGeometry(0.4, 0.38, 0.48, 24);
    abdomenGeo.scale(1.0, 1, 0.68);
    addBodyMesh('abdomen', 'Abdomen & Plexus Solaire', 'front', 'trunk', abdomenGeo, [0, 0.74, 0.04]);

    // 8. Lower Back / Lombaires
    const lumbarGeo = new THREE.BoxGeometry(0.72, 0.46, 0.2);
    addBodyMesh('lombaires', 'Région Lombaire (Bas du dos)', 'back', 'trunk', lumbarGeo, [0, 0.74, -0.09]);

    // 9. Pelvis / Bassin
    const pelvisGeo = new THREE.CylinderGeometry(0.41, 0.44, 0.42, 24);
    pelvisGeo.scale(1.05, 1, 0.75);
    addBodyMesh('bassin', 'Bassin & Hanches', 'front', 'trunk', pelvisGeo, [0, 0.32, 0.02]);

    // 10. Glutes / Fessiers
    const glutesGeoL = new THREE.SphereGeometry(0.24, 20, 20);
    glutesGeoL.scale(1.0, 1.1, 0.85);
    addBodyMesh('fessier_g', 'Fessier Gauche & Sacrum', 'back', 'trunk', glutesGeoL, [-0.22, 0.28, -0.15]);

    const glutesGeoR = new THREE.SphereGeometry(0.24, 20, 20);
    glutesGeoR.scale(1.0, 1.1, 0.85);
    addBodyMesh('fessier_d', 'Fessier Droit & Sacrum', 'back', 'trunk', glutesGeoR, [0.22, 0.28, -0.15]);

    // 11. Upper Arms (Biceps / Triceps)
    const armGeoL = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 18);
    addBodyMesh('bras_g', 'Bras Gauche (Biceps/Triceps)', 'front', 'arms', armGeoL, [-0.74, 0.98, 0], [0, 0, -0.1]);

    const armGeoR = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 18);
    addBodyMesh('bras_d', 'Bras Droit (Biceps/Triceps)', 'front', 'arms', armGeoR, [0.74, 0.98, 0], [0, 0, 0.1]);

    // 12. Forearms (Avant-bras)
    const forearmGeoL = new THREE.CylinderGeometry(0.095, 0.08, 0.52, 18);
    addBodyMesh('avant_bras_g', 'Avant-bras Gauche', 'front', 'arms', forearmGeoL, [-0.84, 0.45, 0], [0, 0, -0.06]);

    const forearmGeoR = new THREE.CylinderGeometry(0.095, 0.08, 0.52, 18);
    addBodyMesh('avant_bras_d', 'Avant-bras Droit', 'front', 'arms', forearmGeoR, [0.84, 0.45, 0], [0, 0, 0.06]);

    // 13. Hands (Mains & Poignets)
    const handGeoL = new THREE.BoxGeometry(0.14, 0.22, 0.07);
    addBodyMesh('main_g', 'Main & Poignet Gauche', 'front', 'arms', handGeoL, [-0.88, 0.08, 0]);

    const handGeoR = new THREE.BoxGeometry(0.14, 0.22, 0.07);
    addBodyMesh('main_d', 'Main & Poignet Droit', 'front', 'arms', handGeoR, [0.88, 0.08, 0]);

    // 14. Thighs (Cuisses - Quadriceps / Ischios)
    const thighGeoL = new THREE.CylinderGeometry(0.19, 0.14, 0.85, 20);
    addBodyMesh('cuisse_g', 'Cuisse Gauche (Quadriceps)', 'front', 'feet', thighGeoL, [-0.25, -0.32, 0], [0, 0, 0.04]);

    const thighGeoR = new THREE.CylinderGeometry(0.19, 0.14, 0.85, 20);
    addBodyMesh('cuisse_d', 'Cuisse Droite (Quadriceps)', 'front', 'feet', thighGeoR, [0.25, -0.32, 0], [0, 0, -0.04]);

    // 15. Knees (Genoux)
    const kneeGeoL = new THREE.SphereGeometry(0.13, 18, 18);
    kneeGeoL.scale(1, 1, 0.9);
    addBodyMesh('genou_g', 'Genou Gauche (Rotule)', 'front', 'feet', kneeGeoL, [-0.26, -0.82, 0.02]);

    const kneeGeoR = new THREE.SphereGeometry(0.13, 18, 18);
    kneeGeoR.scale(1, 1, 0.9);
    addBodyMesh('genou_d', 'Genou Droit (Rotule)', 'front', 'feet', kneeGeoR, [0.26, -0.82, 0.02]);

    // 16. Calves & Shins (Mollets & Tibias)
    const calfGeoL = new THREE.CylinderGeometry(0.14, 0.1, 0.85, 20);
    addBodyMesh('mollet_g', 'Jambe & Mollet Gauche', 'front', 'feet', calfGeoL, [-0.26, -1.32, 0], [0, 0, 0.02]);

    const calfGeoR = new THREE.CylinderGeometry(0.14, 0.1, 0.85, 20);
    addBodyMesh('mollet_d', 'Jambe & Mollet Droit', 'front', 'feet', calfGeoR, [0.26, -1.32, 0], [0, 0, -0.02]);

    // 17. Feet & Reflexology (Pieds & Voûtes plantaires)
    const footGeoL = new THREE.BoxGeometry(0.18, 0.12, 0.42);
    addBodyMesh('pied_g', 'Pied Gauche & Voûte Plantaire', 'front', 'feet', footGeoL, [-0.26, -1.82, 0.12]);

    const footGeoR = new THREE.BoxGeometry(0.18, 0.12, 0.42);
    addBodyMesh('pied_d', 'Pied Droit & Voûte Plantaire', 'front', 'feet', footGeoR, [0.26, -1.82, 0.12]);

    meshesMapRef.current = meshesMap;
    setCanvasReady(true);

    // 6. Raycasting Setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedMesh = (event: MouseEvent | TouchEvent): THREE.Mesh | null => {
      if (!rendererRef.current || !cameraRef.current) return null;
      const rect = rendererRef.current.domElement.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;

      if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('changedTouches' in event && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(bodyGroup.children, true);

      if (intersects.length > 0) {
        const first = intersects[0].object as THREE.Mesh;
        if (first.userData?.isBodyPart) {
          return first;
        }
      }
      return null;
    };

    // Event Handlers for Drag Rotation & Click
    let pointerDownTime = 0;
    let pointerMoved = false;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      pointerMoved = false;
      pointerDownTime = Date.now();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      previousPointerX.current = clientX;
      pointerVelocityX.current = 0;
      setIsRotating(true);
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

      if (isDragging.current) {
        const deltaX = clientX - previousPointerX.current;
        if (Math.abs(deltaX) > 3) {
          pointerMoved = true;
        }
        pointerVelocityX.current = deltaX * 0.008;
        targetRotationY.current += pointerVelocityX.current;
        previousPointerX.current = clientX;
      } else {
        // Hover raycasting
        const mesh = getIntersectedMesh(e);
        if (mesh && mesh.userData?.zone_name) {
          setHoveredZoneName(mesh.userData.zone_name);
          rendererRef.current?.domElement.style.setProperty('cursor', 'pointer');
        } else {
          setHoveredZoneName(null);
          rendererRef.current?.domElement.style.setProperty('cursor', 'grab');
        }
      }
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      isDragging.current = false;
      setIsRotating(false);

      const elapsed = Date.now() - pointerDownTime;
      // If tap/click without heavy dragging
      if (!pointerMoved && elapsed < 350) {
        const mesh = getIntersectedMesh(e);
        if (mesh && mesh.userData?.isBodyPart) {
          const { zone_id, zone_name, side, category } = mesh.userData;
          onToggleZone({ zone_id, zone_name, side, category });
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    domElement.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    domElement.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop (60 FPS with Smooth Inertia and Camera Lerp)
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Inertia & Damping
      if (!isDragging.current && Math.abs(pointerVelocityX.current) > 0.0001) {
        targetRotationY.current += pointerVelocityX.current;
        pointerVelocityX.current *= 0.92;
      }

      // Smooth rotation spring interpolation
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.12;
      bodyGroup.rotation.y = currentRotationY.current;

      // Subtle breathing float animation
      bodyGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.025;

      // Smooth Camera & LookAt Lerp
      camera.position.lerp(targetCamPos.current, 0.08);
      currentLookAt.current.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 8. Rigorous WebGL Memory Cleanup on Unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('touchstart', onPointerDown);
      domElement.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', handleResize);

      // Dispose Geometries and Materials
      meshesMap.forEach((mesh) => {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update Mesh Highlights, Colors and Scale based on Selected Zones
  useEffect(() => {
    if (!canvasReady || !meshesMapRef.current) return;

    meshesMapRef.current.forEach((mesh, zoneId) => {
      const isSelected = selectedZones.some((z) => z.zone_id === zoneId);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const baseScale = mesh.userData.baseScale || [1, 1, 1];

      if (isSelected) {
        // Glowing Gold/Amber Emissive
        mat.color.setHex(0xe07a5f);
        mat.emissive.setHex(0xffaa00);
        mat.emissiveIntensity = 1.35;
        mat.roughness = 0.2;
        mat.metalness = 0.3;
        mesh.scale.set(baseScale[0] * 1.1, baseScale[1] * 1.1, baseScale[2] * 1.1);
      } else {
        // Default warm porcelain
        mat.color.setHex(0xded2be);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mat.roughness = 0.35;
        mat.metalness = 0.15;
        mesh.scale.set(baseScale[0], baseScale[1], baseScale[2]);
      }
    });
  }, [selectedZones, canvasReady]);

  // Flip 180° Action
  const handleFlip180 = useCallback(() => {
    const nextSide = skeletonSide === 'front' ? 'back' : 'front';
    onSideChange(nextSide);
  }, [skeletonSide, onSideChange]);

  // Reset Camera View
  const handleResetView = useCallback(() => {
    targetRotationY.current = skeletonSide === 'front' ? 0 : Math.PI;
    const preset = CAMERA_PRESETS[activeCategory] || CAMERA_PRESETS.skeleton;
    targetCamPos.current.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    targetLookAt.current.set(preset.lookAt[0], preset.lookAt[1], preset.lookAt[2]);
  }, [skeletonSide, activeCategory]);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 3D Scene Controls Header */}
      <div className="w-full flex items-center justify-between gap-3 mb-2 pb-2.5 border-b border-cacao/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
            Vue 3D : {skeletonSide === 'front' ? 'Face (Avant)' : 'Dos (Arrière)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-xl border border-cacao/15 dark:border-white/15 text-cacao/70 dark:text-sand/70 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
            title="Recentrer la vue 3D"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFlip180}
            className="btn-gold py-1.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
            title="Pivoter le mannequin à 180°"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Pivoter 180° ({skeletonSide === 'front' ? 'Voir le Dos' : 'Voir la Face'})</span>
          </button>
        </div>
      </div>

      {/* WebGL Canvas Viewport */}
      <div className="relative w-full aspect-[320/420] sm:aspect-[340/440] max-h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-stone-100/70 to-stone-200/50 dark:from-stone-900/60 dark:to-stone-950/80 border border-cacao/10 dark:border-amber-400/20 shadow-inner flex items-center justify-center">
        {/* Three.js canvas mount point */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Hover / Active Zone Tooltip Badge */}
        {hoveredZoneName && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-cacao/90 text-sand dark:bg-amber-400 dark:text-stone-950 text-xs font-bold shadow-lg backdrop-blur-md pointer-events-none animate-fadeIn flex items-center gap-1.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-gold dark:text-stone-950" />
            <span>{hoveredZoneName}</span>
          </div>
        )}

        {/* Floating Touch & Gesture Guide Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md text-[10px] font-semibold text-cacao/70 dark:text-sand/70 pointer-events-none border border-cacao/10 dark:border-white/10 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <span>👆 Touchez pour cibler</span>
          <span>•</span>
          <span>🔄 Glissez pour pivoter à 360°</span>
        </div>
      </div>

      <p className="text-[11px] text-cacao/60 dark:text-sand/60 text-center mt-2.5 font-medium">
        ✨ Modèle anatomique 3D WebGL fluide avec détection de clic par rayon (Raycasting).
      </p>
    </div>
  );
}
