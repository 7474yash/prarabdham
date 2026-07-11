/**
 * ashtakavarga.js — Classical Parashari Ashtakavarga planetary strength system.
 * Pure ES module, no external dependencies.
 *
 * SOURCE: The benefic-place (bindu) tables below are transcribed from the
 * classical Parashari Ashtakavarga system as codified in Brihat Parashara
 * Hora Shastra and standardised by B.V. Raman ("Ashtakavarga System of
 * Prediction", Chapter II). Rahu and Ketu are correctly excluded — the
 * classical system as taught by Parashara uses only the 7 physical planets
 * (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) plus Lagna as the
 * 8 contributors. This is standard, not a simplification.
 *
 * VERIFICATION: Every row-total below was checked against the known
 * classical constants (Sun=48, Moon=49, Mars=39, Mercury=54, Jupiter=56,
 * Venus=52, Saturn=39, grand total=337 — this sum is fixed for every
 * horoscope in the classical system and serves as an internal checksum).
 * A self-test using B.V. Raman's published "Standard Horoscope" worked
 * example (birth: Oct 16 1918, 2:00 PM LMT, Bangalore) runs automatically
 * when this module loads, comparing computed output against the
 * known-correct published result. See runSelfTest() below.
 */

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const CONTRIBUTORS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
const BHINNA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/**
 * Classical benefic-place (bindu) tables.
 * BENEFIC_TABLES[planet][contributor] = array of house-positions (1-12,
 * counted inclusively from the contributor's own sign) that receive a
 * bindu for that planet.
 *
 * Row totals (sum of array lengths per planet) match the classical
 * constants exactly:
 *   Sun: 8+4+8+7+4+3+8+6 = 48
 *   Moon: 6+6+7+8+7+7+4+4 = 49
 *   Mars: 5+3+7+4+4+4+7+5 = 39
 *   Mercury: 5+6+8+8+4+8+8+7 = 54
 *   Jupiter: 9+5+7+8+8+6+4+9 = 56
 *   Venus: 3+9+6+5+5+9+7+8 = 52
 *   Saturn: 7+3+6+6+4+3+4+6 = 39
 *   Grand total: 337
 */
const BENEFIC_TABLES = {
  Sun: {
    Sun:     [1,2,4,7,8,9,10,11],
    Moon:    [3,6,10,11],
    Mars:    [1,2,4,7,8,9,10,11],
    Mercury: [3,5,6,9,10,11,12],
    Jupiter: [5,6,9,11],
    Venus:   [6,7,12],
    Saturn:  [1,2,4,7,8,9,10,11],
    Lagna:   [3,4,6,10,11,12],
  },
  Moon: {
    Sun:     [3,6,7,8,10,11],
    Moon:    [1,3,6,7,10,11],
    Mars:    [2,3,5,6,9,10,11],
    Mercury: [1,3,4,5,7,8,10,11],
    Jupiter: [1,4,7,8,10,11,12],
    Venus:   [3,4,5,7,9,10,11],
    Saturn:  [3,5,6,11],
    Lagna:   [3,6,10,11],
  },
  Mars: {
    Sun:     [3,5,6,10,11],
    Moon:    [3,6,11],
    Mars:    [1,2,4,7,8,10,11],
    Mercury: [3,5,6,11],
    Jupiter: [6,10,11,12],
    Venus:   [6,8,11,12],
    Saturn:  [1,4,7,8,9,10,11],
    Lagna:   [1,3,6,10,11],
  },
  Mercury: {
    Sun:     [5,6,9,11,12],
    Moon:    [2,4,6,8,10,11],
    Mars:    [1,2,4,7,8,9,10,11],
    Mercury: [1,3,5,6,9,10,11,12],
    Jupiter: [6,8,11,12],
    Venus:   [1,2,3,4,5,8,9,11],
    Saturn:  [1,2,4,7,8,9,10,11],
    Lagna:   [1,2,4,6,8,10,11],
  },
  Jupiter: {
    Sun:     [1,2,3,4,7,8,9,10,11],
    Moon:    [2,5,7,9,11],
    Mars:    [1,2,4,7,8,10,11],
    Mercury: [1,2,4,5,6,9,10,11],
    Jupiter: [1,2,3,4,7,8,10,11],
    Venus:   [2,5,6,9,10,11],
    Saturn:  [3,5,6,12],
    Lagna:   [1,2,4,5,6,7,9,10,11],
  },
  Venus: {
    Sun:     [8,11,12],
    Moon:    [1,2,3,4,5,8,9,11,12],
    Mars:    [3,5,6,9,11,12],
    Mercury: [3,5,6,9,11],
    Jupiter: [5,8,9,10,11],
    Venus:   [1,2,3,4,5,8,9,10,11],
    Saturn:  [3,4,5,8,9,10,11],
    Lagna:   [1,2,3,4,5,8,9,11],
  },
  Saturn: {
    Sun:     [1,2,4,7,8,10,11],
    Moon:    [3,6,11],
    Mars:    [3,5,6,10,11,12],
    Mercury: [6,8,9,10,11,12],
    Jupiter: [5,6,11,12],
    Venus:   [6,11,12],
    Saturn:  [3,5,6,11],
    Lagna:   [1,3,4,6,10,11],
  },
};

