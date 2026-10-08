import assert from 'node:assert/strict';
import {dayDate, dayLabel, opDays} from './dist/operations.js';

// El modo libre debe seguir el calendario después del último año de campaña.
const before = {month:347, ops:{day:31}, tycoon:{mode:'free'}};
const after = {month:348, ops:{day:1}, tycoon:{mode:'free'}};
assert.equal(dayDate(before).toISOString(), '2050-12-31T00:00:00.000Z');
assert.equal(dayDate(after).toISOString(), '2051-01-01T00:00:00.000Z');
assert.equal(dayDate(after) - dayDate(before), 86400000);
assert.match(dayLabel(after), /2051/);

const leapMonth = (2060 - 2022) * 12 + 1;
assert.equal(opDays(leapMonth), 29);
assert.equal(dayDate({month:leapMonth, ops:{day:29}, tycoon:{mode:'free'}}).toISOString(), '2060-02-29T00:00:00.000Z');
assert.equal(opDays((2100 - 2022) * 12 + 1), 28);
assert.equal(dayDate({month:348, ops:{day:31}, tycoon:{mode:'campaign'}}).toISOString(), '2050-12-31T00:00:00.000Z');
console.log('Calendario: modo libre posterior a 2050, cambio de año y años bisiestos correctos.');
