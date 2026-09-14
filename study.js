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

}
