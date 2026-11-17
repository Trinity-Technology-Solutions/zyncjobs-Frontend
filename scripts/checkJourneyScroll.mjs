import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const profile = mkdtempSync(join(tmpdir(), 'zync-journey-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=9227', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  let pages;
  for (let i = 0; i < 80; i++) {
    try { pages = await fetch('http://127.0.0.1:9227/json').then(r => r.json()); break; }
    catch { await delay(100); }
  }
  if (!pages?.length) throw new Error('Chrome did not start');
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.once('open', resolve));
  let id = 0;
  const pending = new Map();
  ws.on('message', raw => { const message = JSON.parse(raw); if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); } });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, message => message.error ? reject(message.error) : resolve(message.result));
    ws.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  for (let i = 0; i < 90; i++) {
    if (await evaluate("!!document.querySelector('#how-it-works .journey-stage')")) break;
    await delay(500);
  }
  await delay(1500);
  const inspect = `(() => { const s=document.querySelector('#how-it-works'); if(!s) return {error:'No journey',body:document.body.innerText.slice(0,150)}; const c=s.querySelector('.journey-container'); return {step:s.querySelector('.journey-detail-label strong')?.textContent, y:scrollY, top:s.getBoundingClientRect().top, height:s.offsetHeight, minHeight:s.style.minHeight, pinned:s.classList.contains('journey-scroll-pinned'), containerTop:c.getBoundingClientRect().top, position:getComputedStyle(c).position, reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}; })()`;
  const waitForStep = async expected => {
    for (let i = 0; i < 40; i++) {
      const state = await evaluate(inspect);
      if (state.step === `STEP 0${expected} OF 04`) return state;
      await delay(100);
    }
    throw new Error(`Expected step ${expected}: ${JSON.stringify(await evaluate(inspect))}`);
  };
  for (const scenario of [
    { width: 1440, height: 900, motion: 'reduce' },
    { width: 1280, height: 720, motion: 'no-preference' },
  ]) {
    await evaluate("window.scrollTo({top:0,behavior:'instant'})");
    await send('Emulation.setDeviceMetricsOverride', { width: scenario.width, height: scenario.height, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: scenario.motion }] });
    await delay(500);
    const geometry = await evaluate(`(() => {
      const s = document.querySelector('#how-it-works');
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 86;
      return { start: scrollY + s.getBoundingClientRect().top + parseFloat(getComputedStyle(s).paddingTop) - header - 12,
        distance: Math.max(1200, Math.max(240, innerHeight-header-24)*.65*4) };
    })()`);
    for (const step of [1, 2, 3, 4, 3, 2, 1]) {
      await evaluate(`window.scrollTo({top:${geometry.start + geometry.distance * ((step - 1) / 4 + .05)},behavior:'instant'})`);
      const state = await waitForStep(step);
      if (!state.pinned || Math.abs(state.containerTop - 96) > 2) throw new Error(`Sticky layout failed: ${JSON.stringify(state)}`);
    }
    await evaluate("document.querySelector('button[aria-label=\"Next step\"]').click()");
    await waitForStep(2);
    await delay(1200);
    await waitForStep(2);
    await evaluate(`window.scrollTo({top:${geometry.start + geometry.distance + 500},behavior:'instant'})`);
    await delay(300);
    if ((await evaluate(inspect)).containerTop >= 96) throw new Error('Journey did not release at the end');
    console.log('PASS: forward/reverse steps, sticky position, next button, exit', scenario);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(400);
  if ((await evaluate(inspect)).pinned) throw new Error('Mobile should use natural page scrolling');
  await evaluate("document.querySelectorAll('.journey-step')[2].click()");
  await waitForStep(3);
  console.log('PASS: mobile natural scrolling and manual step selection');

  for (const motion of ['no-preference', 'reduce']) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await evaluate("window.scrollTo({top:0,behavior:'instant'})");
    await delay(300);
    const before = await evaluate(`(() => {
      const items = [...document.querySelectorAll('.candidate-scroll-item')];
      return { count: items.length, hidden: items.filter(el => getComputedStyle(el).opacity === '0').length };
    })()`);
    if (before.count < 15) throw new Error(`Missing homepage animation targets: ${JSON.stringify(before)}`);
    const uncovered = await evaluate(`(() => {
      const sections = [...document.querySelectorAll('.zync-home > section, .zync-home > .home-first-screen, .zync-home > .home-company-strip, .zync-home > footer')];
      return sections.filter(section => !section.querySelector('.candidate-scroll-item')).map(section => section.className);
    })()`);
    if (uncovered.length) throw new Error(`Homepage sections without scroll animations: ${JSON.stringify(uncovered)}`);

    if (motion === 'no-preference' && before.hidden === 0) throw new Error('Offscreen content has no reveal animation');
    if (motion === 'reduce' && before.hidden > 0) throw new Error('Reduced motion hides content');
    const pageHeight = await evaluate('document.documentElement.scrollHeight');
    for (let y = 0; y < pageHeight; y += 500) {
      await evaluate(`window.scrollTo({top:${y},behavior:'instant'})`);
      await delay(120);
    }
    await delay(1100);
    const hidden = await evaluate("[...document.querySelectorAll('.candidate-scroll-item')].filter(el => getComputedStyle(el).opacity !== '1').map(el => el.className)");
    if (hidden.length) throw new Error(`Content remained hidden after scrolling: ${JSON.stringify(hidden)}`);
    console.log('PASS: homepage scroll reveals and accessible visibility', motion, before.count, 'targets');
  }

} finally {
  ws?.close();
  chrome.kill();
}
