// СЧЁТ НА ОПЛАТУ. Копировать в schet-<номер>.js в _materials/docs/ проекта, заполнить CFG.
// Порядок: сверить finance-log → QR (make-qr.py) → node schet-<номер>.js → check-docx.py → строка в finance-log.
const fs = require('fs');
const L = require('./lib.js');
const { CLIENT, p, t, AlignmentType, Paragraph, ImageRun, GAP_IN, GAP_BLOCK } = L;   // отступы — общий ритм документов (lib.js)
const CFG = {
  num: CLIENT.prefix + '00_',                  // ТОЛЬКО из next-number.py: сквозной счётчик договоров/счетов/актов проекта
  dateText: '«__» ________ 2026 г.',
  basis: CLIENT.contract,                      // + «в редакции дополнительного соглашения № N от …», если есть
  items: [{ name: 'Услуги по продвижению по договору за ________ 2026 г.', price: '120 000,00' }], // одна короткая строка
  total: '120 000,00',
  totalWords: 'Сто двадцать тысяч рублей 00 копеек',
  qr: 'qr-0000.png',
  out: 'Счёт №0000 (120 000).docx',
};
const QR = fs.readFileSync(process.env.QR_PATH || CFG.qr);
L.save(CFG.out, [
  L.logo(),                                    // логотип FutureFlow — первым абзацем, справа (repo-notes, раздел 3.0)
  L.bankTable(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 240, line: 240 },
    children: [t(`Счёт на оплату № ${CFG.num} от ${CFG.dateText}`, { size: 26, bold: true })] }),
  p('Поставщик (Исполнитель): ' + L.ISP_LINE, { after: GAP_IN }),
  p(`Покупатель (Заказчик): ${CLIENT.short}, ${CLIENT.inn_kpp}, ${CLIENT.address}.`, { after: GAP_BLOCK }),
  p('Основание: ' + CFG.basis, { after: GAP_BLOCK }),
  L.servicesTable(CFG.items, 'Товары (работы, услуги)'),
  p('Итого:  ' + CFG.total, { align: AlignmentType.RIGHT, bold: true, before: GAP_IN, after: 40 }),
  p('Без НДС', { align: AlignmentType.RIGHT, after: 40 }),
  p('Всего к оплате:  ' + CFG.total, { align: AlignmentType.RIGHT, bold: true, after: GAP_BLOCK }),
  p(`Всего наименований ${CFG.items.length}, на сумму ${CFG.total} руб.`, { after: GAP_IN }),
  p(`Всего к оплате: ${CFG.totalWords}. Без НДС.`, { bold: true, after: 300 }),
  new Paragraph({ spacing: { after: 300 }, children: [new ImageRun({ type: 'png', data: QR, transformation: { width: 144, height: 144 } })] }),
  p('Индивидуальный предприниматель  _____________________  /  Зайдель А. П.  /'),
]);
