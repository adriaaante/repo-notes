#!/usr/bin/env python3
"""Пересобирает claude-code-environment-setup-repo-notes.sh из файлов скилла.

Запускать после любой правки .claude/skills/repo-notes/** — setup script
окружения должен ставить ровно то, что лежит в репо.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.join(ROOT, ".claude/skills/repo-notes")
OUT = os.path.join(ROOT, "claude-code-environment-setup-repo-notes.sh")

HEADER = """#!/bin/bash
# =====================================================================
# SETUP SCRIPT ДЛЯ ОКРУЖЕНИЯ CLAUDE CODE (облачные сессии claude.ai/code)
# ---------------------------------------------------------------------
# К чему относится: НЕ к репозиторию и НЕ к Маку. Это скрипт для
#   настроек ОКРУЖЕНИЯ (Environment "Default") облачных сессий Claude Code.
#
# Куда вставлять: claude.ai/code -> выбор окружения (Default) ->
#   настройки окружения -> поле "Setup script" -> заменить целиком.
#
# Что делает: при старте каждого облачного контейнера кладёт скилл
#   repo-notes в ~/.claude/skills (SKILL.md + брендбук FutureFlow в
#   futureflow/: логотип, шаблон документа, сборка PDF), поэтому команда
#   /repo-notes работает в облачной сессии ЛЮБОГО репозитория.
#   Старая версия скилла удаляется и заменяется этой.
#
# НЕ править руками: файл генерируется из репо adriaaante/repo-notes
#   командой  python3 make-setup-script.py
# =====================================================================
set -e
D="$HOME/.claude/skills/repo-notes"
rm -rf "$D"
mkdir -p "$D/futureflow"
"""

files = []
for dirpath, _, names in os.walk(SKILL):
    for n in sorted(names):
        full = os.path.join(dirpath, n)
        files.append(os.path.relpath(full, SKILL))

parts = [HEADER]
for rel in sorted(files):
    text = open(os.path.join(SKILL, rel), encoding="utf-8").read()
    tag = "REPO_NOTES_EOF_" + rel.upper().replace("/", "_").replace(".", "_").replace("-", "_")
    assert tag not in text
    parts.append(f"\ncat > \"$D/{rel}\" <<'{tag}'\n{text.rstrip(chr(10))}\n{tag}\n")
parts.append('\nchmod +x "$D/futureflow/ff_pdf.py"\necho "repo-notes skill installed: $D"\n')
open(OUT, "w", encoding="utf-8").write("".join(parts))
print(OUT, sorted(files))
