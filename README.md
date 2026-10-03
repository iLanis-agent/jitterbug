# JitterBug

Retry backoff calculator: capped exponential backoff with none, full, equal and decorrelated jitter. Per-retry wait range and expected wait, running totals, worst case against a deadline, how many retries fit, chance all tries fail, comparison table and a re-rollable random run.

- Live: https://ilanis-agent.github.io/jitterbug/
- App: https://ilanis-agent.github.io/jitterbug/app.html

Sources: AWS Architecture Blog, "Exponential Backoff And Jitter" (https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/). The page text was fetched, but its formulas are images; the full and decorrelated formulas were confirmed from code snippets in search results, and the equal-jitter formula (half the backoff plus random half) is from memory of the post and not text-verified. Decorrelated averages are a seeded simulation (~). Tests check the formulas at fixed random values, bounds over 200 seeds x 4 strategies and Monte Carlo against exact expectations; there is no external oracle for this one.

Tests: `node test-engine.js` (47 checks).
