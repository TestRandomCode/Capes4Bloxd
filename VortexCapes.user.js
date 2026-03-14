// ==UserScript==
// @name         Vortex Client Side Capes
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fire
// @author       GEORGECR
// @icon         https://i.postimg.cc/fRpcmPqN/Vortex-Logo.png
// @match        https://bloxd.io/*
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let targetUsernames = {};
    async function loadCapeAccess() {
        try {
            const url = "https://raw.githubusercontent.com/GEORGECR0/ClientSideCapes/refs/heads/main/CapeAcces.json";
            const res = await fetch(url + "?t=" + Date.now());
            targetUsernames = await res.json();
        } catch (e) { console.error("Cape Load Error:", e); }
    }
    loadCapeAccess();

    function findNoa() {
        const deepFindSafe = (obj, test, seen = new Set()) => {
            if (!obj || typeof obj !== 'object' || seen.has(obj)) return null;
            seen.add(obj);
            try {
                if (test(obj)) return obj;
                for (const val of Object.values(obj)) {
                    const res = deepFindSafe(val, test, seen);
                    if (res) return res;
                }
            } catch (e) {}
        };

        let noa = null;
        const getNoa = () => {
            if (noa) return noa;
            const element = document.querySelector('div.InventoryWrapper');
            if (!element) return null;
            const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
            if (!fiberKey) return null;
            const fiber = element[fiberKey];
            const test = (obj) => obj && obj.entities && typeof obj.entities.getState === 'function' && obj.camera;
            noa = deepFindSafe(fiber.memoizedProps, test) || deepFindSafe(fiber.memoizedState, test);
            window._noa = noa;
            return noa; //
        };

        const result = getNoa();

        if (result) {
            if (result.bloxd && typeof result.bloxd.entityNames === "object") {

                for (const [id, data] of Object.entries(result.bloxd.entityNames)) {

                    const username = data?.entityName;
                    const textureURL = targetUsernames[username];
                    if (!textureURL) continue;

                    if (textureURL) {
                        const capeState = result.entities.getState(Number(id), "cape");

                        if (capeState && typeof capeState.chooseCape === "function") {
                            capeState.chooseCape("super");
                            const capeMesh = capeState.mesh;
                            if (!capeMesh) return;

                            const CapeMaterial = capeMesh.material;
                            if (!CapeMaterial || !CapeMaterial.diffuseTexture) return;

                            CapeMaterial.diffuseTexture.updateURL(textureURL);
                            CapeMaterial.diffuseTexture.hasAlpha = true;
                            CapeMaterial.disableLighting = false;

                            if (typeof CapeMaterial.markAsDirty === "function")
                                CapeMaterial.markAsDirty();
                        }
                    }
                }
            }
            console.dir(result, { depth: 4 });
        }


        return result;

    }
    document.addEventListener('keydown', e => e.key === 'j' && findNoa());

})();
