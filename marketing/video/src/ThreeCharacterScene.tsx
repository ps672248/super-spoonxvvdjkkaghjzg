import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import * as THREE from 'three';
import audioEnvelopes from './audioEnvelopes.json';

export interface ThreeCharacterSceneProps {
  variant?: 'arjun' | 'priya';
  mood?: 'talking' | 'shocked' | 'questioning' | 'celebrating' | 'listening';
  dialogueClip?: keyof typeof audioEnvelopes;
  dialogueStartFrame?: number;
  cameraAngle?: 'closeup' | 'medium' | 'wide' | 'over_shoulder';
  showMonitor?: boolean;
  transparentBackground?: boolean;
  monitorText?: string;
  monitorSubtitle?: string;
  width?: number;
  height?: number;
  scale?: number;
}

/**
 * 3D Low-Poly Character & Cinematic Scene Engine (Three.js)
 * Matching the exact visual style of @base.learn Instagram Reels:
 *   - Faceted low-poly geometric meshes with flat shading
 *   - Dramatic terminal/monitor screen glow and directional lighting
 *   - Frame-accurate amplitude-driven 3D mouth lip sync from real audio
 *   - Dynamic 3D head bobbing, eye blinking, and expressive gestures
 */
export const ThreeCharacterScene: React.FC<ThreeCharacterSceneProps> = ({
  variant = 'arjun',
  mood = 'talking',
  dialogueClip,
  dialogueStartFrame = 0,
  cameraAngle = 'medium',
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

  // Three.js internal references stored across frames
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterRef = useRef<{
    root: THREE.Group;
    head: THREE.Group;
    mouth: THREE.Group;
    jaw: THREE.Mesh;
    eyes: THREE.Group;
    eyebrows: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    phone: THREE.Group;
  } | null>(null);
  const monitorLightRef = useRef<THREE.PointLight | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene
    const scene = new THREE.Scene();
    if (!transparentBackground) {
      scene.background = new THREE.Color(0x060913); // Deep midnight cinematic void
      scene.fog = new THREE.FogExp2(0x060913, 0.15);
    }
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 50);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting Rig (Cinematic Dramatic Screen Glow)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
    dirLight.position.set(2.5, 4, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Glowing screen light directly illuminating the character
    const monitorLight = new THREE.PointLight(0xfdc003, 3.2, 5.0, 1.2);
    monitorLight.position.set(0, 0.6, -0.6);
    scene.add(monitorLight);
    monitorLightRef.current = monitorLight;

    // Soft rim back-light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 5. Environment: Desk & Giant Glowing Monitor (Reel 1 Style)
    if (showMonitor) {
      // Desk surface
      const deskGeo = new THREE.BoxGeometry(4.5, 0.15, 2.5);
      const deskMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.7,
        flatShading: true,
      });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, -0.9, -0.4);
      desk.receiveShadow = true;
      scene.add(desk);

      // Books stacked on the desk (Reel 3 style)
      const bookColors = [0xe11d48, 0x2563eb, 0x10b981];
      for (let i = 0; i < 3; i++) {
        const bookGeo = new THREE.BoxGeometry(0.55, 0.08, 0.4);
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[i],
          flatShading: true,
          roughness: 0.6,
        });
        const book = new THREE.Mesh(bookGeo, bookMat);
        book.position.set(-0.95 + (i * 0.02), -0.78 + (i * 0.08), -0.3 + (i * 0.03));
        book.rotation.y = 0.15 + (i * 0.05);
        book.castShadow = true;
        scene.add(book);
      }

      // Giant curved background monitor (Reel 1 Code Screen)
      const monitorGroup = new THREE.Group();
      monitorGroup.position.set(0, 0.35, -1.1);
      monitorGroup.rotation.x = -0.04;

      const screenFrameGeo = new THREE.BoxGeometry(3.6, 2.2, 0.1);
      const screenFrameMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        roughness: 0.5,
        flatShading: true,
      });
      const screenFrame = new THREE.Mesh(screenFrameGeo, screenFrameMat);
      monitorGroup.add(screenFrame);

      // Glowing screen face with live terminal texture
      const screenFaceGeo = new THREE.PlaneGeometry(3.45, 2.05);
      const screenFaceMat = new THREE.MeshBasicMaterial({
        map: createMonitorTexture(),
      });
      const screenFace = new THREE.Mesh(screenFaceGeo, screenFaceMat);
      screenFace.position.z = 0.06;
      monitorGroup.add(screenFace);

      scene.add(monitorGroup);
    }

    // 6. Build the 3D Low-Poly Character
    const character = buildLowPolyCharacter(variant, scene);
    characterRef.current = character;

    // Cleanup on unmount
    return () => {
      renderer.dispose();
    };
  }, [variant, showMonitor, transparentBackground, width, height]);

  // Frame update loop
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !characterRef.current) return;

    const char = characterRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    // ─── 1. Audio Amplitude Lip Sync (Frame-Accurate) ───
    let currentAmplitude = 0;
    if (dialogueClip && audioEnvelopes[dialogueClip]) {
      const clipFrames = audioEnvelopes[dialogueClip] as number[];
      const localFrame = frame - dialogueStartFrame;
      if (localFrame >= 0 && localFrame < clipFrames.length) {
        currentAmplitude = clipFrames[localFrame] || 0;
      }
    } else if (mood === 'talking') {
      // Fallback cadence if clip not specified
      const cadence = Math.sin(frame * 0.6) * 0.5 + Math.sin(frame * 1.2) * 0.3 + 0.2;
      currentAmplitude = Math.max(0, Math.min(1, cadence));
    }

    // Snappy non-linear thresholding for crisp low-poly mouth pop
    const isSpeaking = currentAmplitude > 0.05;
    const mouthOpen = isSpeaking ? Math.min(2.0, 0.15 + currentAmplitude * 2.2) : 0.08;
    const mouthWidth = isSpeaking ? 0.8 + currentAmplitude * 0.5 : 0.7;

    // Animate mouth slot
    char.mouth.scale.set(mouthWidth, mouthOpen, 1);
    char.jaw.position.y = -0.26 - (isSpeaking ? 0.035 * currentAmplitude : 0);

    // ─── 2. Head Motion (Audio Stress Nod & Subtle Breathing) ───
    const headNod = isSpeaking ? Math.sin(frame * 0.45) * 0.06 * currentAmplitude : Math.sin(frame / 20) * 0.02;
    const headTilt = isSpeaking ? Math.sin(frame / 9) * 0.04 : (variant === 'arjun' ? -0.03 : 0.04);
    const breathing = Math.sin(frame / 16) * 0.015;

    char.head.rotation.x = headNod;
    char.head.rotation.y = headTilt;
    char.head.position.y = 0.46 + breathing + (isSpeaking ? -0.01 * currentAmplitude : 0);

    // ─── 3. Eye Blinking (Every 3.5 seconds) ───
    const blinkCycle = frame % 105;
    const isBlinking = blinkCycle > 98 && blinkCycle < 103;
    char.eyes.scale.y = isBlinking ? 0.1 : 1.0;

    // ─── 4. Eyebrows & Mood Expressions ───
    if (mood === 'shocked') {
      char.eyebrows.position.y = 0.14;
      char.eyebrows.rotation.z = 0;
    } else if (mood === 'questioning') {
      char.eyebrows.position.y = 0.11;
      char.eyebrows.rotation.z = 0.08;
    } else if (isSpeaking) {
      char.eyebrows.position.y = 0.10 + currentAmplitude * 0.03;
    } else {
      char.eyebrows.position.y = 0.09;
    }

    // ─── 5. Arms & Prop Gestures ───
    const armSway = Math.sin(frame * 0.2) * 0.05;
    if (mood === 'celebrating') {
      char.rightArm.rotation.set(-1.8 + armSway, 0, 0.4);
      char.leftArm.rotation.set(-1.8 - armSway, 0, -0.4);
      char.phone.visible = false;
    } else if (mood === 'shocked') {
      char.rightArm.rotation.set(-1.4, 0.2, 0.6);
      char.leftArm.rotation.set(-1.4, -0.2, -0.6);
      char.phone.visible = false;
    } else {
      // Default: holding phone in right hand, looking down/up
      char.rightArm.rotation.set(-0.75 + headNod * 0.5, 0.15, -0.15);
      char.leftArm.rotation.set(0.1 + armSway, 0, -0.12);
      char.phone.visible = true;
    }

    // ─── 6. Camera Shot Setup & Gentle Handheld Drift ───
    const driftX = Math.sin(frame / 45) * 0.04;
    const driftY = Math.cos(frame / 38) * 0.03;

    if (cameraAngle === 'closeup') {
      camera.position.set(0.0 + driftX, 0.05 + driftY, 2.3);
      camera.lookAt(0, 0.0, 0);
    } else if (cameraAngle === 'over_shoulder') {
      camera.position.set(0.55 + driftX, 0.15 + driftY, 2.7);
      camera.lookAt(-0.1, -0.05, 0);
    } else {
      // Medium shot (default)
      camera.position.set(0.0 + driftX, 0.0 + driftY, 3.1);
      camera.lookAt(0, -0.1, 0);
    }

    // Light pulse synced to speech
    if (monitorLightRef.current) {
      monitorLightRef.current.intensity = 2.8 + currentAmplitude * 1.5;
    }

    // Render frame
    rendererRef.current.render(scene, camera);
  }, [frame, mood, dialogueClip, dialogueStartFrame, cameraAngle, variant]);

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
 * Procedural Low-Poly 3D Character Builder (Matching Base.Learn / Reel 1 / Reel 3)
 */
