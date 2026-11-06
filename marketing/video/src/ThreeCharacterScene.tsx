import React, { useEffect, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile } from 'remotion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import audioEnvelopes from './audioEnvelopes.json';

export interface ThreeCharacterSceneProps {
  variant?: 'arjun' | 'priya' | 'dual';
  mood?: 'talking' | 'shocked' | 'questioning' | 'celebrating' | 'listening';
  dialogueClip?: keyof typeof audioEnvelopes;
  dialogueStartFrame?: number;
  cameraAngle?: 'cinematic_3quarter' | 'closeup' | 'medium' | 'wide' | 'over_shoulder';
  showMonitor?: boolean;
  transparentBackground?: boolean;
  monitorText?: string;
  monitorSubtitle?: string;
  width?: number;
  height?: number;
  scale?: number;
}

interface CharacterHandles {
  root: THREE.Group;
  head: THREE.Group | THREE.Object3D;
  mouth?: THREE.Group;
  jaw?: THREE.Mesh;
  eyes?: THREE.Group;
  eyebrows?: THREE.Group;
  leftArm?: THREE.Group;
  rightArm?: THREE.Group;
  phone?: THREE.Group;
  // Rigged humanoid model handles
  isRigged?: boolean;
  bones?: {
    upperArmR?: THREE.Object3D;
    lowerArmR?: THREE.Object3D;
    handR?: THREE.Object3D;
    upperArmL?: THREE.Object3D;
    lowerArmL?: THREE.Object3D;
    handL?: THREE.Object3D;
    head?: THREE.Object3D;
    neck?: THREE.Object3D;
    spine?: THREE.Object3D;
    chest?: THREE.Object3D;
  };
  headMesh?: THREE.Mesh;
  headMeshes?: THREE.Mesh[];
  mouthMorphIndex?: number;
}

/**
 * 3D Procedural Character & Scene Engine (Three.js WebGL)
 * Generates low-poly characters, desk environments, and real-time animation directly in code:
 *   - $0 API cost, zero quotas, zero network latency
 *   - Frame-accurate audio amplitude mouth lip-sync
 *   - Faceted flat-shading low-poly geometry matching Blender aesthetic
 *   - Multi-point cinematic lighting rig (warm key, cool rim, screen emissive)
 */
