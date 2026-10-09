#!/usr/bin/env node
// Связь проекта с FutureFlow CRM (https://crm.futureflow.ru): документы проекта видны в CRM, счета CRM — в реестре проекта.
// Без зависимостей (Node 18+). Запускать из корня репозитория проекта.
//
//   node $SK/scripts/crm.js sync          — ГЛАВНОЕ: перед выдачей номера и после каждого документа.
//        1) счета, которые CRM выставила сама (по графику), дописываются в таблицу «Счета» finance-log — next-number.py их увидит;
//        2) каждый документ из таблиц finance-log («Договоры», «Счета», «Акты и соглашения») с файлами .docx/.pdf из
//           _materials/docs уходит в CRM; повторный запуск ничего не задваивает, «оплачен» в статусе — оплата в CRM.
//   node $SK/scripts/crm.js status        — что CRM знает о клиенте: следующий номер, неоплаченные счета, график
//   node $SK/scripts/crm.js paid КН-004 [ДД.ММ.ГГГГ]                     — отметить оплату счёта
//   node $SK/scripts/crm.js requisites    — реквизиты из _materials/docs/client.json в карточку клиента CRM (префикс — только если его нет)
//   node $SK/scripts/crm.js schedule <день> <сумма> [ГГГГ-ММ] ["строка услуги"] — цена по графику (с месяца — старая строка закроется)
//
// Ключ — переменная окружения FF_CRM_API_KEY (настройки окружения claude.ai/code; выдаётся в CRM → «Настройки» →
// «Сессии проектов»). Без ключа скрипт ничего не ломает: предупреждает и выходит с кодом 0 — документ остаётся в репо.
// Репозиторий берётся из git remote origin (или FF_CRM_REPO=owner/name), адрес CRM — FF_CRM_URL.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = (process.env.FF_CRM_URL || 'https://crm.futureflow.ru').replace(/\/$/, '');
const KEY = process.env.FF_CRM_API_KEY || '';
const DOCS = '_materials/docs';
const LOG = '_materials/finance-log.md';

function repoName() {
  if (process.env.FF_CRM_REPO) return process.env.FF_CRM_REPO;
  const url = execFileSync('git', ['remote', 'get-url', 'origin']).toString().trim();
  const m = /([^/:]+)\/([^/]+?)(?:\.git)?$/.exec(url);
  if (!m) throw new Error('Не понял репозиторий из ' + url + ' — задайте FF_CRM_REPO=owner/name');
  return `${m[1]}/${m[2]}`;
}
async function api(method, url, body) {
  const opt = { method, headers: { authorization: 'Bearer ' + KEY } };
  if (body instanceof FormData) opt.body = body;
  else if (body) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(BASE + url, opt);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `CRM ответила ${r.status}`), { status: r.status });
  return data;
}

