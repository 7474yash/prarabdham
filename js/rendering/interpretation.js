/**
 * interpretation.js — Chart Interpretation Display Engine
 * Pure ES module, no external dependencies.
 *
 * This engine connects verified chart calculation data to educational content.
 * It does NOT generate personalised predictions.
 * It presents accurate chart data with honest educational framing.
 *
 * All content comes from interpretations.js — this file is structural only.
 */

import { CONTENT } from '../content/interpretations.js';

// ---------------------------------------------------------------------------
// Sign and house constants
// ---------------------------------------------------------------------------

const SIGNS_ORDER = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

const SIGN_LORD = {
  Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon',
  Leo:'Sun', Virgo:'Mercury', Libra:'Venus', Scorpio:'Mars',
  Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter',
};

// ---------------------------------------------------------------------------
// getAspects — critical for honest house readings
// ---------------------------------------------------------------------------

/**
 * Returns which planets aspect a given house number.
 *
 * Classical Parashari Graha Drishti:
 *   All planets:  7th house from their position (mutual opposition)
 *   Mars:        additionally 4th and 8th from its position
 *   Jupiter:     additionally 5th and 9th from its position
 *   Saturn:      additionally 3rd and 10th from its position
 *
 * NOTE: "4th from Mars" means the house that is 4 houses away (not 4 signs).
 * In Whole Sign houses, house N aspects house (N + offset - 1) % 12 + 1.
 *
 * @param {number} targetHouse   - House number 1–12 being aspected
 * @param {object} planetHouses  - { Sun: 10, Moon: 6, ... }
 * @returns {Array<{ planet: string, aspectType: string, fromHouse: number }>}
 */
export function getAspects(targetHouse, planetHouses) {
  const aspects = [];

  for (const [planet, fromHouse] of Object.entries(planetHouses)) {
    if (!fromHouse) continue;

    // All planets: 7th aspect
    const seventh = ((fromHouse - 1 + 6) % 12) + 1;
    if (seventh === targetHouse) {
      aspects.push({ planet, aspectType: '7th aspect', fromHouse });
    }

    // Mars: additionally 4th and 8th
    if (planet === 'Mars') {
      const fourth = ((fromHouse - 1 + 3) % 12) + 1;
      const eighth = ((fromHouse - 1 + 7) % 12) + 1;
      if (fourth === targetHouse) aspects.push({ planet, aspectType: '4th aspect', fromHouse });
      if (eighth === targetHouse) aspects.push({ planet, aspectType: '8th aspect', fromHouse });
    }

    // Jupiter: additionally 5th and 9th
    if (planet === 'Jupiter') {
      const fifth = ((fromHouse - 1 + 4) % 12) + 1;
      const ninth = ((fromHouse - 1 + 8) % 12) + 1;
      if (fifth === targetHouse)  aspects.push({ planet, aspectType: '5th aspect', fromHouse });
      if (ninth === targetHouse)  aspects.push({ planet, aspectType: '9th aspect', fromHouse });
    }

    // Saturn: additionally 3rd and 10th
    if (planet === 'Saturn') {
      const third  = ((fromHouse - 1 + 2) % 12) + 1;
      const tenth  = ((fromHouse - 1 + 9) % 12) + 1;
      if (third  === targetHouse) aspects.push({ planet, aspectType: '3rd aspect', fromHouse });
      if (tenth  === targetHouse) aspects.push({ planet, aspectType: '10th aspect', fromHouse });
    }
  }

  return aspects;
}

// ---------------------------------------------------------------------------
// buildLagnaReading
// ---------------------------------------------------------------------------

/**
 * Returns educational content about the Lagna sign and its lord's placement.
 *
 * @param {object} lagna   - { sign, degrees, minutes, nakshatra, pada }
 * @param {object} planets - all 9 planets with house numbers
 * @returns {string}
 */
export function buildLagnaReading(lagna, planets, planetHouses = {}) {
  const lagnaContent = CONTENT.lagna[lagna.sign] || `PLACEHOLDER: ${lagna.sign} Lagna content not yet written.`;
  const lagnaLord    = SIGN_LORD[lagna.sign];
  const lordSign     = planets[lagnaLord]?.sign || '?';
  const lordHouse    = planetHouses[lagnaLord] || '?';
  const lordDignity  = planets[lagnaLord]?.dignity || '';
  const dignityNote  = lordDignity ? ` (${lordDignity})` : '';

  return `${lagnaContent}\n\nThe lord of this Lagna is ${lagnaLord}, placed in ${lordSign} in the ${ordinal(lordHouse)} house${dignityNote}. The lord's placement gives the primary channel through which Lagna energy finds expression in this life.`;
}

// ---------------------------------------------------------------------------
// buildHouseReading
// ---------------------------------------------------------------------------

/**
 * Returns educational content for one occupied or significant house.
 * Integrates: Rashi (sign), Adhipati (lord placement), Occupants, Drishti (aspects).
 * Presents as integrated prose — not as separate labelled points.
 *
 * @param {number}   houseNumber   - 1–12
 * @param {string}   sign          - Sign on this house cusp
 * @param {string[]} occupants     - Planet names in this house
 * @param {Array}    aspects       - Output of getAspects()
 * @param {string}   lordPlacement - Human-readable lord placement string
 * @param {object}   planets       - Full planet data
 * @returns {string}
 */
