import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html';
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1323, height: 956 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const screenshot = async name => { if (output) await page.screenshot({path:`${output}/${name}.png`}); };
const waitForMap = () => page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.frames > 0);
const view = () => page.locator('.trip-pencil-map').evaluate(c => ({...c._mapView, stats:c._pencilStats}));
const close = (a,b) => assert(Math.abs(a-b)<.02, `${a} != ${b}`);

try {
  assert.equal((await page.goto(base)).status(),200); await waitForMap(); await page.waitForTimeout(800);
  assert.equal(await page.locator('.trip-attribution').count(),0,'Persistent attribution was not removed');
  assert.equal(await page.locator('.trip-stop').count(),8);
  assert.equal(await page.locator('.trip-bathymetry-band').count(),4);
  assert.deepEqual(await page.locator('.trip-bathymetry-band').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.minDepthM))),[200,1000,2000,4000]);
  const fills = await page.locator('.trip-bathymetry-band').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fill));
  assert.equal(new Set(fills).size,4,'Depth bands lost their distinct colors');
  assert.equal(await page.locator('.trip-pencil-map').getAttribute('data-lettering'),'C');
  assert.equal(await page.locator('.trip-pencil-map').getAttribute('data-cover-classes'),'8');
  assert.equal(await page.locator('.trip-stop-label canvas').count(),8);
  assert.equal(await page.locator('.trip-stop-marker[data-renderer="pressure-pencil"]').count(),16);
  const markerInk = await page.locator('.trip-stop-marker').evaluateAll(nodes => nodes.map(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    const pigment=[];
    for(let i=0;i<pixels.length;i+=4) if(pixels[i]>pixels[i+1]*1.2 && pixels[i+3]>10) pigment.push(pixels[i+3]);
    return {ink:pigment.length,levels:new Set(pigment).size};
  }));
  assert(markerInk.every(marker=>marker.ink>30&&marker.levels>20),'Marker pencil pigment is blank or uniform');
  const home=page.getByRole('button',{name:'返回行程总览',exact:true});
  assert.equal(await home.locator('.trip-tool-label').count(),0,'Return caption remains in the DOM');
  assert.equal(await home.locator('svg').count(),0,'Old uniform return icon remains');
  assert.equal(await home.locator('canvas[data-renderer="pressure-pencil"]').count(),1);
  const iconInk=await home.locator('.trip-pencil-icon').evaluate(canvas=>{
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    const alpha=[];for(let i=3;i<pixels.length;i+=4)if(pixels[i]>10)alpha.push(pixels[i]);
    return {ink:alpha.length,levels:new Set(alpha).size};
  });
  assert(iconInk.ink>50&&iconInk.levels>20,'Return icon is blank or uniform');
  assert(!(await home.locator('.trip-tool-tooltip').isVisible()));
  await home.hover();assert(await home.locator('.trip-tool-tooltip').isVisible());
  if(output)await home.screenshot({path:`${output}/pencil-return-icon.png`});
  await page.mouse.move(150,200);assert(!(await home.locator('.trip-tool-tooltip').isVisible()));
  await home.focus();assert(await home.locator('.trip-tool-tooltip').isVisible());
  await home.evaluate(button=>button.blur());
  const routeCanvas=page.locator('.trip-pencil-routes');
  assert.equal(await routeCanvas.getAttribute('data-renderer'),'pressure-pencil');
  assert.equal(await page.locator('.trip-route,.trip-route-underlay,.trip-route-ink,.trip-sketch--route').count(),0,
    'Old route drawing is still present');
  const routeChecks=await page.evaluate(async()=>{
    const {adventureRoutes}=await import('./src/adventure/adventureRoutes.js');
    const {createPencilRoutes}=await import('./src/adventure/pencil/drawPencilRoutes.js');
    const area=document.querySelector('.trip-map-area'),canvas=document.querySelector('.trip-pencil-routes');
    const endpointErrors=canvas._routeSamples.map(sample=>{
      const route=adventureRoutes.find(route=>route.id===sample.id);
      const first=area._project(route.roadGeometry?.coordinates[0]??[...route.points[0]].reverse());
      const last=area._project(route.roadGeometry?.coordinates.at(-1)??[...route.points.at(-1)].reverse());
      return Math.max(Math.hypot(first[0]-sample.first[0],first[1]-sample.first[1]),
        Math.hypot(last[0]-sample.last[0],last[1]-sample.last[1]));
    });
    const textures=['road','flight','coach'].map(transport=>{
      const target=document.createElement('canvas');
      const renderer=createPencilRoutes(target,[{route:{id:`test-${transport}`,transport,from:'a',to:'b',via:[]},
        path:'M20,65L460,65'}],480,130);
      const transform={x:0,y:0,k:1};renderer.draw(transform);
      const original=target.toDataURL(),dpr=target.width/480;
      const pixels=target.getContext('2d').getImageData(0,0,target.width,target.height).data;
      const pigment=[];
      for(let x=30;x<450;x++){
        let maximum=0;
        for(let y=61;y<=69;y++){
          const i=(Math.round(y*dpr)*target.width+Math.round(x*dpr))*4;
          const chroma=Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2]);
          maximum=Math.max(maximum,chroma/255*pixels[i+3]/255);
        }
        pigment.push(maximum);
      }
      renderer.hover('hover-test');renderer.hover(null);
      const stable=target.toDataURL()===original;
      renderer.dispose();
      return{transport,stable,levels:new Set(pigment.map(value=>Math.round(value*255))).size,
        low:Math.min(...pigment),high:Math.max(...pigment),gaps:pigment.filter(value=>value<.03).length};
    });
    return{endpointErrors,textures,count:canvas._routeSamples.length};
  });
  assert.equal(routeChecks.count,7);
  assert.equal(routeChecks.count,await page.locator('.trip-route-hit').count());
  assert(routeChecks.endpointErrors.every(error=>error<.02),'Pencil route endpoints moved away from stops');
  for(const texture of routeChecks.textures){
    assert(texture.stable,'Pencil texture changes without geometry changes');
    // The warm paper reserve has a small chroma of its own, even in a pen lift.
    assert(texture.levels>20&&texture.high>.12&&texture.low<.03,`Pencil route is too uniform or too faint: ${JSON.stringify(texture)}`);
    assert(texture.gaps>0,'Pencil lifts/dashes did not render');
  }
  const ink = await page.locator('.trip-pencil-map').evaluate(c=>{
    const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let pigment=0,land=0;for(let i=0;i<pixels.length;i+=32){if(pixels[i+3]>5)pigment++;if(pixels[i+3]>250)land++;}
    return{pigment,land};
  });
  assert(ink.pigment>10000&&ink.land>1000,'Pencil map did not render');
  const initial=await view();
  const routeInitial=await routeCanvas.evaluate(c=>c._routeStats);
  const beforeLabel=await page.locator('.trip-stop[data-tag="CHC"]').boundingBox();
  await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(252,437,{steps:8});await page.mouse.up();
  const moved=await view();close(moved.x-initial.x,52);close(moved.y-initial.y,37);
  const afterLabel=await page.locator('.trip-stop[data-tag="CHC"]').boundingBox();
  close(afterLabel.x-beforeLabel.x,52);close(afterLabel.y-beforeLabel.y,37);
  assert.equal(moved.stats.terrainBuilds,initial.stats.terrainBuilds);
  const routeMoved=await routeCanvas.evaluate(c=>({view:c._mapView,stats:c._routeStats}));
  close(routeMoved.view.x,moved.x);close(routeMoved.view.y,moved.y);close(routeMoved.view.k,moved.k);
  assert.equal(routeMoved.stats.builds,routeInitial.builds,'Small pans rebuilt route pigment');
  assert.equal(await page.locator('.trip-world').getAttribute('transform'),await page.locator('.trip-depth-world').getAttribute('transform'));
  assert.equal(await page.locator('.trip-water-map,.trip-hydro-shape,.trip-sketch,.trip-terrain-decorations,.trip-landmarks,.trip-decorations').count(),0,
    'A retired map layer is still rendered');
  assert.equal(await page.locator('.trip-pencil-map').getAttribute('data-water-renderer'),'pressure-pencil');
  assert.equal(await page.locator('.trip-water-label').count(),8);
  await page.getByRole('button',{name:'复位地图',exact:true}).click();await page.waitForTimeout(100);
  const reset=await view();close(reset.x,initial.x);close(reset.y,initial.y);close(reset.k,initial.k);
  await screenshot('pencil-desktop');

  const assertCentered = async tag => {
    await page.waitForFunction(()=>document.querySelector('.trip-map-area')?.dataset.focusing!=='true');
    close((await view()).k,10);
    const center=await page.locator(`.trip-stop[data-tag="${tag}"]`).evaluate(button=>{
      const dot=button.getBoundingClientRect(),area=button.closest('.trip-map-area').getBoundingClientRect();
      return{dx:dot.x+dot.width/2-area.x-area.width/2,dy:dot.y+dot.height/2-area.y-area.height/2};
    });
    close(center.dx,0);close(center.dy,0);
  };
  const queenstown=page.locator('.trip-stop[data-tag="ZQN"]');
  await queenstown.click();await page.waitForURL('**/*place=ZQN');await assertCentered('ZQN');
  assert.equal(await queenstown.locator('.trip-stop-marker--selected').evaluate(c=>getComputedStyle(c).opacity),'1');
  await page.waitForTimeout(1000);await screenshot('pencil-queenstown-selected');
  if(output)await queenstown.locator('.trip-stop-dot').screenshot({path:`${output}/pencil-stop-selected.png`});
  await page.getByRole('button',{name:'缩小地图',exact:true}).click();
  await queenstown.click();await assertCentered('ZQN');
  await page.reload();await waitForMap();await assertCentered('ZQN');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'复位地图',exact:true}).click();

  await page.locator('.trip-stop[data-tag="CHC"]').click();
  await assertCentered('CHC');
  await page.waitForURL('**/*place=CHC');assert.match(await page.locator('.trip-panel').textContent(),/基督城/);
  await page.reload();await waitForMap();assert.match(await page.locator('.trip-panel').textContent(),/基督城/);
  await page.getByRole('button',{name:'关闭面板'}).click();assert(!new URL(page.url()).searchParams.has('place'));
  await page.goBack();assert.equal(new URL(page.url()).searchParams.get('place'),'CHC');
  await page.getByRole('button',{name:'关闭面板'}).click();
  const route=page.locator('.trip-route-hit').first(),id=await route.getAttribute('data-route');
  await route.focus();await page.keyboard.press('Enter');await page.waitForURL(`**/*route=${id}`);
  assert(await page.locator('.trip-panel').isVisible());
  assert.equal(await route.getAttribute('aria-pressed'),'true');
  assert.equal(await routeCanvas.getAttribute('data-selected-route'),id);
  await page.reload();await waitForMap();assert.equal(new URL(page.url()).searchParams.get('route'),id);
  assert(await page.locator('.trip-panel').isVisible());await page.keyboard.press('Escape');
  assert(!new URL(page.url()).searchParams.has('route'));
  await page.getByRole('button',{name:'背包',exact:true}).click();
  await page.locator('.trip-map-sources summary').click();
  assert.equal(await page.locator('.trip-map-sources a').count(),6);
  assert.match(await page.locator('.trip-map-sources').textContent(),/CC BY 4.0/);
  await page.keyboard.press('Escape');

  // The original supported zoom range is retained; settled high zoom refines only a crop.
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'放大地图',exact:true}).click();
  await page.waitForTimeout(1800);const high=await view();assert(high.k>8&&high.k<=12);
  assert(high.stats.detailBuilds>0,'High zoom never obtained a sharper crop');
  await screenshot('pencil-high-zoom');
  await page.getByRole('button',{name:'复位地图',exact:true}).click();
  for(let i=0;i<6;i++)await page.getByRole('button',{name:'缩小地图',exact:true}).click();
  await page.waitForTimeout(100);close((await view()).k,.55);await screenshot('pencil-depth-overview');

  for(const [width,height] of [[436,900],[844,390],[768,900]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(1000);
    await page.getByRole('button',{name:'复位地图',exact:true}).click();await page.waitForTimeout(100);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
    const boxes=await page.locator('.trip-stop-label').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).visibility!=='hidden').map(n=>{
      const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    }));
    for(let i=0;i<boxes.length;i++){
      const a=boxes[i];assert(a.left>=0&&a.right<=width&&a.top>=0&&a.bottom<=height);
      for(let j=i+1;j<boxes.length;j++){const b=boxes[j];assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Stop label overlap');}
    }
    await screenshot(`pencil-${width}`);
    if(width===436){
      assert.equal(await page.locator('.trip-short-route-art').count(),1);
      const tap=page.locator('.trip-short-route-tap'),bounds=await tap.boundingBox();
      close(bounds.width,44);close(bounds.height,44);
      await tap.click();await page.waitForURL('**/*route=zqn-wanaka');await page.keyboard.press('Escape');
      await queenstown.click();await page.waitForURL('**/*place=ZQN');await assertCentered('ZQN');
      const homeBounds=await home.boundingBox();assert(homeBounds.width>=44&&homeBounds.height>=44);
      await page.waitForTimeout(800);await screenshot('pencil-queenstown-mobile');
      await page.keyboard.press('Escape');
      await screenshot('pencil-queenstown-mobile-map');
      await page.getByRole('button',{name:'复位地图',exact:true}).click();
    }
  }
  assert.deepEqual(errors,[]);
  await home.focus();await page.keyboard.press('Enter');
  await page.waitForURL(new URL('./',base).href);
  console.log(JSON.stringify({depthBands:fills,pencilInk:ink,routeChecks,routePanFrameMs:routeMoved.stats.frameMs,
    markerInk,iconInk,placeZoom:10,returnKeyboard:true,panAndProjection:true,reset:true,placeDeepLink:true,routeKeyboard:true,history:true,attributionRelocated:true,highZoom:high.stats,responsive:true,errors}));
} finally { await browser.close(); }
