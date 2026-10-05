/**
 * Security validation test suite (Zod-based lib/validation.ts)
 * Run: npx tsx scripts/test-validation-runner.ts
 * Exit code 1 if any check fails.
 */
import {
  containsInjectionPatterns,
  sanitizeDocNo,
  sanitizeTradeId,
  sanitizeSafeFilename,
  escapeSqlLike,
  sanitizeQuantity,
  sanitizePrice,
  validateLoginPayload,
  validateOrderPayload,
  validateCartSyncPayload,
  validateCustomerUpdatePayload,
  validateOrderPatchPayload,
  parseProductsQuery,
  parseOrdersQuery,
} from '../lib/validation';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

const validOrderItem = {
  tradeId: 'TRADE-001',
  tradeName: 'Beer',
  qty: 2,
  unitName: 'ลัง',
  typeName: 'Pre Order',
  salePrice: 500,
};

console.log('\n[1] Injection signature detection');
check("SQL: ' OR 1=1 --", containsInjectionPatterns("admin' OR 1=1 --"));
check('SQL: UNION SELECT', containsInjectionPatterns('UNION SELECT * FROM Users'));
check('SQL: ; DROP TABLE', containsInjectionPatterns('; DROP TABLE Customer;--'));
check('CMD: ; cat /etc/passwd', containsInjectionPatterns('ORD123; cat /etc/passwd'));
check('CMD: | whoami', containsInjectionPatterns('file.jpg | whoami'));
check('NoSQL: $gt', containsInjectionPatterns('$gt'));
check('Proto: __proto__', containsInjectionPatterns('__proto__'));
check('clean id passes', !containsInjectionPatterns('UBR00123'));
check('username "john.sh" is not a false positive', !containsInjectionPatterns('john.sh'));

console.log('\n[2] Path traversal / document & trade id');
check('docNo ../../etc/passwd rejected', sanitizeDocNo('../../etc/passwd') === null);
check('docNo with SQL rejected', sanitizeDocNo('ORD69000888; DROP TABLE') === null);
check('docNo non-string rejected', sanitizeDocNo({ $gt: '' }) === null);
check('docNo ORD69000888 accepted', sanitizeDocNo('ORD69000888') === 'ORD69000888');
check('docNo ORDautorun accepted', sanitizeDocNo('ORDautorun') === 'ORDautorun');
check('tradeId "..\\x" rejected', sanitizeTradeId('../x') === null);
check('tradeId "a;b" rejected', sanitizeTradeId('a;b') === null);
check('tradeId object rejected', sanitizeTradeId({}) === null);
check('tradeId 31321321321 accepted', sanitizeTradeId('31321321321') === '31321321321');

console.log('\n[3] Upload filename');
check('../../evil.exe rejected', !sanitizeSafeFilename('../../evil.exe').isValid);
check('CON.png rejected', !sanitizeSafeFilename('CON.png').isValid);
check('script.sh rejected', !sanitizeSafeFilename('script.sh').isValid);
check('null byte removed', !sanitizeSafeFilename('slip.png\x00').safeName.includes('\x00'));
const goodName = sanitizeSafeFilename('slip-receipt 2026_01.PNG');
check('normal name accepted & normalised', goodName.isValid && goodName.safeName === 'slip-receipt_2026_01.png', goodName);

console.log('\n[4] SQL LIKE escaping');
check(
  'wildcards escaped',
  escapeSqlLike('100% discount [offer] _special_') === '100[%] discount [[]offer] [_]special[_]'
);

console.log('\n[5] Login payload (Zod)');
check('object username rejected', !validateLoginPayload({ username: { $gt: '' }, password: '1' }).isValid);
check('missing username rejected', !validateLoginPayload({ password: '1' }).isValid);
check('SQL username rejected', !validateLoginPayload({ username: "x' OR 1=1 --", password: '1' }).isValid);
check('object password rejected', !validateLoginPayload({ username: 'CUS001', password: { $ne: 1 } }).isValid);
const okLogin = validateLoginPayload({ username: ' CUS001 ', password: 'secret', rememberMe: true });
check('valid login trimmed', okLogin.isValid && okLogin.data?.username === 'CUS001' && okLogin.data.rememberMe === true, okLogin);
const noPass = validateLoginPayload({ username: 'CUS001' });
check('missing password -> empty string (route reports it)', noPass.isValid && noPass.data?.password === '', noPass);
check('rememberMe defaults to false', noPass.data?.rememberMe === false);
check('non-object body rejected', !validateLoginPayload('nope').isValid && !validateLoginPayload(null).isValid);