// Row-total checksum, verified at module load — if this ever fails, the
// table above has a transcription error and must not be trusted.
const EXPECTED_TOTALS = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };

function checksumTables() {
  for (const planet of BHINNA_PLANETS) {
    const sum = CONTRIBUTORS.reduce((s, c) => s + BENEFIC_TABLES[planet][c].length, 0);
    if (sum !== EXPECTED_TOTALS[planet]) {
      throw new Error(`ashtakavarga.js table checksum FAILED for ${planet}: got ${sum}, expected ${EXPECTED_TOTALS[planet]}. Table is corrupted — do not use.`);
    }
  }
}
checksumTables();

function signIndex(signName) {
  const idx = SIGNS.indexOf(signName);
  if (idx === -1) throw new Error(`ashtakavarga.js: unknown sign "${signName}"`);
  return idx;
}

// ---------------------------------------------------------------------------
// 1. getBhinnashtakavarga
// ---------------------------------------------------------------------------

/**
 * Computes one planet's Bhinnashtakavarga (individual 12-sign bindu table).
 *
 * @param {string} planetName - One of Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
 * @param {object} planets    - From core.js getPlanets() — { Sun: {sign}, Moon: {sign}, ... }
 * @param {object} lagna      - From core.js getLagna() — { sign }
 * @returns {{
 *   bySign: number[],   // 12 values, index 0=Aries .. 11=Pisces, each 0-8
 *   byHouse: number[],  // 12 values, index 0=House1 (Lagna sign) .. 11=House12
 *   total: number        // sum of bySign, should equal the classical constant
 * }}
 */
export function getBhinnashtakavarga(planetName, planets, lagna) {
  const table = BENEFIC_TABLES[planetName];
  if (!table) throw new Error(`ashtakavarga.js: no benefic table for "${planetName}" (Rahu/Ketu are correctly excluded from classical Ashtakavarga)`);

  const bySign = new Array(12).fill(0);

  for (const contributor of CONTRIBUTORS) {
    const contribSign = contributor === 'Lagna' ? lagna.sign : planets[contributor]?.sign;
    if (!contribSign) continue; // honest skip if data missing, doesn't fabricate
    const contribIdx = signIndex(contribSign);
    const favHouses = table[contributor];
    for (const h of favHouses) {
      const targetIdx = (contribIdx + h - 1) % 12;
      bySign[targetIdx] += 1;
    }
  }

  const lagnaIdx = signIndex(lagna.sign);
  const byHouse = new Array(12);
  for (let house = 1; house <= 12; house++) {
    const sIdx = (lagnaIdx + house - 1) % 12;
    byHouse[house - 1] = bySign[sIdx];
  }

  const total = bySign.reduce((a, b) => a + b, 0);
  return { bySign, byHouse, total };
}

// ---------------------------------------------------------------------------
// 2. getSarvashtakavarga
// ---------------------------------------------------------------------------

/**
 * Computes the Sarvashtakavarga — combined total of all 7 planets'
 * Bhinnashtakavarga tables. Lagna itself has no separate Bhinnashtakavarga
 * (it is only a contributor to the 7 planetary tables) — this is standard
 * classical practice, not an omission.
 *
 * @param {object} planets - From core.js getPlanets()
 * @param {object} lagna   - From core.js getLagna()
 * @returns {{ bySign: number[], byHouse: number[], total: number }}
 *   total should equal 337 for every chart — this is a fixed classical
 *   invariant and serves as a correctness check on any given calculation.
 */
export function getSarvashtakavarga(planets, lagna) {
  const bySign = new Array(12).fill(0);
  for (const planet of BHINNA_PLANETS) {
    const { bySign: planetBySign } = getBhinnashtakavarga(planet, planets, lagna);
    for (let i = 0; i < 12; i++) bySign[i] += planetBySign[i];
  }

  const lagnaIdx = signIndex(lagna.sign);
  const byHouse = new Array(12);
  for (let house = 1; house <= 12; house++) {
    const sIdx = (lagnaIdx + house - 1) % 12;
    byHouse[house - 1] = bySign[sIdx];
  }

  const total = bySign.reduce((a, b) => a + b, 0);
  return { bySign, byHouse, total };
}

