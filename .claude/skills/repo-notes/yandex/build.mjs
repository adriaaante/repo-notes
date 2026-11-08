// Набор для Яндекс Бизнеса: картинки, ролики и страница скачивания merch/yandex/.
//   node deploy/yandex/build.mjs          — всё (картинки, видео, страница)
//   node deploy/yandex/build.mjs --no-video  — без пересборки роликов (ffmpeg долгий)
// В песочнице: playwright глобальный (NODE_PATH=$(npm root -g)), ffmpeg в системе.
//
// Как устроено: фон — сгенерированная картинка из deploy/yandex/bg (Higgsfield), всё остальное —
// НАШЕ: настоящий знак из index.html (#i-lmchip, fill-rule evenodd — выемки ножек фирменные), надпись
// логотипа в кривых, Manrope/Inter из assets/fonts. Генераторы картинок путают буквы и рисуют «похожий»
// логотип — поэтому текст и знак на фон кладёт браузер, а не нейросеть.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import * as K from './kit.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(ROOT, 'merch/yandex/files');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ffkit-'));
const NO_VIDEO = process.argv.includes('--no-video');
const furl = (p) => pathToFileURL(p).href;

// ── бренд из index.html: копий не держим ──────────────────────────
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const grab = (re, what) => { const m = INDEX.match(re); if (!m) throw new Error('в index.html не нашлось: ' + what); return m[0]; };
const MARK = grab(/<span class="logo-mark">[\s\S]*?<\/span>/, 'logo-mark').match(/<svg[\s\S]*?<\/svg>/)[0]
  .replace('<svg ', '<svg class="mk" ');
const WORD = grab(/<svg class="logo-word"[\s\S]*?<\/svg>/, 'logo-word').replace('class="logo-word"', 'class="wd"');
if (!/fill-rule="evenodd"/.test(MARK)) throw new Error('знак без evenodd — выемки ножек пропадут');

// ── проверка лимитов Яндекса ─────────────────────────────────────
const L = K.LIMITS; const errs = [];
for (const s of K.STORIES) {
  if ([...s.name].length > L.storyName) errs.push(`история «${s.name}» > ${L.storyName}`);
  if (!s.button || [...s.button.text].length > L.storyButton) errs.push(`история «${s.name}»: кнопка нет или > ${L.storyButton}`);
}
for (const p of K.PROMOS) {
  if ([...p.title].length > L.promoTitle) errs.push(`акция ${p.id}: анонс ${[...p.title].length} > ${L.promoTitle}`);
  if ([...p.text].length > L.promoText) errs.push(`акция ${p.id}: описание ${[...p.text].length} > ${L.promoText}`);
}
for (const p of K.PRICE) {
  if ([...p.name].length > L.priceName) errs.push(`прайс «${p.name}» > ${L.priceName}`);
  if ([...p.text].length > L.priceText) errs.push(`прайс «${p.name}»: описание > ${L.priceText}`);
}
{ // фоны без повторов: витрина, прайс, истории, публикации, акции и обложка — у каждого кадра свой
  const used = [...K.SERVICES.map(x => x.bg), ...K.PRICE.map(x => x.sq.bg), ...K.STORIES.flatMap(x => x.slides.map(y => y.bg)),
    ...K.POSTS.flatMap(x => x.pics.map(y => y.bg)), ...K.PROMOS.map(x => x.bg), 'w2-cover', 'w2-band'];
  const seen = new Set();
  for (const b of used) { if (seen.has(b)) errs.push('фон повторяется: ' + b); seen.add(b);
    if (!fs.existsSync(path.join(HERE, 'bg', b + '.jpg'))) errs.push('нет фона: ' + b); }
}
if (errs.length) { console.error('Лимиты Яндекса:\n  ' + errs.join('\n  ')); process.exit(1); }

