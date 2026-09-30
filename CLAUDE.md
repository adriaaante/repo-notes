# CLAUDE.md — adriaaante/repo-notes

## Что это
Единый скилл `/repo-notes` (правила работы, память CLAUDE.md, документы и отчёты FutureFlow) и
скрипт окружения облачных сессий, который его ставит. Отдельного скилла `futureflow` больше нет (29.09.2026 слит сюда).

## Структура проекта
- `.claude/skills/repo-notes/SKILL.md` — текст скилла (Части 1–3); `assets/`, `docs/`, `templates/`, `scripts/` — его файлы.
- `claude-code-environment-setup-repo-notes.sh`, `repo-notes-skill.zip` — **генерируются**, руками не править.

## Деплой
Ветка `main` — источник для сессий: setup-скрипт клонирует `main` и копирует папку скилла в
`~/.claude/skills/repo-notes`; без сети ставит встроенный текст SKILL.md. Ветка по умолчанию на GitHub —
`claude/repo-notes-skill-setup-sfglfe` (историческая), сессии её не используют.

## Команды
- `python3 make-setup-script.py` — после любой правки скилла. Проверка установки:
  `HOME=/tmp/x bash claude-code-environment-setup-repo-notes.sh && ls /tmp/x/.claude/skills` — только `repo-notes`.
- Проверка генератора счёта: собрать счёт по `docs/schet.js` и `python3 docs/check-docx.py "Счёт №….docx" --expect N --sum K`
  — строка «логотип: ок».

## Грабли
- Новый текст setup-скрипта начинает действовать только после вставки в настройки окружения claude.ai/code.
- `next-number.py`: разделы таблиц ищутся по `[^\n]*`, не `.*` — с re.S «Акты.*» съедал таблицу, акты не считались
  (исправлено 30.09.2026); шапку таблицы узнаёт по строке-разделителю «|---|», номер берёт и из «Акт № СФ-1558».
- LibreOffice в контейнере без `libreoffice-writer-nogui` не открывает docx («source file could not be loaded»).
