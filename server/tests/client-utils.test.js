import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHour, isRelationChangeClamped } from '../../client/src/utils.js';

test('时间格式不会产生 60 分钟并正确处理跨小时进位', () => {
  assert.equal(formatHour(7.999), '08:00');
  assert.equal(formatHour(8.996), '09:00');
  assert.equal(formatHour(12.5), '12:30');
  assert.equal(formatHour(23.999), '24:00');
  assert.equal(formatHour(Number.NaN), '--:--');
});

test('关系变化触及上下限时能正确识别', () => {
  assert.equal(isRelationChangeClamped({ delta: 5, requestedDelta: 8 }), true);
  assert.equal(isRelationChangeClamped({ delta: -1, requestedDelta: -9 }), true);
  assert.equal(isRelationChangeClamped({ delta: 5, requestedDelta: 5 }), false);
  assert.equal(isRelationChangeClamped({ delta: 5 }), false);
  assert.equal(isRelationChangeClamped(null), false);
  assert.equal(isRelationChangeClamped(undefined), false);
});