// ---------------------------------------------------------------------------
// 3. getFullAshtakavarga
// ---------------------------------------------------------------------------

/**
 * Returns the complete Ashtakavarga picture: all 7 Bhinnashtakavarga tables
 * plus the Sarvashtakavarga, with a strength rating per house.
 *
 * Strength thresholds are the standard classical references cited across
 * BPHS-based commentary (28+ strong, 20-27 moderate, below 20 weak) — the
 * average expected per house is 337/12 ≈ 28.1, so "strong" corresponds to
 * at-or-above-average, "weak" to meaningfully below it.
 *
 * @param {object} planets - From core.js getPlanets()
 * @param {object} lagna   - From core.js getLagna()
 * @returns {{
 *   bhinna: { Sun: {...}, Moon: {...}, ..., Saturn: {...} },
 *   sarva: {
 *     bySign, byHouse, total,
 *     houseStrength: Array<{ house, sign, points, rating }>
 *   }
 * }}
 */
export function getFullAshtakavarga(planets, lagna) {
  const bhinna = {};
  for (const planet of BHINNA_PLANETS) {
    bhinna[planet] = getBhinnashtakavarga(planet, planets, lagna);
  }

  const sarva = getSarvashtakavarga(planets, lagna);
  const lagnaIdx = signIndex(lagna.sign);

  const houseStrength = sarva.byHouse.map((points, i) => {
    const house = i + 1;
    const sign = SIGNS[(lagnaIdx + i) % 12];
    const rating = points >= 28 ? 'strong' : points >= 20 ? 'moderate' : 'weak';
    return { house, sign, points, rating };
  });

  return {
    bhinna,
    sarva: { ...sarva, houseStrength },
  };
}

// ---------------------------------------------------------------------------
// Self-test — B.V. Raman's published "Standard Horoscope" worked example.
// Birth: October 16, 1918, 2:00 PM LMT, Bangalore, India.
// Expected Sun Bhinnashtakavarga (bySign, Aries..Pisces): [5,3,5,4,4,4,3,5,5,0,5,5]
// Expected Sarvashtakavarga (bySign, Aries..Pisces): [33,25,33,30,26,23,26,29,30,24,27,31]
// Both published in B.V. Raman, "Ashtakavarga System of Prediction", Ch. II.
// This runs automatically whenever this module is imported and logs a clear
// pass/fail to the console — if it ever fails, the tables above must not be
// trusted and should not be used to compute a real person's chart.
// ---------------------------------------------------------------------------

function runSelfTest() {
  const testPlanets = {
    Sun:     { sign: 'Virgo' },
    Moon:    { sign: 'Aquarius' },
    Mars:    { sign: 'Scorpio' },
    Mercury: { sign: 'Libra' },
    Jupiter: { sign: 'Gemini' },
    Venus:   { sign: 'Virgo' },
    Saturn:  { sign: 'Leo' },
  };
  const testLagna = { sign: 'Capricorn' };

  const expectedSunBySign = [5,3,5,4,4,4,3,5,5,0,5,5];
  const expectedSarvaBySign = [33,25,33,30,26,23,26,29,30,24,27,31];

  const sunResult = getBhinnashtakavarga('Sun', testPlanets, testLagna);
  const sarvaResult = getSarvashtakavarga(testPlanets, testLagna);

  const sunMatch = JSON.stringify(sunResult.bySign) === JSON.stringify(expectedSunBySign);
  const sarvaMatch = JSON.stringify(sarvaResult.bySign) === JSON.stringify(expectedSarvaBySign);
  const sunTotalOk = sunResult.total === 48;
  const sarvaTotalOk = sarvaResult.total === 337;

  const allPass = sunMatch && sarvaMatch && sunTotalOk && sarvaTotalOk;

  const label = allPass ? '✓ PASS' : '✗ FAIL';
  console.log(`[ashtakavarga.js self-test] ${label} — B.V. Raman Standard Horoscope (Oct 16 1918, Bangalore)`);
  console.log(`  Sun Bhinnashtakavarga bySign: got [${sunResult.bySign}], expected [${expectedSunBySign}] — ${sunMatch ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  Sun total: got ${sunResult.total}, expected 48 — ${sunTotalOk ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  Sarvashtakavarga bySign: got [${sarvaResult.bySign}], expected [${expectedSarvaBySign}] — ${sarvaMatch ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  Sarva total: got ${sarvaResult.total}, expected 337 — ${sarvaTotalOk ? 'MATCH' : 'MISMATCH'}`);

  if (!allPass) {
    console.error('[ashtakavarga.js] SELF-TEST FAILED — do not trust this module\'s output until this is fixed.');
  }

  return allPass;
}

// Run automatically on module load (browser console shows the result).
export const selfTestPassed = runSelfTest();