function buildLowPolyCharacter(variant: 'arjun' | 'priya', scene: THREE.Scene) {
  const isArjun = variant === 'arjun';
  const root = new THREE.Group();
  root.position.set(0, -0.4, 0);

  // Palette:
  // Arjun: Navy 0x0F172A + Gold 0xFDC003
  // Priya: Cream 0xF8FAFC + Navy 0x0F172A + Gold 0xFDC003
  const skinColor = isArjun ? 0xe29d72 : 0xe8b38e;
  const hairColor = isArjun ? 0x221a15 : 0x332219;
  const jacketMainColor = isArjun ? 0x0f172a : 0xf8fafc;
  const jacketSleeveColor = isArjun ? 0x1e293b : 0x0f172a;
  const goldTrimColor = 0xfdc003;

  // Shared Low-Poly Flat-Shaded Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    flatShading: true,
    roughness: 0.6,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    flatShading: true,
    roughness: 0.7,
  });
  const jacketBodyMat = new THREE.MeshStandardMaterial({
    color: jacketMainColor,
    flatShading: true,
    roughness: 0.65,
  });
  const jacketSleeveMat = new THREE.MeshStandardMaterial({
    color: jacketSleeveColor,
    flatShading: true,
    roughness: 0.65,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: goldTrimColor,
    flatShading: true,
    roughness: 0.35,
    metalness: 0.6,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    flatShading: true,
    roughness: 0.4,
  });
  const darkCavityMat = new THREE.MeshBasicMaterial({ color: 0x180606 });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  // ─── 1. TORSO & VARSITY JACKET ───
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -0.28, 0);

  // Faceted Chest / Bomber Body
  const chestGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.65, 8);
  const chest = new THREE.Mesh(chestGeo, jacketBodyMat);
  chest.castShadow = true;
  chest.receiveShadow = true;
  torsoGroup.add(chest);

  // Gold Ribbed Collar
  const collarGeo = new THREE.TorusGeometry(0.22, 0.045, 6, 14);
  const collar = new THREE.Mesh(collarGeo, goldMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.33;
  torsoGroup.add(collar);

  // Center Gold Zipper
  const zipGeo = new THREE.BoxGeometry(0.025, 0.62, 0.04);
  const zip = new THREE.Mesh(zipGeo, goldMat);
  zip.position.set(0, 0, 0.34);
  torsoGroup.add(zip);

  // Left Chest Aspirant Arcade Crest Badge (With authentic Logo)
  const badgeGeo = new THREE.BoxGeometry(0.14, 0.16, 0.03);
  const badge = new THREE.Mesh(badgeGeo, goldMat);
  badge.position.set(-0.16, 0.12, 0.32);
  badge.rotation.y = -0.3;
  torsoGroup.add(badge);

  // Synchronous Crisp Vector Emblem on Badge Face
  const logoFaceGeo = new THREE.PlaneGeometry(0.11, 0.13);
  const logoFaceMat = new THREE.MeshBasicMaterial({
    map: createBadgeTexture(),
  });
  const logoFace = new THREE.Mesh(logoFaceGeo, logoFaceMat);
  logoFace.position.set(-0.16, 0.12, 0.338);
  logoFace.rotation.y = -0.3;
  torsoGroup.add(logoFace);

  root.add(torsoGroup);

  // ─── 2. HEAD & FACETED FACE ───
  const head = new THREE.Group();
  head.position.set(0, 0.46, 0);

  // Neck connecting head to torso
  const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.22, 6);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = -0.22;
  head.add(neck);

  // Faceted Polygonal Head (Dodecahedron with flat shading = true)
  const headGeo = new THREE.DodecahedronGeometry(0.36, 1);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.scale.set(1.0, 1.12, 1.05);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Low-Poly Chin/Jaw (Articulates down on speech vowels)
  const jawGeo = new THREE.BoxGeometry(0.20, 0.10, 0.20);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, -0.26, 0.10);
  head.add(jaw);

  // ─── 3. LOW-POLY HAIR ───
  const hairGroup = new THREE.Group();
  if (isArjun) {
    // Arjun: Modern faceted crop quiff with angular blocks (Reel 1 & 3 style)
    const hairCapGeo = new THREE.DodecahedronGeometry(0.38, 1);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.08, -0.05);
    hairCap.scale.set(1.04, 1.15, 1.05);
    hairGroup.add(hairCap);

    // Front quiff spikes
    for (let i = 0; i < 5; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
      const spike = new THREE.Mesh(spikeGeo, hairMat);
      spike.position.set(-0.14 + (i * 0.07), 0.38, 0.18 - Math.abs(i - 2) * 0.04);
      spike.rotation.set(-0.4, 0, (i - 2) * -0.2);
      hairGroup.add(spike);
    }
  } else {
    // Priya: Sleek layered bob with side fringe
    const bobGeo = new THREE.CylinderGeometry(0.36, 0.44, 0.55, 8);
    const bob = new THREE.Mesh(bobGeo, hairMat);
    bob.position.set(0, -0.02, -0.04);
    hairGroup.add(bob);
  }
  head.add(hairGroup);

  // ─── 4. EYES & SPECULAR GLINTS ───
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.02, 0.32);

  const eyeGeo = new THREE.BoxGeometry(0.07, 0.07, 0.04);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.x = -0.12;
  eyes.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.x = 0.12;
  eyes.add(rightEye);

  // White Specular Glints
  const glintGeo = new THREE.BoxGeometry(0.025, 0.025, 0.02);
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const leftGlint = new THREE.Mesh(glintGeo, glintMat);
  leftGlint.position.set(-0.11, 0.015, 0.022);
  eyes.add(leftGlint);

  const rightGlint = new THREE.Mesh(glintGeo, glintMat);
  rightGlint.position.set(0.13, 0.015, 0.022);
  eyes.add(rightGlint);

  head.add(eyes);

  // ─── 5. EYEBROWS ───
  const eyebrows = new THREE.Group();
  eyebrows.position.set(0, 0.10, 0.33);

  const browGeo = new THREE.BoxGeometry(0.10, 0.03, 0.03);
  const browMat = new THREE.MeshBasicMaterial({ color: 0x1a1512 });

  const leftBrow = new THREE.Mesh(browGeo, browMat);
  leftBrow.position.x = -0.13;
  leftBrow.rotation.z = -0.08;
  eyebrows.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, browMat);
  rightBrow.position.x = 0.13;
  rightBrow.rotation.z = 0.08;
  eyebrows.add(rightBrow);

  head.add(eyebrows);

  // ─── 6. CIRCULAR GOLD SPECTACLES (Arjun) ───
  if (isArjun) {
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.02, 0.34);

    const rimGeo = new THREE.TorusGeometry(0.09, 0.014, 6, 16);
    const leftRim = new THREE.Mesh(rimGeo, goldMat);
    leftRim.position.x = -0.13;
    glassesGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimGeo, goldMat);
    rightRim.position.x = 0.13;
    glassesGroup.add(rightRim);

    // Center Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
    const bridge = new THREE.Mesh(bridgeGeo, goldMat);
    bridge.rotation.z = Math.PI / 2;
    glassesGroup.add(bridge);

    head.add(glassesGroup);

    // Arcade Headphones draped around neck
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, -0.14, 0);

    const hpBandGeo = new THREE.TorusGeometry(0.26, 0.035, 6, 16, Math.PI);
    const hpBand = new THREE.Mesh(hpBandGeo, goldMat);
    hpBand.rotation.x = Math.PI / 2;
    hpGroup.add(hpBand);

    const earCupGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 6);
    const earCupMat = new THREE.MeshStandardMaterial({ color: 0x090d16, flatShading: true });

    const leftCup = new THREE.Mesh(earCupGeo, earCupMat);
    leftCup.position.set(-0.28, 0, 0);
    leftCup.rotation.z = Math.PI / 2;
    hpGroup.add(leftCup);

    const rightCup = new THREE.Mesh(earCupGeo, earCupMat);
    rightCup.position.set(0.28, 0, 0);
    rightCup.rotation.z = Math.PI / 2;
    hpGroup.add(rightCup);

    head.add(hpGroup);
  } else {
    // Priya Gold Hoop Earrings
    const hoopGeo = new THREE.TorusGeometry(0.05, 0.01, 6, 12);
    const leftHoop = new THREE.Mesh(hoopGeo, goldMat);
    leftHoop.position.set(-0.35, -0.05, 0);
    leftHoop.rotation.y = Math.PI / 2;
    head.add(leftHoop);

    const rightHoop = new THREE.Mesh(hoopGeo, goldMat);
    rightHoop.position.set(0.35, -0.05, 0);
    rightHoop.rotation.y = Math.PI / 2;
    head.add(rightHoop);
  }

  // ─── 7. HIGH-FIDELITY 3D MOUTH (The Core Lip Sync) ───
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.16, 0.33);

  // Lip frame border (matches low-poly style)
  const lipFrameGeo = new THREE.BoxGeometry(0.20, 0.10, 0.04);
  const lipFrameMat = new THREE.MeshStandardMaterial({ color: 0x3d1212, flatShading: true });
  const lipFrame = new THREE.Mesh(lipFrameGeo, lipFrameMat);
  mouth.add(lipFrame);

  // Recessed Dark Oral Cavity
  const cavityGeo = new THREE.BoxGeometry(0.17, 0.08, 0.08);
  const cavity = new THREE.Mesh(cavityGeo, darkCavityMat);
  cavity.position.z = 0.02;
  mouth.add(cavity);

  // Top White Teeth Bar
  const teethGeo = new THREE.BoxGeometry(0.14, 0.024, 0.085);
  const teeth = new THREE.Mesh(teethGeo, whiteMat);
  teeth.position.set(0, 0.026, 0.02);
  mouth.add(teeth);

  // Vibrant Pink Tongue
  const tongueGeo = new THREE.BoxGeometry(0.11, 0.025, 0.085);
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(0, -0.026, 0.02);
  mouth.add(tongue);
  tongue.position.y = -0.03;
  mouth.add(tongue);

  head.add(mouth);
  root.add(head);

  // ─── 8. ARMS & SMARTPHONE PROP ───
  // Right Arm (holds phone)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.28, 0);

  const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.34, 6);
  const rightUpperArm = new THREE.Mesh(upperArmGeo, jacketSleeveMat);
  rightUpperArm.position.y = -0.17;
  rightArm.add(rightUpperArm);

  const forearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 6);
  const rightForearm = new THREE.Mesh(forearmGeo, jacketSleeveMat);
  rightForearm.position.set(0, -0.42, 0.12);
  rightForearm.rotation.x = -0.6;
  rightArm.add(rightForearm);

  // Smartphone device in hand
  const phone = new THREE.Group();
  phone.position.set(0, -0.56, 0.24);
  phone.rotation.set(-0.8, -0.2, 0);

  const phoneBodyGeo = new THREE.BoxGeometry(0.16, 0.28, 0.02);
  const phoneBodyMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.3 });
  const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
  phone.add(phoneBody);

  // Glowing Screen with green/gold light
  const phoneScreenGeo = new THREE.PlaneGeometry(0.14, 0.25);
  const phoneScreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
  phoneScreen.position.z = 0.012;
  phone.add(phoneScreen);

  rightArm.add(phone);
  root.add(rightArm);

  // Left Arm (relaxed or gesturing)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.28, 0);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, jacketSleeveMat);
  leftUpperArm.position.y = -0.17;
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(forearmGeo, jacketSleeveMat);
  leftForearm.position.set(0, -0.42, 0.06);
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
 * Synchronous Procedural Texture for Background Cyber Monitor (Reel 1 Style)
 */
function createMonitorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Dark slate terminal background
  ctx.fillStyle = '#060D1A';
  ctx.fillRect(0, 0, 1024, 640);

  // Subtle Cyan Grid lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1024; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }
  for (let y = 0; y < 640; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Glowing Header Bar
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 1024, 90);
  ctx.fillStyle = '#FDC003';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('⚡ ASPIRANT ARCADE // FOCUS GUARD v2.4', 40, 58);

  // Terminal Lines
  ctx.fillStyle = '#38BDF8';
  ctx.font = '28px monospace';
  ctx.fillText('> [MONITOR] Instagram / YouTube Reels Active', 40, 150);
  ctx.fillText('> [ALERT] Continuous Doomscroll Detected: 2h 14m', 40, 205);

  ctx.fillStyle = '#FB7185';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('> [INTERVENTION TRIGGERED] Reels Paused', 40, 280);

  ctx.fillStyle = '#4ADE80';
  ctx.font = '28px monospace';
  ctx.fillText('> [CHALLENGE] GATE 2026 Question Pushed to Screen', 40, 355);
  ctx.fillText('> Solve correctly to resume 5-minute break...', 40, 410);

  // Status Bar at bottom
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(40, 510, 944, 65);
  ctx.strokeStyle = '#FDC003';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 510, 944, 65);

  ctx.fillStyle = '#FDC003';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('STATUS: LOCKED [1 / 1 QUESTIONS PENDING]', 60, 552);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Synchronous Procedural Texture for Chest Badge Monogram
 */
function createBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep Navy Shield
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 256, 256);

  // Gold Embroidered Border
  ctx.strokeStyle = '#FDC003';
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, 236, 236);

  // Inner Gold Accent
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, 204, 204);

  // Bold "AA" Monogram
  ctx.fillStyle = '#FDC003';
  ctx.font = '900 115px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AA', 128, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('ARCADE', 128, 192);

  return new THREE.CanvasTexture(canvas);
}
