import { geoPath, geoTransform } from 'd3';
import geography from '../data/pencil-geography.json';
import landCover from '../data/pencil-land-cover.json';
import { random, stroke, grain, hatch, coverTexture, mountains } from './brush';
import { pencilPalette as p } from './palette';
import { mapLabel } from './mapLabels';
import { drawPencilWater } from './drawPencilWater';
import { waterFeatures } from './waterFeatures';

const TILE_SIZE = 512;
const geographicRings = geometry => geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() :
  geometry.type === 'Polygon' || geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];

function surface(width, height, density) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * density); canvas.height = Math.ceil(height * density);
  const ctx = canvas.getContext('2d'); ctx.scale(density, density); ctx.lineJoin = 'round';
  return { canvas, ctx };
}

function pathFor(project, ctx) {
  return geoPath(geoTransform({ point(lon, lat) { const [x, y] = project([lon, lat]); this.stream.point(x, y); } }), ctx);
}

function fill(ctx, path, feature, color) {
  ctx.beginPath(); path(feature); ctx.fillStyle = color; ctx.fill('evenodd');
}

function paintTerrain(layer, project, left, top, w, h) {
  const localProject = point => { const [x, y] = project(point); return [x - left, y - top]; };
  const drawPath = pathFor(localProject, layer.ctx), c = layer.ctx;
  fill(c, drawPath, geography.land, p.paper);
  c.globalAlpha = .72; fill(c, drawPath, geography.land, p.land); c.globalAlpha = 1;
  c.save(); c.beginPath(); drawPath(geography.land); c.clip('evenodd');
  hatch(c, drawPath.bounds(geography.land), p.green, 271, 6, .55);
  for (const feature of landCover.features) {
    const { id, code } = feature.properties;
    fill(c, drawPath, feature, p[id]);
    c.save(); c.beginPath(); drawPath(feature); c.clip('evenodd');
    coverTexture(c, drawPath.bounds(feature), id, p, 21000 + code); c.restore();
  }
  // World-anchored grain is identical in overview and high-resolution crops.
  const bounds = pathFor(project).bounds(geography.land);
  c.save(); c.translate(bounds[0][0]-left,bounds[0][1]-top);
  grain(c,bounds[1][0]-bounds[0][0],bounds[1][1]-bounds[0][1],p.coast,221,.5); c.restore();
  for (const region of geography.regions) {
    if (region.properties.name === 'Fiordland') continue;
    c.save(); c.beginPath(); drawPath(region); c.clip('evenodd');
    mountains(c, drawPath, localProject, region, p); c.restore();
  }
  drawPencilWater(c, drawPath, localProject);
  c.restore();
  geographicRings(geography.land.geometry).forEach((ring, i) =>
    stroke(c, ring.map(localProject), p.coast, 1.25, 1307 + i * 29, {closed:true,passes:3,breaks:.45,amplitude:.7}));
}

