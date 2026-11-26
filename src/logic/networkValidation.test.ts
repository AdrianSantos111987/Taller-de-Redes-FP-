import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attemptStepConnection,
  CableConnection,
  getCurrentWiringStep,
  GUIDED_WIRING_STEPS,
  TOTAL_EXPECTED_CABLES,
  validateStepPortSelection,
} from './networkValidation.ts';

test('cannot connect power cable into an RJ45 port and gives friendly explanation', () => {
  const step2 = GUIDED_WIRING_STEPS[1];
  const res = validateStepPortSelection({
    step: step2,
    selectedCable: 'power',
    portId: 'router-wan',
    cables: [],
  });
  assert.equal(res.ok, false);
  assert.ok(res.reason?.includes('corriente eléctrica'));
});

test('cannot connect ethernet RJ45 cable into 230V power port in step 1', () => {
  const step1 = GUIDED_WIRING_STEPS[0];
  const res = validateStepPortSelection({
    step: step1,
    selectedCable: 'ethernet',
    portId: 'sai-out',
    cables: [],
  });
  assert.equal(res.ok, false);
  assert.ok(res.reason?.includes('Cable de Alimentación'));
});

test('completes all 4 guided steps in either port click order', () => {
  let cables: CableConnection[] = [];

  // Step 1: SAI -> Router 230V
  let res = attemptStepConnection({
    cables,
    selectedCable: 'power',
    fromPortId: 'sai-out',
    toPortId: 'router-pwr',
  });
  assert.equal(res.error, undefined);
  cables = res.cables;
  assert.equal(getCurrentWiringStep(cables)?.stepNumber, 2);

  // Step 2: Router WAN <- Internet (reverse order also works)
  res = attemptStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'router-wan',
    toPortId: 'internet-wan',
  });
  assert.equal(res.error, undefined);
  cables = res.cables;
  assert.equal(getCurrentWiringStep(cables)?.stepNumber, 3);

  // Step 3: Router LAN -> Switch Uplink
  res = attemptStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'router-lan',
    toPortId: 'switch-uplink',
  });
  assert.equal(res.error, undefined);
  cables = res.cables;
  assert.equal(getCurrentWiringStep(cables)?.stepNumber, 4);

  // Step 4: Switch Aula -> Patch Panel
  res = attemptStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'switch-aula',
    toPortId: 'patch-panel-aula',
  });
  assert.equal(res.error, undefined);
  cables = res.cables;

  assert.equal(cables.length, TOTAL_EXPECTED_CABLES);
  assert.equal(getCurrentWiringStep(cables), null);
});
