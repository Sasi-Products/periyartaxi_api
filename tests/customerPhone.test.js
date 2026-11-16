import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedPhone, sameMobile, phoneVariants } from '../src/utils/customerPhone.js';

test('Phone matching handles Indian +91 and ten-digit numbers', () => {
  assert.equal(sameMobile('+91 9876543210', '9876543210'), true);
  assert.equal(sameMobile('919876543210', '9876543210'), true);
});
test('Phone matching rejects different identities and empty values', () => {
  assert.equal(sameMobile('9876543210', '9876543211'), false);
  assert.equal(sameMobile(null, '9876543210'), false);
});
test('Phone lookup creates format variants without partial numbers', () => {
  assert.deepEqual(phoneVariants('9876543210'), ['9876543210', '+919876543210', '919876543210']);
  assert.deepEqual(phoneVariants(''), []);
  assert.equal(normalizedPhone('+91 98765 43210'), '919876543210');
});
