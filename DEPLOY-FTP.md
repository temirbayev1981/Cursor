# Деплой на свой хостинг (FTP + субдомен)

Автозагрузка через **GitHub Actions** — вручную на FTP ничего копировать не нужно.

**Пароль и логин FTP никогда не пишите в чат и не коммитьте в репозиторий** — только в секреты GitHub.

---

## 1. Подготовьте субдомен на хостинге

Пример: `app.ваш-домен.ru` → папка `public_html/app` (названия зависят от панели: cPanel, ISPmanager, Timeweb и т.д.).

1. В панели хостинга создайте **субдомен** (например `app`).
2. Запомните **путь к папке** на сервере, куда попадают файлы субдомена. Частые варианты:
   - `/public_html/app/`
   - `/www/app.ваш-домен.ru/`
   - `/domains/ваш-домен.ru/public_html/app/`
3. Убедитесь, что включён **Apache + mod_rewrite** (для SPA нужен `.htaccess` — он уже в `public/.htaccess` и попадает в `dist/` при сборке).

---

## 2. Данные FTP (из панели хостинга)

В разделе **FTP-аккаунты** / **Файловый менеджер** найдите:

| Параметр | Пример | Куда пойдёт |
|----------|--------|-------------|
| Хост (server) | `ftp.ваш-домен.ru` | секрет `FTP_HOST` |
| Логин | `u1234567` | секрет `FTP_USER` |
| Пароль | `••••••••` | секрет `FTP_PASSWORD` |
| Порт | `21` (обычно) | секрет `FTP_PORT` (опционально) |
| Папка субдомена | `/public_html/app/` | секрет `FTP_SERVER_DIR` |

Для **FTPS** (шифрование): по умолчанию `ftps` + passive mode через `lftp`.

---

## 3. Секреты в GitHub (логин и пароль — сюда)

1. Откройте: https://github.com/temirbayev1981/Cursor  
2. **Settings** → **Secrets and variables** → **Actions**  
3. **New repository secret** — создайте по одному:

### Обязательные (FTP)

| Secret | Значение |
|--------|----------|
| `FTP_HOST` | `ftp.ваш-домен.ru` |
| `FTP_USER` | логин FTP |
| `FTP_PASSWORD` | пароль FTP |
| `FTP_SERVER_DIR` | папка субдомена, напр. `/public_html/app/` (слэш в конце добавится автоматически) |

### Обязательные (Supabase)

| Secret | Значение |
|--------|----------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key из Supabase |

### Для субдомена в корне (обычно так)

| Secret | Значение |
|--------|----------|
| `VITE_BASE_PATH` | `/` |

**Важно:** `FTP_SERVER_DIR` (папка на сервере, напр. `/handy/`) — это **не** URL-путь.  
Для `https://handy.readyfixnc.com/` (субдомен) всегда ставьте `VITE_BASE_PATH=/`, даже если FTP-папка называется `handy`.

Если ошибочно указать `VITE_BASE_PATH=/handy/`, сайт будет белым: HTML ищет `/handy/assets/...`, а файлы лежат в `/assets/...`.

Если сайт в **подпапке** (не субдомен), а по адресу `ваш-домен.ru/handymanos/`:

| Secret | Значение |
|--------|----------|
| `VITE_BASE_PATH` | `/handymanos/` |

### Опционально

| Secret | Назначение |
|--------|------------|
| `FTP_PORT` | `21` (FTPS explicit) или `990` (FTPS implicit) |
| `FTP_PROTOCOL` | `ftps` = explicit TLS на порту 21 (как FileZilla). `ftps-legacy` = implicit, порт 990 |
| `VITE_STRIPE_*`, `VITE_GOOGLE_MAPS_API_KEY`, … | как в [DEPLOYMENT.md](./DEPLOYMENT.md) |

После сохранения секретов их **нельзя просмотреть** — только перезаписать.

---

## 4. Запуск автодеплоя

Workflow: `.github/workflows/deploy-ftp.yml`

### Вручную

1. **Actions** → **Deploy FTP**  
2. **Run workflow** → **Run workflow**  
3. Через 2–4 минуты файлы из `dist/` окажутся на FTP.

### Автоматически

При каждом **push в `main`** деплой на FTP запустится сам (если заданы `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`).

Если FTP-секретов нет — workflow **тихо пропускается**, ошибки не будет.

---

## 5. Supabase — разрешить субдомен

В Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://app.ваш-домен.ru`
- **Redirect URLs:** добавьте  
  `https://app.ваш-домен.ru/**`

---

## 6. Проверка

1. Откройте `https://app.ваш-домен.ru`  
2. Должна открыться страница входа HandymanOS AI (не 404 на `/login`).  
3. Зарегистрируйтесь и пройдите онбординг.

Если белый экран или 404 на внутренних страницах — проверьте `.htaccess` в корне субдомена и `VITE_BASE_PATH`.

---

## 7. Частые проблемы

| Симптом | Решение |
|---------|---------|
| Workflow не появляется / скипается | Добавьте `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` |
| `530 Login incorrect` | Проверьте логин/пароль в секретах |
| `gnutls_handshake: unexpected TLS packet` | Оставьте `FTP_PROTOCOL=ftps` и `FTP_PORT=21` (explicit TLS). Не используйте `ftps://` на 21 вручную |
| `ECONNRESET` (data socket) | Passive FTPS через lftp. Проверьте: не блокировать «чужие IP» на хостинге |
| Деплой висит 10+ минут | Отмените run (Cancel), обновите workflow, перезапустите. Норма: 2–5 мин на ~4 MB |
| Белый/синий экран после смены `VITE_BASE_PATH` | Очистите кэш сайта (Settings → Clear site data) или откройте в режиме инкогнито; перезапустите Deploy FTP |
| Ошибка сертификата TLS | В workflow уже `ssl:verify-certificate no` (lftp) |
| Файлы не в той папке | Исправьте `FTP_SERVER_DIR` (слэш в конце добавится автоматически) |
| Сайт без стилей | Неверный `VITE_BASE_PATH` — для субдомена ставьте `/` |
| 404 на `/dashboard` и т.п. | Нет mod_rewrite / `.htaccess` — загрузите из `dist/.htaccess` |
| «Supabase required» | Добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, перезапустите Deploy FTP |

---

## 8. GitHub Pages vs FTP

Можно использовать **оба** варианта параллельно:

- GitHub Pages: workflow **Deploy**
- Свой домен: workflow **Deploy FTP**

Для продакшена на своём домене обычно достаточно только **Deploy FTP**.

---

## Безопасность

- Не отправляйте пароль FTP в Telegram, email или Issues.  
- При утечке — смените пароль в панели хостинга и обновите секрет `FTP_PASSWORD` в GitHub.  
- Доступ к секретам имеют только владельцы/админы репозитория с правом **Settings**.