// ── общий стиль ──────────────────────────────────────────────────
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const br = (t) => esc(t).replace(/\n/g, '<br>');
const BG = (n) => furl(path.join(HERE, 'bg', n + '.jpg'));
const BASE = `
<link rel="stylesheet" href="${furl(path.join(ROOT, 'assets/fonts/fonts.css'))}">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--w);height:var(--h);overflow:hidden;background:#070a12}
body{font-family:Inter,system-ui,sans-serif;color:#eaf0fb;-webkit-font-smoothing:antialiased;position:relative}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0}
.mk{fill:currentColor;display:block}
.wd path{fill:currentColor}
.logo{display:flex;align-items:center;color:#fff}
.k{display:inline-flex;align-items:center;font-weight:600;text-transform:uppercase;color:#7fd3f0;letter-spacing:.2em}
.k::before{content:'';display:block;background:linear-gradient(90deg,#3c8ad8,#35c9e8);border-radius:2px}
.t{font-family:Manrope,system-ui,sans-serif;font-weight:800;letter-spacing:-.035em;line-height:1.02;color:#fff;white-space:nowrap}
.t .em{background:linear-gradient(135deg,#9cc3f5 0%,#35c9e8 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.s{color:rgba(234,240,251,.74);font-weight:400;line-height:1.45}
.pill{display:inline-flex;align-items:center;border-radius:999px;font-weight:700;font-family:Manrope,sans-serif;color:#fff;
  background:linear-gradient(135deg,#3c8ad8 0%,#0f8fb5 100%);box-shadow:0 18px 50px -12px rgba(60,138,216,.7),inset 0 1px 0 rgba(255,255,255,.25)}
.glass{border:1px solid rgba(122,171,240,.28);background:rgba(10,16,30,.55);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
</style>`;
// последняя строка заголовка — градиентом (как .em на сайте)
const title = (t) => { const ls = t.split('\n'); return ls.map((l, i) => i === ls.length - 1 ? `<span class="em">${esc(l)}</span>` : esc(l)).join('<br>'); };
const logo = (h) => `<div class="logo" style="gap:${h * .36}px">
  <svg class="mk" viewBox="4 4 24 24" style="width:${h}px;height:${h}px">${MARK.match(/<path[\s\S]*?\/>/)[0]}</svg>
  <svg class="wd" viewBox="37.6 6.2 102.6 14.6" style="height:${h * .5}px;width:auto">${WORD.match(/<g[\s\S]*<\/g>/)[0]}</svg></div>`;
// кегль, при котором самая длинная строка влезает в ширину box (Manrope 800 ≈ 0.56 em на знак)
const fit = (t, box, max) => Math.min(max, Math.floor(box / (Math.max(...t.split('\n').map(l => [...l].length)) * 0.56)));
const wrap2 = (t) => { if (t.length <= 16) return t; let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - t.length / 2) < Math.abs(best - t.length / 2))) best = i;
  if (best < 0) return t; let a = t.slice(0, best), b = t.slice(best + 1);
  if (b.startsWith('— ')) { a += ' —'; b = b.slice(2); } // тире не начинает строку
  return a + '\n' + b; };
const markOnly =(h, extra = '') => `<svg class="mk" viewBox="4 4 24 24" style="width:${h}px;height:${h}px;${extra}">${MARK.match(/<path[\s\S]*?\/>/)[0]}</svg>`;
const doc = (w, h, body, css = '') => `<!doctype html><html><head><meta charset="utf-8">${BASE}<style>:root{--w:${w}px;--h:${h}px}${css}</style></head><body>${body}</body></html>`;

