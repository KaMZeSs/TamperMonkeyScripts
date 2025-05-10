// ==UserScript==
// @name         Steam Profile CS2 Info Links
// @namespace    https://github.com/KaMZeSs/TamperMonkeyScripts
// @version      0.1
// @description  Добавляет ссылки на CS2 профили (leetify, csstats) в профиле Steam
// @author       KaMZeSs
// @match        https://steamcommunity.com/id/*
// @match        https://steamcommunity.com/profiles/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const insertLinks = () => {
        if (typeof g_rgProfileData === 'undefined' || !g_rgProfileData.steamid) return;

        const steamID64 = g_rgProfileData.steamid;
        const statusContainer = document.querySelector('.responsive_status_info');
        if (!statusContainer) return;

        if (document.getElementById('cs2_links_container')) return;

        const container = document.createElement('div');
        container.id = 'cs2_links_container';
        container.style.marginTop = '10px';

        const header = document.createElement('div');
        header.className = 'profile_in_game_header';
        header.textContent = 'CS2 Аналитика';

        const linkList = document.createElement('div');
        linkList.className = 'profile_in_game_name';

        const leetifyLink = document.createElement('a');
        leetifyLink.href = `https://leetify.com/app/profile/${steamID64}`;
        leetifyLink.target = '_blank';
        leetifyLink.textContent = 'Leetify';
        leetifyLink.style.marginRight = '10px';

        const csstatsLink = document.createElement('a');
        csstatsLink.href = `https://csstats.gg/player/${steamID64}`;
        csstatsLink.target = '_blank';
        csstatsLink.textContent = 'CSStats';

        linkList.appendChild(leetifyLink);
        linkList.appendChild(csstatsLink);

        container.appendChild(header);
        container.appendChild(linkList);
        statusContainer.appendChild(container);
    };

    const observer = new MutationObserver((mutations, obs) => {
        const statusContainer = document.querySelector('.responsive_status_info');
        if (statusContainer && typeof g_rgProfileData !== 'undefined') {
            insertLinks();
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
