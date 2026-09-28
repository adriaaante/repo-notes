// СЧЁТ НА ОПЛАТУ. Копировать в schet-<номер>.js в _materials/docs/ проекта, заполнить CFG.
// Порядок: сверить finance-log → QR (make-qr.py) → node schet-<номер>.js → check-docx.py → строка в finance-log.
const fs = require('fs');
const L = require('./lib.js');
const { CLIENT, p, t, AlignmentType, Paragraph, ImageRun } = L;
const CFG = {
  num: CLIENT.prefix + '001',                  // своя серия клиента: следующий номер — из finance-log проекта
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
  L.bankTable(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 240, line: 240 },
    children: [t(`Счёт на оплату № ${CFG.num} от ${CFG.dateText}`, { size: 26, bold: true })] }),
  p('Поставщик (Исполнитель): ' + L.ISP_LINE),
  p(`Покупатель (Заказчик): ${CLIENT.short}, ${CLIENT.inn_kpp}, ${CLIENT.address}.`),
  p('Основание: ' + CFG.basis, { after: 200 }),
  L.servicesTable(CFG.items, 'Товары (работы, услуги)'),
  p('Итого:  ' + CFG.total, { align: AlignmentType.RIGHT, bold: true, after: 40 }),
  p('Без НДС', { align: AlignmentType.RIGHT, after: 40 }),
  p('Всего к оплате:  ' + CFG.total, { align: AlignmentType.RIGHT, bold: true, after: 200 }),
  p(`Всего наименований ${CFG.items.length}, на сумму ${CFG.total} руб.`),
  p(`Всего к оплате: ${CFG.totalWords}. Без НДС.`, { bold: true, after: 300 }),
  new Paragraph({ spacing: { after: 300 }, children: [new ImageRun({ type: 'png', data: QR, transformation: { width: 144, height: 144 } })] }),
  p('Индивидуальный предприниматель  _____________________  /  Зайдель А. П.  /'),
]);
