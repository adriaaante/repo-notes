# repo-notes — скилл /repo-notes для облачных сессий Claude Code

## Что это
Канонический источник скилла `repo-notes`: правила работы с репо, память в CLAUDE.md
и брендбук FutureFlow для клиентских документов (PDF).

## Структура проекта
- `.claude/skills/repo-notes/SKILL.md` — текст скилла (Части 1–3).
- `.claude/skills/repo-notes/futureflow/` — логотип из брендбука (`fflogo-symbol.svg`),
  шаблон документа (`template.html`), сборка HTML→PDF (`ff_pdf.py`).
- `claude-code-environment-setup-repo-notes.sh` — **генерируется**, руками не править.
  Вставляется в настройки окружения claude.ai/code → Setup script; при старте
  контейнера удаляет старый скилл и ставит этот в `~/.claude/skills/repo-notes`.

## Команды
- `python3 make-setup-script.py` — пересобрать setup script после любой правки скилла.
  Проверка: `HOME=/tmp/x bash claude-code-environment-setup-repo-notes.sh && diff -r /tmp/x/.claude/skills/repo-notes .claude/skills/repo-notes` — без вывода.

## Грабли
- Обновлённый setup script начинает действовать только после того, как его заново
  вставят в настройки окружения — коммит в репо сам по себе сессии не меняет.
