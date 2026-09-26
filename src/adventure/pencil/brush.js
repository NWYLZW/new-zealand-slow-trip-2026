import { geoBounds, geoContains } from 'd3';
import { pencilStroke } from './stroke';

export function random(seed){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=Math.imul(n^n>>>15,n|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

export function stroke(ctx,points,color,width,seed,options={}){
  pencilStroke(ctx,points,color,width,seed,options.amplitude??.6,options.passes??2,options.closed??false,{variation:1,breaks:.62,grain:.78,gain:1.7,scale:1,...options});
}

export function grain(ctx,w,h,color,seed,amount){
  const rng=random(seed);ctx.save();ctx.fillStyle=color;
  for(let i=0;i<w*h*.2;i++){ctx.globalAlpha=(.02+rng()*.13)*amount;ctx.fillRect(rng()*w,rng()*h,.5+rng()*.6,.4+rng()*.7);}
  ctx.restore();
}

const clippedBounds = (bounds, viewport) => viewport ? [
  [Math.max(bounds[0][0], viewport[0][0]), Math.max(bounds[0][1], viewport[0][1])],
  [Math.min(bounds[1][0], viewport[1][0]), Math.min(bounds[1][1], viewport[1][1])],
] : bounds;

const cellSeed = (seed, column, row) => (seed ^ Math.imul(column, 73856093) ^ Math.imul(row, 19349663)) >>> 0;

export function hatch(ctx,bounds,color,seed,spacing=5,weight=.7,options={}){
  bounds=clippedBounds(bounds,options.viewport);
  const [[left,top],[right,bottom]]=bounds,rng=random(seed);let index=0;
  if(right<=left||bottom<=top)return;
  if(options.anchor){
    const [anchorX,anchorY]=options.anchor;
    const firstRow=Math.floor((top+anchorY-50)/spacing),lastRow=Math.ceil((bottom+anchorY+(right-left)*.3+50)/spacing);
    const firstColumn=Math.floor((left+anchorX-70)/54),lastColumn=Math.ceil((right+anchorX+70)/54);
    for(let row=firstRow;row<=lastRow;row++)for(let column=firstColumn;column<=lastColumn;column++){
      const local=random(cellSeed(seed,column,row));
      if(local()<.12)continue;
      const globalX=column*54+local()*18, length=15+local()*54;
      const globalY=row*spacing-(globalX*.28)+local()*spacing*.55;
      const x=globalX-anchorX,y=globalY-anchorY;
      if(x+length<left-12||x>right+12||y<top-35||y>bottom+35)continue;
      stroke(ctx,[[x,y],[x+length*.45,y-length*.14+(local()-.5)*2],[x+length,y-length*.28]],color,weight,
        cellSeed(seed+index++,column,row),{passes:1,detail:'fill',gain:1.4});
    }
    return;
  }
  for(let y=top-30;y<bottom+50+(right-left)*.28;y+=spacing*(.72+rng()*.6)){
    for(let x=left-20;x<right+20;){
      const length=14+rng()*55,dy=(x-left)*-.28;
      stroke(ctx,[[x,y+dy],[x+length*.45,y+dy-length*.14+(rng()-.5)*2],[x+length,y+dy-length*.28]],color,weight,seed+index++*23,{passes:1,detail:'fill',gain:1.4});
      x+=length+2+rng()*8;
    }
  }
}

export function coverTexture(ctx,bounds,id,p,seed,options={}){
  bounds=clippedBounds(bounds,options.viewport);
  const [[left,top],[right,bottom]]=bounds,ink=p[id+'Ink'];
  if(right<=left||bottom<=top)return;
  ctx.save();ctx.globalAlpha=.75;
  const density=options.density??1;
  hatch(ctx,bounds,ink,seed,(id==='forest'?4.7:id==='crop'?3.7:6.5)/density,id==='snow'?.3:.5,options);
  const spacing=(id==='forest'?13:id==='crop'?19:17)/Math.sqrt(density);
  const [anchorX,anchorY]=options.anchor??[0,0];
  const firstRow=Math.floor((top+anchorY)/spacing),lastRow=Math.ceil((bottom+anchorY)/spacing);
  const firstColumn=Math.floor((left+anchorX)/spacing),lastColumn=Math.ceil((right+anchorX)/spacing);
  for(let row=firstRow;row<=lastRow;row++)for(let column=firstColumn;column<=lastColumn;column++){
    const rng=random(cellSeed(seed,column,row));
    if(rng()<.3)continue;
    const x=column*spacing-anchorX,y=row*spacing-anchorY;
    const px=x+(rng()-.5)*spacing*.7,py=y+(rng()-.5)*spacing*.7,s=3+rng()*2;
    const options={passes:1,breaks:.45,amplitude:.3};
    ctx.globalAlpha=id==='snow'?.45:.72;
    if(id==='forest'){
      stroke(ctx,[[px-s,py],[px,py-s*1.8],[px+s,py]],ink,.65,seed++,options);
      stroke(ctx,[[px,py-s],[px,py+s*.5]],ink,.5,seed++,options);
    }else if(id==='crop'){
      stroke(ctx,[[px-s,py-s],[px+s*1.8,py-s*.3],[px+s*1.5,py+s]],ink,.6,seed++,options);
    }else if(id==='bare'){
      stroke(ctx,[[px-s,py+s*.3],[px,py-s*.55],[px+s*.7,py+s*.4]],ink,.65,seed++,options);
    }else if(id==='shrub'||id==='wetland'){
      stroke(ctx,[[px-s*.8,py-s*.7],[px,py+s*.3],[px+s*.6,py-s]],ink,.6,seed++,options);
      if(id==='wetland')stroke(ctx,[[px-s,py+s],[px+s,py+s]],ink,.5,seed++,options);
    }
  }
  ctx.restore();
}

export function mountains(ctx,path,projection,region,p,options={}){
  const rng=random(region.properties.id),bounds=geoBounds(region),symbols=[];
  const area=path.area(region),count=Math.min(100,Math.max(12,Math.round(area/170)));
  const target=options.count??count,minSpacing=options.minSpacing??11,size=options.size??1;
  const viewport=options.viewport;
  const attemptLimit=options.attempts??target*45;
  for(let attempts=0;attempts<attemptLimit&&symbols.length<target;attempts++){
    const point=[bounds[0][0]+rng()*(bounds[1][0]-bounds[0][0]),bounds[0][1]+rng()*(bounds[1][1]-bounds[0][1])];
    if(!geoContains(region,point))continue;
    const [x,y]=projection(point),height=5+rng()*8;
    if(viewport&&(x<viewport[0][0]-18||x>viewport[1][0]+18||y<viewport[0][1]-18||y>viewport[1][1]+18))continue;
    if(symbols.some(other=>Math.hypot(other.x-x,other.y-y)<minSpacing))continue;
    symbols.push({x,y,height:height*size,seed:attempts+777});
  }
  for(const {x,y,height,seed} of symbols.sort((a,b)=>a.y-b.y)){
    ctx.beginPath();ctx.moveTo(x-height*.7,y+height*.5);ctx.lineTo(x,y-height*.5);ctx.lineTo(x+height*.65,y+height*.5);ctx.closePath();ctx.fillStyle=p.peak;ctx.globalAlpha=.25;ctx.fill();ctx.globalAlpha=.82;
    stroke(ctx,[[x-height*.7,y+height*.5],[x,y-height*.5],[x+height*.65,y+height*.5]],p.mountain,.9,seed,{passes:2,breaks:.2});
    for(let j=0;j<4;j++)stroke(ctx,[[x+j*height*.08,y-height*.25+j*height*.17],[x+height*.35+j*height*.06,y+height*.48]],p.mountain,.55,seed+j+1,{passes:1,detail:'fill'});
  }ctx.globalAlpha=1;
}

function clipSegment(from,to,rect){
  const [left,top,right,bottom]=rect,dx=to[0]-from[0],dy=to[1]-from[1];
  let near=0,far=1;
  for(const [p,q] of [[-dx,from[0]-left],[dx,right-from[0]],[-dy,from[1]-top],[dy,bottom-from[1]]]){
    if(!p){if(q<0)return null;continue;}
    const t=q/p;
    if(p<0){if(t>far)return null;near=Math.max(near,t);}else{if(t<near)return null;far=Math.min(far,t);}
  }
  return [[from[0]+dx*near,from[1]+dy*near],[from[0]+dx*far,from[1]+dy*far]];
}

export function clipPolyline(points,viewport,padding=18){
  if(points.length<2)return [];
  const rect=[viewport[0][0]-padding,viewport[0][1]-padding,viewport[1][0]+padding,viewport[1][1]+padding];
  const chunks=[];let active=null;
  for(let index=1;index<points.length;index++){
    const segment=clipSegment(points[index-1],points[index],rect);
    if(!segment){active=null;continue;}
    if(!active||Math.hypot(active.at(-1)[0]-segment[0][0],active.at(-1)[1]-segment[0][1])>.1){
      active=[segment[0],segment[1]];chunks.push(active);
    }else active.push(segment[1]);
  }
  return chunks;
}
