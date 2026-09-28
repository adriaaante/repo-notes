#!/bin/bash
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

cat > "$D/SKILL.md" <<'REPO_NOTES_EOF_SKILL_MD'
---
name: repo-notes
description: "Playbook для работы с любым репозиторием. Вызывай в начале сессии (или когда начинаешь задачу в незнакомом репо). Делает две вещи: (1) задаёт правила поведения — искать лучший вариант, не плодить лишние файлы и мёртвый код, убирать за собой, не выдавать незавершённое за готовое; (2) ведёт память проекта в CLAUDE.md ИМЕННО ТЕКУЩЕГО репозитория: структуру проекта и файлов, что и куда деплоится (что реально выкатилось), работу с БД (схема/миграции/подключение), а также неочевидные знания — грабли, «почему так», где конфиг, нестандартные команды. Память — своя под каждый репо, не общая. (3) Брендбук FutureFlow и правила клиентских документов: отчёты, аудиты, КП — всегда PDF в фирменном стиле с актуальным логотипом, шаблон и сборка в папке futureflow/ скилла."
---

# repo-notes — playbook + память репозитория

Один скилл на все репозитории. Правила поведения — общие и живут здесь, в скилле.
Память — своя в `CLAUDE.md` каждого репо. **В `CLAUDE.md` — только факты проекта;
правила из Части 1 туда НЕ копировать** (копия устареет при обновлении скилла и
раздует контекст каждой сессии).

## При активации сделай сразу

1. Проверь, есть ли в корне репо `CLAUDE.md`.
   - **Есть** → прочитай и держи в уме; дополняй по ходу. Заметил расхождение
     с реальностью — исправь в тот же момент.
   - **Нет** → заведи. Создавай **только секции, для которых есть содержимое**
     («Что это», «Структура проекта», «Деплой», «База данных», «Грабли»,
     «Команды»). Пустых заглушек не оставлять — секция добавляется, когда
     появляется что записать.
2. Если карты структуры ещё нет — быстрый осмотр, ограниченный по объёму:
   README, манифест (package.json / pyproject.toml / go.mod и т.п.), верхний
   уровень папок, точка входа, конфиг сборки/деплоя. Файлы целиком не читать —
   цель ориентация, не аудит.
3. Дальше работай по правилам Части 1 всю сессию. Любой документ для клиента
   (отчёт, аудит, КП, план, инструкция) — строго по Части 3.

---

## Часть 1. Правила поведения (применять всю сессию)

### A. Всегда ищи лучший вариант, а не первый попавшийся
- Для нетривиальной задачи сначала исследуй: как устроена кодбаза и как такую
  проблему решают вообще (best practice). Только потом код.
- Не вываливай список опций — сравни 2–3 подхода (плюсы/минусы/трудоёмкость) и
  дай **рекомендацию** с обоснованием.
- Перед финализацией плана проверь себя: решает ли задачу полностью? самый ли
  это эффективный путь? нет ли «кода ради кода»?

### B. Код ради задачи + гигиена файлов
Каждая изменённая строка закрывает требование. Никакого drive-by рефакторинга,
обёрток «на всякий случай», «красоты» без влияния на корректность.
**Конвенции:** следуй существующему стилю кодбазы и уже используемым библиотекам;
новая зависимость — только если в проекте нет используемого аналога, и с
обоснованием.
**Перед созданием файла:** сверься с картой структуры (Часть 2), поищи
подходящее существующее место/модуль и переиспользуй его. Не плоди дубли,
временные файлы, «черновики». Создал/переместил значимый файл — обнови
«Структуру проекта» в `CLAUDE.md`.

### C. Доказывай, что баг реальный
Не «улучшай» работающий код. Чини только воспроизводимые баги (вход → ожидание →
факт). Не можешь доказать — не трогай. Сомневаешься — оставь.

### D. Анализ влияния перед мержем/деплоем
Кто зависит от изменённых файлов? Не сломаны ли контракты (API/типы/схема БД/
формат ответов)? Прогони проверки. Обратная совместимость сохранена? Регрессия —
приоритет №1.

### E. Не рационализируй незавершённое + критерий «готово»
Не закрывай задачу отмазками «pre-existing», «out of scope», «потом».
**«Готово» означает:** требование покрыто полностью И сборка/тесты/линт
прогнаны и зелёные — либо прямо сказано, что прогнать нельзя и почему.
Иначе честно перечисли, что осталось.

### F. Уборка за собой
Перед завершением задачи разбери всё временное, что создал в ходе работы.
У каждого файла два состояния — «часть проекта» или «не существует»:
- Скрипт **реально пригодится повторно** (проверка, миграция, генерация) →
  легализуй: перенеси в `scripts/` (или принятое в репо место), дай нормальное
  имя, запиши в «Команды» в `CLAUDE.md`.
