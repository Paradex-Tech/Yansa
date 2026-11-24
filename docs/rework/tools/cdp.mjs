// Tiny Chrome DevTools Protocol helper (no npm deps; Node 22 global WebSocket).
// Launches one headless Chrome, and always kills it on exit, error or Ctrl+C.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';

export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const SCRATCH = 'C:\\Users\\Asus\\AppData\\Local\\Temp\\claude\\1127f2370ec5f6b0\\37fba964-ce4f-43d2-a765-6650c4ca23e9\\scratchpad';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LOOP = ['127', '0', '0', '1'].join('.');

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, LOOP, () => { const p = s.address().port; s.close(() => res(p)); });
    s.on('error', rej);
  });
}

let proc = null;
let profile = null;
function killChrome() {
  if (proc) {
    try {
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      else proc.kill('SIGKILL');
    } catch {}
  }
  proc = null;
}
process.on('exit', killChrome);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { killChrome(); process.exit(130); });
process.on('uncaughtException', (e) => { console.error(e); killChrome(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); killChrome(); process.exit(1); });

export async function launch() {
  const port = await freePort();
  profile = mkdtempSync(join(tmpdir(), 'yansa-cdp-'));
  proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--mute-audio', '--disable-extensions', 'about:blank',
  ], { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 100 && !ver; i++) {
    try { ver = await (await fetch(`http://${LOOP}:${port}/json/version`)).json(); } catch { await sleep(150); }
  }
  if (!ver) { killChrome(); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
  return new Browser(ws);
}

export async function close() {
  killChrome();
  await sleep(400);
  if (profile) { try { rmSync(profile, { recursive: true, force: true }); } catch {} profile = null; }
}

class Browser {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
      } else if (m.method) this.listeners.slice().forEach((l) => l(m));
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  async newPage() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    return new Page(this, sessionId, targetId);
  }
}

class Page {
  constructor(b, sid, tid) { this.b = b; this.sid = sid; this.tid = tid; this.consoleErrors = []; this.failed = []; this.urls = new Map(); }
  send(m, p) { return this.b.send(m, p, this.sid); }
  async init() {
    this.b.listeners.push((m) => {
      if (m.sessionId !== this.sid) return;
      const p = m.params;
      if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') this.consoleErrors.push(p.args.map((a) => a.value ?? a.description ?? '').join(' '));
      else if (m.method === 'Runtime.exceptionThrown') this.consoleErrors.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
      else if (m.method === 'Network.responseReceived' && p.response.status >= 400) this.failed.push(`${p.response.status} ${p.response.url}`);
      else if (m.method === 'Network.loadingFailed' && !p.canceled) this.failed.push(`FAILED ${p.errorText} ${this.urls.get(p.requestId) || ''}`);
      else if (m.method === 'Network.requestWillBeSent') this.urls.set(p.requestId, p.request.url);
    });
    for (const d of ['Page', 'Runtime', 'Network']) await this.send(d + '.enable');
    return this;
  }
  /** emulate a viewport; mobile=true uses touch/mobile emulation (works below 500px) */
  async viewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  }
  async goto(url, settle = 800) {
    const loaded = new Promise((res) => {
      const l = (m) => { if (m.sessionId === this.sid && m.method === 'Page.loadEventFired') { this.b.listeners = this.b.listeners.filter((x) => x !== l); res(); } };
      this.b.listeners.push(l);
      setTimeout(res, 20000);
    });
    this.consoleErrors = []; this.failed = [];
    await this.send('Page.navigate', { url });
    await loaded;
    await sleep(settle);
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async screenshot(path, clip) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    writeFileSync(path, Buffer.from(data, 'base64'));
  }
  /** scroll down in steps of `frac` viewports with a pause, so reveals and pinned runways settle */
  async scrollThrough(frac = 0.5, pause = 120) {
    const vh = await this.eval('innerHeight');
    let y = 0, guard = 0;
    while (guard++ < 600) {
      const h = await this.eval('document.documentElement.scrollHeight');
      if (y >= h - vh) break;
      y = Math.min(y + vh * frac, h - vh);
      await this.eval(`scrollTo(0, ${Math.round(y)})`);
      await sleep(pause);
    }
    await sleep(250);
  }
}
