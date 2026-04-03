/**
 * Menu Button Module
 * Модуль кнопки меню для загрузки маршрутов
 */

const MenuModule = {
    callback: null,
    isLoaded: false,

    getUrlParam(name) {
        if (name !== 'm') return null;
        const hash = window.location.hash.slice(1);
        if (hash) {
            const hashParams = new URLSearchParams(hash);
            let value = hashParams.get(name);
            if (value) return value;
            const hashQueryIndex = hash.indexOf('?');
            if (hashQueryIndex > -1) {
                const hashQuery = hash.substring(hashQueryIndex + 1);
                const hashQueryParams = new URLSearchParams(hashQuery);
                value = hashQueryParams.get(name);
                if (value) return value;
            }
        }
        return null;
    },

    parseRouteInput(input) {
        const trimmed = input.trim();
        const dashIndex = trimmed.indexOf('-');
        if (dashIndex > 0) {
            const id = trimmed.substring(0, dashIndex).trim();
            const name = trimmed.substring(dashIndex + 1).trim();
            if (id && name) {
                return { id, name };
            }
        }
        return { id: null, name: trimmed };
    },

    init(onRouteLoaded) {
        this.callback = onRouteLoaded;
        this.createModal();
        this.hide();
        this.checkUrlParam();

        // Обработчик на существующую кнопку #menuBtn из index.html
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.show();
                document.getElementById('routeInput').value = '';
            });
        }

        if (typeof vkBridge !== 'undefined') {
            vkBridge.subscribe((event) => {
                if (!this.isLoaded && (event && event.type === 'VKWebAppUpdateConfig' || event.detail)) {
                    this.checkUrlParam();
                }
            });
            try {
                vkBridge.send('VKWebAppGetLaunchParams')
                    .then(params => {
                if (!this.isLoaded && params && params.m) {
                    this.isLoaded = true;
                    this.hide();
                    this.loadRouteByName(params.m);
                }
                    })
                    .catch(e => {});
            } catch (e) {
            }
        }
    },

    createModal() {
        let routesHtml = '';
        if (typeof ROUTES_LIST !== 'undefined') {
            routesHtml = '<div class="routes-list">';
            for (const [routeId, routeName] of Object.entries(ROUTES_LIST)) {
                routesHtml += `<button class="route-item" data-route="${routeId}">
                    <span class="route-name">${routeName}</span>
                    <span class="route-id">${routeId}</span>
                </button>`;
            }
            routesHtml += '</div>';
        }

        const html = `
            <div id="jsonModal">
                <div class="modal-sheet">
                    <div class="modal-title">Загрузка маршрута</div>
                    <input type="text" id="routeInput" class="modal-input" placeholder="ID-название">
                    <div class="modal-buttons">
                        <button id="cancelBtn" class="modal-btn modal-btn-muted">Отмена</button>
                        <button id="loadRouteBtn" class="modal-btn modal-btn-green">Загрузить</button>
                    </div>
                    ${routesHtml}
                </div>
            </div>
        `;

        const loading = document.getElementById('loading');
        if (loading) {
            loading.insertAdjacentHTML('afterend', html);
        } else {
            document.body.insertAdjacentHTML('afterbegin', html);
        }

        document.getElementById('loadRouteBtn').addEventListener('click', () => {
            const inputValue = document.getElementById('routeInput').value.trim();
            if (!inputValue) {
                if (typeof showToast === 'function') {
                    showToast('Введите ID и название маршрута', 'error');
                }
                return;
            }
            this.loadRouteByName(inputValue);
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hide();
        });

        document.getElementById('routeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loadRouteBtn').click();
            }
        });

        document.querySelectorAll('.route-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const routeKey = btn.getAttribute('data-route');
                this.loadRouteByName(routeKey);
            });
        });
    },

    checkUrlParam() {
        const routeParam = this.getUrlParam('m');
        if (routeParam) {
            this.isLoaded = true;
            this.hide();
            this.loadRouteByName(routeParam);
        }
    },

    async loadRouteByName(routeKey) {
        try {
            this.hide();
            const url = `json/${encodeURIComponent(routeKey)}.json`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Файл маршрута не найден');
            const data = await res.json();
            this.loadRoute(data);
        } catch (e) {
            console.error('[MenuModule] Ошибка загрузки маршрута:', e);
            if (typeof showToast === 'function') {
                showToast('Ошибка загрузки: ' + e.message, 'error', 5000);
            }
        }
    },

    loadRoute(jsonData) {
        if (typeof clearRoute === 'function') {
            clearRoute();
        }
        if (typeof this.callback === 'function') {
            this.callback(jsonData);
        }
        this.isLoaded = true;
        this.hide();
    },

    hide() {
        const modal = document.getElementById('jsonModal');
        if (modal) modal.classList.add('hidden');
    },

    show() {
        const modal = document.getElementById('jsonModal');
        if (modal) modal.classList.remove('hidden');
    }
};
