# CLAUDE.md — bo.naga 代码地图（给 Claude 用）

博彩/赌场 **Backoffice**（Admin / Executive Panel）。纯静态前端：根目录约 181 个 `.html`，
页面脚本在 `assets/js/<页面>.js`，样式在 `assets/css`，Bootstrap 5 + 原生 JS，**没有构建步骤**。
后端是远程 REST API（`assets/js/config.js` 的 `API_CONFIG`）。本仓库不含后端代码。

先读这三份，它们是团队的权威文档，本文件只做索引与提醒：
`AGENTS.md`（Git 流程 + 外壳规则）· `SPA.md`（换页路由，中文）· `DESIGN.md`（设计系统，约 8100 行，按需 grep，别整篇读）。
产品原则见 `PRODUCT.md`：数据准确第一、页面简单、交互流畅、**保留现有 API 接线、保留浅色/深色两套主题**。

## 1. 三套外壳（互相不统一，AGENTS.md 明确禁止合并）

| 外壳 | 判定 | 页数 | 说明 |
|---|---|---|---|
| BO | `<html data-bo-shell="bo">` | 108 | 普通后台。含 9 个 `agent-*.html` 管理页（management/detail/commission/settlement/reimbursement/promotion/performance…） |
| Main 面板 | `data-bo-shell="main"` | 44 | `main-*`、`main_*`、`menu-permission.html`；平台级（商户、游戏商、结算） |
| Agent 门户 | 页面加载 `agent-portal.js` | 12 | 用 `agent_token` 登录 `POST /agent/login`；**判定看是否加载该脚本，不看文件名** |

跨外壳跳转一律整页刷新（设计如此）。

## 2. 改任何页面之前必须知道的规则

1. **外壳布局度量只写在 `assets/css/bo-shell.css`**（padding/gap/font-size/height/flex…）。主题表只管颜色、背景、边框色、阴影。
   违反会被 `scripts/check-shell-drift.js` 拦下（现有 ~2350 条历史违规记在 `shell-drift-baseline.json`，只拦新增）。
2. **页面脚本必须整体包在 IIFE 里，并且可重复执行**（SPA 换页会重跑）。顶层 `const/let/class` 与别的页面脚本重名 = SyntaxError，整段脚本失效。
3. 不要在 `body` 上放“只做一次”的标记；document/window 级监听用 **window 单槽**（先 remove 旧的再绑新的），不要只加“已绑过”标记，否则换页后叠加。
4. 绑在顶栏元素上的监听换页后失效（顶栏被克隆替换）→ 用 document 级委托。
5. 元素查找做 null 保护，一句失败会拖垮后面一整块绑定。
6. 改了 CSS/JS 后要**重打 `?v=` 指纹**：`node scripts/pin-spa.js`（SPA 资源）/ `scripts/stamp-asset-pins.py`、`check-asset-pins.js --fix`（其它）。
   `auth.js` 里注入的资源（如 `bo-global-quicknav.css?v=`，两处；`site-customize.js` 里的 `layout-section.js?v=`）**指纹是手写的，要手动改**。
   “我改了怎么没生效”九成是指纹/缓存。
7. 新增 BO 页面：加 3 行（`bo-shell.css`、`<header class="report-topbar" data-bo-topbar>`、紧随其后的 `bo-topbar.js`）+ 菜单行（Menu Management，数据库里）+ 跑
   `node scripts/adopt-bo-spa.js`、`node scripts/check-spa-readiness.js --write-manifest`、`node scripts/pin-spa.js`。
   有模块 tab 行的页面必须链接 `bo-module-tabs.css`，并在 `auth.js` 的 `MODULE_TABS` 登记。
8. 新增钻取页（无菜单行）要在 **`auth.js` 两张别名表**里都加：`enforcePageAccess`（权限）和 `sidebarActivePage`（侧栏高亮），两张意图相反，不能互相替代。
9. 链接要参与换页：`.report-nav a` / `.bo-module-tabs a` / `.bo-global-quicknav a` / `[data-bo-spa-link]`；强制整页用 `data-bo-no-spa`。不要用 `location.reload()`。
10. 同一脚本被两页加载且需重跑 → `<script data-bo-spa-rerun>`；共享运行时要“重建目标页 DOM”→ 订阅 `bo:spa:content`（首帧前修正用 `bo:spa:content-mounted`），别乱加 rerun。

调试：控制台 `copy(BO_SPA.report())`、`BO_SPA.debug.canSwap('x.html')`、`BO_SPA.debug.scriptTimes()`；紧急关停 `localStorage.bo_spa='0'`。