// ── шаблоны ──────────────────────────────────────────────────────
// Витрина / публикация 1600×1200: предмет справа, текст слева
function tplPhoto(s, { w = 1600, h = 1200, head } = {}) {
  const t = head || s.title;
  return doc(w, h, `
  <div class="bg" style="background-image:url(${BG(s.bg)});background-size:auto 100%;background-repeat:no-repeat;left:${w * .1}px"></div>
  <div class="shade" style="background:linear-gradient(90deg,rgba(7,10,18,.94) 0%,rgba(7,10,18,.78) 34%,rgba(7,10,18,.15) 62%,rgba(7,10,18,0) 100%)"></div>
  ${s.mark ? `<div style="position:absolute;left:${w * .708}px;top:50%;transform:translate(-50%,-50%);color:#fff;filter:drop-shadow(0 0 34px rgba(60,138,216,.9)) drop-shadow(0 0 90px rgba(53,201,232,.45))">${markOnly(h * .27)}</div>` : ''}
  <div style="position:absolute;left:104px;top:0;bottom:0;width:${w * .46}px;display:flex;flex-direction:column;justify-content:center">
    <div class="k" style="font-size:24px;gap:18px;margin-bottom:38px"><style>.k::before{width:44px;height:3px}</style>${esc(s.kicker)}</div>
    <div class="t" style="font-size:${fit(t, w * .44, 104)}px;margin-bottom:34px">${title(t)}</div>
    <div class="s" style="font-size:34px;max-width:${w * .4}px">${esc(s.sub)}</div>
  </div>
  <div style="position:absolute;left:104px;bottom:84px">${logo(46)}</div>`);
}
// Квадрат для прайса 1200×1200: предмет по центру, название внизу на стекле
function tplSquare(s) {
  return doc(1200, 1200, `
  <div class="bg" style="background-image:url(${BG(s.bg)});background-size:auto 112%;background-position:72% 42%"></div>
  <div class="shade" style="background:linear-gradient(180deg,rgba(7,10,18,.35) 0%,rgba(7,10,18,0) 30%,rgba(7,10,18,.2) 55%,rgba(7,10,18,.96) 88%)"></div>
  ${s.mark ? `<div style="position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);color:#fff;filter:drop-shadow(0 0 30px rgba(60,138,216,.9)) drop-shadow(0 0 80px rgba(53,201,232,.45))">${markOnly(330)}</div>` : ''}
  <div style="position:absolute;left:84px;top:78px">${logo(40)}</div>
  <div style="position:absolute;left:84px;right:84px;bottom:86px">
    <div class="k" style="font-size:22px;gap:16px;margin-bottom:26px"><style>.k::before{width:38px;height:3px}</style>${esc(s.kicker)}</div>
    <div class="t" style="font-size:${fit(s.title, 1030, 92)}px">${title(s.title)}</div>
  </div>`);
}
// История 1280×1920
function tplStory(sl, i, n) {
  const list = sl.list ? `<ul style="list-style:none;display:grid;gap:22px;margin-top:8px">${sl.list.map(x => `
      <li class="s" style="font-size:40px;display:flex;gap:22px;align-items:flex-start;color:#eaf0fb">
      <span style="flex:0 0 40px;height:40px;border-radius:50%;margin-top:4px;display:grid;place-items:center;background:linear-gradient(135deg,#3c8ad8,#0f8fb5)">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>${esc(x)}</li>`).join('')}</ul>` : '';
  return doc(1280, 1920, `
  <div class="bg" style="background-image:url(${BG(sl.bg)});background-size:cover;background-position:50% 0"></div>
  <div class="shade" style="background:linear-gradient(180deg,rgba(7,10,18,.55) 0%,rgba(7,10,18,0) 14%,rgba(7,10,18,0) 40%,rgba(7,10,18,.86) 58%,#070a12 76%)"></div>
  <div style="position:absolute;left:96px;top:150px">${logo(52)}</div>
  <div style="position:absolute;left:96px;right:96px;top:${sl.title.split('\n').length > 2 ? 1000 : 1060}px">
    <div class="k" style="font-size:30px;gap:20px;margin-bottom:40px"><style>.k::before{width:50px;height:4px}</style>${esc(sl.kicker)}</div>
    <div class="t" style="font-size:${fit(sl.title, 1088, 120)}px;margin-bottom:40px">${title(sl.title)}</div>
    ${sl.text ? `<div class="s" style="font-size:42px">${esc(sl.text)}</div>` : ''}${list}
  </div>
`);
}
// Акция 1800×960
function tplPromo(p) {
  return doc(1800, 960, `
  <div class="bg" style="background-image:url(${BG(p.bg)});background-position:80% 50%"></div>
  <div class="shade" style="background:linear-gradient(90deg,rgba(7,10,18,.95) 0%,rgba(7,10,18,.75) 40%,rgba(7,10,18,0) 72%)"></div>
  <div style="position:absolute;left:110px;top:60px">${logo(88)}</div>
  <div style="position:absolute;left:110px;top:170px;bottom:0;display:flex;flex-direction:column;justify-content:center;width:1000px">
    <div class="pill" style="align-self:flex-start;height:70px;padding:0 34px;font-size:30px;margin-bottom:36px">${esc(p.badge)}</div>
    <div class="t" style="font-size:${fit(p.head, 960, 108)}px;margin-bottom:34px">${title(p.head)}</div>
    <div class="s" style="font-size:34px;max-width:820px">${esc(p.text)}</div>
  </div>
  <div style="position:absolute;right:96px;bottom:76px">${logo(44)}</div>`);
}
// Обложка 1920×1080
const tplCover = () => doc(1920, 1080, `
  <div class="bg" style="background-image:url(${BG('w2-cover')});background-position:80% 50%"></div>
  <div class="shade" style="background:linear-gradient(90deg,rgba(7,10,18,.92) 0%,rgba(7,10,18,.6) 45%,rgba(7,10,18,0) 75%)"></div>
  <div style="position:absolute;left:130px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
    <div style="margin-bottom:64px">${logo(96)}</div>
    <div class="t" style="font-size:96px;margin-bottom:34px">Всё для развития<br><span class="em">вашего бизнеса</span></div>
    <div class="s" style="font-size:36px;max-width:880px">Продвижение, сайты, CRM, автоматизация и ИИ — один подрядчик и один план</div>
  </div>`);
