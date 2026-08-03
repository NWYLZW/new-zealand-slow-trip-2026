import { assetPath } from "./assets.js";

const queenstownImage = {
  image: assetPath("images/queenstown.webp"),
  alt: "皇后镇与瓦卡蒂普湖山景",
  altEn: "Queenstown and Lake Wakatipu",
  sourceName: "Gadfium · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Lake_Whakatipu_from_Queenstown.jpg",
  license: "Public Domain",
};

const aorakiImage = {
  image: assetPath("images/aoraki.webp"),
  alt: "普卡基湖远眺奥拉基 / 库克山",
  altEn: "Aoraki / Mount Cook viewed across Lake Pukaki",
  sourceName: "mhx · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Aoraki_over_Lake_Pukaki_(17022267508).jpg",
  license: "CC BY-SA 2.0",
};

const aucklandImage = {
  image: assetPath("images/auckland.webp"),
  alt: "奥克兰城市天际线",
  altEn: "Auckland city skyline",
  sourceName: "Entropy1963 · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Auckland_skyline.jpg",
  license: "Public Domain",
};

const aucklandAirportImage = {
  image: assetPath("images/auckland-airport.jpg"),
  alt: "奥克兰机场航站楼",
  altEn: "Auckland Airport terminal",
  sourceName: "G B_NZ · Wikimedia Commons",
  license: "CC BY-SA 2.0",
};

const hobbitonImage = {
  image: assetPath("images/hobbiton.webp"),
  alt: "霍比屯电影布景地的霍比特人小屋",
  altEn: "A Hobbit hole at the Hobbiton Movie Set",
  sourceName: "Jackie.lck · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Hobbit_holes_reflected_in_water.jpg",
  license: "CC BY 2.0",
};

const official = (label, url) => ({ kind: "official", label, url });
const mapLink = (label, url) => ({ kind: "map", label, url });
const social = (label, url) => ({ kind: "social", label, url });
const googleMaps = (query, label = "在 Google 地图查看地点") => mapLink(label, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
const googleDirections = (label, origin, destination, waypoints = [], travelmode = "driving") => {
  const waypointParam = waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}` : "";
  return mapLink(label, `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointParam}&travelmode=${travelmode}`);
};
const redbook = (query) => social("小红书搜索攻略", `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(query)}&source=web_explore_feed`);
const facebook = (query) => social("Facebook 搜索参考", `https://www.facebook.com/search/top?q=${encodeURIComponent(query)}`);

const aorakiHelicopterImage = {
  image: assetPath("images/aoraki-helicopter.jpg"),
  alt: "从直升机俯瞰奥拉基 / 库克山与冰川",
  altEn: "Aerial view of Aoraki / Mount Cook and its glaciers",
  sourceName: "David Wipf · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Aoraki_Mount_Cook_view_from_helicopter_with_Franz_Joseph_Glacier_below.jpg",
  license: "CC BY 2.0",
};

const walterPeakImage = {
  image: assetPath("images/walter-peak.jpg"),
  alt: "瓦卡蒂普湖畔的 Walter Peak",
  altEn: "Walter Peak beside Lake Wakatipu",
  sourceName: "Bernard Spragg. NZ · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Walter_Peak,_Otago;_May_2016.jpg",
  license: "CC0",
};

const wanakaImage = {
  image: assetPath("images/wanaka.jpg"),
  alt: "瓦纳卡湖与孤独的树",
  altEn: "Lake Wanaka and That Wanaka Tree",
  sourceName: "Bernard Spragg. NZ · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:%22The_Tree%22_Lake_Wanaka._NZ_(24202789152).jpg",
  license: "CC0",
};

const aorakiNightImage = {
  image: assetPath("images/aoraki-night.jpg"),
  alt: "奥拉基 / 库克山暗夜星空",
  altEn: "Night sky over Aoraki / Mount Cook",
  sourceName: "Aleks Dahlberg · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Aoraki,_King_of_the_Mountains_(Unsplash).jpg",
  license: "CC0",
};

