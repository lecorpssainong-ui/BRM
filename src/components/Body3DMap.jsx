import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Sparkles,
  Flame,
  Activity,
  Check,
  X,
  Plus,
  RefreshCw,
  Sliders,
} from 'lucide-react';

// Camera position and lookAt targets for each sub-region
const CAMERA_ZOOM_TARGETS = {
  skeleton: { pos: [0, 0, 5.4], lookAt: [0, 0, 0] },
  head: { pos: [0, 1.85, 2.3], lookAt: [0, 1.8, 0] },
  trunk: { pos: [0, 0.75, 2.5], lookAt: [0, 0.75, 0] },
  arms: { pos: [0, 0.65, 3.0], lookAt: [0, 0.65, 0] },
  feet: { pos: [0, -1.9, 2.3], lookAt: [0, -1.9, 0] },
};

// Precision quick-selection cards for regional sub-zones
const REGIONAL_QUICK_CARDS = {
  skeleton: [
    { id: 'tete', name: 'Tête & Crâne', side: 'front', detail: 'Tensions crâniennes, fatigue mentale et céphalées' },
    { id: 'cou', name: 'Cou & Cervicales', side: 'front', detail: 'Raideurs de nuque et tensions posturales' },
    { id: 'torse', name: 'Torse & Pectoraux', side: 'front', detail: 'Oppression thoracique et diaphragme' },
    { id: 'lombaires', name: 'Lombaires (Bas du dos)', side: 'back', detail: 'Barre lombaire et surmenage postural' },
    { id: 'fessier_g', name: 'Fessiers & Sacrum', side: 'back', detail: 'Départ du nerf sciatique et hanches' },
    { id: 'pied_g', name: 'Pieds & Voûtes', side: 'front', detail: 'Réflexologie intégrale et points d\'ancrage' },
  ],
  head: [
    { id: 'tete', name: 'Front & Sinus / Sommet Crânien', side: 'front', detail: 'Pression oculaire, sinusite et surmenage mental' },
    { id: 'occiput', name: 'Nuque & Base du Crâne (Occiput)', side: 'back', detail: 'Migraines de tension et raideurs posturales' },
    { id: 'cou', name: 'Cervicales & Sterno-cléido-mastoïdien', side: 'front', detail: 'Nœuds musculaires et tensions vertébrales' },
    { id: 'epaule_g', name: 'Trapèze Gauche & Attache Nuque', side: 'back', detail: 'Point gâchette et accumulation de stress' },
    { id: 'epaule_d', name: 'Trapèze Droit & Attache Nuque', side: 'back', detail: 'Tensions des épaules et charge posturale' },
  ],
  trunk: [
    { id: 'torse', name: 'Torse, Sternum & Cage Thoracique', side: 'front', detail: 'Ouverture respiratoire et déblocage émotionnel' },
    { id: 'abdomen', name: 'Plexus Solaire & Abdomen Viscéral', side: 'front', detail: 'Centre digestif, détente profonde du diaphragme' },
    { id: 'haut_dos', name: 'Dos Supérieur & Entre les Omoplates', side: 'back', detail: 'Dorsalgies, contractures et posture voûtée' },
    { id: 'lombaires', name: 'Lombaires & Bas du Dos', side: 'back', detail: 'Barre lombaire, sensation d\'écrasement postural' },
    { id: 'fessier_g', name: 'Fessier Gauche & Sacrum (Pyramidal)', side: 'back', detail: 'Sciatalgie et points de pression fessiers' },
    { id: 'fessier_d', name: 'Fessier Droit & Sacrum (Pyramidal)', side: 'back', detail: 'Décompression lombaire et sacrée' },
  ],
  arms: [
    { id: 'epaule_g', name: 'Épaule & Deltoïde Gauche', side: 'front', detail: 'Tension coiffe des rotateurs et mobilité' },
    { id: 'epaule_d', name: 'Épaule & Deltoïde Droit', side: 'front', detail: 'Mobilité articulaire et contractures trapèzes' },
    { id: 'bras_g', name: 'Bras & Biceps Gauche', side: 'front', detail: 'Contraction musculaire et raideur du bras' },
    { id: 'bras_d', name: 'Bras & Biceps Droit', side: 'front', detail: 'Tension musculaire et fatigue physique' },
    { id: 'avant_bras_g', name: 'Avant-bras Gauche (Canal)', side: 'front', detail: 'Tendinites, surmenage informatique & souris' },
    { id: 'avant_bras_d', name: 'Avant-bras Droit (Canal)', side: 'front', detail: 'Sensibilité au toucher et crispations' },
    { id: 'main_g', name: 'Main & Poignet Gauche', side: 'front', detail: 'Points réflexes palmaires et canal carpien' },
    { id: 'main_d', name: 'Main & Poignet Droit', side: 'front', detail: 'Fatigue digitale, engourdissements' },
  ],
  feet: [
    { id: 'pied_g', name: 'Voûte Plantaire Gauche (Médiane)', side: 'front', detail: 'Zone réflexe estomac, reins, plexus solaire' },
    { id: 'pied_d', name: 'Voûte Plantaire Droite (Médiane)', side: 'front', detail: 'Zone réflexe foie, intestin et colonne' },
    { id: 'mollet_g', name: 'Mollet & Tendon d\'Achille Gauche', side: 'back', detail: 'Lourdeur circulatoire, crampes et tensions' },
    { id: 'mollet_d', name: 'Mollet & Tendon d\'Achille Droit', side: 'back', detail: 'Drainage lymphatique et raideurs musculaires' },
    { id: 'genou_g', name: 'Genou & Rotule Gauche', side: 'front', detail: 'Sensibilité articulaire et appuis' },
    { id: 'genou_d', name: 'Genou & Rotule Droite', side: 'front', detail: 'Mobilité fémoro-patellaire' },
    { id: 'cuisse_g', name: 'Cuisse Gauche (Quadriceps)', side: 'front', detail: 'Fatigue musculaire et chaîne postérieure' },
    { id: 'cuisse_d', name: 'Cuisse Droite (Quadriceps)', side: 'front', detail: 'Contraction et récupération physique' },
  ],
};