// ---------- finance-log: таблицы документов ----------
const SECTIONS = [['Договоры', 'contract'], ['Счета', 'invoice'], ['Акты и соглашения', 'act']];
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((s) => s.trim());
const toIso = (d) => { const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(d || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const kopOf = (s) => { const m = /(\d[\d\s ]*)(?:,(\d{2}))?/.exec(String(s || '').replace(/^\+/, '')); return m ? Number(m[1].replace(/\D/g, '')) * 100 + Number(m[2] || 0) : null; };
const strip = (s) => String(s || '').replace(/\*\*|`/g, '').trim();

function readLog(text, prefix) {
  const rows = [];
  const lines = text.split('\n');
  let sec = null, head = null;
  for (const line of lines) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) { sec = SECTIONS.find(([name]) => h[1].startsWith(name)) || null; head = null; continue; }
    if (!sec || !line.trim().startsWith('|')) continue;
    const c = cells(line);
    if (!head) { head = c.map((x) => x.toLowerCase()); continue; }
    if (/^:?-{3,}/.test(c[0])) continue;
    const col = (re) => { const i = head.findIndex((x) => re.test(x)); return i >= 0 ? strip(c[i]) : ''; };
    const cell = col(/^№|^документ/);   // «№» или «Документ» (у Сферикса): «СФ-1558», «Акт № 1» — без серии клиента не берём
    const number = (/[A-Za-zА-ЯЁ]{2}-\d{3,}/.exec(cell) || [])[0] || '';
    if (!number || (prefix && !number.startsWith(prefix))) continue;
    const basis = col(/основани|предмет/);
    const status = col(/статус/).toLowerCase();
    let type = sec[1];
    if (type === 'act' && /соглашени/i.test(cell + ' ' + basis + ' ' + col(/сумм/))) type = 'addendum';
    rows.push({ type, number, date: toIso(col(/дата/)), sum: col(/сумм|цена/), basis, status,
      paid: /оплачен/.test(status) && !/не\s*оплачен|ждём|ждем/.test(status), cancelled: /отмен|аннулир/.test(status) });
  }
  return rows;
}
// строка услуги счёта: первая «…» с «договор», иначе — без неё (в CRM подставится заголовок)
const itemOf = (basis) => (basis.match(/«([^»]{15,})»/g) || []).map((q) => q.slice(1, -1)).find((q) => /договор/i.test(q)) || '';

// файлы документа: в _materials/docs и подпапках (out/…); имя содержит номер целиком — «Счёт №КН-004 …», «Счёт № АД-1548 …»,
// «Счёт АД-1550 от …»; «КН-0021» за «КН-002» не принимается
function listDocs(dir, depth = 2) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
    ? (depth > 1 && !/^(node_modules|img|\.)/.test(e.name) ? listDocs(path.join(dir, e.name), depth - 1) : [])
    : [path.join(dir, e.name)]);
}
// документ — по ПЕРВОМУ номеру в имени: «Доп. соглашение №КН-003 к договору №КН-001» — это КН-003, не договор КН-001
const firstNumber = (name) => (/(?:^|[^0-9A-Za-zА-Яа-яЁё])([A-Za-zА-ЯЁ]{2}-\d{3,})(?![0-9])/.exec(name) || [])[1];
function filesFor(number) {
  const hit = listDocs(DOCS).filter((f) => firstNumber(path.basename(f).normalize('NFC')) === number);
  return { docx: hit.find((f) => /\.docx$/i.test(f)), pdf: hit.find((f) => /\.pdf$/i.test(f)) };
}

async function push(repo, d) {
  const f = filesFor(d.number);
  const fd = new FormData();
  fd.set('repo', repo); fd.set('type', d.type); fd.set('number', d.number); fd.set('date', d.date);
  const kop = kopOf(d.sum);
  if (kop) fd.set('kop', String(kop));
  if (d.type === 'invoice') { const it = itemOf(d.basis); if (it) fd.set('item', it); }
  const title = path.basename(f.docx || f.pdf || '').normalize('NFC').replace(/\.(docx|pdf)$/i, '');
  if (title) fd.set('title', title);
  fd.set('note', 'из реестра проекта (finance-log)');
  for (const k of ['docx', 'pdf']) if (f[k]) fd.set(k, new Blob([fs.readFileSync(f[k])]), path.basename(f[k]).normalize('NFC'));
  const r = await api('POST', '/ext/v1/documents', fd);
  if (d.type === 'invoice' && d.paid) await api('POST', '/ext/v1/invoices/paid', { repo, number: d.number, date: d.date, note: 'оплачен по реестру проекта' });
  return { ...r, files: [f.docx, f.pdf].filter(Boolean).length };
}

// счета CRM, которых нет в реестре, — строкой в таблицу «Счета» (next-number.py их увидит)
function appendToLog(text, invoices) {
  if (!invoices.length) return text;
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^##\s+Счета\s*$/.test(l));
  if (start < 0) return text;
  let end = start + 1;
  while (end < lines.length && !/^##\s/.test(lines[end])) end++;
  let last = -1;
  for (let i = start + 1; i < end; i++) if (lines[i].trim().startsWith('|')) last = i;
  if (last < 0) return text;
  const fmt = (k) => (k / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2 }).replace(/ /g, ' ') + ' ₽';
  const ST = { issued: 'выставлен в CRM', sent: 'выставлен в CRM, отправлен', partial: 'оплачен частично', paid: 'оплачен', cancelled: 'отменён' };
  const rows = invoices.map((i) => `| ${i.number} | ${i.date.split('-').reverse().join('.')} | ${fmt(i.total_kop)} | ${i.item || 'по графику CRM'} (выставлен в CRM) | ${ST[i.status] || i.status} |`);
  lines.splice(last + 1, 0, ...rows);
  return lines.join('\n');
}

async function main() {
  const [cmd = 'status', ...args] = process.argv.slice(2);
  if (!KEY) { console.log('⚠ Нет ключа FF_CRM_API_KEY — в CRM ничего не отправлено (документ остаётся в репозитории). Ключ: CRM → «Настройки» → «Сессии проектов».'); return; }
  const repo = repoName();
  if (cmd === 'status') {
    const c = await api('GET', '/ext/v1/client?repo=' + encodeURIComponent(repo));
    console.log(`${c.name} · следующий номер в CRM: ${c.next_number || '— (нет префикса)'}`);
    for (const i of c.open_invoices) console.log(`  ждёт оплаты: ${i.number} от ${i.date} — ${(i.debt_kop / 100).toLocaleString('ru-RU')} ₽`);
    for (const s of c.schedules) console.log(`  график: ${s.day}-го — ${(s.kop / 100).toLocaleString('ru-RU')} ₽${s.kind === 'transfer' ? ' (перевод)' : ''}${s.starts ? ' с ' + s.starts : ''}${s.ends ? ' по ' + s.ends : ''}`);
    return;
  }
  if (cmd === 'sync') {
    const c = await api('GET', '/ext/v1/client?repo=' + encodeURIComponent(repo));
    let text = fs.readFileSync(LOG, 'utf8');
    const known = new Set(readLog(text, c.prefix).map((d) => d.number));
    const fromCrm = c.invoices.filter((i) => i.from_crm && !known.has(i.number) && i.status !== 'cancelled');
    if (fromCrm.length) {
      text = appendToLog(text, fromCrm);
      fs.writeFileSync(LOG, text);
      console.log(`↓ в реестр дописаны счета из CRM: ${fromCrm.map((i) => i.number).join(', ')} — закоммитьте ${LOG}`);
    }
    const docs = readLog(text, c.prefix).filter((d) => d.date && !d.cancelled && !fromCrm.some((i) => i.number === d.number));
    for (const d of docs) {
      try {
        const r = await push(repo, d);
        console.log(`↑ ${d.number} (${d.type}) — ${r.created ? 'добавлен' : 'обновлён'} в CRM, файлов: ${r.files}${d.type === 'invoice' && d.paid ? ', оплачен' : ''}`);
      } catch (e) { console.log(`✗ ${d.number}: ${e.message}`); if (e.status === 401) process.exitCode = 1; }
    }
    const after = await api('GET', '/ext/v1/client?repo=' + encodeURIComponent(repo));
    console.log(`Следующий номер в CRM: ${after.next_number || '—'} (next-number.py должен выдать тот же)`);
    return;
  }
  if (cmd === 'paid') {
    const [number, date] = args;
    if (!number) throw new Error('Номер счёта: crm.js paid КН-004 [ДД.ММ.ГГГГ]');
    const r = await api('POST', '/ext/v1/invoices/paid', { repo, number, date });
    console.log(`${r.number}: ${r.status === 'paid' ? 'оплачен' : r.status}`);
    return;
  }
  if (cmd === 'requisites') {
    const cj = JSON.parse(fs.readFileSync(path.join(DOCS, 'client.json'), 'utf8'));
    const { _comment, prefix, ...fields } = cj;
    const r = await api('PATCH', '/ext/v1/client', { repo, ...fields, set_prefix: prefix, ...(fields.party_full ? { kind: 'ip' } : {}) });
    console.log(`Реквизиты ${r.name} обновлены в CRM`);
    return;
  }
  if (cmd === 'schedule') {
    const [day, total, from, item] = args;
    const r = await api('PUT', '/ext/v1/schedule', { repo, day: Number(day), total, from, item });
    console.log(`График: ${r.schedule.day}-го — ${(r.schedule.kop / 100).toLocaleString('ru-RU')} ₽${r.schedule.starts ? ' с ' + r.schedule.starts : ''}`);
    return;
  }
  throw new Error('Команды: sync, status, paid, requisites, schedule');
}

main().catch((e) => { console.error('CRM: ' + e.message); process.exitCode = 1; });
