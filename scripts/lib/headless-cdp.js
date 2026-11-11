/* Minimal headless-Chrome driver over the DevTools protocol, no dependencies (Node 22+ ships WebSocket).
   Written for scripts/table-fit-audit.js: measure pages served by scripts/dev-harness.js without a browser
   extension. Set CHROME_PATH if Chrome is not at the default Windows location. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function jsonOnce(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error('Chrome did not open its debugging port: ' + url);
}

class Page {
  constructor(sessionId, send) { this.sessionId = sessionId; this._send = send; this._waiters = []; this.on = {}; }
  send(method, params) { return this._send(method, params || {}, this.sessionId); }
  /* Runtime.evaluate with awaitPromise; errors are surfaced instead of silently returning undefined. */
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error((d.exception && d.exception.description) || d.text || 'evaluate failed');
    }
    return r.result ? r.result.value : undefined;
  }
  async setViewport(width, height, dsf) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf || 1, mobile: false });
  }
  async goto(url, { waitFor, timeout = 15000 } = {}) {
    const loaded = new Promise((res) => { this.on.load = res; });
    await this.send('Page.navigate', { url });
    await Promise.race([loaded, sleep(timeout)]);
    if (waitFor) await this.waitFor(waitFor, timeout);
    await sleep(250);
  }
  async waitFor(expression, timeout = 10000) {
    const end = Date.now() + timeout;
    for (;;) {
      let ok = false;
      try { ok = await this.evaluate(`return !!(${expression});`); } catch { ok = false; }
      if (ok) return true;
      if (Date.now() > end) return false;
      await sleep(120);
    }
  }
  async screenshot(file, clip) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!clip, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  async consoleErrors() { return this._errors || []; }
}

async function launch({ width = 1534, height = 900, dsf = 1, dpr } = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-cdp-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars=false', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--disable-features=Translate,BackForwardCache',
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--window-size=' + width + ',' + height, 'about:blank',
  ], { stdio: 'ignore' });

  const info = await jsonOnce(`http://127.0.0.1:${port}/json/version`);
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const pages = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message + ' (' + JSON.stringify(msg.error.data || '') + ')')) : res(msg.result);
      return;
    }
    const p = msg.sessionId && pages.get(msg.sessionId);
    if (!p) return;
    if (msg.method === 'Page.loadEventFired' && p.on.load) { const f = p.on.load; p.on.load = null; f(); }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      p._errors.push((d.exception && d.exception.description) || d.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      p._errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
  };
  const send = (method, params, sessionId) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify(sessionId ? { id: mid, method, params, sessionId } : { id: mid, method, params }));
  });

  const browser = {
    async newPage() {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const p = new Page(sessionId, send);
      p._errors = [];
      pages.set(sessionId, p);
      await p.send('Page.enable');
      await p.send('Runtime.enable');
      await p.setViewport(width, height, dsf);
      return p;
    },
    async close() {
      try { await send('Browser.close'); } catch { /* already gone */ }
      try { ws.close(); } catch { /* noop */ }
      proc.kill();
      await sleep(150);
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* locked on Windows, harmless */ }
    },
  };
  return browser;
}

module.exports = { launch, sleep };