// Planet quality descriptors for aspect woven prose
const ASPECT_QUALITY = {
  Sun:     'clarity of self-direction and authority into',
  Moon:    'emotional sensitivity and the quality of inner nourishment into',
  Mars:    'drive, energy, and the push toward action into',
  Mercury: 'analytical intelligence and discriminating awareness into',
  Jupiter: 'wisdom, grace, and the principle of meaningful expansion into',
  Venus:   'relational sensitivity and the refinement of values into',
  Saturn:  'discipline, structure, and patient long-term effort into',
  Rahu:    'amplified desire and an unusual or intensified quality into',
  Ketu:    'a quality of detachment and past-life completion into',
};

// House domain phrases for woven aspect sentences
const HOUSE_DOMAIN = {
  1:'the self and outward expression', 2:'speech, family roots, and accumulated resources',
  3:'effort, courage, and immediate environment', 4:'home, mother, and the quality of inner life',
  5:'intelligence, creativity, and past merit', 6:'obstacles, service, and the capacity to overcome',
  7:'partnership and the principle of meeting the other', 8:'transformation, depth, and what is hidden',
  9:'dharma, wisdom, and the relationship with the teacher', 10:'career, public life, and conscious action',
  11:'gains, networks, and the fulfilment of aspirations', 12:'liberation, solitude, and release',
};

// Synthesis sentences for common planet pairs sharing one house.
// Order-independent lookup — key is "PlanetA+PlanetB" alphabetically sorted.
const PAIR_SYNTHESIS = {
  'Mercury+Saturn': "Mercury and Saturn together in one house produce a deep, careful, unhurried quality of intelligence — thought and speech here are deliberate rather than quick, built for durability rather than immediate impact, and the combination tends to earn credibility slowly through demonstrated substance rather than charm.",
  'Jupiter+Mercury': "Mercury and Jupiter together in one house combine precise analytical skill with expansive wisdom, producing a genuine capacity to teach, explain, and make complex understanding accessible — the mind here is both sharp and generous.",
  'Rahu+Sun': "Sun and Rahu together in one house intensify the drive for recognition and visibility considerably, producing strong ambition in this house's domain — the challenge is ensuring the amplified hunger for significance serves something genuinely worth being significant for.",
  'Sun+Venus': "Sun and Venus together in one house blend the need for authentic self-expression with a genuine appreciation for beauty and relationship, often producing charisma, aesthetic sensibility, and a warmth that draws people in — the direction is ensuring this magnetism serves genuine connection rather than performance.",
  'Saturn+Sun': "Sun and Saturn together in one house set the need for authentic self-expression directly against the demand for discipline and patience, often producing real friction early on that resolves into durable, earned authority as the person matures into Saturn's timeline rather than resisting it.",
  'Moon+Rahu': "Moon and Rahu together in one house intensify emotional experience considerably — feelings in this house's domain tend to be amplified, sometimes restless or difficult to settle, and the sadhana direction is developing enough inner stillness that this intensity becomes depth rather than agitation.",
  'Ketu+Moon': "Moon and Ketu together in one house bring a quality of emotional detachment or completion to this house's domain — feelings here may be harder to access consciously, or may carry an unusual, already-resolved quality, asking for gentle rather than forced engagement.",
  'Mars+Saturn': "Mars and Saturn together in one house combine drive with discipline, often producing real friction between the impulse to act quickly and the demand to proceed carefully — when integrated consciously this pairing builds formidable, durable capability; when not, it produces frustration and stalled effort.",
  'Jupiter+Mars': "Mars and Jupiter together in one house combine energy with wisdom, often producing the capacity to act decisively in service of genuinely principled goals — courage guided by purpose rather than reactive force.",
  'Rahu+Saturn': "Rahu and Saturn together in one house combine amplified desire with the demand for patient discipline, often producing intense ambition that must be worked through slowly and honestly rather than seized quickly — a difficult but ultimately maturing combination when engaged consciously.",
  'Saturn+Venus': "Saturn and Venus together in one house bring discipline and structure into the domain of beauty, pleasure, and relationship — this often produces relationships or aesthetic work that develop slowly and carry real substance and durability rather than immediate ease.",
  'Sun+Mercury': "Sun and Mercury together in one house intensify the identity's need for clear, articulate self-expression — the personality tends to communicate with confidence, though Mercury's proximity to the Sun here often means the intellect can become close to identity itself, worth watching for over-identification with one's own opinions.",
  'Mercury+Venus': "Mercury and Venus together in one house combine intelligence with aesthetic and relational sensitivity, often producing genuine skill in creative communication, diplomacy, or any work where precision and beauty need to meet.",
  'Jupiter+Venus': "Jupiter and Venus together in one house combine wisdom with the appreciation of beauty and relationship, often producing genuine generosity, a refined sense of what is worth valuing, and real capacity for both creative and philosophical richness.",
  'Mars+Venus': "Mars and Venus together in one house combine drive with relational and aesthetic sensitivity, often producing passionate creative or romantic expression — the direction is ensuring assertiveness and desire serve genuine connection rather than simply intensity for its own sake.",
  'Mars+Mercury': "Mars and Mercury together in one house combine energy with intelligence, often producing sharp, quick, sometimes combative communication — the mind here moves fast and argues well, and the sadhana direction is precision without unnecessary force.",
  'Jupiter+Saturn': "Jupiter and Saturn together in one house combine expansive wisdom with disciplined structure — a genuinely mature pairing when integrated, producing wisdom that has actually been earned through sustained practice rather than merely held as belief.",
  'Ketu+Rahu': "Rahu and Ketu do not conjoin within a single house in the standard chart (they are always exactly opposite), so this pairing does not occur as a same-house synthesis.",
  'Rahu+Venus': "Venus and Rahu together in one house amplify the desire for pleasure, relationship, and refined experience considerably — often producing real magnetism and charm, with the sadhana direction being ensuring the intensified appetite for beauty and connection serves genuine relationship rather than restless accumulation of experience.",
};

