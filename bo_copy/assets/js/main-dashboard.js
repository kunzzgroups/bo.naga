(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = v => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nearZero = v => Math.abs(Number(v || 0)) < 0.005;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  async function api(path) {
    const r = await fetch(API_CONFIG.BASE_URL + path, { headers: BO_AUTH.authHeader(), cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.status === 'error') throw Error(j.message || 'Request failed');
    return j.data ?? j;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function parseYmd(v) {
    const a = String(v || '').split('-').map(Number);
    if (a.length !== 3 || a.some(n => !n && n !== 0)) return null;
    return new Date(a[0], a[1] - 1, a[2]);
  }
  function niceDate(v) {
    const d = parseYmd(v);
    if (!d) return v || '';
    return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function addDay(v) {
    const a = String(v || '').split('-').map(Number);
    return new Date(Date.UTC(a[0], a[1] - 1, a[2] + 1)).toISOString().slice(0, 10);
  }
  function shiftDays(v, n) {
    const d = parseYmd(v);
    if (!d) return v;
    d.setDate(d.getDate() + n);
    return fmt(d);
  }
  function inclusiveDays(from, to) {
    const a = parseYmd(from), b = parseYmd(to);
    if (!a || !b) return 0;
    return Math.round((b - a) / 86400000) + 1;
  }
  function previousPeriod(from, to) {
    const days = inclusiveDays(from, to);
    if (days < 1) return null;
    const prevTo = shiftDays(from, -1);
    const prevFrom = shiftDays(prevTo, -(days - 1));
    return { from: prevFrom, to: prevTo, days };
  }
  function qs(from, to) {
    const f = from || $('mainFrom').value;
    const t = to || $('mainTo').value;
    return `?from=${encodeURIComponent(f)}&to=${encodeURIComponent(addDay(t))}`;
  }
  function prettyDate(v) {
    const a = String(v || '').split('-');
    return a.length === 3 ? `${a[2]}/${a[1]}` : v;
  }
  function dayOfMonth(v) {
    const a = String(v || '').split('-');
    return a.length === 3 ? String(Number(a[2])) : v;
  }
  function dayMonthShort(v) {
    const a = String(v || '').split('-');
    return a.length === 3 ? `${Number(a[2])}/${Number(a[1])}` : v;
  }
  function monthYearLabel(v) {
    const d = parseYmd(v);
    if (!d) return v || '';
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function isSameMonthRange(from, to) {
    const a = parseYmd(from), b = parseYmd(to);
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }
  function chartAxisMode(from, to) {
    if (!from || !to) return 'month';
    if (isSameMonthRange(from, to)) return 'day';
    const days = inclusiveDays(from, to);
    // 一个月以上、两个月以内：隔日 1/7 3/7 …
    if (days > 31 && days <= 62) return 'odd-dm';
    // 两个月以上：按月 Mar 2026 / Apr 2026
    return 'month';
  }
  function niceStep(span) {
    if (span <= 0) return 1;
    const raw = span / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  function shortNum(v) {
    const a = Math.abs(v);
    if (a >= 1000000) return (v / 1000000).toFixed(a >= 10000000 ? 0 : 1) + 'm';
    if (a >= 1000) return (v / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k';
    return Math.round(v).toLocaleString('en-MY');
  }
  function pctChange(curr, prev) {
    const c = Number(curr || 0), p = Number(prev || 0);
    if (nearZero(c) && nearZero(p)) return { pct: 0, dir: 'flat' };
    if (nearZero(p)) return { pct: c > 0 ? 100 : -100, dir: c >= 0 ? 'up' : 'down' };
    const pct = ((c - p) / Math.abs(p)) * 100;
    if (Math.abs(pct) < 0.05) return { pct: 0, dir: 'flat' };
    return { pct, dir: pct > 0 ? 'up' : 'down' };
  }
  function formatPct(pct) {
    const n = Number(pct || 0);
    const sign = n > 0 ? '+' : '';
    const a = Math.abs(n);
    if (a >= 999.95) return `${n < 0 ? '-' : '+'}999%+`;
    if (a >= 100) return `${sign}${n.toFixed(0)}%`;
    return `${sign}${n.toFixed(2)}%`;
  }

  function accumulate(rows) {
    let cm = 0, cg = 0;
    return (rows || []).map(r => {
      cm += Number(r.merchantProfit || 0);
      cg += Number(r.gameProfit || 0);
      return { ...r, merchantProfit: cm, gameProfit: cg, netProfit: cm + cg };
    });
  }

  function aggregateByMonth(rows) {
    const bucket = new Map();
    (rows || []).forEach(r => {
      const d = parseYmd(r.date);
      if (!d) return;
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
      const cur = bucket.get(key) || { date: `${key}-01`, merchantProfit: 0, gameProfit: 0 };
      cur.merchantProfit += Number(r.merchantProfit || 0);
      cur.gameProfit += Number(r.gameProfit || 0);
      bucket.set(key, cur);
    });
    return Array.from(bucket.values());
  }

  function seriesActive(rows, key) {
    return (rows || []).some(r => !nearZero(r[key]));
  }

  function sparkline(el, values, color) {
    if (!el) return;
    if (!values || values.length < 2) { el.innerHTML = ''; return; }
    const w = 112, h = 44, p = 2;
    let min = Math.min(0, ...values), max = Math.max(0, ...values);
    if (min === max) { min -= 1; max += 1; }
    const x = i => p + i * (w - p * 2) / (values.length - 1);
    const y = v => p + (max - v) / (max - min) * (h - p * 2);
    const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const z = y(0);
    const fill = `${line} L${x(values.length - 1).toFixed(1)},${z.toFixed(1)} L${x(0).toFixed(1)},${z.toFixed(1)} Z`;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path class="spark-fill" d="${fill}" fill="${color}"/><path class="spark-line" d="${line}" stroke="${color}"/></svg>`;
  }

  function setKpi(id, value, cardSel) {
    const el = $(id);
    if (!el) return;
    el.textContent = money(value);
    const wrap = el.closest('.profit-value');
    wrap.classList.toggle('is-neg', Number(value) < 0);
    const card = document.querySelector(cardSel);
    if (card) card.classList.toggle('is-zero', nearZero(value));
  }

  function setDelta(id, curr, prev, days) {
    const el = $(id);
    if (!el) return;
    const { pct, dir } = pctChange(curr, prev);
    const dayLabel = days === 1 ? '1 day' : `${days} days`;
    el.classList.remove('is-up', 'is-down', 'is-flat');
    el.classList.add(dir === 'up' ? 'is-up' : dir === 'down' ? 'is-down' : 'is-flat');
    el.innerHTML = `<span class="profit-delta-dot" aria-hidden="true"></span><span class="profit-delta-pct">${formatPct(pct)}</span><span class="profit-delta-meta">vs last ${dayLabel}</span>`;
  }

  function bindChartHover(root, rows, map, periodGrowth, active) {
    const tip = root.querySelector('.trend-tip');
    const hover = root.querySelector('.trend-hover-line');
    const svg = root.querySelector('.trend-svg');
    const dots = {
      merchant: root.querySelector('.trend-dot.merchant'),
      game: root.querySelector('.trend-dot.game'),
      net: root.querySelector('.trend-dot.net')
    };
    if (!tip || !hover || !svg || !rows.length) return;

    const hit = (clientX, clientY) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const svgX = ((clientX - rect.left) / rect.width) * map.W;
      const svgY = ((clientY - rect.top) / rect.height) * map.H;
      const left = map.L;
      const right = map.W - map.R;
      const top = map.T;
      const bottom = map.H - map.B;
      if (svgX < left || svgX > right) return null;
      if (svgY < top - 6 || svgY > bottom + 10) return null;
      if (rows.length === 1) return 0;
      const ratio = (svgX - left) / (right - left);
      return Math.max(0, Math.min(rows.length - 1, Math.round(ratio * (rows.length - 1))));
    };

    const show = (i, clientX, clientY) => {
      const r = rows[i];
      const m = Number(r.merchantProfit || 0);
      const g = Number(r.gameProfit || 0);
      const n = Number(r.netProfit || 0);
      const growth = map.labelMode === 'month'
        ? pctChange(n, i > 0 ? Number(rows[i - 1].netProfit || 0) : 0)
        : (periodGrowth || pctChange(n, i > 0 ? Number(rows[i - 1].netProfit || 0) : n));
      const { pct, dir } = growth;
      const growthColor = dir === 'down' ? '#FF8A8A' : '#5EE29A';
      const tipDate = map.labelMode === 'month' ? monthYearLabel(r.date) : niceDate(r.date);
      tip.innerHTML = `
        <div class="tip-date">${tipDate}</div>
        <div class="tip-net" style="color:${n < 0 ? '#FF8A8A' : '#5EE29A'}">${n >= 0 ? '+' : ''}${money(n)} MYR</div>
        <div class="tip-row"><span>Merchant</span><b>${money(m)} MYR</b></div>
        <div class="tip-row"><span>Game</span><b>${money(g)} MYR</b></div>
        <div class="tip-growth" style="color:${growthColor}"><span>Growth</span><b>${formatPct(pct)}</b></div>`;
      tip.hidden = false;
      tip.classList.remove('is-below');
      const wrapRect = root.getBoundingClientRect();
      const pad = 10;
      const localX = clientX - wrapRect.left;
      const localY = clientY - wrapRect.top;
      tip.style.left = `${Math.min(wrapRect.width - pad, Math.max(pad, localX))}px`;
      tip.style.top = '0px';
      const tipH = tip.offsetHeight || 120;
      const tipW = tip.offsetWidth || 176;
      const half = tipW / 2;
      const clampedX = Math.min(wrapRect.width - half - 4, Math.max(half + 4, localX));
      tip.style.left = `${clampedX}px`;
      const aboveTop = localY - tipH - 14;
      if (aboveTop >= pad) {
        tip.style.top = `${aboveTop}px`;
        tip.classList.remove('is-below');
      } else {
        tip.style.top = `${Math.min(wrapRect.height - tipH - pad, localY + 18)}px`;
        tip.classList.add('is-below');
      }
      const xi = map.x(i);
      hover.setAttribute('x1', xi);
      hover.setAttribute('x2', xi);
      hover.setAttribute('y1', map.T);
      hover.setAttribute('y2', map.H - map.B);
      hover.style.opacity = '1';
      const place = (dot, on, val) => {
        if (!dot) return;
        if (!on) { dot.style.opacity = '0'; return; }
        dot.setAttribute('cx', xi);
        dot.setAttribute('cy', map.y(val));
        dot.style.opacity = '1';
      };
      place(dots.merchant, active.m, m);
      place(dots.game, active.g, g);
      place(dots.net, active.n, n);
    };

    const hide = () => {
      tip.hidden = true;
      hover.style.opacity = '0';
      Object.values(dots).forEach(d => { if (d) d.style.opacity = '0'; });
    };

    root.onmousemove = e => {
      const i = hit(e.clientX, e.clientY);
      if (i == null) return hide();
      show(i, e.clientX, e.clientY);
    };
    root.onmouseleave = hide;
  }

  function renderChart(rows, periodGrowth) {
    const root = $('profitTrend');
    if (!rows || !rows.length) {
      root.innerHTML = '<div class="exec-empty">No data for selected period.</div>';
      return;
    }
    const axisMode = chartAxisMode($('mainFrom')?.value, $('mainTo')?.value);
    const rangeFrom = parseYmd($('mainFrom')?.value);
    // 两个月以上：按月聚合，不再按天画点
    if (axisMode === 'month') rows = aggregateByMonth(rows);
    rows = accumulate(rows);
    if (!rows.length) {
      root.innerHTML = '<div class="exec-empty">No data for selected period.</div>';
      return;
    }
    const showM = seriesActive(rows, 'merchantProfit');
    const showG = seriesActive(rows, 'gameProfit');
    const showN = seriesActive(rows, 'netProfit');
    $('legendMerchant')?.classList.toggle('is-idle', !showM);
    $('legendGame')?.classList.toggle('is-idle', !showG);
    $('legendNet')?.classList.toggle('is-idle', !showN);

    const W = 1200, H = 390, L = 74, R = 24, T = 30, B = 48, iw = W - L - R, ih = H - T - B;
    const vals = rows.flatMap(x => [Number(x.merchantProfit || 0), Number(x.gameProfit || 0), Number(x.netProfit || 0)]);
    let min = Math.min(0, ...vals), max = Math.max(0, ...vals);
    if (min === max) { min -= 1; max += 1; }
    const step = niceStep(max - min);
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
    if (min === max) max = min + step;
    const y = v => T + (max - v) / (max - min) * ih;
    const x = i => L + (rows.length === 1 ? iw / 2 : i * iw / (rows.length - 1));

    let grid = '';
    for (let v = min; v <= max + step * .1; v += step) {
      const yy = y(v);
      grid += `<line class="${Math.abs(v) < step / 100 ? 'trend-zero' : 'trend-grid'}" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="trend-axis-label" x="${L - 12}" y="${yy + 4}" text-anchor="end">${shortNum(v)}</text>`;
    }

    const poly = (key, cls) => `<polyline class="trend-line ${cls}" points="${rows.map((r, i) => `${x(i).toFixed(1)},${y(Number(r[key] || 0)).toFixed(1)}`).join(' ')}"/>`;
    const area = (key, cls) => {
      const pts = rows.map((r, i) => `${x(i).toFixed(1)},${y(Number(r[key] || 0)).toFixed(1)}`);
      const z0 = y(0);
      return `<polygon class="trend-fill ${cls}" points="${pts.join(' ')} ${x(rows.length - 1).toFixed(1)},${z0} ${x(0).toFixed(1)},${z0}"/>`;
    };

    const every = Math.max(1, Math.ceil(rows.length / 8));
    const minLabGap = axisMode === 'day' ? 22 : axisMode === 'month' ? 56 : 48;
    let labs = '';
    let lastLabX = -Infinity;
    rows.forEach((r, i) => {
      const cur = parseYmd(r.date);
      let showLab = false;
      let label = '';
      if (axisMode === 'day') {
        showLab = true;
        label = dayOfMonth(r.date);
      } else if (axisMode === 'odd-dm') {
        const diff = rangeFrom && cur ? Math.round((cur - rangeFrom) / 86400000) : i;
        showLab = diff % 2 === 0;
        label = dayMonthShort(r.date);
      } else if (axisMode === 'month') {
        showLab = true;
        label = monthYearLabel(r.date);
      } else {
        showLab = i % every === 0 || i === rows.length - 1;
        label = prettyDate(r.date);
      }
      if (!showLab) return;
      const xi = x(i);
      if (axisMode === 'day' && xi - lastLabX < minLabGap && i !== rows.length - 1) return;
      if (axisMode === 'month' && xi - lastLabX < minLabGap && i !== 0 && i !== rows.length - 1) return;
      lastLabX = xi;
      const anchor = axisMode === 'month' && i === 0 ? 'start' : 'middle';
      labs += `<text class="trend-axis-label${axisMode === 'day' || axisMode === 'odd-dm' ? ' is-day' : ''}${axisMode === 'month' ? ' is-month' : ''}" x="${xi}" y="${H - 15}" text-anchor="${anchor}">${label}</text>`;
    });

    const lines = [
      showN ? area('netProfit', 'net') : '',
      showM ? poly('merchantProfit', 'merchant') : '',
      showG ? poly('gameProfit', 'game') : '',
      showN ? poly('netProfit', 'net') : ''
    ].join('');

    root.innerHTML = `
      <div class="trend-tip" hidden></div>
      <svg class="trend-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Merchant profit, game profit and net profit trend">
        ${grid}${lines}${labs}
        <line class="trend-hover-line" x1="0" x2="0" y1="${T}" y2="${H - B}" style="opacity:0"></line>
        <circle class="trend-dot merchant" r="4.5" cx="0" cy="0"></circle>
        <circle class="trend-dot game" r="4.5" cx="0" cy="0"></circle>
        <circle class="trend-dot net" r="5" cx="0" cy="0"></circle>
      </svg>`;
    bindChartHover(
      root,
      rows,
      { x, y, T, B, H, L, R, W, labelMode: axisMode === 'month' ? 'month' : 'day' },
      periodGrowth,
      { m: showM, g: showG, n: showN }
    );
    sparkline($('merchantSpark'), rows.map(r => Number(r.merchantProfit || 0)), '#1688F8');
    sparkline($('gameSpark'), rows.map(r => Number(r.gameProfit || 0)), '#8248E9');
    sparkline($('netSpark'), rows.map(r => Number(r.netProfit || 0)), '#16B45D');
  }

  function render(data, prevSummary, days) {
    const s = data.summary || {};
    const p = prevSummary || {};
    setKpi('merchantProfit', s.merchantProfit, '.merchant-card');
    setKpi('gameProfit', s.gameProfit, '.game-card');
    setKpi('netProfit', s.netProfit, '.net-card');
    setDelta('merchantDelta', s.merchantProfit, p.merchantProfit, days);
    setDelta('gameDelta', s.gameProfit, p.gameProfit, days);
    setDelta('netDelta', s.netProfit, p.netProfit, days);
    renderChart(data.trend || [], pctChange(s.netProfit, p.netProfit));
  }

  async function load() {
    const root = $('mainExec');
    const from = $('mainFrom').value;
    const to = $('mainTo').value;
    if (!from || !to) return;
    const prev = previousPeriod(from, to);
    const days = prev?.days || inclusiveDays(from, to);
    root.classList.add('main-exec-loading');
    try {
      // 先拉当前区间，保证 KPI / 图表能出来；环比单独请求，失败不影响主数据
      const curr = await api('/admin/main/merchant-profit/dashboard' + qs(from, to));
      let prevSummary = {};
      if (prev) {
        try {
          const prevData = await api('/admin/main/merchant-profit/dashboard' + qs(prev.from, prev.to));
          prevSummary = prevData?.summary || {};
        } catch (_) { /* keep empty previous summary */ }
      }
      render(curr, prevSummary, days);
    } catch (e) {
      console.error(e);
      setKpi('merchantProfit', 0, '.merchant-card');
      setKpi('gameProfit', 0, '.game-card');
      setKpi('netProfit', 0, '.net-card');
      setDelta('merchantDelta', 0, 0, days);
      setDelta('gameDelta', 0, 0, days);
      setDelta('netDelta', 0, 0, days);
      ['merchantSpark', 'gameSpark', 'netSpark'].forEach(id => {
        const el = $(id);
        if (el) el.innerHTML = '';
      });
      const msg = String(e && e.message || '');
      const friendly = /failed to fetch|networkerror|load failed/i.test(msg)
        ? 'Unable to reach server. Check network and try again.'
        : (msg || 'Unable to load dashboard');
      $('profitTrend').innerHTML = `<div class="exec-empty text-danger">${friendly}</div>`;
    } finally {
      root.classList.remove('main-exec-loading');
    }
  }

  const pickerState = { view: new Date(), mode: 'days', yearPageStart: new Date().getFullYear() - 5 };

  function startOfWeek(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay());
    return x;
  }
  function endOfWeek(d) {
    const x = startOfWeek(d);
    x.setDate(x.getDate() + 6);
    return x;
  }
  function presetRange(key) {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let a = new Date(today), b = new Date(today);
    if (key === 'yesterday') { a.setDate(a.getDate() - 1); b = new Date(a); }
    if (key === 'thisWeek') { a = startOfWeek(today); b = endOfWeek(today); }
    if (key === 'lastWeek') { a = startOfWeek(today); a.setDate(a.getDate() - 7); b = new Date(a); b.setDate(b.getDate() + 6); }
    if (key === 'thisMonth') { a = new Date(today.getFullYear(), today.getMonth(), 1); b = new Date(today.getFullYear(), today.getMonth() + 1, 0); }
    if (key === 'lastMonth') { a = new Date(today.getFullYear(), today.getMonth() - 1, 1); b = new Date(today.getFullYear(), today.getMonth(), 0); }
    if (key === 'thisYear') { a = new Date(today.getFullYear(), 0, 1); b = new Date(today.getFullYear(), 11, 31); }
    if (key === 'lastYear') { a = new Date(today.getFullYear() - 1, 0, 1); b = new Date(today.getFullYear() - 1, 11, 31); }
    return [fmt(a), fmt(b)];
  }
  function markPreset(name) {
    document.querySelectorAll('[data-range-preset]').forEach(b => b.classList.remove('active'));
    if (name) {
      const b = document.querySelector(`[data-range-preset="${name}"]`);
      if (b) b.classList.add('active');
    }
  }
  function updateDateLabel() {
    const f = $('mainFrom').value || '', t = $('mainTo').value || '';
    $('mainDateLabel').textContent = f && t
      ? `${niceDate(f)} – ${niceDate(t)}`
      : f ? `${niceDate(f)} – Select end date`
      : 'Select date range';
  }
  function renderCalendar() {
    const monthBtn = $('mainCalMonth'), yearBtn = $('mainCalYear'), monthGrid = $('mainCalMonthGrid'), yearGrid = $('mainCalYearGrid'), dayView = $('mainCalDayView'), days = $('mainCalDays');
    monthBtn.innerHTML = MONTHS[pickerState.view.getMonth()] + ' <i class="bi bi-chevron-down"></i>';
    yearBtn.innerHTML = pickerState.view.getFullYear() + ' <i class="bi bi-chevron-down"></i>';
    monthGrid.innerHTML = MONTHS.map((m, i) => `<button type="button" data-main-month="${i}" class="${i === pickerState.view.getMonth() ? 'active' : ''}">${m}</button>`).join('');
    yearGrid.innerHTML = Array.from({ length: 12 }, (_, i) => pickerState.yearPageStart + i).map(y => `<button type="button" data-main-year="${y}" class="${y === pickerState.view.getFullYear() ? 'active' : ''}">${y}</button>`).join('');
    monthGrid.classList.toggle('show', pickerState.mode === 'months');
    yearGrid.classList.toggle('show', pickerState.mode === 'years');
    dayView.classList.toggle('hide', pickerState.mode !== 'days');
    const y0 = pickerState.view.getFullYear(), m = pickerState.view.getMonth(), first = new Date(y0, m, 1), last = new Date(y0, m + 1, 0), start = first.getDay(), total = last.getDate(), from = $('mainFrom').value || '', to = $('mainTo').value || '';
    let html = '', prevLast = new Date(y0, m, 0).getDate();
    for (let i = 0; i < start; i++) html += `<button type="button" class="muted" disabled>${prevLast - start + i + 1}</button>`;
    for (let d = 1; d <= total; d++) {
      const val = fmt(new Date(y0, m, d)), inRange = from && to && val >= from && val <= to, isEdge = val === from || val === to;
      html += `<button type="button" data-main-day="${val}" class="${inRange ? 'in-range' : ''} ${isEdge ? 'selected' : ''}">${d}</button>`;
    }
    for (let i = 1; i <= 42 - start - total; i++) html += `<button type="button" class="muted" disabled>${i}</button>`;
    days.innerHTML = html;
  }
  function setRange(from, to, preset = '', reload = true) {
    $('mainFrom').value = from || '';
    $('mainTo').value = to || '';
    markPreset(preset);
    updateDateLabel();
    renderCalendar();
    if (reload && from && to) load();
  }
  function initDatePicker() {
    const trigger = $('mainDateTrigger'), picker = $('mainRangePicker');
    const [a, b] = presetRange('lastMonth');
    pickerState.view = new Date(a + 'T00:00:00');
    setRange(a, b, 'lastMonth', false);
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      picker.classList.toggle('show');
      pickerState.mode = 'days';
      renderCalendar();
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.main-exec-date-field')) picker.classList.remove('show');
    });
    document.querySelectorAll('[data-range-preset]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      const [x, y] = presetRange(btn.dataset.rangePreset);
      pickerState.view = new Date(x + 'T00:00:00');
      setRange(x, y, btn.dataset.rangePreset, true);
      picker.classList.remove('show');
    }));
    $('mainCalPrev').onclick = e => {
      e.stopPropagation();
      if (pickerState.mode === 'years') pickerState.yearPageStart -= 12;
      else pickerState.view.setMonth(pickerState.view.getMonth() - 1);
      renderCalendar();
    };
    $('mainCalNext').onclick = e => {
      e.stopPropagation();
      if (pickerState.mode === 'years') pickerState.yearPageStart += 12;
      else pickerState.view.setMonth(pickerState.view.getMonth() + 1);
      renderCalendar();
    };
    $('mainCalMonth').onclick = e => {
      e.stopPropagation();
      pickerState.mode = pickerState.mode === 'months' ? 'days' : 'months';
      renderCalendar();
    };
    $('mainCalYear').onclick = e => {
      e.stopPropagation();
      pickerState.yearPageStart = pickerState.view.getFullYear() - 5;
      pickerState.mode = pickerState.mode === 'years' ? 'days' : 'years';
      renderCalendar();
    };
    $('mainCalMonthGrid').onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-main-month]');
      if (!b) return;
      pickerState.view.setMonth(Number(b.dataset.mainMonth));
      pickerState.mode = 'days';
      renderCalendar();
    };
    $('mainCalYearGrid').onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-main-year]');
      if (!b) return;
      pickerState.view.setFullYear(Number(b.dataset.mainYear));
      pickerState.mode = 'months';
      renderCalendar();
    };
    $('mainCalDays').onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-main-day]');
      if (!b) return;
      const val = b.dataset.mainDay, f = $('mainFrom'), t = $('mainTo');
      if (!f.value || (f.value && t.value) || val < f.value) {
        f.value = val;
        t.value = '';
        markPreset('');
        updateDateLabel();
        renderCalendar();
        return;
      }
      t.value = val;
      markPreset('');
      updateDateLabel();
      renderCalendar();
      picker.classList.remove('show');
      load();
    };
  }

  const THEME_KEY = 'bo_theme';
  function currentTheme(){
    try{ return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; }catch(e){ return 'light'; }
  }
  function applyTheme(theme){
    const next = theme === 'dark' ? 'dark' : 'light';
    const isDark = next === 'dark';
    document.documentElement.setAttribute('data-bo-theme', next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    const btn = document.getElementById('boThemeToggle');
    if(!btn) return;
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    const sun = btn.querySelector('[data-theme-icon="sun"]');
    const moon = btn.querySelector('[data-theme-icon="moon"]');
    if(sun) sun.hidden = isDark;
    if(moon) moon.hidden = !isDark;
  }
  function initThemeToggle(){
    applyTheme(currentTheme());
    document.getElementById('boThemeToggle')?.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  BO_AUTH.requireLogin();
  initThemeToggle();
  initDatePicker();
  load();
})();
