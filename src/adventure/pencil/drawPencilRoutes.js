import { pencilStroke } from './stroke';
import { random } from './brush';
import { mapLabel } from './mapLabels';

const colors = { road:'#914b3f', flight:'#366e91', coach:'#657c3c' };
const seedFor = id => [...id].reduce((n,letter)=>Math.imul(n^letter.charCodeAt(0),16777619),2166136261)>>>0;

export function sampleRoute(path) {
  const node = document.createElementNS('http://www.w3.org/2000/svg','path');
  node.setAttribute('d',path);
  const length=node.getTotalLength(),count=Math.max(1,Math.ceil(length/.8));
  return Array.from({length:count+1},(_,i)=>{const p=node.getPointAtLength(length*i/count);return[p.x,p.y];});
}

function clipSegment(from,to,rect){
  const dx=to[0]-from[0],dy=to[1]-from[1];let near=0,far=1;
  for(const [direction,distance] of [[-dx,from[0]-rect.left],[dx,rect.right-from[0]],
    [-dy,from[1]-rect.top],[dy,rect.bottom-from[1]]]){
    if(!direction){if(distance<0)return null;continue;}
    const ratio=distance/direction;
    if(direction<0)near=Math.max(near,ratio);else far=Math.min(far,ratio);
    if(near>far)return null;
  }
  return {from:[from[0]+dx*near,from[1]+dy*near],to:[from[0]+dx*far,from[1]+dy*far],near,far};
}

export function clipRouteParts(points,viewport,padding=36){
  if(points.length<2)return[];
  const rect={left:viewport[0][0]-padding,top:viewport[0][1]-padding,
    right:viewport[1][0]+padding,bottom:viewport[1][1]+padding};
  const parts=[];let active=null,traveled=0;
  for(let index=1;index<points.length;index++){
    const from=points[index-1],to=points[index],length=Math.hypot(to[0]-from[0],to[1]-from[1]);
    const segment=clipSegment(from,to,rect);
    if(!segment){active=null;traveled+=length;continue;}
    const startDistance=traveled+length*segment.near;
    if(!active||Math.hypot(active.points.at(-1)[0]-segment.from[0],active.points.at(-1)[1]-segment.from[1])>.01){
      active={points:[segment.from,segment.to],startDistance};parts.push(active);
    }else active.points.push(segment.to);
    traveled+=length;
  }
  return parts;
}

export function routeParts(points,transport,seed,startDistance=0) {
  if(transport==='road') return [{points,dashIndex:0}];
  const rng=random(seed),parts=[];
  const dash=transport==='flight'?7+rng()*4:16+rng()*8,gap=5+rng()*4,cycle=dash+gap;
  const offset=rng()*cycle,absolute=Math.max(0,startDistance)+offset;
  let dashIndex=Math.floor(absolute/cycle),phase=absolute-dashIndex*cycle;
  let writing=phase<dash,remaining=(writing?dash:cycle)-phase,current=writing?[points[0]]:null;
  for(let i=1;i<points.length;i++) {
    let from=points[i-1];const to=points[i];
    let distance=Math.hypot(to[0]-from[0],to[1]-from[1]);
    while(distance>=remaining&&distance>0) {
      const consumed=remaining,t=consumed/distance;
      const split=[from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t];
      if(writing){current.push(split);parts.push({points:current,dashIndex});current=null;}
      from=split;distance-=consumed;writing=!writing;
      if(writing){dashIndex++;current=[split];remaining=dash;}else remaining=gap;
    }
    if(writing)current.push(to);
    remaining-=distance;
  }
  if(writing&&current?.length>1)parts.push({points:current,dashIndex});
  return parts;
}

function normalizedVisibleRect(rect,width,height){
  const left=Math.max(0,rect?.left??0),top=Math.max(0,rect?.top??0);
  const right=Math.max(left+1,Math.min(width,rect?.right??left+(rect?.width??width)));
  const bottom=Math.max(top+1,Math.min(height,rect?.bottom??top+(rect?.height??height)));
  return {left,top,right,bottom,width:right-left,height:bottom-top};
}

function routePathData(parts){
  return parts.map(({points})=>points.length<2?'':`M${points.map(point=>`${point[0]},${point[1]}`).join('L')}`).join('');
}

function pointBounds(points){
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const [x,y] of points){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  return {left,top,right,bottom};
}

function boundsIntersectViewport(bounds,viewport,padding=0){
  return bounds.left<viewport[1][0]+padding&&bounds.right>viewport[0][0]-padding
    &&bounds.top<viewport[1][1]+padding&&bounds.bottom>viewport[0][1]-padding;
}

