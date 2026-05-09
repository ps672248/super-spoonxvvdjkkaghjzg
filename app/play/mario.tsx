import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { generateQuestions, MCQQuestion } from '@/services/gemini';
import { getSyllabusTopics } from '@/config/syllabus';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { UnifiedQuestion } from '@/components/game/UnifiedQuestion';
import { GameResultScreen, GenericResultItem } from '@/components/game/GameResultScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GROUND_LEVEL = 100;
const MARIO_SIZE = 50;
const MARIO_X = 50;

type MarioMode = 'small' | 'super' | 'fire';
type EntityType = 'block' | 'pipe' | 'enemy' | 'brick';

interface GameEntity {
  id: string;
  x: number;
  type: EntityType;
  w: number;
  h: number;
  color: string;
}

interface Fireball {
  id: string;
  x: number;
  y: number;
}

type GameState = 'start' | 'loading' | 'playing' | 'question' | 'result';

export default function MarioScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch, selectedSections, selectedTopics } = useExamStore();
  const { geminiApiKey, geminiModel, fullName } = useSettingsStore();
  const { addQuestionBookmark, isQuestionBookmarked, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();

  const [gameState, setGameState] = useState<GameState>('start');
  const gameStateRef = useRef<GameState>('start');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [marioMode, setMarioMode] = useState<MarioMode>('small');
  const marioModeRef = useRef<MarioMode>('small');
  const [isStarman, setIsStarman] = useState(false);
  const isStarmanRef = useRef(false);
  const [starmanColor, setStarmanColor] = useState('#5c94fc');
  const [results, setResults] = useState<{ q: MCQQuestion; chosen: string | null; correct: boolean }[]>([]);
  const streakRef = useRef(0);
  const livesRef = useRef(3);

  // Mario Physics (Velocity-based)
  const [marioY, setMarioY] = useState(0);
  const velocityV = useRef(0);
  const gravity = 0.8;
  const jumpStrength = -15;
  const isGrounded = useRef(true);
  const marioYRef = useRef(0);
  const isInvincible = useRef(false);
  const [flicker, setFlicker] = useState(false);
  const invincibilityIntervalRef = useRef<any>(null);

  // Entities & Projectiles
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [fireballs, setFireballs] = useState<Fireball[]>([]);
  const speed = useRef(6);
  const gameLoopRef = useRef<number | null>(null);


  const psu = selectedPSU!;

  const { loadQuestions: fetchQuestions, loading: questionsLoading } = useGameQuestions();

  useEffect(() => {
    if (selectedPSU) loadQuestions();
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && !gameLoopRef.current) {
      gameLoop();
    }
  }, [gameState]);

  async function loadQuestions() {
    setGameState('loading');
    try {
      const qs = await fetchQuestions('mario', 10);
      setQuestions(qs as MCQQuestion[]);
      setGameState('start');
    } catch (e) {
      console.error(e);
      router.back();
    }
  }

  function startGame() {
    setGameState('playing');
    setScore(0);
    setCurrentIdx(0);
    setLevel(1);
    setStreak(0);
    streakRef.current = 0;
    setMarioMode('small');
    marioModeRef.current = 'small';
    setIsStarman(false);
    isStarmanRef.current = false;
    setLives(3);
    livesRef.current = 3;
    setResults([]);
    speed.current = 6;
    setEntities(generateLevelEntities());
    setFireballs([]);
    setMarioY(0);
    marioYRef.current = 0;
    velocityV.current = 0;
    isGrounded.current = true;
    gameLoop();
  }

  function generateLevelEntities(startX: number = SCREEN_WIDTH) {
    const patterns = ['stairs', 'enemies', 'bricks', 'pipes', 'single'];
    const newEntities: GameEntity[] = [];
    let currentX = startX;

    for (let i = 0; i < 5; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];

      if (pattern === 'stairs') {
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col <= row; col++) {
            newEntities.push({ id: Math.random().toString(), x: currentX + (col * 40), type: 'brick', w: 40, h: (row + 1) * 30, color: '#d35400' });
          }
        }
        currentX += 200;
      } else if (pattern === 'enemies') {
        for (let j = 0; j < 3; j++) {
          newEntities.push({ id: Math.random().toString(), x: currentX + (j * 120), type: 'enemy', w: 40, h: 40, color: '#c0392b' });
        }
        currentX += 500;
      } else if (pattern === 'bricks') {
        for (let j = 0; j < 5; j++) {
          newEntities.push({ id: Math.random().toString(), x: currentX + (j * 40), type: 'brick', w: 40, h: 80, color: '#8e44ad' });
        }
        currentX += 400;
      } else if (pattern === 'pipes') {
        newEntities.push({ id: Math.random().toString(), x: currentX, type: 'pipe', w: 60, h: 60, color: '#27ae60' });
        newEntities.push({ id: Math.random().toString(), x: currentX + 150, type: 'pipe', w: 60, h: 100, color: '#2ecc71' });
        currentX += 400;
      } else {
        newEntities.push({ id: Math.random().toString(), x: currentX, type: 'block', w: 40, h: 40, color: '#f39c12' });
        currentX += 300;
      }
      currentX += 200 + Math.random() * 200;
    }
    return newEntities;
  }

  const gameLoop = () => {
    if (gameStateRef.current !== 'playing') {
      gameLoopRef.current = null;
      return;
    }

    // Apply Gravity & Update Mario Y
    velocityV.current += gravity;
    let nextY = marioYRef.current + velocityV.current;

    // Ground floor check
    if (nextY >= 0) {
      nextY = 0;
      velocityV.current = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    marioYRef.current = nextY;
    setMarioY(nextY);

    // Move Fireballs
    let currentFireballs: Fireball[] = [];
    setFireballs(prev => {
      currentFireballs = prev.map(f => ({ ...f, x: f.x + 10 })).filter(f => f.x < SCREEN_WIDTH);
      return currentFireballs;
    });

    // Move Entities & Collision
    setEntities(prev => {
      let collided: string | boolean = false;
      let landedOn: number | null = null;
      let hitFireballIds: string[] = [];

      // 1. Move and check collisions
      const updated = prev.map(ent => {
        let moveX = isStarmanRef.current ? speed.current * 1.5 : speed.current;
        if (ent.type === 'enemy') moveX += 2;
        const newX = ent.x - moveX;

        let currentMarioSize = MARIO_SIZE;
        if (isStarmanRef.current) currentMarioSize = MARIO_SIZE * 1.5;
        else if (marioModeRef.current !== 'small') currentMarioSize = MARIO_SIZE * 1.25;

        const collisionX = MARIO_X + currentMarioSize - 10 > newX && MARIO_X + 10 < newX + ent.w;
        let isDead = false;

        if (collisionX) {
          const marioBottom = -marioYRef.current;
          const entityTop = ent.h;
          const prevMarioBottom = -(marioYRef.current - velocityV.current);

          if (prevMarioBottom >= entityTop - 10 && velocityV.current >= 0 && ent.type !== 'enemy') {
            landedOn = entityTop;
          } else if (marioBottom < entityTop) {
            if (isStarmanRef.current) {
              collided = 'destroy:' + ent.id;
            } else if (!isInvincible.current) {
              collided = ent.id;
            }
          }
        }

        // 2. Fireball collisions
        const hittingFireball = currentFireballs.find(f =>
          f.x + 10 > newX && f.x < newX + ent.w &&
          Math.abs(f.y - (-ent.h / 2)) < 50
        );

        if (hittingFireball && (ent.type === 'enemy' || ent.type === 'brick')) {
          hitFireballIds.push(hittingFireball.id);
          isDead = true;
          setScore(s => s + 100);
        }

        return isDead ? null : { ...ent, x: newX };
      }).filter((e): e is GameEntity => e !== null);

      if (hitFireballIds.length > 0) {
        setFireballs(fs => fs.filter(f => !hitFireballIds.includes(f.id)));
      }

      if (landedOn !== null) {
        marioYRef.current = -landedOn;
        setMarioY(-landedOn);
        velocityV.current = 0;
        isGrounded.current = true;
      }

      if (collided && gameStateRef.current === 'playing') {
        if (collided && typeof collided === 'string' && (collided as string).startsWith('destroy:')) {
          const id = (collided as string).split(':')[1];
          setScore(s => s + 500);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return updated.filter(e => e.id !== id);
        } else {
          handleCollision();
        }
      }

      const filtered = updated.filter(ent => ent.x > -200);
      if (filtered.length < 8) {
        const lastX = filtered.length > 0 ? filtered[filtered.length - 1].x : SCREEN_WIDTH;
        return [...filtered, ...generateLevelEntities(lastX + 400)];
      }
      return filtered;
    });

    if (isStarmanRef.current) {
      const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
      setStarmanColor(colors[Math.floor(Math.random() * colors.length)]);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  function handleCollision() {
    if (isStarmanRef.current) return;

    if (marioModeRef.current === 'fire') {
      setMarioMode('super');
      marioModeRef.current = 'super';
      triggerInvincibility();
    } else if (marioModeRef.current === 'super') {
      setMarioMode('small');
      marioModeRef.current = 'small';
      triggerInvincibility();
    } else if (marioModeRef.current === 'small') {
      setGameState('question');
      gameStateRef.current = 'question';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  function triggerInvincibility() {
    if (invincibilityIntervalRef.current) clearInterval(invincibilityIntervalRef.current);
    isInvincible.current = true;
    let count = 0;
    invincibilityIntervalRef.current = setInterval(() => {
      setFlicker(f => !f);
      count++;
      if (count > 30) { // Increased to 3s as requested
        if (invincibilityIntervalRef.current) clearInterval(invincibilityIntervalRef.current);
        isInvincible.current = false;
        setFlicker(false);
      }
    }, 100);
  }

  const jump = () => {
    if (isGrounded.current && gameState === 'playing') {
      velocityV.current = jumpStrength;
      isGrounded.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shootFireball = () => {
    if (marioMode !== 'fire' || gameState !== 'playing') return;
    const id = Math.random().toString();
    setFireballs(prev => [...prev, { id, x: MARIO_X + 20, y: marioY - 20 }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  function handleAnswer(option: string | Record<string, string> | null) {
    if (option && typeof option !== 'string') return;
    const q = questions[currentIdx];
    const isCorrect = option ? option.charAt(0) === q.correct : false;

    setResults(prev => [...prev, { q, chosen: option as string | null, correct: isCorrect }]);

    if (isCorrect) {
      const newStreak = streakRef.current + 1;
      setStreak(newStreak);
      streakRef.current = newStreak;
      setScore(s => s + 200);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (newStreak === 3 && marioModeRef.current === 'small') {
        setMarioMode('super');
        marioModeRef.current = 'super';
        triggerInvincibility();
      }
      if (newStreak === 5) {
        setMarioMode('fire');
        marioModeRef.current = 'fire';
        triggerInvincibility();
      }

      setGameState('playing');
      gameStateRef.current = 'playing';
      triggerInvincibility(); // Protect Mario when resuming from a hit-triggered question

      if (newStreak === 7) {
        setIsStarman(true);
        isStarmanRef.current = true;
        setTimeout(() => {
          setIsStarman(false);
          isStarmanRef.current = false;
          setStreak(0);
          streakRef.current = 0;
        }, 10000);
      }
    } else {
      setStreak(0);
      streakRef.current = 0;
      setMarioMode('small');
      marioModeRef.current = 'small';
      const nextLives = livesRef.current - 1;
      setLives(nextLives);
      livesRef.current = nextLives;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (nextLives <= 0) {
        setGameState('result');
        return;
      }
      setGameState('playing');
      gameStateRef.current = 'playing';
      triggerInvincibility();
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setGameState('result');
    } else {
      setCurrentIdx(nextIdx);
      if (nextIdx === Math.floor(questions.length / 2)) {
        setLevel(2);
        speed.current = 10;
      }
    }
  }


  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.loadingCenter} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#5c94fc" />
        <Text style={styles.loadingText}>Loading World 1-1...</Text>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const adaptedResults: GenericResultItem[] = results.map(r => ({
      id: r.q.id,
      question: r.q.question,
      explanation: r.q.explanation,
      topic: r.q.topicTitle,
      isCorrect: r.correct,
      type: 'mcq',
      yourAnswer: r.chosen || undefined,
      correctAnswer: r.q.options.find(o => o.startsWith(r.q.correct)),
      rawQuestion: {
        ...r.q,
        psuName: psu.name,
        branchName: selectedBranch?.name || 'General'
      }
    }));

    return (
      <GameResultScreen
        modeName="Academic Runner"
        score={score}
        statsLabel="LIVES LEFT"
        statsValue={lives}
        results={adaptedResults}
        onRestart={startGame}
        onHome={() => router.replace('/')}
        personalMessage={lives > 0 ? "You conquered the academic world!" : "A brave attempt! Study the bookmarks to come back stronger."}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: level === 2 ? '#2c3e50' : '#5c94fc' }]} edges={['top', 'bottom']}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.gameArea}
        onPress={jump}
        disabled={gameState !== 'playing'}
      >
        <View style={styles.sky}>
          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>WORLD</Text>
              <Text style={styles.statValue}>{level}-1</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{score.toString().padStart(6, '0')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>x{streak}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LIVES</Text>
              <View style={styles.livesRow}>
                {[...Array(3)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < lives ? "heart" : "heart-outline"}
                    size={18}
                    color={i < lives ? "#e74c3c" : "rgba(255,255,255,0.4)"}
                  />
                ))}
              </View>
            </View>
          </View>

          <Ionicons name="cloud" size={40} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: 50, left: 100 }} />
          <Ionicons name="cloud" size={60} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: 80, right: 50 }} />
          {level === 2 && (
            <Ionicons name="moon" size={40} color="#f1c40f" style={{ position: 'absolute', top: 40, right: 120 }} />
          )}
        </View>

        {/* Mario */}
        {/* Mario Character */}
        <View
          style={[
            styles.mario,
            {
              bottom: GROUND_LEVEL - marioY,
              transform: [{ scale: isStarman ? 1.5 : (marioMode === 'small' ? 1 : 1.25) }],
              opacity: flicker ? 0.3 : 1
            }
          ]}
        >
          {/* Detailed CSS Mario */}
          <View style={[styles.marioSprite, isStarman && { backgroundColor: starmanColor, borderRadius: 10 }]}>
            {/* Hat */}
            <View style={[
              styles.spriteHat,
              { backgroundColor: isStarman ? starmanColor : (marioMode === 'fire' ? '#C41E3A' : (marioMode === 'super' ? '#FFD700' : '#e74c3c')) },
              marioMode === 'fire' ? { height: 18, top: -8 } : (marioMode === 'super' ? { height: 15, top: -5 } : {})
            ]}>
              <View style={styles.hatBrim} />
            </View>

            {/* Face Area */}
            <View style={styles.spriteFace}>
              <View style={styles.spriteEye} />
              <View style={styles.spriteMustache} />
            </View>

            {/* Body Area */}
            <View style={[styles.spriteBody, { backgroundColor: isStarman ? starmanColor : '#e74c3c' }]}>
              {/* Overalls */}
              <View style={[styles.overalls, { backgroundColor: isStarman ? '#FFF' : '#2980b9' }]}>
                <View style={styles.overallButton} />
                <View style={[styles.overallButton, { right: 4 }]} />
              </View>
            </View>

            {/* Feet */}
            <View style={styles.spriteFeet}>
              <View style={styles.spriteShoe} />
              <View style={[styles.spriteShoe, { right: 0 }]} />
            </View>

            {isStarman && <Text style={styles.starText}>✨</Text>}
          </View>
        </View>

        {/* Fireballs */}
        {fireballs.map(f => (
          <View key={f.id} style={[styles.fireball, { left: f.x, bottom: GROUND_LEVEL - f.y + 20 }]}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </View>
        ))}

        {/* Entities */}
        {entities.map(ent => (
          <View key={ent.id} style={[styles.entity, { left: ent.x, width: ent.w, height: ent.h, backgroundColor: ent.color }]}>
            {ent.type === 'block' && <Text style={styles.blockText}>?</Text>}
            {ent.type === 'enemy' && <Text style={styles.blockText}>👾</Text>}
            {ent.type === 'brick' && <View style={styles.brickTexture} />}
            {ent.type === 'pipe' && <View style={{ width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.1)', position: 'absolute', top: 0 }} />}
          </View>
        ))}

        {/* Ground */}
        <View style={[styles.ground, { backgroundColor: level === 2 ? '#34495e' : '#8a4b08' }]}>
          <View style={[styles.grass, { backgroundColor: level === 2 ? '#2ecc71' : '#4aba10' }]} />
        </View>
      </TouchableOpacity>

      {/* Overlays */}
      {gameState === 'start' && (
        <View style={styles.overlay}>
          <Text style={styles.title}>ACADEMIC RUNNER PRO</Text>
          <Text style={styles.subtitle}>Streak 3: Super 🍄 • Streak 5: Fire 🔥 • Streak 7: STARMAN 🌟</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>START JOURNEY</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'question' && questions[currentIdx] && (
        <View style={styles.questionOverlay}>
          <View style={[styles.questionCard, { backgroundColor: '#1A237E' }]}>
            <View style={styles.questionHeader}>
              <View>
                <Text style={[styles.questionScoreLabel, { color: '#FFF', opacity: 0.8 }]}>ADVENTURE SCORE</Text>
                <Text style={[styles.questionScoreValue, { color: Colors.gold }]}>{score.toString().padStart(6, '0')}</Text>
              </View>
              <Text style={styles.questionTextTitle}>LIFE SAVER! ❤️</Text>
              <View style={{ width: 26 }} />
            </View>
            
            <UnifiedQuestion
              type="mcq"
              mode="interactive"
              theme="arcade"
              question={questions[currentIdx].question}
              options={questions[currentIdx].options}
              onAnswer={handleAnswer}
              isBookmarked={isQuestionBookmarked(questions[currentIdx].id)}
              bookmarkNote={questionBookmarks.find(b => b.id === questions[currentIdx].id)?.note}
              onToggleBookmark={(note) => {
                if (isQuestionBookmarked(questions[currentIdx].id)) {
                  removeQuestionBookmark(questions[currentIdx].id);
                } else {
                  addQuestionBookmark({
                    ...questions[currentIdx],
                    note: note || '',
                    topicTitle: questions[currentIdx].topicTitle || 'General',
                    psuName: selectedPSU?.name || '',
                    branchName: selectedBranch?.name || ''
                  });
                }
              }}
            />
          </View>
        </View>
      )}

      {gameState === 'playing' && (
        <View style={styles.controls}>
          <View style={{ width: 80 }} />
          {marioMode === 'fire' && (
            <TouchableOpacity style={styles.fireBtn} onPress={shootFireball} activeOpacity={0.7}>
              <Ionicons name="flame" size={40} color="#FFF" />
              <Text style={styles.fireLabel}>FIRE!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#5c94fc' },
  loadingCenter: { flex: 1, backgroundColor: '#5c94fc', alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.h3, color: '#FFF', marginTop: Spacing.xl },
  gameArea: { flex: 1, overflow: 'hidden' },
  sky: { flex: 1, padding: Spacing.lg },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { color: '#FFF', fontSize: 14, fontFamily: 'Inter_700Bold' },
  statValue: { color: '#FFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  mario: { position: 'absolute', left: 50, bottom: GROUND_LEVEL, width: MARIO_SIZE, height: MARIO_SIZE + 10, alignItems: 'center', zIndex: 10 },
  marioSprite: { width: 34, height: 44, alignItems: 'center' },
  spriteHat: { width: 30, height: 12, backgroundColor: '#e74c3c', borderTopLeftRadius: 6, borderTopRightRadius: 6, zIndex: 5, position: 'relative' },
  hatBrim: { position: 'absolute', bottom: 0, left: -4, width: 38, height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2 },
  spriteFace: { width: 26, height: 16, backgroundColor: '#ffdbac', position: 'relative', zIndex: 4 },
  spriteEye: { position: 'absolute', top: 3, right: 6, width: 4, height: 6, backgroundColor: '#333', borderRadius: 2 },
  spriteMustache: { position: 'absolute', bottom: 1, right: 2, width: 14, height: 5, backgroundColor: '#4b3621', borderRadius: 2 },
  spriteBody: { width: 30, height: 16, backgroundColor: '#e74c3c', position: 'relative', zIndex: 3 },
  overalls: { position: 'absolute', bottom: 0, width: '100%', height: 10, backgroundColor: '#2980b9', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  overallButton: { position: 'absolute', top: 2, left: 4, width: 4, height: 4, backgroundColor: '#f1c40f', borderRadius: 2 },
  spriteFeet: { width: 34, height: 6, flexDirection: 'row', position: 'relative' },
  spriteShoe: { width: 14, height: 8, backgroundColor: '#5d4037', borderRadius: 3, position: 'absolute', bottom: -2 },
  starText: { position: 'absolute', top: -20, fontSize: 16 },
  entity: { position: 'absolute', bottom: GROUND_LEVEL, alignItems: 'center', justifyContent: 'center', borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  brickTexture: { width: '100%', height: '100%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  fireball: { position: 'absolute', width: 30, height: 30, zIndex: 5 },
  blockText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  ground: { height: GROUND_LEVEL, backgroundColor: '#8a4b08' },
  grass: { height: 20, backgroundColor: '#4aba10' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, padding: Spacing.xl, zIndex: 100 },
  title: { fontSize: 32, color: '#FFF', fontFamily: 'Inter_700Bold', letterSpacing: 2, textAlign: 'center' },
  subtitle: { ...Typography.bodyMd, color: '#FFF', textAlign: 'center', opacity: 0.8 },
  livesRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  startBtn: { backgroundColor: '#e74c3c', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderRadius: 8, borderWidth: 3, borderColor: '#FFF', ...Shadows.button },
  startBtnText: { color: '#FFF', fontSize: 20, fontFamily: 'Inter_700Bold' },
  controls: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jumpBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  fireBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e67e22', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f1c40f', ...Shadows.button },
  fireLabel: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_900Black', marginTop: -5 },
  questionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', padding: Spacing.xl, justifyContent: 'center' },
  questionCard: { backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.lg, ...Shadows.cardHover },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  questionScoreLabel: { color: Colors.primary, fontSize: 10, fontFamily: 'Inter_700Bold' },
  questionScoreValue: { color: Colors.secondary, fontSize: 16, fontFamily: 'Inter_900Black' },
  questionTextTitle: { fontSize: 20, color: '#e74c3c', fontFamily: 'Inter_900Black' },
  questionText: { ...Typography.bodyLg, color: '#000', lineHeight: 26 },
  options: { gap: Spacing.md },
  optionBtn: { backgroundColor: '#5c94fc', padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', ...Shadows.button },
  optionText: { color: '#FFF', fontFamily: 'Inter_700Bold' },

  // Modal Styles (still used for interactive bookmarking)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg, ...Shadows.cardHover },
  modalTitle: { ...Typography.h2, color: '#2c3e50' },
  modalSubtitle: { ...Typography.bodyMd, color: '#7f8c8d', marginTop: -Spacing.sm },
  noteInput: { backgroundColor: '#F9FBFF', borderRadius: Radius.md, padding: Spacing.lg, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E0E6ED', ...Typography.bodyMd, color: '#2c3e50' },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: { flex: 1, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#F0F4FF' },
  modalCancelText: { ...Typography.bodyMd, color: '#5c94fc', fontWeight: 'bold' },
  modalSaveBtn: { flex: 2, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#5c94fc', ...Shadows.button },
  modalSaveText: { ...Typography.bodyMd, color: '#FFF', fontWeight: 'bold' },
});