// Обложка карточки (главное фото): Яндекс режет её по-разному — узкой полосой в окне отзыва («Как вам это
// место?», ≈4:1 из середины), квадратом и 16:9 в Картах. Поэтому всё важное — знак, надпись и одна строка —
// в центральной полосе высотой 22% и шириной меньше квадрата; края — только фон (владелец 04.11.2026).
const tplCoverSafe = () => doc(1920, 1080, `
  <div class="bg" style="background-image:url(${BG('w2-band')})"></div>
  <div class="shade" style="background:radial-gradient(34% 26% at 50% 50%,rgba(7,10,18,.78) 0%,rgba(7,10,18,.35) 70%,rgba(7,10,18,0) 100%)"></div>
  <div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:26px">
    <div style="transform:scale(1.55);transform-origin:center">${logo(64)}</div>
    <div class="s" style="font-size:46px;font-weight:500;color:#eaf0fb;letter-spacing:.01em;margin-top:28px">Продвижение · Сайты · CRM · ИИ-агенты</div>
  </div>`);

// Логотип 1024×1024 на тёмном: знак белым со свечением, в круге Яндекса ножки не режутся (знак 52% стороны)
// ── QR-код отзыва ────────────────────────────────────────────────
// Матрица — deploy/yandex/qr.py (коррекция H, выдерживает знак в центре). Модули квадратные и тёмные на белом:
// скругления и светлые цвета красивее, но дешёвые камеры читают их хуже. Знак — фирменный синий логотипа.
const REVIEW_URL = K.SITE + K.REVIEW.path;
const QR = JSON.parse(execFileSync('python3', [path.join(HERE, 'qr.py'), REVIEW_URL]).toString());
const qrSvg = (size, fg = '#070a12') => {
  const n = QR.length, q = 4, all = n + q * 2, c = size / all;
  let d = ''; QR.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + q} ${y + q}h1v1h-1z`; }));
  const hole = Math.ceil(n * 0.24) | 1, h0 = q + (n - hole) / 2;   // окно под знак ~24% — в запасе коррекции H
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${all} ${all}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${all}" height="${all}" fill="#fff"/><path d="${d}" fill="${fg}"/>
    <rect x="${h0}" y="${h0}" width="${hole}" height="${hole}" rx="${hole * .22}" fill="#fff"/>
    <svg x="${h0 + hole * .1}" y="${h0 + hole * .1}" width="${hole * .8}" height="${hole * .8}" viewBox="4 4 24 24" shape-rendering="geometricPrecision">
      <path fill="#3C8AD8" fill-rule="evenodd" d="${MARK.match(/ d="([^"]+)"/)[1]}"/></svg></svg>`;
};
const tplQr = () => doc(1200, 1200, `<div style="position:absolute;inset:0;background:#fff">${qrSvg(1200)}</div>`);
const STARS = (s) => `<div style="display:flex;gap:${s * .22}px;justify-content:center">${('<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9cc3f5"/><stop offset="1" stop-color="#35c9e8"/></linearGradient></defs><path fill="url(#sg)" d="M12 2.2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>').repeat(5)}</div>`;
// Табличка A6 (105×148 мм, 300 dpi) — на стол, ресепшен, в коробку с документами
const tplReviewCard = () => doc(1240, 1748, `
  <div class="bg" style="background:radial-gradient(80% 55% at 50% 30%,#13254a 0%,#0a1224 55%,#070a12 100%)"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:120px 100px 0;text-align:center">
    ${logo(64)}
    <div class="t" style="font-size:118px;margin:110px 0 44px">Оцените<br><span class="em">нашу работу</span></div>
    ${STARS(96)}
    <div class="s" style="font-size:44px;margin:44px 0 70px;color:#eaf0fb">Отзыв в Яндекс Картах — за одну минуту</div>
    <div style="padding:34px;border-radius:44px;background:#fff;box-shadow:0 30px 90px -20px rgba(60,138,216,.7)">${qrSvg(560)}</div>
    <div class="s" style="font-size:36px;margin-top:52px">Наведите камеру телефона на код</div>
    <div class="s" style="font-size:34px;margin-top:14px;color:#7fd3f0;font-weight:600">${esc(REVIEW_URL.replace('https://', ''))}</div>
  </div>`);

