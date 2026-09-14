// This file is included via a duplicated <script src="study.js"> tag on
// several saved pages, so everything below must be guarded to run only once
// per page load — otherwise every listener (tab switching, accordion
// collapse, etc.) is registered twice and a single click fires twice too,
// which for the collapse toggles means "open" immediately followed by
// "close", i.e. clicking appears to do nothing.
if (window.__studyJsInitialized) {
    console.log('[study.js] already initialized on this page, skipping duplicate load');
} else {
    window.__studyJsInitialized = true;

// Minimal jQuery-compatible `$` shim. These saved pages don't load jQuery,
// but a few inline onclick/onkeyup handlers (e.g. the Course Navigator /
// Take Notes tab switcher: `$('[tab-id]').removeClass(...)`) still call
// `$(...)`, so without this they throw "$ is not defined" and never run.
// Only the handful of jQuery methods those handlers actually use are
// implemented.
if (typeof window.$ === 'undefined') {
    window.$ = function (selectorOrEl) {
        var els = typeof selectorOrEl === 'string'
            ? Array.prototype.slice.call(document.querySelectorAll(selectorOrEl))
            : [selectorOrEl];

        return {
            addClass: function (cls) {
                els.forEach(function (el) { el.classList.add(cls); });
                return this;
            },
            removeClass: function (cls) {
                els.forEach(function (el) { el.classList.remove(cls); });
                return this;
            },
            attr: function (name) {
                return els[0] ? els[0].getAttribute(name) : undefined;
            }
        };
    };
}

// Captured synchronously (document.currentScript is only valid while this
// script is executing, not later inside an event callback) so the local-link
// rewriter below — which runs on DOMContentLoaded — can still tell which URL
// this file itself was loaded from.
var STUDY_JS_SCRIPT_EL = document.currentScript || document.querySelector('script[src$="study.js"]');

console.log('[study.js] script loaded');

document.addEventListener('DOMContentLoaded', function () {

    console.log('[study.js] DOM loaded');

    function switchTab(link) {
        const tabContainer = document.querySelector(
            '[test-id="page_tabs_container"]'
        );

        const contentContainer = document.querySelector(
            '#lessonPageContent'
        );

        if (!tabContainer) {
            console.error('[study.js] page_tabs_container not found');
            return;
        }

        if (!contentContainer) {
            console.error('[study.js] lessonPageContent not found');
            return;
        }

        const targetSelector = link.getAttribute('data-target');

        if (!targetSelector) {
            console.error('[study.js] No data-target found');
            return;
        }

        console.log(
            '[study.js] Switching to:',
            targetSelector
        );

        // Find the target tab pane
        const targetPane = contentContainer.querySelector(
            targetSelector
        );

        if (!targetPane) {
            console.error(
                '[study.js] Target pane not found:',
                targetSelector
            );
            return;
        }

        // Remove active and visible state from all tabs and panes
        tabContainer
            .querySelectorAll('li')
            .forEach(function (li) {
                li.classList.remove('active');
            });

        contentContainer
            .querySelectorAll('.tab-pane')
            .forEach(function (pane) {
                pane.classList.remove('active', 'in', 'show');
                pane.style.display = 'none';
            });

        // Activate clicked tab
        const li = link.closest('li');

        if (li) {
            li.classList.add('active');
        }

        // Activate target pane and make it visible
        targetPane.classList.add('active', 'in', 'show');
        targetPane.style.display = 'block';

        // If this is the quiz pane, trigger the custom renderer (if present)
        try {
            if (targetSelector === '#quizTab' && window.buildCustomQuizRenderer) {
                window.buildCustomQuizRenderer();
            }
        } catch (e) {
            // ignore
        }

        console.log(
            '[study.js] Activated:',
            targetSelector
        );
    }


    // Handle tab clicks
    document.addEventListener('click', function (event) {

        const link = event.target.closest(
            '[test-id="page_tabs_container"] a[data-target]'
        );

        if (!link) {
            return;
        }

        console.log(
            '[study.js] Tab clicked:',
            link.getAttribute('test-id'),
            link.getAttribute('data-target')
        );

        event.preventDefault();
        event.stopPropagation();

        switchTab(link);

    }, true);


    // Manual tab switching function
    window.switchStudyTab = function (targetSelector) {

        const link = document.querySelector(
            '[test-id="page_tabs_container"] a[data-target="' +
            targetSelector +
            '"]'
        );

        if (!link) {
            console.error(
                '[study.js] Tab not found:',
                targetSelector
            );
            return;
        }

        switchTab(link);
    };

});

// Addition-tabs: simple tab switching for sections using #addition-tabs
document.addEventListener('DOMContentLoaded', function () {
    var tabsRoot = document.getElementById('addition-tabs');
    if (!tabsRoot) return;

    // find the nearest .tab-content sibling/container
    function findContentContainer(root) {
        if (!root) return document.body;
        // prefer a .tab-content that follows the tabs list
        var node = root.nextElementSibling;
        var steps = 0;
        while (node && steps < 30) {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tab-content')) return node;
            node = node.nextElementSibling;
            steps++;
        }
        // try parent search
        var parent = root.parentElement;
        while (parent) {
            var found = parent.querySelector && parent.querySelector('.tab-content');
            if (found) return found;
            parent = parent.parentElement;
        }
        // fallback to document-level
        return document.querySelector('.tab-content') || document.body;
    }

    var contentContainer = findContentContainer(tabsRoot);

    function hideAllPanes() {
        // hide any element that looks like a tab pane within the container
        try {
            Array.prototype.forEach.call(contentContainer.querySelectorAll('.tab-pane'), function (pane) {
                pane.classList.remove('active', 'in', 'show');
                pane.style.display = 'none';
            });
        } catch (e) { }
    }

    function showPane(targetSelector) {
        if (!targetSelector) return;
        hideAllPanes();

        // normalize selector (allow '#id' or 'id')
        var sel = targetSelector.trim();
        var pane = null;
        if (sel.charAt(0) === '#') {
            pane = document.getElementById(sel.slice(1));
        } else {
            pane = document.getElementById(sel) || contentContainer.querySelector(sel);
        }

        if (pane) {
            pane.classList.add('active', 'in', 'show');
            pane.style.display = 'block';
        }
    }

    function handleActivation(li) {
        if (!li) return;
        // deactivate siblings
        tabsRoot.querySelectorAll('li.tab').forEach(function (sib) { sib.classList.remove('active'); });
        li.classList.add('active');
        var target = li.getAttribute('data-target');
        showPane(target);
    }

    // click / keyboard delegation
    tabsRoot.addEventListener('click', function (ev) {
        var li = ev.target.closest('li.tab');
        if (!li) return;
        ev.preventDefault();
        handleActivation(li);
    });

    tabsRoot.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        var li = ev.target.closest('li.tab');
        if (!li) return;
        ev.preventDefault();
        handleActivation(li);
    });

    // initialize from any .active on load
    var initial = tabsRoot.querySelector('li.tab.active');
    if (initial) {
        handleActivation(initial);
    } else {
        // if none active, activate first
        var first = tabsRoot.querySelector('li.tab');
        if (first) handleActivation(first);
    }
});

