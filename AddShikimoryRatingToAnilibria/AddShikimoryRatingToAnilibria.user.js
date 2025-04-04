// ==UserScript==
// @name         Add Shikimori Rating to Anilibria
// @namespace    https://github.com/KaMZeSs/TamperMonkeyScripts
// @version      0.2
// @description  Add Shikimori rating to Anilibria anime pages
// @author       KaMZeSs
// @match        https://anilibria.top/*
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

    function delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }

    async function execute() {
        if (called) return;
        called = true;

        // Функция для преобразования сезона в нужный формат
        function getSeasonFormat(season) {
            switch (season.toLowerCase()) {
                case 'весна':
                    return 'spring';
                case 'лето':
                    return 'summer';
                case 'осень':
                    return 'autumn';
                case 'зима':
                    return 'winter';
                default:
                    return 'unknown';
            }
        }

        // Функция для получения элемента по текстовой метке
        function getElementByLabelText(labelText) {
            const elements = document.querySelectorAll('.d-flex.align-center');
            for (let element of elements) {
                const children = element.children;
                for (let child of children) {
                    if (child.textContent.trim() === labelText) {
                        return child.nextElementSibling.textContent.trim();
                    }
                }
            }
            return null;
        }

        function getShikimoriRating(title, season) {
            // Проверяем, известен ли сезон
            let url = `https://shikimori.one/api/animes?search=${encodeURIComponent(title)}`;
            if (season !== 'unknown' && season !== null) {
                url += `&season=${encodeURIComponent(season)}`;
            }

            const maxAttempts = 2; // Максимальное количество попыток
            const maxSeasonAttempts = 1;
            const maxWithoutSeasonAttempts = 1;
            let attempts = 0;
            let seasonAttempts = 0; // Счетчик попыток с сезоном
            let withoutSeasonAttempts = 0; // Счетчик попыток без сезона

            function makeRequest() {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
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
                        } else if (response.status === 422) {
                            console.warn('Shikimori returned 422 error');
                            retryOrReport();
                        } else {
                            console.error(`Failed to fetch data from Shikimori ${response.status}`);
                        }
                    },
                    onerror: function () {
                        console.error('Error occurred while fetching data from Shikimori');
                        retryOrReport();
                    }
                });
            }

            function retryOrReport() {
                attempts++;
                if (attempts <= maxAttempts) {
                    console.log(`Attempt ${attempts}/${maxAttempts} (${seasonAttempts} with season, ${withoutSeasonAttempts} without season)...`);
                    if (season !== 'unknown' && season !== null && seasonAttempts < maxSeasonAttempts) {
                        seasonAttempts++;
                        console.log('Retrying with season...');
                        makeRequest();
                    } else if (withoutSeasonAttempts < maxWithoutSeasonAttempts) {
                        withoutSeasonAttempts++;
                        console.log('Retrying without season...');
                        url = `https://shikimori.one/api/animes?search=${encodeURIComponent(title)}`;
                        makeRequest();
                    } else {
                        console.error(`Max attempts (${maxAttempts}) reached, giving up.`);
                    }
                } else {
                    console.error(`Max attempts (${maxAttempts}) reached, giving up.`);
                }
            }

            makeRequest(); // Начинаем первую попытку
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

        function getTitle() {
            // Получаем название тайтла с Anilibria
            let link_arr = window.location.href.split('/');
            const title = link_arr[link_arr.length - 2].trim();

            return title
        }

        if (!window.location.href.startsWith('https://anilibria.top/anime/releases/release/')) {
            called = false;
            console.log('not release')
            return;
        }

        console.log('release')

        const title = getTitle();
        console.log(`title: ${title}`);

        const maxYearAttempts = 10;
        let yearAttempts = 0;

        let year = getElementByLabelText('Год выхода:');

        while (true) {
            if (year) {
                break;
            }
            yearAttempts++;
            console.warn(`year await ${yearAttempts}/${maxYearAttempts}`);
            await delay(200);
            year = getElementByLabelText('Год выхода:');
        }

        // Получаем сезон и год
        const season = getElementByLabelText('Сезон:');

        // Преобразуем сезон в нужный формат
        const seasonFormatted = getSeasonFormat(season);

        // Собираем результат
        let result = '';
        if (seasonFormatted !== 'unknown' && year !== null) {
            result = `${seasonFormatted}_${year}`;
        } else {
            result = 'unknown';
        }

        console.log(`season: ${result}`);

        // Запускаем поиск рейтинга
        getShikimoriRating(title, result);
        called = false;
    }

    // MutationObserver для отслеживания изменений
    const observer = new MutationObserver(() => {
        execute();
    });

    observer.observe(document.head, { childList: true, subtree: true });
})();