const tplLogoDark = () => doc(1024, 1024, `
  <div class="bg" style="background:radial-gradient(60% 60% at 50% 50%,#13254a 0%,#0a1224 55%,#070a12 100%)"></div>
  <div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;filter:drop-shadow(0 0 28px rgba(60,138,216,.85)) drop-shadow(0 0 80px rgba(53,201,232,.35))">${markOnly(532)}</div>`);
// Титр для ролика: прозрачный PNG
const tplCaption = (w, h, c) => {
  const v = h > w;
  // финальная плашка: клип приглушается, знак и адрес — на тёмном пятне (на вертикальном — ниже образа)
  if (c.end) return doc(w, h, `<div class="shade" style="background:${v ? 'linear-gradient(180deg,rgba(7,10,18,.15) 0%,rgba(7,10,18,.55) 40%,rgba(7,10,18,.94) 62%)' : 'radial-gradient(42% 48% at 50% 50%,rgba(7,10,18,.82) 0%,rgba(7,10,18,.5) 70%,rgba(7,10,18,.2) 100%)'}"></div>
    <div style="position:absolute;left:0;right:0;${v ? 'top:1180px' : 'top:0;bottom:0'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${v ? 60 : 44}px">
    <div style="transform:scale(${v ? 1.35 : 1.7})">${logo(64)}</div>
    <div class="s" style="font-size:${v ? 44 : 38}px;color:#eaf0fb;text-align:center">${v ? 'Бесплатный аудит<br>за 24 часа' : 'Бесплатный аудит за 24 часа'}</div>
    <div class="pill" style="height:${v ? 110 : 92}px;padding:0 ${v ? 64 : 56}px;font-size:${v ? 46 : 40}px">futureflow.ru</div></div>`,
    'html,body{background:transparent}');
  return doc(w, h, `
    <div class="shade" style="background:${v ? 'linear-gradient(180deg,rgba(7,10,18,0) 45%,rgba(7,10,18,.88) 70%,rgba(7,10,18,.92) 100%)' : 'linear-gradient(90deg,rgba(7,10,18,.86) 0%,rgba(7,10,18,.5) 38%,rgba(7,10,18,0) 62%)'}"></div>
    <div style="position:absolute;${v ? 'left:80px;right:80px;top:1240px' : 'left:120px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center'}">
      <div class="k" style="font-size:${v ? 30 : 26}px;gap:18px;margin-bottom:${v ? 36 : 30}px"><style>.k::before{width:46px;height:3px}</style>${esc(c.kicker)}</div>
      <div class="t" style="font-size:${fit(c.line, v ? 920 : 1000, v ? 108 : 100)}px">${title(c.line)}</div>
    </div>
    <div style="position:absolute;${v ? 'left:80px;top:110px' : 'left:120px;bottom:80px'}">${logo(v ? 50 : 44)}</div>`,
    'html,body{background:transparent}');
};

// ── рендер ───────────────────────────────────────────────────────
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ deviceScaleFactor: 1 });
let nTmp = 0;
async function shot(html, w, h, file, { png = false } = {}) {
  const f = path.join(TMP, `p${nTmp++}.html`); fs.writeFileSync(f, html);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(furl(f)); await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(60);
  const out = path.join(OUT, file); fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: png ? 'png' : 'jpeg', quality: png ? undefined : 90, omitBackground: png });
  return file;
}
// чистим всё, кроме роликов при --no-video (их сборка долгая, а файлы не меняются)
for (const d of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) if (!(NO_VIDEO && d === 'video')) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
const M = { logo: [], cover: [], showcase: [], goods: [], stories: [], posts: [], promos: [], videos: [], review: [] };

