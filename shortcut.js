// ==UserScript==
// @name         Nixpkgs Review Buttons
// @namespace    https://github.com/haylinmoore/nixpkgs-review-gha
// @version      0.1
// @description  Adds nixpkgs-review and PR Tracker buttons to Nixpkgs PRs
// @author       haylinmoore
// @match        https://github.com/NixOS/nixpkgs/pull/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/haylinmoore/nixpkgs-review-gha/main/shortcut.js
// @downloadURL  https://raw.githubusercontent.com/haylinmoore/nixpkgs-review-gha/main/shortcut.js
// ==/UserScript==

(function() {
    'use strict';

    const repo = "haylinmoore/nixpkgs-review-gha";

    const sleep = duration => new Promise(resolve => setTimeout(resolve, duration));
    const query = async (doc, sel) => {
      while (true) {
        const elem = doc.querySelector(sel);
        if (elem !== null) return elem;
        await sleep(100);
      }
    };

    const setup = async () => {
      const match = /^https:\/\/github.com\/nixos\/nixpkgs\/pull\/(\d+)/i.exec(location.href);
      if (match === null) return;

      const pr = match[1];
      const actions = await query(document, ".gh-header-show .gh-header-actions");

      if (actions.querySelector(".run-nixpkgs-review") === null) {
        const btn = document.createElement("button");
        btn.classList.add("Button", "Button--secondary", "Button--small", "run-nixpkgs-review");
        btn.innerText = "Run nixpkgs-review";
        actions.prepend(btn);
        btn.onclick = () => {
          const w = window.open(`https://github.com/${repo}/actions/workflows/review.yml`);
          w.addEventListener("load", async () => {
            (await query(w.document, "details > summary.btn")).click();
            (await query(w.document, "input.form-control[name='inputs[pr]']")).value = pr;
          });
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
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setup();
      }
    }).observe(document, {subtree: true, childList: true});
    setup();
})();

