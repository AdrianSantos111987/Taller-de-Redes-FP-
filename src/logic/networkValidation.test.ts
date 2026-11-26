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

import {
  attemptTechnicalStepConnection,
  getCurrentTechnicalWiringStep,
  TechnicalCableConnection,
  TECHNICAL_WIRING_STEPS,
  TOTAL_TECHNICAL_EXPECTED_CABLES,
} from './networkValidation.ts';

test('Nivel Tecnico defines 8 guided steps and completes all 9 links including Step 5 pair matching', () => {
  assert.equal(TECHNICAL_WIRING_STEPS.length, 8);
  let cables: TechnicalCableConnection[] = [];

  // Step 1: SAI -> Router 230V
  let r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'power',
    fromPortId: 'tech-sai-router',
    toPortId: 'tech-router-pwr',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 2);

  // Step 2: SAI -> Switches 230V
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'power',
    fromPortId: 'tech-sai-switches',
    toPortId: 'tech-switches-pwr',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 3);

  // Step 3: Internet -> Router WAN
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-internet-wan',
    toPortId: 'tech-router-wan',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 4);

  // Step 4: Router LAN -> Switch 1 Uplink
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-router-lan',
    toPortId: 'tech-sw1-uplink',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 5);

  // Step 5 mismatched pair should fail gracefully
  const badPair = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw1-to-sw2',
    toPortId: 'tech-sw3-uplink',
  });
  assert.ok(badPair.error);

  // Step 5 link 1: SW1 -> SW2 (stays on Step 5!)
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw1-to-sw2',
    toPortId: 'tech-sw2-uplink',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 5);

  // Step 5 link 2: SW1 -> SW3 (advances to Step 6)
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw1-to-sw3',
    toPortId: 'tech-sw3-uplink',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 6);

  // Step 6: SW1 -> Aula 1
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw1-aula1',
    toPortId: 'tech-pp-aula1',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 7);

  // Step 7: SW2 -> Aula 2
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw2-aula2',
    toPortId: 'tech-pp-aula2',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;
  assert.equal(getCurrentTechnicalWiringStep(cables)?.stepNumber, 8);

  // Step 8: SW3 -> Sala de Profesores
  r = attemptTechnicalStepConnection({
    cables,
    selectedCable: 'ethernet',
    fromPortId: 'tech-sw3-prof',
    toPortId: 'tech-pp-prof',
  });
  assert.equal(r.error, undefined);
  cables = r.cables;

  assert.equal(cables.length, TOTAL_TECHNICAL_EXPECTED_CABLES);
  assert.equal(getCurrentTechnicalWiringStep(cables), null);
});
