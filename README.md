# Мессендер ⚡Maximum⚡

Ловит даже на парковке!

## Как запустить проект?

Из корневой директории прописываем:

```bash
docker compose up -d --build
```

## Сборка и запуск бэкенда (Отдельно, рекомендуется собирать всё вместе)

### Сборка

Из корня прописываем:

```bash
docker build -t messanger-backend backend
```

### Запуск бэкенда

Из `./backend`:

```bash
docker run --rm -p 18080:18080 messanger-backend
```
