import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTooltipPosition,
  TUTORIAL_STEPS_BY_PHASE,
} from './tutorialSteps';

test('all 3 phases define guided tutorial steps with targets and solution guidance', () => {
  assert.ok(TUTORIAL_STEPS_BY_PHASE[1].length >= 3);
  assert.ok(TUTORIAL_STEPS_BY_PHASE[2].length >= 5);
  assert.ok(TUTORIAL_STEPS_BY_PHASE[3].length >= 3);

  for (const phase of [1, 2, 3] as const) {
    for (const step of TUTORIAL_STEPS_BY_PHASE[phase]) {
      assert.ok(step.title.length > 0);
      assert.ok(step.body.length > 15);
      assert.ok(step.targetTourId.length > 0);
    }
  }
});

test('computeTooltipPosition places tooltip inside viewport bounds when target is near bottom-right corner', () => {
  const target = {
    top: 780,
    left: 1180,
    width: 200,
    height: 60,
    right: 1380,
    bottom: 840,
  };
  const coords = computeTooltipPosition(
    target,
    { width: 340, height: 220 },
    { width: 1440, height: 900 },
    'bottom'
  );
  assert.ok(coords.top >= 14);
  assert.ok(coords.left >= 14);
  assert.ok(coords.top + 220 <= 900 - 14);
  assert.ok(coords.left + 340 <= 1440 - 14);
});

test('computeTooltipPosition flips from right to left when target is on the right edge', () => {
  const target = {
    top: 260,
    left: 1080,
    width: 300,
    height: 120,
    right: 1380,
    bottom: 380,
  };
  const coords = computeTooltipPosition(
    target,
    { width: 340, height: 200 },
    { width: 1440, height: 900 },
    'right'
  );
  assert.equal(coords.placement, 'left');
  assert.ok(coords.left + 340 <= target.left);
});