function pairKey(a, b) {
  return [a, b].sort().join('+');
}

function buildSynthesis(occupants) {
  if (occupants.length < 2) return null;
  const sentences = [];
  for (let i = 0; i < occupants.length; i++) {
    for (let j = i + 1; j < occupants.length; j++) {
      const key = pairKey(occupants[i], occupants[j]);
      if (PAIR_SYNTHESIS[key]) sentences.push(PAIR_SYNTHESIS[key]);
    }
  }
  if (sentences.length > 0) return sentences.join(' ');
  // Fallback for pairs not in the lookup — still specific, names the planets
  const names = occupants.join(' and ');
  return `Together, ${names} in this house create a combined dynamic more layered than either alone — their individual qualities described above interact directly in this house's domain, and how consciously that interaction is met shapes whether it becomes friction or genuine strength.`;
}

export function buildHouseReading(houseNumber, sign, occupants, aspects, lordPlacement, planets = {}) {
  const parts = [];
  const lord = SIGN_LORD[sign];

  // Occupied house: lord + each planet + aspects woven in
  if (occupants.length > 0) {
    parts.push(`The ${ordinal(houseNumber)} house carries ${sign} — ruled by ${lord}${lordPlacement ? ', placed ' + lordPlacement : ''}.`);
    for (const occ of occupants) {
      const pData   = planets[occ] || {};
      const dignity = pData.dignity ? ` (${pData.dignity})` : '';
      const retro   = pData.isRetrograde ? ' retrograde' : '';
      const pcontent = CONTENT.planetInHouse?.[occ]?.[houseNumber]
        || `PLACEHOLDER: ${occ} in ${ordinal(houseNumber)} house content not yet written.`;
      parts.push(`${occ}${retro}${dignity} is placed here. ${pcontent}`);
    }
    const synthesis = buildSynthesis(occupants);
    if (synthesis) parts.push(synthesis);
    if (aspects.length > 0) {
      const aspNames = aspects.map(a => `${a.planet} (${a.aspectType} from H${a.fromHouse})`).join(', ');
      parts.push(`This house also receives the aspect of ${aspNames}.`);
    }
    return parts.join(' ');
  }

  // Empty house with no aspects: brief single sentence
  if (aspects.length === 0) {
    return `The ${ordinal(houseNumber)} house carries ${sign} — ruled by ${lord}${lordPlacement ? ', placed ' + lordPlacement : ''}, directing its influence on ${HOUSE_DOMAIN[houseNumber] || 'this life domain'} from that placement.`;
  }

  // Empty house WITH aspects: one woven sentence
  const aspClauses = aspects.map(a => {
    const quality = ASPECT_QUALITY[a.planet] || `${a.planet}'s quality into`;
    return `${a.planet}'s ${a.aspectType} from the ${ordinal(a.fromHouse)} house brings ${quality} ${HOUSE_DOMAIN[houseNumber] || 'this domain'}`;
  });

  const aspText = aspClauses.length === 1
    ? aspClauses[0]
    : aspClauses.slice(0,-1).join('; ') + '; and ' + aspClauses[aspClauses.length-1];

  return `The ${ordinal(houseNumber)} house carries ${sign} — ruled by ${lord}${lordPlacement ? ', placed ' + lordPlacement : ''}, anchoring ${HOUSE_DOMAIN[houseNumber] || 'this domain'} there. ${aspText.charAt(0).toUpperCase() + aspText.slice(1)}.`;
}

// ---------------------------------------------------------------------------
// buildDashaReading
// ---------------------------------------------------------------------------

/**
 * Returns educational content about the current Dasha period.
 *
 * @param {object} currentDasha - { mahaDasha, antardasha, pratyantardasha }
 * @param {object} planets      - full planet data
 * @param {object} planetHouses - planet → house number
 * @returns {string}
 */
export function buildDashaReading(currentDasha, planets = {}, planetHouses = {}) {
  if (!currentDasha?.mahaDasha) return 'Dasha data not available.';

  const md     = currentDasha.mahaDasha;
  const ad     = currentDasha.antardasha;
  const pd     = currentDasha.pratyantardasha;

  const mdPlanet  = md.planet;
  const mdContent = CONTENT.dashaReadings[mdPlanet]
    || `PLACEHOLDER: ${mdPlanet} Dasha content not yet written.`;

  const mdSign    = planets[mdPlanet]?.sign || '?';
  const mdHouse   = planetHouses[mdPlanet]  || '?';
  const mdDig     = planets[mdPlanet]?.dignity || '';

  let reading = `Current Maha Dasha: ${mdPlanet} (${md.startDate} — ${md.endDate}).\n\n${mdContent}`;
  reading += `\n\nIn this nativity, ${mdPlanet} is placed in ${mdSign} in the ${ordinal(mdHouse)} house${mdDig ? ' (' + mdDig + ')' : ''}. This natal placement colours the themes that the ${mdPlanet} Dasha is asking to be worked with.`;

  if (ad) {
    reading += `\n\nCurrent Antardasha: ${ad.planet} (${ad.startDate} — ${ad.endDate}). Within the larger ${mdPlanet} period, ${ad.planet}'s sub-period brings its own natal placement into focus alongside the Maha Dasha lord.`;
  }
  if (pd) {
    reading += ` Present sub-sub-period: ${pd.planet} (${pd.startDate} — ${pd.endDate}).`;

    const pdSign  = planets[pd.planet]?.sign || '?';
    const pdHouse = planetHouses[pd.planet] || '?';
    const pdDig   = planets[pd.planet]?.dignity || '';
    const pdCombust = planets[pd.planet]?.combust?.combust;

    const combustPhrase = pdCombust ? `, combust in ${pdSign}` : ` in ${pdSign}`;
    const digPhrase = pdDig ? ` (${pdDig})` : '';

    reading += `\n\n${pd.planet} here sits${combustPhrase} in the ${ordinal(pdHouse)} house${digPhrase}, nested inside the ${mdPlanet} Mahadasha and ${ad.planet} Antardasha — three layers compounding at once. ${pdCombust ? `${pd.planet}'s combustion tends to dim its own natural authority right when this window asks it to be drawn on directly, producing a felt quality of effort that yields less clarity than the effort deserves.` : `This layering brings ${pd.planet}'s natal condition directly into focus for the duration of this specific window.`} The chart is asking for deliberate, chosen slowness through ${pd.startDate} to ${pd.endDate} rather than slowness forced by circumstance. The sadhana direction here is specific to this window: use it for quiet consolidation of what ${pd.planet} already governs, rather than for new ventures its current condition cannot yet fully support.`;
  }

  return reading;
}