export function createPencilRoutes(canvas, entries, width, height) {
  const dpr = Math.min(devicePixelRatio || 1, 2), ctx = canvas.getContext('2d');
  const margin = 160, tileSize = 256;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const routes = entries.map(({ route, path, points, hitPath }) => {
    const sampled=points??sampleRoute(path);
    return {route,hitPath,points:sampled,bounds:pointBounds(sampled),seed:seedFor(route.id)};
  });
  canvas._routeSamples = routes.map(({ route, points }) => ({ id: route.id, transport: route.transport,
    count: points.length, first: points[0], last: points.at(-1) }));
  let selection = { selected: null, selectedRoute: null }, hovered = null, view = null;
  let visibleRect = normalizedVisibleRect(null,width,height);
  let cache = null, building = null, timer = 0, revision = 0, moving = false, disposed = false;
  const stats = { builds: 0, frames: 0, frameMs: 0, workMs: 0 };
  const release = image => { if (image) { image.canvas.width = 0; image.canvas.height = 0; } };
  const cancelBuild = () => {
    clearTimeout(timer); timer = 0;
    release(building); building = null;
  };
  const imagePosition = (image,transform) => {
    const ratio=transform.k/image.k;
    return {ratio,x:transform.x+(image.left-margin-image.x)*ratio,
      y:transform.y+(image.top-margin-image.y)*ratio};
  };
  const covered = (image, transform, rect) => {
    if (!image) return false;
    const {ratio,x,y}=imagePosition(image,transform);
    return x<=rect.left&&y<=rect.top&&x+image.canvas.width/dpr*ratio>=rect.right
      &&y+image.canvas.height/dpr*ratio>=rect.bottom;
  };
  const syncRouteHits = () => {
    if(!view)return;
    const worldViewport=[view.invert([visibleRect.left,visibleRect.top]),view.invert([visibleRect.right,visibleRect.bottom])];
    const padding=36/view.k;
    let hitVisibleRoutes=0;
    for(const route of routes){
      if(!route.hitPath)continue;
      if(!boundsIntersectViewport(route.bounds,worldViewport,padding)){route.hitPath.setAttribute('d','');continue;}
      const parts=clipRouteParts(route.points,worldViewport,padding);
      if(parts.length)hitVisibleRoutes++;
      route.hitPath.setAttribute('d',routePathData(parts));
    }
    stats.hitVisibleRoutes=hitVisibleRoutes;
  };
  const composite = () => {
    if (!view || disposed) return;
    const start = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const blit = (image, rect) => {
      const {ratio:scale,x,y}=imagePosition(image,view);
      if (rect) {
        ctx.clearRect(x + rect.x * scale, y + rect.y * scale, rect.w * scale, rect.h * scale);
        ctx.drawImage(image.canvas, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr,
          x + rect.x * scale, y + rect.y * scale, rect.w * scale, rect.h * scale);
      } else ctx.drawImage(image.canvas, x, y, image.canvas.width / dpr * scale, image.canvas.height / dpr * scale);
    };
    if (cache) blit(cache);
    if (building) building.completed.forEach(rect => blit(building, rect));
    stats.frames++; stats.frameMs = performance.now() - start;
    canvas._routeStats = { ...stats, ...(building?.counts??cache?.counts), pending: Boolean(building),
      completedTiles: building?.completed.length ?? 0 };
    canvas.dataset.renderer = 'pressure-pencil'; canvas.dataset.routeCount = routes.length;
    canvas.dataset.selectedRoute = selection.selectedRoute || ''; canvas.dataset.hoveredRoute = hovered || '';
    canvas._mapView = { x: view.x, y: view.y, k: view.k };
  };
  function* paintTiles(image) {
    const context = image.canvas.getContext('2d');
    context.scale(dpr, dpr);
    const w = image.canvas.width / dpr, h = image.canvas.height / dpr, tiles = [];
    const worldViewport=[[(image.left-margin-image.x)/image.k,(image.top-margin-image.y)/image.k],
      [(image.left+w-margin-image.x)/image.k,(image.top+h-margin-image.y)/image.k]];
    const projected = routes.map(entry => {
      image.counts.sourcePoints+=entry.points.length;
      if(!boundsIntersectViewport(entry.bounds,worldViewport)){
        image.counts.offscreenRoutes++;return {...entry,screen:[]};
      }
      const screen=entry.points.map(point=>[point[0]*image.k+image.x-image.left+margin,
        point[1]*image.k+image.y-image.top+margin]);
      const clipped=clipRouteParts(screen,[[0,0],[w,h]],0);
      image.counts.projectedPoints+=screen.length;image.counts.visibleRouteParts+=clipped.length;
      if(!clipped.length)image.counts.offscreenRoutes++;
      return {...entry,screen:clipped};
    });
    for (let y = 0; y < h; y += tileSize) for (let x = 0; x < w; x += tileSize) {
      tiles.push({ x, y, w: Math.min(tileSize, w - x), h: Math.min(tileSize, h - y) });
    }
    tiles.sort((a, b) => Math.hypot(a.x + a.w / 2 - w / 2, a.y + a.h / 2 - h / 2)
      - Math.hypot(b.x + b.w / 2 - w / 2, b.y + b.h / 2 - h / 2));
    for (const tile of tiles) {
      context.save(); context.beginPath(); context.rect(tile.x, tile.y, tile.w, tile.h); context.clip();
      for (const { route, screen, seed } of projected) {
        const active = route.id === hovered || route.id === selection.selectedRoute
          || [route.from, ...route.via, route.to].includes(selection.selected);
        for(const visiblePart of screen){
          const chunks=clipRouteParts(visiblePart.points,[[tile.x,tile.y],[tile.x+tile.w,tile.y+tile.h]],12);
          for (const chunk of chunks) {
            const parts = routeParts(chunk.points, route.transport, seed,
              visiblePart.startDistance+chunk.startDistance);
            image.counts.dashParts+=parts.length;
            for (const part of parts) {
            const settings = { variation: .86, breaks: route.transport === 'road' ? .34 : .16,
              grain: .73, gain: 2.1, scale: image.k, step: Math.min(1.05, 1.2 / image.k), taperLength: 3 / image.k,
              viewportTop: -8, viewport: [w, h] };
            const strokeSeed=seed+part.dashIndex*17;
            pencilStroke(context, part.points, '#fdfcf8', 3.5 / Math.pow(image.k, .32), strokeSeed, .1, 1, false,
              { ...settings, gain: 1.1, grain: .45, breaks: .1 });
            pencilStroke(context, part.points, colors[route.transport] || colors.road,
              (active ? 2.7 : 2) / Math.pow(image.k, .32), strokeSeed, .55 / Math.sqrt(image.k), 3, false, settings);
            image.counts.strokeCalls+=2;
            yield;
          }
        }
        }
        yield;
      }
      context.restore(); image.completed.push(tile);
      yield;
    }
  }
  const startBuild = () => {
    if (!view || disposed || building) return;
    const image = document.createElement('canvas');
    image.width = Math.ceil((visibleRect.width + margin * 2) * dpr);
    image.height = Math.ceil((visibleRect.height + margin * 2) * dpr);
    const job = { canvas: image, k: view.k, x: view.x, y: view.y, left:visibleRect.left,top:visibleRect.top,
      revision, completed: [],counts:{sourcePoints:0,projectedPoints:0,visibleRouteParts:0,
        offscreenRoutes:0,dashParts:0,strokeCalls:0} };
    building = job;
    const iterator = paintTiles(job);
    const step = () => {
      timer = 0;
      if (disposed || building !== job) return;
      const start = performance.now();
      let result;
      do { result = iterator.next(); } while (!result.done && performance.now() - start < 5);
      stats.workMs = performance.now() - start;
      if (result.done) {
        release(cache); cache = job; building = null; stats.builds++;
      }
      composite();
      if (!result.done) timer = setTimeout(step, 0);
    };
    timer = setTimeout(step, 0);
  };
  const draw = (transform, options = {}) => {
    view = transform; moving = Boolean(options.moving);
    if(options.visibleRect)visibleRect=normalizedVisibleRect(options.visibleRect,width,height);
    syncRouteHits();
    if (building && (building.k !== view.k || building.revision!==revision || !covered(building, view,visibleRect))) cancelBuild();
    composite();
    // Gestures only composite existing pixels. Fine strokes arrive tile by tile after settling.
    if (!moving && (!cache || cache.k !== view.k || cache.revision !== revision || !covered(cache, view,visibleRect))) startBuild();
  };
  const invalidate = () => { revision++; cancelBuild(); if (view) draw(view, { moving, visibleRect }); };
  return {
    draw,
    select(next) {
      if (selection.selected === next.selected && selection.selectedRoute === next.selectedRoute) return;
      selection = { selected: next.selected, selectedRoute: next.selectedRoute }; invalidate();
    },
    hover(id) { if (hovered !== id) { hovered = id; invalidate(); } },
    dispose() { disposed = true; cancelBuild(); release(cache); cache = null; },
  };
}

export function routeBadge(date,normal) {
  const canvas=document.createElement('canvas');canvas.width=224;canvas.height=224;
  const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.translate(56,56);
  const center=normal.map(value=>value*35),seed=seedFor(date);
  const ring=Array.from({length:65},(_,i)=>{
    const angle=i*Math.PI/32;return[center[0]+Math.cos(angle)*16,center[1]+Math.sin(angle)*16];
  });
  ctx.fillStyle='#fdfcf8';ctx.beginPath();ctx.arc(...center,16,0,Math.PI*2);ctx.fill();
  pencilStroke(ctx,[[0,0],normal.map(value=>value*19)],colors.road,1,seed,.3,2,false,
    {variation:.86,breaks:.2,grain:.6,gain:2});
  pencilStroke(ctx,ring,colors.road,1,seed+1,.3,2,true,
    {variation:.86,breaks:.24,grain:.6,gain:2});
  const label=mapLabel(date,12,seed,colors.road);
  ctx.drawImage(label.canvas,center[0]-label.width/2,center[1]-label.height/2,label.width,label.height);
  return canvas.toDataURL();
}
