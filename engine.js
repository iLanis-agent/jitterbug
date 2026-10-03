(function (root) {
  // Capped exponential backoff with the jitter variants from the AWS Architecture Blog "Exponential Backoff And Jitter".
  // attempt counts from 0: the sleep after the first failure uses attempt 0.
  function ceiling(base, cap, attempt) { return Math.min(cap, base * Math.pow(2, attempt)); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // one sleep, given a uniform random u in [0,1)
  function sleepFor(strategy, base, cap, attempt, prev, u) {
    var c = ceiling(base, cap, attempt);
    if (strategy === 'none') return c;
    if (strategy === 'full') return u * c;
    if (strategy === 'equal') return c / 2 + u * (c / 2);
    if (strategy === 'decorrelated') return Math.min(cap, base + u * (Math.max(prev, base) * 3 - base));
    return NaN;
  }
  // exact min / max / expected per retry for the memoryless strategies
  function table(strategy, base, cap, retries) {
    var rows = [], cumMin = 0, cumMax = 0, cumExp = 0, dmax = base;
    for (var i = 0; i < retries; i++) {
      var c = ceiling(base, cap, i), mn, mx, ex;
      if (strategy === 'none') { mn = mx = ex = c; }
      else if (strategy === 'full') { mn = 0; mx = c; ex = c / 2; }
      else if (strategy === 'equal') { mn = c / 2; mx = c; ex = c * 0.75; }
      else { mn = base; dmax = Math.min(cap, dmax * 3); mx = dmax; ex = null; }
      cumMin += mn; cumMax += mx; cumExp = ex === null ? null : cumExp + ex;
      rows.push({ retry: i + 1, ceiling: c, min: mn, max: mx, expected: ex, cumMax: cumMax, cumExpected: cumExp });
    }
    return rows;
  }
  // Monte Carlo for any strategy with a seeded generator; returns mean sleep per retry and mean total
  function simulate(strategy, base, cap, retries, runs, seed) {
    var rnd = mulberry32(seed || 1), sums = [], total = 0, i, r, prev, s;
    for (i = 0; i < retries; i++) sums.push(0);
    for (r = 0; r < runs; r++) {
      prev = base;
      for (i = 0; i < retries; i++) { s = sleepFor(strategy, base, cap, i, prev, rnd()); prev = s; sums[i] += s; total += s; }
    }
    return { means: sums.map(function (x) { return x / runs; }), meanTotal: total / runs };
  }
  // chance every try fails when each try fails independently with probability p
  function allFail(p, retries) { return Math.pow(p, retries + 1); }
  // how many retries fit before a deadline if every sleep takes its maximum (attempt time ignored if 0)
  function retriesWithin(strategy, base, cap, deadline, attemptTime, maxRetries) {
    var t = attemptTime, n = 0, rows = table(strategy, base, cap, maxRetries);
    for (var i = 0; i < rows.length; i++) { t += rows[i].max + attemptTime; if (t > deadline) break; n++; }
    return n;
  }
  var api = { ceiling: ceiling, sleepFor: sleepFor, table: table, simulate: simulate, allFail: allFail, retriesWithin: retriesWithin, rng: mulberry32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JitterBug = api;
})(typeof window !== 'undefined' ? window : this);
