# planbee landing

Одностраничный сайт `planbee.pro`: замеры и фиксация на объекте, ведомость объёмов и смета в офисе.

## Файлы

- `index.html` — разметка сайта и шестишаговая hero-сцена;
- `styles.css` — оформление и адаптивные состояния;
- `app.js` — прокрутка hero, вкладки ВОР/сметы и форма заявки;
- `img/planbee-bee*.svg`, `img/planbee-wordmark*.svg` — знаки нового бренда;
- `hosting-static/fonts/` — локальные Jura и Manrope;
- `scripts/generate-og.py` — генератор `og.png` и иконки iOS;
- `functions/api/lead.js` — обработчик заявок, который вызывает Node-адаптер на VPS.

Визуальные правила описаны в [BRAND.md](BRAND.md).

## Локальный просмотр

```bash
npm ci
npm run dev
```

Форма на локальном Vite-сервере не отправляет заявки: endpoint `/api/lead` работает на VPS.

## Сборка и публикация

```bash
python3 scripts/generate-og.py
npm run build
scripts/deploy.sh
```

Скрипт выкладывает `dist/` в `/srv/planbee/www/landing/` на VPS и перезапускает адаптер формы. Действующая инфраструктура и порядок проверки описаны в [DEPLOY.md](DEPLOY.md). Секреты Telegram хранятся только на сервере.
