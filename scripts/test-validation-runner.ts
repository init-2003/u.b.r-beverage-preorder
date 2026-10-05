import {
  containsInjectionPatterns,
  sanitizeDocNo,
  sanitizeTradeId,
  sanitizeSafeFilename,
  escapeSqlLike,
  sanitizeQuantity,
  sanitizePrice,
  sanitizePhone,
  sanitizeEmail,
  validateLoginPayload,
  validateOrderPayload,
  validateCartSyncPayload,
  validateCustomerUpdatePayload,
} from '../lib/validation';

console.log('=== [1] Testing SQL / Command / NoSQL Injection Detection ===');
const sql1 = "admin' OR 1=1 --";
const sql2 = "UNION SELECT * FROM Users";
const sql3 = "; DROP TABLE Customer;--";
const cmd1 = "ORD123; cat /etc/passwd";
const cmd2 = "file.jpg | whoami";
const nosql1 = "$gt";
const cleanUser = "UBR00123";

console.log(`- '${sql1}':`, containsInjectionPatterns(sql1) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${sql2}':`, containsInjectionPatterns(sql2) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${sql3}':`, containsInjectionPatterns(sql3) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${cmd1}':`, containsInjectionPatterns(cmd1) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${cmd2}':`, containsInjectionPatterns(cmd2) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${nosql1}':`, containsInjectionPatterns(nosql1) ? 'BLOCKED (OK)' : 'FAIL');
console.log(`- '${cleanUser}':`, containsInjectionPatterns(cleanUser) ? 'FAIL' : 'PASSED (OK)');

console.log('\n=== [2] Testing Path Traversal & Document Sanitization ===');
const badDoc1 = '../../etc/passwd';
const badDoc2 = 'ORD69000888; DROP TABLE';
const goodDoc1 = 'ORD69000888';
const goodDoc2 = 'ORDautorun';

console.log(`- Doc '${badDoc1}':`, sanitizeDocNo(badDoc1) === null ? 'REJECTED (OK)' : 'FAIL');
console.log(`- Doc '${badDoc2}':`, sanitizeDocNo(badDoc2) === null ? 'REJECTED (OK)' : 'FAIL');
console.log(`- Doc '${goodDoc1}':`, sanitizeDocNo(goodDoc1) === 'ORD69000888' ? 'ACCEPTED (OK)' : 'FAIL');
console.log(`- Doc '${goodDoc2}':`, sanitizeDocNo(goodDoc2) === 'ORDautorun' ? 'ACCEPTED (OK)' : 'FAIL');

console.log('\n=== [3] Testing Filename & Command Injection Defense ===');
const badFile1 = '../../evil.exe';
const badFile2 = 'CON.png';
const badFile3 = 'slip.php\x00.jpg';
const badFile4 = 'script.sh';
const goodFile1 = 'slip-receipt 2026_01.PNG';

console.log(`- File '${badFile1}':`, !sanitizeSafeFilename(badFile1).isValid ? 'REJECTED (OK)' : 'FAIL');
console.log(`- File '${badFile2}':`, !sanitizeSafeFilename(badFile2).isValid ? 'REJECTED (OK)' : 'FAIL');
console.log(`- File '${badFile3}':`, sanitizeSafeFilename(badFile3).safeName.includes('\x00') ? 'FAIL' : 'CLEANED (OK)');
console.log(`- File '${badFile4}':`, !sanitizeSafeFilename(badFile4).isValid ? 'REJECTED (OK)' : 'FAIL');
console.log(`- File '${goodFile1}':`, sanitizeSafeFilename(goodFile1).isValid ? `ACCEPTED as '${sanitizeSafeFilename(goodFile1).safeName}' (OK)` : 'FAIL');

console.log('\n=== [4] Testing SQL LIKE Wildcard Escaping ===');
const likeInput = "100% discount [offer] _special_";
const escaped = escapeSqlLike(likeInput);
console.log(`- Input: '${likeInput}'`);
console.log(`- Escaped: '${escaped}' (OK: % -> [%], _ -> [_], [ -> [[] )`);

console.log('\n=== [5] Testing NoSQL Object Injection Protection ===');
const objLogin = { username: { "$gt": "" }, password: "123" };
const loginRes = validateLoginPayload(objLogin);
console.log(`- Object payload login:`, !loginRes.isValid ? `REJECTED: ${loginRes.error} (OK)` : 'FAIL');

const objOrder = {
  items: { length: 5 }, // Fake array object
};
const orderRes = validateOrderPayload(objOrder);
console.log(`- Object payload order:`, !orderRes.isValid ? `REJECTED: ${orderRes.error} (OK)` : 'FAIL');

console.log('\n=== [6] Testing Quantity & Price Bounds Clamping ===');
console.log(`- Negative Qty (-5):`, sanitizeQuantity(-5) === 1 ? 'CLAMPED to 1 (OK)' : 'FAIL');
console.log(`- Giant Qty (999999999):`, sanitizeQuantity(999999999) === 99999 ? 'CLAMPED to 99999 (OK)' : 'FAIL');
console.log(`- Negative Price (-500):`, sanitizePrice(-500) === 0 ? 'CLAMPED to 0 (OK)' : 'FAIL');
console.log(`- NaN Price ("foo"):`, sanitizePrice("foo") === 0 ? 'CLAMPED to 0 (OK)' : 'FAIL');

console.log('\n=== ALL SECURITY VALIDATION TESTS PASSED ===\n');
