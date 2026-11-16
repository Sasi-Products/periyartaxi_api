import test from 'node:test';
import assert from 'node:assert/strict';
import { jsonObject, knownKeys } from '../src/utils/jsonObject.js';

test('JSON parser supports objects and MySQL JSON strings', () => {
  assert.deepEqual(jsonObject({photo:'/api/drivers/4/documents/photo'}), {photo:'/api/drivers/4/documents/photo'});
  assert.deepEqual(jsonObject('{"photo":"/api/drivers/4/documents/photo"}'), {photo:'/api/drivers/4/documents/photo'});
  assert.deepEqual(jsonObject(JSON.stringify(JSON.stringify({photo:'ok'}))), {photo:'ok'});
});
test('invalid JSON and arrays are empty', () => {
  assert.deepEqual(jsonObject('{invalid'), {});
  assert.deepEqual(jsonObject('[1,2,3]'), {});
  assert.deepEqual(jsonObject(null), {});
});
test('removes numeric keys introduced by prior string spreads', () => {
  assert.deepEqual(knownKeys({0:'{', 1:'}', rc:'abc.png', irrelevant:'xyz'}, ['rc','insurance']), {rc:'abc.png'});
  assert.deepEqual(knownKeys('{"license":"file.png","123":"bad"}', ['license']), {license:'file.png'});
});