// логотип: синяя плитка (тот же файл, что аватарка Telegram — deploy/stickers/avatar) и тёмный
fs.mkdirSync(path.join(OUT, 'logo'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'deploy/stickers/avatar/avatar-blue.png'), path.join(OUT, 'logo/futureflow-logo-blue.png'));
M.logo.push({ file: 'logo/futureflow-logo-blue.png', w: 1024, h: 1024, label: 'Синий (основной)' });
M.logo.push({ file: await shot(tplLogoDark(), 1024, 1024, 'logo/futureflow-logo-dark.png', { png: true }), w: 1024, h: 1024, label: 'Тёмный' });
M.cover.push({ file: await shot(tplCoverSafe(), 1920, 1080, 'cover/futureflow-oblozhka-karty.jpg'), w: 1920, h: 1080, label: 'Обложка карточки (главное фото)' });
M.cover.push({ file: await shot(tplCover(), 1920, 1080, 'cover/futureflow-cover.jpg'), w: 1920, h: 1080, label: 'Баннер 16:9' });
M.review.push({ file: await shot(tplQr(), 1200, 1200, 'review/futureflow-otzyv-qr.png', { png: true }), w: 1200, h: 1200, label: 'QR-код' });
fs.writeFileSync(path.join(OUT, 'review/futureflow-otzyv-qr.svg'), qrSvg(1200));
M.review.push({ file: await shot(tplReviewCard(), 1240, 1748, 'review/futureflow-otzyv-tablichka-a6.png', { png: true }), w: 1240, h: 1748, label: 'Табличка A6' });

for (const [i, s] of K.SERVICES.entries()) {
  const n = String(i + 1).padStart(2, '0');
  M.showcase.push({ id: s.id, file: await shot(tplPhoto(s), 1600, 1200, `showcase/${n}-${s.id}.jpg`), w: 1600, h: 1200, label: s.kicker });
}
for (const [i, p] of K.PRICE.entries()) {
  const n = String(i + 1).padStart(2, '0');
  M.goods.push({ id: p.id, file: await shot(tplSquare({ bg: p.sq.bg, kicker: p.cat, title: p.sq.title }), 1200, 1200, `goods/${n}-${p.id}.jpg`), w: 1200, h: 1200, label: p.cat });
}
for (const st of K.STORIES) {
  const files = [];
  for (const [i, sl] of st.slides.entries()) files.push(await shot(tplStory(sl, i, st.slides.length), 1280, 1920, `stories/${st.id}/${i + 1}.jpg`));
  M.stories.push({ id: st.id, name: st.name, files });
}
for (const p of K.POSTS) {
  const files = [];
  for (const [i, pc] of p.pics.entries())
    files.push(await shot(tplPhoto({ bg: pc.bg, kicker: pc.kicker, sub: pc.sub }, { head: pc.title }), 1600, 1200, `posts/${p.id}-${i + 1}.jpg`));
  M.posts.push({ id: p.id, files });
}
for (const p of K.PROMOS) M.promos.push({ id: p.id, file: await shot(tplPromo(p), 1800, 960, `promos/${p.id}.jpg`), w: 1800, h: 960 });

