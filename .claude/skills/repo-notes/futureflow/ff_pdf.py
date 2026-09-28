#!/usr/bin/env python3
"""HTML → PDF в фирменном виде FutureFlow.

    python3 ff_pdf.py report.html "Отчёт FutureFlow — ….pdf"

1. Подставляет логотип FutureFlow (symbol #fflogo из брендбука) на место <!--FFLOGO-->;
   в вёрстке: <svg class="fflogo"><use href="#fflogo"/></svg>, цвет задаётся через color.
2. Встраивает шрифты Google Fonts из <link> (скачивает curl'ом) и печатает
   headless-Chromium'ом: A4, без колонтитулов браузера.
3. Сверяет число страниц PDF с числом блоков .page. Не совпало — какой-то лист
   не влез в A4 или не подцепился CSS; скрипт завершается с кодом 1.
"""
import base64
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")

src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding="utf-8").read()
if "#fflogo" in html and "<!--FFLOGO-->" not in html:
    sys.exit("нет метки <!--FFLOGO--> сразу после <body>")
html = html.replace("<!--FFLOGO-->", open(os.path.join(HERE, "fflogo-symbol.svg"), encoding="utf-8").read())


def curl(url, ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"):
    return subprocess.run(["curl", "-sSfL", "-A", ua, url], check=True, capture_output=True).stdout


def inline_fonts(m):
    # headless Chromium не ходит в сеть через прокси контейнера — шрифты Google
    # скачиваем curl'ом и встраиваем data-URI, иначе в PDF молча встанет DejaVu
    css = curl(html_unescape(m.group(1))).decode()
    css = re.sub(r"url\((https://[^)]+)\)",
                 lambda u: "url(data:font/woff2;base64,%s)" % base64.b64encode(curl(u.group(1))).decode(), css)
    return "<style>%s</style>" % css


def html_unescape(s):
    return s.replace("&amp;", "&")


html = re.sub(r'<link[^>]+href="(https://fonts\.googleapis\.com/[^"]+)"[^>]*>', inline_fonts, html)

# временный файл рядом с исходником — чтобы работали относительные пути к картинкам
fd, tmp = tempfile.mkstemp(suffix=".html", dir=os.path.dirname(os.path.abspath(src)))
with os.fdopen(fd, "w", encoding="utf-8") as f:
    f.write(html)
try:
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                    "--virtual-time-budget=15000", f"--print-to-pdf={os.path.abspath(out)}",
                    "file://" + tmp], check=True, capture_output=True)
finally:
    os.remove(tmp)

pages = len(re.findall(rb"/Type\s*/Page[^s]", open(out, "rb").read()))
blocks = len(re.findall(r'class="page[\s"]', html))
print(f"{out}: страниц {pages}, блоков .page {blocks}")
if blocks and pages != blocks:
    sys.exit("⚠ число страниц не равно числу блоков .page — какой-то лист не влез в A4")
