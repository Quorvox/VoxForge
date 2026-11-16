# VoxForge

Игровой движок и редактор от **Quorvox_team**. Это форк [GDevelop](https://github.com/4ian/GDevelop) 5.6.287 (лицензия MIT).

> **Статус: альфа.** Работает, но многое сырое. Баги ожидаемы, API и формат проектов могут поменяться.

## Что отличается от GDevelop

- **Код-игра.** Полноэкранный редактор кода для игр microStudio: файлы, вкладки, Monaco, спрайты, звуки, музыка, запуск с консолью (F5).
- **Python и JavaScript.** Событие «Код Python» (Pyodide) и режим кода для скриптов сцены.
- **Проект как папка на компьютере.** `game.json`, `layouts/`, `scripts/`. Открывается в VS Code прямо из редактора.
- **Локальная сборка APK и EXE.** Небольшой сервис на Node (Cordova и Electron), без облака.
- **Десктопная версия** на Electron.
- **Новый дизайн.** Тёмная тема, стекло, выбор акцентного цвета, русский интерфейс.
- **Вход через Quorvox ID** (папка `voxforge-auth`, мост OIDC).
- Убраны облачные сервисы и реклама GDevelop, оставлены только бесплатные шаблоны.

## Запуск из исходников

Нужны Node.js 20+ и Git. Библиотека libGD (wasm) берётся готовой, C++ пересобирать не нужно.

```bash
cd newIDE/app
npm install
npm run import-resources   # подтянуть runtime-файлы
npm start                  # редактор в браузере на localhost
```

Десктопная версия: `newIDE/electron-app` (`npm install`, затем `npm start`).
Подробности по исходной сборке смотри в [README.gdevelop.md](README.gdevelop.md).

## Чего ещё нет

- Тип «Приложение» (кнопка есть, помечена «скоро»), сборка под iOS, подпись APK и EXE.
- Карты и документы в Код-игре, встроенный VS Code.
- Часть экранов GDevelop ещё содержит старые ссылки.

## Лицензия и авторство

Основано на GDevelop © Florian Rival и контрибьюторы, лицензия MIT (см. [LICENSE.md](LICENSE.md) и [NOTICE.md](NOTICE.md)). Изменения VoxForge © Quorvox_team, тоже MIT.

VoxForge — независимый проект, **не связан** с GDevelop и не одобрен его авторами. Название и логотип GDevelop принадлежат Florian Rival.
