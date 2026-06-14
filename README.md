# Natours

Полнофункциональное веб-приложение для бронирования туров на природу. Сделано как глубокое погружение в стек **Node.js / Express / MongoDB** — авторизация, платежи, загрузка файлов, транзакционная почта, серверный рендеринг и REST API в одном проекте.

**Живая демка:** https://natours-course-production.up.railway.app

> Тестовый аккаунт: `test@natours.io` / `test1234` (или зарегистрируй свой)

---

## Возможности

- **REST API** (`/api/v1/...`) — туры, пользователи, отзывы, бронирования
- **SSR-сайт** на Pug с тем же бэкендом
- **JWT-авторизация** через httpOnly cookies, роли `user` / `guide` / `lead-guide` / `admin`
- **Сброс пароля** по email через одноразовый токен
- **Stripe Checkout** для оплаты туров + вебхук для сохранения заказов в БД
- **Загрузка изображений** — аватарки и фото туров через `multer`, ресайз через `sharp`, хранение на **Cloudinary**
- **Почта** — `Yandex 360 SMTP` в проде, `Mailtrap` в деве (через `nodemailer`)
- **Геозапросы** — туры в радиусе от точки, расчёт расстояний
- **Агрегации** — статистика по сложности, план туров на год по месяцам
- **Безопасность** — `helmet`, rate-limit, защита от NoSQL-инъекций, XSS, HPP, CORS, secure cookies, белый список параметров
- **Адаптивный UI**, карта Mapbox с управлением зумом, мгновенный предпросмотр загружаемой аватарки

---

## Стек

**Backend:** Node.js 22 · Express 5 · MongoDB Atlas · Mongoose 9
**Frontend:** Pug · vanilla JS (сборка Parcel) · Mapbox GL · Axios
**Auth:** JWT · bcryptjs · cookie-parser
**Файлы и изображения:** Multer · Sharp · Cloudinary
**Платежи:** Stripe Checkout + webhook
**Email:** Nodemailer · Yandex 360 SMTP (prod) · Mailtrap (dev) · Pug-шаблоны · html-to-text
**Безопасность:** Helmet · express-rate-limit · express-mongo-sanitize · xss-clean · hpp · CORS
**Деплой:** Railway

---

## Архитектура

Классический **MVC** на Express:

```
.
├── app.js              # Express-приложение — middleware, безопасность, подключение роутеров
├── server.js           # Точка входа — подключение к БД, запуск, глобальные обработчики ошибок
├── models/             # Mongoose-схемы + бизнес-логика (хуки, instance-методы)
├── controllers/        # Обработчики запросов (REST + view controllers)
├── routes/             # Mounted роутеры (/api/v1/tours, /api/v1/users, ...)
├── views/              # Pug-шаблоны (страницы + письма)
├── public/             # Статика (css, js-бандл, изображения)
└── utils/              # catchAsync, AppError, APIFeatures, email
```

Одно Express-приложение обслуживает и REST API, и SSR-сайт.

---

## Краткий обзор API

```
GET    /api/v1/tours                       список туров (фильтр / сортировка / поля / пагинация)
GET    /api/v1/tours/:id                   получить тур
POST   /api/v1/tours                       создать тур                  [admin, lead-guide]
PATCH  /api/v1/tours/:id                   обновить тур                 [admin, lead-guide]
DELETE /api/v1/tours/:id                   удалить тур                  [admin, lead-guide]

GET    /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit
GET    /api/v1/tours/distances/:latlng/unit/:unit
GET    /api/v1/tours/tour-stats
GET    /api/v1/tours/monthly-plan/:year                                 [protected]

POST   /api/v1/users/signup
POST   /api/v1/users/login
GET    /api/v1/users/logout
POST   /api/v1/users/forgotPassword
PATCH  /api/v1/users/resetPassword/:token
PATCH  /api/v1/users/updateMyPassword                                   [protected]
GET    /api/v1/users/me                                                 [protected]
PATCH  /api/v1/users/updateMe                                           [protected]
DELETE /api/v1/users/deleteMe                                           [protected]

POST   /api/v1/reviews                                                  [user]
GET    /api/v1/tours/:tourId/reviews
GET    /api/v1/bookings/checkout-session/:tourId                        [protected]
```

