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

const rotoruaImage = {
  image: assetPath("images/rotorua.webp"),
  alt: "罗托鲁瓦波胡图间歇泉",
  altEn: "Pohutu Geyser in Rotorua",
  sourceName: "Marks6651 · Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Pohutu_geyser.jpg",
  license: "CC BY 4.0",
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
  "Ramada by Wyndham Queenstown Central": "皇后镇华美达中央酒店",
  "Omega Rental Cars Queenstown Airport": "Omega 皇后镇机场租车点",
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
  "Lake Tekapo / Takapō": "蒂卡波湖",
  "Church of the Good Shepherd": "好牧羊人教堂",
  "Christchurch / Ōtautahi": "基督城",
  "Rydges Latimer Christchurch": "Rydges Latimer 基督城酒店",
  "Riverside Market": "河畔市场",
  "Christchurch Botanic Gardens": "基督城植物园",
  "Christchurch Town Hall": "基督城市政厅",
  "Omega Rental Cars Christchurch Airport": "Omega 基督城机场还车点",
  "Christchurch Airport (CHC)": "基督城机场",
  "Auckland / Tāmaki Makaurau": "奥克兰",
  "Queen Street": "皇后街",
  "Commercial Bay": "Commercial Bay 商场",
  "Westfield Newmarket": "Westfield Newmarket 商场",
  "Auckland International Airport": "奥克兰国际机场",
  "The Shire's Rest": "夏尔休息站 / 霍比屯集合点",
  "Hobbiton Movie Set": "霍比屯电影布景地",
  Rotorua: "罗托鲁瓦",
  "Redwoods Whakarewarewa Forest": "红杉森林",
  "JetPark Hotel Rotorua": "JetPark 罗托鲁瓦酒店",
  "Te Puia": "蒂普亚地热文化中心",
  "Pōhutu Geyser": "波胡图间歇泉",
  "New Zealand Māori Arts and Crafts Institute": "新西兰毛利艺术与工艺学院",
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
    localNames: ["Auckland Airport Domestic Terminal (AKL)", "Queenstown Airport (ZQN)", "Ramada by Wyndham Queenstown Central"],
    ...mediaGallery(queenstownImage, aucklandAirportImage),
    links: [official("新西兰航空管理预订", "https://flightbookings.airnewzealand.co.nz/vmanage/actions/managebookingstart"), official("皇后镇机场", "https://www.queenstownairport.co.nz/"), googleMaps("Auckland Airport Domestic Terminal", "奥克兰国内航站楼"), googleMaps("Queenstown Airport", "皇后镇机场地图"), redbook("奥克兰 转机 皇后镇 新西兰航空")],
  },
  "南岛取车入住": {
    location: "皇后镇",
    localNames: ["Omega Rental Cars Queenstown Airport", "Ramada by Wyndham Queenstown Central", "Queenstown / Tāhuna"],
    ...mediaGallery(queenstownImage, walterPeakImage, crownRangeImage),
    links: [official("Omega 皇后镇机场取车", "https://www.omegarentalcars.com/queenstown-airport-car-rental/"), official("Ramada Queenstown Central 官网", "https://www.wyndhamhotels.com/ramada/queenstown-new-zealand/ramada-queenstown-central/overview"), googleMaps("Omega Rental Cars Queenstown Airport", "取车点地图"), googleMaps("Ramada by Wyndham Queenstown Central", "酒店地图"), redbook("皇后镇 镇中心 住宿")],
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
  "蒂卡波到基督城": {
    route: "库克山 → 蒂卡波 → 基督城",
    localNames: ["Aoraki / Mount Cook", "Lake Tekapo / Takapō", "Church of the Good Shepherd", "Christchurch / Ōtautahi", "Rydges Latimer Christchurch"],
    ...mediaGallery(tekapoImage, aorakiImage, christchurchImage),
    links: [official("Lake Tekapo 官方旅游信息", "https://www.mackenzienz.com/visit-lake-tekapo/"), googleDirections("库克山—蒂卡波—基督城路线", "The Hermitage Hotel Mount Cook", "Rydges Latimer Christchurch", ["Church of the Good Shepherd Lake Tekapo"]), redbook("蒂卡波 基督城 自驾")],
  },
  "基督城城市半日": {
    location: "基督城市中心",
    localNames: ["Christchurch / Ōtautahi", "Riverside Market", "Christchurch Botanic Gardens", "Christchurch Town Hall"],
    ...christchurchImage,
    links: [official("ChristchurchNZ 官方旅游信息", "https://www.christchurchnz.com/"), official("基督城植物园官方信息", "https://ccc.govt.nz/parks-and-gardens/christchurch-botanic-gardens"), googleDirections("市中心半日步行路线", "Riverside Market Christchurch", "Christchurch Botanic Gardens", ["Christchurch Town Hall"], "walking"), redbook("基督城 半日游 攻略")],
  },
  "还车飞奥克兰": {
    route: "基督城 → 奥克兰",
    localNames: ["Omega Rental Cars Christchurch Airport", "Christchurch Airport (CHC)", "Auckland Airport Domestic Terminal (AKL)"],
    ...christchurchImage,
    links: [official("Jetstar 管理预订", "https://booking.jetstar.com/mmb/#/login?culture=en-nz"), official("基督城机场", "https://www.christchurchairport.co.nz/"), official("Omega 基督城机场还车", "https://www.omegarentalcars.com/car-rental-christchurch-airport/"), googleMaps("Christchurch Airport", "基督城机场地图"), googleMaps("Auckland Airport Domestic Terminal", "奥克兰国内航站楼"), redbook("基督城机场 还车 飞奥克兰")],
  },
  "奥克兰购物日": {
    location: "奥克兰 CBD 与 Newmarket",
    localNames: ["Auckland / Tāmaki Makaurau", "Queen Street", "Commercial Bay", "Westfield Newmarket", "Auckland International Airport"],
    ...mediaGallery(aucklandImage, aucklandAirportImage),
    links: [official("Westfield Newmarket", "https://www.westfield.co.nz/newmarket"), official("Commercial Bay", "https://www.commercialbay.co.nz/"), official("SkyDrive 机场巴士", "https://www.skydrive.co.nz/"), googleDirections("机场—CBD—Newmarket 路线", "Auckland International Airport", "Auckland International Airport", ["Queen Street Auckland", "Commercial Bay Auckland", "Westfield Newmarket"]), redbook("奥克兰 购物 Newmarket 攻略")],
  },
  "取车前往霍比屯": {
    route: "奥克兰机场 → 霍比屯",
    localNames: ["Auckland International Airport", "The Shire's Rest", "Hobbiton Movie Set"],
    ...mediaGallery(hobbitonImage, aucklandAirportImage),
    links: [official("Hobbiton Movie Set 购票", "https://www.hobbitontours.com/experiences/hobbiton-movie-set-tour/"), googleDirections("奥克兰机场—霍比屯路线", "Auckland International Airport", "The Shire's Rest Hobbiton"), redbook("霍比屯 自驾 攻略")],
  },
  "霍比屯游览": {
    location: "Hobbiton Movie Set",
    localNames: ["The Shire's Rest", "Hobbiton Movie Set"],
    ...hobbitonImage,
    links: [official("Hobbiton Movie Set 购票", "https://www.hobbitontours.com/experiences/hobbiton-movie-set-tour/"), googleMaps("The Shire's Rest", "集合点地图"), redbook("霍比屯 游览 攻略"), facebook("Hobbiton Movie Set")],
  },
  "前往罗托鲁瓦": {
    route: "霍比屯 → 罗托鲁瓦",
    localNames: ["Hobbiton Movie Set", "Rotorua", "Redwoods Whakarewarewa Forest", "JetPark Hotel Rotorua"],
    ...mediaGallery(rotoruaImage, hobbitonImage),
    links: [official("RotoruaNZ 官方旅游信息", "https://www.rotoruanz.com/"), official("Redwoods Whakarewarewa Forest", "https://redwoods.co.nz/"), googleDirections("霍比屯—罗托鲁瓦路线", "The Shire's Rest Hobbiton", "JetPark Hotel Rotorua", ["Redwoods Whakarewarewa Forest"]), redbook("罗托鲁瓦 攻略")],
  },
  "Te Puia 地热文化": {
    location: "Te Puia · 罗托鲁瓦",
    localNames: ["Te Puia", "Pōhutu Geyser", "New Zealand Māori Arts and Crafts Institute", "Rotorua"],
    ...rotoruaImage,
    links: [official("Te Puia 日间体验购票", "https://ecommerce.tepuia.com/te-ra-guided-experience"), googleMaps("Te Puia Rotorua"), redbook("Te Puia 罗托鲁瓦 攻略"), facebook("Te Puia Rotorua")],
  },
  "返回奥克兰机场": {
    route: "罗托鲁瓦 → 奥克兰机场",
    localNames: ["JetPark Hotel Rotorua", "Auckland International Airport"],
    ...mediaGallery(aucklandAirportImage, rotoruaImage, aucklandImage),
    links: [official("奥克兰机场", "https://www.aucklandairport.co.nz/"), googleDirections("罗托鲁瓦—奥克兰机场路线", "JetPark Hotel Rotorua", "Auckland International Airport"), redbook("罗托鲁瓦 奥克兰机场 自驾 还车")],
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
