#!/usr/bin/env python3
"""Следующий номер счёта — ТОЛЬКО из finance-log ЭТОГО проекта. Запускать перед каждым счётом.

python3 next-number.py                  # из _materials/docs/: реестр ../finance-log.md, префикс из client.json
python3 next-number.py --prefix КН- --finance ../finance-log.md

Правило (решение Adrian 28.09.2026): у каждого клиента свой префикс из двух букв и свой счётчик с 001,
без привязки к другим проектам. Номера из реестров других клиентов НЕ смотреть и НЕ продолжать.
Скрипт останавливается (код 1), если в таблице «Счета» есть номер без префикса проекта, с чужим
префиксом или повтор, если префикс не из двух букв, или если файл с этим номером уже лежит в docs/.
Исторические серии без префикса (Сферикс 1544–1549) — флаг --legacy-ok.
"""
import argparse, json, os, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--finance', default='../finance-log.md')
ap.add_argument('--prefix')
ap.add_argument('--legacy-ok', action='store_true', help='разрешить старые номера без префикса (Сферикс)')
a = ap.parse_args()

prefix = a.prefix
if not prefix and os.path.exists('client.json'):
    prefix = json.load(open('client.json', encoding='utf-8')).get('prefix')
errors = []
if not prefix or not re.fullmatch(r'[А-ЯЁA-Z]{2}-', prefix):
    sys.exit(f'✖ Префикс «{prefix}» не задан или не из двух заглавных букв с дефисом (например «КН-»). '
             'Задать в client.json → "prefix" или --prefix.')
if not os.path.exists(a.finance):
    sys.exit(f'✖ Нет реестра {a.finance}. Завести finance-log из шаблона скилла — номер без реестра не выдаётся.')

text = open(a.finance, encoding='utf-8').read()
m = re.search(r'^##\s+Счета\s*$(.*?)(?=^##\s)', text, re.S | re.M)
if not m:
    sys.exit('✖ В finance-log нет раздела «## Счета» с таблицей.')
rows = [r for r in m.group(1).splitlines() if r.startswith('|') and not re.match(r'^\|\s*(№|-)', r)]
nums, width, cells = [], 3, []
for r in rows:
    cell = r.split('|')[1].strip()
    if cell in ('', '—', '-'):
        continue
    mm = re.fullmatch(r'([А-ЯЁA-Z]{2}-)?(\d+)', cell)
    if not mm:
        errors.append(f'непонятный номер в таблице: «{cell}»'); continue
    p, n = mm.group(1), mm.group(2)
    if p is None:
        if not a.legacy_ok:
            errors.append(f'номер без префикса: «{cell}» (для старой серии Сферикса — --legacy-ok)')
    elif p != prefix:
        errors.append(f'чужой префикс: «{cell}» при префиксе проекта «{prefix}»')
    if p == prefix:
        width = max(width, len(n))
    nums.append(int(n)); cells.append(cell)
dups = sorted({n for n in nums if nums.count(n) > 1})
if dups:
    errors.append(f'повтор номеров: {dups}')

nxt = (max(nums) + 1) if nums else 1
number = f'{prefix}{nxt:0{width}d}'
taken = [f for f in os.listdir('.') if number in f]
if taken:
    errors.append(f'файлы с номером {number} уже есть в папке: {taken}')

last = cells[nums.index(max(nums))] if nums else None
print(f'Реестр: {a.finance} · префикс проекта {prefix} · счетов в таблице: {len(nums)}'
      + (f' · последний в таблице: {last}' if last else ''))
if errors:
    print('✖ ОСТАНОВКА, номер не выдан:'); [print('  —', e) for e in errors]; sys.exit(1)
print(f'✔ Следующий номер счёта: {number}')
if not nums:
    print(f'  Это первый счёт проекта — номер договора тоже {number}.')