---

## Запуск локально

### Требования

- Node.js **22+**
- MongoDB (подойдёт Atlas)

### Установка

```bash
git clone https://github.com/01100101011001110110111101110010/natours.git
cd natours
npm install
cp config.env.example config.env   # заполни значения (см. ниже)
npm run build:js                   # сборка фронта
npm run dev                        # запуск с nodemon
```

Приложение на http://localhost:8000

### Переменные окружения (`config.env`)

```env
NODE_ENV=development
PORT=8000

DATABASE=mongodb+srv://<user>:<PASSWORD>@cluster.mongodb.net/natours
DATABASE_PASSWORD=...

JWT_SECRET=your-very-long-random-secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email (dev — Mailtrap)
EMAIL_USERNAME=...
EMAIL_PASSWORD=...
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=hello@yourdomain.ru

# Email (prod — Yandex 360 SMTP, нужен пароль приложения)
EMAIL_HOST_PROD=smtp.yandex.ru
EMAIL_PORT_PROD=465
EMAIL_USERNAME_PROD=your@yourdomain.ru
EMAIL_PASSWORD_PROD=your-yandex-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

```

### Загрузка тестовых данных

```bash
node dev-data/data/import-dev-data.js --import   # залить тестовые туры/юзеров/отзывы
node dev-data/data/import-dev-data.js --delete   # очистить коллекции
```

---

## Что я освоил на этом проекте

- Дизайн REST API вокруг ресурсов (а не глаголов), единый формат ответа
- Слоистая обработка ошибок — обёртка `catchAsync` + кастомный `AppError` + глобальный middleware с разделением dev/prod
- Тонкости Mongoose — virtual populate, query/document middleware, aggregation pipelines, геоиндексы
- JWT-авторизация по уму — httpOnly + secure cookies, инвалидация токенов при смене пароля, проверка ролей
- Production-харднинг Express — Helmet, rate limit, санитизация, CORS, trust proxy за Railway
- Полная интеграция Stripe Checkout, включая webhook с raw body
- Пайплайн обработки изображений — Multer в память → Sharp ресайз → выгрузка на Cloudinary
- Решение реальных проблем деплоя — настройка production-SMTP (Yandex 360 с паролем приложения), эфемерная файловая система Railway (перевод загрузок на Cloudinary)
- Сборка фронта через Parcel, Axios для интерактива поверх SSR-страниц

---

## Источник

Костяк проекта основан на курсе **Jonas Schmedtmann** «Node.js, Express, MongoDB & More». Существенно расширен сверх курса: production-деплой на Railway, Cloudinary, Resend, мобильная адаптация, управление картой, превью аватарки, актуальные версии зависимостей (Express 5, Mongoose 9, Node 22) и набор баг-фиксов.

---

## English summary

**Natours** — full-stack tour booking app built with **Node.js 22, Express 5, MongoDB / Mongoose 9**.
Features: REST API + SSR website (Pug), JWT auth with httpOnly cookies and role-based access, Stripe Checkout with webhooks, image upload pipeline (Multer + Sharp + Cloudinary), transactional email via Yandex 360 SMTP (prod) / Mailtrap (dev), geospatial queries, MongoDB aggregation, and production security hardening (Helmet, rate limiting, sanitization, CORS).
Deployed on **Railway**: https://natours-course-production.up.railway.app

Based on Jonas Schmedtmann's Node course, significantly extended with real production deploy, Cloudinary integration, Yandex SMTP for production email, responsive mobile layout and modern dependency versions.
