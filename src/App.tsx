import { useEffect, useMemo, useState } from 'react';
import {
  ComponentId,
  EDUCATIONAL_COMPONENTS,
  RACK_INVENTORY,
  RackEquipmentId,
  TECHNICAL_RACK_INVENTORY,
  TechnicalRackEquipmentId,
} from './data/componentsData';
import {
  PlacedRackItem,
  placeRackItem,
  placeTechnicalRackItem,
  RackValidationSummary,
  removeRackItem,
  removeTechnicalRackItem,
  TechnicalPlacedRackItem,
  validateRackAssembly,
  validateTechnicalRackAssembly,
} from './logic/rackValidation';
import {
  CableConnection,
  TechnicalCableConnection,
  TOTAL_EXPECTED_CABLES,
  TOTAL_TECHNICAL_EXPECTED_CABLES,
} from './logic/networkValidation';
import {
  calculatePhase1Score,
  calculatePhase2Score,
  calculatePhase3Score,
  computeTotalGameScore,
  DifficultyLevel,
  getPhaseTimeLimits,
  LeaderboardEntry,
  PhaseTimingMap,
  sanitizeNick,
} from './logic/gamification';
import { getTutorialSteps } from './logic/tutorialSteps';
import { HeaderBar, PhaseId } from './components/HeaderBar';
import { GameHudBar } from './components/GameHudBar';
import { Phase1Explore } from './components/Phase1Explore';
import { Phase2RackAssembly } from './components/Phase2RackAssembly';
import { Phase3NetworkWiring } from './components/Phase3NetworkWiring';
import { HelpModal } from './components/HelpModal';
import { InfoModal } from './components/InfoModal';
import { NickEntryModal } from './components/NickEntryModal';
import { VictoryModal } from './components/VictoryModal';
import { GuidedTutorialOverlay } from './components/GuidedTutorialOverlay';

const TUTORIAL_STORAGE_KEY = 'rack19_seen_tutorials_v1';
const LEADERBOARD_STORAGE_KEY = 'rack19_leaderboard_v1';

function loadSeenTutorials(): Record<PhaseId, boolean> {
  try {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1'
    ) {
      return { 1: true, 2: true, 3: true };
    }
    const raw = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return { 1: false, 2: false, 3: false };
    const parsed = JSON.parse(raw) as Partial<Record<PhaseId, boolean>>;
    return {
      1: Boolean(parsed[1]),
      2: Boolean(parsed[2]),
      3: Boolean(parsed[3]),
    };
  } catch {
    return { 1: false, 2: false, 3: false };
  }
}

function loadInitialNick(): string {
  try {
    if (typeof window !== 'undefined') {
      const paramNick = new URLSearchParams(window.location.search).get('nick');
      if (paramNick) {
        const cleaned = sanitizeNick(paramNick);
        if (cleaned.length >= 2) return cleaned;
      }
    }
  } catch {
    // Ignore URL errors
  }
  return '';
}