## 3. 设计系统速查（Charcoal + Amber；细节在 DESIGN.md，用 grep 找）

- **主题**：`data-bo-theme="light|dark"`（`localStorage.bo_theme`）。浅色是暖奶油，**不是纯白**：列表面 `#FFF8EB`、侧栏 `#FFE8CC`、表单层级 `#FFFCF7 → #F5EBDC → #F0E4D0`、边框 `#EADCC8/#DCC9A8`、墨色 `#18191C`。深色面 `#2A2C36 / #383A46`，墨 `#F5F5F4`。
- **每个浅色规则都要有对应的深色规则**（“深色里的浅色孤岛”是反复出现的 bug 类；DESIGN.md §sweep）。
- **控件高度**：面板内（筛选行、搜索框、日期触发器、页脚 Show N）统一 **36px**，圆角 8；表单页输入 44px/r10；弹窗 40/42。`bo-control-height.css` 必须是倒数第二个样式表（紧挨 `bo-field-standard.css` 之前）。守卫 `scripts/check-control-height.py`。
- **主按钮**琥珀渐变 `#FBBF24→#F59E0B→#EA8608`，**主按钮不要 box-shadow**；次按钮/Back/Cancel 三段奶油渐变，hover 是反向渐变 + 上浮 1px；ghost 不能有琥珀 hover。守卫 `check-button-standard.py`、`check-button-hover.mjs`。
- **搜索框唯一写法**：`<label class="bo-search-control"><i class="bi bi-search"></i><input aria-label=…></label>`，样式只在 `bo-input-fill.css` §5。别再手写 `.field` 式搜索。守卫 `check-search-standard.py`。
- **表单字段主题**由 `bo-field-standard.css` 兜底（`!important` 是有意的）。
- **表格**：表头 `#FFE8CC`/字 `#6b360c`，11px/700 大写；斑马纹由 `bo-table-zebra.css`（Main 页最后一张）；报表页页脚是三栏 grid（Show N 左 / 信息中 / 页码梯右，±2 窗口）；`-` 页大小 = 自适应（`pagination-standardizer.js`）。
- **状态胶囊**需要 `bo-seg-bounce.css/.js`；顺序 Active → 其它 → All。
- **侧栏**宽 `--sidebar-w` = **230px**（已核对代码：`reports.css`、`bo-shell.css:197`、孪生 `reports-dashboard-original.css`；DESIGN.md 里写的 260px 是过期的）、折叠轨 72px；折叠状态存 `localStorage.bo_sidebar_mini`。顶栏主题切换、用户头像、主按钮、Ghost/Export 按钮样式锁定为 Admin Detail 规格，页面不得自由发挥。
- **画布所有权**：`bo-charcoal-shell.css` 画整个连续背景；不要给 html/body/.report-shell/.report-main/.report-content 上底色。Main 和 Agent 是平的。
- **不要用 navy / cyan**。代码里 `--bo-navy`、`--bo-cyan` 只是旧变量名，实际值是炭黑 `#18191C` 和琥珀 `#D97706`（深色 `#F5F5F4` / `#F59E0B`）。
- 任何声明了 `display` 的内容帧规则必须带 `:not([hidden])`。
- **文档与代码冲突时以代码为准**，已知冲突：侧栏宽度（见上）；日期选择器选中预设是实心还是淡底（DESIGN.md 与 `.interface-design/system.md` 说法不同）；“筛选框圆角 8px”实际只锁了高度，`reports.css` 的 `.field input{border-radius:10px}` 仍会赢；DESIGN.md 里 L5020/L5222、L5089/L5291 两段内容重复。
- 样式放哪（设计代理从实测加载顺序得出）：外壳度量 → 只放 `bo-shell.css`；颜色/主题 → 所属页面或模块的 sheet，或新建一个最后链接的页面 sheet；特异性冲突 → 扩展已有排除列表或对齐 ID 级，不要堆叠 `:not(#id)`。
- **不要用 `sed -i` 改 CSS**（CRLF/LF 混用），用 Edit。没有 `</head>`/括号配平问题时先检查 div 平衡。
- 验证样式：比较 **computed values**，跨主题（charcoal 页、`bo-wallet-tx` 页、都不是的页），量真正带文字/盒子的元素而不是容器。浏览器里的 `getComputedStyle().flexWrap` 不可信。
- CSS 层叠规律：后加载的主题表用 `!important` 或 ID 级特异性互相压；新样式**优先写在页面自己的 sheet 并放在 `<head>` 最后**，不要改 `reports.css`/`bo-charcoal-legacy.css` 这类共享老表（改动会影响一百多页）。优先复用 token/现有 class。

## 4. 运行时地图