function getIntensityLabel(val) {
  if (val <= 3) return { text: 'Gêne légère', color: 'text-emerald-700 dark:text-emerald-400' };
  if (val <= 6) return { text: 'Tension modérée', color: 'text-amber-700 dark:text-amber-400' };
  if (val <= 8) return { text: 'Douleur aiguë', color: 'text-orange-700 dark:text-orange-400' };
  return { text: 'Douleur intense / Priorité', color: 'text-rose-700 dark:text-rose-400 font-bold' };
}

/**
 * Composant Squelette Anatomique 3D WebGL (Three.js) & Raycasting
 * 
 * @param {object} props
 * @param {Array} props.value - Liste des zones douloureuses sélectionnées [{ zone_id, zone_name, side, intensity, category }]
 * @param {Function} props.onChange - Fonction de mise à jour de la liste
 */
export default function Body3DMap({ value = [], onChange }) {
  const mountRef = useRef(null);
  const [activeTab, setActiveTab] = useState('skeleton');
  const [skeletonSide, setSkeletonSide] = useState('front');
  const [hoveredZoneName, setHoveredZoneName] = useState(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Références Three.js
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const bodyGroupRef = useRef(null);
  const meshesMapRef = useRef(new Map());
  const animationFrameRef = useRef(null);

  // Variables de contrôle et d'inertie de rotation 360°
  const targetRotationY = useRef(0);
  const currentRotationY = useRef(0);
  const isDragging = useRef(false);
  const previousPointerX = useRef(0);
  const pointerVelocityX = useRef(0);

  // Cibles de position et visée de la caméra (Lerp dynamique)
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 5.4));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Bascule Face / Dos
  useEffect(() => {
    targetRotationY.current = skeletonSide === 'front' ? 0 : Math.PI;
  }, [skeletonSide]);

  // Transition de caméra vers le sous-onglet actif
  useEffect(() => {
    const target = CAMERA_ZOOM_TARGETS[activeTab] || CAMERA_ZOOM_TARGETS.skeleton;
    targetCamPos.current.set(...target.pos);
    targetLookAt.current.set(...target.lookAt);
  }, [activeTab]);

  // Initialisation de la scène 3D Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 450;

    // 1. Scène & Caméra
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.4);
    cameraRef.current = camera;

    // 2. Renderer avec Transparence Alpha & Rendu Haute Définition
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Éclairages dynamiques PBR
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.1);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xfff0dd, 1.4);
    dirLightFront.position.set(3, 4, 5);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0xd4af37, 1.0);
    dirLightBack.position.set(-3, 3, -5);
    scene.add(dirLightBack);

    const pointLightGold = new THREE.PointLight(0xffb700, 1.3, 10);
    pointLightGold.position.set(0, 0.5, 2.5);
    scene.add(pointLightGold);

    // 4. Groupe du Mannequin Anatomique 3D
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    const createBodyMaterial = () =>
      new THREE.MeshStandardMaterial({
        color: 0xded2be,
        roughness: 0.35,
        metalness: 0.15,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });

    const meshesMap = new Map();

    const addPart = (id, name, side, category, geometry, pos, rot = [0, 0, 0], scale = [1, 1, 1]) => {
      const mat = createBodyMaterial();
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.scale.set(...scale);
      mesh.userData = {
        zone_id: id,
        zone_name: name,
        side,
        category,
        isBodyPart: true,
        baseScale: scale,
      };
      bodyGroup.add(mesh);
      meshesMap.set(id, mesh);
      return mesh;
    };

    // Construction des volumes anatomiques articulés
    // Tête & Crâne
    const headGeo = new THREE.SphereGeometry(0.32, 28, 28);
    headGeo.scale(0.85, 1.15, 0.95);
    addPart('tete', 'Tête / Crâne & Sinus', 'front', 'head', headGeo, [0, 2.05, 0]);

    // Occiput & Nuque
    const occiputGeo = new THREE.SphereGeometry(0.3, 20, 20);
    occiputGeo.scale(0.85, 0.95, 0.6);
    addPart('occiput', 'Nuque & Base du Crâne', 'back', 'head', occiputGeo, [0, 1.95, -0.15]);

    // Cou & Cervicales
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.32, 20);
    addPart('cou', 'Cou & Cervicales', 'front', 'head', neckGeo, [0, 1.62, 0]);

    // Épaules
    const shL = new THREE.SphereGeometry(0.18, 20, 20);
    shL.scale(1.1, 0.9, 0.9);
    addPart('epaule_g', 'Épaule Gauche & Trapèze', 'front', 'arms', shL, [-0.68, 1.42, 0]);

    const shR = new THREE.SphereGeometry(0.18, 20, 20);
    shR.scale(1.1, 0.9, 0.9);
    addPart('epaule_d', 'Épaule Droite & Trapèze', 'front', 'arms', shR, [0.68, 1.42, 0]);

    // Torse & Pectoraux
    const chestGeo = new THREE.CylinderGeometry(0.48, 0.42, 0.52, 24);
    chestGeo.scale(1.1, 1, 0.7);
    addPart('torse', 'Torse & Pectoraux', 'front', 'trunk', chestGeo, [0, 1.22, 0.05]);

    // Dos Supérieur & Omoplates
    const backGeo = new THREE.BoxGeometry(0.85, 0.5, 0.22);
    addPart('haut_dos', 'Dos Supérieur & Omoplates', 'back', 'trunk', backGeo, [0, 1.24, -0.1]);

    // Abdomen & Plexus
    const abdGeo = new THREE.CylinderGeometry(0.4, 0.38, 0.48, 24);
    abdGeo.scale(1.0, 1, 0.68);
    addPart('abdomen', 'Abdomen & Plexus Solaire', 'front', 'trunk', abdGeo, [0, 0.74, 0.04]);

    // Lombaires
    const lumbGeo = new THREE.BoxGeometry(0.72, 0.46, 0.2);
    addPart('lombaires', 'Région Lombaire (Bas du dos)', 'back', 'trunk', lumbGeo, [0, 0.74, -0.09]);

    // Bassin & Hanches
    const pelvGeo = new THREE.CylinderGeometry(0.41, 0.44, 0.42, 24);
    pelvGeo.scale(1.05, 1, 0.75);
    addPart('bassin', 'Bassin & Hanches', 'front', 'trunk', pelvGeo, [0, 0.32, 0.02]);

    // Fessiers
    const glutL = new THREE.SphereGeometry(0.24, 20, 20);
    glutL.scale(1.0, 1.1, 0.85);
    addPart('fessier_g', 'Fessier Gauche & Sacrum', 'back', 'trunk', glutL, [-0.22, 0.28, -0.15]);

    const glutR = new THREE.SphereGeometry(0.24, 20, 20);
    glutR.scale(1.0, 1.1, 0.85);
    addPart('fessier_d', 'Fessier Droit & Sacrum', 'back', 'trunk', glutR, [0.22, 0.28, -0.15]);

    // Bras
    const armL = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 18);
    addPart('bras_g', 'Bras Gauche (Biceps)', 'front', 'arms', armL, [-0.74, 0.98, 0], [0, 0, -0.1]);

    const armR = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 18);
    addPart('bras_d', 'Bras Droit (Biceps)', 'front', 'arms', armR, [0.74, 0.98, 0], [0, 0, 0.1]);

    // Avant-bras
    const foreL = new THREE.CylinderGeometry(0.095, 0.08, 0.52, 18);
    addPart('avant_bras_g', 'Avant-bras Gauche', 'front', 'arms', foreL, [-0.84, 0.45, 0], [0, 0, -0.06]);

    const foreR = new THREE.CylinderGeometry(0.095, 0.08, 0.52, 18);
    addPart('avant_bras_d', 'Avant-bras Droit', 'front', 'arms', foreR, [0.84, 0.45, 0], [0, 0, 0.06]);

    // Mains
    const handL = new THREE.BoxGeometry(0.14, 0.22, 0.07);
    addPart('main_g', 'Main & Poignet Gauche', 'front', 'arms', handL, [-0.88, 0.08, 0]);

    const handR = new THREE.BoxGeometry(0.14, 0.22, 0.07);
    addPart('main_d', 'Main & Poignet Droit', 'front', 'arms', handR, [0.88, 0.08, 0]);

    // Cuisses
    const thighL = new THREE.CylinderGeometry(0.19, 0.14, 0.85, 20);
    addPart('cuisse_g', 'Cuisse Gauche (Quadriceps)', 'front', 'feet', thighL, [-0.25, -0.32, 0], [0, 0, 0.04]);

    const thighR = new THREE.CylinderGeometry(0.19, 0.14, 0.85, 20);
    addPart('cuisse_d', 'Cuisse Droite (Quadriceps)', 'front', 'feet', thighR, [0.25, -0.32, 0], [0, 0, -0.04]);

    // Genoux
    const kneeL = new THREE.SphereGeometry(0.13, 18, 18);
    kneeL.scale(1, 1, 0.9);
    addPart('genou_g', 'Genou Gauche (Rotule)', 'front', 'feet', kneeL, [-0.26, -0.82, 0.02]);

    const kneeR = new THREE.SphereGeometry(0.13, 18, 18);
    kneeR.scale(1, 1, 0.9);
    addPart('genou_d', 'Genou Droit (Rotule)', 'front', 'feet', kneeR, [0.26, -0.82, 0.02]);

    // Mollets
    const calfL = new THREE.CylinderGeometry(0.14, 0.1, 0.85, 20);
    addPart('mollet_g', 'Jambe & Mollet Gauche', 'front', 'feet', calfL, [-0.26, -1.32, 0], [0, 0, 0.02]);

    const calfR = new THREE.CylinderGeometry(0.14, 0.1, 0.85, 20);
    addPart('mollet_d', 'Jambe & Mollet Droit', 'front', 'feet', calfR, [0.26, -1.32, 0], [0, 0, -0.02]);

    // Pieds & Voûtes
    const footL = new THREE.BoxGeometry(0.18, 0.12, 0.42);
    addPart('pied_g', 'Pied Gauche & Voûte Plantaire', 'front', 'feet', footL, [-0.26, -1.82, 0.12]);

    const footR = new THREE.BoxGeometry(0.18, 0.12, 0.42);
    addPart('pied_d', 'Pied Droit & Voûte Plantaire', 'front', 'feet', footR, [0.26, -1.82, 0.12]);

    meshesMapRef.current = meshesMap;
    setCanvasReady(true);

    // 5. Raycasting (Détection tactile et clic)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedMesh = (event) => {
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
        const first = intersects[0].object;
        if (first.userData?.isBodyPart) {
          return first;
        }
      }
      return null;
    };

    let pointerDownTime = 0;
    let pointerMoved = false;

    const onPointerDown = (e) => {
      isDragging.current = true;
      pointerMoved = false;
      pointerDownTime = Date.now();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      previousPointerX.current = clientX;
      pointerVelocityX.current = 0;
    };

    const onPointerMove = (e) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

      if (isDragging.current) {
        const deltaX = clientX - previousPointerX.current;
        if (Math.abs(deltaX) > 3) pointerMoved = true;
        pointerVelocityX.current = deltaX * 0.008;
        targetRotationY.current += pointerVelocityX.current;
        previousPointerX.current = clientX;
      } else {
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

    const onPointerUp = (e) => {
      isDragging.current = false;
      const elapsed = Date.now() - pointerDownTime;

      // Clic/Tap net sans glissement prolongé
      if (!pointerMoved && elapsed < 350) {
        const mesh = getIntersectedMesh(e);
        if (mesh && mesh.userData?.isBodyPart) {
          const { zone_id, zone_name, side, category } = mesh.userData;
          handleToggleZone({ zone_id, zone_name, side, category });
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 6. Boucle de rendu (60 FPS avec amortissement physique)
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Inertie avec damping
      if (!isDragging.current && Math.abs(pointerVelocityX.current) > 0.0001) {
        targetRotationY.current += pointerVelocityX.current;
        pointerVelocityX.current *= 0.92;
      }

      // Ressort rotation Y
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.12;
      bodyGroup.rotation.y = currentRotationY.current;

      // Respiration subtile
      bodyGroup.position.y = Math.sin(elapsed * 1.5) * 0.025;

      // Interpolation Caméra (Lerp)
      camera.position.lerp(targetCamPos.current, 0.08);
      currentLookAt.current.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      dom.removeEventListener('mousedown', onPointerDown);
      dom.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      dom.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', onResize);

      meshesMap.forEach((mesh) => {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material?.dispose();
      });
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Gestion de la sélection d'une zone
  const handleToggleZone = useCallback((zone) => {
    const safeVal = Array.isArray(value) ? value : [];
    const existingIndex = safeVal.findIndex((z) => z.zone_id === zone.zone_id);
    if (existingIndex >= 0) {
      const next = [...safeVal];
      next.splice(existingIndex, 1);
      onChange?.(next);
    } else {
      onChange?.([
        ...safeVal,
        {
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
          side: zone.side || skeletonSide,
          category: zone.category || activeTab,
          intensity: 5,
        },
      ]);
    }
  }, [value, onChange, skeletonSide, activeTab]);

  // Mise à jour de l'intensité d'une zone (1 à 10)
  const handleUpdateIntensity = (id, newIntensity) => {
    const safeVal = Array.isArray(value) ? value : [];
    const next = safeVal.map((z) => (z.zone_id === id ? { ...z, intensity: newIntensity } : z));
    onChange?.(next);
  };

  const handleRemoveZone = (id) => {
    const safeVal = Array.isArray(value) ? value : [];
    onChange?.(safeVal.filter((z) => z.zone_id !== id));
  };

  // Synchronisation visuelle des couleurs et de l'émissivité des maillages 3D
  useEffect(() => {
    if (!canvasReady || !meshesMapRef.current) return;
    const safeVal = Array.isArray(value) ? value : [];

    meshesMapRef.current.forEach((mesh, zoneId) => {
      const isSelected = safeVal.some((z) => z.zone_id === zoneId);
      const mat = mesh.material;
      const baseScale = mesh.userData.baseScale || [1, 1, 1];

      if (isSelected) {
        mat.color.setHex(0xe07a5f);
        mat.emissive.setHex(0xffaa00);
        mat.emissiveIntensity = 1.35;
        mesh.scale.set(baseScale[0] * 1.1, baseScale[1] * 1.1, baseScale[2] * 1.1);
      } else {
        mat.color.setHex(0xded2be);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mesh.scale.set(baseScale[0], baseScale[1], baseScale[2]);
      }
    });
  }, [value, canvasReady]);

  return (
    <div className="space-y-6 select-none font-body">
      {/* 5 Sous-onglets de zoom de caméra */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 dark:border-amber-400/20 backdrop-blur-md shadow-sm">
        {[
          { id: 'skeleton', label: 'Squelette 3D (Corps entier)' },
          { id: 'head', label: 'Tête & Cou' },
          { id: 'trunk', label: 'Tronc & Dos' },
          { id: 'arms', label: 'Bras & Mains' },
          { id: 'feet', label: 'Pied & Réflexologie' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                isActive
                  ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 shadow-sm font-bold'
                  : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scène 3D & Contrôles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche : Canvas Three.js & Cartes Rapides */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-soft p-5 sm:p-6 bg-white/85 dark:bg-stone-900/85 border border-cacao/10 dark:border-amber-400/15 flex flex-col items-center">
            {/* Header avec bascule 180° Face / Dos */}
            <div className="w-full flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-cacao/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                  Vue active : {skeletonSide === 'front' ? 'Face (Avant)' : 'Dos (Arrière)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    targetRotationY.current = skeletonSide === 'front' ? 0 : Math.PI;
                    const preset = CAMERA_ZOOM_TARGETS[activeTab] || CAMERA_ZOOM_TARGETS.skeleton;
                    targetCamPos.current.set(...preset.pos);
                    targetLookAt.current.set(...preset.lookAt);
                  }}
                  className="p-1.5 rounded-xl border border-cacao/15 dark:border-white/15 text-cacao/70 dark:text-sand/70 hover:bg-black/5 cursor-pointer text-xs"
                  title="Recentrer la caméra"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSkeletonSide((prev) => (prev === 'front' ? 'back' : 'front'))}
                  className="btn-gold py-1.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pivoter 180° ({skeletonSide === 'front' ? 'Voir le Dos' : 'Voir la Face'})</span>
                </button>
              </div>
            </div>

            {/* Conteneur WebGL 3D */}
            <div className="relative w-full aspect-[320/420] sm:aspect-[340/440] max-h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-stone-100/70 to-stone-200/50 dark:from-stone-900/60 dark:to-stone-950/80 border border-cacao/10 dark:border-amber-400/20 shadow-inner flex items-center justify-center">
              <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* Tooltip zone survolée */}
              {hoveredZoneName && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-cacao/90 text-sand dark:bg-amber-400 dark:text-stone-950 text-xs font-bold shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-1.5 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-gold dark:text-stone-950" />
                  <span>{hoveredZoneName}</span>
                </div>
              )}

              {/* Guide tactile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md text-[10px] font-semibold text-cacao/70 dark:text-sand/70 pointer-events-none border border-cacao/10 dark:border-white/10 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <span>👆 Touchez pour cibler</span>
                <span>•</span>
                <span>🔄 Glissez pour pivoter 360°</span>
              </div>
            </div>

            <p className="text-[11px] text-cacao/60 dark:text-sand/60 text-center mt-2.5 font-medium">
              ✨ Mannequin anatomique 3D WebGL fluide : détection par lancer de rayon (Raycasting).
            </p>
          </div>

          {/* Cartes de sélection rapide */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-cacao/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                  Points réflexes & zones ciblées :
                </span>
              </div>
              <span className="text-[11px] text-cacao/50 dark:text-sand/50">Sélection rapide</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(REGIONAL_QUICK_CARDS[activeTab] || []).map((card) => {
                const isSelected = value.some((v) => v.zone_id === card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() =>
                      handleToggleZone({
                        zone_id: card.id,
                        zone_name: card.name,
                        side: card.side,
                        category: activeTab,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-600 dark:border-amber-400 shadow-sm'
                        : 'bg-white/70 dark:bg-stone-800/70 border-cacao/10 dark:border-white/10 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-bold text-xs text-cacao dark:text-sand leading-snug">
                        {card.name}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isSelected ? 'bg-amber-500 text-white font-bold' : 'border border-cacao/20'
                        }`}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Plus className="w-2.5 h-2.5 opacity-40" />}
                      </div>
                    </div>
                    <span className="text-[10px] text-cacao/65 dark:text-sand/70 line-clamp-1">
                      {card.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Sliders d'intensité de douleur (1 à 10) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h4 className="font-display text-lg text-cacao dark:text-sand font-medium">
                Zones sélectionnées ({value.length})
              </h4>
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange?.([])}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Tout désélectionner
              </button>
            )}
          </div>

          {value.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/50 dark:bg-stone-900/50 border border-dashed border-cacao/20 dark:border-white/20 text-center space-y-2.5">
              <Activity className="w-9 h-9 text-gold/60 mx-auto animate-pulse" />
              <p className="text-xs text-cacao/75 dark:text-sand/80 font-bold">
                Aucune zone de tension ciblée
              </p>
              <p className="text-[11px] text-cacao/55 dark:text-sand/55 leading-relaxed">
                Touchez les zones anatomiques sur le mannequin 3D pour indiquer vos tensions et personnaliser votre soin.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {value.map((zone) => {
                const labelInfo = getIntensityLabel(zone.intensity);
                return (
                  <motion.div
                    key={zone.zone_id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 rounded-2xl bg-white/95 dark:bg-stone-800/95 border border-cacao/15 dark:border-amber-400/25 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-xs text-cacao dark:text-sand">
                          {zone.zone_name}
                        </h5>
                        <span className="text-[10px] text-cacao/60 dark:text-sand/60">
                          {zone.side === 'back' ? 'Côté Dos' : 'Côté Face'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveZone(zone.zone_id)}
                        className="p-1 rounded-lg text-cacao/40 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Retirer cette zone"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Curseur d'intensité de 1 à 10 */}
                    <div className="space-y-1 bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-xl border border-cacao/5 dark:border-white/5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-cacao/75 dark:text-sand/75">
                          Intensité : <strong className="text-cacao dark:text-sand">{zone.intensity}/10</strong>
                        </span>
                        <span className={`text-[10px] font-bold ${labelInfo.color}`}>
                          {labelInfo.text}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={zone.intensity}
                        onChange={(e) => handleUpdateIntensity(zone.zone_id, Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
