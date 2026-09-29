#!/usr/bin/env python3
"""Проверка готового docx перед выдачей (обязательна):
текст из word/document.xml (номер, дата, суммы цифрами и прописью, основание, реквизиты),
наличие переносов <w:br/>, декод QR из вложенной картинки (сумма в копейках и номер счёта).
python3 check-docx.py "Счёт №….docx"      (нужны: pip install opencv-python-headless numpy)
python3 check-docx.py "Счёт №….docx" --expect КН-002 --sum 8000000
  --expect/--sum — строгая сверка: номер в заголовке счёта, в QR и в имени файла, сумма в QR (копейки).
  Любое расхождение — код выхода 1, документ не отдавать.
python3 check-docx.py "Договор №….docx" --logo
  --logo — только логотип (для договора). Для счёта логотип проверяется вместе с --expect/--sum.
  Логотип: ПЕРВЫЙ абзац документа, по правому краю, картинка в тексте ровно 1333500×285750 EMU
  (140×30 px = 3,70×0,79 см), файл побайтно = assets/futureflow-logo.png скилла (repo-notes, раздел 3.0)."""
import sys, zipfile, re, argparse
ap = argparse.ArgumentParser(); ap.add_argument('file'); ap.add_argument('--expect'); ap.add_argument('--sum', type=int); ap.add_argument('--logo', action='store_true')
A = ap.parse_args(); f = A.file
bad = []
z = zipfile.ZipFile(f)
xml = z.read('word/document.xml').decode('utf-8')
paras = [re.sub(r'<[^>]+>', '', re.sub(r'<w:br/>', ' ⏎ ', p)) for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)]
print('=== ТЕКСТ'); [print(x) for x in paras if x.strip()]
print('=== переносов <w:br/>:', xml.count('<w:br/>'))
imgs = [i.filename for i in z.infolist() if i.filename.startswith('word/media/') and i.file_size > 0]
text = ' '.join(paras)
if A.expect:
    if not re.search(r'№\s*' + re.escape(A.expect) + r'(?!\d)', text): bad.append(f'в тексте нет «№ {A.expect}»')
    other = sorted(set(re.findall(r'Счёт на оплату № (\S+)', text)) - {A.expect})
    if other: bad.append(f'в заголовке другой номер: {other}')
    if A.expect not in f: bad.append(f'номера {A.expect} нет в имени файла')
qrs = []
import numpy as np, cv2
for n in imgs:
    im = cv2.imdecode(np.frombuffer(z.read(n), np.uint8), cv2.IMREAD_COLOR)
    val, *_ = cv2.QRCodeDetector().detectAndDecode(im)
    print('=== картинка', n, '→', val or 'не QR (логотип) или не распознан')
    if val and val.startswith('ST00012'):
        qrs.append(val); m = re.search(r'Sum=(\d+)', val); print('    сумма, руб.:', int(m.group(1)) / 100 if m else '—')
def logo_check():
    import os, hashlib
    body = xml.split('<w:body>', 1)[-1]; m = re.search(r'<w:p[ >].*?</w:p>', body, re.S); first = m.group(0) if m else ''
    if '<w:drawing>' not in first: return ['первый абзац — не логотип (логотип FutureFlow должен стоять первым, над всем документом)']
    out = []
    if '<w:jc w:val="right"/>' not in first: out.append('логотип не по правому краю')
    if '<wp:inline' not in first: out.append('логотип не «в тексте» (inline)')
    ext = re.search(r'<wp:extent cx="(\d+)" cy="(\d+)"', first)
    if not ext or (ext.group(1), ext.group(2)) != ('1333500', '285750'): out.append(f'размер логотипа {ext.groups() if ext else "?"} EMU, нужен 1333500×285750 (140×30 px)')
    rid = re.search(r'r:embed="([^"]+)"', first); rels = z.read('word/_rels/document.xml.rels').decode('utf-8')
    tg = re.search(r'Id="' + re.escape(rid.group(1)) + r'"[^>]*Target="([^"]+)"', rels) if rid else None
    asset = next((q for q in [os.path.join(os.path.dirname(os.path.abspath(__file__)), '../assets/futureflow-logo.png'), '../brand/futureflow-logo.png',
                              os.path.expanduser('~/.claude/skills/repo-notes/assets/futureflow-logo.png')] if os.path.exists(q)), None)
    if tg and asset and hashlib.md5(z.read('word/' + tg.group(1))).hexdigest() != hashlib.md5(open(asset, 'rb').read()).hexdigest():
        out.append('картинка логотипа не совпадает с futureflow-logo.png из скилла')
    return out
if A.expect or A.sum is not None or A.logo:
    lb = logo_check(); bad += lb; print('=== логотип:', 'ок (первый абзац, справа, 140×30 px, файл из скилла)' if not lb else '; '.join(lb))
if A.logo and not (A.expect or A.sum is not None):
    print('✔ Логотип на месте' if not bad else '✖ РАСХОЖДЕНИЯ:\n  — ' + '\n  — '.join(bad)); sys.exit(1 if bad else 0)
if A.expect or A.sum is not None:
    if len(qrs) != 1: bad.append(f'QR для оплаты найдено {len(qrs)}, нужно ровно 1')
    for q in qrs:
        if A.expect and not re.search(r'№\s*' + re.escape(A.expect) + r'(?!\d)', q): bad.append('в QR другой номер счёта')
        if A.sum is not None and f'Sum={A.sum}|' not in q + '|': bad.append(f'в QR сумма не {A.sum} коп.')
    print('✔ Номер и сумма совпадают' if not bad else '✖ РАСХОЖДЕНИЯ:\n  — ' + '\n  — '.join(bad))
    sys.exit(1 if bad else 0)