// --- Custom quiz renderer (append-only) ----------------------------------
document.addEventListener('DOMContentLoaded', function () {
    var quizPane = document.querySelector('#quizTab');
    if (!quizPane) return;

    function parseSlides(container) {
        var slides = [];
        var answersContainers = container.querySelectorAll('.answersContainer');
        answersContainers.forEach(function (ans) {
            // try to find the prompt nearby
            var slideNode = ans.closest('[ng-repeat]') || ans.parentElement;
            // '.prompt' is a wrapper that also contains the "Report an Error"
            // widget and a stale question-count string, so it must be tried
            // last, after the actual prompt element.
            var promptEl = slideNode && (slideNode.querySelector('[test-id="quiz_question_prompt"]') || slideNode.querySelector('.question') || slideNode.querySelector('.prompt'));
            var prompt = promptEl ? promptEl.innerHTML.trim() : '';

            var labels = ans.querySelectorAll('label');
            var options = Array.prototype.map.call(labels, function (label) {
                return {
                    html: label.innerHTML.trim(),
                    text: (label.innerText || label.textContent || '').trim(),
                    correct: (label.getAttribute && label.getAttribute('data-correct') === 'true')
                };
            });

            if (prompt || options.length) slides.push({ prompt: prompt || 'Question', options: options });
        });

        // fallback to worksheet section if no slides found
        if (slides.length === 0) {
            var worksheetPrompts = container.querySelectorAll('.worksheetQuestion');
            worksheetPrompts.forEach(function (wq) {
                var q = wq.querySelector('.question h3') || wq.querySelector('.prompt') || wq.querySelector('h3');
                var prompt = q ? (q.innerHTML || q.textContent || '').trim() : '';
                var opts = [];
                var ol = wq.querySelector('ol.answers');
                if (ol) {
                    Array.prototype.forEach.call(ol.children, function (li) {
                        opts.push({ html: li.innerHTML.trim(), text: (li.innerText || li.textContent || '').trim() });
                    });
                }
                if (prompt) slides.push({ prompt: prompt, options: opts });
            });
        }

        return slides;
    }

    function buildRenderer(attemptsLeft) {
        attemptsLeft = (typeof attemptsLeft === 'number') ? attemptsLeft : 10;
        if (quizPane.dataset.customQuizBuilt) return;

        var slides = parseSlides(quizPane);
        // If quiz DOM isn't ready yet, retry a few times (Angular may populate later)
        if ((!slides || slides.length === 0) && attemptsLeft > 0) {
            setTimeout(function () { buildRenderer(attemptsLeft - 1); }, 200);
            return;
        }

        quizPane.dataset.customQuizBuilt = '1';

        // hide original angular quiz pieces so our UI is visible
        var orig = quizPane.querySelector('[data-quiz], study-quiz, .accordionBlock.quiz, #lessonQuizContent');
        if (orig) orig.style.display = 'none';

        var container = document.createElement('div');
        container.className = 'custom-quiz-renderer';

        // simple styles (kept minimal so existing site styles apply)
        var STYLE_ID = 'custom-quiz-renderer-style';
        if (!document.getElementById(STYLE_ID)) {
            var s = document.createElement('style');
            s.id = STYLE_ID;
            s.textContent = '\n.custom-quiz-renderer .question-area{padding:20px;background:#fff;border:1px solid #e6e6e6;border-radius:4px}\n.custom-quiz-renderer .prompt{font-size:18px;margin-bottom:16px;color:#234}\n.custom-quiz-renderer .options{display:flex;gap:20px}\n.custom-quiz-renderer .options .col{flex:1}\n.custom-quiz-renderer label{display:block;padding:10px;border-radius:4px;border:1px solid #eee;background:#fbfbfb;cursor:pointer;margin-bottom:8px}\n.custom-quiz-renderer .btn{background:#5fbf9d;color:#fff;padding:10px 16px;border-radius:4px;border:0;cursor:pointer}\n';
            document.head.appendChild(s);
        }

        if (!slides || slides.length === 0) {
            container.innerHTML = '<div class="question-area"><div class="prompt">No quiz content found.</div></div>';
            quizPane.insertBefore(container, quizPane.firstChild);
            return;
        }

        var qa = document.createElement('div');
        qa.className = 'question-area';
        container.appendChild(qa);

        var current = 0;
        var answers = [];

        function render(i) {
            qa.innerHTML = '';
            var q = slides[i];
            var p = document.createElement('div'); p.className = 'prompt'; p.innerHTML = q.prompt; qa.appendChild(p);

            var optsWrap = document.createElement('div'); optsWrap.className = 'options';
            var mid = Math.ceil(q.options.length / 2) || q.options.length;
            var col1 = document.createElement('div'); col1.className = 'col';
            var col2 = document.createElement('div'); col2.className = 'col';

            q.options.forEach(function (opt, idx) {
                var label = document.createElement('label');
                var input = document.createElement('input');
                input.type = 'radio'; input.name = 'q' + i; input.style.marginRight = '8px';
                label.appendChild(input);
                var span = document.createElement('span');
                span.innerHTML = opt.html.replace(/<input[^>]*>/gi, '').trim();
                label.appendChild(span);
                if (idx < mid) col1.appendChild(label); else col2.appendChild(label);
            });

            optsWrap.appendChild(col1); optsWrap.appendChild(col2); qa.appendChild(optsWrap);

            var actions = document.createElement('div'); actions.className = 'quiz-actions';
            var next = document.createElement('button'); next.className = 'btn'; next.textContent = (i === slides.length - 1) ? 'Finish' : 'Next'; next.disabled = true;
            actions.appendChild(next); qa.appendChild(actions);

            qa.addEventListener('change', function () { next.disabled = !qa.querySelector('input[type="radio"]:checked'); });

            next.addEventListener('click', function () {
                var checked = qa.querySelector('input[type="radio"]:checked');
                answers[i] = checked ? checked.parentElement.innerText.trim() : '';
                if (i < slides.length - 1) { current = i + 1; render(current); qa.scrollIntoView({behavior:'smooth'}); }
                else showResults();
            });
        }

        function showResults() {
            container.innerHTML = '';
            var h = document.createElement('h3'); h.textContent = 'Your answers'; container.appendChild(h);
            var ws = document.createElement('div'); ws.className = 'worksheet';
            slides.forEach(function (s, idx) {
                var qd = document.createElement('div'); qd.style.padding = '8px 0';
                var qt = document.createElement('div'); qt.textContent = (idx + 1) + '. ' + s.prompt.replace(/<[^>]*>/g,'').trim(); qd.appendChild(qt);
                var ol = document.createElement('ol'); ol.type = 'a'; s.options.forEach(function (opt) { var li = document.createElement('li'); li.innerHTML = opt.html.replace(/<input[^>]*>/gi,''); ol.appendChild(li); }); qd.appendChild(ol);
                ws.appendChild(qd);
            });
            var btnRow = document.createElement('div'); btnRow.style.display='flex'; btnRow.style.gap='10px'; btnRow.style.margin='12px 0';
            var printBtn = document.createElement('button'); printBtn.className='btn'; printBtn.textContent='Print Worksheet'; printBtn.addEventListener('click', function(){ window.print(); });
            btnRow.appendChild(printBtn);
            container.appendChild(btnRow);
            container.appendChild(ws);

            var answersBtn = document.createElement('button'); answersBtn.className='btn'; answersBtn.textContent='Print Answers'; answersBtn.style.marginLeft='8px';
            answersBtn.addEventListener('click', function () {
                var ansDiv = document.createElement('div'); ansDiv.style.marginTop='12px';
                slides.forEach(function (s, idx) { var correct = s.options.find(function(o){return o.correct;}); var p = document.createElement('div'); p.textContent = (idx+1)+'. '+(correct? (correct.text || 'Answer available') : 'Answer not specified'); ansDiv.appendChild(p); });
                container.appendChild(ansDiv); answersBtn.disabled = true;
            });
            btnRow.appendChild(answersBtn);
        }

        quizPane.insertBefore(container, quizPane.firstChild);
        render(0);
    }

    // build when tab clicked
    var tabLink = document.querySelector('[test-id="page_tabs_container"] a[data-target="#quizTab"]');
    if (tabLink) tabLink.addEventListener('click', function () { setTimeout(buildRenderer, 50); }, true);

    // build immediately if already visible
    if (quizPane.classList.contains('in') || quizPane.classList.contains('active') || quizPane.offsetHeight > 0) {
        setTimeout(buildRenderer, 50);
    }

    // expose for external callers (switchTab)
    window.buildCustomQuizRenderer = function(attempts) { buildRenderer(attempts); };
});