export const ThreeCharacterScene: React.FC<ThreeCharacterSceneProps> = ({
  variant = 'arjun',
  mood = 'talking',
  dialogueClip,
  dialogueStartFrame = 0,
  cameraAngle = 'cinematic_3quarter',
  showMonitor = true,
  transparentBackground = false,
  monitorText = 'ASPIRANT ARCADE · FOCUS GUARD',
  monitorSubtitle = 'STATUS: DOOMSCROLL DETECTED · REELS BLOCKED',
  width = 1080,
  height = 1920,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [renderHandle] = useState(() => delayRender('Loading Rigged 3D Characters'));
  const [loaded, setLoaded] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const charactersRef = useRef<{ arjun?: CharacterHandles; priya?: CharacterHandles }>({});
  const monitorLightRef = useRef<THREE.PointLight | null>(null);
  const screenFaceMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Initialize Three.js Scene & Load Rigged Characters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    if (!transparentBackground) {
      scene.background = new THREE.Color(0x060b18);
      scene.fog = new THREE.FogExp2(0x060b18, 0.12);
    }
    sceneRef.current = scene;

    // 2. Camera (Cinematic 3/4 perspective with portrait aspect ratio)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing, ACES Filmic Tone Mapping & Soft Shadows
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 4. Cinematic Multi-Point Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x18243b, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.2);
    keyLight.position.set(2.8, 3.8, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 2.5;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 3.8);
    rimLight.position.set(-3.2, 2.4, -1.8);
    scene.add(rimLight);

    const accentLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    accentLight.position.set(1.5, -1.0, -2.5);
    scene.add(accentLight);

    const monitorLight = new THREE.PointLight(0x38bdf8, 4.2, 5.0, 1.2);
    monitorLight.position.set(-0.7, 0.45, 0.35);
    scene.add(monitorLight);
    monitorLightRef.current = monitorLight;

    // 5. Environment: Angled Desk, Ultrawide Monitor, Keyboard & Books
    if (showMonitor) {
      const deskGeo = new THREE.BoxGeometry(4.8, 0.16, 2.6);
      const deskMat = new THREE.MeshStandardMaterial({
        color: 0x0c1424,
        roughness: 0.65,
        metalness: 0.2,
        flatShading: true,
      });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, -0.78, 0.1);
      desk.receiveShadow = true;
      scene.add(desk);

      const matGeo = new THREE.BoxGeometry(2.8, 0.02, 1.2);
      const matMat = new THREE.MeshStandardMaterial({
        color: 0x070d18,
        roughness: 0.9,
        flatShading: true,
      });
      const deskMatMesh = new THREE.Mesh(matGeo, matMat);
      deskMatMesh.position.set(0.1, -0.69, 0.2);
      deskMatMesh.receiveShadow = true;
      scene.add(deskMatMesh);

      const kbGeo = new THREE.BoxGeometry(0.95, 0.04, 0.36);
      const kbMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.5,
        flatShading: true,
      });
      const keyboard = new THREE.Mesh(kbGeo, kbMat);
      keyboard.position.set(0.15, -0.67, 0.38);
      keyboard.rotation.y = -0.08;
      scene.add(keyboard);

      const mouseGeo = new THREE.BoxGeometry(0.12, 0.04, 0.2);
      const mouseMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        roughness: 0.3,
        flatShading: true,
      });
      const mouse = new THREE.Mesh(mouseGeo, mouseMat);
      mouse.position.set(0.85, -0.67, 0.35);
      scene.add(mouse);

      const mugGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.22, 10);
      const mugMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.3,
        flatShading: true,
      });
      const mug = new THREE.Mesh(mugGeo, mugMat);
      mug.position.set(0.95, -0.58, -0.15);
      scene.add(mug);

      const bookColors = [0x2563eb, 0xe11d48, 0x10b981];
      for (let i = 0; i < 3; i++) {
        const bookGeo = new THREE.BoxGeometry(0.62, 0.09, 0.46);
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[i],
          flatShading: true,
          roughness: 0.5,
        });
        const book = new THREE.Mesh(bookGeo, bookMat);
        book.position.set(-1.05 + i * 0.02, -0.65 + i * 0.09, 0.15 - i * 0.03);
        book.rotation.y = 0.22 + i * 0.06;
        book.castShadow = true;
        scene.add(book);
      }

      const monitorGroup = new THREE.Group();
      monitorGroup.position.set(-0.85, 0.28, -0.15);
      monitorGroup.rotation.y = 0.42;

      const standPoleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.85, 8);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3, flatShading: true });
      const standPole = new THREE.Mesh(standPoleGeo, standMat);
      standPole.position.set(0, -0.4, -0.15);
      monitorGroup.add(standPole);

      const standBaseGeo = new THREE.BoxGeometry(0.45, 0.03, 0.35);
      const standBase = new THREE.Mesh(standBaseGeo, standMat);
      standBase.position.set(0, -0.82, -0.1);
      monitorGroup.add(standBase);

      const screenFrameGeo = new THREE.BoxGeometry(2.6, 1.45, 0.08);
      const screenFrameMat = new THREE.MeshStandardMaterial({
        color: 0x030712,
        roughness: 0.4,
        flatShading: true,
      });
      const screenFrame = new THREE.Mesh(screenFrameGeo, screenFrameMat);
      monitorGroup.add(screenFrame);

      const screenFaceGeo = new THREE.PlaneGeometry(2.5, 1.35);
      const screenTex = createMonitorTexture(monitorText, monitorSubtitle);
      const screenFaceMat = new THREE.MeshBasicMaterial({ map: screenTex });
      screenFaceMatRef.current = screenFaceMat;
      const screenFace = new THREE.Mesh(screenFaceGeo, screenFaceMat);
      screenFace.position.z = 0.045;
      monitorGroup.add(screenFace);

      scene.add(monitorGroup);
    }

    // 6. Load Rigged Humanoid Characters (with Procedural Fallback)
    const variantsToLoad: Array<{ name: 'arjun' | 'priya'; pos: THREE.Vector3 }> = [];
    if (variant === 'arjun' || variant === 'dual') {
      const arjunPos = variant === 'dual' ? new THREE.Vector3(-0.35, -1.28, 0.1) : new THREE.Vector3(0.05, -1.28, 0.1);
      variantsToLoad.push({ name: 'arjun', pos: arjunPos });
    }
    if (variant === 'priya' || variant === 'dual') {
      const priyaPos = variant === 'dual' ? new THREE.Vector3(0.55, -1.28, 0.05) : new THREE.Vector3(0.05, -1.28, 0.1);
      variantsToLoad.push({ name: 'priya', pos: priyaPos });
    }

    let loadedCount = 0;
    const totalToLoad = variantsToLoad.length;
    const gltfLoader = new GLTFLoader();

    variantsToLoad.forEach(({ name, pos }) => {
      const modelFile = name === 'arjun' ? 'models/arjun_rigged.glb' : 'models/priya_rigged.glb';
      const url = staticFile(modelFile);

      gltfLoader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          root.position.copy(pos);

          const box = new THREE.Box3().setFromObject(root);
          console.log(`[ThreeJS] Loaded ${name} bounds:`, {
            minY: box.min.y,
            maxY: box.max.y,
            height: box.max.y - box.min.y,
            pos: pos
          });

          const bones: Record<string, THREE.Object3D> = {};
          const headMeshes: THREE.Mesh[] = [];

          root.traverse((node: any) => {
            if (node.isBone) {
              const clean = node.name.replace(/[\._]/g, '');
              if (clean === 'UpperArmR') bones.upperArmR = node;
              else if (clean === 'LowerArmR') bones.lowerArmR = node;
              else if (clean === 'HandR') bones.handR = node;
              else if (clean === 'UpperArmL') bones.upperArmL = node;
              else if (clean === 'LowerArmL') bones.lowerArmL = node;
              else if (clean === 'HandL') bones.handL = node;
              else if (clean === 'Head') bones.head = node;
              else if (clean === 'Neck') bones.neck = node;
              else if (clean === 'Spine') bones.spine = node;
              else if (clean === 'Chest') bones.chest = node;
              else if (clean === 'Index2R') bones.index2R = node;
              else if (clean === 'Middle2R') bones.middle2R = node;
              else if (clean === 'Ring2R') bones.ring2R = node;
              else if (clean === 'Pinky2R') bones.pinky2R = node;
              else if (clean === 'Thumb2R') bones.thumb2R = node;
            }
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.geometry) {
                node.geometry.computeVertexNormals();
              }
              if (node.name.startsWith('Casual_Head') && node.morphTargetDictionary && node.morphTargetDictionary['mouthOpen'] !== undefined) {
                headMeshes.push(node);
              }
            }
          });

          // ─── ATTACH BRAND PROPS DIRECTLY TO ARMATURE BONES (Accounting for 100x parent bone matrix) ───
          let mouthGroup: THREE.Group | undefined;
          let phoneGroup: THREE.Group | undefined;

          // 1. Articulate 3D Mouth on Head Bone
          if (bones.head) {
            const m = buildArticulate3DMouth();
            m.position.set(0, 0.00008, 0.00108);
            m.rotation.x = -0.05;
            m.scale.set(0.01 * 0.72, 0.01 * 0.18, 0.01);
            bones.head.add(m);
            mouthGroup = m;
          }

          if (name === 'arjun') {
            // 2. Gold Wireframe Spectacles on Head
            if (bones.head) {
              const glasses = buildGoldGlassesProp();
              glasses.position.set(0, 0.00104, 0.00118);
              glasses.scale.set(0.01, 0.01, 0.01);
              bones.head.add(glasses);
            }
            // 3. Arcade Headphones on Neck
            if (bones.neck) {
              const headphones = buildHeadphonesProp();
              headphones.position.set(0, 0.00010, 0.00005);
              headphones.scale.set(0.01, 0.01, 0.01);
              bones.neck.add(headphones);
            }
            // 4. Smartphone in Right Hand
            if (bones.handR) {
              const ph = buildSmartphoneProp();
              ph.position.set(0.0002, 0.0006, 0.0002);
              ph.rotation.set(-Math.PI / 2, 0, 0);
              ph.scale.set(0.01, 0.01, 0.01);
              bones.handR.add(ph);
              phoneGroup = ph;
            }
            // 5. AA Crest Badge on Chest
            if (bones.chest) {
              const badge = buildAABadgeProp();
              badge.position.set(-0.0008, 0.0002, 0.0010);
              badge.scale.set(0.01, 0.01, 0.01);
              bones.chest.add(badge);
            }
          } else if (name === 'priya') {
            // 2. Digital Mentor Tablet in Left Hand
            if (bones.handL) {
              const tablet = buildTabletProp();
              tablet.position.set(-0.0002, 0.0008, 0.0003);
              tablet.rotation.set(-Math.PI / 2, 0, 0);
              tablet.scale.set(0.01, 0.01, 0.01);
              bones.handL.add(tablet);
            }
            // 3. AA Mentor Badge on Chest
            if (bones.chest) {
              const badge = buildAABadgeProp();
              badge.position.set(-0.0008, 0.0002, 0.0009);
              badge.scale.set(0.01, 0.01, 0.01);
              bones.chest.add(badge);
            }
          }

          scene.add(root);
          charactersRef.current[name] = {
            root,
            head: bones.head || root,
            mouth: mouthGroup,
            phone: phoneGroup,
            isRigged: true,
            bones,
            headMeshes,
          };

          loadedCount++;
          if (loadedCount >= totalToLoad) {
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
              rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            setLoaded(true);
            continueRender(renderHandle);
          }
        },
        undefined,
        (err) => {
          console.warn(`[ThreeCharacterScene] Could not load ${modelFile}, using procedural fallback:`, err);
          const fallbackPos = name === 'arjun'
            ? (variant === 'dual' ? new THREE.Vector3(-0.35, -0.32, 0.2) : new THREE.Vector3(0.05, -0.32, 0.2))
            : (variant === 'dual' ? new THREE.Vector3(0.55, -0.30, 0.1) : new THREE.Vector3(0.05, -0.32, 0.2));
          charactersRef.current[name] = buildLowPolyCharacter(name, scene, fallbackPos);
          loadedCount++;
          if (loadedCount >= totalToLoad) {
            continueRender(renderHandle);
          }
        }
      );
    });

    return () => {
      renderer.dispose();
    };
  }, [variant, showMonitor, transparentBackground, width, height, monitorText, monitorSubtitle]);

  // Frame Update Loop (Speech Lip-Sync, Head Gesture, Blinking, Camera Drift)
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const chars = charactersRef.current;

    // ─── 1. Calculate Speech Amplitude (Frame-Accurate) ───
    let currentAmplitude = 0;
    if (dialogueClip && audioEnvelopes[dialogueClip]) {
      const clipFrames = audioEnvelopes[dialogueClip] as number[];
      const localFrame = frame - dialogueStartFrame;
      if (localFrame >= 0 && localFrame < clipFrames.length) {
        currentAmplitude = clipFrames[localFrame] || 0;
      }
    } else if (mood === 'talking') {
      const cadence = Math.sin(frame * 0.6) * 0.5 + Math.sin(frame * 1.2) * 0.3 + 0.2;
      currentAmplitude = Math.max(0, Math.min(1, cadence));
    }

    const isSpeaking = currentAmplitude > 0.05;
    const mouthOpen = isSpeaking ? Math.min(2.2, 0.18 + currentAmplitude * 2.3) : 0.08;
    const mouthWidth = isSpeaking ? 0.85 + currentAmplitude * 0.45 : 0.72;

    // ─── 2. Animate Characters ───
    const animateChar = (char: CharacterHandles, isSpeaker: boolean, isArjun: boolean) => {
      if (char.isRigged && char.bones) {
        // ─── RIGGED HUMANOID ARMATURE ANIMATION ───
        const armSway = Math.sin(frame * 0.16) * 0.06;
        const breathe = Math.sin(frame / 20) * 0.02;

        // A. Head & Neck Gestures (expressive nods and tilts)
        if (char.bones.head) {
          const headNod = isSpeaker && isSpeaking
            ? Math.sin(frame * 0.45) * 0.14 * currentAmplitude
            : Math.sin(frame / 22) * 0.04;
          const headTurn = isSpeaker && isSpeaking
            ? Math.sin(frame / 12) * 0.10
            : (isArjun ? -0.12 : 0.10);

          char.bones.head.rotation.x = headNod;
          char.bones.head.rotation.y = headTurn;
          char.bones.head.rotation.z = Math.sin(frame / 24) * 0.04;
        }

        // B. Right Arm & Hand Kinematics (Holding phone & expressive speech gestures)
        if (char.bones.upperArmR && char.bones.lowerArmR) {
          if (mood === 'celebrating') {
            const pump = Math.sin(frame * 0.35) * 0.15;
            char.bones.upperArmR.rotation.set(-0.70 + pump, 0.25, 0.65);
            char.bones.lowerArmR.rotation.set(-1.20 + pump * 0.5, 0, 0.30);
            if (char.bones.handR) char.bones.handR.rotation.set(0.20, 0, 0.30);
          } else if (mood === 'shocked') {
            char.bones.upperArmR.rotation.set(-1.05, 0.35, -0.35);
            char.bones.lowerArmR.rotation.set(-1.75, 0, 0.45);
            if (char.bones.handR) char.bones.handR.rotation.set(0.30, 0, 0.20);
          } else if (isArjun) {
            // Arjun conversational doomscroll & phone gesture (Right Arm holds phone up looking at it)
            // Kinematics validated: armDeg: [-50, 35, -40], lowerDeg: [-95, -30, 25]
            const gesture = isSpeaking ? Math.sin(frame * 0.26) * 0.16 * currentAmplitude : armSway;
            const tilt = isSpeaking ? Math.cos(frame * 0.20) * 0.12 * currentAmplitude : 0;
            char.bones.upperArmR.rotation.set(
              -0.87 + gesture * 0.6,
              0.61 + tilt * 0.4,
              -0.70 + gesture * 0.8
            );
            char.bones.lowerArmR.rotation.set(
              -1.66 + gesture * 0.5,
              -0.52,
              0.44 + tilt * 0.5
            );
            if (char.bones.handR) {
              char.bones.handR.rotation.set(0.15 + gesture * 0.4, 0.10, 0.20);
            }
            // Natural finger curling around smartphone (curls around back & sides of chassis)
            const b = char.bones as any;
            if (b.index2R) b.index2R.rotation.set(-0.35, 0, -0.45);
            if (b.middle2R) b.middle2R.rotation.set(-0.35, 0, -0.45);
            if (b.ring2R) b.ring2R.rotation.set(-0.30, 0, -0.40);
            if (b.pinky2R) b.pinky2R.rotation.set(-0.25, 0, -0.35);
            if (b.thumb2R) b.thumb2R.rotation.set(0.15, 0.25, -0.15);
          } else {
            // Priya welcoming open-palm guidance gesture
            const guide = isSpeaking ? Math.sin(frame * 0.22) * 0.24 * currentAmplitude : armSway;
            char.bones.upperArmR.rotation.set(
              -0.50 + guide * 0.8,
              0.30,
              -0.55 + guide * 0.5
            );
            char.bones.lowerArmR.rotation.set(
              -1.10 + guide * 0.7,
              0.20,
              0.30
            );
            if (char.bones.handR) {
              char.bones.handR.rotation.set(0.25 + guide * 0.5, 0.15, 0.10);
            }
          }
        }

        // C. Left Arm & Hand Kinematics
        if (char.bones.upperArmL && char.bones.lowerArmL) {
          if (mood === 'celebrating') {
            const pump = Math.sin(frame * 0.35 + 0.5) * 0.15;
            char.bones.upperArmL.rotation.set(-0.70 + pump, -0.25, -0.65);
            char.bones.lowerArmL.rotation.set(-1.20 + pump * 0.5, 0, -0.30);
            if (char.bones.handL) char.bones.handL.rotation.set(0.20, 0, -0.30);
          } else if (mood === 'shocked') {
            char.bones.upperArmL.rotation.set(-1.05, -0.35, 0.35);
            char.bones.lowerArmL.rotation.set(-1.75, 0, -0.45);
            if (char.bones.handL) char.bones.handL.rotation.set(0.30, 0, -0.20);
          } else if (isArjun) {
            // Arjun natural left arm resting / talking
            // Kinematics validated: armDeg [-30, 0, 85], lower [-100, 30, -10]
            const gestureL = isSpeaking ? Math.sin(frame * 0.24) * 0.15 * currentAmplitude : armSway;
            char.bones.upperArmL.rotation.set(
              -0.52 + gestureL * 0.5,
              0.10,
              1.48 - gestureL * 0.4
            );
            char.bones.lowerArmL.rotation.set(
              -1.75 + gestureL * 0.6,
              0.52,
              -0.17
            );
            if (char.bones.handL) {
              char.bones.handL.rotation.set(0.10, 0.15, -0.15);
            }
          } else {
            // Priya proudly holding tablet in left hand
            // Kinematics validated: armDeg [40, -40, 40], lower [-110, 30, -60]
            const tabletSway = isSpeaking ? Math.sin(frame * 0.18) * 0.08 * currentAmplitude : armSway * 0.5;
            char.bones.upperArmL.rotation.set(
              0.70 + tabletSway,
              -0.70,
              0.70 + tabletSway * 0.5
            );
            char.bones.lowerArmL.rotation.set(
              -1.92 + tabletSway * 0.4,
              0.52,
              -1.05
            );
            if (char.bones.handL) {
              char.bones.handL.rotation.set(-0.20, 0.10, -0.20);
            }
          }
        }

        // D. 3D Articulate Mouth Lip-Sync (Visibly opens wide showing cavity, teeth, tongue)
        if (char.mouth) {
          if (isSpeaker && isSpeaking) {
            const openFactor = Math.min(2.4, 0.22 + currentAmplitude * 2.2);
            const widthFactor = 0.85 + currentAmplitude * 0.30;
            char.mouth.scale.set(0.01 * widthFactor, 0.01 * openFactor, 0.01);
            char.mouth.visible = true;
          } else {
            char.mouth.scale.set(0.01 * 0.72, 0.01 * 0.18, 0.01);
            char.mouth.visible = true;
          }
        }

        // E. 55mm Lower Jaw Drop Morph Target on all Casual_Head meshes
        if (char.headMeshes && char.headMeshes.length > 0) {
          const influence = isSpeaker && isSpeaking
            ? Math.min(1.0, 0.20 + currentAmplitude * 1.6)
            : 0;
          for (const mesh of char.headMeshes) {
            if (mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[0] = influence;
            }
          }
        }
      } else {
        // ─── PROCEDURAL MESH FALLBACK ───
        if (char.mouth && char.jaw) {
          if (isSpeaker) {
            char.mouth.scale.set(mouthWidth, mouthOpen, 1);
            char.jaw.position.y = -0.25 - (isSpeaking ? 0.04 * currentAmplitude : 0);
          } else {
            char.mouth.scale.set(0.7, 0.08, 1);
            char.jaw.position.y = -0.25;
          }
        }

        const headNod = isSpeaker && isSpeaking
          ? Math.sin(frame * 0.45) * 0.07 * currentAmplitude
          : Math.sin(frame / 22) * 0.02;
        const headTurn = isSpeaker && isSpeaking
          ? Math.sin(frame / 11) * 0.05
          : (isArjun ? -0.12 : 0.10);
        const breathing = Math.sin(frame / 18) * 0.012;

        char.head.rotation.x = headNod;
        char.head.rotation.y = headTurn;
        char.head.position.y = 0.44 + breathing + (isSpeaker && isSpeaking ? -0.012 * currentAmplitude : 0);

        if (char.eyes) {
          const blinkCycle = frame % 105;
          const isBlinking = blinkCycle > 98 && blinkCycle < 103;
          char.eyes.scale.y = isBlinking ? 0.08 : 1.0;
        }

        if (char.eyebrows) {
          if (mood === 'shocked') {
            char.eyebrows.position.y = 0.13;
            char.eyebrows.rotation.z = 0;
          } else if (mood === 'questioning') {
            char.eyebrows.position.y = 0.11;
            char.eyebrows.rotation.z = isArjun ? 0.08 : -0.08;
          } else if (isSpeaker && isSpeaking) {
            char.eyebrows.position.y = 0.095 + currentAmplitude * 0.03;
          } else {
            char.eyebrows.position.y = 0.09;
          }
        }

        if (char.rightArm && char.leftArm) {
          const armSway = Math.sin(frame * 0.18) * 0.04;
          if (mood === 'celebrating') {
            char.rightArm.rotation.set(-1.7 + armSway, 0, 0.45);
            char.leftArm.rotation.set(-1.7 - armSway, 0, -0.45);
            if (char.phone) char.phone.visible = false;
          } else if (mood === 'shocked') {
            char.rightArm.rotation.set(-1.3, 0.2, 0.5);
            char.leftArm.rotation.set(-1.3, -0.2, -0.5);
            if (char.phone) char.phone.visible = false;
          } else {
            char.rightArm.rotation.set(-0.65 + headNod * 0.4, 0.12, -0.15);
            char.leftArm.rotation.set(0.18 + armSway, 0.05, -0.12);
            if (char.phone) char.phone.visible = true;
          }
        }
      }
    };

    if (chars.arjun) {
      const isSpeaker = variant === 'arjun' || (variant === 'dual' && frame % 180 < 90);
      animateChar(chars.arjun, isSpeaker, true);
    }
    if (chars.priya) {
      const isSpeaker = variant === 'priya' || (variant === 'dual' && frame % 180 >= 90);
      animateChar(chars.priya, isSpeaker, false);
    }

    // ─── 3. Dynamic Camera & Handheld Micro-Drift ───
    const driftX = Math.sin(frame / 48) * 0.025;
    const driftY = Math.cos(frame / 36) * 0.02;

    if (cameraAngle === 'closeup') {
      camera.position.set(0.18 + driftX, 0.28 + driftY, 1.35);
      camera.lookAt(0.03, 0.24, 0.10);
    } else if (cameraAngle === 'medium') {
      camera.position.set(0.42 + driftX, 0.25 + driftY, 1.80);
      camera.lookAt(0.02, 0.14, 0.10);
    } else if (cameraAngle === 'wide') {
      camera.position.set(0.12 + driftX, 0.20 + driftY, 2.45);
      camera.lookAt(0.10, 0.08, 0.10);
    } else if (cameraAngle === 'over_shoulder') {
      camera.position.set(0.55 + driftX, 0.30 + driftY, 2.05);
      camera.lookAt(-0.15, 0.18, 0.10);
    } else {
      // Default: 'cinematic_3quarter' (Reveals 3D depth, desk, monitor glow and character profile)
      camera.position.set(0.48 + driftX, 0.24 + driftY, 1.85);
      camera.lookAt(0.00, 0.12, 0.10);
    }

    // Dynamic Screen Glow Pulse
    if (monitorLightRef.current) {
      monitorLightRef.current.intensity = 2.8 + currentAmplitude * 1.8;
    }

    // Render WebGL frame
    rendererRef.current.render(scene, camera);
  }, [frame, mood, dialogueClip, dialogueStartFrame, cameraAngle, variant, loaded]);

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

