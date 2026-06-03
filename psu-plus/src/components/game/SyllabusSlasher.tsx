import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions, PanResponder, StatusBar, ImageBackground, Animated, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SlasherLogic } from '../../hooks/useSyllabusSlasherLogic';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useExamStore } from '../../stores/examStore';
import { GameResultScreen, GenericResultItem } from './GameResultScreen';
import { UnifiedQuestion } from './UnifiedQuestion';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRAVITY = 0.38;
const SPAWN_Y = SCREEN_HEIGHT + 60;
const FRUIT_SIZE = 75;
const BOMB_SIZE = 65;
const MAX_SPLATS = 20;

const FRUIT_CONFIGS = {
    watermelon: { emoji: '🍉', skin: '#2E7D32', flesh: '#EF5350', juice: '#E53935' },
    orange:     { emoji: '🍊', skin: '#E65100', flesh: '#FFA726', juice: '#FF7043' },
    apple:      { emoji: '🍎', skin: '#B71C1C', flesh: '#FFFDE7', juice: '#EF5350' },
    mango:      { emoji: '🥭', skin: '#E65100', flesh: '#FF8F00', juice: '#FFB300' },
    kiwi:       { emoji: '🥝', skin: '#33691E', flesh: '#AED581', juice: '#7CB342' },
    banana:     { emoji: '🍌', skin: '#F57F17', flesh: '#FFF9C4', juice: '#FFD54F' },
} as const;
type FruitType = keyof typeof FRUIT_CONFIGS;

interface Fruit2D {
    id: number; x: number; y: number; vx: number; vy: number;
    rotation: number; rv: number;
    skin: string; flesh: string; juice: string; emoji: string;
    isBomb: boolean; isSliced: boolean; type: string;
    ref: React.RefObject<View | null>;
}

interface Piece2D {
    id: number; x: number; y: number; vx: number; vy: number;
    rotation: number; rv: number;
    color: string; side: 'left' | 'right'; opacity: number;
    ref: React.RefObject<View | null>;
}

interface SplatDrop {
    offsetX: number; offsetY: number;
    w: number; h: number;
    rotDeg: number; alpha: number;
}

interface Splat2D {
    id: number; x: number; y: number; color: string;
    drops: SplatDrop[];
}

interface FloatingText {
    id: number; x: number; y: number; text: string; color: string;
}