// ── ролики: клип Higgsfield + титр PNG, переходы через чёрный, 4 отрезка ──
const CLIPS = path.join(HERE, 'clips');
for (const v of K.VIDEOS) {
  const out = `video/futureflow-${v.id}.mp4`; const outAbs = path.join(OUT, out);
  const have = v.clips.every(c => fs.existsSync(path.join(CLIPS, c.clip + '.mp4')));
  if (NO_VIDEO && fs.existsSync(outAbs)) {  // прежний ролик остаётся на странице
    M.videos.push({ id: v.id, file: out, poster: out.replace('.mp4', '.jpg'), w: v.w, h: v.h, label: v.title, sec: Math.round(v.clips.length * 5 - (v.clips.length - 1) * 0.6) });
    continue;
  }
  if (NO_VIDEO || !have) { if (!have) console.warn(`ролик ${v.id}: нет клипов в deploy/yandex/clips — пропущен`); continue; }
  const caps = [];
  for (const [i, c] of v.clips.entries()) caps.push(path.join(OUT, await shot(tplCaption(v.w, v.h, c), v.w, v.h, `video/.cap-${v.id}-${i}.png`, { png: true })));
  const D = 5, X = 0.6; // длина отрезка и перекрытие
  const args = ['-y'];
  v.clips.forEach((c, i) => { args.push('-i', path.join(CLIPS, c.clip + '.mp4')); });
  caps.forEach(cp => args.push('-loop', '1', '-t', String(D), '-i', cp));
  const n = v.clips.length; let fc = '';
  for (let i = 0; i < n; i++) {
    // клип → размер кадра, 30 к/с; титр въезжает снизу с прозрачностью
    fc += `[${i}:v]scale=${v.w}:${v.h}:force_original_aspect_ratio=increase,crop=${v.w}:${v.h},fps=30,trim=0:${D},setpts=PTS-STARTPTS,format=yuv420p[b${i}];`;
    fc += `[${n + i}:v]format=rgba,fade=t=in:st=0.35:d=0.7:alpha=1,fade=t=out:st=${D - 0.8}:d=0.5:alpha=1[c${i}];`;
    fc += `[b${i}][c${i}]overlay=0:0:format=auto,format=yuv420p[s${i}];`;
  }
  let last = 's0', off = D - X;
  for (let i = 1; i < n; i++) { fc += `[${last}][s${i}]xfade=transition=fade:duration=${X}:offset=${off.toFixed(2)}[x${i}];`; last = `x${i}`; off += D - X; }
  fc += `[${last}]fade=t=in:st=0:d=0.4,fade=t=out:st=${(off + X - 0.6).toFixed(2)}:d=0.6[out]`;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  execFileSync('ffmpeg', [...args, '-filter_complex', fc, '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outAbs], { stdio: 'ignore' });
  // превью-кадр для страницы
  execFileSync('ffmpeg', ['-y', '-ss', '1.6', '-i', outAbs, '-frames:v', '1', '-q:v', '3', outAbs.replace('.mp4', '.jpg')], { stdio: 'ignore' });
  caps.forEach(cp => fs.rmSync(cp));
  M.videos.push({ id: v.id, file: out, poster: out.replace('.mp4', '.jpg'), w: v.w, h: v.h, label: v.title, sec: Math.round(n * D - (n - 1) * X) });
}
await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });

// размеры файлов — для подписей на странице
const size = (f) => fs.statSync(path.join(OUT, f)).size;
const total = fs.readdirSync(OUT, { recursive: true }).filter(f => /\.(jpg|png|mp4)$/.test(f)).reduce((a, f) => a + size(f), 0);
console.log(`готово: ${fs.readdirSync(OUT, { recursive: true }).filter(f => /\.(jpg|png|mp4)$/.test(f)).length} файлов, ${(total / 1048576).toFixed(1)} МБ`);