/**
 * Procedural Low-Poly 3D Character Mesh Generator
 * Crafts faceted flat-shaded polygonal geometry for Arjun & Priya
 */
function buildLowPolyCharacter(
  variant: 'arjun' | 'priya',
  scene: THREE.Scene,
  position: THREE.Vector3
): CharacterHandles {
  const isArjun = variant === 'arjun';
  const root = new THREE.Group();
  root.position.copy(position);

  // Palette:
  // Arjun: Navy 0x0F1E36 body, Gold 0xFDC003 sleeves & accents, dark hair 0x221711
  // Priya: Cream 0xF8FAFC blazer with Navy 0x0F1E36 & Gold accents, sleek dark hair 0x2B1810
  const skinColor = isArjun ? 0xdca078 : 0xe4af8b;
  const hairColor = isArjun ? 0x221711 : 0x241611;
  const jacketMainColor = isArjun ? 0x0f1e36 : 0xf8fafc;
  const jacketSleeveColor = isArjun ? 0xfdc003 : 0x0f1e36;
  const goldTrimColor = 0xfdc003;

  // Shared Low-Poly Flat-Shaded Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, flatShading: true, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, flatShading: true, roughness: 0.7 });
  const jacketBodyMat = new THREE.MeshStandardMaterial({ color: jacketMainColor, flatShading: true, roughness: 0.6 });
  const jacketSleeveMat = new THREE.MeshStandardMaterial({ color: jacketSleeveColor, flatShading: true, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: goldTrimColor, flatShading: true, roughness: 0.35, metalness: 0.65 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.4 });
  const darkCavityMat = new THREE.MeshBasicMaterial({ color: 0x140505 });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  // ─── 1. TORSO & VARSITY JACKET ───
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -0.24, 0);

  // Faceted Chest / Bomber Body (Octagonal cylinder)
  const chestGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.68, 8);
  const chest = new THREE.Mesh(chestGeo, jacketBodyMat);
  chest.castShadow = true;
  chest.receiveShadow = true;
  torsoGroup.add(chest);

  // Ribbed Gold Collar
  const collarGeo = new THREE.TorusGeometry(0.20, 0.04, 6, 14);
  const collar = new THREE.Mesh(collarGeo, goldMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.34;
  torsoGroup.add(collar);

  // Center Gold Zipper
  const zipGeo = new THREE.BoxGeometry(0.02, 0.64, 0.03);
  const zip = new THREE.Mesh(zipGeo, goldMat);
  zip.position.set(0, 0, 0.30);
  torsoGroup.add(zip);

  // Left Chest Aspirant Arcade Crest Badge ("AA" Logo)
  const badgeGeo = new THREE.BoxGeometry(0.12, 0.14, 0.025);
  const badge = new THREE.Mesh(badgeGeo, goldMat);
  badge.position.set(-0.15, 0.12, 0.28);
  badge.rotation.y = -0.28;
  torsoGroup.add(badge);

  const logoFaceGeo = new THREE.PlaneGeometry(0.10, 0.12);
  const logoFaceMat = new THREE.MeshBasicMaterial({ map: createBadgeTexture() });
  const logoFace = new THREE.Mesh(logoFaceGeo, logoFaceMat);
  logoFace.position.set(-0.15, 0.12, 0.295);
  logoFace.rotation.y = -0.28;
  torsoGroup.add(logoFace);

  root.add(torsoGroup);

  // ─── 2. HEAD & FACETED FACE ───
  const head = new THREE.Group();
  head.position.set(0, 0.44, 0);

  // Slender Neck connecting to collar
  const neckGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.22, 6);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = -0.20;
  head.add(neck);

  // Faceted Polygonal Head (Dodecahedron with flat shading = true)
  const headGeo = new THREE.DodecahedronGeometry(0.32, 1);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.scale.set(0.96, 1.10, 1.02);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Low-Poly Chin/Jaw (Articulates down on speech)
  const jawGeo = new THREE.BoxGeometry(0.18, 0.09, 0.18);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, -0.25, 0.08);
  head.add(jaw);

  // ─── 3. LOW-POLY HAIR ───
  const hairGroup = new THREE.Group();
  if (isArjun) {
    // Arjun: Modern angular quiff with faceted spikes
    const hairCapGeo = new THREE.DodecahedronGeometry(0.34, 1);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.08, -0.04);
    hairCap.scale.set(1.02, 1.12, 1.02);
    hairGroup.add(hairCap);

    for (let i = 0; i < 5; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.07, 0.18, 4);
      const spike = new THREE.Mesh(spikeGeo, hairMat);
      spike.position.set(-0.12 + i * 0.06, 0.35, 0.16 - Math.abs(i - 2) * 0.035);
      spike.rotation.set(-0.35, 0, (i - 2) * -0.18);
      hairGroup.add(spike);
    }
  } else {
    // Priya: Sleek top hair + high ponytail + side bangs
    const hairCapGeo = new THREE.DodecahedronGeometry(0.33, 1);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.08, -0.04);
    hairCap.scale.set(1.02, 1.12, 1.02);
    hairGroup.add(hairCap);

    // High Ponytail at the back
    const ponyGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
    const ponytail = new THREE.Mesh(ponyGeo, hairMat);
    ponytail.position.set(0, 0.15, -0.32);
    ponytail.rotation.set(-1.1, 0, 0);
    hairGroup.add(ponytail);

    // Gold Hairband
    const bandGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 12);
    const hairBand = new THREE.Mesh(bandGeo, goldMat);
    hairBand.position.set(0, 0.28, -0.22);
    hairBand.rotation.x = 0.5;
    hairGroup.add(hairBand);

    // Side Bangs framing face cleanly
    const bangLeftGeo = new THREE.BoxGeometry(0.06, 0.24, 0.08);
    const bangLeft = new THREE.Mesh(bangLeftGeo, hairMat);
    bangLeft.position.set(-0.24, 0.08, 0.18);
    bangLeft.rotation.z = -0.15;
    hairGroup.add(bangLeft);

    const bangRightGeo = new THREE.BoxGeometry(0.06, 0.24, 0.08);
    const bangRight = new THREE.Mesh(bangRightGeo, hairMat);
    bangRight.position.set(0.24, 0.08, 0.18);
    bangRight.rotation.z = 0.15;
    hairGroup.add(bangRight);
  }
  head.add(hairGroup);

  // ─── 4. EYES & SPECULAR GLINTS ───
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.02, 0.29);

  const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.03);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.x = -0.11;
  eyes.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.x = 0.11;
  eyes.add(rightEye);

  // Specular catchlights
  const glintGeo = new THREE.BoxGeometry(0.02, 0.02, 0.015);
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const leftGlint = new THREE.Mesh(glintGeo, glintMat);
  leftGlint.position.set(-0.10, 0.012, 0.018);
  eyes.add(leftGlint);

  const rightGlint = new THREE.Mesh(glintGeo, glintMat);
  rightGlint.position.set(0.12, 0.012, 0.018);
  eyes.add(rightGlint);

  head.add(eyes);

  // ─── 5. EYEBROWS ───
  const eyebrows = new THREE.Group();
  eyebrows.position.set(0, 0.09, 0.30);

  const browGeo = new THREE.BoxGeometry(0.09, 0.025, 0.025);
  const browMat = new THREE.MeshBasicMaterial({ color: 0x18120e });

  const leftBrow = new THREE.Mesh(browGeo, browMat);
  leftBrow.position.x = -0.12;
  leftBrow.rotation.z = -0.06;
  eyebrows.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, browMat);
  rightBrow.position.x = 0.12;
  rightBrow.rotation.z = 0.06;
  eyebrows.add(rightBrow);

  head.add(eyebrows);

  // ─── 6. ACCESSORIES: GLASSES & HEADPHONES (Arjun) / HOOP EARRINGS (Priya) ───
  if (isArjun) {
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.02, 0.31);

    // Slim Gold Torus Frames
    const rimGeo = new THREE.TorusGeometry(0.075, 0.009, 6, 16);
    const leftRim = new THREE.Mesh(rimGeo, goldMat);
    leftRim.position.x = -0.11;
    glassesGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimGeo, goldMat);
    rightRim.position.x = 0.11;
    glassesGroup.add(rightRim);

    const bridgeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 4);
    const bridge = new THREE.Mesh(bridgeGeo, goldMat);
    bridge.rotation.z = Math.PI / 2;
    glassesGroup.add(bridge);

    head.add(glassesGroup);

    // Headphones around neck
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, -0.13, 0);

    const hpBandGeo = new THREE.TorusGeometry(0.24, 0.03, 6, 16, Math.PI);
    const hpBand = new THREE.Mesh(hpBandGeo, goldMat);
    hpBand.rotation.x = Math.PI / 2;
    hpGroup.add(hpBand);

    const earCupGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 6);
    const earCupMat = new THREE.MeshStandardMaterial({ color: 0x090d16, flatShading: true });

    const leftCup = new THREE.Mesh(earCupGeo, earCupMat);
    leftCup.position.set(-0.25, 0, 0);
    leftCup.rotation.z = Math.PI / 2;
    hpGroup.add(leftCup);

    const rightCup = new THREE.Mesh(earCupGeo, earCupMat);
    rightCup.position.set(0.25, 0, 0);
    rightCup.rotation.z = Math.PI / 2;
    hpGroup.add(rightCup);

    head.add(hpGroup);
  } else {
    // Priya Gold Hoop Earrings
    const hoopGeo = new THREE.TorusGeometry(0.045, 0.008, 6, 12);
    const leftHoop = new THREE.Mesh(hoopGeo, goldMat);
    leftHoop.position.set(-0.31, -0.04, 0);
    leftHoop.rotation.y = Math.PI / 2;
    head.add(leftHoop);

    const rightHoop = new THREE.Mesh(hoopGeo, goldMat);
    rightHoop.position.set(0.31, -0.04, 0);
    rightHoop.rotation.y = Math.PI / 2;
    head.add(rightHoop);
  }

  // ─── 7. HIGH-FIDELITY 3D MOUTH (Lip-Sync Engine) ───
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.15, 0.30);

  const lipFrameGeo = new THREE.BoxGeometry(0.17, 0.08, 0.035);
  const lipFrameMat = new THREE.MeshStandardMaterial({ color: 0x3d1212, flatShading: true });
  const lipFrame = new THREE.Mesh(lipFrameGeo, lipFrameMat);
  mouth.add(lipFrame);

  const cavityGeo = new THREE.BoxGeometry(0.15, 0.065, 0.07);
  const cavity = new THREE.Mesh(cavityGeo, darkCavityMat);
  cavity.position.z = 0.015;
  mouth.add(cavity);

  const teethGeo = new THREE.BoxGeometry(0.12, 0.02, 0.075);
  const teeth = new THREE.Mesh(teethGeo, whiteMat);
  teeth.position.set(0, 0.022, 0.015);
  mouth.add(teeth);

  const tongueGeo = new THREE.BoxGeometry(0.09, 0.02, 0.075);
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(0, -0.022, 0.015);
  mouth.add(tongue);

  head.add(mouth);
  root.add(head);

  // ─── 8. ARMS & SMARTPHONE PROP ───
  // Right Arm (holds smartphone)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.34, 0.24, 0);

  const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 6);
  const rightUpperArm = new THREE.Mesh(upperArmGeo, jacketSleeveMat);
  rightUpperArm.position.y = -0.16;
  rightArm.add(rightUpperArm);

  const forearmGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.30, 6);
  const rightForearm = new THREE.Mesh(forearmGeo, jacketSleeveMat);
  rightForearm.position.set(0, -0.38, 0.10);
  rightForearm.rotation.x = -0.55;
  rightArm.add(rightForearm);

  const phone = new THREE.Group();
  phone.position.set(0, -0.50, 0.22);
  phone.rotation.set(-0.75, -0.18, 0);

  const phoneBodyGeo = new THREE.BoxGeometry(0.14, 0.25, 0.018);
  const phoneBodyMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.3 });
  const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
  phone.add(phoneBody);

  const phoneScreenGeo = new THREE.PlaneGeometry(0.12, 0.23);
  const phoneScreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
  phoneScreen.position.z = 0.01;
  phone.add(phoneScreen);

  rightArm.add(phone);
  root.add(rightArm);

  // Left Arm (rests on desk near keyboard)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.34, 0.24, 0);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, jacketSleeveMat);
  leftUpperArm.position.y = -0.16;
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(forearmGeo, jacketSleeveMat);
  leftForearm.position.set(0, -0.38, 0.08);
  leftArm.add(leftForearm);

  root.add(leftArm);
  scene.add(root);

  return {
    root,
    head,
    mouth,
    jaw,
    eyes,
    eyebrows,
    leftArm,
    rightArm,
    phone,
  };
}