- **`auth.js`**（~2100 行）：登录/token（`localStorage.bo_admin_token`、`bo_admin_user`）、`/auth/admin/me`（30 秒内只刷新一次）、`requireLogin`、`enforcePageAccess`（ROOT 绕过）、`renderSidebar`、`renderModuleTabs`（`MODULE_TABS`/`MODULE_ANCHORS`/`MODULE_SECTION_PAGES`）、`BO_AUTH.*`。权限唯一来源是 `/me` 返回的 `user.menus`。
- **没有统一的 fetch 封装**：`window.fetch` 被打了三次补丁——`brand-context.js`（`X-Brand-Id` + Bearer）、`main-currency-runtime.js`（`/api/admin/main/*` 带 `currency`）、`auth.js`（`X-Admin-Username`、`X-Request-Id`、`X-Admin-Audit-Context`）。所以页面脚本直接 `fetch(url)` 也带认证。没有全局 401 处理。
- `config.js`：`API_CONFIG.BASE_URL` 默认生产 `https://bo.titanx7.com/api`；本地覆盖 `localStorage.bo_api_base`。很多接口是页面脚本里**硬编码字符串**，不在 `ENDPOINTS` 里（Main 面板的接口几乎全是）。
- 多品牌：`X-Brand-Id`，当前品牌 `localStorage.bo_active_brand_id` / `BO_BRAND`。时区只在浏览器（`localStorage.bo_timezone`），不发服务端。
- 币种：BO 用 `currency-runtime.js`（会把页面文字 MYR/RM 改写），Main 用 `main-currency-runtime.js`。
- 通知：`livechat-global-notification.js`（Firestore `conversations` 监听）、`operation-global-notification.js`（1 秒轮询钱包请求，仅一个 leader 标签页）；Firebase 只用于客服。
- 日期范围：`bo-date-range.js`（BO，ID 配对写死）、`main-exec-date-range.js`（`MAIN_DATE_RANGE`）、另有 2 个分叉和约 18 个页面脚本自带预设；所有日期筛选默认打开“今天”。
- Main 面板中文：`main-i18n.js` + `main-i18n-translations.js`（`localStorage.bo_main_language`）；BO 外壳没有 UI 多语言；CMS 内容翻译走 `dynamic-translation.js`（`data-translation-ref-type`）。
- `bo-ui-standard.js` 会重定义 `window.alert` / `BO_DIALOG`，并按文字给按钮自动加 `.bo-ui-button*` 类（样式要同时命名两个类）。

## 5. 业务约定（改数字相关逻辑前看）

- 金额符号（Main 结算）：`houseResult` 从平台侧看，正 = 玩家输；正 `brandCharge` = 向商户收；正 `upstreamProviderPayable` = 付给游戏商；公司毛利 = `brandCharge − payable`；商户净利 = NGR − bonus − provider cost。结算账本状态 OPEN/PARTIAL/SETTLED/CARRIED，可结转。日期区间 `to` 以“加一天”的不含端点方式传。
- 银行余额：`bankUsage` 在提现审批里当“可用资金”，已批充值 +、已批提现 −；`Start` 前端反推（`BANK_BALANCE_API.md` 有待后端确认的问题）。
- 代理提现：代理提交 → BO 批准 → 标记已付；可提额 = 佣金 − 待处理申请；报销单批准后才入钱包。
- 角色类型：ROOT、MAIN、MASTER、BRAND_OWNER、CUSTOM；角色↔菜单通过 `/admin/access/role/{id}/menus`。菜单 `parentKey` = 菜单组 `groupKey`；`main_`/`main-` 开头视为 Main 菜单。
- 新页面要在菜单里“有一行”才会出现在侧栏；菜单标签存在数据库，在 `menu-management.html` 改。
- 客服：纯 Firestore（`conversations`、`conversations/{id}/messages`、`livechat_templates`），品牌过滤在浏览器端，模板全局共享。
- 最新提交 `78357bfd` 新增 T1 系列页面（points/missions/rewards/kyc/pages/engagement…）。

## 6. 已知问题（读代码得出，**未在浏览器验证**，动手前先复核）