// ---------------------------------------------------------------------------
// buildYogaReading
// ---------------------------------------------------------------------------

/**
 * Returns educational content about detected Yogas.
 * Only shows Yogas that are genuinely present.
 *
 * @param {object} yogas - output of getAllYogas() from yoga.js
 * @returns {Array<{ name, reading, uncertainty }>}
 */
export function buildYogaReading(yogas) {
  const readings = [];

  const YOGA_MAP = {
    rajaYoga:            { label: 'Raja Yoga',             key: 'rajaYoga' },
    dhanaYoga:           { label: 'Dhana Yoga',            key: 'dhanaYoga' },
    viparitaRajaYoga:    { label: 'Vipareeta Raja Yoga',   key: 'viparitaRajaYoga' },
    panchaMahapurusha:   { label: 'Pancha Mahapurusha Yoga', key: 'panchaMahapurusha' },
    guruMangalaYoga:     { label: 'Guru Mangala Yoga',     key: 'guruMangalaYoga' },
    neechaBhangaYoga:    { label: 'Neecha Bhanga Raja Yoga', key: 'neechaBhangaRajaYoga' },
  };

  for (const [key, meta] of Object.entries(YOGA_MAP)) {
    const yoga = yogas[key];
    if (!yoga?.present) continue;

    const content = CONTENT.yogaReadings[meta.key]
      || `PLACEHOLDER: ${meta.label} content not yet written.`;

    readings.push({
      name:        meta.label,
      description: yoga.description,
      reading:     content,
      uncertainty: yoga.uncertainty || null,
    });
  }

  return readings;
}

// ---------------------------------------------------------------------------
// buildSummary
// ---------------------------------------------------------------------------

/**
 * Returns a brief synthesis of dominant chart themes.
 * Not a repetition — connects Lagna orientation, key house themes, Dasha context.
 *
 * @param {string} lagnaReading
 * @param {Array}  houseReadings
 * @param {string} dashaReading
 * @param {object} lagna
 * @param {object} planets
 * @param {object} planetHouses
 * @returns {string}
 */
// Dignity lookup tables — mirrored here so this module can independently
// assess dignity shifts inside divisional charts without depending on main.js.
const D_EXALTATION = {Sun:'Aries',Moon:'Taurus',Mars:'Capricorn',Mercury:'Virgo',
  Jupiter:'Cancer',Venus:'Pisces',Saturn:'Libra'};
const D_OWN_SIGNS = {Sun:['Leo'],Moon:['Cancer'],Mars:['Aries','Scorpio'],
  Mercury:['Gemini','Virgo'],Jupiter:['Sagittarius','Pisces'],
  Venus:['Taurus','Libra'],Saturn:['Capricorn','Aquarius']};
const D_DEBILITATION = {Sun:'Libra',Moon:'Scorpio',Mars:'Cancer',Mercury:'Pisces',
  Jupiter:'Capricorn',Venus:'Virgo',Saturn:'Aries'};

function vargaDignity(planet, sign) {
  if (D_EXALTATION[planet] === sign) return 'exalted';
  if ((D_OWN_SIGNS[planet] || []).includes(sign)) return 'own';
  if (D_DEBILITATION[planet] === sign) return 'debilitated';
  return null;
}

const MUKHYA_DOMAIN = {
  D10: 'career and public contribution', D7: 'children and creative effort',
  D12: 'ancestral inheritance and liberation', D24: 'education and learning',
  D20: 'spiritual practice and devotion', D60: 'the overall karmic texture of the life',
};

/**
 * Builds the D9 + other-Mukhya-Varga observation paragraph for the Summary.
 * Returns null if no genuinely notable D9 condition exists (should be rare,
 * since D9 Lagna is always present) — but never forces a fabricated
 * observation for the "other chart" half if nothing stands out there.
 */