/**
 * Procedural Texture for Background Ultrawide Monitor
 */
function createMonitorTexture(headerText: string, alertText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050a16';
  ctx.fillRect(0, 0, 1024, 576);

  // Grid
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.14)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 1024; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 576);
    ctx.stroke();
  }
  for (let y = 0; y < 576; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 75);
  ctx.fillStyle = '#fdc003';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(`⚡ ${headerText}`, 35, 48);

  // Code / Game Stats
  ctx.fillStyle = '#38bdf8';
  ctx.font = '22px monospace';
  ctx.fillText('> [LIVE MATCH] Speed Arena 1v1 PvP Active', 35, 125);
  ctx.fillText('> [OPPONENT] Rahul Sharma · AIR 42 · Rank Surge', 35, 165);

  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`> [ALERT] ${alertText}`, 35, 225);

  ctx.fillStyle = '#4ade80';
  ctx.font = '22px monospace';
  ctx.fillText('> [COMBO STREAK] 10x Speed Multiplier (+450 XP)', 35, 290);
  ctx.fillText('> Formula Master: 15 / 15 Formulas Cleared in 42s', 35, 330);

  // Mini Radar / Leaderboard HUD Box
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(35, 400, 954, 135);
  ctx.strokeStyle = '#fdc003';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(35, 400, 954, 135);

  ctx.fillStyle = '#fdc003';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('LEADERBOARD: #12 ARJUN (+38 PTS) · FOCUS GUARD LOCKED', 55, 445);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px monospace';
  ctx.fillText('Tap to unlock next round • Free on Google Play Store', 55, 490);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Badge Texture for Chest Emblem ("AA" Logo)
 */
function createBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f1e36';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#fdc003';
  ctx.lineWidth = 18;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, 204, 204);

  ctx.fillStyle = '#fdc003';
  ctx.font = '900 115px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AA', 128, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('ARCADE', 128, 192);

  return new THREE.CanvasTexture(canvas);
}

/**
 * 1. High-Fidelity Articulate 3D Mouth Prop (Attached to Head Bone)
 * Dynamically scales with speech amplitude to reveal cavity, teeth, and tongue
 */
function buildArticulate3DMouth(): THREE.Group {
  const mouth = new THREE.Group();

  // Dark oral cavity
  const cavityGeo = new THREE.BoxGeometry(0.044, 0.020, 0.026);
  const cavityMat = new THREE.MeshBasicMaterial({ color: 0x140505 });
  const cavity = new THREE.Mesh(cavityGeo, cavityMat);
  mouth.add(cavity);

  // Upper lip contour (natural facial skin tone)
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xb57c66, roughness: 0.8 });
  const upperLipGeo = new THREE.BoxGeometry(0.048, 0.005, 0.015);
  const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
  upperLip.position.set(0, 0.011, 0.01);
  mouth.add(upperLip);

  // Lower lip contour
  const lowerLipGeo = new THREE.BoxGeometry(0.044, 0.005, 0.015);
  const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
  lowerLip.position.set(0, -0.011, 0.01);
  mouth.add(lowerLip);

  // Upper white teeth row
  const teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const upperTeethGeo = new THREE.BoxGeometry(0.036, 0.006, 0.018);
  const upperTeeth = new THREE.Mesh(upperTeethGeo, teethMat);
  upperTeeth.position.set(0, 0.007, 0.011);
  mouth.add(upperTeeth);

  // Lower white teeth row
  const lowerTeethGeo = new THREE.BoxGeometry(0.032, 0.005, 0.018);
  const lowerTeeth = new THREE.Mesh(lowerTeethGeo, teethMat);
  lowerTeeth.position.set(0, -0.007, 0.011);
  mouth.add(lowerTeeth);

  // Vibrant Pink Tongue
  const tongueGeo = new THREE.BoxGeometry(0.026, 0.005, 0.020);
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(0, -0.004, 0.012);
  mouth.add(tongue);

  mouth.scale.set(0.72, 0.18, 1.0);
  return mouth;
}

