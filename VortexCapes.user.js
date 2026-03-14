// ==UserScript==
// @name         Vortex Copied Client
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fire
// @author       ME
// @icon         https://i.postimg.cc/fRpcmPqN/Vortex-Logo.png
// @match        https://bloxd.io/*
// @run-Vortex Copied Client
// ==/UserScript==

(function() {
    'use strict';
    let targetUsernames = {};
    async function loadCapeAccess() {
        try {
            const url ="https://raw.githubusercontent.com/TestRandomCode/Capes4Bloxd/refs/heads/main/CapesAccess.json";
            const res = await fetch(url + "?t=" + Date.now());
            targetUsernames = await res.json();
        } catch (e) { console.error("Cape Load Error:", e); }
    }
    loadCapeAccess();

    const findAndLogNoa = () => {

        const isNoa = o =>
        o && typeof o === 'object' &&
              o.entities && typeof o.entities.getState === 'function' &&
              o.camera && typeof o.camera.getDirection === 'function' &&
              o.world && typeof o.world.getBlock === 'function';

        const isEntityMgr = o =>
        o && typeof o === 'object' &&
              o.entities && typeof o.entities.getState === 'function';

        function deepScan(obj, check, visited = new Set()) {
            if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
            visited.add(obj);

            try {
                if (check(obj)) return obj;
                for (const v of Object.values(obj)) {
                    const found = deepScan(v, check, visited);
                    if (found) return found;
                }
            } catch {}
            return null;
        }

        function walkFibers(f) {
            let node = f;
            let steps = 0;
            while (node && steps < 40) {
                if (node.memoizedProps) {
                    const match = deepScan(node.memoizedProps, isNoa) || deepScan(node.memoizedProps, isEntityMgr);
                    if (match) return match;
                }
                if (node.memoizedState) {
                    const match = deepScan(node.memoizedState, isNoa) || deepScan(node.memoizedState, isEntityMgr);
                    if (match) return match;
                }
                node = node.return;
                steps++;
            }
            return null;
        }

        let result = null;
        for (const el of document.querySelectorAll('*')) {
            const fKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
            if (fKey) {
                result = walkFibers(el[fKey]);
                if (result) break;
            }
        }

        if (result) {
            window._noa = result;

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

            console.log("%c[Vortex Test Hook]", "color: #304870; font-weight: bold; font-size: 14px;", "Noa:");
            console.dir(result, { depth: 4 });

        } else {
            console.log("%c[Vortex Test Hook]", "color: #562121; font-weight: bold; font-size: 14px;", "Noa Failed To Run");
        }
    };
    document.addEventListener('keydown', e => e.key === 'j' && findAndLogNoa());

})();