// -------------------------------------------------------------------------

// Printable worksheet: Answer Key toggle behavior
document.addEventListener('DOMContentLoaded', function () {
    function setupAnswerToggles(root) {
        root = root || document;
        var toggles = root.querySelectorAll('[test-id="toggle_answer_selection_button"]');
        toggles.forEach(function (toggle) {
            // ensure keyboard accessible
            if (!toggle.hasAttribute('role')) toggle.setAttribute('role', 'button');
            if (!toggle.hasAttribute('tabindex')) toggle.setAttribute('tabindex', '0');

            // sync initial state with container
            var container = toggle.closest('.printable-worksheet');
            if (container) {
                if (container.classList.contains('show-answers')) toggle.classList.add('on');
                else toggle.classList.remove('on');
            }

            function toggleAnswers(e) {
                if (e) e.preventDefault();
                var ctrl = toggle;
                var cont = ctrl.closest('.printable-worksheet');
                if (!cont) return;

                var show = !cont.classList.contains('show-answers');
                // toggle visual class on container
                cont.classList.toggle('show-answers', show);
                // when hiding answers, also ensure options remain visible (do not force hide-options)
                // update control appearance
                ctrl.classList.toggle('on', show);
            }

            toggle.addEventListener('click', toggleAnswers);
            toggle.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    toggleAnswers(ev);
                }
            });
        });
    }

    // initial setup
    try { setupAnswerToggles(document); } catch (e) { console.error('Error setting up answer toggles', e); }

    // observe for dynamically inserted worksheets
    var obs = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes && Array.prototype.forEach.call(m.addedNodes, function (node) {
                if (!(node instanceof Element)) return;
                if (node.matches && node.matches('.printable-worksheet')) {
                    setupAnswerToggles(node);
                } else {
                    // may contain toggles
                    setupAnswerToggles(node);
                }
            });
        });
    });
    obs.observe(document.body, { childList: true, subtree: true });
});