// Transparent pigment: the original bathymetry, not a flat sea wash, stays visible.
let oceanTile;
function seaTexture() {
  if (oceanTile) return oceanTile;
  const { canvas, ctx } = surface(TILE_SIZE, TILE_SIZE, 3), rng = random(4801);
  for (let i = 0; i < 3100; i++) {
    const x = rng() * TILE_SIZE, y = rng() * TILE_SIZE, length = 9 + rng() * 49;
    const points = [[x,y],[x+length*.5,y-length*.09],[x+length,y-length*.18]];
    ctx.globalAlpha = .1 + rng() * .2;
    for (const dx of [0, -TILE_SIZE]) for (const dy of [0, TILE_SIZE]) {
      ctx.save(); ctx.translate(dx, dy);
      stroke(ctx, points, p.water, .5 + (i % 4) * .1, 8100 + i,
        { passes: 1, detail: 'fill', breaks: .78, gain: 1.15, amplitude: .35 });
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1; grain(ctx, TILE_SIZE, TILE_SIZE, p.water, 811, .52);
  oceanTile = canvas; return canvas;
}

export function createPencilMap(canvas, project, width, height) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d'), path = pathFor(project);
  const bounds = path.bounds(geography.land);
  const left = Math.floor(bounds[0][0]) - 20, top = Math.floor(bounds[0][1]) - 20;
  const w = Math.ceil(bounds[1][0] - left) + 20, h = Math.ceil(bounds[1][1] - top) + 20;
  const density = Math.min(dpr * 4, Math.sqrt(14000000 / (w * h)));
  const layer = surface(w, h, density);
  const buildStart = performance.now();
  paintTerrain(layer, project, left, top, w, h);
  const pattern = ctx.createPattern(seaTexture(), 'repeat');
  const origin = project([173, 0]), unit = Math.abs(project([174, 0])[0] - origin[0]) / (2600 * Math.PI / 180);
  const labels = [
    { text:'塔斯曼海', point:[165.90918,-39.07277], size:22, seed:771 },
    { text:'南太平洋', point:[178.29757,-43.66757], size:22, seed:773 },
  ].map(label => ({...label, position:project(label.point), sprite:mapLabel(label.text,label.size,label.seed,p.water)}));
  const stats = { terrainBuilds: 1, detailBuilds:0, frames: 0, buildMs: performance.now()-buildStart, pixels:layer.canvas.width*layer.canvas.height };
  canvas.dataset.lettering = 'C'; canvas.dataset.coverClasses = landCover.features.length + 1;
  canvas.dataset.waterRenderer = 'pressure-pencil';
  canvas._waterFeatures = waterFeatures.map(feature => feature.properties);
  let detail = null, timer = 0;

  const blit = (image, view) => {
    const [x,y] = view.apply([image.left,image.top]), sw = image.w*view.k, sh = image.h*view.k;
    const x0 = Math.max(0,x), y0 = Math.max(0,y), x1 = Math.min(width,x+sw), y1 = Math.min(height,y+sh);
    if(x1>x0&&y1>y0) ctx.drawImage(image.canvas,(x0-x)/sw*image.canvas.width,(y0-y)/sh*image.canvas.height,
      (x1-x0)/sw*image.canvas.width,(y1-y0)/sh*image.canvas.height,x0,y0,x1-x0,y1-y0);
  };

  const draw = view => {
    clearTimeout(timer);
    const start = performance.now();
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
    const [ox,oy] = view.apply(origin), seaScale = unit * view.k / 3;
    pattern.setTransform(new DOMMatrix([seaScale,0,0,seaScale,ox,oy]));
    ctx.fillStyle = pattern; ctx.fillRect(0,0,width,height);
    blit({...layer,left,top,w,h},view);
    if(detail&&view.k>4) blit(detail,view);
    for (const {position,sprite} of labels) {
      const [lx,ly] = view.apply(position);
      if(lx>sprite.width/2+12&&lx<width-sprite.width/2-12&&ly>80&&ly<height-80) sprite.draw(ctx,lx-sprite.advance/2,ly);
    }
    stats.frames++; stats.frameMs = performance.now()-start;
    canvas._pencilStats = {...stats}; canvas._mapView = {x:view.x,y:view.y,k:view.k};
  };
  const refine = view => {
    clearTimeout(timer);
    if(view.k<=4) return;
    const [vx,vy] = view.invert([0,0]), vw=width/view.k, vh=height/view.k;
    if(detail&&detail.zoom>=view.k&&vx>=detail.left&&vy>=detail.top&&vx+vw<=detail.left+detail.w&&vy+vh<=detail.top+detail.h) return;
    // Refine only the visible area after gestures settle; never allocate a 12x world bitmap.
    timer=setTimeout(()=>{
      const dx=Math.max(left,vx-vw*.15),dy=Math.max(top,vy-vh*.15);
      const dw=Math.min(left+w,vx+vw*1.15)-dx,dh=Math.min(top+h,vy+vh*1.15)-dy;
      if(dw<=0||dh<=0) return;
      const resolution=Math.min(dpr*view.k,Math.sqrt(10000000/(dw*dh)));
      const next=surface(dw,dh,resolution);
      paintTerrain(next,project,dx,dy,dw,dh);
      if(detail){detail.canvas.width=0;detail.canvas.height=0;}
      detail={...next,left:dx,top:dy,w:dw,h:dh,zoom:view.k};
      stats.detailBuilds++;draw(view);
    },180);
  };
  return { draw, refine, dispose() { clearTimeout(timer);layer.canvas.width=0;layer.canvas.height=0;if(detail){detail.canvas.width=0;detail.canvas.height=0;} } };
}