- Всё остальное → удали: одноразовые скрипты, отладочные принты/логи,
  закомментированный код, неиспользуемые импорты и переменные. «Вдруг
  пригодится» — не причина хранить: история git и так всё сохраняет.

### G. Рекомендуй, а не просто спрашивай
Нужно решение пользователя — сначала сам разбери варианты, потом задай вопрос с
рекомендацией: «Развилка А/Б — плюсы/минусы — рекомендую А, потому что…».
Очевидное решай сам. Вопросы группируй. Развилка 50/50 — так и скажи.

---

## Часть 2. Память проекта — что писать в CLAUDE.md этого репо

Пиши **ключевое и неочевидное** — то, что даёт ориентацию и экономит время в
будущих сессиях. Коротко: 1–3 строки на факт, ссылайся на пути
(`src/...:строка`), а не копируй файлы.

### 2.1 Структура проекта (карта)
- Что это за приложение в двух словах и стек (фреймворк, язык, пакетный менеджер).
- Точка входа и ключевые папки с ролями: UI, логика/сервисы, API, конфиги,
  тесты, статика.
- Что **генерируется/собирается** и НЕ редактируется руками (`dist/`, `out/`,
  сгенерированные типы/клиенты).
- Где env/конфиг (расположение и формат — **не значения**).
- Цель: по карте видно, куда класть новый код и какие файлы лишние.

### 2.2 Деплой / что реально выкатывается
- Команда сборки и что попадает в артефакт (что деплоится, что остаётся в репо).
- Куда и как: цель (хостинг/ветка/CI), триггер (push/action/скрипт), цепочка
  по шагам.
- Как понять, **что уже на проде**: где смотреть версию, команда/URL проверки,
  ожидаемый результат.
- Грабли деплоя: что НЕ перезаписывается, что живёт только на сервере,
  расхождения «локально vs прод».

### 2.3 База данных (если есть)
- Тип БД и слой доступа (ORM/драйвер).
- Где схема, где миграции; команды создать/накатить/откатить.
- Ключевые таблицы и связи (только важное).
- Где конфиг подключения (env-переменная — **не креды**); dev/prod базы;
  как поднять локально (docker/seed).
- Подводные камни данных: уникальные ограничения, каскады, мягкое удаление,
  индексы, даты/таймзоны.

### 2.4 Неочевидное (грабли, «почему так», команды)
- Скрытые цепочки/связи; что ломалось и почему; причины неочевидных решений.
- Нестандартные команды (проверка/линт/прогон) с ожидаемым результатом.

### Чего НЕ писать
Секреты/токены/пароли; длинные пересказы файлов; банальщину, видную из кода за
секунду; сиюминутный статус текущей задачи; правила поведения из Части 1.

### Гигиена самого CLAUDE.md
- Устаревший или неверный факт → исправь или удали сразу, не копи.
- Держи файл компактным (ориентир ≤ ~120 строк). Разросся — сожми, слей дубли.
- Тест на каждый факт: сэкономит ли он время в будущей сессии? Нет — удали.

### Когда дополнять
Разобрался в неочевидном → зафиксируй. Изменил структуру → обнови карту. Тронул
деплой или схему БД → обнови секцию. Перед завершением задачи: «появилось ли
что-то, чего нет в `CLAUDE.md` и что сэкономит время в будущем?»

### Сохранение
Правка по сути → закоммить `CLAUDE.md` (можно вместе с изменениями задачи).
В облачных сессиях переживает только закоммиченное.

---

## Часть 3. Брендбук FutureFlow и документы для клиентов

Пользователь — Adrian, агентство **FutureFlow** (futureflow.ru): продвижение,
сайты, реклама, CRM для бизнеса. Всё, что уходит клиенту, — от имени FutureFlow.
Файлы брендбука лежат рядом со скиллом: `~/.claude/skills/repo-notes/futureflow/`.

### Бренд
- **Логотип — только из брендбука**: знак (чип) + надпись FutureFlow,
  `futureflow/fflogo-symbol.svg` (symbol `#fflogo`, цвет через `color`).
  Первоисточник — папка брендбука на Google Диске
  https://drive.google.com/drive/folders/1bzhwMnt0NT7E7UAYU2cGp_dZ49XgBzUf
  (`futureflow_logo_round_nourl.svg`). Старый квадратный знак не использовать,
  логотип не перерисовывать и не «стилизовать».
- **Цвета FutureFlow**: синий `#3c8ad8` (логотип на светлом), тёмно-синий
  `#2b6fb3` (слово FutureFlow в колонтитуле); на тёмной обложке логотип белый.
- **Шрифт**: Manrope (Google Fonts), 400–800. Заголовки 800, плотные.
- **Нейтральные**: графит `#1C1C1B` (текст, обложка), серый `#66625C`,
  линии `#DCD8D0`, плашки — светлый оттенок акцента клиента.