document.addEventListener('DOMContentLoaded', function () {
    console.log('[study.js] DOM loaded');

    const videoContainer = document.querySelector('.videoContainer.video-preview-replacement');

    if (!videoContainer) {
        return;
    }

    const preview = videoContainer.querySelector('.video-loading-preview');
    const embed = videoContainer.querySelector('.wistia_embed');

    function revealVideo() {
        videoContainer.classList.add('video-preview-clicked');

        if (embed) {
            embed.style.position = 'relative';
            embed.style.left = '0';
            embed.style.display = 'block';
        }

        const nativeVideo = embed && (embed.querySelector('video') || embed.querySelector('.wistia_video'));
        if (nativeVideo) {
            nativeVideo.setAttribute('controls', 'controls');
            nativeVideo.controls = true;
            nativeVideo.style.maxHeight = '500px';
            nativeVideo.style.height = 'auto';
        }

        const player = embed && (embed.querySelector('.w-vulcan-v2'));
        if (player) {
            player.style.maxHeight = '500px';
            player.style.height = 'auto';
        }
    }

    if (preview) {
        preview.addEventListener('click', revealVideo, { once: true });
    }

    function isPanelOpen(target) {
        if (!target) {
            return false;
        }

        return target.classList.contains('in') ||
            target.classList.contains('show') ||
            target.style.display === 'block' ||
            target.offsetHeight > 0;
    }

    function setHeaderState(trigger, target, open) {
        if (!trigger || !target) {
            return;
        }

        if (open) {
            target.classList.add('in', 'show');
            target.style.display = 'block';
            // 'auto' (not scrollHeight) so this is correct even if target was
            // measured while its ancestor tab pane was hidden (scrollHeight
            // reads 0 for anything inside a display:none container).
            target.style.height = 'auto';
            trigger.classList.remove('collapsed');
            trigger.setAttribute('aria-expanded', 'true');
        } else {
            target.classList.remove('in', 'show');
            target.style.display = 'none';
            target.style.height = '0px';
            trigger.classList.add('collapsed');
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    function toggleCollapse(trigger, target) {
        if (!trigger || !target) {
            return;
        }

        const openNow = isPanelOpen(target);

        document.querySelectorAll('.collapse').forEach(function (panel) {
            if (panel !== target) {
                panel.classList.remove('in', 'show');
                panel.style.display = 'none';
                panel.style.height = '0px';
            }
        });

        document.querySelectorAll('[data-toggle="collapse"]').forEach(function (header) {
            if (header !== trigger) {
                header.classList.add('collapsed');
                header.setAttribute('aria-expanded', 'false');
            }
        });

        setHeaderState(trigger, target, !openNow);
    }

    document.querySelectorAll('[data-toggle="collapse"]').forEach(function (header) {
        const targetSelector = header.getAttribute('data-target');
        if (!targetSelector) {
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        const open = isPanelOpen(target);
        header.classList.toggle('collapsed', !open);
        header.setAttribute('aria-expanded', open ? 'true' : 'false');
        target.style.display = open ? 'block' : 'none';
        // 'auto' avoids baking in a scrollHeight of 0 for panels that start
        // open inside a tab pane that isn't the active one yet (e.g. Quiz).
        target.style.height = open ? 'auto' : '0px';
    });

    document.addEventListener('click', function (event) {
        const trigger = event.target.closest('[data-toggle="collapse"]');
        if (!trigger) {
            return;
        }

        const targetSelector = trigger.getAttribute('data-target');
        if (!targetSelector) {
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        toggleCollapse(trigger, target);
    }, true);

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        const trigger = event.target.closest('[data-toggle="collapse"]');
        if (!trigger) {
            return;
        }

        const targetSelector = trigger.getAttribute('data-target');
        if (!targetSelector) {
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        toggleCollapse(trigger, target);
    }, true);
});

// Accessibility attributes for elements like .accordionOneHeader (divs with
// data-toggle="collapse"). Actual open/close handling lives in the single
// delegated click/keydown listener registered above — a second listener here
// used to double-toggle every click (open then immediately close again).
document.addEventListener('DOMContentLoaded', function () {
    function initCollapseToggle(el) {
        if (!el || el.dataset.collapseInit) return;
        el.dataset.collapseInit = '1';
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        // Make it clear the header is interactive
        try { el.style.cursor = 'pointer'; } catch (e) { }
    }

    // initialize existing toggles
    Array.prototype.forEach.call(document.querySelectorAll('[data-toggle="collapse"]'), initCollapseToggle);

    // watch for dynamically added toggles
    var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
            Array.prototype.forEach.call(m.addedNodes || [], function (node) {
                if (!(node instanceof Element)) return;
                if (node.matches('[data-toggle="collapse"]')) initCollapseToggle(node);
                Array.prototype.forEach.call(node.querySelectorAll && node.querySelectorAll('[data-toggle="collapse"]') || [], initCollapseToggle);
            });
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
});

// Course Navigator: the "current chapter" header is sometimes saved with an
// inline `position: absolute; top: <px>` (a leftover from the live site's
// scroll-tracking underline, frozen at whatever pixel offset it had at save
// time). That drops the header out of normal flow and makes its title float
// in the middle of its own chapter's lesson list instead of sitting above
// it. Strip it so the header lays out like every other chapter header.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.chapterHeader').forEach(function (header) {
        if (header.style.position === 'absolute') {
            header.style.position = '';
            header.style.top = '';
        }
    });
});

