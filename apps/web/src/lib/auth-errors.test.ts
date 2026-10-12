import assert from 'node:assert/strict';
import { authErrorMessage } from './auth-errors';

assert.equal(authErrorMessage({ code: 'invalid_credentials' }, 'fallback'), 'Invalid email or password.');
assert.equal(authErrorMessage({ code: 'validation_failed' }, 'fallback'), 'Enter a valid email address and password.');
assert.equal(authErrorMessage({ code: 'unknown' }, 'fallback'), 'fallback');
assert.equal(authErrorMessage(null, 'fallback'), 'fallback');

console.log('Auth error messages: PASS');
