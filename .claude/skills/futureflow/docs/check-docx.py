#!/usr/bin/env python3
"""Проверка готового docx перед выдачей (обязательна):
текст из word/document.xml (номер, дата, суммы цифрами и прописью, основание, реквизиты),
наличие переносов <w:br/>, декод QR из вложенной картинки (сумма в копейках и номер счёта).
python3 check-docx.py "Счёт №….docx"      (нужны: pip install opencv-python-headless numpy)"""
import sys, zipfile, re
f = sys.argv[1]
z = zipfile.ZipFile(f)
xml = z.read('word/document.xml').decode('utf-8')
paras = [re.sub(r'<[^>]+>', '', re.sub(r'<w:br/>', ' ⏎ ', p)) for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)]
print('=== ТЕКСТ'); [print(x) for x in paras if x.strip()]
print('=== переносов <w:br/>:', xml.count('<w:br/>'))
imgs = [i.filename for i in z.infolist() if i.filename.startswith('word/media/') and i.file_size > 0]
if not imgs: print('=== QR: картинок нет'); sys.exit(0)
import numpy as np, cv2
for n in imgs:
    im = cv2.imdecode(np.frombuffer(z.read(n), np.uint8), cv2.IMREAD_COLOR)
    val, *_ = cv2.QRCodeDetector().detectAndDecode(im)
    print('=== QR', n, '→', val or 'НЕ РАСПОЗНАН')
    m = re.search(r'Sum=(\d+)', val or ''); print('    сумма, руб.:', int(m.group(1)) / 100 if m else '—')
