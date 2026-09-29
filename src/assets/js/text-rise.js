/* ─────────────────────────────────────────────────────────────────────────────
   TEXT RISE — per-line masked reveals, and the scroll trigger for them
   ─────────────────────────────────────────────────────────────────────────────
   Two behaviours, both opt-in from the markup:

     .cs-rise-lines   split my text into its rendered LINES, put each one in its
                      own clipping window, and slide them up through it. Type
                      only: headings and body copy.
     .cs-fade-in      fade my direct CHILDREN up by a little, staggered. Cards,
                      button rows, toppers - anything that is a box rather than
                      running text.

   Why both, rather than masking everything: a mask has to cut tight to the type
   or it is not a mask, and a tight cut is wrong for anything with a shape of its
   own. A topper pill loses its rounded ends, a card loses its shadow, a button
   loses the focus ring that sits 4px outside it. clarvos.com - the reference for
   this whole effect - draws exactly the same line: its headings and paragraphs
   are split and masked, its button rows and its artwork are a plain fade.

   ── Nothing here is allowed to hide content it then fails to show ──
   This script ARMS the hidden state itself, by putting .cs-rise-armed on <html>.
   No script, a 404, a parse error, an older browser: the class never lands, the
   CSS that hides anything never applies, and the page is simply the page. That
   is also why the arming is not in the stylesheet - a CSS-armed reveal that
   waits on JS is one broken bundle away from a blank page.

   ── Why not GSAP + ScrollTrigger, which is what the reference uses ──
   The public site makes zero third-party requests, which is a claim
   /privacy-policy/ makes in so many words. SplitText and ScrollTrigger are ~70KB
   from a CDN to do what IntersectionObserver and a stylesheet already do.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    var LINES = "cs-rise-lines";
    var FADE = "cs-fade-in";

    /* Reduced motion: never arm, never split. Splitting is not itself motion,
       but it rebuilds a paragraph out of block-level lines, and there is no
       reason to take that risk for someone who will see no animation from it. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    var splits = []; // { el, html } - the untouched markup, for re-splitting

    /* ── 1. every word becomes a span ──
       Measured individually below. Whitespace runs collapse to a single text
       node, which distribute() reads as "there was a space here" when it
       reassembles the lines. */
    function wrapWords(el) {
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var texts = [];
        var n;
        while ((n = walker.nextNode())) texts.push(n);

        texts.forEach(function (t) {
            if (!t.nodeValue.trim()) return;
            var frag = document.createDocumentFragment();
            t.nodeValue.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    frag.appendChild(document.createTextNode(" "));
                    return;
                }
                var w = document.createElement("span");
                w.className = "cs-w";
                w.textContent = part;
                frag.appendChild(w);
            });
            t.parentNode.replaceChild(frag, t);
        });
    }

    /* ── 2. group the words into lines by where they actually landed ──
       This is the whole reason the split cannot be done in the markup: where a
       paragraph breaks depends on the width it is being read at, so it has to
       be measured after layout and re-measured whenever that width changes.

       The tolerance is half a line: two words on one line can report tops a
       pixel or two apart when their inline boxes differ (a <span> at a smaller
       size, a superscript), and a hard `!==` would call that a line break. */
    function assignLines(el) {
        var words = el.querySelectorAll(".cs-w");
        if (!words.length) return 0;

        var lh = parseFloat(window.getComputedStyle(el).lineHeight);
        var tol = Math.max(4, (lh > 0 ? lh : 16) * 0.5);

        var line = 0;
        var lineTop = null;
        for (var i = 0; i < words.length; i++) {
            var top = words[i].getBoundingClientRect().top;
            if (lineTop === null) lineTop = top;
            else if (top - lineTop > tol) {
                line++;
                lineTop = top;
            }
            words[i].setAttribute("data-line", line);
        }
        return line + 1;
    }

    /* ── 3. move the words into their line, rebuilding any inline markup ──
       A line can start inside an <a> or a <span class="cs-accent"> and finish
       outside it, so an element that spans two lines is CLONED onto each one
       rather than moved. Recursive, because that nesting can be arbitrary.

       state.space carries "the source had whitespace here" across the recursion,
       so `homepage. <span>Free.</span>` keeps its space and a hypothetical
       `homepage.<span>Free.</span>` does not gain one. */
    function distribute(src, targetFor, state) {
        var kids = [].slice.call(src.childNodes);

        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];

            if (k.nodeType === 3) {
                state.space = true;
                continue;
            }
            if (k.nodeType !== 1) continue;

            /* the lines are separate blocks now, so an explicit break has
               nothing left to do */
            if (k.tagName === "BR") {
                state.space = false;
                continue;
            }

            /* ⚠ An existing .cs-rise-in is the stylesheet's own block-level
               fallback (see #hero .cs-text), not part of the sentence. Recurse
               THROUGH it without cloning. Cloned onto each line it would nest a
               second traveller inside each new one, and because the hero gives
               every .cs-rise-in an animation-name, BOTH would run - 115% inside
               another 115%, so the paragraph starts twice as far down as it
               should and arrives late. */
            if (k.classList.contains("cs-rise-in") || k.classList.contains("cs-rise")) {
                distribute(k, targetFor, state);
                continue;
            }

            if (k.classList.contains("cs-w")) {
                var target = targetFor(+k.getAttribute("data-line"));
                if (state.space && target.childNodes.length) {
                    target.appendChild(document.createTextNode(" "));
                }
                state.space = false;
                target.appendChild(k);
                continue;
            }

            (function (node) {
                var clones = {};
                var pending = state.space;
                distribute(
                    node,
                    function (line) {
                        if (!clones[line]) {
                            var clone = node.cloneNode(false);
                            var t = targetFor(line);
                            if (pending && t.childNodes.length) {
                                t.appendChild(document.createTextNode(" "));
                            }
                            pending = false;
                            t.appendChild(clone);
                            clones[line] = clone;
                        }
                        return clones[line];
                    },
                    state
                );
            })(k);
        }
    }

    function split(el, html) {
        if (el.classList.contains("is-split")) return false;
        wrapWords(el);
        var count = assignLines(el);
        if (!count) return false;

        var inners = [];
        var masks = [];
        for (var i = 0; i < count; i++) {
            var mask = document.createElement("span");
            mask.className = "cs-rise";
            var inner = document.createElement("span");
            inner.className = "cs-rise-in";
            /* the per-line stagger, read by the stylesheet */
            inner.style.setProperty("--rise-i", i);
            mask.appendChild(inner);
            masks.push(mask);
            inners.push(inner);
        }

        distribute(el, function (line) { return inners[line]; }, { space: false });

        /* A trailing space on every line but the last. The lines are separate
           blocks, so they LOOK right without it - but the text is now one run
           of words with no separator between "being" and "your", which breaks
           find-in-page and pastes as "stops beingyour problem". A trailing
           space at the end of a line box is collapsed away by normal
           white-space handling, so it costs nothing visually and nothing in
           layout. Verified: zero position change on every split element. */
        for (var t = 0; t < inners.length - 1; t++) {
            inners[t].appendChild(document.createTextNode(" "));
        }

        el.textContent = "";
        masks.forEach(function (m) { el.appendChild(m); });

        /* The element becomes a flex column so the masks' descender padding
           cancels against its negative margin instead of collapsing into the
           line above (see .cs-rise in root.less). Flex needs to be told how to
           align, and the answer is whatever the text alignment already was -
           hardcoding flex-start would left-align every centred section on the
           page. */
        var align = window.getComputedStyle(el).textAlign;
        el.style.alignItems =
            align === "center" ? "center"
                : (align === "right" || align === "end") ? "flex-end"
                    : "flex-start";

        el.classList.add("is-split");

        /* ── the split has to be CHECKED, not assumed ──
           Every line here was measured inside the running paragraph and is now
           in a box of its own, and those two are only the same thing while no
           word can break in the middle. `.cs-w { white-space: nowrap }` in
           root.less is what holds that - see the note there - but a word wider
           than the container still has nowhere to go, and a line that re-wraps
           inside a mask built for one line is worse than no split at all: the
           mask clips, so the second line is cut off rather than merely ugly.

           So measure. A mask taller than about one and a half line-heights
           wrapped, and the whole element goes back to plain text and keeps the
           block-level rise the stylesheet already gives it. Silent, correct,
           and self-healing on the next resize. */
        if (html !== undefined) {
            var lh = parseFloat(window.getComputedStyle(el).lineHeight) || 0;
            if (lh > 0) {
                var wrapped = masks.some(function (m) {
                    return m.getBoundingClientRect().height > lh * 1.6;
                });
                if (wrapped) {
                    el.innerHTML = html;
                    el.classList.remove("is-split");
                    el.style.alignItems = "";
                    return false;
                }
            }
        }

        return true;
    }

    function restore(rec) {
        rec.el.innerHTML = rec.html;
        rec.el.classList.remove("is-split");
        rec.el.style.alignItems = "";
    }

    /* ── the scroll trigger ──
       Fires once per element and then stops watching it: these are entrances,
       not something to replay on the way back up. The negative bottom margin
       holds the reveal until the element is properly into the viewport rather
       than firing on the first pixel, which on a long page reads as things
       finishing their animation just before you get to them. */
    var io = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
            });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    function trySplit(el) {
        /* #hero runs its entrance off the stylesheet on load, not off the
           scroll, and this script is deferred - so by the time we get here that
           animation may already be under way. Rebuilding a paragraph mid-flight
           would jump it, because a block translated as one unit and the same
           block translated line by line are not in the same place at the same
           moment.

           getAnimations() answers that exactly rather than by guessing at a
           time budget: an animation still inside its delay reports a
           currentTime of 0 or less, and only then is it safe to swap the
           structure out from under it. Miss the window and the element simply
           keeps the block-level rise the stylesheet already gave it, which is
           the same effect at a coarser grain. */
        var started = [].slice
            .call(el.querySelectorAll(".cs-rise-in"))
            .some(function (inner) {
                return inner.getAnimations().some(function (a) {
                    return a.currentTime !== null && a.currentTime > 0;
                });
            });
        if (started) return;

        var html = el.innerHTML;
        if (split(el, html)) splits.push({ el: el, html: html });
    }

    function run() {
        [].slice.call(document.querySelectorAll("." + LINES)).forEach(trySplit);

        /* Arm only AFTER splitting. Arming first would hide the lines that do
           not exist yet, and a failed split would leave the element hidden with
           nothing to reveal. */
        document.documentElement.classList.add("cs-rise-armed");

        [].slice
            .call(document.querySelectorAll("." + LINES + ", ." + FADE))
            .forEach(function (el) {
                /* Anything already on screen when the script lands has missed
                   its entrance - reveal it outright rather than waiting for a
                   scroll that may never come. */
                var box = el.getBoundingClientRect();
                if (box.top < window.innerHeight && box.bottom > 0) {
                    el.classList.add("is-in");
                    return;
                }
                io.observe(el);
            });
    }

    /* Re-split on a real width change. Height changes are the mobile URL bar
       and must not trigger this, or every scroll on a phone rebuilds the page. */
    var lastWidth = window.innerWidth;
    var resizeTimer;
    window.addEventListener("resize", function () {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            splits.forEach(function (rec) {
                var wasIn = rec.el.classList.contains("is-in");
                restore(rec);
                split(rec.el, rec.html);
                /* the entrance already happened; the new lines must not replay
                   it, they just need to be visible */
                if (wasIn) rec.el.classList.add("is-in");
            });
        }, 150);
    });

    /* ── when to measure ──
       Lines are measured, so the measurement has to be of the REAL typeface:
       split against the fallback and every break lands in the wrong place.
       That normally means waiting for document.fonts.ready.

       The hero cannot afford that wait. Its entrance is already running off the
       stylesheet by then, and trySplit() correctly refuses to rebuild an
       animation in flight - so on a slow font load the hero paragraph silently
       kept the coarser block-level rise.

       fonts.ready waits for EVERY face on the page (three families, several
       weights). The hero paragraph needs exactly one: Inter 400, which is
       preloaded in base.html. document.fonts.check answers that synchronously,
       so when the face is already there - the common case, same origin and
       preloaded - the hero splits in this same tick, long before its 286ms
       delay is up. Everything else still waits for the full set. */
    function heroReady() {
        try {
            return !!(document.fonts && document.fonts.check && document.fonts.check('400 1rem "Inter"'));
        } catch (e) {
            return false;
        }
    }

    function runHero() {
        [].slice.call(document.querySelectorAll("#hero ." + LINES)).forEach(trySplit);
    }

    if (heroReady()) runHero();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(run);
    } else {
        run();
    }
})();
