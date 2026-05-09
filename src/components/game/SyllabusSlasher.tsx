import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, PanResponder, StatusBar, ImageBackground, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SlasherLogic } from '../../hooks/useSyllabusSlasherLogic';
import { Colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useExamStore } from '../../stores/examStore';
import { GameResultScreen, GenericResultItem } from './GameResultScreen';
import { UnifiedQuestion } from './UnifiedQuestion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Constants ---
const GRAVITY = 0.38;
const SPAWN_Y = SCREEN_HEIGHT + 60;
const FRUIT_SIZE = 75;
const BOMB_SIZE = 65;
const MAX_SPLATS = 15;

// --- Types ---
interface Fruit2D {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rv: number;
    color: string;
    isBomb: boolean;
    isSliced: boolean;
    type: string;
    icon: any;
    ref: React.RefObject<View | null>;
}

interface Piece2D {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rv: number;
    color: string;
    side: 'left' | 'right';
    opacity: number;
    ref: React.RefObject<View | null>;
}

interface Splat2D {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    opacity: number;
}

export const SyllabusSlasher = ({ logic }: { logic: SlasherLogic }) => {
    const { gameState, score, lives, combo, questionVisible, currentQuestion, recordSlice, handleQuestionResponse, isPaused, results, stats, feedbackMessage } = logic;
    const { fullName } = useSettingsStore();
    const { addQuestionBookmark, removeQuestionBookmark, isQuestionBookmarked, questionBookmarks } = useBookmarkStore();
    const { selectedPSU, selectedBranch } = useExamStore();
    const firstName = fullName.split(' ')[0];

    const [fruits, setFruits] = useState<Fruit2D[]>([]);
    const [pieces, setPieces] = useState<Piece2D[]>([]);
    const [splats, setSplats] = useState<Splat2D[]>([]);
    const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);
    const [criticals, setCriticals] = useState<{ id: number, x: number, y: number }[]>([]);
    const [countdown, setCountdown] = useState<string | null>(null);

    const activeFruits = useRef<Fruit2D[]>([]);
    const activePieces = useRef<Piece2D[]>([]);
    const lastTouch = useRef({ x: 0, y: 0, vx: 0, vy: 0, time: 0 });

    const fruitId = useRef(0);
    const pieceId = useRef(0);
    const splatId = useRef(0);
    const trailId = useRef(0);
    const criticalId = useRef(0);
    const lastSpawnTime = useRef(0);
    const hasStarted = useRef(false);

    // Animation values for feedback
    const feedbackScale = useRef(new Animated.Value(0.5)).current;
    const feedbackOpacity = useRef(new Animated.Value(0)).current;
    const screenFlash = useRef(new Animated.Value(0)).current;

    const recordSliceRef = useRef(recordSlice);
    useEffect(() => {
        recordSliceRef.current = recordSlice;
    }, [recordSlice]);

    const backgroundImage = { uri: 'file:///C:/Users/ps671/.gemini/antigravity/brain/aa890da7-c6bd-48c6-8d6c-af790b83b3b8/fruit_ninja_wooden_background_1778302764827.png' };

    useEffect(() => {
        if (feedbackMessage) {
            feedbackScale.setValue(0.5);
            feedbackOpacity.setValue(0);

            Animated.parallel([
                Animated.spring(feedbackScale, { toValue: 1, friction: 4, useNativeDriver: true }),
                Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();

            if (feedbackMessage.type === 'error') {
                Animated.sequence([
                    Animated.timing(screenFlash, { toValue: 0.8, duration: 50, useNativeDriver: true }),
                    Animated.timing(screenFlash, { toValue: 0, duration: 400, useNativeDriver: true })
                ]).start();
            }
        } else {
            Animated.timing(feedbackOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        }
    }, [feedbackMessage]);

    const spawnFruit = useCallback(() => {
        const icons: Record<string, any> = { apple: 'nutrition', watermelon: 'leaf', orange: 'flask' };
        const colors: Record<string, string> = { apple: '#FF1744', watermelon: '#00C853', orange: '#FFAB00' };
        const typeKeys = ['apple', 'watermelon', 'orange'];

        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const isBomb = Math.random() < 0.25;
        const xPos = 80 + Math.random() * (SCREEN_WIDTH - 160);

        const newFruit: Fruit2D = {
            id: fruitId.current++,
            x: xPos,
            y: SPAWN_Y,
            vx: (SCREEN_WIDTH / 2 - xPos) * 0.025 + (Math.random() - 0.5) * 5,
            vy: -15 - Math.random() * 7,
            rotation: Math.random() * 360,
            rv: (Math.random() - 0.5) * 15,
            color: isBomb ? '#111' : colors[type],
            isBomb,
            isSliced: false,
            type,
            icon: icons[type],
            ref: React.createRef<View | null>()
        };

        activeFruits.current.push(newFruit);
        setFruits(prev => [...prev, newFruit]);
    }, []);

    const spawnPieces = (fruit: Fruit2D) => {
        const sliceVx = lastTouch.current.vx * 0.5;
        const sliceVy = lastTouch.current.vy * 0.5;

        const createPiece = (side: 'left' | 'right'): Piece2D => ({
            id: pieceId.current++,
            x: fruit.x,
            y: fruit.y,
            vx: fruit.vx + (side === 'left' ? -5 : 5) + sliceVx,
            vy: fruit.vy - 4 + sliceVy,
            rotation: fruit.rotation,
            rv: fruit.rv * 1.8 + (side === 'left' ? -5 : 5),
            color: fruit.color,
            side,
            opacity: 1,
            ref: React.createRef<View | null>()
        });

        const p1 = createPiece('left');
        const p2 = createPiece('right');
        activePieces.current.push(p1, p2);
        setPieces(prev => [...prev, p1, p2]);
    };

    const addSplat = (x: number, y: number, color: string, vx: number, vy: number) => {
        const id = splatId.current++;
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);
        const newSplat: Splat2D = {
            id, x, y, color, rotation: angle,
            scale: Math.min(2.5, Math.sqrt(vx * vx + vy * vy) * 0.5 + 1),
            opacity: 0.7
        };
        setSplats(prev => [...prev, newSplat].slice(-MAX_SPLATS));
        setTimeout(() => setSplats(prev => prev.filter(s => s.id !== id)), 3000);
    };

    const handleSlice = (fruit: Fruit2D) => {
        if (fruit.isSliced) return;
        fruit.isSliced = true;
        activeFruits.current = activeFruits.current.filter(f => f.id !== fruit.id);
        setFruits(prev => prev.filter(f => f.id !== fruit.id));

        const result = recordSliceRef.current(fruit.isBomb) as any;
        if (!fruit.isBomb) {
            spawnPieces(fruit);
            addSplat(fruit.x, fruit.y, fruit.color, lastTouch.current.vx, lastTouch.current.vy);
        }

        if (result?.isCritical) {
            const cid = criticalId.current++;
            setCriticals(prev => [...prev, { id: cid, x: fruit.x, y: fruit.y }]);
            setTimeout(() => setCriticals(prev => prev.filter(c => c.id !== cid)), 800);
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
                        style: { transform: [{ translateX: f.x - size / 2 }, { translateY: f.y - size / 2 }, { rotate: `${f.rotation}deg` }] }
                    });
                }
            });

            activePieces.current.forEach(p => {
                p.vy += GRAVITY * 1.3; p.x += p.vx; p.y += p.vy; p.rotation += p.rv; p.opacity -= 0.02;
                if (p.ref.current) {
                    p.ref.current.setNativeProps({
                        style: {
                            opacity: Math.max(0, p.opacity),
                            transform: [{ translateX: p.x - FRUIT_SIZE / 2 }, { translateY: p.y - FRUIT_SIZE / 2 }, { rotate: `${p.rotation}deg` }, { scaleX: p.side === 'left' ? 1 : -1 }]
                        }
                    });
                }
            });

            const offScreenFruit = activeFruits.current.filter(f => f.y > SCREEN_HEIGHT + 100).map(f => f.id);
            if (offScreenFruit.length > 0) {
                activeFruits.current = activeFruits.current.filter(f => !offScreenFruit.includes(f.id));
                setFruits(prev => prev.filter(f => !offScreenFruit.includes(f.id)));
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

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (evt) => {
            if (isPaused || gameState !== 'playing' || countdown) return;
            const { pageX, pageY } = evt.nativeEvent;
            const now = Date.now();
            const dt = now - lastTouch.current.time;
            if (dt > 0) {
                lastTouch.current.vx = (pageX - lastTouch.current.x) / dt;
                lastTouch.current.vy = (pageY - lastTouch.current.y) / dt;
            }
            lastTouch.current.x = pageX; lastTouch.current.y = pageY; lastTouch.current.time = now;
            const tid = trailId.current++;
            setTrail(prev => [...prev, { x: pageX, y: pageY, id: tid }].slice(-10));
            activeFruits.current.forEach(f => {
                if (f.isSliced) return;
                const dx = f.x - pageX; const dy = f.y - pageY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitbox = f.isBomb ? BOMB_SIZE * 0.45 : FRUIT_SIZE * 0.75;
                if (dist < hitbox) handleSlice(f);
            });
        },
        onPanResponderRelease: () => setTrail([])
    })).current;

    if (gameState === 'result') {
        const genericResults: GenericResultItem[] = results.map(r => ({
            id: r.q.id,
            question: r.q.question,
            explanation: r.q.explanation,
            topic: r.q.topicTitle,
            isCorrect: r.correct,
            type: 'mcq',
            yourAnswer: r.chosen,
            correctAnswer: r.q.options.find(o => o.trim().startsWith(r.q.correct.toUpperCase())),
            rawQuestion: r.q
        }));

        return (
            <GameResultScreen
                modeName="Syllabus Slasher"
                score={score}
                statsLabel="Bombs Defused"
                statsValue={stats.correct}
                results={genericResults}
                onRestart={() => logic.resetGame()}
                onHome={() => logic.resetGame()} // Or navigate away
                personalMessage={lives <= 0 ? `The dojo was tough today, ${firstName}! Keep training.` : `Masterful slashing, ${firstName}!`}
            />
        );
    }

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <StatusBar hidden />
            <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} resizeMode="cover">
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            </ImageBackground>

            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {splats.map(s => (
                    <View key={s.id} style={[styles.splatGroup, { left: s.x - 50, top: s.y - 50, opacity: s.opacity, transform: [{ rotate: `${s.rotation}deg` }, { scale: s.scale }] }]}>
                        {[...Array(5)].map((_, i) => (
                            <View key={i} style={[styles.splatBlob, { backgroundColor: s.color, width: 40 + Math.random() * 40, height: 40 + Math.random() * 40, left: (Math.random() - 0.5) * 40, top: (Math.random() - 0.5) * 40, borderRadius: 20 + Math.random() * 20 }]} />
                        ))}
                    </View>
                ))}
            </View>

            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {pieces.map(p => (
                    <View key={p.id} ref={p.ref} style={[styles.fruitPiece, { backgroundColor: p.color, borderBottomLeftRadius: p.side === 'left' ? 0 : FRUIT_SIZE, borderBottomRightRadius: p.side === 'right' ? 0 : FRUIT_SIZE, borderTopLeftRadius: p.side === 'right' ? 0 : FRUIT_SIZE, borderTopRightRadius: p.side === 'left' ? 0 : FRUIT_SIZE }]} />
                ))}
                {fruits.map(f => (
                    <View key={f.id} ref={f.ref} style={f.isBomb ? styles.bombContainer : styles.fruitContainer}>
                        <View style={[f.isBomb ? styles.bomb : styles.fruit, { backgroundColor: f.color }]}>
                            {f.isBomb ? <View style={styles.bombInner}><Ionicons name="nuclear" size={32} color="#FF3D00" /><View style={styles.bombFuse} /></View> : <Ionicons name={f.icon} size={36} color="#FFF" />}
                        </View>
                        {!f.isBomb && <View style={styles.fruitShadow} />}
                    </View>
                ))}
                {trail.map((t, i) => (
                    <View key={t.id} style={[styles.trailNode, { left: t.x - (i * 0.8), top: t.y - (i * 0.8), width: i * 1.8, height: i * 1.8, borderRadius: i, opacity: i / 10, backgroundColor: i > 7 ? '#FFF' : 'rgba(255,255,255,0.7)', zIndex: 10 }]} />
                ))}
            </View>

            {countdown && <View style={styles.fullOverlay} pointerEvents="none"><Text style={styles.countdownText}>{countdown}</Text></View>}

            {criticals.map(c => (
                <View key={c.id} style={[styles.criticalOverlay, { left: c.x - 60, top: c.y - 40 }]} pointerEvents="none">
                    <Text style={styles.criticalText}>CRITICAL!</Text>
                </View>
            ))}

            <View style={styles.hud} pointerEvents="none">
                <View style={styles.scoreBoard}><Text style={styles.scoreValueHud}>{score}</Text></View>
                <View style={styles.livesBoard}>{[...Array(3)].map((_, i) => (<View key={i} style={styles.xMarkContainer}><Text style={[styles.xMark, (3 - lives) > i && styles.xMarkLost]}>X</Text></View>))}</View>
            </View>

            {combo > 1 && (
                <View style={styles.comboPopup} pointerEvents="none">
                    <Text style={styles.comboText}>{combo}</Text>
                    <Text style={styles.comboSub}>COMBO!</Text>
                </View>
            )}

            {feedbackMessage && (
                <Animated.View style={[styles.fullOverlay, { opacity: feedbackOpacity, transform: [{ scale: feedbackScale }] }]} pointerEvents="none">
                    <View style={styles.arcadeFeedbackBox}>
                        <Text style={[styles.arcadeFeedbackText, { color: feedbackMessage.type === 'success' ? '#00C853' : '#FF1744' }]}>{feedbackMessage.text}</Text>
                        <View style={[styles.arcadeFeedbackLine, { backgroundColor: feedbackMessage.type === 'success' ? '#00C853' : '#FF1744' }]} />
                    </View>
                </Animated.View>
            )}

            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: screenFlash, zIndex: 200 }]} pointerEvents="none" />

            {questionVisible && currentQuestion && (
                <View style={styles.overlay}>
                    <BlurView intensity={90} style={styles.bombModal}>
                        <LinearGradient colors={['#FF3D00', '#C62828']} style={styles.bombHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name="nuclear" size={24} color="#FFF" /><Text style={styles.bombTitle}>Diffuse Bomb!</Text></View>
                            <View style={{ width: 24 }} />
                        </LinearGradient>
                        <View style={styles.bombContent}>
                             <UnifiedQuestion
                                type="mcq"
                                mode="interactive"
                                theme="arcade"
                                question={currentQuestion.question}
                                options={currentQuestion.options}
                                onAnswer={handleQuestionResponse}
                                isBookmarked={isQuestionBookmarked(currentQuestion.id)}
                                bookmarkNote={questionBookmarks.find(b => b.id === currentQuestion.id)?.note}
                                onToggleBookmark={(note) => {
                                    if (isQuestionBookmarked(currentQuestion.id)) {
                                        removeQuestionBookmark(currentQuestion.id);
                                    } else {
                                        addQuestionBookmark({
                                            ...currentQuestion,
                                            note: note || '',
                                            topicTitle: currentQuestion.topicTitle || 'General',
                                            psuName: selectedPSU?.name || '',
                                            branchName: selectedBranch?.name || ''
                                        });
                                    }
                                }}
                            />
                        </View>
                    </BlurView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    hud: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreBoard: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10 },
    scoreValueHud: { color: '#FFD700', fontSize: 48, fontWeight: '900', fontStyle: 'italic' },
    livesBoard: { flexDirection: 'row', gap: 8 },
    xMarkContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    xMark: { color: 'rgba(255,255,255,0.2)', fontSize: 36, fontWeight: '900' },
    xMarkLost: { color: '#FF1744' },
    fullOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
    countdownText: { color: '#FFD700', fontSize: 84, fontWeight: '900', fontStyle: 'italic', textShadowColor: '#000', textShadowRadius: 10 },
    comboPopup: { position: 'absolute', top: '25%', alignSelf: 'center', alignItems: 'center' },
    comboText: { color: '#FFD700', fontSize: 110, fontWeight: '900', fontStyle: 'italic', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 10 },
    comboSub: { color: '#FFD700', fontSize: 24, fontWeight: '900', letterSpacing: 6, marginTop: -20 },
    criticalOverlay: { position: 'absolute', width: 120, height: 80, justifyContent: 'center', alignItems: 'center' },
    criticalText: { color: '#FFD700', fontSize: 24, fontWeight: '900', fontStyle: 'italic', textShadowColor: '#000', textShadowRadius: 5 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    bombModal: { width: '88%', borderRadius: 32, overflow: 'hidden' },
    bombHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between' },
    bombTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
    bombContent: { padding: 24 },
    bombQuestion: { color: '#FFF', fontSize: 19, fontWeight: '700', marginBottom: 24, lineHeight: 28 },
    bombOption: { backgroundColor: 'rgba(226, 226, 226, 0.08)', padding: 18, borderRadius: 16, marginBottom: 12 },
    bombOptionText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
    fruitContainer: { position: 'absolute', width: FRUIT_SIZE, height: FRUIT_SIZE },
    bombContainer: { position: 'absolute', width: BOMB_SIZE, height: BOMB_SIZE },
    fruit: { width: FRUIT_SIZE, height: FRUIT_SIZE, borderRadius: FRUIT_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
    bomb: { width: BOMB_SIZE, height: BOMB_SIZE, borderRadius: BOMB_SIZE / 2, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    bombInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    bombFuse: { position: 'absolute', top: -10, width: 4, height: 15, backgroundColor: '#555' },
    fruitShadow: { position: 'absolute', bottom: -10, width: '80%', height: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10 },
    fruitPiece: { position: 'absolute', width: FRUIT_SIZE, height: FRUIT_SIZE / 2 },
    splatGroup: { position: 'absolute', width: 100, height: 100 },
    splatBlob: { position: 'absolute', opacity: 0.6 },
    trailNode: { position: 'absolute' },
    arcadeFeedbackBox: { alignItems: 'center', padding: 20 },
    arcadeFeedbackText: { fontSize: 48, fontWeight: '900', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 15, fontStyle: 'italic', letterSpacing: 1 },
    arcadeFeedbackLine: { width: 150, height: 6, borderRadius: 3, marginTop: 10, shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.5 }
});