function loadInitialDifficulty(): DifficultyLevel {
  try {
    if (typeof window !== 'undefined') {
      const level = new URLSearchParams(window.location.search).get('level');
      if (level === 'tecnico') return 'tecnico';
    }
  } catch {
    // Ignore URL errors
  }
  return 'principiante';
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    loadInitialDifficulty
  );
  const [activePhase, setActivePhase] = useState<PhaseId>(1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Gamification state: nick, per-phase countdown timers, accuracy penalties, victory modal & leaderboard
  const [playerNick, setPlayerNick] = useState<string>(loadInitialNick);
  const [nickModalOpen, setNickModalOpen] = useState<boolean>(
    () => loadInitialNick() === ''
  );
  const [phaseTimers, setPhaseTimers] = useState<PhaseTimingMap>(() =>
    getPhaseTimeLimits(loadInitialDifficulty())
  );
  const [phase2FailedChecks, setPhase2FailedChecks] = useState(0);
  const [phase3FailedAttempts, setPhase3FailedAttempts] = useState(0);
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const [victoryRecordedForRun, setVictoryRecordedForRun] = useState(false);
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(loadLeaderboard);

  // Guided tutorial state
  const [seenTutorials, setSeenTutorials] = useState<Record<PhaseId, boolean>>(
    loadSeenTutorials
  );
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(
    () => loadInitialNick() !== '' && !loadSeenTutorials()[1]
  );
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  // Phase 1 state
  const [selectedComponentId, setSelectedComponentId] =
    useState<ComponentId | null>(() =>
      loadInitialDifficulty() === 'tecnico' ? null : 'sai'
    );
  const [exploredIds, setExploredIds] = useState<ComponentId[]>(() =>
    loadInitialDifficulty() === 'tecnico' ? [] : ['sai']
  );
  const [p1FirstTryIds, setP1FirstTryIds] = useState<ComponentId[]>([]);

  // Phase 2 state (Principiante & Técnico)
  const [placedRackItems, setPlacedRackItems] = useState<PlacedRackItem[]>([]);
  const [techPlacedRackItems, setTechPlacedRackItems] = useState<
    TechnicalPlacedRackItem[]
  >([]);
  const [rackValidation, setRackValidation] =
    useState<RackValidationSummary | null>(null);
  const [phase2Completed, setPhase2Completed] = useState(false);

  // Phase 3 state (4-step Principiante & 8-step Técnico)
  const [cables, setCables] = useState<CableConnection[]>([]);
  const [techCables, setTechCables] = useState<TechnicalCableConnection[]>([]);

  const isTechnical = difficulty === 'tecnico';
  const phase3Completed = isTechnical
    ? techCables.length >= TOTAL_TECHNICAL_EXPECTED_CABLES
    : cables.length >= TOTAL_EXPECTED_CABLES;

  const phase1Completed = exploredIds.length >= EDUCATIONAL_COMPONENTS.length;
  const allPhasesCompleted =
    phase1Completed && phase2Completed && phase3Completed;

  // Score calculation
  const scoreSummary = useMemo(() => {
    const p1 = calculatePhase1Score({
      exploredCount: exploredIds.length,
      totalComponents: EDUCATIONAL_COMPONENTS.length,
      remainingSeconds: phaseTimers[1],
      completed: phase1Completed,
      difficulty,
      firstTryCount: p1FirstTryIds.length,
    });
    const p2 = calculatePhase2Score({
      placedCount: isTechnical
        ? techPlacedRackItems.length
        : placedRackItems.length,
      totalEquipment: isTechnical
        ? TECHNICAL_RACK_INVENTORY.length
        : RACK_INVENTORY.length,
      completed: phase2Completed,
      failedChecks: phase2FailedChecks,
      remainingSeconds: phaseTimers[2],
      difficulty,
    });
    const p3 = calculatePhase3Score({
      cableCount: isTechnical ? techCables.length : cables.length,
      expectedCables: isTechnical
        ? TOTAL_TECHNICAL_EXPECTED_CABLES
        : TOTAL_EXPECTED_CABLES,
      completed: phase3Completed,
      failedAttempts: phase3FailedAttempts,
      remainingSeconds: phaseTimers[3],
      difficulty,
    });
    return computeTotalGameScore(p1, p2, p3);
  }, [
    difficulty,
    isTechnical,
    exploredIds.length,
    p1FirstTryIds.length,
    phase1Completed,
    placedRackItems.length,
    techPlacedRackItems.length,
    phase2Completed,
    phase2FailedChecks,
    cables.length,
    techCables.length,
    phase3Completed,
    phase3FailedAttempts,
    phaseTimers,
  ]);

  // Persist seen tutorials
  useEffect(() => {
    try {
      window.localStorage.setItem(
        TUTORIAL_STORAGE_KEY,
        JSON.stringify(seenTutorials)
      );
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [seenTutorials]);

  // Persist leaderboard
  useEffect(() => {
    try {
      window.localStorage.setItem(
        LEADERBOARD_STORAGE_KEY,
        JSON.stringify(leaderboard)
      );
    } catch {
      // Ignore storage failures
    }
  }, [leaderboard]);

  // Countdown timer for active phase (paused when modals/tutorial are open or phase is completed)
  const isActivePhaseCompleted =
    (activePhase === 1 && phase1Completed) ||
    (activePhase === 2 && phase2Completed) ||
    (activePhase === 3 && phase3Completed);

  const isTimerPaused =
    nickModalOpen ||
    tutorialOpen ||
    helpOpen ||
    infoOpen ||
    victoryModalOpen ||
    isActivePhaseCompleted;

  useEffect(() => {
    if (isTimerPaused) return;
    const interval = window.setInterval(() => {
      setPhaseTimers((prev) => {
        const current = prev[activePhase];
        if (current <= 0) return prev;
        return {
          ...prev,
          [activePhase]: current - 1,
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activePhase, isTimerPaused]);

  // Automatically congratulate and show final summary when all 3 phases complete
  useEffect(() => {
    if (allPhasesCompleted && !victoryRecordedForRun) {
      setVictoryRecordedForRun(true);
      setTutorialOpen(false);
      setHelpOpen(false);
      setInfoOpen(false);
      setVictoryModalOpen(true);

      const totalTimeUsedSeconds = scoreSummary.phases.reduce(
        (sum, p) => sum + (p.timeUsedSeconds ?? 0),
        0
      );
      const newEntry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nick: playerNick || 'Invitado/a',
        difficulty,
        score: scoreSummary.totalScore,
        rankTitle: scoreSummary.rank.title,
        totalTimeUsedSeconds,
        dateIso: new Date().toISOString(),
      };
      setLeaderboard((prev) =>
        [...prev, newEntry]
          .sort((a, b) =>
            b.score !== a.score
              ? b.score - a.score
              : a.totalTimeUsedSeconds - b.totalTimeUsedSeconds
          )
          .slice(0, 10)
      );
    }
  }, [
    allPhasesCompleted,
    victoryRecordedForRun,
    scoreSummary,
    playerNick,
    difficulty,
  ]);

  const markTutorialSeen = (phase: PhaseId) => {
    setSeenTutorials((prev) =>
      prev[phase] ? prev : { ...prev, [phase]: true }
    );
  };

  const resetProgressForLevel = (nextDifficulty: DifficultyLevel) => {
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';
    const freshSeen = isAutostart
      ? { 1: true, 2: true, 3: true }
      : { 1: false, 2: false, 3: false };
    setSeenTutorials(freshSeen);
    setActivePhase(1);
    setTutorialStepIndex(0);
    setSelectedComponentId(nextDifficulty === 'tecnico' ? null : 'sai');
    setExploredIds(nextDifficulty === 'tecnico' ? [] : ['sai']);
    setP1FirstTryIds([]);
    setPlacedRackItems([]);
    setTechPlacedRackItems([]);
    setRackValidation(null);
    setPhase2Completed(false);
    setCables([]);
    setTechCables([]);
    setPhaseTimers(getPhaseTimeLimits(nextDifficulty));
    setPhase2FailedChecks(0);
    setPhase3FailedAttempts(0);
    setVictoryModalOpen(false);
    setVictoryRecordedForRun(false);
    setHelpOpen(false);
    setInfoOpen(false);
    return freshSeen;
  };

  const handleConfirmNick = (nick: string, nextDifficulty: DifficultyLevel) => {
    const isInitialSet = playerNick === '';
    const difficultyChanged = nextDifficulty !== difficulty;
    setPlayerNick(nick);
    setDifficulty(nextDifficulty);
    setNickModalOpen(false);

    if (difficultyChanged) {
      const freshSeen = resetProgressForLevel(nextDifficulty);
      if (!freshSeen[1]) {
        setTutorialOpen(true);
      } else {
        setTutorialOpen(false);
      }
      return;
    }

    if (isInitialSet && nextDifficulty === 'tecnico') {
      // Ensure initial Técnico state has empty exploredIds & null selected if page loaded with principante default
      setSelectedComponentId((prev) => (exploredIds.length === 0 ? prev : null));
    }

    if (isInitialSet && !seenTutorials[activePhase]) {
      setTutorialStepIndex(0);
      setTutorialOpen(true);
    }
  };

  const handlePhaseChange = (nextPhase: PhaseId) => {
    setActivePhase(nextPhase);
    setHelpOpen(false);
    setInfoOpen(false);
    if (!seenTutorials[nextPhase]) {
      setTutorialStepIndex(0);
      setTutorialOpen(true);
    } else {
      setTutorialOpen(false);
    }
  };

  const handleStartTutorial = () => {
    setHelpOpen(false);
    setInfoOpen(false);
    setNickModalOpen(false);
    setVictoryModalOpen(false);
    setTutorialStepIndex(0);
    setTutorialOpen(true);
  };

  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    markTutorialSeen(activePhase);
  };

  const handleSelectComponent = (id: ComponentId) => {
    setSelectedComponentId(id);
    if (!isTechnical) {
      setExploredIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const handleValidateTechnicalComponent = (
    id: ComponentId,
    isFirstTry: boolean
  ) => {
    setSelectedComponentId(id);
    setExploredIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (isFirstTry) {
      setP1FirstTryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const handlePlaceRackItem = (
    itemId: RackEquipmentId,
    bottomU: number
  ): string | undefined => {
    const res = placeRackItem(placedRackItems, itemId, bottomU);
    if (res.error) return res.error;
    setPlacedRackItems(res.placedItems);
    setRackValidation(null);
    return undefined;
  };

  const handlePlaceTechnicalRackItem = (
    itemId: TechnicalRackEquipmentId,
    bottomU: number
  ): string | undefined => {
    const res = placeTechnicalRackItem(techPlacedRackItems, itemId, bottomU);
    if (res.error) return res.error;
    setTechPlacedRackItems(res.placedItems);
    setRackValidation(null);
    return undefined;
  };

  const handleRemoveRackItem = (itemId: RackEquipmentId) => {
    setPlacedRackItems((prev) => removeRackItem(prev, itemId));
    setRackValidation(null);
    setPhase2Completed(false);
  };

  const handleRemoveTechnicalRackItem = (itemId: TechnicalRackEquipmentId) => {
    setTechPlacedRackItems((prev) => removeTechnicalRackItem(prev, itemId));
    setRackValidation(null);
    setPhase2Completed(false);
  };

  const handleValidateRack = () => {
    const summary = isTechnical
      ? validateTechnicalRackAssembly(techPlacedRackItems)
      : validateRackAssembly(placedRackItems);
    setRackValidation(summary);
    if (summary.isValid) {
      setPhase2Completed(true);
    } else {
      setPhase2Completed(false);
      setPhase2FailedChecks((c) => c + 1);
    }
  };

  const handleStepSuccess = (nextCables: CableConnection[]) => {
    setCables(nextCables);
    if (nextCables.length >= TOTAL_EXPECTED_CABLES) {
      setVictoryModalOpen(true);
    }
  };

  const handleTechnicalStepSuccess = (
    nextCables: TechnicalCableConnection[]
  ) => {
    setTechCables(nextCables);
    if (nextCables.length >= TOTAL_TECHNICAL_EXPECTED_CABLES) {
      setVictoryModalOpen(true);
    }
  };

  const handleResetAll = () => {
    resetProgressForLevel(difficulty);
    setTutorialOpen(false);
    setNickModalOpen(true);
  };

  const currentTutorialSteps = getTutorialSteps(activePhase, difficulty);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-40">
        <HeaderBar
          activePhase={activePhase}
          onSelectPhase={handlePhaseChange}
          completedPhases={{
            phase1: phase1Completed,
            phase2: phase2Completed,
            phase3: phase3Completed,
          }}
          onStartTutorial={handleStartTutorial}
          onOpenHelp={() => {
            setTutorialOpen(false);
            setInfoOpen(false);
            setHelpOpen(true);
          }}
          onOpenInfo={() => {
            setTutorialOpen(false);
            setHelpOpen(false);
            setInfoOpen(true);
          }}
          onResetAll={handleResetAll}
        />

        <GameHudBar
          nick={playerNick}
          difficulty={difficulty}
          activePhase={activePhase}
          remainingSeconds={phaseTimers[activePhase]}
          isTimerPaused={isTimerPaused}
          scoreSummary={scoreSummary}
          allPhasesCompleted={allPhasesCompleted || phase3Completed}
          onEditNick={() => {
            setTutorialOpen(false);
            setHelpOpen(false);
            setInfoOpen(false);
            setNickModalOpen(true);
          }}
          onOpenVictory={() => setVictoryModalOpen(true)}
        />
      </div>

      <main className="flex-1 pb-10">
        {activePhase === 1 && (
          <Phase1Explore
            difficulty={difficulty}
            selectedId={selectedComponentId}
            exploredIds={exploredIds}
            firstTryIds={p1FirstTryIds}
            onSelectComponent={handleSelectComponent}
            onValidateComponent={handleValidateTechnicalComponent}
            onGoToPhase2={() => handlePhaseChange(2)}
          />
        )}

        {activePhase === 2 && (
          <Phase2RackAssembly
            difficulty={difficulty}
            placedItems={placedRackItems}
            technicalPlacedItems={techPlacedRackItems}
            validationResult={rackValidation}
            onPlaceItem={handlePlaceRackItem}
            onPlaceTechnicalItem={handlePlaceTechnicalRackItem}
            onRemoveItem={handleRemoveRackItem}
            onRemoveTechnicalItem={handleRemoveTechnicalRackItem}
            onValidate={handleValidateRack}
            onGoToPhase3={() => handlePhaseChange(3)}
          />
        )}

        {activePhase === 3 && (
          <Phase3NetworkWiring
            difficulty={difficulty}
            placedRackItems={placedRackItems}
            rackValidated={phase2Completed}
            cables={cables}
            technicalCables={techCables}
            phase3Completed={phase3Completed}
            onStepSuccess={handleStepSuccess}
            onTechnicalStepSuccess={handleTechnicalStepSuccess}
            onStepMistake={() => setPhase3FailedAttempts((c) => c + 1)}
            onClearCables={() => {
              if (isTechnical) setTechCables([]);
              else setCables([]);
            }}
            onOpenVictory={() => setVictoryModalOpen(true)}
          />
        )}
      </main>

      <NickEntryModal
        isOpen={nickModalOpen}
        currentNick={playerNick}
        currentDifficulty={difficulty}
        canCancel={playerNick !== ''}
        onConfirmNick={handleConfirmNick}
        onCancel={() => setNickModalOpen(false)}
      />

      <VictoryModal
        isOpen={victoryModalOpen}
        nick={playerNick}
        difficulty={difficulty}
        scoreSummary={scoreSummary}
        leaderboard={leaderboard}
        onClose={() => setVictoryModalOpen(false)}
        onPlayAgain={handleResetAll}
      />

      <HelpModal
        isOpen={helpOpen}
        activePhase={activePhase}
        difficulty={difficulty}
        onClose={() => setHelpOpen(false)}
      />

      <InfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      <GuidedTutorialOverlay
        isOpen={tutorialOpen}
        steps={currentTutorialSteps}
        currentStepIndex={tutorialStepIndex}
        onNext={() =>
          setTutorialStepIndex((idx) =>
            Math.min(currentTutorialSteps.length - 1, idx + 1)
          )
        }
        onPrev={() => setTutorialStepIndex((idx) => Math.max(0, idx - 1))}
        onClose={handleCloseTutorial}
      />
    </div>
  );
}