- **Акцент документа — цвет КЛИЕНТА** (оранжевый Сферикса `#E84E24`, бирюзовый
  стоматологии и т.п.). FutureFlow присутствует логотипом и колонтитулом,
  а не перекрашивает документ в свой синий.
- Статусы: красный «Критично», жёлтый «Важно», зелёный «Хорошо/Сильная
  сторона», синий «Проверим в кабинете».

### Формат документа
- **Всегда PDF**, А4, собранный из HTML. Не markdown, не docx, не веб-страница
  (веб-артефакт — только если попросили отдельно).
- Старт — копия `futureflow/template.html`: тёмная обложка (логотип клиента на
  белой плашке + подпись чем он занимается, eyebrow «Клиент · тип · месяц год»,
  H1-тезис, лид, 4 KPI-плитки, содержание, логотип FutureFlow внизу),
  дальше листы `.page`: eyebrow «Раздел N», H2 с номером-акцентом (заголовок —
  вывод, а не тема), лид, таблицы со статус-тегами, карточки `.box`, выноски
  `.call`, блок цены `.price`, подпись `.sig` с логотипом. На каждом листе
  колонтитул: «Клиент · тема · **FutureFlow**» и «стр. N».
- Логотип клиента — с его сайта (og:image / шапка), сохранить в `assets/` рядом
  с HTML.
- Каждый `.page` — ровно один лист А4: не переполнен и не полупустой (лист
  заполнен хотя бы на ~2/3; мало текста — крупнее шрифт/отступы, много — дели лист).
- **Цена в КП — одна сумма за месяц «за всё», БЕЗ разбивки по направлениям**
  (решение Adrian 28.09.2026). Под ценой — обещание результата (берём на себя
  всё, каждый месяц новые клиенты, закрываем любые вопросы) и список «что
  входит» галочками без сумм, последним пунктом — «Любые текущие задачи».
  Рекламный бюджет площадок — отдельной строкой под блоком цены.
- Имя файла: `«Тип» FutureFlow — «клиент/тема» (ДД.ММ.ГГГГ).pdf`, например
  `Аудит и КП FutureFlow — Dental Str.25 (28.09.2026).pdf`.
- Язык — простой, для владельца бизнеса: факт → цифра → что это значит → что
  делаем. Никаких «оптимизировали семантическое ядро» без пояснения пользы.
  Каждое утверждение проверяемо (адрес страницы, цифра, дата).
- Что выведено по открытым данным, а что нужно проверить в кабинете клиента, —
  помечать явно. Цены, KPI и обещания — только те, что согласовал Adrian;
  предложенные самостоятельно — назвать в ответе, чтобы он их проверил.

### Сборка и проверка
```
python3 ~/.claude/skills/repo-notes/futureflow/ff_pdf.py doc.html "Отчёт FutureFlow — … (ДД.ММ.ГГГГ).pdf"
```
Скрипт подставляет логотип на `<!--FFLOGO-->`, встраивает Manrope (headless
Chromium сам не ходит в сеть через прокси — без этого в PDF молча встаёт
DejaVu), печатает А4 и падает, если страниц ≠ блоков `.page`.
После сборки — один раз посмотреть листы глазами (рендер страниц в PNG) и
проверить шрифты PDF: `strings файл.pdf | grep FontName` — основной текст
Manrope (вариативный шрифт называется `Manrope-ExtraLight`, это нормально),
DejaVu допустим только для моноширинного кода. Готовый PDF отправить
пользователю файлом и закоммитить вместе с исходным HTML в репо клиента.
REPO_NOTES_EOF_SKILL_MD

cat > "$D/futureflow/ff_pdf.py" <<'REPO_NOTES_EOF_FUTUREFLOW_FF_PDF_PY'
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
REPO_NOTES_EOF_FUTUREFLOW_FF_PDF_PY

