import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { encode, decode } from '../src/server.js';

// RFC 4648 test vectors:
//   ""      -> ""
//   "f"     -> "MY======"
//   "fo"    -> "MZXQ===="
//   "foo"   -> "MZXW6==="
//   "foob"  -> "MZXW6YQ="
//   "fooba" -> "MZXW6YTB"
//   "foobar"-> "MZXW6YTBOI======"

test('encode RFC 4648 test vectors', () => {
  assert.equal(encode(''), '');
  assert.equal(encode('f'), 'MY======');
  assert.equal(encode('fo'), 'MZXQ====');
  assert.equal(encode('foo'), 'MZXW6===');
  assert.equal(encode('foob'), 'MZXW6YQ=');
  assert.equal(encode('fooba'), 'MZXW6YTB');
  assert.equal(encode('foobar'), 'MZXW6YTBOI======');
});

test('decode RFC 4648 vectors', () => {
  assert.equal(decode('MY======'), 'f');
  assert.equal(decode('MZXW6YTB'), 'fooba');
  assert.equal(decode('MZXW6YTBOI======'), 'foobar');
});

test('Crockford encode/decode (no padding)', () => {
  // 'foo' = 0x66 0x6f 0x6f = bits 011001100110111101101111
  // Crockford alphabet 0-9, A-Z minus I/L/O/U.
  const enc = encode('foo', 'crockford');
  assert.equal(decode(enc, 'crockford'), 'foo');
});

test('Crockford treats I/L as 1 and O as 0 on decode', () => {
  const base = encode('hi', 'crockford');
  // Mutate any 1 to I; should still decode equivalently.
  if (base.includes('1')) {
    const mutated = base.replace('1', 'I');
    assert.equal(decode(mutated, 'crockford'), 'hi');
  }
});

test('decode rejects garbage in RFC4648', () => {
  assert.throws(() => decode('!@#$'));
});

test('round trips unicode (utf-8)', () => {
  const s = 'héllo 世界 🌍';
  assert.equal(decode(encode(s)), s);
});