function buildVargaObservation(varga, lagna, planets, dignityReport, lagnaLord) {
  if (!varga || !varga.D9) return null;

  const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const d9Lagna = varga.D9.Lagna?.sign;
  const d9LagnaLord = d9Lagna ? SIGN_LORD[d9Lagna] : null;

  // Find the most significant D9 dignity condition (exalted takes priority over debilitated)
  let d9Notable = null;
  for (const p of PLANETS) {
    const s = varga.D9[p]?.sign;
    const dig = s ? vargaDignity(p, s) : null;
    if (dig === 'exalted') { d9Notable = { planet: p, sign: s, dignity: dig }; break; }
    if (dig === 'debilitated' && !d9Notable) d9Notable = { planet: p, sign: s, dignity: dig };
  }

  let d9Sentence;
  if (d9LagnaLord === lagnaLord) {
    d9Sentence = `In the Navamsa, the D9 Lagna lord is again ${lagnaLord} — the same planet governing the D1 Lagna — which reinforces ${lagnaLord}'s overall significance in this chart and suggests the soul's outward orientation and its deeper dharmic direction are genuinely aligned rather than working at cross purposes.`;
  } else if (d9Notable) {
    d9Sentence = d9Notable.dignity === 'exalted'
      ? `In the Navamsa, ${d9Notable.planet} is exalted in ${d9Notable.sign} — suggesting real inner resilience and strength in whatever this planet governs, available to the native even when the D1 picture for this planet looks more ordinary.`
      : `In the Navamsa, ${d9Notable.planet} is debilitated in ${d9Notable.sign} — suggesting a deeper layer of friction around what this planet governs, worth attending to even where the D1 placement seems untroubled.`;
  } else {
    d9Sentence = `The Navamsa Lagna falls in ${d9Lagna || 'a different sign from the D1 Lagna'}, giving a distinct but not sharply contrasting picture of the soul's deeper dharmic orientation.`;
  }

  // Check other Mukhya Varga charts for a genuinely notable condition
  const OTHER_CHARTS = ['D10','D7','D12','D24','D20','D60'];
  let otherSentence = '';
  for (const key of OTHER_CHARTS) {
    if (!varga[key]) continue;
    for (const p of PLANETS) {
      const s = varga[key][p]?.sign;
      if (!s) continue;
      const dig = vargaDignity(p, s);
      if (dig === 'exalted' || dig === 'debilitated') {
        const domain = MUKHYA_DOMAIN[key] || 'that chart\'s specific domain';
        otherSentence = dig === 'exalted'
          ? ` In ${key}, ${p} is exalted in ${s} — a genuinely strong condition for ${domain}.`
          : ` In ${key}, ${p} is debilitated in ${s} — a specific point of friction worth noting in the domain of ${domain}.`;
        break;
      }
    }
    if (otherSentence) break;
  }

  return d9Sentence + otherSentence;
}

