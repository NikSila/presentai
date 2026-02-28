# Presentation Maker

Генератор презентаций с помощью **Claude API** или **ChatGPT (OpenAI) API**. Поддержка загрузки брендбука (файлы или ссылка) — извлечение стиля и применение к слайдам.

## Возможности

- Генерация презентации по теме (профессиональный контент, 6–14 слайдов).
- Стиль из брендбука: загрузка изображений или ссылка на страницу/картинку.
- Два провайдера: Claude (Anthropic) или ChatGPT (OpenAI), переключение через `.env`.
- Выгрузка в PPTX с дизайном: шапка, акценты, футер с нумерацией.

## Установка

```bash
cd presentation_maker
cp .env.example .env
# В .env укажите API_PROVIDER (anthropic или openai) и соответствующий ключ
npm install
npm run dev
```

Откройте http://localhost:3000

## API

- `POST /api/extract-brand` — загрузка файлов (brandBook), ответ: JSON стиля.
- `POST /api/extract-brand-from-url` — тело `{ "url": "https://..." }`, ответ: JSON стиля.
- `POST /api/generate` — тело `{ "topic": "...", "brandStyle": {...} }`, ответ: PPTX.
- `GET /api/health` — статус и активная модель.

## Переменные окружения

- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (по умолчанию claude-sonnet-4-20250514, опция claude-opus-4-6).
- `OPENAI_API_KEY`, `OPENAI_MODEL` (по умолчанию gpt-4o-mini).
- `API_PROVIDER` — anthropic или openai.
