import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html';
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1323, height: 956 }, deviceScaleFactor: 2, hasTouch: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const ready = () => page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.frames > 0);
const idle = () => page.waitForFunction(() => document.querySelector('.trip-map-area').dataset.focusing !== 'true');
const reset = async () => {
  if (await page.locator('.trip-panel').count()) await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '复位地图', exact: true }).click();
  await idle(); await page.waitForTimeout(250);
};
const screenshot = async name => { if (output) await page.screenshot({ path: `${output}/${name}.png` }); };
const view = () => page.locator('.trip-map-area').evaluate(area => ({ x: area.__zoom.x, y: area.__zoom.y, k: area.__zoom.k }));
const centered = async tag => {
  await idle();
  const result = await page.locator(`.trip-stop[data-tag="${tag}"]`).evaluate(button => {
    const dot = button.getBoundingClientRect(), area = button.closest('.trip-map-area'), box = area.getBoundingClientRect();
    return { k: area.__zoom.k, error: Math.hypot(dot.x + dot.width/2 - box.x - box.width/2, dot.y + dot.height/2 - box.y - box.height/2) };
  });
  assert.equal(result.k, 10); assert(result.error < .02);
};

try {
  assert.equal((await page.goto(base)).status(), 200); await ready(); await page.waitForTimeout(800);
  assert.equal(await page.locator('.trip-tool').count(), 7);
  assert.equal(await page.locator('.trip-tool-label,.trip-tool svg').count(), 0);
  const icons = await page.locator('.trip-tool').evaluateAll(buttons => buttons.map(button => {
    const canvas = button.querySelector('canvas'), rgba = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    const levels = new Set(); let ink = 0;
    for(let i=3;i<rgba.length;i+=4) if(rgba[i]>10){ ink++; levels.add(rgba[i]); }
    const bounds = button.getBoundingClientRect();
    return { label: button.ariaLabel, renderer: canvas.dataset.renderer, width: bounds.width, height: bounds.height, ink, levels: levels.size };
  }));
  for(const icon of icons){
    assert.equal(icon.renderer, 'pressure-pencil'); assert(icon.width>=44 && icon.height>=44);
    assert(icon.ink>100 && icon.levels>35, `${icon.label}: blank or uniform icon`);
    const button = page.getByRole('button', {name: icon.label, exact:true});
    await button.hover();assert(await button.locator('.trip-tool-tooltip').isVisible());
    const bounds = await button.locator('.trip-tool-tooltip').boundingBox();
    assert(bounds.x>=0 && bounds.x+bounds.width<=1323 && bounds.y>=0 && bounds.y+bounds.height<=956);
    await button.focus();assert(await button.locator('.trip-tool-tooltip').isVisible());
    await button.evaluate(node=>node.blur());await page.mouse.move(200,120);
    assert(!(await button.locator('.trip-tool-tooltip').isVisible()));
  }
  if(output){
    await page.locator('.trip-game-tools').screenshot({path:`${output}/controls-tools.png`});
    await page.locator('.trip-map-controls').screenshot({path:`${output}/controls-zoom.png`});
  }
  for(const [label,id] of [['任务','tasks'],['背包','bag'],['相册','photos']]){
    const button = page.getByRole('button',{name:label,exact:true});
    const before = await button.locator('.trip-pencil-icon').evaluate(canvas=>canvas.toDataURL());
    await button.focus();await page.keyboard.press('Enter');await page.waitForURL(`**/*panel=${id}`);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await button.locator('.trip-pencil-icon').getAttribute('data-active'),'true');
    assert.notEqual(await button.locator('.trip-pencil-icon').evaluate(canvas=>canvas.toDataURL()),before);
    assert.equal(await page.getByRole('button',{name:'关闭面板'}).locator('canvas').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await button.locator('.trip-pencil-icon').getAttribute('data-active'),'false');
  }

  // Sample actual D3 frames, not just the final transform or a fixed timeout.
  const trace = await page.evaluate(() => new Promise(resolve => {
    const area=document.querySelector('.trip-map-area'), canvas=document.querySelector('.trip-pencil-routes');
    const terrain=document.querySelector('.trip-pencil-map'), started=performance.now();
    const initial={...canvas._routeStats}, terrainBuilds=terrain._pencilStats.terrainBuilds, detailBuilds=terrain._pencilStats.detailBuilds;
    const frames=[];
    document.querySelector('.trip-stop[data-tag="ZQN"]').click();
    function sample(){
      const v=area.__zoom, r=canvas._mapView, t=terrain._mapView;
      frames.push({ms:performance.now()-started,k:v.k,x:v.x,y:v.y,routeBuilds:canvas._routeStats.builds,
        aligned:Math.abs(r.k-v.k)<.00001 && Math.abs(t.k-v.k)<.00001 && r.x===t.x && r.y===t.y &&
          document.querySelector('.trip-world').getAttribute('transform')===document.querySelector('.trip-depth-world').getAttribute('transform')});
      if(performance.now()-started>2500 || (frames.length>2 && area.dataset.focusing!=='true')) {
        resolve({frames,builds:canvas._routeStats.builds-initial.builds,terrainBuilds:terrain._pencilStats.terrainBuilds-terrainBuilds,
          detailBuilds:terrain._pencilStats.detailBuilds-detailBuilds});
      }else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert(trace.frames.length>=10,'Focus teleported instead of animating');
  assert(trace.frames.some(frame=>frame.k>2.5&&frame.k<9));
  assert(trace.frames.every(frame=>frame.aligned),'Map layers diverged during focus');
  assert(trace.frames.at(-1).ms>=650&&trace.frames.at(-1).ms<2500);
  assert.equal(trace.frames.at(-1).k,10);assert.equal(trace.terrainBuilds,0);assert.equal(trace.detailBuilds,0);
  assert(trace.builds<trace.frames.length/2,'Routes rebuilt for every animation frame');
  await centered('ZQN');await page.waitForTimeout(1000);await screenshot('controls-focus-10x');
  await page.getByRole('button',{name:'下一站'}).click();await centered('WKA');
  await page.reload();await ready();await centered('WKA');

  // New destinations replace in-flight focus; manual gestures and reset win.
  await reset();await page.locator('.trip-stop[data-tag="ZQN"]').click();
  await page.waitForFunction(()=>document.querySelector('.trip-map-area').dataset.focusing==='true');
  await page.getByRole('button',{name:'下一站'}).click();await page.getByRole('button',{name:'下一站'}).click();
  await centered('AOR');assert.equal(new URL(page.url()).searchParams.get('place'),'AOR');
  await reset();await page.locator('.trip-stop[data-tag="ZQN"]').click();
  await page.waitForTimeout(170);await page.mouse.move(180,270);await page.mouse.wheel(0,180);
  await idle();const interrupted=await view();await page.waitForTimeout(1000);
  assert.deepEqual(await view(),interrupted,'Focus snapped back after wheel input');assert(interrupted.k<10);
  await reset();await page.locator('.trip-stop[data-tag="ZQN"]').click();await page.waitForTimeout(100);
  await page.getByRole('button',{name:'复位地图',exact:true}).click();await page.waitForTimeout(1000);
  assert.equal((await view()).k,2.16);

  await page.emulateMedia({reducedMotion:'reduce'});await reset();
  await page.locator('.trip-stop[data-tag="ZQN"]').click();await centered('ZQN');
  assert.notEqual(await page.locator('.trip-map-area').getAttribute('data-focusing'),'true');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:436,height:900});await reset();await page.waitForTimeout(700);
  await page.locator('.trip-stop[data-tag="ZQN"]').tap();await centered('ZQN');await page.keyboard.press('Escape');
  await page.waitForTimeout(900);await page.mouse.move(200,120);await screenshot('controls-mobile-10x');
  for(const label of ['任务','背包','相册']){
    await page.getByRole('button',{name:label,exact:true}).tap();assert(await page.locator('.trip-panel').isVisible());
    await page.getByRole('button',{name:'关闭面板'}).tap();
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({icons,focus:{frames:trace.frames.length,durationMs:trace.frames.at(-1).ms,
    maxFrameGapMs:Math.max(...trace.frames.slice(1).map((frame,i)=>frame.ms-trace.frames[i].ms)),routeBuilds:trace.builds,
    zoom:trace.frames.at(-1).k},layersAligned:true,interruptible:true,reducedMotion:true,mobile:true,errors}));
} finally { await browser.close(); }
