'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function characterize(order, expectedInvoice) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  // Keep the checkout result in the same characterization case to make the
  // invoice-versus-checkout comparison explicit without changing either path.
  assert.equal(typeof checkoutFigures.total, 'number');
  return { invoiceFigures, checkoutFigures };
}

test('CURRENT BEHAVIOUR: order #1001 applies explicit 18% and 5% rates with no coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2, gstRate: 18 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2, gstRate: 5 }
    ]
  };
  const { invoiceFigures, checkoutFigures } = characterize(order, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });

  assert.equal(checkoutFigures.total, 676.9);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
});

test('Invoice matches checkout for order #1002 SAVE10 discount and HSN GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1, gstRate: 5 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2, gstRate: 5 }
    ]
  };
  const { invoiceFigures, checkoutFigures } = characterize(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });

  assert.equal(checkoutFigures.discount, 102);
  assert.equal(checkoutFigures.tax, 45.9);
  assert.equal(checkoutFigures.total, 963.9);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
});

test('Invoice figures match checkout for HSN GST and SAVE10 discount before tax', () => {
  const items = [
    { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
    { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
  ];
  const order = { id: 1002, coupon: 'SAVE10', items };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  });
  assert.deepEqual(invoiceFigures.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
    checkoutFigures.lines.map((line) => ({ gstPercent: line.gstPercent, lineTax: line.tax })));
});

test('Invoice matches checkout for order #1004 SAVE10 max discount cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2, gstRate: 5 }
    ]
  };
  const { invoiceFigures, checkoutFigures } = characterize(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });

  assert.equal(checkoutFigures.discount, 150);
  assert.equal(checkoutFigures.tax, 104.5);
  assert.equal(checkoutFigures.total, 2194.5);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});

test('CURRENT BEHAVIOUR: order #1008 has matching invoice and checkout at 18% with no coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1, gstRate: 18 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2, gstRate: 18 }
    ]
  };
  const { invoiceFigures, checkoutFigures } = characterize(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });

  assert.equal(invoiceFigures.total, checkoutFigures.total);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
});