/**
 * 2. Brand Gold Wireframe Spectacles (Attached to Head Bone for Arjun)
 */
function buildGoldGlassesProp(): THREE.Group {
  const glasses = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfdc003,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Left & Right Rim
  const rimGeo = new THREE.TorusGeometry(0.023, 0.0022, 8, 20);
  const leftRim = new THREE.Mesh(rimGeo, goldMat);
  leftRim.position.x = -0.034;
  glasses.add(leftRim);

  const rightRim = new THREE.Mesh(rimGeo, goldMat);
  rightRim.position.x = 0.034;
  glasses.add(rightRim);

  // Bridge
  const bridgeGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.022, 6);
  const bridge = new THREE.Mesh(bridgeGeo, goldMat);
  bridge.rotation.z = Math.PI / 2;
  glasses.add(bridge);

  // Temples (sides going back)
  const templeGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.075, 6);
  const leftTemple = new THREE.Mesh(templeGeo, goldMat);
  leftTemple.position.set(-0.058, 0, -0.038);
  leftTemple.rotation.x = Math.PI / 2;
  glasses.add(leftTemple);

  const rightTemple = new THREE.Mesh(templeGeo, goldMat);
  rightTemple.position.set(0.058, 0, -0.038);
  rightTemple.rotation.x = Math.PI / 2;
  glasses.add(rightTemple);

  return glasses;
}