// ── YML-фид «Товары и услуги» для Яндекс Бизнеса ─────────────────
// Карточка читает прайс по ссылке https://futureflow.ru/feeds/yandex-business.yml и сама обновляет его —
// поправил PRICE в kit.mjs → сборка → выкатка, и через день-два прайс в Картах новый, руками ничего.
// Лежит НЕ в /merch/: та папка закрыта в robots и отдаёт 403 скриптам и ботам (.htaccess) — робот
// Яндекса до фида и картинок мог бы не дойти. Формат — упрощённый оффер YML (как у Маркета и Директа).
// Цена «от» — атрибут from="true", бесплатный аудит — <price>0</price>. Без <price> Яндекс позицию не публикует
// (предупреждение при загрузке 04.11.2026), поэтому позиция без цены роняет сборку.
{
  const FEED = path.join(ROOT, 'feeds');
  fs.rmSync(path.join(FEED, 'img'), { recursive: true, force: true });
  fs.mkdirSync(path.join(FEED, 'img'), { recursive: true });
  const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cats = [...new Set(K.PRICE.map(p => p.cat))];
  const goodsFile = Object.fromEntries(M.goods.map(g => [g.id, g.file]));
  const ids = new Set();
  const offers = K.PRICE.map(p => {
    if (!p.id || ids.has(p.id)) throw new Error('прайс: нет id или повтор — ' + p.name); ids.add(p.id);
    const img = `img/${p.id}.jpg`;
    fs.copyFileSync(path.join(OUT, goodsFile[p.id]), path.join(FEED, img));
    // без <price> Яндекс позицию не публикует; 0 — бесплатно, остальное — «от»
    if (!p.price) throw new Error('прайс: у «' + p.name + '» нет цены или 0 — Яндекс её не опубликует');
    const price = `\n      <price${p.price ? ' from="true"' : ''}>${p.price}</price>\n      <currencyId>RUR</currencyId>`;
    const notes = p.unit ? `\n      <sales_notes>${xml('Цена ' + p.unit)}</sales_notes>` : '';
    return `    <offer id="${p.id}" available="true">
      <name>${xml(p.name)}</name>
      <url>${xml(K.utm(p.link, 'price', p.id))}</url>${price}
      <categoryId>${cats.indexOf(p.cat) + 1}</categoryId>
      <picture>${K.SITE}/feeds/${img}</picture>
      <description>${xml(p.text + (p.price === 0 ? ' Бесплатно.' : ''))}</description>${notes}
    </offer>`;
  });
  // дата фида меняется, только когда поменялся сам прайс: иначе каждая сборка давала пустой коммит
  const feedFile = path.join(FEED, 'yandex-business.yml');
  const old = fs.existsSync(feedFile) ? fs.readFileSync(feedFile, 'utf8') : '';
  const strip = (t) => t.replace(/<yml_catalog date="[^"]*">/, '');
  const oldDate = (old.match(/<yml_catalog date="([^"]*)">/) || [])[1];
  const d = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const body = (date) => `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>FutureFlow</name>
    <company>FutureFlow</company>
    <url>${K.SITE}/</url>
    <currencies><currency id="RUR" rate="1"/></currencies>
    <categories>
${cats.map((c, i) => `      <category id="${i + 1}">${xml(c)}</category>`).join('\n')}
    </categories>
    <offers>
${offers.join('\n')}
    </offers>
  </shop>
</yml_catalog>
`;
  const fresh = body(d);
  fs.writeFileSync(feedFile, oldDate && strip(old) === strip(fresh) ? old : fresh);
  console.log(`фид: feeds/yandex-business.yml — ${offers.length} позиций, ${cats.length} категорий`);
}

// ── futureflow.ru/otzyv/ → карточка в Яндекс Картах, вкладка отзывов с открытой формой ───────
// Простая HTML-страница (а не правило в .htaccess): работает и на REG.RU, и на Pages, и без JS — meta refresh.
// ?add-review=true Яндекс официально не описывает: где форма сама не открылась, человек видит вкладку отзывов
// и одну кнопку «Написать отзыв». Пустой card — страница не собирается (вести в пустоту хуже, чем никуда).
{
  const dir = path.join(ROOT, K.REVIEW.path.replace(/^\/|\/$/g, ''));
  const card = K.REVIEW.card.trim();
  if (!card) { fs.rmSync(dir, { recursive: true, force: true }); console.warn('отзывы: не задан REVIEW.card в kit.mjs — /otzyv/ не собран'); }
  else {
    if (!/^https:\/\/yandex\.ru\/maps\/org\/[^/]+\/\d+\/?/.test(card)) throw new Error('REVIEW.card: нужен адрес вида https://yandex.ru/maps/org/<имя>/<номер>/');
    const target = card.replace(/[?#].*$/, '').replace(/\/?(reviews\/?)?$/, '/') + 'reviews/?add-review=true';
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="ru" data-theme="dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Отзыв о FutureFlow</title>
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<script>location.replace(${JSON.stringify(target)});</script>
<style>html,body{margin:0;height:100%;background:#070a12;color:#eaf0fb;font:16px/1.5 system-ui,sans-serif}
body{display:grid;place-items:center;text-align:center;padding:24px}a{color:#7aabf0}</style></head>
<body><p>Открываем карточку FutureFlow в Яндекс Картах…<br><a href="${target}">Нажмите, если не открылась</a></p></body></html>
`);
    M.reviewTarget = target;
    console.log('отзывы: ' + REVIEW_URL + ' → ' + target);
  }
}

// страница — отдельным модулем, чтобы не держать вёрстку в одном файле с рендером
const { writePage } = await import('./page.mjs');
writePage(M, size);
