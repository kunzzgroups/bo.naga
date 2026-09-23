const fs = require('fs');
const files = [
  'c:/Users/hwang/OneDrive/Desktop/bo.naga-1/assets/css/bo-charcoal-legacy.css',
  'c:/Users/hwang/OneDrive/Desktop/bo.naga-1/assets/css/reports.css',
  'c:/Users/hwang/OneDrive/Desktop/bo.naga-1/assets/css/bo-input-fill.css',
  'c:/Users/hwang/OneDrive/Desktop/bo.naga-1/assets/css/main-admin-detail-executive.css',
  'c:/Users/hwang/OneDrive/Desktop/bo.naga-1/assets/css/bo-charcoal-shell.css'
];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const patterns = ['form-check-input', 'type="checkbox"', "type='checkbox'"];
  console.log('\nFILE', f.split('/').pop());
  for (const p of patterns) {
    let i = -1, c = 0;
    while ((i = t.indexOf(p, i + 1)) !== -1 && c < 4) {
      console.log(p, '->', JSON.stringify(t.slice(Math.max(0, i - 40), i + 160).replace(/\s+/g, ' ')).slice(0, 240));
      c++;
    }
  }
}