console.log('\n[6] Order payload (Zod)');
check('empty items rejected', !validateOrderPayload({ items: [] }).isValid);
check('items as object rejected', !validateOrderPayload({ items: { length: 5 } }).isValid);
check('>100 items rejected', !validateOrderPayload({ items: Array(101).fill(validOrderItem) }).isValid);
const badItem = validateOrderPayload({ items: [validOrderItem, { ...validOrderItem, tradeId: '../x' }] });
check('bad tradeId rejected with item number', !badItem.isValid && !!badItem.error?.includes('ลำดับที่ 2'), badItem);
const order = validateOrderPayload({
  items: [{ ...validOrderItem, qty: -5, salePrice: 'abc', extra: 'dropped', __proto__: { admin: true } }],
  paymentMethod: 'X',
  customerTel: '081-234 5678 <script>',
  customerEmail: 'not-an-email',
  customerAddress: 'Bangkok\x00',
  isAdmin: true,
});
check('order accepted', order.isValid, order);
check('qty clamped to 1', order.data?.items[0].qty === 1);
check('invalid price -> 0', order.data?.items[0].salePrice === 0);
check('unknown paymentMethod -> M', order.data?.paymentMethod === 'M');
check('tel stripped of letters/symbols', order.data?.customerTel === '081-234 5678', order.data?.customerTel);
check('invalid email dropped (lenient)', order.data?.customerEmail === '');
check('null byte stripped from address', order.data?.customerAddress === 'Bangkok');
check('unknown keys stripped', !('isAdmin' in (order.data as object)) && !('extra' in (order.data?.items[0] as object)));
check('giant qty clamped', validateOrderPayload({ items: [{ ...validOrderItem, qty: 999999999 }] }).data?.items[0].qty === 99999);
check('object qty rejected', !validateOrderPayload({ items: [{ ...validOrderItem, qty: { $gt: 0 } }] }).isValid);
check('object tradeName rejected', !validateOrderPayload({ items: [{ ...validOrderItem, tradeName: { a: 1 } }] }).isValid);
check('long remark truncated to 500', validateOrderPayload({ items: [validOrderItem], remark: 'x'.repeat(900) }).data?.remark.length === 500);
const minimal = validateOrderPayload({ items: [{ tradeId: 'A1' }] });
check('minimal item gets defaults', minimal.isValid && minimal.data?.items[0].qty === 1 && minimal.data.items[0].unitName === '', minimal);

console.log('\n[7] Cart sync payload (Zod)');
check('items not array rejected', !validateCartSyncPayload({ items: 'x' }).isValid);
check('missing items rejected', !validateCartSyncPayload({}).isValid);
const cart = validateCartSyncPayload({
  items: [validOrderItem, { tradeId: '../x' }, null, 'str', { ...validOrderItem, tradeId: 'B2', qty: 3 }],
});
check('invalid cart rows skipped, valid kept', cart.isValid && cart.data?.items.length === 2, cart);

console.log('\n[8] Customer update payload (Zod)');
const upd = validateCustomerUpdatePayload({ customerName: ' Somchai ', customerEmail: 'A@B.com', customerTel: '08x1' });
check('update accepted & normalised', upd.isValid && upd.data?.customerName === 'Somchai' && upd.data.customerEmail === 'a@b.com' && upd.data.customerTel === '081', upd);
check('invalid email rejected (no silent wipe)', !validateCustomerUpdatePayload({ customerEmail: 'oops' }).isValid);
check('empty email allowed', validateCustomerUpdatePayload({ customerEmail: '' }).isValid);
check('object field rejected', !validateCustomerUpdatePayload({ customerName: { $ne: '' } }).isValid);

console.log('\n[9] Order PATCH payload (Zod)');
check('invalid status rejected', !validateOrderPatchPayload({ docSts: '9' }).isValid);
check('SQL in status rejected', !validateOrderPatchPayload({ docSts: "1'; DROP TABLE x" }).isValid);
check('numeric status accepted', validateOrderPatchPayload({ docSts: 3 }).data?.docSts === '3');
check('absent fields stay undefined', validateOrderPatchPayload({}).data?.docSts === undefined);
check('object remark rejected', !validateOrderPatchPayload({ remark: { a: 1 } }).isValid);

console.log('\n[10] Query strings (Zod)');
const pq = parseProductsQuery(new URLSearchParams('page=-5&limit=9999&search=Black %26 White&category=' + 'x'.repeat(200)));
check('page clamped to 1', pq.page === 1, pq);
check('limit clamped to 60', pq.limit === 60);
check('search with & preserved', pq.search === 'Black & White', pq.search);
check('category truncated to 50', pq.category.length === 50);
const pd = parseProductsQuery(new URLSearchParams(''));
check('product defaults', pd.page === 1 && pd.limit === 24 && pd.search === '' && pd.category === '', pd);
const oq = parseOrdersQuery(new URLSearchParams('limit=abc&tel=08%3Cb%3E1&customerId=' + 'y'.repeat(80)));
check('orders limit default 50', oq.limit === 50, oq);
check('orders tel sanitised', oq.tel === '081', oq.tel);
check('orders customerId truncated', oq.customerId.length === 50);

console.log('\n[11] Numeric helpers');
check('qty -5 -> 1', sanitizeQuantity(-5) === 1);
check('qty huge -> 99999', sanitizeQuantity(999999999) === 99999);
check('price -500 -> 0', sanitizePrice(-500) === 0);
check('price "foo" -> 0', sanitizePrice('foo') === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
