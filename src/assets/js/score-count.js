/* ─────────────────────────────────────────────────────────────────────────────
   SCORE COUNT — the home page's Lighthouse scorecard, counting up
   ─────────────────────────────────────────────────────────────────────────────
   Drives #speed's four gauges. The rings are drawn by CSS (see the "ring draw"
   block in local.less); this file owns the digits, and owns the two class names
   that start both.

   ── Nothing here is allowed to hide content it then fails to show ──
   Same contract text-rise.js sets out, for the same reason. The stylesheet's
   resting state is the FINISHED scorecard: rings complete, real numbers in the
   markup. This script is what puts it back to zero, by adding .cs-scores-primed.
   No script, a 404, a parse error, an old browser, reduced motion: the classes
   never land, nothing is ever hidden, and the section is simply the section.
   Arming from the stylesheet instead would be one broken bundle away from four
   empty circles and four zeroes.

   ── Why the digits are not CSS too ──
   @property + counter() can animate an integer without script, and it was the
   first thing tried. It renders the number through `content`, which means the
   real score stops being text in the document — bad for a screen reader, bad
   for anything reading the page without running it, and the whole argument of
   this section is that the numbers are real and checkable. The number stays in
   the markup; this only animates it and puts it back.

   ── One clock ──
   The ring draw is a time-based CSS animation rather than a view() scroll
   timeline (the ferry and the orcas use those). That is deliberate: these digits
   run on rAF, and a scroll-driven ring would run on scroll position. The two
   would visibly disagree. DURATION and the per-ring DELAYS below are duplicated
   in local.less — change one, change the other.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    var SECTION = "speed";
    var PRIMED = "cs-scores-primed";
    var ARMED = "cs-scores-armed";

    /* Must match the ring-draw rules in local.less. */
    var DURATION = 1150;
    var STAGGER = 100;

    /* Reduced motion: never prime, so nothing is ever hidden and the scorecard
       is simply already finished. Same for a browser with no IntersectionObserver
       — without it there is no honest moment to start, and a count-up that fires
       on load would have finished before the section was ever on screen. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    if (!window.requestAnimationFrame) return;

    function init() {
        var section = document.getElementById(SECTION);
        if (!section) return;

        var numbers = [].slice.call(section.querySelectorAll(".cs-number"));
        if (!numbers.length) return;

        /* The truth lives in data-score, written from _data/lighthouse.js. Read
           it before anything is zeroed, and skip any gauge that somehow has no
           parseable score rather than blanking it. */
        var targets = [];
        for (var i = 0; i < numbers.length; i++) {
            var raw = parseInt(numbers[i].getAttribute("data-score"), 10);
            if (isNaN(raw)) return;
            targets.push(raw);
        }

        /* ── prime ── */
        for (var j = 0; j < numbers.length; j++) numbers[j].textContent = "0";
        section.classList.add(PRIMED);

        var played = false;

        var io = new IntersectionObserver(
            function (entries) {
                for (var k = 0; k < entries.length; k++) {
                    if (!entries[k].isIntersecting || played) continue;
                    played = true;
                    io.disconnect();
                    play();
                }
            },
            /* a third of the band showing. The rings sit under the copy, so
               firing at the very first pixel would spend the animation while
               the scores are still below the fold. */
            { threshold: 0.35 }
        );
        io.observe(section);

        function play() {
            section.classList.add(ARMED);

            var start = null;

            /* easeOutCubic. The rings use cubic-bezier(.22,.61,.36,1), which
               this tracks closely enough that no frame of a 0-100 integer ever
               disagrees — not worth a bezier solver to close the gap. */
            function ease(t) {
                return 1 - Math.pow(1 - t, 3);
            }

            function frame(now) {
                if (start === null) start = now;
                var elapsed = now - start;
                var running = false;

                for (var n = 0; n < numbers.length; n++) {
                    var t = (elapsed - n * STAGGER) / DURATION;

                    if (t <= 0) {
                        running = true;
                        continue;
                    }

                    if (t >= 1) {
                        /* land on the exact figure from the markup, never on
                           whatever the easing rounded to */
                        numbers[n].textContent = String(targets[n]);
                        continue;
                    }

                    running = true;
                    numbers[n].textContent = String(Math.round(ease(t) * targets[n]));
                }

                if (running) window.requestAnimationFrame(frame);
            }

            window.requestAnimationFrame(frame);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
