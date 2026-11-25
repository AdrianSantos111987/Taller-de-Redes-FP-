import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPlaceItem,
  placeRackItem,
  removeRackItem,
  validateRackAssembly,
  PlacedRackItem,
} from './rackValidation';

test('SAI 2U cannot be placed at U12 because it overflows 12U rack', () => {
  const res = canPlaceItem([], 'sai', 12);
  assert.equal(res.ok, false);
});

test('SAI 2U placed at U1 occupies U1 and U2, preventing placement at U2', () => {
  const step1 = placeRackItem([], 'sai', 1);
  assert.equal(step1.error, undefined);
  assert.equal(step1.placedItems.length, 1);

  const overlapCheck = canPlaceItem(step1.placedItems, 'pdu', 2);
  assert.equal(overlapCheck.ok, false);

  const validPdu = canPlaceItem(step1.placedItems, 'pdu', 3);
  assert.equal(validPdu.ok, true);
});

test('validateRackAssembly fails when SAI is not at base U1-U2', () => {
  const items: PlacedRackItem[] = [
    { id: 'pdu', bottomU: 1, heightU: 1 },
    { id: 'sai', bottomU: 3, heightU: 2 },
    { id: 'bandeja', bottomU: 5, heightU: 1 },
    { id: 'router', bottomU: 6, heightU: 1 },
    { id: 'patch_panel', bottomU: 7, heightU: 1 },
    { id: 'switch', bottomU: 8, heightU: 1 },
  ];
  const validation = validateRackAssembly(items);
  assert.equal(validation.isValid, false);
  const saiRule = validation.rules.find((r) => r.id === 'sai_base');
  assert.equal(saiRule?.passed, false);
});

test('validateRackAssembly fails when Patch Panel and Switch are separated', () => {
  const items: PlacedRackItem[] = [
    { id: 'sai', bottomU: 1, heightU: 2 },
    { id: 'pdu', bottomU: 3, heightU: 1 },
    { id: 'patch_panel', bottomU: 5, heightU: 1 },
    { id: 'bandeja', bottomU: 6, heightU: 1 },
    { id: 'router', bottomU: 7, heightU: 1 },
    { id: 'switch', bottomU: 9, heightU: 1 },
  ];
  const validation = validateRackAssembly(items);
  assert.equal(validation.isValid, false);
  const adjRule = validation.rules.find((r) => r.id === 'patch_switch_adjacent');
  assert.equal(adjRule?.passed, false);
});

test('validateRackAssembly passes with valid workshop configuration and supports item removal', () => {
  const items: PlacedRackItem[] = [
    { id: 'sai', bottomU: 1, heightU: 2 },
    { id: 'pdu', bottomU: 3, heightU: 1 },
    { id: 'bandeja', bottomU: 5, heightU: 1 },
    { id: 'router', bottomU: 6, heightU: 1 },
    { id: 'switch', bottomU: 8, heightU: 1 },
    { id: 'patch_panel', bottomU: 9, heightU: 1 },
  ];
  const validation = validateRackAssembly(items);
  assert.equal(validation.isValid, true);

  const afterRemove = removeRackItem(items, 'router');
  assert.equal(afterRemove.length, 5);
  assert.equal(validateRackAssembly(afterRemove).isValid, false);
});
