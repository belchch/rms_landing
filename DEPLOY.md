# Деплой лендинга PlanBee на VPS

> **Актуально (2026-09-28):** прод поднят на Beget VPS `31.128.38.138` одним
> Docker Compose-стеком из `rms_platform/deploy/` (Caddy с автоматическим HTTPS,
> API, веб-кабинет, хранилище фото, приём заявок). Лендинг выкладывается
> командой `scripts/deploy.sh`; форма `/api/lead` работает через
> `deploy/lead-server.mjs`, секреты `TG_BOT_TOKEN` и `TG_CHAT_ID` лежат в
> `/srv/planbee/.env` на сервере. Ручная схема nginx + certbot ниже оставлена
> как справка и не используется.

Инструкция по первичной настройке сервера и публикации лендинга под доменом.

Сингапурский Vultr для этого не использовать: тот IP — выход Amnezia, с РФ
сайт не открывается. Следующий хост — VPS в РФ.

## Карта адресов

```
planbee.pro          → лендинг (канонический адрес)
app.planbee.pro      → SaaS-кабинет (позже)
api.planbee.pro      → бэкенд (позже)
planbeeapp.ru        → 301 на planbee.pro
```

Правило: у каждого сервиса ровно один живой адрес. Второй домен только редиректит —
иначе разъезжаются куки сессии, universal links и redirect URI в OAuth.

Universal links (`apple-app-site-association`, `assetlinks.json`) вешаются только
на `planbee.pro`.

## Предпосылки

- VPS с Ubuntu 22.04+ или Debian 12+, доступ по SSH под root.
- Локально Node.js 22.13+ (требование `package.json`).
- Зона `planbee.pro` — DNS-master Anycast nic.ru. Редактор записей:
  Домены → `planbee.pro` → DNS-премиум → панель управления.
  Платный «DNS-хостинг» не нужен.
- `planbeeapp.ru` в первом выкладке не трогаем.

Ниже `SERVER_IP` — IP российского сервера, подставь свой.

## Шаг 1. DNS

В редакторе зоны `planbee.pro` поставь A-записи:

| Имя | Тип | Значение |
|-----|-----|----------|
| `@` | A | `SERVER_IP` |
| `www` | A | `SERVER_IP` |

Записи `app` и `api` можно добавить сразу — они понадобятся позже, а прогрев DNS
займёт время.

Проверить распространение (должен вернуться твой IP):

```bash
dig +short planbee.pro
```

Пока запись не разошлась, `certbot` на шаге 7 не сработает.

## Шаг 2. Сборка лендинга (локально)

```bash
cd ~/AIProjects/rms_landing && npm ci && npm run build
```

Результат — каталог `dist/`: `index.html`, `assets/`, `og.png` и `server/`.
Каталог `server/` — сборка воркера под edge-рантайм, на VPS он не используется
и наружу отдаваться не должен.

## Шаг 3. Заливка на сервер

```bash
rsync -avz --delete --exclude 'server/' ~/AIProjects/rms_landing/dist/ root@SERVER_IP:/var/www/planbee.pro/
```

`--exclude 'server/'` не даёт выложить серверную сборку в публичный каталог.

## Шаг 4. Установка nginx и certbot (на сервере)

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
```

## Шаг 5. Конфиг nginx

```bash
cat > /etc/nginx/sites-available/planbee.pro <<'EOF'
server {
    listen 80;
    server_name planbee.pro www.planbee.pro;

    root /var/www/planbee.pro;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

## Шаг 6. Включение

```bash
ln -sf /etc/nginx/sites-available/planbee.pro /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx
```

## Шаг 7. HTTPS

Certbot сам перепишет конфиги под 443, настроит редирект с HTTP и включит
автопродление сертификатов.

```bash
certbot --nginx -d planbee.pro -d www.planbee.pro
```

Проверить, что автопродление работает:

```bash
certbot renew --dry-run
```

## Шаг 8. Проверка

```bash
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" https://planbee.pro
```

Ожидаемо: `200 https://planbee.pro/`.

## Обновление лендинга

Повторить шаги 2 и 3. Одной строкой:

```bash
cd ~/AIProjects/rms_landing && npm run build && rsync -avz --delete --exclude 'server/' dist/ root@SERVER_IP:/var/www/planbee.pro/
```

## Форма заявки (`POST /api/lead`)

На статике форма не работает. Логика лежит в `functions/api/lead.js` — это обычный
обработчик на Web API (`Request` / `Response`), и Node 22 умеет его выполнять без
переписывания. Чтобы поднять её на VPS, нужно:

1. Адаптер поверх `node:http`, который вызывает `onRequestPost({ request, env })`
   и слушает `127.0.0.1:8787`.
2. Systemd-юнит для этого процесса.
3. Секреты `TG_BOT_TOKEN` и `TG_CHAT_ID` в `EnvironmentFile`
   (`/etc/planbee/lead.env`, права `600`), **не в репозитории**.
4. Проксирование в конфиге nginx, внутри серверного блока `planbee.pro`:

   ```nginx
   location /api/lead {
       proxy_pass http://127.0.0.1:8787;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
   }
   ```

   Заголовок `X-Forwarded-For` обязателен — на нём держится rate limit в `lead.js`.

## Заметки

- Персональные данные из формы уезжают в Telegram. При работе с российскими
  организациями это попадает под 152-ФЗ: первичная запись должна быть на серверах
  в РФ. К первым реальным клиентам приём заявок стоит перенести на свою сторону.
- `app.planbee.pro` и `api.planbee.pro` поднимаются отдельными серверными блоками;
  сертификаты для них добавляются повторным вызовом `certbot --nginx -d ...`.
- Куки сессии ставить на `.planbee.pro`, чтобы лендинг и кабинет видели общий вход.