/**
 * 3. Arcade Neck Headphones Prop (Attached to Neck Bone for Arjun)
 */
function buildHeadphonesProp(): THREE.Group {
  const hp = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfdc003,
    metalness: 0.85,
    roughness: 0.25,
  });
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
  });

  // Neck headband arc
  const arcGeo = new THREE.TorusGeometry(0.10, 0.012, 8, 24, Math.PI);
  const arc = new THREE.Mesh(arcGeo, goldMat);
  arc.rotation.x = Math.PI / 2;
  hp.add(arc);

  // Left Ear Cup
  const cupGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.024, 12);
  const leftCup = new THREE.Mesh(cupGeo, padMat);
  leftCup.position.set(-0.105, 0, 0);
  leftCup.rotation.z = Math.PI / 2;
  hp.add(leftCup);

  // Right Ear Cup
  const rightCup = new THREE.Mesh(cupGeo, padMat);
  rightCup.position.set(0.105, 0, 0);
  rightCup.rotation.z = Math.PI / 2;
  hp.add(rightCup);

  return hp;
}

/**
 * 4. Interactive Smartphone Prop (Attached to Right Hand Bone for Arjun)
 * Features glowing AA 1v1 PvP screen and dynamic green screen point light
 */
function buildSmartphoneProp(): THREE.Group {
  const phone = new THREE.Group();

  // Smartphone body / chassis (Obsidian Blue)
  const bodyGeo = new THREE.BoxGeometry(0.075, 0.145, 0.009);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.7,
    roughness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  phone.add(body);

  // Screen Canvas (AA Game UI with glow)
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050a14';
  ctx.fillRect(0, 0, 256, 512);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 65);
  ctx.fillStyle = '#fdc003';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('⚡ AA 1v1 PvP', 20, 42);

  // Health / XP bars
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(20, 95, 216, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('SPEED: 10x STREAK', 30, 112);

  // Formula question
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('v = u + at', 60, 200);

  // Big WINNER / SCORE badge
  ctx.fillStyle = '#fdc003';
  ctx.fillRect(20, 280, 216, 75);
  ctx.fillStyle = '#0f1e36';
  ctx.font = '900 30px sans-serif';
  ctx.fillText('+450 XP WIN', 35, 330);

  // Rank
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('RANK #12 PROMOTED', 20, 420);

  const screenTex = new THREE.CanvasTexture(canvas);
  const screenGeo = new THREE.PlaneGeometry(0.068, 0.138);
  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTex,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.005;
  phone.add(screen);

  // Screen glow light illuminating Arjun's hand & face
  const screenLight = new THREE.PointLight(0x22c55e, 2.0, 0.45);
  screenLight.position.set(0, 0, 0.05);
  phone.add(screenLight);

  return phone;
}