const malaysiaAirlinesImage = {
  image: assetPath("images/malaysia-airlines.jpg"),
  alt: "马来西亚航空客机",
  altEn: "Malaysia Airlines aircraft",
  sourceName: "S5A-0043 · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:(MYS-Selangor)_Malaysia_Airlines_Airbus_A350-941_9M-MAF_@_WMKK_2025-01-30.jpg",
  license: "CC BY 4.0",
};

const glenorchyImage = {
  image: assetPath("images/glenorchy.jpg"),
  alt: "格林诺奇码头与山湖景色",
  altEn: "Glenorchy Wharf and its mountain scenery",
  sourceName: "Vishal Makwana · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Glenorchy_Wharf.jpg",
  license: "CC BY 2.0",
};

const crownRangeImage = {
  image: assetPath("images/crown-range.jpg"),
  alt: "皇冠山脉公路景色",
  altEn: "Scenery along the Crown Range Road",
  sourceName: "Donovan Govan · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Crown_Range.jpg",
  license: "CC BY-SA 3.0",
};

const tekapoImage = {
  image: assetPath("images/tekapo.jpg"),
  alt: "傍晚的蒂卡波湖",
  altEn: "Lake Tekapo in the evening",
  sourceName: "Bernard Spragg. NZ · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Evening_at_Lake_Tekapo._NZ.jpg",
  license: "CC0",
};

const christchurchImage = {
  image: assetPath("images/christchurch.jpg"),
  alt: "基督城市中心与市政厅",
  altEn: "Christchurch city centre and Town Hall",
  sourceName: "Michal Klajban · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Town_hall,_Christchurch_City,_New_Zealand.jpg",
  license: "CC BY-SA 4.0",
};

const oamaruPenguinImage = {
  image: assetPath("images/oamaru-little-blue-penguin.jpg"),
  alt: "奥马鲁附近走向海边的小蓝企鹅",
  altEn: "A little blue penguin heading toward the sea near Ōamaru",
  sourceName: "Avenue · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Little_Blue_Penguin_(Eudyptula_minor),_heading_for_the_sea.jpg",
  license: "CC BY-SA 3.0",
};

const oamaruFurSealImage = {
  image: assetPath("images/oamaru-fur-seal.jpg"),
  alt: "奥马鲁小蓝企鹅保护区附近晒太阳的新西兰海狗",
  altEn: "A New Zealand fur seal resting at the Ōamaru Blue Penguin Colony",
  sourceName: "Oren Rozen · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:NZ070315_Oamaru_Seal_01.jpg",
  license: "CC BY-SA 3.0",
};

// `image` remains the backwards-compatible fallback. Events may opt into a
// carousel by supplying the same media records in `images`.
const mediaGallery = (primary, ...alternates) => ({
  ...primary,
  images: [primary, ...alternates],
});

