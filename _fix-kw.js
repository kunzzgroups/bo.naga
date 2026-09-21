const fs = require("fs");
const p = "assets/css/vip-reward-log.css";
let t = fs.readFileSync(p, "utf8");
const from = "width:140px !important;\r\n  min-width:140px !important;\r\n  max-width:140px !important;\r\n  flex:0 0 140px !important;";
const to = "width:280px !important;\r\n  min-width:220px !important;\r\n  max-width:360px !important;\r\n  flex:1 1 280px !important;";
const n = t.split(from).length - 1;
if (!n) {
  console.error("pattern not found");
  process.exit(1);
}
t = t.split(from).join(to);
fs.writeFileSync(p, t);
console.log({ replaced: n, left140: (t.match(/140px/g) || []).length });
