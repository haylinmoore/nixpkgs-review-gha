// ==UserScript==
// @name         Nixpkgs Review Buttons
// @namespace    https://github.com/haylinmoore/nixpkgs-review-gha
// @version      0.3
// @description  Adds nixpkgs-review and PR Tracker buttons to Nixpkgs PRs and auto-fills PR number on workflow page
// @author       haylinmoore
// @match        https://github.com/NixOS/nixpkgs/pull/*
// @match        https://github.com/haylinmoore/nixpkgs-review-gha/actions/workflows/review.yml
// @grant        none
// @updateURL    https://raw.githubusercontent.com/haylinmoore/nixpkgs-review-gha/main/shortcut.js
// @downloadURL  https://raw.githubusercontent.com/haylinmoore/nixpkgs-review-gha/main/shortcut.js
// ==/UserScript==

(function() {
    'use strict';

    const repo = "haylinmoore/nixpkgs-review-gha";

    // Define regex patterns once
    const PR_PAGE_REGEX = /^https:\/\/github.com\/nixos\/nixpkgs\/pull\/(\d+)/i;
    const WORKFLOW_PAGE_REGEX = /^https:\/\/github.com\/([^\/]+\/[^\/]+)\/actions\/workflows\/review\.yml/i;

    const sleep = duration => new Promise(resolve => setTimeout(resolve, duration));
    const query = async (doc, sel) => {
      while (true) {
        const elem = doc.querySelector(sel);
        if (elem !== null) return elem;
        await sleep(100);
      }
    };

    // Handle PR page
    const setupPRPage = async () => {
      const match = PR_PAGE_REGEX.exec(location.href);
      if (match === null) return;

      const pr = match[1];
      const actions = await query(document, ".gh-header-show .gh-header-actions");

      if (actions.querySelector(".run-nixpkgs-review") === null) {
        const btn = document.createElement("button");
        btn.classList.add("Button", "Button--secondary", "Button--small", "run-nixpkgs-review");
        btn.innerText = "Run nixpkgs-review";
        actions.prepend(btn);
        btn.onclick = () => {
          window.open(`https://github.com/${repo}/actions/workflows/review.yml?from=ghaScript&pr=${pr}`);
        };
      }

      if (actions.querySelector(".goto-pr-tracker") === null) {
        const btn = document.createElement("button");
        btn.classList.add("Button", "Button--secondary", "Button--small", "goto-pr-tracker");
        btn.innerText = "PR Tracker";
        actions.prepend(btn);
        btn.onclick = () => {
          window.open(`https://nixpk.gs/pr-tracker.html?pr=${pr}`);
        };
      }
    };

    // Handle workflow page
    const setupWorkflowPage = async () => {
      const workflowMatch = WORKFLOW_PAGE_REGEX.exec(location.href);
      if (workflowMatch === null) return;

      const urlParams = new URLSearchParams(window.location.search);
      const isFromScript = urlParams.get('from') === 'ghaScript';
      const pr = urlParams.get('pr');

      if (isFromScript && pr) {
        // Wait for the "Run workflow" button and click it after a delay
        const summaryButton = await query(document, "details > summary.btn");

        // Wait 250ms before clicking
        await sleep(250);
        summaryButton.click();

        // Fill in the PR number
        const prInput = await query(document, "input.form-control[name='inputs[pr]']");
        prInput.value = pr;

        // Trigger input event to ensure any listeners know the value changed
        prInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Determine which setup to run based on current URL
    const setup = () => {
      if (PR_PAGE_REGEX.test(location.href)) {
        setupPRPage();
      } else if (WORKFLOW_PAGE_REGEX.test(location.href)) {
        setupWorkflowPage();
      }
    };

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setup();
      }
    }).observe(document, {subtree: true, childList: true});

    setup();
})();
