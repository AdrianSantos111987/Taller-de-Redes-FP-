import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePhase1Score,
  calculatePhase2Score,
  calculatePhase3Score,
  computeTotalGameScore,
  formatSecondsMMSS,
  sanitizeNick,
} from './gamification.ts';

test('formatSecondsMMSS formats minutes and seconds with zero padding', () => {
  assert.equal(formatSecondsMMSS(0), '00:00');
  assert.equal(formatSecondsMMSS(65), '01:05');
  assert.equal(formatSecondsMMSS(300), '05:00');
  assert.equal(formatSecondsMMSS(-12), '00:00');
});

test('sanitizeNick trims whitespace and limits length to 20 chars', () => {
  assert.equal(sanitizeNick('  Laura   FPB  '), 'Laura FPB');
  assert.equal(sanitizeNick('NombreMuyLargoDeAlumnoFPBasica'), 'NombreMuyLargoDeAlum');
});

test('faster completion yields higher time bonus and total score', () => {
  const fastP1 = calculatePhase1Score({
    exploredCount: 7,
    totalComponents: 7,
    remainingSeconds: 100,
    completed: true,
  });
  const slowP1 = calculatePhase1Score({
    exploredCount: 7,
    totalComponents: 7,
    remainingSeconds: 15,
    completed: true,
  });

  assert.equal(fastP1.accuracyPoints, slowP1.accuracyPoints);
  assert.ok(fastP1.timeBonusPoints > slowP1.timeBonusPoints);
  assert.ok(fastP1.totalPoints > slowP1.totalPoints);
  assert.equal(fastP1.timeUsedSeconds, 20);
});

test('Phase 2 and 3 penalize failed validation checks but never go negative', () => {
  const cleanP2 = calculatePhase2Score({
    placedCount: 6,
    totalEquipment: 6,
    completed: true,
    failedChecks: 0,
    remainingSeconds: 120,
  });
  const messyP2 = calculatePhase2Score({
    placedCount: 6,
    totalEquipment: 6,
    completed: true,
    failedChecks: 10,
    remainingSeconds: 120,
  });

  assert.ok(cleanP2.accuracyPoints > messyP2.accuracyPoints);
  assert.ok(messyP2.accuracyPoints >= 350);

  const cleanP3 = calculatePhase3Score({
    cableCount: 4,
    expectedCables: 4,
    completed: true,
    failedAttempts: 0,
    remainingSeconds: 200,
  });
  const messyP3 = calculatePhase3Score({
    cableCount: 4,
    expectedCables: 4,
    completed: true,
    failedAttempts: 10,
    remainingSeconds: 200,
  });

  assert.ok(cleanP3.totalPoints > messyP3.totalPoints);
  assert.ok(messyP3.accuracyPoints >= 650);
});

test('computeTotalGameScore sums all phases and assigns Oro rank for high score', () => {
  const p1 = calculatePhase1Score({
    exploredCount: 7,
    totalComponents: 7,
    remainingSeconds: 90,
    completed: true,
  });
  const p2 = calculatePhase2Score({
    placedCount: 6,
    totalEquipment: 6,
    completed: true,
    failedChecks: 0,
    remainingSeconds: 140,
  });
  const p3 = calculatePhase3Score({
    cableCount: 4,
    expectedCables: 4,
    completed: true,
    failedAttempts: 0,
    remainingSeconds: 220,
  });

  const summary = computeTotalGameScore(p1, p2, p3);
  assert.equal(summary.totalScore, p1.totalPoints + p2.totalPoints + p3.totalPoints);
  assert.equal(summary.rank.tier, 'oro');
});
