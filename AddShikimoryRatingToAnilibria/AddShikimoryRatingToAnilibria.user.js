// ==UserScript==
// @name         Add Shikimori Rating to Anilibria
// @namespace    https://github.com/KaMZeSs/TamperMonkeyScripts
// @version      0.1
// @description  Add Shikimori rating to Anilibria anime pages
// @author       KaMZeSs
// @match        https://anilibria.top/anime/releases/release/*
// @icon         https://anilibria.top/static/favicon-32x32.png?v=74c785bd6cf5
// @grant        GM_xmlhttpRequest
// @connect      shikimori.one
// ==/UserScript==

(function () {
    'use strict';

    let called = false;

    // Загружаем иконку Shikimori заранее
    const shikimoriIconUrl = 'https://shikimori.one/favicon.ico';
    const shikimoriIcon = new Image();
    shikimoriIcon.src = shikimoriIconUrl;

    function execute() {
        if (called) return;
        called = true;

        // Получаем название тайтла с Anilibria
        let link_arr = window.location.href.split('/');
        const title = link_arr[link_arr.length - 2].trim();

        function getShikimoriRating(title) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://shikimori.one/api/animes?search=${encodeURIComponent(title)}`,
                headers: {
                    'User-Agent': 'Tampermonkey Script',
                    'Accept': 'application/json'
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.length > 0) {
                            const anime = data[0]; // Берем первый результат
                            const rating = anime.score;
                            const shikimoriUrl = `https://shikimori.one/animes/${anime.id}`;
                            console.log(shikimoriUrl);
                            addRatingToPage(rating, shikimoriUrl);
                        } else {
                            console.error('No results found on Shikimori');
                        }
                    } else {
                        console.error('Failed to fetch data from Shikimori');
                    }
                },
                onerror: function () {
                    console.error('Error occurred while fetching data from Shikimori');
                }
            });
        }

        function addRatingToPage(rating, shikimoriUrl) {
            if (document.querySelector('.shikimori-rating')) {
                return;
            }

            // Список элементов с данными
            const container = document.querySelector('.fz-80.ff-body.mb-3');

            // Новый элемент для рейтинга
            const ratingElement = document.createElement('div');
            ratingElement.classList.add('shikimori-rating', 'd-flex', 'align-center');
            ratingElement.innerHTML = `
                <div class="text-grey-darken-1 mr-1">Shikimori:</div>
                <div>${rating}</div>
            `;

            // Ссылка на Shikimori
            const shikimoriLink = document.createElement('a');
            shikimoriLink.href = shikimoriUrl;
            shikimoriLink.target = '_blank';
            shikimoriLink.style.marginLeft = '5px';

            // Иконка Shikimori (загружена заранее)
            const shikimoriIconElement = shikimoriIcon.cloneNode();
            shikimoriIconElement.style.width = '16px';
            shikimoriIconElement.style.height = '16px';
            shikimoriIconElement.style.verticalAlign = 'middle';
            shikimoriLink.appendChild(shikimoriIconElement);

            ratingElement.appendChild(shikimoriLink);
            container.appendChild(ratingElement);
        }

        // Запускаем поиск рейтинга
        getShikimoriRating(title);
        called = false;
    }

    // MutationObserver для отслеживания изменений
    const observer = new MutationObserver((mutations) => {
        execute();
    });

    // Наблюдаем за изменениями в элементе <title>
    observer.observe(document.querySelector('title'), { childList: true });
})();
