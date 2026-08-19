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

        // Remove active from all tabs
        tabContainer
            .querySelectorAll('li')
            .forEach(function (li) {
                li.classList.remove('active');
            });

        // Remove active from all tab panes
        contentContainer
            .querySelectorAll('.tab-pane')
            .forEach(function (pane) {
                pane.classList.remove('active');
            });

        // Activate clicked tab
        const li = link.closest('li');

        if (li) {
            li.classList.add('active');
        }

        // Activate target pane
        targetPane.classList.add('active');

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
            target.style.height = target.scrollHeight + 'px';
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
        target.style.height = open ? (target.scrollHeight + 'px') : '0px';
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
});
