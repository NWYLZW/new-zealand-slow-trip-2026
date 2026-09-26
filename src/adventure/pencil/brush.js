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

export function hatch(ctx,bounds,color,seed,spacing=5,weight=.7){
  const [[left,top],[right,bottom]]=bounds,rng=random(seed);let index=0;
  for(let y=top-30;y<bottom+50+(right-left)*.28;y+=spacing*(.72+rng()*.6)){
    for(let x=left-20;x<right+20;){
      const length=14+rng()*55,dy=(x-left)*-.28;
      stroke(ctx,[[x,y+dy],[x+length*.45,y+dy-length*.14+(rng()-.5)*2],[x+length,y+dy-length*.28]],color,weight,seed+index++*23,{passes:1,detail:'fill',gain:1.4});
      x+=length+2+rng()*8;
    }
  }
}

export function coverTexture(ctx,bounds,id,p,seed){
  const [[left,top],[right,bottom]]=bounds,rng=random(seed),ink=p[id+'Ink'];
  ctx.save();ctx.globalAlpha=.75;
  hatch(ctx,bounds,ink,seed,id==='forest'?4.7:id==='crop'?3.7:6.5,id==='snow'?.3:.5);
  const spacing=id==='forest'?13:id==='crop'?19:17;
  for(let y=top+4;y<bottom;y+=spacing)for(let x=left+4;x<right;x+=spacing){
    if(rng()<.3)continue;
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

export function mountains(ctx,path,projection,region,p){
  const rng=random(region.properties.id),bounds=geoBounds(region),symbols=[];
  const area=path.area(region),count=Math.min(100,Math.max(12,Math.round(area/170)));
  for(let attempts=0;attempts<count*35&&symbols.length<count;attempts++){
    const point=[bounds[0][0]+rng()*(bounds[1][0]-bounds[0][0]),bounds[0][1]+rng()*(bounds[1][1]-bounds[0][1])];
    if(!geoContains(region,point))continue;
    const [x,y]=projection(point),height=5+rng()*8;
    if(symbols.some(other=>Math.hypot(other.x-x,other.y-y)<11))continue;
    symbols.push({x,y,height,seed:attempts+777});
  }
  for(const {x,y,height,seed} of symbols.sort((a,b)=>a.y-b.y)){
    ctx.beginPath();ctx.moveTo(x-height*.7,y+height*.5);ctx.lineTo(x,y-height*.5);ctx.lineTo(x+height*.65,y+height*.5);ctx.closePath();ctx.fillStyle=p.peak;ctx.globalAlpha=.25;ctx.fill();ctx.globalAlpha=.82;
    stroke(ctx,[[x-height*.7,y+height*.5],[x,y-height*.5],[x+height*.65,y+height*.5]],p.mountain,.9,seed,{passes:2,breaks:.2});
    for(let j=0;j<4;j++)stroke(ctx,[[x+j*height*.08,y-height*.25+j*height*.17],[x+height*.35+j*height*.06,y+height*.48]],p.mountain,.55,seed+j+1,{passes:1,detail:'fill'});
  }ctx.globalAlpha=1;
}
