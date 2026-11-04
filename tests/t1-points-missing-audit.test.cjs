const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bo=path.resolve(__dirname,'..');
test('member points history suppresses raw SQL details',()=>{
 const s=fs.readFileSync(path.join(bo,'assets/js/t1-member-points.js'),'utf8');
 assert.match(s,/PreparedStatementCallback/);
 assert.match(s,/safeError\(/);
 assert.match(s,/verify the T1 points database migration/);
 assert.match(s,/json\.message\|\|json\.error/);
});
test('points report suppresses raw SQL details',()=>{
 const s=fs.readFileSync(path.join(bo,'assets/js/t1-points-report.js'),'utf8');
 assert.match(s,/PreparedStatementCallback/);
 assert.match(s,/safeError\(/);
 assert.match(s,/verify the T1 points database migration/);
 assert.match(s,/data\.message\|\|data\.error/);
});
