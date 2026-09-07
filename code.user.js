// ==UserScript==
// @name         YouTube Thumbnail Link Cleaner
// @namespace    https://github.com/MrBurrBurr
// @version      0.1
// @description  Strip tracking params from YouTube video thumbnail links so drag-and-drop bookmarks save clean URLs
// @author       FREDERICK
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @run-at       document-start
// @grant        none
// @downloadURL  https://github.com/MrBurrBurr/YouTube-Thumbnail-Link-Cleaner/raw/main/code.user.js
// @updateURL    https://github.com/MrBurrBurr/YouTube-Thumbnail-Link-Cleaner/raw/main/code.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Params to strip from thumbnail hrefs
    const PARAMS_TO_STRIP = ['pp', 'si', 'feature', 'ab_channel'];
    // Params that actually matter for context (playlists) - keep these
    const PARAMS_TO_KEEP = ['v', 'list', 'index', 't'];

    function cleanHref(href) {
        try {
            const url = new URL(href, location.origin);
            if (!url.pathname.startsWith('/watch')) return null;

            let changed = false;
            for (const param of PARAMS_TO_STRIP) {
                if (url.searchParams.has(param)) {
                    url.searchParams.delete(param);
                    changed = true;
                }
            }
            return changed ? url.pathname + url.search : null;
        } catch (e) {
            return null;
        }
    }

    function cleanAllThumbnailLinks(root = document) {
        const links = root.querySelectorAll('a[href*="/watch"]');
        links.forEach((link) => {
            const cleaned = cleanHref(link.getAttribute('href'));
            if (cleaned) {
                link.setAttribute('href', cleaned);
            }
        });
    }

    // Initial pass
    cleanAllThumbnailLinks();

    // Watch for new thumbnails being added (scrolling, SPA navigation, etc.)
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue; // only elements
                if (node.matches && node.matches('a[href*="/watch"]')) {
                    const cleaned = cleanHref(node.getAttribute('href'));
                    if (cleaned) node.setAttribute('href', cleaned);
                }
                if (node.querySelectorAll) {
                    cleanAllThumbnailLinks(node);
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    // Also clean the address bar itself, in case you drag from there too
    function cleanCurrentUrl() {
        const url = new URL(window.location.href);
        if (!url.pathname.startsWith('/watch')) return;
        let changed = false;
        for (const param of PARAMS_TO_STRIP) {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                changed = true;
            }
        }
        if (changed) history.replaceState(history.state, '', url.toString());
    }
    cleanCurrentUrl();
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            cleanCurrentUrl();
        }
    }).observe(document, { subtree: true, childList: true });
})();
