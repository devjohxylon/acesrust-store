// Run with: npm run test:streak
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkinPoints, computeCheckin, utcDateString } from './streak.ts';

const NOW = new Date('2026-07-04T18:00:00Z');

test('first-ever check-in starts a streak of 1', () => {
  const result = computeCheckin(null, 0, NOW);
  assert.equal(result.status, 'checked_in');
  assert.equal(result.streak, 1);
  assert.equal(result.points, 10);
});

test('same-day check-in is rejected', () => {
  const result = computeCheckin('2026-07-04', 3, NOW);
  assert.equal(result.status, 'already_checked_in');
  assert.equal(result.streak, 3);
  assert.equal(result.points, 0);
});

test('consecutive-day check-in extends the streak', () => {
  const result = computeCheckin('2026-07-03', 3, NOW);
  assert.equal(result.status, 'checked_in');
  assert.equal(result.streak, 4);
  assert.equal(result.points, 25);
});

test('missing a day resets the streak to 1', () => {
  const result = computeCheckin('2026-07-01', 12, NOW);
  assert.equal(result.status, 'checked_in');
  assert.equal(result.streak, 1);
  assert.equal(result.points, 10);
});

test('day 7 pays 40 points', () => {
  assert.equal(checkinPoints(7), 40);
});

test('points cap at 80 for long streaks', () => {
  assert.equal(checkinPoints(15), 80);
  assert.equal(checkinPoints(100), 80);
});

test('streak works across a month boundary', () => {
  const firstOfMonth = new Date('2026-08-01T02:00:00Z');
  const result = computeCheckin('2026-07-31', 5, firstOfMonth);
  assert.equal(result.status, 'checked_in');
  assert.equal(result.streak, 6);
});

test('utcDateString uses the UTC calendar day', () => {
  assert.equal(utcDateString(new Date('2026-07-04T23:59:59Z')), '2026-07-04');
  assert.equal(utcDateString(new Date('2026-07-05T00:00:01Z')), '2026-07-05');
});
