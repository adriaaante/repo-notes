// Страница merch/yandex/index.html — собирает build.mjs. Руками не править.
// Скрытая (noindex, с сайта не линкуется, /merch/ закрыт в robots), как merch/stickers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as K from './kit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rub = (p) => p === 0 ? 'Бесплатно' : p == null ? 'По запросу' : 'от ' + p.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
const kb = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' МБ' : Math.round(b / 1024) + ' КБ';

export function writePage(M, size) {
  const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const LOGO = INDEX.match(/<span class="logo-mark">[\s\S]*?<\/span>/)[0] + INDEX.match(/<svg class="logo-word"[\s\S]*?<\/svg>/)[0];
  const f = (p) => 'files/' + p;
  const dl = (file, label = 'Скачать') => `<a class="b" href="${f(file)}" download>${label}</a>`;
  const meta = (o) => `<span class="m">${o.w}×${o.h} · ${kb(size(o.file))}</span>`;
  // текст с кнопкой «Копировать» и счётчиком против лимита Яндекса
  const copy = (label, text, limit) => `<div class="cp"><div class="cp-h"><b>${esc(label)}</b>
    <span class="cnt" data-limit="${limit || ''}">${[...text].length}${limit ? ' / ' + limit : ''}</span>
    <button class="b sm" type="button" data-copy>Копировать</button></div><div class="cp-t">${esc(text)}</div></div>`;
  const all = (files) => `<button class="b g" type="button" data-all='${JSON.stringify(files.map(f))}'>Скачать все (${files.length})</button>`;
  const card = (o, extra = '', hl = false) => `<figure class="it${hl ? ' hl' : ''}"><a href="${f(o.file)}" target="_blank" rel="noopener" class="pv"><img src="${f(o.file)}" alt="${esc(o.label || '')}" loading="lazy" style="aspect-ratio:${o.w}/${o.h}"></a>
    <figcaption><span>${esc(o.label || '')}</span>${meta(o)}${extra}${dl(o.file)}</figcaption></figure>`;
  const link = (p) => K.SITE + p;
  const goodsImg = Object.fromEntries(M.goods.map(g => [g.id, g]));

  const sec = (id, n, h, lead, body) => `<section class="sec" id="${id}"><div class="sh"><span class="n">${n}</span><div><h2>${h}</h2><p class="lead">${lead}</p></div></div>${body}</section>`;

  const html = `<!doctype html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Яндекс Бизнес — набор FutureFlow</title>
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#070a12">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<style>
:root{--bg:#070a12;--s1:#0d1220;--s2:#131b2d;--text:#eaf0fb;--muted:rgba(234,240,251,.62);--dim:rgba(234,240,251,.42);
  --border:rgba(234,240,251,.10);--border2:rgba(122,171,240,.28);--brand:#4a86d8;--brand2:#7aabf0;--acc:#35c9e8;
  --grad:linear-gradient(135deg,#3c8ad8 0%,#0f8fb5 100%);--grad-ink:linear-gradient(135deg,#7aabf0 0%,#35c9e8 100%);color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;scroll-padding-top:84px}
body{background:var(--bg);color:var(--text);font:16px/1.6 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:clip}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(900px 600px at 85% -10%,rgba(60,138,216,.22),transparent 60%),radial-gradient(700px 500px at -10% 30%,rgba(53,201,232,.10),transparent 60%)}
.wrap{max-width:1240px;margin:0 auto;padding:0 32px;position:relative;z-index:1}
a{color:var(--brand2)}
header.top{position:sticky;top:0;z-index:20;background:rgba(7,10,18,.78);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
header.top .wrap{display:flex;align-items:center;gap:22px;height:68px}
.logo{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}
.logo-mark svg{width:28px;height:28px;display:block}.logo-mark .lm-chip{fill:currentColor}
.logo-word{height:14px;width:auto}.logo-word path{fill:currentColor}
nav.chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-left:auto}
nav.chips::-webkit-scrollbar{display:none}
nav.chips a{flex:0 0 auto;font-size:13.5px;font-weight:500;color:var(--muted);text-decoration:none;padding:7px 13px;border-radius:99px;border:1px solid transparent}
nav.chips a:hover{color:var(--text);border-color:var(--border2)}
.hero{padding:86px 0 40px}
.eyebrow{display:inline-flex;align-items:center;gap:12px;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--acc)}
.eyebrow::before{content:'';width:28px;height:2px;border-radius:2px;background:var(--grad)}
h1{font-family:Manrope,sans-serif;font-weight:800;font-size:clamp(38px,6vw,72px);letter-spacing:-.045em;line-height:1.02;margin:22px 0 20px;max-width:15ch}
.em{background:var(--grad-ink);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{font-size:clamp(16px,1.6vw,19px);color:var(--muted);max-width:62ch;font-weight:300}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:40px}
.steps div{padding:18px 20px;border:1px solid var(--border);border-radius:16px;background:rgba(13,18,32,.6);font-size:14px;color:var(--muted)}
.steps b{display:block;font-family:Manrope,sans-serif;color:var(--text);font-size:15px;margin-bottom:4px}
.sec{padding:70px 0 10px}
.sh{display:flex;gap:22px;align-items:flex-start;margin-bottom:28px}
.sh .n{font-family:Manrope,sans-serif;font-weight:800;font-size:14px;color:var(--acc);border:1px solid var(--border2);border-radius:12px;padding:8px 11px;line-height:1;margin-top:8px}
h2{font-family:Manrope,sans-serif;font-weight:800;font-size:clamp(26px,3.4vw,40px);letter-spacing:-.035em;line-height:1.1;margin-bottom:8px}
.lead{color:var(--muted);max-width:72ch;font-size:15.5px}
.lead b{color:var(--text);font-weight:600}
.bar{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 20px}
.grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.grid.wide{grid-template-columns:repeat(auto-fill,minmax(380px,1fr))}
.grid.tall{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
.it{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--s1);display:flex;flex-direction:column;transition:border-color .2s,transform .2s}
.it:hover{border-color:var(--border2);transform:translateY(-2px)}
.pv{display:block;background:#05070d}
.pv img{display:block;width:100%;height:auto;object-fit:cover}
figcaption{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;font-size:14px}
figcaption>span:first-child{font-weight:600;margin-right:auto}
.m{font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.b{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;padding:0 16px;border-radius:99px;border:0;cursor:pointer;
  font:600 13.5px Inter,sans-serif;color:#fff;background:var(--grad);text-decoration:none;box-shadow:0 10px 26px -14px rgba(60,138,216,.8);white-space:nowrap}
.b:hover{filter:brightness(1.1)}
.b.g{background:transparent;border:1px solid var(--border2);color:var(--text);box-shadow:none}
.b.sm{height:30px;padding:0 12px;font-size:12.5px}
.b.ok{background:#14a37f}
.cp{border:1px solid var(--border);border-radius:16px;background:var(--s1);overflow:hidden}
.cp+.cp{margin-top:12px}
.cp-h{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border);font-size:13.5px}
.cp-h b{margin-right:auto;font-weight:600}
.cnt{font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.cp-t{padding:14px 16px;white-space:pre-wrap;overflow-wrap:anywhere;color:rgba(234,240,251,.86);font-size:15px;line-height:1.6}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px}
.row{display:grid;grid-template-columns:200px minmax(0,1fr);gap:18px;align-items:start;padding:18px;border:1px solid var(--border);border-radius:20px;background:rgba(13,18,32,.55)}
.row+.row{margin-top:14px}
.row .it{border-radius:14px}
.tag{display:inline-flex;font-size:12px;font-weight:600;color:var(--acc);border:1px solid var(--border2);border-radius:99px;padding:3px 10px;margin-bottom:10px}
.price{font-family:Manrope,sans-serif;font-weight:800;font-size:20px;margin-left:auto}
.story{padding:20px;border:1px solid var(--border);border-radius:22px;background:rgba(13,18,32,.55)}
.story+.story{margin-top:16px}
.story-h{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.story-h h3{font-family:Manrope,sans-serif;font-size:20px;margin-right:auto}
.it.hl{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc),0 18px 40px -20px rgba(53,201,232,.6)}
.it.hl figcaption>span:first-child{color:var(--acc)}
.btnp{margin-top:16px;border:1px solid var(--border2);border-radius:18px;background:linear-gradient(180deg,rgba(60,138,216,.10),rgba(13,18,32,.6));padding:16px 18px;display:grid;gap:10px}
.btnp-h{display:flex;gap:14px;align-items:center;margin-bottom:4px}
.btnp-h b{display:block;font-family:Manrope,sans-serif;font-size:16px}
.btnp-h span{font-size:13.5px;color:var(--muted)}
.btnp-n{flex:0 0 36px;height:36px;border-radius:10px;display:grid;place-items:center;font:800 15px Manrope,sans-serif;color:#fff;background:var(--grad)}
.btnp-r{display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--s1);border:1px solid var(--border)}
.btnp-l{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.btnp-r code{font:500 14.5px Inter,sans-serif;color:var(--text);overflow-wrap:anywhere}
@media (max-width:560px){.btnp-r{grid-template-columns:minmax(0,1fr) auto}.btnp-l{grid-column:1/-1}}
.reel{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(150px,1fr);gap:12px;overflow-x:auto;padding-bottom:6px}
.reel .it figcaption{padding:8px 10px}
.post{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:18px;padding:18px;border:1px solid var(--border);border-radius:22px;background:rgba(13,18,32,.55)}
.post+.post{margin-top:16px}
.post .imgs{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
.post .imgs .it:only-child{grid-column:1/-1}
video{display:block;width:100%;height:auto;background:#000}
.note{margin-top:16px;padding:14px 16px;border-radius:14px;border:1px dashed var(--border2);color:var(--muted);font-size:14px}
.note b{color:var(--text)}
footer{padding:70px 0 60px;color:var(--dim);font-size:13px}
.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;transition:.25s;z-index:50;background:#14a37f;color:#fff;
  padding:10px 18px;border-radius:99px;font-weight:600;font-size:14px;pointer-events:none}
.toast.on{opacity:1;transform:translate(-50%,0)}
@media (max-width:900px){.steps{grid-template-columns:1fr 1fr}.two,.post{grid-template-columns:minmax(0,1fr)}nav.chips{display:none}}
@media (max-width:560px){.wrap{padding:0 16px}.steps{grid-template-columns:1fr}.row{grid-template-columns:minmax(0,1fr)}.grid,.grid.wide{grid-template-columns:minmax(0,1fr)}.grid.tall{grid-template-columns:1fr 1fr}.hero{padding-top:56px}}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="../../" aria-label="FutureFlow">${LOGO}</a>
  <nav class="chips">
    <a href="#logo">Логотип</a><a href="#about">Об организации</a><a href="#showcase">Фото</a><a href="#price">Товары и услуги</a>
    <a href="#stories">Истории</a><a href="#posts">Публикации</a><a href="#promos">Акции</a><a href="#video">Видео</a><a href="#review">Отзывы</a>
  </nav>
</div></header>
<main class="wrap">
<section class="hero">
  <span class="eyebrow">Карточка в Яндекс Картах</span>
  <h1>Всё для карточки <span class="em">FutureFlow</span></h1>
  <p>Логотип, фото витрины, прайс, истории, публикации, акции и видео — в фирменном стиле и под требования Яндекс Бизнеса. Картинку — кнопкой «Скачать», текст — кнопкой «Копировать», и сразу в нужное поле.</p>
  <div class="steps">
    <div><b>1. Логотип и обложка</b>«Фото и видео» → «Логотип»</div>
    <div><b>2. Описание и рубрики</b>«О компании» — тексты ниже</div>
    <div><b>3. Прайс и фото</b>«Товары и услуги», «Фото» → «Услуги»</div>
    <div><b>4. Истории и новости</b>«Публикации», «Истории», «Акции»</div>
  </div>
</section>

${sec('logo', '01', 'Логотип и обложка', 'Квадрат 1024×1024. Яндекс показывает логотип <b>в круге</b> — знак стоит с полями, ножки не обрезаются. Основной — синий, как на сайте и в Telegram. <b>Обложка карточки</b> — её Яндекс показывает и в окне отзыва узкой полосой: всё важное стоит в центре, поэтому при любой обрезке она выглядит целой. Загрузите её в «Фото» и нажмите на ней «Сделать обложкой».',
  `<div class="grid">${M.logo.map(o => card(o)).join('')}${M.cover.map(o => card(o)).join('')}</div>`)}

${sec('about', '02', 'Об организации', 'Раздел «О компании»: описание, виды деятельности (первая — основная) и особенности. Офиса нет — в карточке указать <b>«Работаем удалённо»</b> и регион «Россия», без адреса.',
  `<div class="two"><div>${copy('Короткое описание', K.ABOUT.short)}${copy('Виды деятельности', K.ABOUT.rubrics.join('\n'))}${copy('Особенности', K.ABOUT.features.join('\n'))}</div>
   <div>${copy('Полное описание', K.ABOUT.long)}${copy('Сайт', K.SITE)}</div></div>`)}

${sec('showcase', '03', 'Фото: витрина услуг', 'Раздел «Фото и видео» → «Услуги» (и «Товары»). 1600×1200, без телефонов, ссылок и цен на картинке — с ними Яндекс фото отклоняет. «Вход», «Интерьер» и «Экстерьер» оставляем пустыми: офиса нет, а чужие снимки — нарушение правил.',
  `<div class="bar">${all(M.showcase.map(o => o.file))}</div><div class="grid">${M.showcase.map(o => card(o)).join('')}</div>`)}

${sec('price', '04', 'Товары и услуги', 'Прайс: для каждой позиции — название, цена, описание, категория и фото 1200×1200. Цены те же, что на сайте. «По запросу» — в Яндексе выбрать «Цена по запросу» или оставить поле пустым.',
  `<div class="btnp" style="margin:0 0 22px"><div class="btnp-h"><span class="btnp-n">↻</span><div><b>Автоматически — по ссылке (рекомендуем)</b><span>«Товары и услуги» → «Источник» → «YML-фид» → вставьте ссылку → «Добавить». Яндекс сам перечитывает её, и прайс обновляется после каждой выкатки сайта.</span></div></div><div class="btnp-r"><span class="btnp-l">Ссылка на фид</span><code>${K.SITE}/feeds/yandex-business.yml</code><button class="b sm" type="button" data-copy-v="${K.SITE}/feeds/yandex-business.yml">Копировать</button></div></div><p class="lead" style="margin:0 0 16px">Или вручную — те же позиции ниже:</p><div class="bar">${all(M.goods.map(o => o.file))}</div>` + K.PRICE.map(p => { const g = goodsImg[p.id]; return `<div class="row">${card(g)}<div>
     <span class="tag">${esc(p.cat)}</span>${copy('Название', p.name, K.LIMITS.priceName)}
     <div class="cp"><div class="cp-h"><b>Цена</b><span class="price">${rub(p.price)}${p.unit ? ' ' + p.unit : ''}</span>
       <button class="b sm" type="button" data-copy-v="${p.price || ''}">Копировать</button></div></div>
     ${copy('Описание', p.text, K.LIMITS.priceText)}${copy('Ссылка', K.utm(p.link, 'price', p.id))}</div></div>`; }).join(''))}

${sec('stories', '05', 'Истории', 'Кнопка «Создать историю»: название до 15 знаков, слайды 1280×1920 по порядку, на последнем — кнопка со ссылкой. Обложкой сделайте первый слайд.',
  M.stories.map(s => { const st = K.STORIES.find(x => x.id === s.id); return `<div class="story"><div class="story-h"><h3>${esc(s.name)}</h3>
    <button class="b sm g" type="button" data-copy-v="${esc(s.name)}">Копировать название</button>${all([...s.files].reverse())}</div>
    <div class="reel">${s.files.map((file, i) => card({ file, w: 1280, h: 1920, label: 'Слайд ' + (i + 1) + (i === s.files.length - 1 ? ' · кнопка' : '') }, '', i === s.files.length - 1)).join('')}</div>
    <div class="btnp"><div class="btnp-h"><span class="btnp-n">${s.files.length}</span><div><b>Кнопка на последнем слайде</b>
      <span>В «Слайдах» выделите слайд ${s.files.length} → «Кнопка» → вставьте текст и ссылку</span></div></div>
      <div class="btnp-r"><span class="btnp-l">Текст кнопки</span><code>${esc(st.button.text)}</code>
        <button class="b sm" type="button" data-copy-v="${esc(st.button.text)}">Копировать</button></div>
      <div class="btnp-r"><span class="btnp-l">Ссылка</span><code>${esc(K.utm(st.button.link, 'story', st.id))}</code>
        <button class="b sm" type="button" data-copy-v="${esc(K.utm(st.button.link, 'story', st.id))}">Копировать</button></div></div></div>`; }).join(''))}

${sec('posts', '06', 'Публикации', '«Пишите о новостях и акциях»: текст (заголовок — первой строкой) и до 4 фото. Публикуйте по одной в неделю — свежие новости Яндекс показывает в карточке выше.',
  K.POSTS.map(p => { const m = M.posts.find(x => x.id === p.id); const text = p.head + '\n\n' + p.text + '\n\n' + link(p.link); return `<div class="post">
    <div class="imgs">${m.files.map((file, i) => card({ file, w: 1600, h: 1200, label: 'Фото ' + (i + 1) })).join('')}</div>
    <div>${copy('Текст публикации', text)}</div></div>`; }).join(''))}

${sec('promos', '07', 'Акции', '«Добавить акцию»: даты, анонс до 70 знаков, описание до 200, ссылка и фото (Яндекс просит от 900×480 — здесь 1800×960).',
  K.PROMOS.map(p => { const m = M.promos.find(x => x.id === p.id); return `<div class="post"><div class="imgs">${card({ ...m, label: 'Фото акции' })}</div>
    <div>${copy('Текст анонса', p.title, K.LIMITS.promoTitle)}${copy('Описание', p.text, K.LIMITS.promoText)}${copy('Ссылка на акцию', K.utm(p.link, 'promo', p.id))}
    <p class="note">Даты: начало — сегодня, окончание — через 1–3 месяца; потом акцию можно продлить.</p></div></div>`; }).join(''))}

${sec('video', '08', 'Видео', '«Фото и видео» → «Видео». Ролики без звука — в Картах видео и так играет без него. Вертикальный подходит и для историй.',
  M.videos.length ? `<div class="grid wide">${M.videos.map(v => `<figure class="it"><video src="${f(v.file)}" poster="${f(v.poster)}" controls muted loop playsinline preload="none" style="aspect-ratio:${v.w}/${v.h}"></video>
    <figcaption><span>${esc(v.label)}</span><span class="m">${v.w}×${v.h} · ${v.sec} с · ${kb(size(v.file))}</span>${dl(v.file)}</figcaption></figure>`).join('')}</div>` : '<p class="note">Ролики ещё не собраны.</p>')}

${sec('review', '09', 'Отзывы: ссылка и QR-код', 'Ссылка и QR-код ведут на <b>futureflow.ru/otzyv</b>, а оттуда — сразу в отзывы карточки FutureFlow в Яндекс Картах. Отправляйте ссылку клиенту после сдачи работы, табличку A6 — печатайте. Звёзды человек ставит сам: заранее выбрать оценку Яндекс не даёт и подталкивать к «пятёрке» запрещает.',
  (M.reviewTarget ? '' : '<p class="note"><b>Ещё не работает:</b> не указан адрес карточки в Картах — после него ссылка и QR-код заработают сами.</p>') +
  `<div class="btnp" style="margin:0 0 18px"><div class="btnp-h"><span class="btnp-n">★</span><div><b>Ссылка на отзыв</b><span>Для письма, мессенджера, подписи в почте</span></div></div>
    <div class="btnp-r"><span class="btnp-l">Ссылка</span><code>${K.SITE + K.REVIEW.path}</code><button class="b sm" type="button" data-copy-v="${K.SITE + K.REVIEW.path}">Копировать</button></div>
    <div class="btnp-r"><span class="btnp-l">Сообщение</span><code>${esc(K.REVIEW.ask + ' ' + K.SITE + K.REVIEW.path)}</code><button class="b sm" type="button" data-copy-v="${esc(K.REVIEW.ask + ' ' + K.SITE + K.REVIEW.path)}">Копировать</button></div></div>
  <div class="grid">${M.review.map(o => card(o, o.file.endsWith('qr.png') ? `<a class="b g sm" href="${f('review/futureflow-otzyv-qr.svg')}" download>SVG</a>` : '')).join('')}</div>`)}

</main>
<footer><div class="wrap">FutureFlow · набор для Яндекс Бизнеса · собирает <code>deploy/yandex/build.mjs</code>, тексты — <code>deploy/yandex/kit.mjs</code></div></footer>
<div class="toast" id="toast">Скопировано</div>
<script>
(function(){
  var toast=document.getElementById('toast'),tm;
  function say(t,ms){toast.textContent=t;toast.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){toast.classList.remove('on')},ms||1400)}
  function put(text,btn){
    function ok(){say('Скопировано');if(btn){var o=btn.textContent;btn.classList.add('ok');btn.textContent='Готово';setTimeout(function(){btn.classList.remove('ok');btn.textContent=o},1200)}}
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(ok,fb)}else fb();
    function fb(){var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){say('Выделите текст вручную')}t.remove()}
  }
  // Скачать = сразу файл, а не открыть картинку. Атрибут download браузер игнорирует, если страница открыта с диска
  // (file://) — поэтому: по http — fetch → blob; с диска — files/.dl/<путь>.js (base64, пишет page.mjs) → blob.
  function give(blob,name){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.setAttribute('data-raw','');document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)}
  var wait={};window.__dlPut=function(rel,type,b64){var bin=atob(b64),n=bin.length,u=new Uint8Array(n);while(n--)u[n]=bin.charCodeAt(n);var w=wait[rel];delete wait[rel];if(w)w(new Blob([u],{type:type}))};
  function viaScript(href){var rel=href.indexOf('files/')===0?href.slice(6):href;return new Promise(function(ok,no){wait[rel]=ok;var sc=document.createElement('script');sc.src='files/.dl/'+rel+'.js';sc.onload=function(){sc.remove()};sc.onerror=function(){delete wait[rel];sc.remove();no()};document.head.appendChild(sc)})}
  function getBlob(href){return location.protocol==='file:'?viaScript(href):fetch(href).then(function(r){if(!r.ok)throw 0;return r.blob()}).catch(function(){return viaScript(href)})}
  function save(href){var name=href.split('/').pop();
    return getBlob(href).then(function(bl){give(bl,name)},function(){window.open(href,'_blank');say('Сохраните файл: правый клик → «Сохранить как»')})}
  // «Скачать все» — каждый файл отдельно, по очереди (истории — с последнего слайда). Через blob, как «Скачать»: прямая
  // ссылка со страницы, открытой с диска, ОТКРЫВАЕТ картинку вместо скачивания. Chrome без разрешения пропускает
  // все скачивания после первого — один раз «Разрешить» скачивание нескольких файлов (значок в адресной строке).
  async function saveAll(list){say('Скачиваю '+list.length+' файлов…',4000);
    for(var i=0;i<list.length;i++){try{give(await getBlob(list[i]),list[i].split('/').pop())}catch(er){}await new Promise(function(r){setTimeout(r,500)})}
    say('Скачано '+list.length+'. Если пришёл один файл — нажмите значок блокировки справа в адресной строке → «Всегда разрешать» → и ещё раз «Скачать все»',12000)}
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-copy]');if(b){put(b.closest('.cp').querySelector('.cp-t').textContent,b);return}
    b=e.target.closest('[data-copy-v]');if(b){put(b.getAttribute('data-copy-v'),b);return}
    b=e.target.closest('[data-all]');if(b){saveAll(JSON.parse(b.getAttribute('data-all')));return}
    b=e.target.closest('a[download]:not([data-raw])');if(b){e.preventDefault();save(b.getAttribute('href'));}
  });
})();
</script>
</body>
</html>
`;
  // base64-копии для кнопок «Скачать» при открытии страницы с диска (см. save() в скрипте страницы)
  const FILES = path.join(ROOT, 'merch/yandex/files'), DL = path.join(FILES, '.dl');
  const TYPES = { jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', mp4: 'video/mp4', yml: 'application/xml', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' };
  fs.rmSync(DL, { recursive: true, force: true });
  for (const rel of fs.readdirSync(FILES, { recursive: true })) {
    const ext = rel.split('.').pop(); if (!TYPES[ext] || rel.startsWith('.dl')) continue;
    const out = path.join(DL, rel + '.js'); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `__dlPut(${JSON.stringify(rel.split(path.sep).join('/'))},"${TYPES[ext]}","${fs.readFileSync(path.join(FILES, rel)).toString('base64')}")`);
  }
  fs.writeFileSync(path.join(ROOT, 'merch/yandex/index.html'), html);
  console.log('страница: merch/yandex/index.html');
}
