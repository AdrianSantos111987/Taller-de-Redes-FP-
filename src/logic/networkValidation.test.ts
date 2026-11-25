import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCableConnection,
  CableConnection,
  validateConnectivity,
} from './networkValidation';

test('cannot connect Ethernet cable to fiber WAN port', () => {
  const res = addCableConnection([], 'ethernet', 'internet-fiber', 'router-wan');
  assert.notEqual(res.error, undefined);
  assert.equal(res.cables.length, 0);
});

test('cannot connect PC directly to Switch bypassing Roseta and Patch Panel', () => {
  const res = addCableConnection([], 'ethernet', 'switch-p2', 'pc-1');
  assert.notEqual(res.error, undefined);
  assert.equal(res.cables.length, 0);
});

test('validateConnectivity detects missing switch power when other cables are present', () => {
  let cables: CableConnection[] = [];
  cables = addCableConnection(cables, 'power', 'sai-out-1', 'pdu-in').cables;
  cables = addCableConnection(cables, 'power', 'pdu-out-1', 'router-pwr').cables;
  cables = addCableConnection(cables, 'fiber', 'internet-fiber', 'router-wan').cables;
  cables = addCableConnection(cables, 'ethernet', 'router-lan', 'switch-p1').cables;

  const diag = validateConnectivity(cables);
  assert.equal(diag.allConnected, false);
  assert.equal(diag.switchPowered, false);
  assert.ok(diag.issues.some((i) => i.code === 'switch_no_power'));
});

test('validateConnectivity succeeds and activates all 4 PCs when full network and power are wired', () => {
  let cables: CableConnection[] = [];
  // Power
  cables = addCableConnection(cables, 'power', 'sai-out-1', 'pdu-in').cables;
  cables = addCableConnection(cables, 'power', 'pdu-out-1', 'router-pwr').cables;
  cables = addCableConnection(cables, 'power', 'pdu-out-2', 'switch-pwr').cables;
  // Fiber WAN
  cables = addCableConnection(cables, 'fiber', 'internet-fiber', 'router-wan').cables;
  // Router LAN -> Switch
  cables = addCableConnection(cables, 'ethernet', 'router-lan', 'switch-p1').cables;
  // Switch -> Patch Panel
  cables = addCableConnection(cables, 'ethernet', 'switch-p2', 'pp-1').cables;
  cables = addCableConnection(cables, 'ethernet', 'switch-p3', 'pp-2').cables;
  cables = addCableConnection(cables, 'ethernet', 'switch-p4', 'pp-3').cables;
  cables = addCableConnection(cables, 'ethernet', 'switch-p5', 'pp-4').cables;
  // Rosetas -> PCs
  cables = addCableConnection(cables, 'ethernet', 'roseta-1', 'pc-1').cables;
  cables = addCableConnection(cables, 'ethernet', 'roseta-2', 'pc-2').cables;
  cables = addCableConnection(cables, 'ethernet', 'roseta-3', 'pc-3').cables;
  cables = addCableConnection(cables, 'ethernet', 'roseta-4', 'pc-4').cables;

  const diag = validateConnectivity(cables);
  assert.equal(diag.allConnected, true);
  assert.equal(diag.issues.length, 0);
  assert.equal(diag.activeSwitchPorts.length, 5);
  assert.ok(diag.pcStatuses.every((pc) => pc.connectedToInternet));
});
