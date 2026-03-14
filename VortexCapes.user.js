// ==UserScript==
// @name         Vortex Client Side Capes (Fixed)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Client side capes
// @author       11
// @icon         https://i.postimg.cc/fRpcmPqN/Vortex-Logo.png
// @match        https://bloxd.io/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let targetUsernames = {};
    let noa = null;

    async function loadCapeAccess() {
        try {
            const url = "https://raw.githubusercontent.com/TestRandomCode/BloxdCapes/main/CapeAcces.json";
            const res = await fetch(url + "?t=" + Date.now());
            targetUsernames = await res.json();
            console.log("Cape list loaded", targetUsernames);
        } catch (e) {
            console.error("Cape Load Error:", e);
        }
    }

    loadCapeAccess();

    function deepFindSafe(obj, test, seen = new Set()) {
        if (!obj || typeof obj !== 'object' || seen.has(obj)) return null;

        seen.add(obj);

        try {
            if (test(obj)) return obj;

            for (const val of Object.values(obj)) {
                const res = deepFindSafe(val, test, seen);
                if (res) return res;
            }
        } catch (e) {}

        return null;
    }

    function getNoa() {

        if (noa) return noa;

        const element = document.querySelector('div.InventoryWrapper');
        if (!element) return null;

        const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
        if (!fiberKey) return null;

        const fiber = element[fiberKey];

        const test = obj =>
            obj &&
            obj.entities &&
            typeof obj.entities.getState === "function" &&
            obj.camera;

        noa =
            deepFindSafe(fiber.memoizedProps, test) ||
            deepFindSafe(fiber.memoizedState, test);

        if (noa) {
            window._noa = noa;
            console.log("NOA Engine Found");
        }

        return noa;
    }

    function applyCapes() {

        const result = getNoa();
        if (!result) return;

        if (!result.bloxd || typeof result.bloxd.entityNames !== "object") return;

        for (const [id, data] of Object.entries(result.bloxd.entityNames)) {

            const username = data?.entityName;
            const textureURL = targetUsernames[username];

            if (!textureURL) continue;

            try {

                const capeState = result.entities.getState(Number(id), "cape");

                if (!capeState || typeof capeState.chooseCape !== "function") continue;

                capeState.chooseCape("super");

                const capeMesh = capeState.mesh;
                if (!capeMesh) continue;

                const CapeMaterial = capeMesh.material;
                if (!CapeMaterial || !CapeMaterial.diffuseTexture) continue;

                CapeMaterial.diffuseTexture.updateURL(textureURL);
                CapeMaterial.diffuseTexture.hasAlpha = true;
                CapeMaterial.disableLighting = false;

                if (typeof CapeMaterial.markAsDirty === "function") {
                    CapeMaterial.markAsDirty();
                }

            } catch (err) {
                console.warn("Cape apply failed:", err);
            }
        }
    }

    // run every few seconds
    setInterval(applyCapes, 3000);

})();