cat > "$D/futureflow/fflogo-symbol.svg" <<'REPO_NOTES_EOF_FUTUREFLOW_FFLOGO_SYMBOL_SVG'
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="fflogo" viewBox="0 0 156.0 44.380"><g transform="translate(8,8)"><g transform="scale(1.182482) translate(-4,-4)"><path d="M11.5,7.7 h9.000000000000002 a3.8,3.8 0 0 1 3.8,3.8 v9.000000000000002 a3.8,3.8 0 0 1 -3.8,3.8 h-9.000000000000002 a3.8,3.8 0 0 1 -3.8,-3.8 v-9.000000000000002 a3.8,3.8 0 0 1 3.8,-3.8 Z M11.5,9.3 a2.2,2.2 0 0 0 -2.2,2.2 v9.0 a2.2,2.2 0 0 0 2.2,2.2 h9.0 a2.2,2.2 0 0 0 2.2,-2.2 v-9.0 a2.2,2.2 0 0 0 -2.2,-2.2 Z M11.8,4.0 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.9 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.9 a0.8,0.8 0 0 1 0.8,-0.8 Z M11.8,23.5 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.899999999999998 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.899999999999998 a0.8,0.8 0 0 1 0.8,-0.8 Z M14.6,4.0 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.9 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.9 a0.8,0.8 0 0 1 0.8,-0.8 Z M14.6,23.5 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.899999999999998 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.899999999999998 a0.8,0.8 0 0 1 0.8,-0.8 Z M17.4,4.0 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.9 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.9 a0.8,0.8 0 0 1 0.8,-0.8 Z M17.4,23.5 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.899999999999998 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.899999999999998 a0.8,0.8 0 0 1 0.8,-0.8 Z M20.2,4.0 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.9 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.9 a0.8,0.8 0 0 1 0.8,-0.8 Z M20.2,23.5 h0.0 a0.8,0.8 0 0 1 0.8,0.8 v2.899999999999998 a0.8,0.8 0 0 1 -0.8,0.8 h-0.0 a0.8,0.8 0 0 1 -0.8,-0.8 v-2.899999999999998 a0.8,0.8 0 0 1 0.8,-0.8 Z M4.8,11.0 h2.9 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.9 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M24.3,11.0 h2.899999999999998 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.899999999999998 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M4.8,13.799999999999999 h2.9 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.9 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M24.3,13.799999999999999 h2.899999999999998 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.899999999999998 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M4.8,16.599999999999998 h2.9 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.9 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M24.3,16.599999999999998 h2.899999999999998 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.899999999999998 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M4.8,19.4 h2.9 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.9 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z M24.3,19.4 h2.899999999999998 a0.8,0.8 0 0 1 0.8,0.8 v0.0 a0.8,0.8 0 0 1 -0.8,0.8 h-2.899999999999998 a0.8,0.8 0 0 1 -0.8,-0.8 v-0.0 a0.8,0.8 0 0 1 0.8,-0.8 Z" fill="currentColor" fill-rule="evenodd"/></g><g transform="translate(37.248,20.398) scale(0.017737)"><path d="M81.0 0Q63.0 0 50.5 -12.5Q38.0 -25 38.0 -43V-738Q38.0 -757 50.0 -769.0Q62.0 -781 81.0 -781H544.0Q563.0 -781 575.0 -769.5Q587.0 -758 587.0 -740Q587.0 -723 575.0 -711.5Q563.0 -700 544.0 -700H124.0V-434H429.0Q448.0 -434 459.5 -422.0Q471.0 -410 471.0 -393Q471.0 -375 459.5 -363.5Q448.0 -352 429.0 -352H124.0V-43Q124.0 -25 111.5 -12.5Q99.0 0 81.0 0ZM951.0 6Q880.0 6 824.5 -23.5Q769.0 -53 737.0 -110.0Q705.0 -167 705.0 -250V-505Q705.0 -523 717.0 -535.0Q729.0 -547 747.0 -547Q765.0 -547 777.0 -535.0Q789.0 -523 789.0 -505V-250Q789.0 -189 812.0 -150.5Q835.0 -112 874.0 -92.5Q913.0 -73 962.0 -73Q1009.0 -73 1047.0 -91.5Q1085.0 -110 1107.0 -141.5Q1129.0 -173 1129.0 -214H1186.0Q1184.0 -151 1153.0 -101.5Q1122.0 -52 1069.0 -23.0Q1016.0 6 951.0 6ZM1171.0 0Q1152.0 0 1140.5 -11.5Q1129.0 -23 1129.0 -43V-505Q1129.0 -524 1140.5 -535.5Q1152.0 -547 1171.0 -547Q1190.0 -547 1202.0 -535.5Q1214.0 -524 1214.0 -505V-43Q1214.0 -23 1202.0 -11.5Q1190.0 0 1171.0 0ZM1603.0 0Q1551.0 0 1510.0 -25.0Q1469.0 -50 1445.5 -94.0Q1422.0 -138 1422.0 -193V-679Q1422.0 -697 1433.5 -709.0Q1445.0 -721 1464.0 -721Q1482.0 -721 1494.0 -709.0Q1506.0 -697 1506.0 -679V-193Q1506.0 -146 1533.5 -115.0Q1561.0 -84 1603.0 -84H1633.0Q1649.0 -84 1660.0 -72.0Q1671.0 -60 1671.0 -42Q1671.0 -23 1657.5 -11.5Q1644.0 0 1623.0 0ZM1363.0 -454Q1346.0 -454 1335.0 -464.5Q1324.0 -475 1324.0 -490Q1324.0 -506 1335.0 -516.5Q1346.0 -527 1363.0 -527H1610.0Q1627.0 -527 1638.0 -516.5Q1649.0 -506 1649.0 -490Q1649.0 -475 1638.0 -464.5Q1627.0 -454 1610.0 -454ZM2032.0 6Q1961.0 6 1905.5 -23.5Q1850.0 -53 1818.0 -110.0Q1786.0 -167 1786.0 -250V-505Q1786.0 -523 1798.0 -535.0Q1810.0 -547 1828.0 -547Q1846.0 -547 1858.0 -535.0Q1870.0 -523 1870.0 -505V-250Q1870.0 -189 1893.0 -150.5Q1916.0 -112 1955.0 -92.5Q1994.0 -73 2043.0 -73Q2090.0 -73 2128.0 -91.5Q2166.0 -110 2188.0 -141.5Q2210.0 -173 2210.0 -214H2267.0Q2265.0 -151 2234.0 -101.5Q2203.0 -52 2150.0 -23.0Q2097.0 6 2032.0 6ZM2252.0 0Q2233.0 0 2221.5 -11.5Q2210.0 -23 2210.0 -43V-505Q2210.0 -524 2221.5 -535.5Q2233.0 -547 2252.0 -547Q2271.0 -547 2283.0 -535.5Q2295.0 -524 2295.0 -505V-43Q2295.0 -23 2283.0 -11.5Q2271.0 0 2252.0 0ZM2512.0 -339Q2514.0 -400 2543.5 -448.5Q2573.0 -497 2621.5 -525.0Q2670.0 -553 2728.0 -553Q2779.0 -553 2805.5 -538.0Q2832.0 -523 2825.0 -497Q2822.0 -483 2812.5 -477.0Q2803.0 -471 2790.5 -471.0Q2778.0 -471 2762.0 -473Q2703.0 -480 2657.5 -465.5Q2612.0 -451 2585.0 -418.0Q2558.0 -385 2558.0 -339ZM2517.0 0Q2497.0 0 2486.0 -11.0Q2475.0 -22 2475.0 -42V-505Q2475.0 -525 2486.0 -536.0Q2497.0 -547 2517.0 -547Q2537.0 -547 2547.5 -536.0Q2558.0 -525 2558.0 -505V-42Q2558.0 -22 2547.5 -11.0Q2537.0 0 2517.0 0ZM3193.0 5Q3111.0 5 3048.0 -30.5Q2985.0 -66 2949.0 -129.0Q2913.0 -192 2913.0 -273Q2913.0 -355 2947.0 -417.5Q2981.0 -480 3040.5 -516.0Q3100.0 -552 3178.0 -552Q3254.0 -552 3310.5 -517.5Q3367.0 -483 3397.5 -422.0Q3428.0 -361 3428.0 -283Q3428.0 -266 3417.0 -255.5Q3406.0 -245 3389.0 -245H2971.0V-314H3394.0L3351.0 -284Q3352.0 -339 3331.0 -383.0Q3310.0 -427 3271.0 -452.0Q3232.0 -477 3178.0 -477Q3121.0 -477 3078.5 -451.0Q3036.0 -425 3013.5 -378.5Q2991.0 -332 2991.0 -273Q2991.0 -214 3017.0 -168.0Q3043.0 -122 3088.5 -96.0Q3134.0 -70 3193.0 -70Q3227.0 -70 3262.5 -82.0Q3298.0 -94 3319.0 -112Q3331.0 -121 3346.5 -121.5Q3362.0 -122 3372.0 -113Q3387.0 -100 3387.5 -85.0Q3388.0 -70 3374.0 -59Q3341.0 -31 3290.0 -13.0Q3239.0 5 3193.0 5Z" fill="currentColor"/><path d="M3549.0 0Q3531.0 0 3518.5 -12.5Q3506.0 -25 3506.0 -43V-738Q3506.0 -757 3518.0 -769.0Q3530.0 -781 3549.0 -781H4012.0Q4031.0 -781 4043.0 -769.5Q4055.0 -758 4055.0 -740Q4055.0 -723 4043.0 -711.5Q4031.0 -700 4012.0 -700H3592.0V-434H3897.0Q3916.0 -434 3927.5 -422.0Q3939.0 -410 3939.0 -393Q3939.0 -375 3927.5 -363.5Q3916.0 -352 3897.0 -352H3592.0V-43Q3592.0 -25 3579.5 -12.5Q3567.0 0 3549.0 0ZM4305.0 0Q4263.0 0 4231.0 -22.5Q4199.0 -45 4181.0 -85.0Q4163.0 -125 4163.0 -177V-739Q4163.0 -758 4174.5 -769.5Q4186.0 -781 4205.0 -781Q4223.0 -781 4234.5 -769.5Q4246.0 -758 4246.0 -739V-177Q4246.0 -136 4262.5 -109.5Q4279.0 -83 4305.0 -83H4330.0Q4346.0 -83 4356.0 -71.5Q4366.0 -60 4366.0 -42Q4366.0 -23 4351.5 -11.5Q4337.0 0 4314.0 0ZM4720.0 5Q4639.0 5 4576.5 -31.0Q4514.0 -67 4478.0 -130.0Q4442.0 -193 4442.0 -273Q4442.0 -354 4478.0 -417.0Q4514.0 -480 4576.5 -516.0Q4639.0 -552 4720.0 -552Q4800.0 -552 4862.0 -516.0Q4924.0 -480 4960.0 -417.0Q4996.0 -354 4997.0 -273Q4997.0 -193 4961.0 -130.0Q4925.0 -67 4862.5 -31.0Q4800.0 5 4720.0 5ZM4720.0 -71Q4776.0 -71 4820.0 -97.5Q4864.0 -124 4889.0 -169.5Q4914.0 -215 4914.0 -273Q4914.0 -331 4889.0 -377.0Q4864.0 -423 4820.0 -449.5Q4776.0 -476 4720.0 -476Q4664.0 -476 4619.5 -449.5Q4575.0 -423 4549.5 -377.0Q4524.0 -331 4524.0 -273Q4524.0 -215 4549.5 -169.5Q4575.0 -124 4619.5 -97.5Q4664.0 -71 4720.0 -71ZM5272.0 0Q5258.0 0 5247.0 -8.0Q5236.0 -16 5231.0 -27L5078.0 -488Q5071.0 -515 5078.5 -531.0Q5086.0 -547 5109.0 -547Q5124.0 -547 5135.0 -539.0Q5146.0 -531 5152.0 -513L5287.0 -97H5261.0L5387.0 -515Q5391.0 -529 5401.5 -538.0Q5412.0 -547 5428.0 -547Q5445.0 -547 5455.5 -538.0Q5466.0 -529 5470.0 -515L5585.0 -112H5568.0L5699.0 -513Q5710.0 -547 5740.0 -547Q5764.0 -547 5773.0 -529.5Q5782.0 -512 5773.0 -488L5619.0 -27Q5615.0 -16 5604.5 -8.0Q5594.0 0 5580.0 0Q5566.0 0 5554.5 -8.0Q5543.0 -16 5539.0 -27L5420.0 -434H5432.0L5311.0 -27Q5307.0 -15 5296.0 -7.5Q5285.0 0 5272.0 0Z" fill="currentColor"/></g></g></symbol></svg>
REPO_NOTES_EOF_FUTUREFLOW_FFLOGO_SYMBOL_SVG

