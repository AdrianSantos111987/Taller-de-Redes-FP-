import { useEffect, useMemo, useState } from 'react';
import {
  ComponentId,
  EDUCATIONAL_COMPONENTS,
  RACK_INVENTORY,
  RackEquipmentId,
} from './data/componentsData';
import {
  PlacedRackItem,
  placeRackItem,
  RackValidationSummary,
  removeRackItem,
  validateRackAssembly,
} from './logic/rackValidation';
import {
  addCableConnection,
  CableConnection,
  CableType,
  ConnectivityResult,
  removeCableConnection,
  validateConnectivity,
} from './logic/networkValidation';
import {
  calculatePhase1Score,
  calculatePhase2Score,
  calculatePhase3Score,
  computeTotalGameScore,
  LeaderboardEntry,
  PHASE_TIME_LIMITS,
  PhaseTimingMap,
  sanitizeNick,
} from './logic/gamification';
import { TUTORIAL_STEPS_BY_PHASE } from './logic/tutorialSteps';
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

const SAMPLE_COMPLETE_CABLES: CableConnection[] = [
  { id: 'power-sai-out-1-pdu-in', type: 'power', fromPortId: 'sai-out-1', toPortId: 'pdu-in' },
  { id: 'power-pdu-out-1-router-pwr', type: 'power', fromPortId: 'pdu-out-1', toPortId: 'router-pwr' },
  { id: 'power-pdu-out-2-switch-pwr', type: 'power', fromPortId: 'pdu-out-2', toPortId: 'switch-pwr' },
  { id: 'fiber-internet-fiber-router-wan', type: 'fiber', fromPortId: 'internet-fiber', toPortId: 'router-wan' },
  { id: 'ethernet-router-lan-switch-p1', type: 'ethernet', fromPortId: 'router-lan', toPortId: 'switch-p1' },
  { id: 'ethernet-switch-p2-pp-1', type: 'ethernet', fromPortId: 'switch-p2', toPortId: 'pp-1' },
  { id: 'ethernet-switch-p3-pp-2', type: 'ethernet', fromPortId: 'switch-p3', toPortId: 'pp-2' },
  { id: 'ethernet-switch-p4-pp-3', type: 'ethernet', fromPortId: 'switch-p4', toPortId: 'pp-3' },
  { id: 'ethernet-switch-p5-pp-4', type: 'ethernet', fromPortId: 'switch-p5', toPortId: 'pp-4' },
  { id: 'ethernet-roseta-1-pc-1', type: 'ethernet', fromPortId: 'roseta-1', toPortId: 'pc-1' },
  { id: 'ethernet-roseta-2-pc-2', type: 'ethernet', fromPortId: 'roseta-2', toPortId: 'pc-2' },
  { id: 'ethernet-roseta-3-pc-3', type: 'ethernet', fromPortId: 'roseta-3', toPortId: 'pc-3' },
  { id: 'ethernet-roseta-4-pc-4', type: 'ethernet', fromPortId: 'roseta-4', toPortId: 'pc-4' },
];

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
  const [activePhase, setActivePhase] = useState<PhaseId>(1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Gamification state: nick, per-phase countdown timers, accuracy penalties, victory modal & leaderboard
  const [playerNick, setPlayerNick] = useState<string>(loadInitialNick);
  const [nickModalOpen, setNickModalOpen] = useState<boolean>(
    () => loadInitialNick() === ''
  );
  const [phaseTimers, setPhaseTimers] = useState<PhaseTimingMap>(() => ({
    ...PHASE_TIME_LIMITS,
  }));
  const [phase2FailedChecks, setPhase2FailedChecks] = useState(0);
  const [phase3FailedPings, setPhase3FailedPings] = useState(0);
  const [phase3ChallengeExplored, setPhase3ChallengeExplored] = useState(false);
  const [phase3UsedSample, setPhase3UsedSample] = useState(false);
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
    useState<ComponentId>('sai');
  const [exploredIds, setExploredIds] = useState<ComponentId[]>(['sai']);

  // Phase 2 state
  const [placedRackItems, setPlacedRackItems] = useState<PlacedRackItem[]>([]);
  const [rackValidation, setRackValidation] =
    useState<RackValidationSummary | null>(null);
  const [phase2Completed, setPhase2Completed] = useState(false);

  // Phase 3 state
  const [cables, setCables] = useState<CableConnection[]>([]);
  const [pingResult, setPingResult] = useState<ConnectivityResult | null>(null);
  const [phase3Completed, setPhase3Completed] = useState(false);

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
    });
    const p2 = calculatePhase2Score({
      placedCount: placedRackItems.length,
      totalEquipment: RACK_INVENTORY.length,
      completed: phase2Completed,
      failedChecks: phase2FailedChecks,
      remainingSeconds: phaseTimers[2],
    });
    const p3 = calculatePhase3Score({
      cableCount: cables.length,
      expectedCables: 13,
      completed: phase3Completed,
      failedPings: phase3FailedPings,
      remainingSeconds: phaseTimers[3],
      challengeExplored: phase3ChallengeExplored,
      usedSampleAssist: phase3UsedSample,
    });
    return computeTotalGameScore(p1, p2, p3);
  }, [
    exploredIds.length,
    phase1Completed,
    placedRackItems.length,
    phase2Completed,
    phase2FailedChecks,
    cables.length,
    phase3Completed,
    phase3FailedPings,
    phase3ChallengeExplored,
    phase3UsedSample,
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

  // Automatically congratulate and show final score when all 3 phases finish
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
  }, [allPhasesCompleted, victoryRecordedForRun, scoreSummary, playerNick]);

  const markTutorialSeen = (phase: PhaseId) => {
    setSeenTutorials((prev) =>
      prev[phase] ? prev : { ...prev, [phase]: true }
    );
  };

  const handleConfirmNick = (nick: string) => {
    const isInitialSet = playerNick === '';
    setPlayerNick(nick);
    setNickModalOpen(false);
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
    setExploredIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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

  const handleRemoveRackItem = (itemId: RackEquipmentId) => {
    setPlacedRackItems((prev) => removeRackItem(prev, itemId));
    setRackValidation(null);
    setPhase2Completed(false);
  };

  const handleValidateRack = () => {
    const summary = validateRackAssembly(placedRackItems);
    setRackValidation(summary);
    if (summary.isValid) {
      setPhase2Completed(true);
    } else {
      setPhase2Completed(false);
      setPhase2FailedChecks((c) => c + 1);
    }
  };

  const handleAddCable = (
    type: CableType,
    fromPortId: string,
    toPortId: string
  ): string | undefined => {
    const res = addCableConnection(cables, type, fromPortId, toPortId);
    if (res.error) return res.error;
    setCables(res.cables);
    setPingResult(null);
    return undefined;
  };

  const handleRemoveCable = (cableId: string) => {
    setCables((prev) => removeCableConnection(prev, cableId));
    setPingResult(null);
    setPhase3Completed(false);
  };

  const handleClearCables = () => {
    setCables([]);
    setPingResult(null);
    setPhase3Completed(false);
    setPhase3UsedSample(false);
  };

  const handleLoadSampleForChallenge = () => {
    setPhase3UsedSample(true);
    setCables(SAMPLE_COMPLETE_CABLES);
    const diag = validateConnectivity(SAMPLE_COMPLETE_CABLES);
    setPingResult(diag);
    if (diag.allConnected) {
      setPhase3Completed(true);
    }
  };

  const handleRunPing = () => {
    const diag = validateConnectivity(cables);
    setPingResult(diag);
    if (diag.allConnected) {
      setPhase3Completed(true);
    } else {
      setPhase3Completed(false);
      setPhase3FailedPings((c) => c + 1);
    }
  };

  const handleResetAll = () => {
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';
    const freshSeen = isAutostart
      ? { 1: true, 2: true, 3: true }
      : { 1: false, 2: false, 3: false };
    setSeenTutorials(freshSeen);
    setActivePhase(1);
    setTutorialStepIndex(0);
    setTutorialOpen(false);
    setSelectedComponentId('sai');
    setExploredIds(['sai']);
    setPlacedRackItems([]);
    setRackValidation(null);
    setPhase2Completed(false);
    setCables([]);
    setPingResult(null);
    setPhase3Completed(false);
    setPhaseTimers({ ...PHASE_TIME_LIMITS });
    setPhase2FailedChecks(0);
    setPhase3FailedPings(0);
    setPhase3ChallengeExplored(false);
    setPhase3UsedSample(false);
    setVictoryModalOpen(false);
    setVictoryRecordedForRun(false);
    setHelpOpen(false);
    setInfoOpen(false);
    setNickModalOpen(true);
  };

  const currentTutorialSteps = TUTORIAL_STEPS_BY_PHASE[activePhase];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-30">
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
          activePhase={activePhase}
          remainingSeconds={phaseTimers[activePhase]}
          isTimerPaused={isTimerPaused}
          scoreSummary={scoreSummary}
          allPhasesCompleted={allPhasesCompleted}
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
            selectedId={selectedComponentId}
            exploredIds={exploredIds}
            onSelectComponent={handleSelectComponent}
            onGoToPhase2={() => handlePhaseChange(2)}
          />
        )}

        {activePhase === 2 && (
          <Phase2RackAssembly
            placedItems={placedRackItems}
            validationResult={rackValidation}
            onPlaceItem={handlePlaceRackItem}
            onRemoveItem={handleRemoveRackItem}
            onValidate={handleValidateRack}
            onGoToPhase3={() => handlePhaseChange(3)}
          />
        )}

        {activePhase === 3 && (
          <Phase3NetworkWiring
            placedRackItems={placedRackItems}
            rackValidated={phase2Completed}
            cables={cables}
            pingResult={pingResult}
            onAddCable={handleAddCable}
            onRemoveCable={handleRemoveCable}
            onClearCables={handleClearCables}
            onLoadSampleForChallenge={handleLoadSampleForChallenge}
            onRunPing={handleRunPing}
            onChallengeExplored={() => setPhase3ChallengeExplored(true)}
          />
        )}
      </main>

      <NickEntryModal
        isOpen={nickModalOpen}
        currentNick={playerNick}
        canCancel={playerNick !== ''}
        onConfirmNick={handleConfirmNick}
        onCancel={() => setNickModalOpen(false)}
      />

      <VictoryModal
        isOpen={victoryModalOpen}
        nick={playerNick}
        scoreSummary={scoreSummary}
        leaderboard={leaderboard}
        onClose={() => setVictoryModalOpen(false)}
        onPlayAgain={handleResetAll}
      />

      <HelpModal
        isOpen={helpOpen}
        activePhase={activePhase}
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
