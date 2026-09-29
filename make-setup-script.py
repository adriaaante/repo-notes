#!/usr/bin/env python3
"""Пересобирает claude-code-environment-setup-repo-notes.sh и repo-notes-skill.zip из .claude/skills/repo-notes.
Запускать после ЛЮБОЙ правки скилла, коммитить вместе с правкой (ветка main)."""
import os, zipfile
ROOT = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.join(ROOT, '.claude/skills/repo-notes')
OUT = os.path.join(ROOT, 'claude-code-environment-setup-repo-notes.sh')
text = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read().rstrip('\n')
assert 'REPO_NOTES_EOF' not in text
open(OUT, 'w', encoding='utf-8').write(f'''#!/bin/bash
# =====================================================================
# SETUP SCRIPT ДЛЯ ОКРУЖЕНИЯ CLAUDE CODE (облачные сессии claude.ai/code)
# ---------------------------------------------------------------------
# Куда вставлять: claude.ai/code -> окружение (Default) -> настройки ->
#   поле "Setup script" -> заменить целиком.
#
# Что делает: при старте контейнера ставит ОДИН скилл repo-notes в
#   ~/.claude/skills/repo-notes — правила работы с репо, память CLAUDE.md
#   и всё для клиентских проектов FutureFlow (документы с логотипом и QR,
#   журналы, отчёты/КП, генераторы, логотип, шрифт). Команда /repo-notes
#   работает в облачной сессии ЛЮБОГО репозитория. Старый отдельный скилл
#   futureflow удаляется — всё теперь внутри repo-notes.
#   Файлы берутся из ветки main репо adriaaante/repo-notes (публичный);
#   если клон не удался — ставится хотя бы текст скилла (встроен ниже).
#
# НЕ править руками: генерируется командой  python3 make-setup-script.py
# =====================================================================
D="$HOME/.claude/skills/repo-notes"
rm -rf "$HOME/.claude/skills/futureflow"
tmp=$(mktemp -d)
if git clone -q --depth 1 --branch main https://github.com/adriaaante/repo-notes "$tmp" 2>/dev/null \\
   && [ -f "$tmp/.claude/skills/repo-notes/SKILL.md" ]; then
  rm -rf "$D"; mkdir -p "$(dirname "$D")"
  cp -r "$tmp/.claude/skills/repo-notes" "$D"
  echo "repo-notes: скилл установлен целиком из main"
else
  mkdir -p "$D"
  cat > "$D/SKILL.md" <<'REPO_NOTES_EOF'
{text}
REPO_NOTES_EOF
  echo "repo-notes: нет доступа к GitHub — установлен только текст скилла (без файлов assets/docs/templates)"
fi
rm -rf "$tmp"
''')
os.chmod(OUT, 0o755)
z = os.path.join(ROOT, 'repo-notes-skill.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    for dp, dn, fn in os.walk(SKILL):
        dn[:] = [d for d in dn if d not in ('__pycache__', 'node_modules')]
        for f in sorted(fn):
            full = os.path.join(dp, f); zf.write(full, os.path.join('repo-notes', os.path.relpath(full, SKILL)))
print('ok:', OUT, z)
