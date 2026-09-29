/* Generates the layer markup for src/_includes/components/wave-divider.html.
 *
 * THE COMPONENT IS A BREAKING WAVE, NOT A CROSSFADE. Three layers of water —
 * foam, shallows, deep — surge up out of the section below, spread apart into a
 * layered wave face at their peak, and then collapse back down into a single
 * flat plane of the destination colour. #speed is the ocean; the divider is the
 * wave that breaks against the edge of it.
 *
 * The order is the whole effect and it is not symmetric:
 *
 *   BUILD    foam leads, then the shallows, then the deep water — a wave's
 *            crest reaches you before its body does.
 *   PEAK     all three are spread apart, each one's top edge at a different
 *            height, so you read three distinct bands stacked into a wave face.
 *   COLLAPSE the DEEP water goes first and the foam lingers longest, which is
 *            water draining off a beach. The deep band settles to exactly fill
 *            the divider while foam is still up in the section above, so for a
 *            moment there is a thin foam crest riding on a finished navy line.
 *            Then it sinks behind the deep band and the divider is flat.
 *
 * That asymmetry is bought with ONE mechanism and no extra keyframes: the three
 * bands get NESTED animation ranges, widest for foam. A wider range starting
 * earlier and ending later is exactly "leads the build, lags the collapse".
 * See the ranges in local.less.
 *
 * Each layer is a solid BODY with a separate wave CREST welded to its top edge.
 * Both move. The bodies translate — that is the water level, and it is what
 * decides where a band sits in the stack at peak. The crests scale from nothing
 * to full and back to nothing on top of that, so the waves GROW as the water
 * rises and are perfectly flat at both ends of the pass. That last zero is load
 * bearing: it is why the finished divider is a flat block of colour and not a
 * shape with a permanent wavy edge.
 *
 * Why body and crest are two elements rather than one morphing path: scaling
 * one path would scale its fill along with its wave line, and animating the
 * path `d` instead is not compositable — it repaints on the main thread on
 * every scroll event. Split, the entire effect is `transform`, which the
 * compositor owns.
 *
 *   node scripts/build-wave-divider.js        # prints the layer elements
 *
 * Paste the output between the markers in the include. Geometry only — colour
 * is --waveFoam / --waveMid / --waveDeep in root.less and every position and
 * time is in local.less, so neither a palette change nor a tuning change comes
 * back here.
 */

const CREST_W = 2880; // crest viewBox width. The crest ELEMENT is drawn at
                      // twice the divider's width, so only the middle half is
                      // ever on screen and the sideways drift can never expose
                      // an end. That margin is also why the drift needs no
                      // relation to the wave period — it shifts the phase, it
                      // does not tile.
const CREST_H = 48;   // crest viewBox height. The rendered height is --crestH
                      // in local.less; preserveAspectRatio="none" squashes to
                      // fit, so a short mobile divider gets shallower waves
                      // rather than cropped ones.
const BASE = 24;      // the crest's resting waterline within its own box
const FLOOR = 60;     // crests fill BELOW their own box on purpose — see the
                      // overflow note on .cs-wave-crest in local.less.

/* period — one full wave in crest units. CREST_W / period / 2 is how many
 *          crests cross the divider, since the element is twice its width.
 * amp    — the crest's swing either side of BASE.
 *          ⚠ MUST NOT EXCEED BASE. The curve peaks at exactly BASE - amp, so
 *          an amp above BASE puts the crest above its own viewBox; the SVG is
 *          overflow:visible so it paints there happily, and the DIVIDER's
 *          clip-path is then what stops it — shearing every peak off flat.
 *          That reads as corners on the wave, and nothing errors. Waviness is
 *          --crestH's job, not this one: the rendered swing is
 *          (amp / CREST_H) x --crestH, so raise the crest to get a bigger wave
 *          and leave this alone. Asserted below.
 * phase  — offsets the layer so the three never crest in step.
 *
 * Shallow water is choppy and deep water runs in long slow swells, so the
 * period LENGTHENS and the amplitude DROPS as you go down the stack. Getting
 * this backwards reads as three copies of one wave rather than as depth.
 *
 * Order is paint order, shallowest first. The deep layer is drawn LAST and
 * therefore owns the finished state: when it settles it covers the other two
 * completely and the divider becomes a flat block of --waveDeep. That is why
 * --waveDeep must equal the destination section's background EXACTLY — it does
 * not sit next to that colour, it becomes it. */
const LAYERS = [
	{ cls: "cs-wave-foam", fill: "--waveFoam", period: 400, amp: 22, phase: 0 },
	{ cls: "cs-wave-mid", fill: "--waveMid", period: 540, amp: 19, phase: 210 },
	{ cls: "cs-wave-deep", fill: "--waveDeep", period: 660, amp: 15, phase: 95 },
];

/* A half-period of a sine as one cubic. The control points sit at 0.3642 and
 * 0.6358 of the span so the curve's midpoint lands at the true midpoint; the
 * 4/3 on the amplitude is what makes it reach the peak there (a Bezier at
 * t=0.5 is 3/8 of each control, and 3/8 + 3/8 of 4/3*A is exactly A). Error
 * against a real sine is under 1%, which no one will measure on a wave. */
const CX1 = 0.3642, CX2 = 0.6358, CY = 4 / 3;

const r = (n) => Math.round(n * 10) / 10;

/* The amp <= BASE rule above, enforced — this failed silently once and cost a
 * round trip, because a clipped sine still looks like a wave until you notice
 * every peak is the same flat height. */
for (const l of LAYERS) {
	if (l.amp > BASE) {
		console.error(`${l.cls}: amp ${l.amp} exceeds BASE ${BASE} — crests will clip flat.`);
		process.exit(1);
	}
}

function crestPath({ period, amp, phase }) {
	const half = period / 2;
	// Start at the last zero crossing at or before 0, so the first arch is whole.
	const startX = phase + Math.floor((0 - phase) / half) * half;
	// Crossings alternate rising and falling; work out which one this is.
	let up = Math.abs(Math.round((startX - phase) / half)) % 2 === 0;

	let x = startX;
	const d = [`M ${r(x)} ${BASE}`];
	while (x < CREST_W) {
		const cy = r(BASE - (up ? 1 : -1) * amp * CY);
		d.push(`C ${r(x + half * CX1)} ${cy} ${r(x + half * CX2)} ${cy} ${r(x + half)} ${BASE}`);
		x += half;
		up = !up;
	}
	d.push(`L ${r(x)} ${FLOOR}`, `L ${r(startX)} ${FLOOR}`, "Z");
	return d.join(" ");
}

console.log(LAYERS.map((l) => [
	`\t<div class="cs-wave-band ${l.cls}" style="color: var(${l.fill})">`,
	`\t\t<svg class="cs-wave-crest" viewBox="0 0 ${CREST_W} ${CREST_H}" preserveAspectRatio="none" focusable="false" role="presentation">`,
	`\t\t\t<path d="${crestPath(l)}"/>`,
	`\t\t</svg>`,
	`\t</div>`,
].join("\n")).join("\n"));