/**
 * 5. Digital Mentor Tablet Prop (Attached to Left Hand Bone for Priya)
 * Features mentor analytics dashboard and warm gold screen point light
 */
function buildTabletProp(): THREE.Group {
  const tablet = new THREE.Group();

  // Tablet Chassis
  const bodyGeo = new THREE.BoxGeometry(0.165, 0.23, 0.009);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.65,
    roughness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  tablet.add(body);

  // Screen Canvas (Mentor Dashboard / Syllabus Analytics)
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090e1a';
  ctx.fillRect(0, 0, 384, 512);

  // Gold header
  ctx.fillStyle = '#0f1e36';
  ctx.fillRect(0, 0, 384, 70);
  ctx.fillStyle = '#fdc003';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('🎓 AA MENTOR RADAR', 25, 45);

  // Stats boxes
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(25, 95, 334, 110);
  ctx.strokeStyle = '#fdc003';
  ctx.lineWidth = 3;
  ctx.strokeRect(25, 95, 334, 110);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('STUDENT: ARJUN AIR 42', 45, 135);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('MASTERY: 94.2% (+18%)', 45, 175);

  // Curriculum progress
  ctx.fillStyle = '#fdc003';
  ctx.fillRect(25, 240, 240, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PHYSICS & MATH BATTLE READY', 25, 290);

  const screenTex = new THREE.CanvasTexture(canvas);
  const screenGeo = new THREE.PlaneGeometry(0.152, 0.216);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.005;
  tablet.add(screen);

  // Soft gold amber ambient glow from tablet
  const tabletLight = new THREE.PointLight(0xfdc003, 1.8, 0.55);
  tabletLight.position.set(0, 0, 0.06);
  tablet.add(tabletLight);

  return tablet;
}

/**
 * 6. Official Aspirant Arcade Chest Badge Prop ("AA" Crest)
 */
function buildAABadgeProp(): THREE.Group {
  const badge = new THREE.Group();

  // Circular Gold Bezel
  const bezelGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.005, 20);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfdc003,
    metalness: 0.9,
    roughness: 0.2,
  });
  const bezel = new THREE.Mesh(bezelGeo, goldMat);
  bezel.rotation.x = Math.PI / 2;
  badge.add(bezel);

  // Face with AA Logo
  const faceGeo = new THREE.CircleGeometry(0.024, 20);
  const badgeTex = createBadgeTexture();
  const faceMat = new THREE.MeshBasicMaterial({ map: badgeTex });
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.position.z = 0.003;
  badge.add(face);

  return badge;
}
