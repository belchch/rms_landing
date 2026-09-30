# planbee landing

Бренд-лендинг `planbee` в стиле плана: слово из стен, проёмы, точка лазера.
Ветка `plan-style-2026-09-30` — редизайн 2026-09-30; на `main` прежняя версия.

## Структура

- `src/index.html`, `src/mockup.html` — шаблоны страниц; `src/screens.html` —
  экраны мобильного макета, общие для обеих страниц;
- `scripts/assemble.py` — собирает `index.html` и `mockup/index.html` из
  шаблонов, встраивая SVG-знак и экраны. Править нужно `src/`, потом
  `python3 scripts/assemble.py`;
- `styles.css` — дизайн-система: токены, кнопки, комнаты-карточки, телефоны;
- `app.js` — reveal и отправка формы;
- `functions/api/lead.js` — обработчик заявок (Telegram), `deploy/lead-server.mjs` — адаптер на VPS;
- `img/planbee-wordmark-{black,white}.svg` — знак; `img/app-icon-b-*.svg` — иконка;
- `favicon.svg`, `hosting-static/og.png` — фавикон и карточка для соцсетей;
- `BRAND.md` — правила бренда.

## Локальный просмотр

```bash
npm run dev
```

Форма при таком просмотре не отправляет заявки: нужен `deploy/lead-server.mjs`.

## Деплой

`scripts/deploy.sh` — на прод (`planbee.pro`). Предпросмотр редизайна лежит по
адресу `planbee.pro/next/` (сборка с `--base=/next/`, rsync в
`/srv/planbee/www/landing/next/`); при следующем деплое `main` папка
`next/` стирается.

Подробности: `DEPLOY.md`.
