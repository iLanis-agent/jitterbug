var J = require('./engine.js'); var fails = 0, n = 0;
function eq(a, b, m) { n++; if (a !== b) { fails++; console.log('FAIL', m, a, b); } }
function near(a, b, tol, m) { n++; if (Math.abs(a - b) > tol) { fails++; console.log('FAIL', m, a, b); } }
// capped exponential: base 100, cap 5000 -> 100,200,400,800,1600,3200,5000,5000
[100, 200, 400, 800, 1600, 3200, 5000, 5000].forEach(function (v, i) { eq(J.ceiling(100, 5000, i), v, 'ceiling ' + i); });
// formulas with fixed u
eq(J.sleepFor('none', 100, 5000, 3, 0, 0.5), 800, 'none');
eq(J.sleepFor('full', 100, 5000, 3, 0, 0.5), 400, 'full u=.5');
eq(J.sleepFor('full', 100, 5000, 3, 0, 0), 0, 'full u=0');
eq(J.sleepFor('equal', 100, 5000, 3, 0, 0), 400, 'equal u=0');
eq(J.sleepFor('equal', 100, 5000, 3, 0, 1), 800, 'equal u=1');
eq(J.sleepFor('decorrelated', 100, 5000, 0, 100, 0), 100, 'deco u=0 is base');
eq(J.sleepFor('decorrelated', 100, 5000, 0, 100, 1), 300, 'deco u=1 is 3*prev');
eq(J.sleepFor('decorrelated', 100, 5000, 0, 4000, 1), 5000, 'deco capped');
// table
var t = J.table('full', 100, 5000, 4);
eq(t[3].max, 800, 'full max'); eq(t[3].expected, 400, 'full exp'); eq(t[3].cumMax, 1500, 'cum max'); eq(t[3].cumExpected, 750, 'cum exp');
t = J.table('equal', 100, 5000, 3); eq(t[2].min, 200, 'equal min'); eq(t[2].expected, 300, 'equal exp'); eq(t[2].cumExpected, 525, 'equal cum exp');
t = J.table('none', 100, 5000, 3); eq(t[2].cumMax, 700, 'none cum');
t = J.table('decorrelated', 100, 5000, 5); eq(t[0].max, 300, 'deco max 1'); eq(t[1].max, 900, 'deco max 2'); eq(t[2].max, 2700, 'deco max 3'); eq(t[3].max, 5000, 'deco max 4 capped'); eq(t[4].cumMax, 300 + 900 + 2700 + 5000 + 5000, 'deco cum max');
for (var sd = 1; sd <= 200; sd++) { var rr = J.rng(sd), pv = 100, tt = J.table('decorrelated', 100, 5000, 12); for (var k = 0; k < 12; k++) { pv = J.sleepFor('decorrelated', 100, 5000, k, pv, rr()); if (pv > tt[k].max + 1e-9) eq(1, 0, 'deco beyond max'); } }
// invariants over many seeds
['none', 'full', 'equal', 'decorrelated'].forEach(function (s) {
  for (var seed = 1; seed <= 200; seed++) { var r = J.rng(seed), prev = 100; for (var i = 0; i < 12; i++) { var v = J.sleepFor(s, 100, 5000, i, prev, r()); prev = v; if (!(v >= 0 && v <= 5000)) eq(1, 0, 'bound ' + s); if (s !== 'full' && v < 100 - 1e-9 && s !== 'none' && s !== 'equal') eq(1, 0, 'floor ' + s); } }
});
// Monte Carlo means agree with the exact expectation (memoryless strategies)
['full', 'equal'].forEach(function (s) {
  var sim = J.simulate(s, 100, 5000, 6, 20000, 7), ex = J.table(s, 100, 5000, 6);
  for (var i = 0; i < 6; i++) near(sim.means[i], ex[i].expected, ex[i].ceiling * 0.02, 'mc ' + s + i);
});
var d = J.simulate('decorrelated', 100, 5000, 6, 20000, 7);
eq(d.means[0] > 100 && d.means[0] < 300, true, 'deco first mean in (base,3*base)'); eq(J.simulate('full', 100, 5000, 3, 50, 3).meanTotal === J.simulate('full', 100, 5000, 3, 50, 3).meanTotal, true, 'seeded repeatable');
near(J.allFail(0.5, 3), 0.0625, 1e-12, 'allFail'); near(J.allFail(0.1, 0), 0.1, 1e-12, 'allFail 0 retries');
eq(J.retriesWithin('none', 100, 5000, 1000, 0, 10), 3, 'within deadline: 100+200+400=700, +800>1000');
eq(J.retriesWithin('none', 100, 5000, 10, 0, 10), 0, 'none fit');
console.log(n + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