// Local-link rewriting for subpath deployments (e.g. GitHub Pages project
// sites such as https://junhui.github.io/studystudy/, where the site is
// served from /studystudy/ instead of the domain root).
//
// These saved pages link to each other with root-relative hrefs like
// href="/some-lesson.html", which resolve against the domain root. That's
// fine when the site is served from the root, but breaks under a subpath:
// the browser requests https://<host>/some-lesson.html instead of
// https://<host>/studystudy/some-lesson.html.
//
// This only rewrites links whose target is one of the pages actually present
// in this download (LOCAL_PAGES below, generated from this folder's own
// *.html files). Links to study.com's live site — course/exam catalog pages,
// images, etc. — were never downloaded, are broken either way, and are left
// untouched rather than being pointed somewhere that also 404s.
var LOCAL_PAGES = ["8-parts-of-speech.html", "academic-language-definition-examples-functions.html", "acculturation-vs-assimilation.html", "adaptations-accommodations-for-ell-students-in-reading.html", "additive-transformative-approaches-to-multicultural-curriculum-reform.html", "affective-factors-in-second-language-acquisition.html", "alternative-assessments-for-english-language-learners.html", "analyzing-discourse-sentence-relation-coherence.html", "analyzing-implicit-cultural-values-in-schools-classrooms.html", "analyzing-results-to-inform-instruction-in-ell.html", "analyzing-the-effectiveness-of-esol-models-teaching-methods.html", "applying-pragmatics-to-esol-instruction.html", "assessment-issues-with-english-language-learners.html", "assimilation-and-accommodation.html", "authentic-assessments-definition-examples.html", "bias-issues-in-the-special-education-classroom.html", "biculturalism-its-relationship-to-english-language-learners.html", "california-eld-ela-standards-in-reading-fluency.html", "california-eld-ela-standards-in-reading-literary-response-analysis.html", "california-eld-ela-standards-in-reading-reading-comprehension.html", "california-eld-ela-standards-in-reading-systematic-vocabulary-development.html", "california-eld-ela-standards-in-reading-word-analysis.html", "california-eld-ela-standards-in-writing-english-language-conventions.html", "california-eld-ela-standards-in-writing-purpose-speaker-audience-form.html", "california-eld-ela-standards-in-writing-strategies-applications.html", "california-english-language-learner-laws.html", "california-state-mandated-standardized-assessments.html", "characteristics-of-effective-english-language-development-programs.html", "choosing-culturally-diverse-texts-for-the-classroom.html", "chunking-method-definition-examples-quiz.html", "classroom-accommodations-for-ell-students.html", "cognitive-social-strategies-for-developing-a-second-language.html", "collaborative-teaching-concept-models.html", "communicating-with-ell-parents-outreach-strategies.html", "communication-in-different-settings.html", "comparing-eld-sdaie-in-english-learner-education.html", "complete-sentence-examples-definition-quiz.html", "consonant-blends-definition-examples.html", "cooperative-learning-model-characteristics.html", "cooperative-learning-strategies-with-esl-students.html", "creating-a-classroom-environment-that-supports-cultural-diversity.html", "creating-a-respectful-learning-environment.html", "creating-an-inclusive-instructional-environment-for-english-learners.html", "ctel-registration-information.html", "ctel-test-day-preparation.html", "cultural-competence-engaging-learning-experiences.html", "cultural-congruence-in-the-classroom.html", "cultural-differences-in-conflict-responses.html", "cultural-differences-in-oral-written-discourse.html", "cultural-linguistic-diversity-trends-in-california.html", "cultural-variation-universalities-generalities-particularities.html", "culturally-competent-classroom-environment-practices.html", "culturally-responsive-classroom-management-strategies.html", "culturally-responsive-teaching-for-ell-students.html", "culture-shock-definition-stages-examples.html", "curriculum-based-assessment-definition-examples.html", "defining-cultural-diversity.html", "demographics-for-english-language-learners.html", "developing-ell-speaking-skills-for-social-academic-purposes.html", "developing-reading-writing-proficiency-in-english-learners.html", "differentiated-instruction-for-ell-students.html", "educational-needs-of-bilingual-multilingual-multicultural-groups.html", "effects-of-cross-cultural-differences-in-the-classroom.html", "eld-ela-standards-in-listening-comprehension-in-california.html", "eld-ela-standards-in-oral-communication-in-california.html", "eld-ela-standards-in-oral-media-communications-in-california.html", "empowerment-issues-when-educating-english-learners.html", "english-as-a-second-language-in-the-classroom-acquisition-development.html", "equalitarian-inequalitarian-pluralism.html", "equity-issues-when-educating-english-learners.html", "esl-co-teaching-models.html", "esl-pull-out-model-definition-strategies (1).html", "esl-pull-out-model-definition-strategies.html", "esl-push-in-programs-definition-instruction.html", "esl-speaking-rubrics.html", "esl-writing-rubrics.html", "ethnocentrism-vs-cultural-relativism.html", "evaluating-effectiveness-of-sdaie-lessons.html", "evaluating-eld-programs-discourse-competence.html", "evaluating-eld-programs-language-functions.html", "evaluating-eld-programs-sociolinguistic-competence.html", "evaluating-genres-for-language-function.html", "explicit-vs-implicit-instruction-for-second-language-grammar.html", "factors-affecting-english-language-acquisition.html", "factors-affecting-language-development.html", "factors-that-influence-choice-of-language-variation.html", "first-language-vs-second-language-acquisition.html", "flashcards-california-phonology-&-morphology-esl-instruction.html", "flashcards-components-of-effective-instructional-delivery-in-eld-&-sdaie.html", "flashcards-cross-cultural-interaction-in-education.html", "flashcards-cultural-concepts-&-perspectives-in-education.html", "flashcards-cultural-contact-in-the-classroom.html", "flashcards-discourse-&-pragmatics-for-esl-students.html", "flashcards-instructional-planning-&-organization-for-eld-&-sdaie.html", "flashcards-language-functions-&-variation-for-esl.html", "flashcards-programs-&-requirements-for-english-learners-in-california.html", "flashcards-reading-&-writing-for-california-student-english-language-development.html", "flashcards-teaching-esl-syntax-&-semantics-in-california.html", "flashcards-theories,-processes-&-stages-of-language-acquisition.html", "graphic-organizer-definition-types-examples.html", "historical-social-influences-on-language-acquisition-development.html", "history-of-esl-education-in-the-us.html", "how-different-cultures-view-the-role-of-teachers.html", "how-different-settings-affect-communication.html", "how-language-influences-writing-for-ell-students.html", "how-teachers-impact-achievement-of-culturally-diverse-students.html", "how-to-build-background-knowledge-for-ell-students.html", "how-to-pre-teach-vocabulary-to-esl-students.html", "how-to-teach-conflict-resolution-to-kids.html", "how-to-teach-vocabulary-to-esl-students.html", "how-to-use-grouping-for-literacy-instruction.html", "identifying-the-difficulty-level-of-academic-language.html", "identifying-types-of-sentences.html", "identifying-variations-in-english-learner-performance.html", "implementing-content-based-eld-in-classrooms.html", "implicit-vs-explicit-error-correction-in-language-instruction.html", "inclusive-classroom-definition-strategies-environment.html", "index.html", "index2.html", "inflectional-endings-definition-examples.html", "informal-assessments-for-english-language-learners.html", "informal-vs-formal-language-in-language-acquisition.html", "ingroup-vs-outgroup-definition-and-explanation.html", "instructional-issues-relating-to-long-term-english-learners.html", "intercultural-communication-definition-model-strategies.html", "involving-families-in-culturally-inclusive-curriculum-instruction.html", "key-procedures-in-sdaie-lesson-planning.html", "language-development-content-area-assessments-for-english-learners.html", "language-experience-approach-to-literacy.html", "language-language-regions-definitions-dialects.html", "language-transfer-definition-types-effects.html", "learning-strategies-for-english-learners-metacognitive-metalinguistic.html", "legal-legislative-foundations-of-ell-educational-programs-in-the-us-california.html", "levels-of-english-language-development-instructional-implications.html", "mandatory-program-components-for-english-learners-in-california.html", "manipulatives-in-education-definition-examples-classroom-applications.html", "meaning-through-vocal-qualities.html", "meaningful-interaction-theory-language-acquisition.html", "mediating-cross-cultural-conflicts-in-the-classroom.html", "meeting-needs-of-different-english-learner-typologies-in-eld-programs.html", "meeting-the-needs-of-english-learners-in-california-assessment-instruction.html", "metacognitive-skills-used-in-learning-a-second-language.html", "models-of-bilingual-education-programs.html", "modern-immigration-migration-trends-in-the-united-states.html", "modifying-language-without-simplification-in-ell-classrooms.html", "morphemes-examples-definition-types.html", "morphemes-that-inhibit-english-learner-communication.html", "morphology-of-english-definition-studies-quiz.html", "multicultural-curriculum-instruction-development.html", "multicultural-education-overview-approaches.html", "multicultural-literature-themes.html", "multilingualism-origin-role-in-education.html", "ongoing-assessments-literal-inferential-evaluative-comprehension.html", "parent-notification-rights-for-english-learners.html", "pedagogical-practices-english-language-literacy-development.html", "peer-tutoring-definition-pros-cons.html", "performance-based-assessments-for-english-language-learners.html", "personal-factors-affecting-english-language-literacy-development.html", "personal-social-factors-in-second-language-development.html", "phoneme-definition-segmentation-examples.html", "phonological-morphological-skills-that-promote-fluency.html", "phonology-examples-rules.html", "political-factors-in-second-language-development.html", "political-foundations-of-educational-programs-for-english-learners.html", "portfolio-assessments-for-english-language-learners.html", "pre-reading-reading-post-reading-activities.html", "prior-knowledge-vs-background-knowledge-for-ell-students.html", "promoting-comprehension-of-english-variations-for-esl-students.html", "promoting-ell-parent-involvement-activities-ideas.html", "promoting-phonemic-development-in-english-learners.html", "promoting-sociolinguistic-competence-in-english-learners.html", "providing-explicit-instruction-in-content-specific-discourse-skills.html", "push-pull-factors-of-migration-what-are-push-pull-factors.html", "qualities-of-good-assessments-standardization-practicality-reliability-validity.html", "questioning-techniques-for-discussions-in-ell-classrooms.html", "quiz-worksheet-1st-vs-2nd-language-acquisition.html", "quiz-worksheet-academic-language.html", "quiz-worksheet-accommodating-english-language-learners.html", "quiz-worksheet-accommodation-assimilation-in-children.html", "quiz-worksheet-acculturation-vs-assimilation.html", "quiz-worksheet-affective-factors-in-esl.html", "quiz-worksheet-alternative-evaluations-for-esl-students.html", "quiz-worksheet-analyzing-assessment-results-in-ell.html", "quiz-worksheet-analyzing-effectiveness-of-sdaie-lessons.html", "quiz-worksheet-analyzing-genres-for-language-function.html", "quiz-worksheet-approaches-to-multicultural-curriculum-reform.html", "quiz-worksheet-assessing-eld-program-discourse-competence.html", "quiz-worksheet-assessing-eld-program-language-functions.html", "quiz-worksheet-assessing-eld-program-sociolinguistic-competence.html", "quiz-worksheet-assessing-esol-instruction-models-methods.html", "quiz-worksheet-assessing-variations-in-performance-for-ell.html", "quiz-worksheet-authentic-assessments.html", "quiz-worksheet-bias-in-the-special-education-classroom.html", "quiz-worksheet-bias-language-differences-in-assessments.html", "quiz-worksheet-biculturalism-ells.html", "quiz-worksheet-bilingual-education-program-models.html", "quiz-worksheet-building-ell-background-knowledge.html", "quiz-worksheet-building-ell-speaking-skills.html", "quiz-worksheet-ca-eld-ela-standards.html", "quiz-worksheet-ca-state-mandated-assessments.html", "quiz-worksheet-california-esl-leglisation.html", "quiz-worksheet-casual-formal-language-acquisition.html", "quiz-worksheet-categorization-in-language-acquisition.html", "quiz-worksheet-characteristics-of-a-complete-sentence.html", "quiz-worksheet-characteristics-of-cultural-variation.html", "quiz-worksheet-characteristics-of-curriculum-mapping.html", "quiz-worksheet-characteristics-of-nonfiction.html", "quiz-worksheet-characteristics-types-of-fiction.html", "quiz-worksheet-choosing-content-for-english-learners.html", "quiz-worksheet-chunking-method.html", "quiz-worksheet-cognitive-social-strategies-for-esl.html", "quiz-worksheet-collaborative-team-teaching.html", "quiz-worksheet-communication-with-esl-parents.html", "quiz-worksheet-community-involvement-in-education.html", "quiz-worksheet-components-of-effective-eld-programs.html", "quiz-worksheet-consonant-blends.html", "quiz-worksheet-conveying-meaning-with-vocal-qualities-in-public-speaking.html", "quiz-worksheet-cooperative-learning-methods.html", "quiz-worksheet-correcting-implicit-explicit-errors-in-language.html", "quiz-worksheet-cross-cultural-differences-in-school.html", "quiz-worksheet-cultural-competence-academic-engagement.html", "quiz-worksheet-cultural-competence-the-class-environment.html", "quiz-worksheet-cultural-congruence-in-education.html", "quiz-worksheet-cultural-differences-in-communication.html", "quiz-worksheet-cultural-differences-in-language-use.html", "quiz-worksheet-cultural-differences-in-schooling-theory.html", "quiz-worksheet-cultural-diversity.html", "quiz-worksheet-cultural-linguistic-trends-in-ca.html", "quiz-worksheet-culturally-responsive-classroom-management.html", "quiz-worksheet-culturally-responsive-instruction-for-ell.html", "quiz-worksheet-culture-s-impact-on-nonverbal-communication.html", "quiz-worksheet-culture-shock-stages.html", "quiz-worksheet-current-immigration-patterns-in-the-u-s.html", "quiz-worksheet-curriculum-based-assessment.html", "quiz-worksheet-dealing-with-educational-conflicts-related-to-cultural-values.html", "quiz-worksheet-definition-characteristics-of-culture.html", "quiz-worksheet-determining-writing-form-in-eld-ela.html", "quiz-worksheet-developing-an-inclusive-classroom.html", "quiz-worksheet-differentiation-for-teaching-ell.html", "quiz-worksheet-difficult-morphemes-for-esl-learners.html", "quiz-worksheet-diphthongs.html", "quiz-worksheet-discourse-language-development.html", "quiz-worksheet-educating-students-on-multiple-perspectives.html", "quiz-worksheet-educational-bias-types.html", "quiz-worksheet-educational-needs-of-bilingual-multilingual-multicultural-groups.html", "quiz-worksheet-educator-impact-on-diverse-student-success.html", "quiz-worksheet-educators-in-different-cultures.html", "quiz-worksheet-eld-ela-standards-in-listening-comprehension-in-ca.html", "quiz-worksheet-eld-ela-standards-in-listening-speaking.html", "quiz-worksheet-eld-ela-standards-in-oral-communication-in-ca.html", "quiz-worksheet-eld-ela-standards-in-oral-media-communications-in-ca.html", "quiz-worksheet-eld-ela-standards-in-reading.html", "quiz-worksheet-eld-ela-standards-in-writing.html", "quiz-worksheet-eld-vs-sdaie-in-english-learner-education.html", "quiz-worksheet-ell-cooperative-learning.html", "quiz-worksheet-ell-education-history.html", "quiz-worksheet-empowerment-issues-in-ell.html", "quiz-worksheet-english-as-a-second-language-in-school.html", "quiz-worksheet-english-language-conventions-in-eld-ela.html", "quiz-worksheet-english-language-development-factors.html", "quiz-worksheet-equalitarian-inequalitarian-pluralism.html", "quiz-worksheet-equity-issues-in-ell.html", "quiz-worksheet-esl-assessment-instruction-in-ca.html", "quiz-worksheet-esl-assessment-problems.html", "quiz-worksheet-esl-pull-in-model.html", "quiz-worksheet-ethnocentrism-vs-cultural-relativism.html", "quiz-worksheet-explicit-instruction-in-content-specific-discourse-skills.html", "quiz-worksheet-factors-affecting-choice-of-language-variation.html", "quiz-worksheet-finding-language-difficulty-level.html", "quiz-worksheet-handling-cross-cultural-conflicts-in-class.html", "quiz-worksheet-helping-students-understand-diversity.html", "quiz-worksheet-how-different-cultures-respond-to-conflict.html", "quiz-worksheet-how-oral-language-impacts-reading-development.html", "quiz-worksheet-how-place-affects-communication.html", "quiz-worksheet-how-setting-affects-communication.html", "quiz-worksheet-how-to-vary-sentence-patterns.html", "quiz-worksheet-human-migration-factors.html", "quiz-worksheet-implementing-content-based-eld-in-classes.html", "quiz-worksheet-implicit-cultural-values-in-education.html", "quiz-worksheet-inflectional-endings.html", "quiz-worksheet-influences-on-language-acquisition.html", "quiz-worksheet-informal-evaluations-for-esl-students.html", "quiz-worksheet-ingroups-vs-outgroups.html", "quiz-worksheet-instruction-types-for-2nd-language-grammar.html", "quiz-worksheet-instructional-issues-long-term-ell.html", "quiz-worksheet-involving-ell-parents-in-school-governance.html", "quiz-worksheet-involving-families-in-culturally-inclusive-education.html", "quiz-worksheet-kinds-of-language-transfer.html", "quiz-worksheet-language-development-content-assessment-for-ell.html", "quiz-worksheet-language-experience-approach.html", "quiz-worksheet-language-regions-dialects.html", "quiz-worksheet-language-s-impact-on-ell-students-writing.html", "quiz-worksheet-language-structure-function-relationships.html", "quiz-worksheet-laws-legislation-in-ell-in-the-u-s-ca.html", "quiz-worksheet-learning-with-bilingual-paraprofessionals.html", "quiz-worksheet-levels-of-eld-instructional-impact.html", "quiz-worksheet-literary-response-analysis-in-eld-ela.html", "quiz-worksheet-meaningful-interaction-in-language-learning.html", "quiz-worksheet-meeting-needs-of-different-english-learner-typologies.html", "quiz-worksheet-metacognitive-metalinguistic-skills-for-ell.html", "quiz-worksheet-metacognitive-skills-second-language-acquisition.html", "quiz-worksheet-modifying-language-without-simplification-in-ell.html", "quiz-worksheet-modifying-reading-lessons-for-esl-students.html", "quiz-worksheet-morphology-of-english.html", "quiz-worksheet-multicultural-approaches-to-education.html", "quiz-worksheet-multicultural-curriculum-instruction-development.html", "quiz-worksheet-multicultural-literature.html", "quiz-worksheet-native-language-effects-on-second-language-acquisition.html", "quiz-worksheet-parent-notification-rights-for-english-learners.html", "quiz-worksheet-pedagogy-ell-development.html", "quiz-worksheet-performance-based-evaluations-for-esl-students.html", "quiz-worksheet-personal-affects-on-ell-development.html", "quiz-worksheet-personal-social-influences-on-language-acquisition.html", "quiz-worksheet-phoneme-morpheme-skills-for-fluency.html", "quiz-worksheet-phoneme.html", "quiz-worksheet-phonology-rules.html", "quiz-worksheet-political-factors-in-esl.html", "quiz-worksheet-political-foundations-of-ell-educational-programs.html", "quiz-worksheet-pragmatics-esol-instruction.html", "quiz-worksheet-pragmatics.html", "quiz-worksheet-pre-reading-reading-post-reading-activities.html", "quiz-worksheet-pre-teaching-esl-vocabulary.html", "quiz-worksheet-prior-background-knowledge-for-ell-learners.html", "quiz-worksheet-procedures-in-sdaie-lesson-planning.html", "quiz-worksheet-promoting-phonemic-development-in-esl.html", "quiz-worksheet-promoting-sociolinguistic-ability-in-esl.html", "quiz-worksheet-qualities-of-good-assessments.html", "quiz-worksheet-reading-comprehension-in-eld-ela.html", "quiz-worksheet-reading-fluency-in-eld-ela.html", "quiz-worksheet-reading-writing-proficiency-in-ell.html", "quiz-worksheet-required-program-components-for-english-learners-in-ca.html", "quiz-worksheet-research-based-eld-approaches.html", "quiz-worksheet-respectful-learning-environments.html", "quiz-worksheet-role-of-assessment-in-ell-programs.html", "quiz-worksheet-scaffolding-for-english-language-learners.html", "quiz-worksheet-scaffolding-strategies-supporting-academic-language-proficiency.html", "quiz-worksheet-schemas-in-education.html", "quiz-worksheet-semantics.html", "quiz-worksheet-sentence-relation-cohesiveness.html", "quiz-worksheet-setting-expectations-for-students.html", "quiz-worksheet-seven-tenets-of-ubd.html", "quiz-worksheet-social-academic-language-acquisition.html", "quiz-worksheet-social-cultural-roles-of-language.html", "quiz-worksheet-social-distance.html", "quiz-worksheet-social-language-learning-methods.html", "quiz-worksheet-sociocultural-impacts-on-esl-students.html", "quiz-worksheet-sociolinguistic-aspects-of-learning-a-second-language.html", "quiz-worksheet-sociolinguistic-study-ethnography.html", "quiz-worksheet-spatial-association-of-culture-regions.html", "quiz-worksheet-speaking-skills-for-esl-students.html", "quiz-worksheet-stages-theories-of-language-acquisition.html", "quiz-worksheet-strategies-for-english-learners-in-listening-speaking.html", "quiz-worksheet-student-cultural-adjustment.html", "quiz-worksheet-supporting-cultural-diversity-in-the-classroom.html", "quiz-worksheet-systematic-vocabulary-development-in-eld-ela.html", "quiz-worksheet-teaching-cultural-awareness-through-text.html", "quiz-worksheet-teaching-english-variations-to-esl-students.html", "quiz-worksheet-teaching-esl-phonology-morphology-in-ca.html", "quiz-worksheet-teaching-kids-conflict-resolution.html", "quiz-worksheet-teaching-semantics-to-esl-students.html", "quiz-worksheet-teaching-students-ethnocentrism-cultural-relativism.html", "quiz-worksheet-teaching-syntax-to-esl-students-in-ca.html", "quiz-worksheet-teaching-vocabulary-to-esl-students.html", "quiz-worksheet-teaching-with-sdaie.html", "quiz-worksheet-technology-for-esl-instruction.html", "quiz-worksheet-the-8-parts-of-speech.html", "quiz-worksheet-the-inclusive-esl-instructional-environment.html", "quiz-worksheet-the-intercultural-communication-model.html", "quiz-worksheet-the-siop-model.html", "quiz-worksheet-types-of-graphic-organizers.html", "quiz-worksheet-types-of-morphemes.html", "quiz-worksheet-types-of-ongoing-assessments.html", "quiz-worksheet-types-of-sentences.html", "quiz-worksheet-understanding-by-design-basics.html", "quiz-worksheet-using-affixes-and-roots-to-determine-the-meaning-of-words.html", "quiz-worksheet-using-groups-in-literacy-instruction.html", "quiz-worksheet-using-manipulatives-in-the-classroom.html", "quiz-worksheet-using-pictures-with-esl-students.html", "quiz-worksheet-using-questioning-methods-with-ell-students.html", "quiz-worksheet-using-sdaie-to-meet-needs-of-ell.html", "quiz-worksheet-using-syntactic-semantic-context-clues.html", "quiz-worksheet-verb-tense-subject-verb-agreement.html", "quiz-worksheet-vowel-digraphs.html", "quiz-worksheet-ways-to-teach-pragmatic-language.html", "quiz-worksheet-what-are-textbook-assessments.html", "quiz-worksheet-what-is-multilingualism.html", "quiz-worksheet-what-is-peer-tutoring.html", "quiz-worksheet-word-analysis-in-eld-ela.html", "quiz-worksheet-writing-instruction-for-ell.html", "quiz-worksheet-writing-strategies-application-in-eld-ela.html", "reading-resources-for-ell-students.html", "research-based-eld-approaches-goals-features-effectiveness.html", "results (1).html", "results.html", "role-purposes-of-assessment-in-programs-for-english-learners.html", "scaffolding-instruction-for-english-language-learners.html", "scaffolding-strategies-that-support-academic-language-proficiency.html", "schooling-cultural-differences-in-schooling-theory.html", "sdaie-approaches-for-meeting-the-needs-of-english-learner-typologies.html", "sdaie-strategies-for-teaching.html", "selecting-appropriate-materials-resources-for-english-learners.html", "sentence-patterns-variation.html", "setting-expectations-for-learning-achievement-in-the-classroom.html", "siop-model-components-benefits.html", "social-academic-language-acquisition-differences-characteristics.html", "social-distance-definition-theory.html", "social-learning-strategies-in-second-language-acquisition.html", "sociocultural-influences-on-ell-students.html", "sociolinguistic-concepts-second-language-acquisition.html", "sociolinguistics-types-variations-examples.html", "spatial-association-of-culture-regions-definition-distinctions-influences.html", "strategies-for-addressing-educational-conflicts-related-to-cultural-values.html", "strategies-for-community-involvement-in-education.html", "strategies-for-english-learners-in-listening-speaking.html", "strategies-for-involving-ell-parents-in-school-governance.html", "student-adjustment-to-different-cultures-factors-examples.html", "subject-verb-agreement-concept-examples.html", "supporting-student-learning-with-bilingual-paraprofessionals.html", "teaching-diversity-in-the-classroom.html", "teaching-esl-phonology-morphology-in-california.html", "teaching-pragmatic-language-skills.html", "teaching-semantics-to-english-language-learners.html", "teaching-speaking-skills-to-esl-students-methods-resources.html", "teaching-students-about-ethnocentrism-cultural-relativism.html", "teaching-students-to-appreciate-analyze-multiple-perspectives.html", "teaching-syntax-to-english-language-learners-in-california.html", "teaching-writing-to-english-language-learners.html", "technology-for-esl-students-in-the-classroom.html", "testing-bias-cultural-bias-language-differences-in-assessments.html", "textbook-assessments-examples-strengths-limitations.html", "the-impact-of-oral-language-on-reading-development.html", "the-interaction-of-language-structures-functions.html", "the-relationship-between-california-eld-ela-standards.html", "the-relationship-between-eld-ela-standards-in-listening-speaking.html", "the-relationship-between-eld-ela-standards-in-reading.html", "the-relationship-between-eld-ela-standards-in-writing.html", "the-role-of-culture-in-nonverbal-communication.html", "the-role-of-discourse-in-language-development.html", "the-role-of-native-language-in-second-language-acquisition.html", "the-seven-key-tenets-of-understanding-by-design.html", "the-social-cultural-functions-of-language.html", "types-elements-subsets-of-culture.html", "using-affixes-and-roots-to-find-the-meaning-of-words.html", "using-categories-to-learn-the-rules-of-a-second-language.html", "using-schemas-in-education.html", "using-syntactic-semantic-context-clues-to-determine-meaning (1).html", "using-syntactic-semantic-context-clues-to-determine-meaning.html", "using-visual-aids-with-ell-students.html", "variations-in-language-across-cultures.html", "vowel-digraphs-definition-examples.html", "what-is-a-diphthong-definition-examples.html", "what-is-curriculum-mapping.html", "what-is-educational-bias-definition-types.html", "what-is-fiction-definition-types.html", "what-is-language-acquisition-theories-stages-quiz.html", "what-is-nonfiction-definition-examples.html", "what-is-pragmatics-examples-rules.html", "what-is-semantics-definition-examples-quiz.html", "what-is-the-ctel-exam.html", "what-is-understanding-by-design-framework-history-examples.html"];

document.addEventListener('DOMContentLoaded', function () {
    if (!STUDY_JS_SCRIPT_EL || !STUDY_JS_SCRIPT_EL.src) {
        return;
    }

    var basePath = new URL(STUDY_JS_SCRIPT_EL.src, window.location.href).pathname.replace(/\/study\.js$/, '');
    if (!basePath) {
        return; // served from the domain root (e.g. local testing) — nothing to rewrite
    }

    var localPageSet = {};
    LOCAL_PAGES.forEach(function (name) { localPageSet[name] = true; });

    document.querySelectorAll('a[href^="/"]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href || href.indexOf('//') === 0 || href.indexOf(basePath + '/') === 0) {
            return;
        }

        var match = href.match(/^\/([^\/?#]+)([?#].*)?$/);
        if (!match || !localPageSet[match[1]]) {
            return; // not a single-segment path, or not one of our downloaded pages
        }

        a.setAttribute('href', basePath + '/' + match[1] + (match[2] || ''));
    });
});

}
