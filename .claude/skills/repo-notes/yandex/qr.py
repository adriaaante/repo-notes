"""Матрица QR-кода для build.mjs: python3 deploy/yandex/qr.py <текст> → JSON [[0,1,…],…] без полей.

Коррекция ошибок H (30%): в центр кладём знак FutureFlow, и код должен читаться и с ним.
Рисует не эта программа, а build.mjs (фирменные цвета и знак). Нужен pip install qrcode.
"""
import json
import sys

import qrcode
from qrcode.constants import ERROR_CORRECT_H

q = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=0)
q.add_data(sys.argv[1])
q.make(fit=True)
print(json.dumps([[1 if c else 0 for c in row] for row in q.get_matrix()]))