cat > "$D/futureflow/template.html" <<'REPO_NOTES_EOF_FUTUREFLOW_TEMPLATE_HTML'
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Клиент — тема документа. FutureFlow</title>
<!-- Шаблон клиентского документа FutureFlow. Сборка: python3 ~/.claude/skills/repo-notes/futureflow/ff_pdf.py этот.html "Отчёт FutureFlow — ….pdf" -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=block">
<style>
@page{size:A4;margin:0}
:root{--ink:#1C1C1B;--muted:#66625C;--line:#DCD8D0;--bg:#FFFFFF;--panel:#F3F5F5;--panel2:#E6ECEC;
  --accent:#0B7A80;--accent-ink:#085F64 /* ← акцент КЛИЕНТА (его брендовый цвет) */;--blue:#3c8ad8;--blue-ink:#2b6fb3;--ok:#2E8B4A;--warn:#B8860B;--bad:#C0392B}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:"Manrope",system-ui,"Segoe UI",Roboto,sans-serif;font-size:12.6px;line-height:1.5}
.page{width:210mm;height:297mm;padding:13mm 15mm 14mm;position:relative;overflow:hidden;break-after:page;page-break-after:always;background:var(--bg)}
.page.dense{font-size:11.6px}
.page.dense .lead{font-size:13px}
.page:last-child{break-after:auto;page-break-after:auto}
.foot{position:absolute;left:15mm;right:15mm;bottom:7mm;display:flex;justify-content:space-between;font-size:8.5px;color:var(--muted);border-top:1px solid var(--line);padding-top:4px}
.foot b{color:var(--blue-ink);font-weight:700}
.eyebrow{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-ink);font-weight:800;margin:0 0 5px}
h1{font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.015em;margin:0 0 10px;text-wrap:balance}
h2{font-size:22px;font-weight:800;letter-spacing:-.01em;margin:0 0 8px;text-wrap:balance}
h2 .n{color:var(--accent);margin-right:6px}
h3{font-size:14px;font-weight:800;margin:14px 0 6px}
p{margin:0 0 7px}
ul,ol{margin:0 0 8px;padding-left:16px}li{margin:0 0 3px}
.lead{font-size:14px;color:var(--muted);margin:0 0 14px;max-width:74ch}
.small{font-size:9.5px;color:var(--muted)}
b{font-weight:800}
code{font-family:ui-monospace,"DejaVu Sans Mono",monospace;font-size:10.5px;background:var(--panel);padding:0 3px;border-radius:3px}
table{border-collapse:collapse;width:100%;font-size:11.4px;margin:6px 0 14px}
th,td{text-align:left;vertical-align:top;padding:7px 8px;border-bottom:1px solid var(--line)}
th{font-size:8.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:800;border-bottom:1.5px solid var(--ink)}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 14px}
.kpi{background:var(--panel);border-radius:8px;padding:9px 11px}
.kpi .v{font-size:21px;font-weight:800;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.kpi .l{font-size:9.5px;color:var(--muted);margin-top:3px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
.box{background:var(--panel);border-radius:8px;padding:11px 13px;margin:0 0 10px}
.box h3{margin-top:0}
.box ul{margin-bottom:0}
.call{border-left:3px solid var(--accent);background:var(--panel);padding:8px 11px;border-radius:0 8px 8px 0;margin:8px 0 10px}
.call.ok{border-color:var(--ok)}.call.warn{border-color:var(--warn)}.call.bad{border-color:var(--bad)}.call.blue{border-color:var(--blue)}
.tag{display:inline-block;font-size:8.5px;font-weight:800;padding:1px 7px;border-radius:999px;background:var(--panel2);white-space:nowrap;letter-spacing:.03em}
.tag.bad{background:#F6DBD6;color:var(--bad)}.tag.warn{background:#F3E7C2;color:#7A5A06}.tag.ok{background:#D8EEDD;color:#1F6B37}.tag.blue{background:#DCE9F7;color:var(--blue-ink)}
.cause{display:grid;grid-template-columns:34mm 1fr;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}
.cause .v{font-size:20px;font-weight:800;color:var(--accent);line-height:1.05;letter-spacing:-.02em}
.cause .v small{display:block;font-size:9px;font-weight:600;color:var(--muted);letter-spacing:0;margin-top:3px}
.cause h3{margin:0 0 3px}
.cause p{margin:0}
.chart{background:var(--panel);border-radius:8px;padding:10px 12px 8px;margin-top:10px}
.bars{display:grid;grid-template-columns:repeat(20,1fr);grid-template-rows:1fr;gap:4px;align-items:end;height:26mm;border-bottom:1px solid var(--muted);margin-top:14px}
.bars .b{background:#9DC7C9;border-radius:2px 2px 0 0;position:relative;min-height:1px}
.bars .b.hi{background:var(--accent)}
.bars .b.zero{background:var(--bad)}
.bars .b span{position:absolute;top:-13px;left:0;right:0;text-align:center;font-size:8.5px;font-weight:700;color:var(--muted)}
.bars .b.zero span{color:var(--bad)}
.xl{display:grid;grid-template-columns:repeat(20,1fr);gap:4px;font-size:8px;color:var(--muted);text-align:center;margin-top:3px;line-height:1.2}
.price{background:var(--ink);color:#fff;border-radius:10px;padding:14px 16px;margin:6px 0 12px}
.price .big{font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1}
.price .big small{font-size:12px;font-weight:600;color:#CFCAC0;margin-left:6px;letter-spacing:0}
.price .row{display:grid;grid-template-columns:1fr auto;gap:12px;padding:7px 0;border-bottom:1px solid #3A3B3C}
.price .row:last-child{border-bottom:0}
.price .row span small{display:block;color:#B5B0A6;font-size:9.5px;font-weight:500}
.price .row b{white-space:nowrap;font-variant-numeric:tabular-nums}
.price .promise{color:#CFCAC0;font-size:12.5px;margin:10px 0 12px;max-width:70ch}
.price .incl{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
.price .incl div{padding:8px 0 8px 18px;border-top:1px solid #3A3B3C;position:relative}
.price .incl div::before{content:"✓";position:absolute;left:0;top:8px;color:#5FC3C8;font-weight:800}
.price .incl b{display:block;font-weight:700}
.price .incl small{display:block;color:#B5B0A6;font-size:10.5px;font-weight:500}
.month{background:var(--panel);border-radius:8px;padding:9px 11px}
.month .m{font-size:8.5px;font-weight:800;letter-spacing:.08em;color:var(--accent-ink)}
.month h3{margin:3px 0 5px}
.month ul{font-size:11.5px;margin:0}
.cover{background:var(--ink);color:#fff;padding:18mm 16mm 14mm}
.cover .eyebrow{color:#5FC3C8}
.cover h1{font-size:38px;color:#fff;max-width:20ch}
.cover .lead{color:#CFCAC0;font-size:14px;max-width:62ch}
.cover .kpi{background:#2A2B2C;color:#fff}.cover .kpi .l{color:#B5B0A6}
.cover .foot{border-top-color:#3A3B3C;color:#9B968C}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:20mm}
.brand .tile{background:#fff;border-radius:10px;padding:5px 7px;display:flex}
.brand img{height:40px;display:block}
.brand .sep{width:1px;height:26px;background:#4A4B4C}
.brand span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#B5B0A6;font-weight:700}
.toc{columns:2;column-gap:20px;font-size:11px}
.toc div{break-inside:avoid;padding:4px 0;border-bottom:1px solid #3A3B3C;display:flex;gap:8px}
.toc .n{color:#5FC3C8;font-weight:800;min-width:18px}
.fflogo{display:block;color:var(--blue)}
.fflogo.lg{width:190px;height:54px;color:#fff}
.fflogo.md{width:150px;height:43px}
.coverff{position:absolute;left:16mm;right:16mm;bottom:22mm;padding-top:12px;border-top:1px solid #3A3B3C;display:flex;align-items:center;gap:18px}
.coverff .txt{font-size:10px;color:#B5B0A6;line-height:1.5}
.coverff .txt b{color:#fff;font-weight:700;display:block;font-size:11.5px;margin-bottom:2px}
.sig{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:12px;padding-top:10px;border-top:1.5px solid var(--ink)}
</style>
</head>
<body>
<!--FFLOGO-->

<!-- ═══════════ ОБЛОЖКА (тёмная) ═══════════ -->
<section class="page cover">
  <div class="brand">
    <div class="tile"><img src="assets/client-logo.png" alt="Клиент"></div>
    <div class="sep"></div>
    <span>чем занимается клиент · город</span>
  </div>
  <p class="eyebrow">Клиент · тип документа · месяц год</p>
  <h1>Заголовок-тезис: что случилось и что делаем</h1>
  <p class="lead">Два-три предложения: что разобрали, откуда данные, что внутри.</p>
  <div class="kpis">
    <div class="kpi"><div class="v">5,0 ★</div><div class="l">ключевая цифра 1</div></div>
    <div class="kpi"><div class="v">−30 %</div><div class="l">ключевая цифра 2</div></div>
    <div class="kpi"><div class="v">30.09</div><div class="l">ключевая цифра 3</div></div>
    <div class="kpi"><div class="v">40+</div><div class="l">ключевая цифра 4</div></div>
  </div>
  <h2 style="color:#fff;margin-top:10mm">Содержание</h2>
  <div class="toc">
    <div><span class="n">1</span><span>Итоги</span></div>
    <div><span class="n">2</span><span>Раздел</span></div>
  </div>
  <div class="coverff">
    <svg class="fflogo lg"><use href="#fflogo"/></svg>
    <div class="txt"><b>Подготовлено агентством FutureFlow</b>Продвижение, сайты и реклама для бизнеса · futureflow.ru</div>
  </div>
  <div class="foot"><span>Откуда данные и на какую дату</span><span>futureflow.ru</span></div>
</section>

<!-- ═══════════ ЛИСТ СОДЕРЖАНИЯ (каждый .page = ровно один А4) ═══════════ -->
<section class="page">
  <p class="eyebrow">Раздел 1</p>
  <h2><span class="n">1</span>Заголовок раздела — вывод, а не тема</h2>
  <p class="lead">Лид: что на этом листе и почему это важно.</p>
  <table>
    <tr><th>Что видим</th><th>Статус</th><th>Что делаем</th></tr>
    <tr><td>Факт с цифрой</td><td><span class="tag bad">Критично</span></td><td>Действие</td></tr>
    <tr><td>Факт</td><td><span class="tag warn">Важно</span></td><td>Действие</td></tr>
    <tr><td>Факт</td><td><span class="tag ok">Хорошо</span></td><td>Действие</td></tr>
    <tr><td>Факт</td><td><span class="tag blue">Проверим</span></td><td>Действие</td></tr>
  </table>
  <div class="grid2">
    <div class="box"><h3>Карточка</h3><ul><li>Пункт</li></ul></div>
    <div class="call ok"><b>Вывод.</b> Выноска: ok / warn / bad / blue.</div>
  </div>
  <div class="foot"><span>Клиент · тема · <b>FutureFlow</b></span><span>стр. 2</span></div>
</section>

<!-- ═══════════ ЦЕНА / ПОДПИСЬ ═══════════ -->
<section class="page">
  <h2><span class="n">2</span>Предложение</h2>
  <div class="price">
    <div class="big">55 000 ₽<small>в месяц · одна цена за всё, без доплат</small></div>
    <p class="promise">Что клиент получает целиком: берём на себя всё и каждый месяц приводим новых клиентов.</p>
    <div class="incl">
      <div><b>Что входит</b><small>пояснение простыми словами — без суммы по строке</small></div>
      <div><b>Любые текущие задачи</b><small>правки, акции, вопросы — решаем в рамках месяца</small></div>
    </div>
  </div>
  <div class="sig">
    <div><svg class="fflogo md"><use href="#fflogo"/></svg><div class="small" style="margin-top:4px">Агентство FutureFlow · futureflow.ru</div></div>
    <div class="small" style="text-align:right">Дата</div>
  </div>
  <div class="foot"><span>Клиент · тема · <b>FutureFlow</b></span><span>стр. 3</span></div>
</section>
</body>
</html>
REPO_NOTES_EOF_FUTUREFLOW_TEMPLATE_HTML

chmod +x "$D/futureflow/ff_pdf.py"
echo "repo-notes skill installed: $D"