export const localNameTranslations = {
  "Shenzhen Bao'an International Airport (SZX)": "深圳宝安国际机场",
  "Kuala Lumpur International Airport Terminal 1 (KUL)": "吉隆坡国际机场 1 号航站楼",
  "Auckland International Airport (AKL)": "奥克兰国际机场",
  "Auckland Airport Domestic Terminal (AKL)": "奥克兰机场国内航站楼",
  "Queenstown Airport (ZQN)": "皇后镇机场",
  "Holiday Inn Queenstown Remarkables Park": "皇后镇卓越公园假日酒店",
  "Budget Car Rental Queenstown Airport": "Budget 皇后镇机场租车点",
  "Queenstown / Tāhuna": "皇后镇",
  "Queenstown Gardens": "皇后镇花园",
  "Skyline Queenstown": "Skyline 皇后镇",
  "Bob's Cove Track": "鲍勃湾步道",
  "Bennett's Bluff Lookout": "贝内特断崖观景台",
  "Glenorchy Wharf": "格林诺奇码头",
  "Steamer Wharf Queenstown": "皇后镇蒸汽船码头",
  "Walter Peak High Country Farm": "Walter Peak 高地农场",
  "Lake Wakatipu / Whakatipu Waimāori": "瓦卡蒂普湖",
  Arrowtown: "箭镇",
  "Crown Range Summit": "皇冠山脉山口",
  "Cardrona Hotel": "卡德罗纳酒店",
  Wānaka: "瓦纳卡",
  "Wanaka Luxury Apartments": "瓦纳卡豪华公寓",
  "Lake Wānaka": "瓦纳卡湖",
  "That Wānaka Tree": "瓦纳卡孤独的树",
  "Puzzling World": "迷惑世界",
  "Mount Iron Track": "铁山步道",
  "Lindis Pass Viewpoint": "林迪斯山口观景台",
  Omarama: "奥玛拉玛",
  "Lake Pukaki": "普卡基湖",
  "Aoraki / Mount Cook National Park": "奥拉基 / 库克山国家公园",
  "Mount Cook Airport": "库克山机场",
  "Aoraki / Mount Cook": "奥拉基 / 库克山",
  "Tasman Glacier / Haupapa": "塔斯曼冰川",
  "The Hermitage Hotel": "赫米蒂奇酒店",
  "Aoraki Mackenzie International Dark Sky Reserve": "奥拉基麦肯齐国际暗夜保护区",
  "Aoraki / Mount Cook Visitor Centre": "奥拉基 / 库克山游客中心",
  "Mt Cook Lodge & Motels": "库克山旅舍及汽车旅馆",
  "Lake Tekapo / Takapō": "蒂卡波湖",
  "Church of the Good Shepherd": "好牧羊人教堂",
  "Ōamaru / Te Oha-a-Maru": "奥马鲁",
  "Ōamaru Blue Penguin Colony": "奥马鲁小蓝企鹅保护区",
  "Oamaru Harbour": "奥马鲁港",
  "Kātiki Point Walking Track": "卡提基角步道",
  "New Zealand fur seal / kekeno": "新西兰海狗",
  "Christchurch / Ōtautahi": "基督城",
  "Novotel Christchurch Cathedral Square": "诺富特基督城大教堂广场酒店",
  "Rydges Latimer Christchurch": "Rydges Latimer 基督城酒店",
  "Riverside Market": "河畔市场",
  "Christchurch Botanic Gardens": "基督城植物园",
  "Christchurch Town Hall": "基督城市政厅",
  "Budget Car Rental Christchurch Airport": "Budget 基督城机场还车点",
  "Christchurch Airport (CHC)": "基督城机场",
  "Auckland / Tāmaki Makaurau": "奥克兰",
  "SkyCity Coach Terminal": "SkyCity 大巴总站",
  "Queen Street": "皇后街",
  "Commercial Bay": "Commercial Bay 商场",
  "Westfield Newmarket": "Westfield Newmarket 商场",
  "Auckland International Airport": "奥克兰国际机场",
  "The Shire's Rest": "夏尔休息站 / 霍比屯集合点",
  "Hobbiton Movie Set": "霍比屯电影布景地",
  "Malaysia Airlines Check-in": "马来西亚航空值机柜台",
};