export const SyllabusSlasher = ({ logic, onRestart, onHome }: { logic: SlasherLogic; onRestart?: () => void; onHome?: () => void }) => {
    const { gameState, score, lives, combo, questionVisible, currentQuestion,
            recordSlice, recordMiss, handleQuestionResponse, isPaused, results,
            stats, feedbackMessage } = logic;
    const { fullName } = useSettingsStore();
    const { addQuestionBookmark, removeQuestionBookmark, isQuestionBookmarked } = useBookmarkStore();
    const { selectedPSU, selectedBranch } = useExamStore();
    const firstName = fullName.split(' ')[0];

    const [fruits, setFruits] = useState<Fruit2D[]>([]);
    const [pieces, setPieces] = useState<Piece2D[]>([]);
    const [splats, setSplats] = useState<Splat2D[]>([]);
    const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
    const [criticals, setCriticals] = useState<{ id: number; x: number; y: number }[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [bookmarkNote, setBookmarkNote] = useState('');

    const activeFruits = useRef<Fruit2D[]>([]);
    const activePieces = useRef<Piece2D[]>([]);
    const lastTouch = useRef({ x: 0, y: 0, vx: 0, vy: 0, time: 0 });
    const gestureSliceCount = useRef(0);
    const missInProgressRef = useRef(false);

    const fruitId = useRef(0);
    const pieceId = useRef(0);
    const splatId = useRef(0);
    const trailId = useRef(0);
    const criticalId = useRef(0);
    const floatingTextId = useRef(0);
    const lastSpawnTime = useRef(0);
    const hasStarted = useRef(false);

    // Animated values
    const feedbackScale = useRef(new Animated.Value(0.5)).current;
    const feedbackOpacity = useRef(new Animated.Value(0)).current;
    const screenFlash = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Floating text anim map: id → {opacity, translateY}
    const floatingAnimRefs = useRef<Map<number, { opacity: Animated.Value; translateY: Animated.Value }>>(new Map());
    // Splat opacity anim map: id → opacity Animated.Value
    const splatAnimRefs = useRef<Map<number, Animated.Value>>(new Map());

    const isPausedRef = useRef(isPaused);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    const recordSliceRef = useRef(recordSlice);
    useEffect(() => { recordSliceRef.current = recordSlice; }, [recordSlice]);

    const recordMissRef = useRef(recordMiss);
    useEffect(() => { recordMissRef.current = recordMiss; }, [recordMiss]);

    const backgroundImage = { uri: 'file:///C:/Users/ps671/.gemini/antigravity/brain/aa890da7-c6bd-48c6-8d6c-af790b83b3b8/fruit_ninja_wooden_background_1778302764827.png' };

    // Reset miss guard when game resumes after question
    useEffect(() => {
        if (!isPaused) missInProgressRef.current = false;
    }, [isPaused]);

    const triggerShake = (intensity: number = 10) => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: intensity, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -intensity, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: intensity * 0.5, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
        const id = floatingTextId.current++;
        const opacity = new Animated.Value(1);
        const translateY = new Animated.Value(0);
        floatingAnimRefs.current.set(id, { opacity, translateY });
        setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);

        Animated.parallel([
            Animated.timing(translateY, { toValue: -80, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
            Animated.sequence([
                Animated.delay(300),
                Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
            ]),
        ]).start(() => {
            floatingAnimRefs.current.delete(id);
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        });
    };

    useEffect(() => {
        if (feedbackMessage) {
            feedbackScale.setValue(0.5);
            feedbackOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(feedbackScale, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
            ]).start();

            if (feedbackMessage.type === 'error') {
                Animated.sequence([
                    Animated.timing(screenFlash, { toValue: 0.8, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(screenFlash, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
                ]).start();
                triggerShake(15);
            }
        } else {
            Animated.timing(feedbackOpacity, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
        }
    }, [feedbackMessage]);

    const spawnFruit = useCallback(() => {
        const typeKeys = Object.keys(FRUIT_CONFIGS) as FruitType[];
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const cfg = FRUIT_CONFIGS[type];
        const isBomb = Math.random() < 0.25;
        const xPos = 80 + Math.random() * (SCREEN_WIDTH - 160);

        const newFruit: Fruit2D = {
            id: fruitId.current++,
            x: xPos, y: SPAWN_Y,
            vx: (SCREEN_WIDTH / 2 - xPos) * 0.025 + (Math.random() - 0.5) * 5,
            vy: -15 - Math.random() * 7,
            rotation: Math.random() * 360,
            rv: (Math.random() - 0.5) * 15,
            skin: isBomb ? '#111' : cfg.skin,
            flesh: isBomb ? '#333' : cfg.flesh,
            juice: isBomb ? '#FF6F00' : cfg.juice,
            emoji: isBomb ? '💣' : cfg.emoji,
            isBomb, isSliced: false, type,
            ref: React.createRef<View | null>(),
        };

        activeFruits.current.push(newFruit);
        setFruits(prev => [...prev, newFruit]);
    }, []);

    const spawnPieces = (fruit: Fruit2D) => {
        const sliceVx = lastTouch.current.vx * 0.5;
        const sliceVy = lastTouch.current.vy * 0.5;

        const createPiece = (side: 'left' | 'right'): Piece2D => ({
            id: pieceId.current++,
            x: fruit.x, y: fruit.y,
            vx: fruit.vx + (side === 'left' ? -5 : 5) + sliceVx,
            vy: fruit.vy - 4 + sliceVy,
            rotation: fruit.rotation,
            rv: fruit.rv * 1.8 + (side === 'left' ? -5 : 5),
            color: side === 'left' ? fruit.skin : fruit.flesh,
            side, opacity: 1,
            ref: React.createRef<View | null>(),
        });

        const p1 = createPiece('left');
        const p2 = createPiece('right');
        activePieces.current.push(p1, p2);
        setPieces(prev => [...prev, p1, p2]);
    };

    const addSplat = (x: number, y: number, color: string, vx: number, vy: number) => {
        const id = splatId.current++;
        const sliceAngle = Math.atan2(vy, vx); // radians

        const drops: SplatDrop[] = [];

        // Center blob — large teardrop in slice direction
        drops.push({
            offsetX: 0, offsetY: 0,
            w: 46 + Math.random() * 22, h: 36 + Math.random() * 16,
            rotDeg: sliceAngle * (180 / Math.PI), alpha: 0.88,
        });

        // Directional squirt drops — spray along slice direction ±60°
        for (let i = 0; i < 7; i++) {
            const spread = sliceAngle + (Math.random() - 0.5) * 2.1;
            const dist = 22 + Math.random() * 70;
            drops.push({
                offsetX: Math.cos(spread) * dist,
                offsetY: Math.sin(spread) * dist,
                w: 6 + Math.random() * 20, h: 12 + Math.random() * 22,
                rotDeg: spread * (180 / Math.PI),
                alpha: 0.5 + Math.random() * 0.35,
            });
        }

        // Small scatter droplets in all directions
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 28;
            const sz = 4 + Math.random() * 11;
            drops.push({
                offsetX: Math.cos(angle) * dist,
                offsetY: Math.sin(angle) * dist,
                w: sz, h: sz,
                rotDeg: angle * (180 / Math.PI),
                alpha: 0.35 + Math.random() * 0.35,
            });
        }

        const opacity = new Animated.Value(1);
        splatAnimRefs.current.set(id, opacity);
        setSplats(prev => [...prev, { id, x, y, color, drops }].slice(-MAX_SPLATS));

        // Stick on screen briefly, then fade out
        setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: Platform.OS !== 'web' }).start(() => {
                splatAnimRefs.current.delete(id);
                setSplats(prev => prev.filter(s => s.id !== id));
            });
        }, 1800);
    };

    const handleSlice = (fruit: Fruit2D) => {
        if (fruit.isSliced) return;
        fruit.isSliced = true;
        activeFruits.current = activeFruits.current.filter(f => f.id !== fruit.id);
        setFruits(prev => prev.filter(f => f.id !== fruit.id));

        if (fruit.isBomb) {
            missInProgressRef.current = true;
            triggerShake(12);
            addSplat(fruit.x, fruit.y, '#FF6F00', lastTouch.current.vx, lastTouch.current.vy);
            recordSliceRef.current(true);
        } else {
            spawnPieces(fruit);
            addSplat(fruit.x, fruit.y, fruit.juice, lastTouch.current.vx, lastTouch.current.vy);
            const result = recordSliceRef.current(false) as any;

            gestureSliceCount.current++;
            const pts: number = result?.points ?? 1;

            if (result?.isCritical) {
                const cid = criticalId.current++;
                setCriticals(prev => [...prev, { id: cid, x: fruit.x, y: fruit.y }]);
                setTimeout(() => setCriticals(prev => prev.filter(c => c.id !== cid)), 800);
                spawnFloatingText(fruit.x, fruit.y - 30, `CRITICAL! +${pts}`, '#FFD700');
            } else {
                spawnFloatingText(fruit.x, fruit.y - 20, `+${pts}`, '#FFFFFF');
            }

            if (gestureSliceCount.current === 2) {
                spawnFloatingText(fruit.x, fruit.y - 60, 'DOUBLE SLICE!', '#00BCD4');
            } else if (gestureSliceCount.current >= 3) {
                spawnFloatingText(fruit.x, fruit.y - 60, 'TRIPLE SLICE!', '#E040FB');
            }
        }
    };

    useEffect(() => {
        if (gameState === 'playing' && !isPaused && !hasStarted.current) {
            setCountdown('READY?');
            setTimeout(() => setCountdown('GO!'), 800);
            setTimeout(() => setCountdown(null), 1500);
            hasStarted.current = true;
        }
    }, [gameState, isPaused]);

    useEffect(() => {
        if (gameState !== 'playing' || isPaused || countdown) return;

        let frame: number;
        const update = () => {
            const now = Date.now();
            if (now - lastSpawnTime.current > Math.max(300, 1000 - (score * 8))) {
                spawnFruit();
                if (Math.random() > 0.8) spawnFruit();
                lastSpawnTime.current = now;
            }

            activeFruits.current.forEach(f => {
                f.vy += GRAVITY; f.x += f.vx; f.y += f.vy; f.rotation += f.rv;
                if (f.ref.current) {
                    const size = f.isBomb ? BOMB_SIZE : FRUIT_SIZE;
                    f.ref.current.setNativeProps({
                        style: { transform: [{ translateX: f.x - size / 2 }, { translateY: f.y - size / 2 }, { rotate: `${f.rotation}deg` }] },
                    });
                }
            });

            activePieces.current.forEach(p => {
                p.vy += GRAVITY * 1.3; p.x += p.vx; p.y += p.vy; p.rotation += p.rv; p.opacity -= 0.02;
                if (p.ref.current) {
                    p.ref.current.setNativeProps({
                        style: {
                            opacity: Math.max(0, p.opacity),
                            transform: [{ translateX: p.x - FRUIT_SIZE / 2 }, { translateY: p.y - FRUIT_SIZE / 2 }, { rotate: `${p.rotation}deg` }, { scaleX: p.side === 'left' ? 1 : -1 }],
                        },
                    });
                }
            });

            // Miss detection: non-bomb unsliced fruit fell off bottom
            if (!missInProgressRef.current) {
                const missedFruit = activeFruits.current.find(f => !f.isSliced && !f.isBomb && f.y > SCREEN_HEIGHT + 50);
                if (missedFruit) {
                    missInProgressRef.current = true;
                    triggerShake(8);
                    spawnFloatingText(missedFruit.x, SCREEN_HEIGHT - 100, 'MISS!', '#EF5350');
                    recordMissRef.current();
                }
            }

            const offScreenIds = activeFruits.current.filter(f => f.y > SCREEN_HEIGHT + 100).map(f => f.id);
            if (offScreenIds.length > 0) {
                activeFruits.current = activeFruits.current.filter(f => !offScreenIds.includes(f.id));
                setFruits(prev => prev.filter(f => !offScreenIds.includes(f.id)));
            }

            const expiredPieces = activePieces.current.filter(p => p.opacity <= 0 || p.y > SCREEN_HEIGHT + 100).map(p => p.id);
            if (expiredPieces.length > 0) {
                activePieces.current = activePieces.current.filter(p => !expiredPieces.includes(p.id));
                setPieces(prev => prev.filter(p => !expiredPieces.includes(p.id)));
            }

            frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, [gameState, isPaused, score, spawnFruit, countdown]);

    const panResponder = useRef(Platform.OS !== 'web' ? PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            gestureSliceCount.current = 0;
        },
        onPanResponderMove: (evt) => {
            const { pageX, pageY } = evt.nativeEvent;
            const now = Date.now();
            const dt = now - lastTouch.current.time;
            if (dt > 0) {
                lastTouch.current.vx = (pageX - lastTouch.current.x) / dt;
                lastTouch.current.vy = (pageY - lastTouch.current.y) / dt;
            }
            lastTouch.current.x = pageX; lastTouch.current.y = pageY; lastTouch.current.time = now;
            const tid = trailId.current++;
            setTrail(prev => [...prev, { x: pageX, y: pageY, id: tid }].slice(-12));
            activeFruits.current.forEach(f => {
                if (f.isSliced) return;
                const dx = f.x - pageX; const dy = f.y - pageY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitbox = f.isBomb ? BOMB_SIZE * 0.45 : FRUIT_SIZE * 0.75;
                if (dist < hitbox) handleSlice(f);
            });
        },
        onPanResponderRelease: () => setTrail([]),
    }) : { panHandlers: {} as any }).current;

    // Web gate — touch gestures not available on web
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.webGate}>
                    <Ionicons name="phone-portrait-outline" size={52} color={Colors.outline} />
                    <Text style={styles.webGateTitle}>Mobile Only</Text>
                    <Text style={styles.webGateBody}>
                        Syllabus Slasher uses touch gestures.{'\n'}Open the app on your phone to play.
                    </Text>
                    <TouchableOpacity style={styles.webGateBtn} onPress={onHome ?? (() => {})}>
                        <Text style={styles.webGateBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (gameState === 'result') {
        const genericResults: GenericResultItem[] = results.map(r => ({
            id: r.q.id, question: r.q.question, explanation: r.q.explanation,
            topic: r.q.topicTitle, isCorrect: r.correct, type: 'mcq',
            yourAnswer: r.chosen,
            correctAnswer: r.q.options.find(o => o.trim()[0]?.toUpperCase() === r.q.correct.trim()[0]?.toUpperCase()),
            rawQuestion: r.q,
        }));

        return (
            <GameResultScreen
                modeName="Syllabus Slasher"
                score={score}
                statsLabel="Lives Saved"
                statsValue={stats.correct}
                results={genericResults}
                onRestart={onRestart ?? (() => logic.resetGame())}
                onHome={onHome ?? (() => logic.resetGame())}
                personalMessage={lives <= 0
                    ? `The dojo was tough today, ${firstName}! Keep training.`
                    : `Masterful slashing, ${firstName}!`}
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeAnim }] }]} {...panResponder.panHandlers}>
                <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} resizeMode="cover">
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                </ImageBackground>

                {/* Juice splats layer */}
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' } as any]}>
                    {splats.map(s => {
                        const opacityAnim = splatAnimRefs.current.get(s.id);
                        if (!opacityAnim) return null;
                        return (
                            <Animated.View key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, opacity: opacityAnim }}>
                                {s.drops.map((drop, i) => (
                                    <View key={i} style={{
                                        position: 'absolute',
                                        left: drop.offsetX - drop.w / 2,
                                        top: drop.offsetY - drop.h / 2,
                                        width: drop.w,
                                        height: drop.h,
                                        borderRadius: drop.w / 2,
                                        backgroundColor: s.color,
                                        opacity: drop.alpha,
                                        transform: [{ rotate: `${drop.rotDeg}deg` }],
                                    }} />
                                ))}
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Pieces, fruits, trail */}
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' } as any]}>
                    {pieces.map(p => (
                        <View
                            key={p.id} ref={p.ref}
                            style={[styles.fruitPiece, {
                                backgroundColor: p.color,
                                borderBottomLeftRadius: p.side === 'left' ? 0 : FRUIT_SIZE,
                                borderBottomRightRadius: p.side === 'right' ? 0 : FRUIT_SIZE,
                                borderTopLeftRadius: p.side === 'right' ? 0 : FRUIT_SIZE,
                                borderTopRightRadius: p.side === 'left' ? 0 : FRUIT_SIZE,
                            }]}
                        />
                    ))}
                    {fruits.map(f => (
                        <View key={f.id} ref={f.ref} style={f.isBomb ? styles.bombContainer : styles.fruitContainer}>
                            <View style={[f.isBomb ? styles.bomb : styles.fruit, { backgroundColor: f.skin, borderWidth: 3, borderColor: 'rgba(0,0,0,0.25)' }]}>
                                {f.isBomb
                                    ? <View style={styles.bombInner}><Ionicons name="nuclear" size={32} color="#FF3D00" /><View style={styles.bombFuse} /></View>
                                    : <Text style={styles.fruitEmoji}>{f.emoji}</Text>
                                }
                            </View>
                            {!f.isBomb && <View style={styles.fruitShadow} />}
                        </View>
                    ))}

                    {/* Connected glow slash trail */}
                    {trail.length > 1 && trail.slice(0, -1).map((t, i) => {
                        const next = trail[i + 1];
                        const dx = next.x - t.x;
                        const dy = next.y - t.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len < 1) return null;
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        const midX = (t.x + next.x) / 2;
                        const midY = (t.y + next.y) / 2;
                        const opacity = ((i + 1) / trail.length) * 0.9;
                        const thickness = 2 + (i / trail.length) * 7;
                        return (
                            <View
                                key={t.id}
                                style={{
                                    position: 'absolute',
                                    left: midX - len / 2,
                                    top: midY - thickness / 2,
                                    width: len,
                                    height: thickness,
                                    backgroundColor: `rgba(255,255,255,${opacity})`,
                                    borderRadius: thickness / 2,
                                    transform: [{ rotate: `${angle}deg` }],
                                    shadowColor: '#fff',
                                    shadowRadius: 6,
                                    elevation: 5,
                                    zIndex: 10,
                                }}
                            />
                        );
                    })}
                </View>

                {countdown && (
                    <View style={[styles.fullOverlay, { pointerEvents: 'none' } as any]}>
                        <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                )}

                {criticals.map(c => (
                    <View key={c.id} style={[styles.criticalOverlay, { left: c.x - 60, top: c.y - 40 }, { pointerEvents: 'none' } as any]}>
                        <Text style={styles.criticalText}>CRITICAL!</Text>
                    </View>
                ))}

                {/* Floating score / MISS / multi-slice texts */}
                {floatingTexts.map(ft => {
                    const anims = floatingAnimRefs.current.get(ft.id);
                    if (!anims) return null;
                    return (
                        <Animated.Text
                            key={ft.id}
                            style={{
                                position: 'absolute',
                                left: ft.x - 70,
                                top: ft.y,
                                width: 140,
                                textAlign: 'center',
                                color: ft.color,
                                fontSize: ft.text.length > 6 ? 17 : 26,
                                fontWeight: '900',
                                fontStyle: 'italic',
                                ...Platform.select({ web: { textShadow: '0px 0px 5px #000' } as any, default: { textShadowColor: '#000', textShadowRadius: 5 } }),
                                opacity: anims.opacity,
                                transform: [{ translateY: anims.translateY }],
                                zIndex: 20,
                            }}
                        >
                            {ft.text}
                        </Animated.Text>
                    );
                })}

                <View style={[styles.hud, { pointerEvents: 'none' } as any]}>
                    <View style={styles.scoreBoard}>
                        <Text style={styles.scoreValueHud}>{score}</Text>
                    </View>
                    <View style={styles.livesBoard}>
                        {[...Array(3)].map((_, i) => (
                            <View key={i} style={styles.xMarkContainer}>
                                <Text style={[styles.xMark, (3 - lives) > i && styles.xMarkLost]}>X</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {combo > 1 && (
                    <View style={[styles.comboPopup, { pointerEvents: 'none' } as any]}>
                        <Text style={styles.comboText}>{combo}</Text>
                        <Text style={styles.comboSub}>COMBO!</Text>
                    </View>
                )}

                {feedbackMessage && (
                    <Animated.View style={[styles.fullOverlay, { opacity: feedbackOpacity, transform: [{ scale: feedbackScale }] }, { pointerEvents: 'none' } as any]}>
                        <View style={styles.arcadeFeedbackBox}>
                            <Text style={[styles.arcadeFeedbackText, { color: feedbackMessage.type === 'success' ? '#00C853' : '#FF1744' }]}>
                                {feedbackMessage.text}
                            </Text>
                            <View style={[styles.arcadeFeedbackLine, { backgroundColor: feedbackMessage.type === 'success' ? '#00C853' : '#FF1744' }]} />
                        </View>
                    </Animated.View>
                )}

                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: screenFlash, zIndex: 200 }, { pointerEvents: 'none' } as any]} />
            </Animated.View>

            {/* Question modal — outside shake so it stays stable */}
            {questionVisible && currentQuestion && (
                <View style={styles.overlay}>
                    <BlurView intensity={90} style={[styles.bombModal, { maxHeight: SCREEN_HEIGHT * 0.82 }]}>
                        <LinearGradient colors={['#880E4F', '#C62828']} style={styles.bombHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ fontSize: 22 }}>⚡</Text>
                                <Text style={styles.bombTitle}>SAVE YOUR LIFE?</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    if (isQuestionBookmarked(currentQuestion.id)) {
                                        removeQuestionBookmark(currentQuestion.id);
                                    } else {
                                        setBookmarkNote('');
                                        setNoteModalVisible(true);
                                    }
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={isQuestionBookmarked(currentQuestion.id) ? 'bookmark' : 'bookmark-outline'}
                                    size={24}
                                    color={isQuestionBookmarked(currentQuestion.id) ? '#FFD700' : 'rgba(255,255,255,0.7)'}
                                />
                            </TouchableOpacity>
                        </LinearGradient>
                        <ScrollView contentContainerStyle={styles.bombContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <UnifiedQuestion
                                type="mcq"
                                mode="interactive"
                                theme="arcade"
                                question={currentQuestion.question}
                                options={currentQuestion.options}
                                onAnswer={handleQuestionResponse}
                            />
                        </ScrollView>
                    </BlurView>
                </View>
            )}

            {/* Bookmark note modal */}
            <Modal visible={noteModalVisible} transparent animationType="fade" onRequestClose={() => setNoteModalVisible(false)}>
                <View style={styles.noteOverlay}>
                    <View style={styles.noteCard}>
                        <Text style={styles.noteTitle}>Save to Bookmarks</Text>
                        <Text style={styles.noteSubtitle}>Add an optional note for this question</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Type your note here..."
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            multiline
                            value={bookmarkNote}
                            onChangeText={setBookmarkNote}
                            maxLength={200}
                        />
                        <View style={styles.noteActions}>
                            <TouchableOpacity style={styles.noteCancelBtn} onPress={() => setNoteModalVisible(false)}>
                                <Text style={styles.noteCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.noteSaveBtn}
                                onPress={() => {
                                    if (currentQuestion) {
                                        addQuestionBookmark({
                                            ...currentQuestion,
                                            note: bookmarkNote,
                                            topicTitle: currentQuestion.topicTitle || 'General',
                                            psuName: selectedPSU?.name || '',
                                            branchName: selectedBranch?.name || '',
                                        });
                                    }
                                    setNoteModalVisible(false);
                                }}
                            >
                                <Text style={styles.noteSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webGate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.lg, backgroundColor: Colors.surface },
    webGateTitle: { ...Typography.h2, color: Colors.primary, textAlign: 'center' },
    webGateBody: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
    webGateBtn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: Radius.md, marginTop: Spacing.sm },
    webGateBtnText: { ...Typography.button, color: Colors.white },
    hud: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreBoard: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10 },
    scoreValueHud: { color: '#FFD700', fontSize: 48, fontWeight: '900', fontStyle: 'italic' },
    livesBoard: { flexDirection: 'row', gap: 8 },
    xMarkContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    xMark: { color: 'rgba(255,255,255,0.2)', fontSize: 36, fontWeight: '900' },
    xMarkLost: { color: '#FF1744' },
    fullOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
    countdownText: { color: '#FFD700', fontSize: 84, fontWeight: '900', fontStyle: 'italic', ...Platform.select({ web: { textShadow: '0px 0px 10px #000' } as any, default: { textShadowColor: '#000', textShadowRadius: 10 } }) },
    comboPopup: { position: 'absolute', top: '25%', alignSelf: 'center', alignItems: 'center' },
    comboText: { color: '#FFD700', fontSize: 110, fontWeight: '900', fontStyle: 'italic', ...Platform.select({ web: { textShadow: '4px 4px 10px rgba(0,0,0,0.5)' } as any, default: { textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 10 } }) },
    comboSub: { color: '#FFD700', fontSize: 24, fontWeight: '900', letterSpacing: 6, marginTop: -20 },
    criticalOverlay: { position: 'absolute', width: 120, height: 80, justifyContent: 'center', alignItems: 'center' },
    criticalText: { color: '#FFD700', fontSize: 24, fontWeight: '900', fontStyle: 'italic', ...Platform.select({ web: { textShadow: '0px 0px 5px #000' } as any, default: { textShadowColor: '#000', textShadowRadius: 5 } }) },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    bombModal: { width: '88%', borderRadius: 32, overflow: 'hidden' },
    bombHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between' },
    bombTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
    bombContent: { padding: 24, paddingBottom: 36 },
    noteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
    noteCard: { backgroundColor: '#1A0A0A', borderRadius: 20, padding: 24, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    noteTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    noteSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    noteInput: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, height: 100, textAlignVertical: 'top', color: '#FFF', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    noteActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    noteCancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
    noteCancelText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 15 },
    noteSaveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#FFD700' },
    noteSaveText: { color: '#1a0000', fontWeight: '900', fontSize: 15 },
    fruitContainer: { position: 'absolute', width: FRUIT_SIZE, height: FRUIT_SIZE },
    bombContainer: { position: 'absolute', width: BOMB_SIZE, height: BOMB_SIZE },
    fruit: { width: FRUIT_SIZE, height: FRUIT_SIZE, borderRadius: FRUIT_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
    fruitEmoji: { fontSize: 38 },
    bomb: { width: BOMB_SIZE, height: BOMB_SIZE, borderRadius: BOMB_SIZE / 2, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    bombInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    bombFuse: { position: 'absolute', top: -10, width: 4, height: 15, backgroundColor: '#555' },
    fruitShadow: { position: 'absolute', bottom: -10, width: '80%', height: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10 },
    fruitPiece: { position: 'absolute', width: FRUIT_SIZE, height: FRUIT_SIZE / 2 },
    arcadeFeedbackBox: { alignItems: 'center', padding: 20 },
    arcadeFeedbackText: { fontSize: 48, fontWeight: '900', textAlign: 'center', fontStyle: 'italic', letterSpacing: 1, ...Platform.select({ web: { textShadow: '0px 0px 15px #000' } as any, default: { textShadowColor: '#000', textShadowRadius: 15 } }) },
    arcadeFeedbackLine: { width: 150, height: 6, borderRadius: 3, marginTop: 10, ...Platform.select({ web: { boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' } as any, default: { shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.5 } }) },
});