export function buildSummary(lagnaReading, houseReadings, dashaReading, lagna, planets, planetHouses, dignityReport = {}, varga = null) {

  // ── Core data extraction ──────────────────────────────────────────────────

  const lagnaLord     = SIGN_LORD[lagna.sign];
  const lagnaLordSign = planets[lagnaLord]?.sign || '?';
  const lagnaLordH    = planetHouses[lagnaLord] || '?';
  const lagnaLordDig  = dignityReport[lagnaLord]?.dignity || planets[lagnaLord]?.dignity || '';

  const dashaLordMatch = dashaReading.match(/Maha Dasha: (\w+)/);
  const dashaLord    = dashaLordMatch ? dashaLordMatch[1] : null;
  const dashaLordH   = dashaLord ? (planetHouses[dashaLord] || '?') : null;
  const dashaLordDig = dashaLord ? (dignityReport[dashaLord]?.dignity || planets[dashaLord]?.dignity || '') : '';

  // Dignity-capable planets (Rahu/Ketu don't take classical dignity)
  const DIGNITY_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const ALL_PLANETS     = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

  // Find strongest planet (exalted first, then own-sign)
  let strongPlanet = null;
  for (const name of DIGNITY_PLANETS) {
    const d = dignityReport[name];
    if (d?.dignity === 'exalted') { strongPlanet = { name, dignity: 'exalted', house: planetHouses[name] }; break; }
  }
  if (!strongPlanet) {
    for (const name of DIGNITY_PLANETS) {
      const d = dignityReport[name];
      if (d?.dignity === 'own') { strongPlanet = { name, dignity: 'own', house: planetHouses[name] }; break; }
    }
  }

  // Find most challenged planet (debilitated)
  let weakPlanet = null;
  for (const name of DIGNITY_PLANETS) {
    const d = dignityReport[name];
    if (d?.dignity === 'debilitated') { weakPlanet = { name, house: planetHouses[name] }; break; }
  }

  // Build house → occupants map
  const houseGroups = {};
  for (const name of ALL_PLANETS) {
    const h = planetHouses[name];
    if (h) { houseGroups[h] = houseGroups[h] || []; houseGroups[h].push(name); }
  }

  // ── Planet nature descriptors (short, for narrative embedding) ────────────

  const PLANET_NATURE = {
    Sun:     'the planet of authority and conscious self-expression',
    Moon:    'the planet of emotional intelligence and inner nourishment',
    Mars:    'the planet of drive, courage, and sustained effort',
    Mercury: 'the planet of analytical intelligence and discernment',
    Jupiter: 'the planet of wisdom, grace, and meaningful expansion',
    Venus:   'the planet of refined experience, relationship, and aesthetic sense',
    Saturn:  'the planet of discipline, patience, and what must be earned rather than assumed',
    Rahu:    'the node of amplification and unfamiliar intensity',
    Ketu:    'the node of detachment and spiritual depth',
  };

  // Short dignity descriptions for narrative use
  const dignityNarrative = (dig, sign) => {
    if (dig === 'exalted') return `exalted in ${sign} — at its strongest, bringing genuine and reliable capacity`;
    if (dig === 'own')     return `in its own sign of ${sign} — comfortable and direct in its expression`;
    if (dig === 'debilitated') return `debilitated in ${sign}, which means this planet's natural energy is not flowing easily`;
    return `placed in ${sign}`;
  };

  // ── Paragraph 1 — Lagna + lord + strongest planet ────────────────────────

  // What does the Lagna lord's house placement *mean* for how they meet the world?
  const lagnaLordHDomain = HOUSE_DOMAIN[lagnaLordH] || 'this life domain';
  const lagnaLordDigNarr = lagnaLordDig
    ? dignityNarrative(lagnaLordDig, lagnaLordSign)
    : `placed in ${lagnaLordSign}`;

  // Describe what the lord's condition means for the Lagna's expression
  let lordMeaning;
  if (lagnaLordDig === 'exalted') {
    lordMeaning = `With ${lagnaLord} ${lagnaLordDigNarr} in the ${ordinal(lagnaLordH)} house, the Lagna's energy finds a particularly clear and capable channel — the native's core orientation toward the world is not just present but genuinely supported, and ${lagnaLordHDomain} is where that orientation expresses itself most concretely and with least obstruction.`;
  } else if (lagnaLordDig === 'own') {
    lordMeaning = `With ${lagnaLord} ${lagnaLordDigNarr} in the ${ordinal(lagnaLordH)} house, the Lagna's fundamental character has a reliable outlet — the native's way of meeting the world can express itself naturally rather than having to push against conditions, and ${lagnaLordHDomain} is where this shows up most clearly in lived experience.`;
  } else if (lagnaLordDig === 'debilitated') {
    lordMeaning = `With ${lagnaLord} ${lagnaLordDigNarr} in the ${ordinal(lagnaLordH)} house, the Lagna's energy reaches the world through a more effortful channel than it might — the native's core orientation is present but finds resistance in ${lagnaLordHDomain}, which means that domain asks for conscious attention rather than assumed ease.`;
  } else {
    lordMeaning = `With ${lagnaLord} placed in ${lagnaLordSign} in the ${ordinal(lagnaLordH)} house, the Lagna's character finds its primary outlet in ${lagnaLordHDomain} — this is where the native's fundamental orientation toward the world shows up most directly in concrete experience.`;
  }

  let p1 = `${lagna.sign} rises in this chart, shaping the native's fundamental way of meeting the world with ${lagna.sign} qualities — the disposition, the instinctive response, the way of carrying oneself. ${lordMeaning}`;

  // Weave in the strongest planet — only if it is a different planet from the Lagna lord
  // (if it IS the Lagna lord, it was already fully described above; repeating it reads as redundant)
  if (strongPlanet && strongPlanet.name !== lagnaLord) {
    const spNature   = PLANET_NATURE[strongPlanet.name] || strongPlanet.name;
    const spDomain   = HOUSE_DOMAIN[strongPlanet.house] || 'its house domain';
    const spDigWord  = strongPlanet.dignity === 'exalted' ? 'exalted' : 'in its own sign';
    const spArticle  = spDigWord === 'exalted' ? 'An' : 'A';
    const spConnects = (strongPlanet.house === lagnaLordH)
      ? `, and the fact that it shares the ${ordinal(lagnaLordH)} house with the Lagna lord compounds this — both point to the same domain as the chart's most capable ground`
      : `, which means the chart's overall picture carries a genuine resource in the domain of ${spDomain}`;
    p1 += ` Running alongside this, ${strongPlanet.name} — ${spNature} — is ${spDigWord} in the ${ordinal(strongPlanet.house)} house${spConnects}. This is not a minor detail: ${spArticle.toLowerCase()} ${spDigWord} ${strongPlanet.name} lends real, dependable capacity to that house's themes and colours the chart's resilience wherever ${strongPlanet.name}'s influence reaches.`;
  }

  // ── Paragraph 2 — Primary friction and how the chart itself addresses it ──

  let p2 = '';
  if (weakPlanet) {
    const wpNature = PLANET_NATURE[weakPlanet.name] || weakPlanet.name;
    const wpDomain = HOUSE_DOMAIN[weakPlanet.house] || 'its house domain';

    // Find planets aspecting the weak planet's house
    const aspectors = (houseReadings.find(r => r.houseNumber === weakPlanet.house)?.aspects || [])
      .filter(a => a.planet !== weakPlanet.name);

    // Find any co-occupants
    const coOccupants = (houseGroups[weakPlanet.house] || []).filter(n => n !== weakPlanet.name);

    p2 = `The chart's primary point of friction is ${weakPlanet.name} — ${wpNature} — debilitated in the ${ordinal(weakPlanet.house)} house. This is not a flaw in the chart or a punishment; it is the specific condition this soul is working through in this life, and it shows up most directly in ${wpDomain}. `;

    if (aspectors.length > 0) {
      const asp = aspectors[0];
      const aspNature = PLANET_NATURE[asp.planet] || asp.planet;
      const aspDig    = dignityReport[asp.planet]?.dignity || '';
      const aspDigStr = aspDig ? ` (${aspDig})` : '';
      p2 += `What the chart also shows, precisely because this reading requires honesty about resources as well as friction, is that ${asp.planet}${aspDigStr} — ${aspNature} — casts its ${asp.aspectType} onto this house from the ${ordinal(asp.fromHouse)}. That aspect does not erase the debilitation, but it means ${weakPlanet.name}'s domain is not without support — the qualities ${asp.planet} brings are available here, and consciously drawing on them is part of what this placement is asking for.`;
    } else if (coOccupants.length > 0) {
      const co = coOccupants[0];
      const coNature = PLANET_NATURE[co] || co;
      const coDig    = dignityReport[co]?.dignity || '';
      const coDigStr = coDig ? ` (${coDig})` : '';
      p2 += `The same house also holds ${co}${coDigStr} — ${coNature} — which means ${weakPlanet.name}'s debilitation does not operate in isolation. The two planets share the same domain, and how that combination is met — whether the friction is avoided or worked through directly — shapes the entire texture of ${wpDomain} in this life.`;
    } else {
      p2 += `The debilitation asks for conscious engagement with ${wpDomain} rather than avoidance — the pattern that tends to repeat in that domain is precisely the one this life is asking to be understood rather than escaped.`;
    }
  } else if (strongPlanet) {
    // No debilitated planet — describe the chart's relative challenge differently
    // Look for a planet in 6, 8, or 12 with no dignity
    const DUSTHANAS = [6, 8, 12];
    let dusthanaPlanet = null;
    for (const name of DIGNITY_PLANETS) {
      const h = planetHouses[name];
      const dig = dignityReport[name]?.dignity;
      if (h && DUSTHANAS.includes(h) && !dig) {
        dusthanaPlanet = { name, house: h };
        break;
      }
    }
    if (dusthanaPlanet) {
      const dpNature = PLANET_NATURE[dusthanaPlanet.name] || dusthanaPlanet.name;
      const dpDomain = HOUSE_DOMAIN[dusthanaPlanet.house] || 'its house domain';
      p2 = `There is no classically debilitated planet in this chart, which is itself significant — the chart's overall dignity picture is relatively supported. The place that asks the most from the native, however, is the ${ordinal(dusthanaPlanet.house)} house, where ${dusthanaPlanet.name} — ${dpNature} — sits without the support of dignity. The ${ordinal(dusthanaPlanet.house)} house governs ${dpDomain}, and ${dusthanaPlanet.name}'s presence there without special strength means that domain requires conscious effort rather than flowing easily. This is not obstruction — it is the chart's honest indication of where genuine work is needed rather than where ease can be assumed.`;
    } else {
      p2 = `There is no classically debilitated planet in this chart. The overall dignity picture is relatively well-supported, which means the chart's challenges tend to emerge from timing and choice rather than from a planet in fundamental difficulty. The areas that ask the most tend to be those where planets occupy the 6th, 8th, or 12th houses — domains that require conscious engagement regardless of a planet's dignity condition.`;
    }
  } else {
    p2 = `This chart carries no planet at either extreme of dignity — no exalted, no debilitated. That in itself is meaningful: the chart's energies are relatively even, without a single dominant strength or a single sharp point of friction. What this tends to produce is a life where development is more gradual and less dramatic, where the work is distributed across multiple areas rather than concentrated, and where the quality of consistent attention over time matters more than any single placement.`;
  }

  // ── Paragraph 3 — Current Dasha moment ───────────────────────────────────

  let p3 = '';
  if (dashaLord) {
    const dlNature  = PLANET_NATURE[dashaLord] || dashaLord;
    const dlDomain  = HOUSE_DOMAIN[dashaLordH] || 'its house domain';
    const dlDigNarr = dashaLordDig ? dignityNarrative(dashaLordDig, planets[dashaLord]?.sign || '?') : '';

    // Does the Dasha lord connect to the strong planet, weak planet, or Lagna lord?
    const connectsToStrong = strongPlanet && dashaLord === strongPlanet.name;
    const connectsToWeak   = weakPlanet   && dashaLord === weakPlanet.name;
    const connectsToLagna  = dashaLord    === lagnaLord;
    const dashaInLagnaLordH = dashaLordH === lagnaLordH;

    let connectionClause = '';
    if (connectsToStrong) {
      connectionClause = ` — and this is significant, because the period that is currently running belongs to the very planet identified above as the chart's primary strength. What that means in practice is that this is not a neutral window: the Dasha is activating the chart's most capable energy directly, and the themes of the ${ordinal(dashaLordH)} house are not background noise right now but the centre of what this period is asking to be built`;
    } else if (connectsToWeak) {
      connectionClause = ` — and this matters precisely because the Dasha lord is the same planet whose debilitation was described above. The period currently running is not adding a new theme; it is bringing the chart's primary friction directly to the surface. This is a window that asks for honest engagement with ${dlDomain} rather than avoidance, because the chart is, right now, making that the unavoidable territory`;
    } else if (connectsToLagna) {
      connectionClause = `, and since ${dashaLord} is also the lord of this Lagna, the current period is activating the native's most fundamental orientation directly — the themes of ${dlDomain} are not incidental to the Dasha but connected to the core of who this person is working to become`;
    } else if (dashaInLagnaLordH) {
      connectionClause = `. The Dasha lord occupies the same house as the Lagna lord, which means the current period is drawing attention into a domain that already carries the chart's primary outward orientation — the two themes are running together right now rather than separately`;
    } else {
      connectionClause = `. Whether the native has named it this way or not, the conditions of ${dlDomain} are not arbitrary right now — the chart is making that domain the active territory for this period, and the quality of engagement with it shapes what accumulates for the periods that follow`;
    }

    const dlDigClause = dlDigNarr ? ` (${dlDigNarr})` : '';
    p3 = `The current Maha Dasha is ${dashaLord} — ${dlNature}${dlDigClause} — sitting in the ${ordinal(dashaLordH)} house and activating ${dlDomain}${connectionClause}.`;
  }

  // ── Paragraph 4 — D9 + other Varga + closing ─────────────────────────────

  const vargaObs = buildVargaObservation(varga, lagna, planets, dignityReport, lagnaLord);

  // Closing sentence — specific to this chart's actual orientation, not a substituted template.
  // It names what this Lagna + lord combination is oriented toward, then what the chart's
  // primary condition (strength or friction) means for how that direction is walked.
  const lagnaLordHDomainClose = HOUSE_DOMAIN[lagnaLordH] || 'its primary domain';
  let closingSentence;
  if (weakPlanet && strongPlanet) {
    // Both a clear strength and a clear friction — the chart is asking to hold both
    const wpDomainClose = HOUSE_DOMAIN[weakPlanet.house] || 'its domain';
    const spDomainClose = HOUSE_DOMAIN[strongPlanet.house] || 'its domain';
    closingSentence = `What this chart is ultimately asking for is a specific kind of honesty: to draw on the genuine capacity ${strongPlanet.name} makes available in the domain of ${spDomainClose}, while doing the actual work ${weakPlanet.name}'s debilitation is pointing toward in ${wpDomainClose} — not one or the other, but both together, which is precisely what ${lagna.sign} rising with ${lagnaLord} in the ${ordinal(lagnaLordH)} house asks of this particular life. The terrain is set. How it is walked remains entirely the native's own.`;
  } else if (weakPlanet) {
    // Friction dominant, no clear strong planet
    const wpDomainClose = HOUSE_DOMAIN[weakPlanet.house] || 'its domain';
    closingSentence = `What this chart is ultimately asking for is conscious engagement with ${wpDomainClose} — not avoidance of what ${weakPlanet.name}'s debilitation makes difficult, but the kind of honest, sustained attention that turns that difficulty into genuine understanding. That is the specific work ${lagna.sign} rising with ${lagnaLord} in the ${ordinal(lagnaLordH)} house has brought into this life. The terrain is set. How it is walked remains entirely the native's own.`;
  } else if (strongPlanet) {
    // Strength present, no debilitation — the chart asks to build from that ground
    const spDomainClose = HOUSE_DOMAIN[strongPlanet.house] || 'its domain';
    closingSentence = `What this chart is ultimately asking for is that the native build from the genuine ground ${strongPlanet.name} provides in ${spDomainClose} — not taking that capacity for granted, but using it as the foundation from which the rest of the chart's work becomes possible. That is the specific direction ${lagna.sign} rising with ${lagnaLord} in the ${ordinal(lagnaLordH)} house has oriented this life toward. The terrain is set. How it is walked remains entirely the native's own.`;
  } else {
    // Neither extreme — the chart asks for steady, distributed engagement
    closingSentence = `What this chart is ultimately asking for is the kind of steady, honest attention that a chart without extremes requires — not the dramatic confrontation a debilitated planet demands, not the clear resource an exalted planet provides, but the more distributed work of meeting each domain on its own terms. That is the specific shape ${lagna.sign} rising with ${lagnaLord} in the ${ordinal(lagnaLordH)} house gives to this life. The terrain is set. How it is walked remains entirely the native's own.`;
  }

  // ── Assemble ──────────────────────────────────────────────────────────────

  const paragraphs = [p1, p2];
  if (p3) paragraphs.push(p3);
  if (vargaObs) paragraphs.push(vargaObs);
  paragraphs.push(closingSentence);

  return paragraphs.join('\n\n');
}