export const eventMediaByTitle = {
  "乘机前往新西兰": {
    route: "深圳 → 吉隆坡 → 奥克兰",
    localNames: ["Shenzhen Bao'an International Airport (SZX)", "Kuala Lumpur International Airport Terminal 1 (KUL)", "Auckland International Airport (AKL)"],
    ...malaysiaAirlinesImage,
    links: [official("马来西亚航空官网", "https://www.malaysiaairlines.com/my/en/home.html"), official("奥克兰机场航班信息", "https://www.aucklandairport.co.nz/flights"), googleMaps("Shenzhen Bao'an International Airport", "深圳机场地图"), googleMaps("Kuala Lumpur International Airport Terminal 1", "吉隆坡 T1 地图"), googleMaps("Auckland International Airport", "奥克兰国际机场地图"), redbook("马航 吉隆坡转机 新西兰")],
  },
  "飞往皇后镇": {
    route: "奥克兰 → 皇后镇",
    localNames: ["Auckland Airport Domestic Terminal (AKL)", "Queenstown Airport (ZQN)", "Queenstown / Tāhuna"],
    ...mediaGallery(queenstownImage, aucklandAirportImage),
    links: [official("Jetstar 管理预订", "https://booking.jetstar.com/mmb/#/login?culture=en-nz"), official("皇后镇机场", "https://www.queenstownairport.co.nz/"), googleMaps("Auckland Airport Domestic Terminal", "奥克兰国内航站楼"), googleMaps("Queenstown Airport", "皇后镇机场地图"), redbook("奥克兰 飞 皇后镇 捷星")],
  },
  "南岛取车入住": {
    location: "皇后镇",
    localNames: ["Budget Car Rental Queenstown Airport", "Queenstown / Tāhuna"],
    ...mediaGallery(queenstownImage, walterPeakImage, crownRangeImage),
    links: [official("Budget 皇后镇机场网点", "https://www.budget.co.nz/en/locations/nz/queenstown-si/zqn"), official("管理 Budget 订单", "https://www.budget.co.nz/en/reservation/view-modify-cancel"), googleMaps("Budget Car Rental Queenstown Airport", "取车点地图"), redbook("皇后镇 住宿")],
  },
  "皇后镇适应日": {
    location: "皇后镇",
    localNames: ["Queenstown / Tāhuna", "Queenstown Gardens", "Skyline Queenstown"],
    ...mediaGallery(queenstownImage, glenorchyImage, walterPeakImage),
    links: [official("Skyline Queenstown 官方详情", "https://www.skyline.co.nz/queenstown/"), googleDirections("花园到 Skyline 步行路线", "Queenstown Gardens", "Skyline Queenstown", [], "walking"), redbook("新西兰 皇后镇 Skyline 攻略")],
  },
  "格林诺奇湖岸公路": {
    route: "皇后镇 ⇄ 格林诺奇",
    localNames: ["Queenstown / Tāhuna", "Bob's Cove Track", "Bennett's Bluff Lookout", "Glenorchy Wharf"],
    ...mediaGallery(glenorchyImage, queenstownImage),
    links: [official("Destination Queenstown · Glenorchy", "https://www.queenstownnz.co.nz/plan/surrounding-region/glenorchy/"), googleDirections("皇后镇—格林诺奇自驾路线", "Queenstown New Zealand", "Glenorchy Wharf", ["Bob's Cove Track", "Bennett's Bluff Lookout"]), redbook("新西兰 格林诺奇 自驾")],
  },
  "Walter Peak 湖上巡游": {
    route: "皇后镇 ⇄ Walter Peak",
    localNames: ["Steamer Wharf Queenstown", "Walter Peak High Country Farm", "Lake Wakatipu / Whakatipu Waimāori"],
    ...walterPeakImage,
    links: [official("RealNZ Walter Peak 购票", "https://www.realnz.com/en/experiences/tss-earnslaw-walter-peak-experiences/walter-peak-gourmet-bbq-dining/"), googleMaps("Walter Peak High Country Farm"), redbook("Walter Peak 皇后镇 攻略"), facebook("Walter Peak High Country Farm")],
  },
  "箭镇与 Crown Range": {
    route: "皇后镇 → 箭镇 → Crown Range → 瓦纳卡",
    localNames: ["Arrowtown", "Crown Range Summit", "Cardrona Hotel", "Wānaka"],
    ...mediaGallery(crownRangeImage, queenstownImage, wanakaImage),
    links: [official("Arrowtown 官方旅游信息", "https://www.arrowtown.com/"), official("新西兰道路实时状态", "https://www.journeys.nzta.govt.nz/highway-conditions"), googleDirections("皇后镇—箭镇—瓦纳卡路线", "Queenstown New Zealand", "Wanaka New Zealand", ["Arrowtown New Zealand", "Crown Range Summit", "Cardrona Hotel"]), redbook("箭镇 Crown Range 瓦纳卡 自驾")],
  },
  "抵达瓦纳卡": {
    location: "瓦纳卡",
    localNames: ["Wānaka", "Wanaka Luxury Apartments"],
    ...wanakaImage,
    links: [official("Lake Wānaka 官方旅游信息", "https://www.lakewanaka.co.nz/"), official("Wanaka Luxury Apartments 官网", "https://www.wanakaluxuryapartments.co.nz/"), googleMaps("Wanaka Luxury Apartments", "酒店地图"), redbook("瓦纳卡 住宿 公寓")],
  },
  "瓦纳卡湖边慢游": {
    location: "瓦纳卡湖畔",
    localNames: ["Lake Wānaka", "That Wānaka Tree", "Puzzling World", "Mount Iron Track"],
    ...wanakaImage,
    links: [official("Lake Wānaka 官方旅游信息", "https://www.lakewanaka.co.nz/"), official("Puzzling World 官方详情", "https://www.puzzlingworld.co.nz/"), googleMaps("That Wanaka Tree", "孤独的树地图"), googleMaps("Mount Iron Track Wanaka", "Mount Iron 地图"), redbook("瓦纳卡 湖边 攻略")],
  },
  "自驾前往库克山": {
    route: "瓦纳卡 → Lindis Pass → 普卡基湖 → 库克山",
    localNames: ["Wānaka", "Lindis Pass Viewpoint", "Omarama", "Lake Pukaki", "Aoraki / Mount Cook National Park", "Mount Cook Airport"],
    ...mediaGallery(aorakiImage, crownRangeImage, aorakiHelicopterImage),
    links: [official("库克山国家公园 DOC", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/"), googleDirections("瓦纳卡—库克山自驾路线", "Wanaka Luxury Apartments", "Mount Cook Airport", ["Lindis Pass Viewpoint", "Omarama New Zealand", "Lake Pukaki Viewpoint"]), redbook("库克山 自驾 普卡基湖 攻略")],
  },
  "冰川直升机": {
    location: "奥拉基 / 库克山",
    localNames: ["Mount Cook Airport", "Aoraki / Mount Cook", "Tasman Glacier / Haupapa"],
    ...mediaGallery(aorakiHelicopterImage, aorakiImage, aorakiNightImage),
    links: [official("Glacier Highlights 直升机预订", "https://www.mtcookskiplanes.com/flights-and-tours/glacier-highlights/"), official("天气与取消说明", "https://www.mtcookskiplanes.com/faq/"), googleMaps("Mount Cook Airport"), redbook("库克山 直升机 冰川降落")],
  },
  "库克山观星夜": {
    location: "奥拉基 / 库克山暗夜保护区",
    localNames: ["The Hermitage Hotel", "Aoraki Mackenzie International Dark Sky Reserve"],
    ...mediaGallery(aorakiNightImage, aorakiImage),
    links: [official("Big Sky Stargazing 预订", "https://www.hermitage.co.nz/experience/big-sky-stargazing/"), googleMaps("The Hermitage Hotel Mount Cook"), redbook("库克山 观星 Big Sky")],
  },
  "库克山候补安排": {
    location: "奥拉基 / 库克山",
    localNames: ["Mount Cook Airport", "Aoraki / Mount Cook Visitor Centre", "The Hermitage Hotel"],
    ...mediaGallery(aorakiImage, aorakiHelicopterImage, aorakiNightImage),
    links: [official("Glacier Highlights 直升机预订", "https://www.mtcookskiplanes.com/flights-and-tours/glacier-highlights/"), official("库克山步道与天气 DOC", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/"), googleMaps("Mount Cook Airport", "库克山机场地图"), googleMaps("Aoraki Mount Cook Visitor Centre", "游客中心地图"), redbook("库克山 天气 直升机 备选")],
  },
  "蒂卡波到奥马鲁": {
    route: "库克山 → 蒂卡波 → 奥马鲁",
    localNames: ["Mt Cook Lodge & Motels", "Lake Tekapo / Takapō", "Church of the Good Shepherd", "Ōamaru / Te Oha-a-Maru"],
    ...mediaGallery(tekapoImage, aorakiImage, oamaruPenguinImage),
    links: [official("Lake Tekapo 官方旅游信息", "https://www.mackenzienz.com/visit-lake-tekapo/"), googleDirections("库克山—蒂卡波—奥马鲁路线", "Mt Cook Lodge & Motels", "Oamaru New Zealand", ["Church of the Good Shepherd Lake Tekapo"]), redbook("蒂卡波 奥马鲁 自驾")],
  },
  "奥马鲁企鹅与海狗": {
    location: "奥马鲁港与小蓝企鹅保护区",
    localNames: ["Ōamaru / Te Oha-a-Maru", "Ōamaru Blue Penguin Colony", "Oamaru Harbour", "New Zealand fur seal / kekeno", "Kātiki Point Walking Track"],
    ...mediaGallery(oamaruPenguinImage, oamaruFurSealImage),
    links: [
      official("10月6日 General 晚场 · 20:00", "https://book.penguins.co.nz/activity/selection?filter=ProdGroup-General&date=2026-10-06"),
      official("10月6日 Premium 晚场 · 20:00", "https://book.penguins.co.nz/activity/selection?filter=ProdGroup-Premium&date=2026-10-06"),
      official("奥马鲁企鹅参观规则", "https://www.penguins.co.nz/visit/plan-your-visit/"),
      official("保护区附近的海狗与其他动物", "https://www.penguins.co.nz/about/other-local-species"),
      official("Kātiki Point · DOC", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/otago/places/moeraki-area/things-to-do/katiki-point-walking-track/"),
      official("海狗观赏安全距离 · DOC", "https://www.doc.govt.nz/nature/native-animals/marine-mammals/seals/nz-fur-seal/what-to-do/"),
      googleMaps("Oamaru Blue Penguin Colony", "企鹅保护区地图"),
      googleMaps("Katiki Point Lighthouse", "Kātiki Point 地图"),
    ],
  },
  "奥马鲁前往基督城": {
    route: "奥马鲁 → Timaru → Ashburton → 基督城市中心",
    localNames: ["Ōamaru / Te Oha-a-Maru", "Timaru", "Ashburton", "Christchurch / Ōtautahi"],
    ...mediaGallery(christchurchImage, oamaruPenguinImage, tekapoImage),
    links: [
      official("ChristchurchNZ 官方旅游信息", "https://www.christchurchnz.com/"),
      googleDirections("奥马鲁—基督城市中心路线", "Oamaru New Zealand", "Christchurch Cathedral Square", ["Timaru New Zealand", "Ashburton New Zealand"]),
    ],
  },
  "按更新订单还车": {
    route: "基督城市中心 → 基督城机场",
    localNames: ["Christchurch / Ōtautahi", "Budget Car Rental Christchurch Airport", "Christchurch Airport (CHC)"],
    ...mediaGallery(christchurchImage),
    links: [official("Budget 基督城机场网点", "https://www.budget.co.nz/en/locations/nz/christchurch-si/chc"), official("基督城机场交通", "https://www.christchurchairport.co.nz/travellers/transport/"), googleMaps("Budget Car Rental Christchurch Airport", "11:00还车点地图"), googleDirections("市中心—Budget还车点", "Christchurch Cathedral Square", "Budget Car Rental Christchurch Airport"), redbook("基督城机场 还车 攻略")],
  },
  "基督城补充半日": {
    location: "基督城市中心",
    localNames: ["Christchurch / Ōtautahi", "Christchurch Town Hall"],
    ...christchurchImage,
    links: [official("ChristchurchNZ 官方旅游信息", "https://www.christchurchnz.com/"), googleDirections("纸板教堂与市中心步行", "Christchurch New Zealand", "Riverside Market Christchurch", ["Cardboard Cathedral Christchurch", "Latimer Square Christchurch"], "walking"), redbook("基督城 纸板教堂 市中心 攻略")],
  },
  "前往机场飞奥克兰": {
    route: "基督城市中心 → 基督城机场 → 奥克兰市中心",
    localNames: ["Christchurch / Ōtautahi", "Christchurch Airport (CHC)", "Auckland Airport Domestic Terminal (AKL)", "Auckland / Tāmaki Makaurau"],
    ...mediaGallery(christchurchImage, aucklandAirportImage, aucklandImage),
    links: [official("Jetstar 管理预订", "https://booking.jetstar.com/mmb/#/login?culture=en-nz"), official("基督城机场航班信息", "https://www.christchurchairport.co.nz/travellers/flights/"), official("基督城机场交通", "https://www.christchurchairport.co.nz/travellers/transport/"), googleDirections("基督城市中心—机场", "Christchurch New Zealand", "Christchurch Airport"), googleMaps("Auckland Airport Domestic Terminal", "奥克兰国内航站楼"), redbook("基督城 飞 奥克兰 捷星")],
  },
  "大巴前往霍比屯": {
    route: "奥克兰市中心 → 霍比屯",
    localNames: ["SkyCity Coach Terminal", "The Shire's Rest", "Hobbiton Movie Set"],
    ...mediaGallery(hobbitonImage, aucklandImage),
    links: [official("GreatSights GS10H 官方预订", "https://www.greatsights.co.nz/new-zealand-tour-destinations/hobbiton-movie-set-tours/hobbiton-movie-set-from-auckland"), googleDirections("SkyCity—霍比屯大巴路线", "SkyCity Coach Terminal Auckland", "The Shire's Rest Hobbiton"), googleMaps("SkyCity Coach Terminal 102 Hobson Street Auckland", "报到点地图")],
  },
  "霍比屯游览": {
    location: "Hobbiton Movie Set",
    localNames: ["The Shire's Rest", "Hobbiton Movie Set"],
    ...hobbitonImage,
    links: [official("Hobbiton Movie Set 购票", "https://www.hobbitontours.com/experiences/hobbiton-movie-set-tour/"), googleMaps("The Shire's Rest", "集合点地图"), redbook("霍比屯 游览 攻略"), facebook("Hobbiton Movie Set")],
  },
  "大巴返回奥克兰": {
    route: "霍比屯 → 奥克兰市中心",
    localNames: ["Hobbiton Movie Set", "The Shire's Rest", "SkyCity Coach Terminal"],
    ...mediaGallery(hobbitonImage, aucklandImage),
    links: [official("GreatSights GS10H 官方预订", "https://www.greatsights.co.nz/new-zealand-tour-destinations/hobbiton-movie-set-tours/hobbiton-movie-set-from-auckland"), googleDirections("霍比屯—SkyCity大巴路线", "The Shire's Rest Hobbiton", "SkyCity Coach Terminal Auckland"), googleMaps("SkyCity Coach Terminal 102 Hobson Street Auckland", "返回点地图")],
  },
  "奥克兰轻松半日": {
    location: "奥克兰市中心",
    localNames: ["Auckland / Tāmaki Makaurau", "Britomart Transport Centre", "Commercial Bay"],
    ...aucklandImage,
    links: [official("AucklandNZ 官方旅游信息", "https://www.aucklandnz.com/"), official("Commercial Bay", "https://www.commercialbay.co.nz/"), googleDirections("奥克兰市中心轻松步行", "Britomart Transport Centre", "Commercial Bay Auckland", [], "walking")],
  },
  "前往奥克兰机场": {
    route: "奥克兰市中心 → 奥克兰机场",
    localNames: ["Auckland / Tāmaki Makaurau", "Auckland International Airport"],
    ...mediaGallery(aucklandAirportImage, aucklandImage),
    links: [official("奥克兰机场", "https://www.aucklandairport.co.nz/"), official("SkyDrive 机场巴士", "https://www.skydrive.co.nz/"), googleDirections("奥克兰市中心酒店—机场路线", "Hotel Grand Chancellor Auckland", "Auckland Airport International Terminal", [], "transit")],
  },
  "办理返程值机": {
    location: "奥克兰国际机场",
    localNames: ["Auckland International Airport (AKL)", "Malaysia Airlines Check-in"],
    ...malaysiaAirlinesImage,
    links: [official("马来西亚航空官网", "https://www.malaysiaairlines.com/my/en/home.html"), official("奥克兰机场航班信息", "https://www.aucklandairport.co.nz/flights"), googleMaps("Auckland International Airport", "国际航站楼地图"), redbook("奥克兰机场 国际出发 值机")],
  },
  "返程回深圳": {
    route: "奥克兰 → 吉隆坡 → 深圳",
    localNames: ["Auckland International Airport (AKL)", "Kuala Lumpur International Airport Terminal 1 (KUL)", "Shenzhen Bao'an International Airport (SZX)"],
    ...malaysiaAirlinesImage,
    links: [official("马来西亚航空官网", "https://www.malaysiaairlines.com/my/en/home.html"), official("吉隆坡国际机场", "https://airports.malaysiaairports.com.my/en/klia1"), googleMaps("Auckland International Airport", "奥克兰国际机场地图"), googleMaps("Kuala Lumpur International Airport Terminal 1", "吉隆坡 T1 地图"), googleMaps("Shenzhen Bao'an International Airport", "深圳机场地图"), redbook("吉隆坡机场 长时间转机 马航")],
  },
};