- `admin-user`/`admin-login-log`/`admin-operation-log` 的分页监听 `[data-page]`，按钮却是 `data-ac-page`，数字页码可能无效。
- Create Admin 的 Permission Group 字段不会发送。
- `main-balance-adjustment.html:77` 标签 `< b id="adjustBrand">` 写坏，该页加载可能抛错。
- Main 游戏商创建总是发 `status:1`，编辑会把游戏商重新激活；Accounting Due 的 Pending 恒为 0；Endpoints/Integration 页是 mock。
- Main Win/Lose、Root Control、品牌执行视图的 document/window 监听没有单槽守卫，SPA 重复进入会叠加。
- 文件名与内容不符：`main-provider-credentials` 实为 Settlement Ledger，`main-provider-health` 实为 Activity Logs；`dashboard.html` 是 iframe 工作区，KPI 看板是 `dashboard-backup.html`；`t1-engagement.js` 无页面加载；`bonus-category-item.html` 无导航入口。
- `bo-spa-manifest.js` 标注“勿手改”但含手动追加的 `t1-points-report.html`；`bo-spa.js:123` 的 `note()` 有小 bug；`index.html:204` 有乱码字符；LiveChat 的 Firestore 监听离页不退订。
- 根目录 `_verify-*.html`、`_md-preview-*.html`、`_find-check.js`、`_fix-kw.js`、`_promo-dt-snippet.js`、`backup_provider.html` 是临时/备份文件；`_legacy/` 无人引用。

## 7. 工具与流程

- **测试所有页面用这个**：`node scripts/dev-harness.js [端口]`（默认 8123）→ 打开 `http://127.0.0.1:8123/<页面>.html?theme=dark|light`。
  它注入假的 ROOT 登录和空的接口响应，BO / Main / 各页面都能直接打开，不连真实后端、不改仓库文件；侧栏菜单为空，列表页显示空状态（充值/提现列表有几行假数据）。
  **和线上一样（真实数据）**：`node scripts/dev-harness.js 8123 --live` → 打开 `http://127.0.0.1:8123/login.html`，用自己的账号登录。页面来自本地仓库，`/api/` 转发到线上后端（生产数据，审批/保存会真的生效）。
  量尺寸用 `getComputedStyle`；视口用 1917 宽、DPR 1.25 才和用户的截图一致。
- 本地服务（只提供文件，无登录假数据，会跳登录页）：`node scripts/serve-static.js [端口]`（默认 8098，127.0.0.1）；`serve.json` 给 `npx serve`（cleanUrls）。指本地 API：`localStorage.setItem('bo_api_base','http://localhost:8080/api')`。
- pre-commit（**每个克隆手动装**：`cp scripts/git-hooks/pre-commit .git/hooks/pre-commit`）依次跑：shell-drift → asset-pins → global-collisions → spa-readiness → `pin-spa --check` → 删除守卫（防止过期工作区把别人的文件当删除提交）。Python 守卫、`audit-spa-swaps.js`、测试不在钩子里，需手动跑。
- `scripts/audit-spa-swaps.js` 用 Node ≥22 内置 WebSocket 直连 Chrome 调试协议，需 `CHROME_PATH` 和本地服务；`package.json` 里只有 `shadcn`，没有 puppeteer/playwright。
- 测试只有 2 个（T1 积分）：`node --test tests/t1-points-workflow.test.cjs tests/t1-points-missing-audit.test.cjs`（直接 `node --test tests/` 会失败）。
- Git：约 1458 次提交；个人分支 `<user>/<topic>` → PR → `main`（惯例，服务端不强制）；先 `git fetch` 再 `rebase origin/main`；永远不要整树提交过期工作区；先看 `git diff --stat origin/main..HEAD` 有没有意外删除；服务器只 `git merge --ff-only origin/main`，不在服务器上改代码；提交要及时（曾有未提交工作被覆盖）。
- `.agents/`、`.cursor/`、`.impeccable/` 是 AI 助手的技能/规则，与业务无关。

## 8. 这份地图的局限

由 12 个并行阅读代理在 2026-11 读完后汇总；JS 与页面结构读得较细，CSS 主要读结构与分区，不是逐条规则。
报表/游戏、会员钱包后半部分（钱包流水、批量操作、支付网关等）没有写成笔记，要改这些页面时请直接读对应 `html` + `js`。
DESIGN.md（约 8140 行）已读到结尾；`bo-shell`、`bo-ui-standard`、`bo-control-height`、`bo-field-standard`、`bo-edit-form`、`bo-module-tabs`、`bo-global-quicknav`、`bo-scrollbar`、`bo-table-zebra` 逐行读过；
`bo-input-fill`、`bo-charcoal-primitives` 和 500–800KB 的大表（`main-report-charcoal`、`reports`、`bo-charcoal-shell/legacy/cms`、`bo-wallet-transaction-amber`）只看了头部注释的分区。
动手改某个视觉问题时，先 `grep` DESIGN.md 找该页面/组件的小节再改，**并先看该小节里的 “trap/陷阱” 说明**——这份文档里每一节几乎都是一次踩坑的记录。