// ---------------------------------------------------------------------------
// buildChartReport — main export
// ---------------------------------------------------------------------------

/**
 * Builds a complete structured report from chart data.
 *
 * @param {object} chartData - Full chart data (see JSDoc at top of file)
 * @returns {object} Structured report
 */
export function buildChartReport(chartData) {
  const { lagna, planets, dashas, yogas, dignityReport } = chartData;

  // Build planet houses map from dignityReport (which has house numbers)
  const planetHouses = {};
  for (const [name, data] of Object.entries(dignityReport || {})) {
    if (data.houseNumber) planetHouses[name] = data.houseNumber;
  }

  // Merge dignity/retrograde data into planets for reading functions
  const enrichedPlanets = {};
  for (const [name, planet] of Object.entries(planets || {})) {
    enrichedPlanets[name] = {
      ...planet,
      dignity:     dignityReport?.[name]?.dignity,
      isRetrograde: planet.isRetrograde || dignityReport?.[name]?.isRetrograde,
    };
  }

  // ── Lagna reading ──
  const lagnaReading = buildLagnaReading(lagna, enrichedPlanets, planetHouses);

  // ── House readings — all 12, noting occupants and aspects ──
  const houseReadings = [];
  const lagnaSignIdx  = SIGNS_ORDER.indexOf(lagna.sign);

  for (let h = 1; h <= 12; h++) {
    const signIdx  = (lagnaSignIdx + h - 1) % 12;
    const sign     = SIGNS_ORDER[signIdx];
    const lord     = SIGN_LORD[sign];
    const lordH    = planetHouses[lord];
    const lordSign = enrichedPlanets[lord]?.sign || '?';
    const lordPlacement = lordH ? `in ${lordSign} in the ${ordinal(lordH)} house` : '';

    // Find planets in this house
    const occupants = Object.entries(planetHouses)
      .filter(([, hNum]) => hNum === h)
      .map(([name]) => name);

    // Get aspects
    const aspects = getAspects(h, planetHouses);

    // Only include in report if occupied OR aspected (skip completely empty/unaspected)
    const isActive = occupants.length > 0 || aspects.length > 0;

    const reading = buildHouseReading(h, sign, occupants, aspects, lordPlacement, enrichedPlanets);

    houseReadings.push({
      houseNumber:  h,
      sign,
      lord,
      lordSign,
      lordHouse:    lordH || null,
      lordPlacement,
      occupants,
      aspects,
      isActive,
      reading,
    });
  }

  // ── Dasha reading ──
  const dashaReading = buildDashaReading(dashas?.current, enrichedPlanets, planetHouses);

  // ── Yoga readings ──
  const yogaReadings = yogas ? buildYogaReading(yogas) : [];

  // ── Summary ──
  const summary = buildSummary(lagnaReading, houseReadings, dashaReading, lagna, enrichedPlanets, planetHouses, dignityReport, chartData.varga);

  return {
    lagnaReading,
    houseReadings,
    dashaReading,
    yogaReadings,
    summary,
    closingNote: CONTENT.closingNote,
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function ordinal(n) {
  if (!n || isNaN(n)) return n || '?';
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
