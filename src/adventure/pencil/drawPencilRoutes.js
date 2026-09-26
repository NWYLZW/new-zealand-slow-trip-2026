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

function routeParts(points,transport,seed,zoom) {
  if(transport==='road') return [points];
  const rng=random(seed),parts=[];
  let remaining=transport==='flight'?8:17,writing=true,current=[points[0]];
  for(let i=1;i<points.length;i++) {
    let from=points[i-1];const to=points[i];
    let distance=Math.hypot(to[0]-from[0],to[1]-from[1])*zoom;
    while(distance>=remaining&&distance>0) {
      const t=remaining/distance,split=[from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t];
      if(writing){current.push(split);parts.push(current);} else current=[split];
      from=split;distance-=remaining;writing=!writing;
      remaining=writing?(transport==='flight'?7+rng()*4:16+rng()*8):5+rng()*4;
    }
    if(writing)current.push(to);
    remaining-=distance;
  }
  if(writing&&current.length>1)parts.push(current);
  return parts;
}

export function createPencilRoutes(canvas,entries,width,height) {
  const dpr=Math.min(devicePixelRatio||1,2),ctx=canvas.getContext('2d');
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  // Road vertices already come from the shared projection. Avoid repeatedly
  // measuring a many-thousand-segment SVG path or flattening its road bends.
  const routes=entries.map(({route,path,points})=>({route,points:points??sampleRoute(path),seed:seedFor(route.id)}));
  let selection={selected:null,selectedRoute:null},hovered=null,view=null,cache=null;
  const stats={builds:0,frames:0,frameMs:0};
  const paint = (target,transform) => {
    for(const {route,points,seed} of routes) {
      const active=route.id===hovered||route.id===selection.selectedRoute||[route.from,...route.via,route.to].includes(selection.selected);
      const parts=routeParts(points,route.transport,seed,transform.k);
      for(let i=0;i<parts.length;i++) {
        const line=parts[i].map(point=>transform.apply(point));
        const settings={variation:.86,breaks:route.transport==='road'?.34:.16,grain:.73,gain:2.1,
          scale:transform.k,step:Math.min(1.05,1.2/transform.k),taperLength:3/transform.k,
          viewportTop:-8,viewport:[target.canvas.width/dpr,target.canvas.height/dpr]};
        pencilStroke(target,line,'#fdfcf8',3.5/Math.pow(transform.k,.32),seed+i*17,.1,1,false,
          {...settings,gain:1.1,grain:.45,breaks:.1});
        pencilStroke(target,line,colors[route.transport]||colors.road,(active?2.7:2)/Math.pow(transform.k,.32),
          seed+i*17,.55/Math.sqrt(transform.k),3,false,settings);
      }
    }
  };
  const draw = (transform, { moving = false } = {}) => {
    view=transform;const start=performance.now(),margin=160;
    const ratio = cache ? view.k/cache.k : 1;
    const left = cache ? view.x - cache.x*ratio - margin*ratio : 0;
    const top = cache ? view.y - cache.y*ratio - margin*ratio : 0;
    const covered = cache && left<=0 && top<=0 && left+cache.canvas.width/dpr*ratio>=width && top+cache.canvas.height/dpr*ratio>=height;
    // Reuse a close-resolution crop during a focus tween, then paint exact
    // screen-width pencil strokes once it settles. New areas still get painted.
    if(!cache || !covered || (moving ? ratio<.8 || ratio>1.25 : cache.k!==view.k)) {
      if(cache)cache.canvas.width=0;
      const image=document.createElement('canvas');image.width=Math.ceil((width+margin*2)*dpr);image.height=Math.ceil((height+margin*2)*dpr);
      const context=image.getContext('2d');context.scale(dpr,dpr);
      paint(context,{k:view.k,apply:point=>[point[0]*view.k+view.x+margin,point[1]*view.k+view.y+margin]});
      cache={canvas:image,k:view.k,x:view.x,y:view.y};stats.builds++;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const scale = view.k/cache.k;
    ctx.drawImage(cache.canvas,view.x-(cache.x+margin)*scale,view.y-(cache.y+margin)*scale,
      cache.canvas.width/dpr*scale,cache.canvas.height/dpr*scale);
    stats.frames++;stats.frameMs=performance.now()-start;canvas._routeStats={...stats};
    canvas.dataset.renderer='pressure-pencil';canvas.dataset.routeCount=routes.length;
    canvas.dataset.selectedRoute=selection.selectedRoute||'';
    canvas.dataset.hoveredRoute=hovered||'';
    canvas._mapView={x:view.x,y:view.y,k:view.k};
    canvas._routeSamples=routes.map(({route,points})=>({id:route.id,transport:route.transport,count:points.length,first:points[0],last:points.at(-1)}));
  };
  const invalidate=()=>{if(cache)cache.canvas.width=0;cache=null;if(view)draw(view);};
  return {draw,select(next){
    if(selection.selected===next.selected&&selection.selectedRoute===next.selectedRoute)return;
    selection={selected:next.selected,selectedRoute:next.selectedRoute};invalidate();
  },hover(id){if(hovered!==id){hovered=id;invalidate();}},
    dispose(){if(cache)cache.canvas.width=0;cache=null;}};
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
