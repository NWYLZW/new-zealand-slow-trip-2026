const attractionNames = {
  "奥克兰国际航站楼": "Auckland International Terminal",
  "奥克兰国内航站楼": "Auckland Domestic Terminal",
  "Britomart 交通中心": "Britomart Transport Centre",
  "Steamer Wharf · Walter Peak 码头": "Steamer Wharf · Walter Peak departure",
  "Glenorchy 公路起点": "Start of the Glenorchy–Queenstown Road",
  "Wānaka 湖滨与镇中心": "Wānaka lakefront and town centre",
  "Roy's Peak 停车场": "Roys Peak Track car park",
  "库克山机场": "Mount Cook Airport",
  "Wānaka 湖滨": "Wānaka lakefront",
  "Wānaka 湖滨与 Pembroke Park": "Wānaka lakefront and Pembroke Park",
  "The Hermitage 主楼 · 餐厅 / Big Sky": "The Hermitage main building · restaurants / Big Sky",
  "Mount Cook Airport · 直升机集合": "Mount Cook Airport · helicopter meeting point",
  "Hooker Valley Track 停车场": "Hooker Valley Track car park",
  "Hooker Valley Track 起点": "Hooker Valley Track trailhead",
  ...Object.fromEntries([
    "Ambury Regional Park", "Butterfly Creek", "Mānawa Bay", "Commercial Bay",
    "Queen Street", "Newmarket", "Queenstown Gardens", "Queenstown Airport",
    "Skyline Queenstown", "That Wānaka Tree", "Big Sky Stargazing",
    "Lake Pukaki Viewpoint", "Lake Tekapo Village", "Christchurch Botanic Gardens",
    "Riverside Market", "New Regent Street", "Hagley Park / Botanic Gardens",
    "Christchurch Airport",
  ].map((name) => [name, name])),
};

const exactText = {
  "区域内": "Within the area",
  "道路绕行": "Road access is indirect",
  "镇中心步行范围": "Within walking range of the town centre",
  "步行可达": "Walkable",
  "准确时间待预订地址确认": "Confirm the exact time once the booking address is available",
  "Yellow Bus 或驾车": "Yellow Bus or drive",
  "白天接驳或驾车": "Daytime shuttle or drive",
  "酒店接驳或驾车": "Hotel shuttle or drive",
  "酒店接驳或驾车约 6—8 分钟": "About 6–8 minutes by hotel shuttle or car",
  "驾车前往；实际路线待地图复核": "Drive; recheck the exact route on the live map",
  "驾车或接驳；实际时长待出发前复核": "Drive or take a shuttle; recheck the live journey time before departure",
  "航站楼巴士或步行约 10—15 分钟": "About 10–15 minutes by terminal bus or on foot",
  "酒店 24 小时接驳约 5—10 分钟": "About 5–10 minutes by the hotel's 24-hour shuttle",
  "免费接驳约 10—15 分钟（候车时间另计）": "About 10–15 minutes by free shuttle, excluding wait time",
  "免费接机；送机最多 2 人 NZD 10": "Free airport pickup; drop-off costs NZD 10 for up to two guests",
  "步行约 15 分钟或乘机场巴士": "About 15 minutes on foot or by airport bus",
  "平路步行约 16 分钟；驾车约 3 分钟": "About 16 minutes on a level walk or 3 minutes by car",
  "步行约 15 分钟或驾车约 5 分钟": "About 15 minutes on foot or 5 minutes by car",
  "驾车约 7 分钟或步行约 25 分钟": "About 7 minutes by car or 25 minutes on foot",
  "步行约 20 分钟或驾车约 6 分钟": "About 20 minutes on foot or 6 minutes by car",
};

function metricEn(value) {
  if (!value) return value;
  if (exactText[value]) return exactText[value];
  return value
    .replace(/^直线约 /, "About ")
    .replace(/^约 /, "About ")
    .replace(/公里/g, "km")
    .replace(/米/g, "m")
    .replace(/—/g, "–")
    + (value.startsWith("直线约 ") ? " straight-line" : "");
}

function travelTimeEn(value) {
  if (!value) return value;
  if (exactText[value]) return exactText[value];
  const numeric = "([0-9.]+(?:—[0-9.]+)?)";
  const unit = (amount, unitName) => `${amount.replace("—", "–")} ${unitName}${amount === "1" ? "" : "s"}`;
  let match;
  if ((match = value.match(new RegExp(`^步行约 ${numeric} 分钟$`)))) return `About ${unit(match[1], "minute")} on foot`;
  if ((match = value.match(new RegExp(`^沿湖步行约 ${numeric} 分钟$`)))) return `About ${unit(match[1], "minute")} along the lakefront on foot`;
  if ((match = value.match(new RegExp(`^驾车约 ${numeric} 分钟$`)))) return `About ${unit(match[1], "minute")} by car`;
  if ((match = value.match(new RegExp(`^公交或打车约 ${numeric} 分钟$`)))) return `About ${unit(match[1], "minute")} by bus or taxi`;
  if ((match = value.match(new RegExp(`^驾车约 ${numeric} 小时$`)))) return `About ${unit(match[1], "hour")} by car`;
  if ((match = value.match(new RegExp(`^驾车约 ([0-9.]+) 小时 ${numeric} 分钟$`)))) return `About ${unit(match[1], "hour")} ${unit(match[2], "minute")} by car`;
  if ((match = value.match(new RegExp(`^沿湖步行约 ${numeric} 分钟；驾车约 ${numeric} 分钟$`)))) return `About ${unit(match[1], "minute")} along the lakefront on foot or ${unit(match[2], "minute")} by car`;
  return value;
}

const roomNames = {
  "高级特大号床间": "Superior King Room",
  "行政特大号床间": "Executive King Room",
  "高级套房": "Superior Suite",
  "行政特大号床套房": "Executive King Suite",
  "豪华特大号床间": "Deluxe King Room",
  "行政套房": "Executive Suite",
  "一室公寓 · King 请求项": "Studio · king configuration by request",
  "尊贵一室公寓": "Premier Studio",
  "市景超级特大号床间 · 含免费早餐": "City View Super King Room · free breakfast",
  "标准大号床间 · 含免费早餐": "Standard Queen Room · free breakfast",
  "标准特大号床间 · 含免费早餐": "Standard King Room · free breakfast",
  "湖景特大床房（Booking 保证 King）": "Lake View King Room (king confirmed by Booking.com)",
  "行政湖景特大床房（Booking 保证 King）": "Executive Lake View King Room (king confirmed by Booking.com)",
  "一卧室湖景公寓": "One-bedroom Lake View Apartment",
  "行政一卧室湖景公寓": "Executive One-bedroom Lake View Apartment",
  "山景特大号床间": "Mountain View King Room",
  "标准特大号床间 · 山景阳台": "Standard King Room · mountain-view balcony",
  "California King 山景套房": "Mountain View California King Suite",
  "一卧室山景特大床套房": "One-bedroom Mountain View King Suite",
  "一卧室整套民居": "Entire one-bedroom home",
  "农场整套单间公寓": "Entire farm studio apartment",
  "一室公寓 · 大床": "Studio · large bed",
  "山景阳台标准特大床房": "Standard King Room with mountain-view balcony",
  "湖景阳台特大床房": "Lake View King Room with balcony",
  "一卧室公寓": "One-bedroom Apartment",
  "特大床单间公寓（两平台同房型）": "King Studio Apartment (matched across two platforms)",
  "一卧室公寓（两平台同房型）": "One-bedroom Apartment (matched across two platforms)",
  "整套私人单间公寓": "Entire private studio apartment",
  "独立阁楼公寓": "Private loft apartment",
  "豪华间": "Deluxe Room",
  "双人间 · 私人浴室": "Double Room · private bathroom",
  "山景特大号床间（平台床型标 Queen）": "Mountain View King Room (platform lists a queen bed)",
  "一卧室小屋": "One-bedroom Cottage",
  "一卧室小屋 · 另一独立单元": "One-bedroom Cottage · separate second unit",
  "Station Huts Queen · Queen 牧羊人小屋": "Station Huts Queen · queen shepherd's hut",
  "Ben Ohau Vista · Whare Tironui 整栋度假屋": "Ben Ohau Vista · entire Whare Tironui holiday home",
  "整套独立客房": "Entire private guest suite",
  "整栋三卧室民居": "Entire three-bedroom home",
  "Pukaki Air Lodge 高级独立客房": "Pukaki Air Lodge Superior private room",
  "整套两卧室乡村客房": "Entire two-bedroom rural guest suite",
  "尊贵特大号床间": "Premium King Room",
  "尊贵套房": "Premium Suite",
  "一室公寓 · 双人床选项": "Studio · double-bed option",
  "一卧室整套民居 · 1 张 Queen 床": "Entire one-bedroom home · one queen bed, as shown in the checked listing",
  "镇中心一卧室整套公寓": "Entire central Queenstown one-bedroom apartment",
  "Lake Hayes 农场整套单间公寓": "Entire farm studio in the Lake Hayes area",
  "一室公寓 · 27 m²": "27 m² studio room",
  "整栋三卧室民居 · 2 张 King 床 + 双层床": "Whole three-bedroom home with two king beds and bunk beds",
  "经典特大号床": "Classic King Room",
  "典雅超级特大号床间": "Classic Super King Room",
  "经典小型套房": "Classic Junior Suite",
  "Hotel Room · 床型由酒店分配": "Hotel Room · bed assigned by the hotel",
};

const bedText = {
  "1 张超大双人床": "one king bed",
  "1 张超大号双人床": "one king bed",
  "1 张特大床": "one king bed",
  "1 张 King 床": "one king bed",
  "1 张大号双人床": "one queen bed",
  "1 张 Queen 床": "one queen bed",
  "1 张 Double 床": "one double bed",
  "1 张双人床": "one double bed",
  "2 张 Queen 床；本次 2 人使用": "two queen beds; only two guests on this stay",
  "1 张 King 特大床（官网房型页明确标注）": "one king bed, explicitly listed on the official room page",
  "1 张 Queen 大号双人床（官网明确标注）": "one queen bed, explicitly listed on the official website",
  "1 张 Queen 床方向；精确床型在最终房价页确认": "queen-bed configuration; confirm the exact bed on the final rate page",
  "1 张大床（结算页确认床型）": "one large bed; confirm the exact type at checkout",
  "1 张床（民宿不按床型筛选）": "one bed; this homestay was not filtered by bed type",
  "1 张 Queen 床（民宿不按床型筛选）": "one queen bed; this homestay was not filtered by bed type",
  "2 张床（民宿不按床型筛选）": "two beds; this homestay was not filtered by bed type",
  "特大床及其他床位（民宿不按床型筛选）": "a king bed plus other beds; this homestay was not filtered by bed type",
  "1 张超大号双人床 + 1 张沙发床": "one king bed plus one sofa bed",
  "1 张大号双人床 + 1 张沙发床": "one queen bed plus one sofa bed",
  "2 张 King 床 + 2 组双层床（民宿不限制床位数）": "two king beds plus two bunk-bed sets; bed count was not used to filter this homestay",
  "2 张约 1.8 米宽双人床（民宿不限制床位数）": "two approximately 1.8 m-wide double beds; bed count was not used to filter this homestay",
  "2 张床（民宿不限制床型或床位数）": "two beds; bed type and count were not used to filter this homestay",
  "1 张 King 床；具体房号和装饰由酒店分配": "one king bed; the hotel assigns the exact room and décor",
  "1 间卧室；具体床型在精确日期搜索时确认": "one bedroom; confirm the exact bed in the live date search",
  "King 或 Super King；具体房间预订时确认": "king or super king; confirm the exact room when booking",
  "1 张双人床（选择床型，需视供应情况）": "one double bed, subject to availability",
  "1 张超大号双人床或 2 张单人床（选择床型，需视供应情况）": "one king bed or two single beds, subject to availability",
  "该类别可选 1 张 King；下单时须确认 King 配置": "this category offers a king option; confirm that configuration before payment",
  "官网仅说明共有 14 间 Studio；具体床型须下单前确认": "the official site only states that there are 14 studios; confirm the exact bed before booking",
  "Booking 明确 1 张超大号双人床；官网对应类别可能为 Super King 或 Twin": "Booking.com specifies one king bed; the matching official category may be super king or twin",
  "官网称 4 间卧室，但只列 1 张 California King + 2 张 Queen；Agoda 称 3 卧，需确认第四房配置": "the official site says four bedrooms but lists one California king and two queens; Agoda says three bedrooms, so confirm the fourth-room setup",
  "1 张特大床或 2 张单人床（不保证）": "one king bed or two single beds; neither configuration is guaranteed",
};

const facilityText = {
  "浴缸": "Bathtub", "空调": "Air conditioning", "私人浴室": "Private bathroom",
  "独立浴室": "En-suite bathroom", "独立卫浴": "En-suite bathroom", "隔音": "Soundproofing",
  "私人浴室 · 淋浴": "Private bathroom with shower", "独立单间": "Self-contained studio",
  "平板电视": "Flat-screen TV", "免费 Wi-Fi": "Free Wi-Fi", "Wi-Fi": "Wi-Fi",
  "步入式淋浴": "Walk-in shower", "咖啡机": "Coffee machine", "迷你吧": "Minibar",
  "私人套房": "Private suite", "景观": "View", "私人小厨房": "Private kitchenette",
  "小厨房": "Kitchenette", "私人厨房": "Private kitchen", "完整厨房": "Full kitchen",
  "洗碗机": "Dishwasher", "遮光帘": "Blackout curtains", "私人阳台": "Private balcony",
  "阳台": "Balcony", "山景阳台": "Mountain-view balcony", "山景": "Mountain view",
  "湖景": "Lake view", "海景": "Sea view", "城市景": "City view", "庭院景": "Courtyard view",
  "港湾景观": "Harbour view", "山谷景观": "Valley view", "山景与乡村农场景观": "Mountain and rural farm views",
  "城市侧景观": "City-side view",
  "休息区": "Sitting area", "起居区": "Living area", "起居空间": "Living space",
  "客厅": "Living room", "客厅与沙发": "Living room with sofa", "客厅与用餐区": "Living and dining area",
  "独立起居区": "Separate living area", "独立卧室": "Separate bedroom", "独立套房": "Separate suite",
  "工作台": "Work desk", "书桌": "Desk", "用餐区": "Dining area", "餐桌": "Dining table",
  "洗衣机": "Washing machine", "烘干机": "Dryer", "洗衣/烘干": "Washer and dryer",
  "洗衣机/烘干机": "Washer and dryer", "洗衣设施": "Laundry facilities", "室内洗衣机": "In-unit washing machine",
  "Spa 浴缸": "Spa bath", "私人热水浴缸": "Private hot tub", "热水浴池": "Hot tub",
  "淋浴": "Shower", "雨淋花洒": "Rain shower", "浴缸上方淋浴": "Shower over bath",
  "冰箱": "Refrigerator", "小冰箱": "Mini-fridge", "迷你冰箱": "Mini-fridge",
  "微波炉": "Microwave", "电炉": "Cooktop", "烤面包机": "Toaster", "厨房设施": "Kitchen facilities",
  "茶 / 咖啡设施": "Tea and coffee facilities", "Nespresso 咖啡机": "Nespresso machine",
  "电视": "TV", "智能电视": "Smart TV", "50 英寸电视": "50-inch TV", "Chromecast": "Chromecast",
  "庭院": "Patio", "露台": "Terrace", "露台或阳台": "Terrace or balcony", "花园": "Garden",
  "壁炉": "Fireplace", "烧烤设施": "Barbecue facilities", "自助入住": "Self check-in",
  "密码盒自助入住": "Lockbox self check-in", "自助早餐": "Self-service breakfast", "含早餐": "Breakfast included",
  "免费停车": "Free parking", "可申请机场接机": "Airport pickup available on request",
  "完整共用厨房": "Full shared kitchen", "共用独立厨房": "Separate shared kitchen",
  "独立厨房": "Separate kitchen",
  "免费 Wi-Fi（信号有限）": "Free Wi-Fi with limited signal", "有限免费 Wi-Fi": "Limited free Wi-Fi",
  "客用洗衣房（限时）": "Guest laundry with limited hours", "中央空调": "Central air conditioning",
  "无线网络": "Wi-Fi", "Mount Cook 山景": "Mount Cook view", "户外通往浴室": "Outdoor access to the bathroom",
  "整租木屋": "Entire cabin", "热泵供暖": "Heat-pump heating", "艺术中心景观": "Arts Centre view",
  "设计师家具": "Designer furnishings", "自然采光": "Natural light", "日间床": "Daybed",
  "高层": "High floor", "两张 Queen 床": "Two queen beds", "King 床": "King bed",
  "暖气": "Heating",
  "2 间浴室": "Two bathrooms", "80 Mbps Wi-Fi": "80 Mbps Wi-Fi", "24 小时客房服务": "24-hour room service",
};

const platformText = {
  "冬宫官网": "The Hermitage official website",
  "官网直订": "Direct website",
};

const containsHanText = (value) => typeof value === "string" && /[\u3400-\u9fff]/u.test(value);

export function accommodationSourceEn(source) {
  if (!source || !containsHanText(source)) return source;
  const embeddedUrl = source.match(/https?:\/\/\S+/u)?.[0];
  let host = null;
  if (embeddedUrl) {
    try {
      host = new URL(embeddedUrl).hostname.replace(/^www\./u, "");
    } catch {
      host = null;
    }
  }
  if (/booking(?:\.com)?/iu.test(source)) return host ? `Booking.com · ${host}` : "Booking.com";
  if (/agoda/iu.test(source)) return host ? `Agoda · ${host}` : "Agoda";
  if (/airbnb/iu.test(source)) return host ? `Airbnb · ${host}` : "Airbnb";
  if (/guest reservations/iu.test(source)) return "Guest Reservations";
  if (/酒店分发图库/u.test(source)) return "ICE Portal · hotel distribution gallery";
  if (/官网|官方/u.test(source)) {
    const propertyName = source.split(/官网|官方/u)[0].trim().replace(/[·\s]+$/u, "");
    const prefix = propertyName && !containsHanText(propertyName) ? propertyName : "Property";
    return host ? `${prefix} official source · ${host}` : `${prefix} official source`;
  }
  return host ? `Recorded source · ${host}` : "Recorded source";
}

const cancellationDeadlineText = {
  "2026-08-30 18:00（酒店当地时间）": "30 Aug 2026, 6:00 p.m. hotel local time",
  "2026-09-30（入住前 72 小时；具体时刻以订单为准）": "30 Sep 2026 (72 hours before arrival; confirm the exact local cutoff in the booking)",
  "入住前至少 7 天（官网未注明具体时刻）": "at least seven days before arrival (the official website does not state the exact local cutoff)",
  "入住前 48 小时（酒店当地时间）": "48 hours before arrival (hotel local time)",
};

const rateMemberNoteText = {
  "ALL 会员价：不可退 NZD 318.44；灵活价 NZD 398.05": "ALL member rates: NZD 318.44 non-refundable or NZD 398.05 flexible",
};

const photoNotes = {
  "IHG 官网房型名称、面积与价格已核验；对应房型图片尚未单独整理": "The room name, size and price were checked on IHG; a room-specific local gallery has not yet been assembled.",
  "官网房型详情仅展示 1 张图；尚未作为可复用本地客房图保存，避免混入主楼景观房图片": "The direct room page showed only one image. It was not reused locally until a fuller verified motel-studio set could be assembled, avoiding any mix-up with main-hotel view rooms.",
  "官网 Station Huts 图库将该图明确标为 Inside Double；页面同时标注小屋床型为 1 Queen / 2 Singles": "The direct Station Huts gallery explicitly labels this image “Inside Double”; the page lists hut layouts as one queen or two singles.",
  "已在 Twizel Holiday Homes 同一房源官网与官方 RMS Cloud 预订页核对": "Checked against the same property on Twizel Holiday Homes and its official RMS Cloud booking page.",
  "此前误用了 JetPark Auckland Airport 的图片，已撤下；Christchurch 对应房型图片需重新核验": "Images from JetPark Auckland Airport had been attached in error and were removed; the correct Christchurch room gallery still needs verification.",
  "Booking 房型详情确认有 11 张对应客房图；本地高清图片尚在整理，暂不显示缩略图": "Booking.com shows eleven images for this room category; the local high-resolution set is still being assembled, so no room thumbnails are shown.",
  "房型库存与价格已核验；对应房型图库尚未单独整理": "Room inventory and pricing were checked; a room-specific gallery has not yet been assembled.",
  "价格与床型已核验；对应房型图库尚未单独整理": "Price and bed configuration were checked; a room-specific gallery has not yet been assembled.",
};

const photoLabelExact = {
  "酒店外观": "Hotel exterior",
  "酒店日间外观": "Hotel exterior by day",
  "酒店傍晚外观": "Hotel exterior at dusk",
  "酒店另一侧外观": "Alternative hotel exterior view",
  "酒店前台": "Hotel reception",
  "酒店大堂": "Hotel lobby",
  "酒店公共区域": "Hotel shared area",
  "酒店公共空间": "Hotel shared space",
  "酒店现代公共空间": "Modern hotel shared space",
  "酒店公共休息区": "Hotel shared lounge",
  "酒店餐厅": "Hotel restaurant",
  "酒店咖啡厅": "Hotel café",
  "酒店健身房": "Hotel gym",
  "酒店会议休息室": "Hotel meeting lounge",
  "酒店庭院与户外壁炉": "Hotel courtyard and outdoor fireplace",
  "室外泳池": "Outdoor swimming pool",
  "早餐与餐饮区": "Breakfast and dining area",
  "早餐与公共餐饮区": "Breakfast and shared dining area",
  "大堂休息与餐饮区": "Lobby lounge and dining area",
  "餐厅餐食服务": "Restaurant food service",
  "酒吧鸡尾酒服务": "Cocktail service at the hotel bar",
  "屋顶港景露台": "Rooftop terrace with harbour views",
  "港景餐厅": "Harbour-view restaurant",
  "酒店甜点餐饮服务": "Hotel dessert service",
  "历史建筑公共楼梯": "Shared staircase inside the heritage building",
  "整栋民居外观与露台": "Whole-home exterior and patio",
  "第二间 King 床卧室": "Second king bedroom",
  "客房内部": "Guest-room interior",
};

// Photo captions are displayed as alt text and in the lightbox. Most source
// labels use a small, repeatable accommodation vocabulary, so translate that
// vocabulary centrally instead of allowing English mode to fall back to Han
// text. If a legacy caption still contains an unfamiliar phrase, use a scoped,
// truthful fallback rather than inventing room features from the image name.
const photoLabelParts = [
  [/（非推荐房型）/g, " (not the recommended room type)"],
  [/（其他房型参考）/g, " (reference for another room type)"],
  [/（公共区域）/g, " (shared area)"],
  [/（住宿外观）/g, " (property exterior)"],
  [/（官网 ([^)]+) 图库）/g, " (official $1 gallery)"],
  [/（官网图）/g, " (official photo)"],
  [/（[^)]*平台[^)]*）/g, " (platform reference)"],
  [/其他房型参考/g, "reference for another room type"],
  [/非推荐房型/g, "not the recommended room type"],
  [/客房参考/g, "room reference"],
  [/房型示例/g, "room-type example"],
  [/房型参考/g, "room-type reference"],
  [/酒店客房/g, "hotel room"],
  [/酒店/g, "hotel "],
  [/房源/g, "property "],
  [/公寓/g, "apartment "],
  [/单间/g, "studio "],
  [/一室/g, "studio "],
  [/一卧室/g, "one-bedroom "],
  [/两卧/g, "two-bedroom "],
  [/整栋民居/g, "entire home "],
  [/乡村度假屋/g, "rural retreat "],
  [/度假屋/g, "holiday home "],
  [/阁楼/g, "loft "],
  [/客房/g, "room "],
  [/卧室/g, "bedroom "],
  [/床尾视角/g, "view from the foot of the bed"],
  [/床铺/g, "bed "],
  [/大床/g, "bed "],
  [/浴室/g, "bathroom "],
  [/独立卫浴/g, "en-suite bathroom "],
  [/私人浴室/g, "private bathroom "],
  [/淋浴与卫浴/g, "shower and bathroom "],
  [/淋浴区/g, "shower area "],
  [/淋浴浴缸/g, "shower-over-bath "],
  [/浴缸/g, "bathtub "],
  [/完整厨房/g, "full kitchen "],
  [/小厨房/g, "kitchenette "],
  [/简易厨房/g, "kitchenette "],
  [/备餐区/g, "kitchenette "],
  [/厨房/g, "kitchen "],
  [/起居与用餐区/g, "living and dining area "],
  [/起居与厨房/g, "living area and kitchen "],
  [/客厅与厨房/g, "living room and kitchen "],
  [/起居区/g, "living area "],
  [/客厅/g, "living room "],
  [/休息区/g, "sitting area "],
  [/用餐区/g, "dining area "],
  [/工作区/g, "work area "],
  [/书桌/g, "desk "],
  [/公共休息区/g, "shared lounge "],
  [/公共空间/g, "shared space "],
  [/公共区域/g, "shared area "],
  [/前台/g, "reception "],
  [/餐厅/g, "restaurant "],
  [/健身房/g, "gym "],
  [/泳池/g, "pool "],
  [/酒吧/g, "bar "],
  [/全景/g, "overview "],
  [/另一角度/g, "alternative angle "],
  [/另一视角/g, "alternative view "],
  [/角度一/g, "first angle "],
  [/角度二/g, "second angle "],
  [/近景/g, "close view "],
  [/正面/g, "front view "],
  [/侧面/g, "side view "],
  [/细节/g, "detail "],
  [/窗边/g, "window-side area "],
  [/窗景/g, "view through the window "],
  [/湖山视野/g, "lake and mountain outlook "],
  [/山谷景观/g, "valley outlook "],
  [/山地景观/g, "mountain outlook "],
  [/周边景观/g, "surrounding landscape "],
  [/湖景/g, "lake view "],
  [/港景/g, "harbour view "],
  [/海景/g, "sea view "],
  [/山景/g, "mountain view "],
  [/景观/g, "outlook "],
  [/视野/g, "outlook "],
  [/阳台/g, "balcony "],
  [/庭院/g, "courtyard "],
  [/户外空间/g, "outdoor area "],
  [/户外环境/g, "outdoor setting "],
  [/户外/g, "outdoor "],
  [/入口/g, "entrance "],
  [/外观/g, "exterior "],
  [/建筑/g, "building "],
  [/主题墙面/g, "themed wall "],
  [/主题陈设/g, "themed décor "],
  [/陈设/g, "décor "],
  [/设施/g, "facilities "],
  [/共用/g, "shared "],
  [/私人/g, "private "],
  [/高级/g, "Superior "],
  [/豪华/g, "Deluxe "],
  [/尊贵/g, "Premium "],
  [/标准/g, "Standard "],
  [/特大号床间/g, "King Room "],
  [/特大床房/g, "King Room "],
  [/特大床/g, "king bed "],
  [/大号床/g, "queen bed "],
  [/双人床/g, "double bed "],
  [/单人床/g, "single bed "],
  [/床/g, "bed "],
  [/与/g, " and "],
  [/及/g, " and "],
  [/另一侧/g, "alternative side "],
  [/日间/g, "by day "],
  [/傍晚/g, "at dusk "],
  [/附近/g, "nearby "],
  [/官网展示的/g, "shown on the official website "],
  [/官网/g, "official "],
  [/图/g, "photo "],
];

function photoLabelEn(label, { hotelName, roomName, scope }) {
  if (!label) return label;
  let translated = photoLabelExact[label] ?? label;
  for (const [pattern, replacement] of photoLabelParts) translated = translated.replace(pattern, replacement);
  translated = translated
    .replace(/\s+([),.:])/g, "$1")
    .replace(/([(/])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!/[\u3400-\u9fff]/u.test(translated)) return translated;

  if (/非推荐房型|其他房型参考|房型参考|客房参考/.test(label)) {
    return `${hotelName} reference photo of another room type (not the recommended room type)`;
  }
  if (/公共|大堂|前台|餐厅|酒吧|泳池|健身房|会议/.test(label)) {
    return `${hotelName} shared-area photo`;
  }
  if (scope === "room") return `${roomName ?? hotelName} verified room photo`;
  return `${hotelName} verified property photo`;
}

function reviewsEn(value) {
  return value
    ?.replace(/条官网确认评价/g, " verified direct reviews")
    .replace(/条/g, " reviews")
    .replace(/位置/g, "location")
    .replace(/确认号已私下保存/g, "confirmation number stored privately")
    .replace(/预订已确认/g, "Booking confirmed")
    .replace(/；/g, ";")
    .replace(/ · /g, " · ");
}

function scoreEn(value) {
  return ({
    "预订已确认": "Booking confirmed",
    "精确日期可订": "Exact date available",
    "仅剩 1 间": "One room left",
  })[value] ?? value;
}

function sizeEn(value) {
  return ({
    "官网未标明": "Not stated on the official website",
    "平台未标": "Not stated on the platform",
    "约 30—35 m²（平台标注不同）": "About 30–35 m² (platforms differ)",
    "Booking 49 m² · Agoda 50 m²": "49 m² on Booking.com · 50 m² on Agoda",
    "平台搜索卡标 10 m²；详情页未重复标面积": "The platform search card says 10 m²; the detail page does not repeat the size",
    "平台未明确区分面积": "The platform does not clearly distinguish the size",
  })[value] ?? value?.replace(/—/g, "–");
}

const distanceNotes = {
  "Airbnb 预订前只公开大致位置；距离按房源地图所示 Sunshine Bay / Fernhill 一带估算，确认预订后应以准确地址复核。": "Airbnb shows only an approximate location before booking. Distances are estimated from the Sunshine Bay / Fernhill area shown on the listing map; recheck them against the exact address after confirmation.",
  "Airbnb 预订前只公开大致位置；步行距离按房源中央 Queenstown 地图范围估算，订后应以准确地址复核。": "Airbnb shows only an approximate location before booking. Walking distances are estimated from the central Queenstown area shown on the listing map; recheck them against the exact address after confirmation.",
  "Airbnb 预订前只公开大致位置；距离按 Lake Hayes 房源地图范围估算，订后应以准确地址复核。": "Airbnb shows only an approximate location before booking. Distances are estimated from the Lake Hayes area shown on the listing map; recheck them against the exact address after confirmation.",
  "Airbnb 预订前只公开大致位置；步行时间来自房源说明与住客反馈，精确地址订后再复核。": "Airbnb shows only an approximate location before booking. Walking times come from the listing description and guest feedback; recheck them against the exact address after confirmation.",
  "Airbnb 预订前只公开大致位置；距离按房源说明和住客反馈估算，精确地址订后再复核。": "Airbnb shows only an approximate location before booking. Distances are estimated from the listing description and guest feedback; recheck them against the exact address after confirmation.",
  "Airbnb 预订前仅公开大致位置；以下距离按 Twizel 镇中心估算，确认预订后应以准确地址复核。": "Airbnb shows only an approximate location before booking. The distances below are estimated from central Twizel; recheck them against the exact address after confirmation.",
  "Airbnb 预订前不公开准确地址；以下时间按 Pukaki / Twizel 北侧区域保守估算，确认预订后必须复核。": "Airbnb does not disclose the exact address before booking. The times below are conservative estimates from the Pukaki / northern Twizel area and must be rechecked after confirmation.",
  "以下距离按 Ben Ohau 区域估算；Airbnb 确认预订后才提供准确地址。": "The distances below are estimated from the Ben Ohau area; Airbnb provides the exact address only after booking confirmation.",
};

// Rate snapshots are historical evidence, so their English copy must describe
// the saved Chinese terms without changing price or availability semantics.
const rateRoomText = {
  "高级特大号床间 · 26 m²": "Superior King Room · 26 m²",
  "无障碍高级特大床房": "Accessible Superior King Room",
  "高级特大号床间 · 30 m²": "Superior King Room · 30 m²",
  "高级特大号床间 · 23 m²": "Superior King Room · 23 m²",
  "湖景特大床房 · 34 m²": "Lake View King Room · 34 m²",
  "山景特大号床间 · 28 m²": "Mountain View King Room · 28 m²",
  "Lake View King with Balcony · 32 m²": "Lake View King with Balcony · 32 m²",
  "一卧室公寓 · 59 m²": "One-bedroom Apartment · 59 m²",
  "豪华特大床一室公寓 · 35 m²": "Deluxe King Studio Apartment · 35 m²",
  "特大床单间公寓 (King Studio Apartment) · 30 m²": "King Studio Apartment · 30 m²",
  "一卧室公寓 · 49 m²": "One-bedroom Apartment · 49 m²",
  "Hotel Room · 28 m² · 特大床或双床": "Hotel Room · 28 m² · king or twin configuration",
  "豪华间 · 25 m²": "Deluxe Room · 25 m²",
  "双人间 · 私人浴室 · 25 m²": "Double Room with Private Bathroom · 25 m²",
  "山景大床间 · 25 m²": "Mountain View Queen Room · 25 m²",
  "一卧室 Queen 木屋": "One-bedroom Queen Chalet",
  "一卧室 Queen 木屋 · 另一独立单元": "One-bedroom Queen Chalet · separate second unit",
  "Queen 牧羊人小屋 / 帐篷": "Queen shepherd's hut / tent",
  "House, 3 Bedrooms · 整栋房屋": "House, 3 Bedrooms · entire home",
  "整套私人单间公寓": "Entire private studio apartment",
  "独立阁楼公寓": "Private loft apartment",
  "整栋三卧室民居": "Entire three-bedroom home",
  "Pukaki Air Lodge 高级独立客房": "Pukaki Air Lodge Superior private room",
  "整套两卧室乡村客房": "Entire two-bedroom rural guest suite",
  "整套独立客房 · 1 张 Queen 床": "Entire private guest suite · one queen bed",
  "一室公寓 · 双人床选项": "Studio · double-bed option",
  "一卧室整套民居 · 1 张 Queen 床": "Entire one-bedroom home · one queen bed, as shown in the checked listing",
  "镇中心一卧室整套公寓": "Entire central Queenstown one-bedroom apartment",
  "Lake Hayes 农场整套单间公寓": "Entire farm studio in the Lake Hayes area",
  "一室公寓 · 27 m²": "27 m² studio room",
  "整栋三卧室民居 · 2 张 King 床 + 双层床": "Whole three-bedroom home with two king beds and bunk beds",
};

const ratePaymentText = {
  "不可退档在线付款；灵活价无需预付": "The non-refundable rate is paid online; the flexible rate requires no prepayment",
  "可免费取消价在 9 月 25 日前（不含当日）零付款": "No payment is due before 25 September on the free-cancellation rate",
  "9 月 25 日前无需付款": "No payment is due before 25 September",
  "免费取消价无需预付、到店付款": "The free-cancellation rate requires no prepayment and is paid at the property",
  "仅核验到不可退款价；未进入可取消档结算页": "Only the non-refundable rate was verified; the flexible-rate checkout was not opened",
  "可取消档付款时间以结算页为准": "Confirm the flexible rate's payment timing at checkout",
  "无需预付、到店付款": "No prepayment; pay at the property",
  "无需预付、到店付款；含停车套餐总价 NZD 5,253": "No prepayment; pay at the property; the package total including parking was NZD 5,253",
  "9 月 17 日前（不含当日）零付款": "No payment is due before 17 September",
  "9 月 24 日前（不含当日）零付款": "No payment is due before 24 September",
  "2026 年 9 月 17 日自动扣款；当前剩 5 间": "The charge is scheduled for 17 September 2026; five rooms remained when checked",
  "9 月 24 日前（不含当日）零付款；当前剩 2 间": "No payment is due before 24 September; two rooms remained when checked",
  "不可退款、马上预订并付款；页面显示仅剩 1 间": "Non-refundable and payable immediately; the page showed one room left",
  "9 月 26 日前（不含当日）零付款；当前剩 1 间": "No payment is due before 26 September; one room remained when checked",
  "9 月 26 日前（不含当日）零付款": "No payment is due before 26 September",
  "不可退款、在线付款；当前剩 1 间": "Non-refundable and paid online; one unit remained when checked",
  "可到 2026 年 9 月 18 日再付款；信用卡付款另收 3.25%": "Payment can be deferred until 18 September 2026; card payments incur a 3.25% fee",
  "9 月 23 日前（不含当日）零付款": "No payment is due before 23 September",
  "现在付 NZD 0": "NZD 0 is due immediately",
  "现在付 NZD 0；Airbnb 页面提示暂不会扣款": "NZD 0 is due immediately; Airbnb stated that the card would not be charged yet",
  "预订按钮当前提示不会立即扣款；实际分期时间以结算页为准": "The booking page stated that no charge would be taken immediately; confirm the instalment timing at checkout",
  "付款时间以 Airbnb 结算页为准": "Confirm the payment timing at Airbnb checkout",
  "当前显示今日先付 NZD 0；后续付款以 Airbnb 结算页为准": "The page showed NZD 0 due today; confirm subsequent payment timing at Airbnb checkout",
  "可取消档在 9 月 26 日前（不含当日）零付款": "No payment is due before 26 September on the flexible rate",
};

const rateBreakfastText = {
  "不可退含双早官网价 NZD 388；灵活含双早 NZD 485": "The direct breakfast-for-two rates were NZD 388 non-refundable or NZD 485 flexible",
  "早餐另加 NZD 35/人": "Breakfast costs NZD 35 per person",
  "早餐另加 NZD 32/人": "Breakfast costs NZD 32 per person",
  "早餐另加 NZD 45/人": "Breakfast costs NZD 45 per person",
  "早餐另加 NZD 34/人": "Breakfast costs NZD 34 per person",
  "不含早餐": "Breakfast is not included",
  "早餐另加 NZD 30/人/天；停车 NZD 20/天，含停车实际总价 NZD 1,436": "Breakfast costs NZD 30 per person per day; parking costs NZD 20 per day, bringing the checked total with parking to NZD 1,436",
  "含早餐": "Breakfast is included",
  "带厨房，不含早餐": "Breakfast is not included; the accommodation has a kitchen",
  "含停车和免费 Wi-Fi；不含早餐": "Parking and free Wi-Fi are included; breakfast is not included",
  "不含早餐；含早餐方案总价 NZD 989": "Breakfast is not included; the checked breakfast package total was NZD 989",
  "共享厨房，不含早餐": "Breakfast is not included; a shared kitchen is available",
  "共用厨房，不含早餐": "Breakfast is not included; a shared kitchen is available",
  "含自助早餐；住客反馈有鸡蛋、酸奶、麦片与面包等，具体供应下单前复核": "Self-service breakfast is included; guest reports mention eggs, yoghurt, cereal and bread, but recheck the exact offering before booking",
  "不含早餐；提供微波炉、小冰箱、烤面包机和水壶": "Breakfast is not included; a microwave, mini-fridge, toaster and kettle are provided",
  "带完整厨房，不含早餐": "Breakfast is not included; a full kitchen is provided",
  "早餐可另购": "Breakfast can be purchased separately",
};

function completeRateEnglish(rate) {
  if (!rate || typeof rate !== "object") return;
  rate.roomEn ??= rateRoomText[rate.room] ?? (/^[\x00-\x7F\s²·–—]+$/.test(rate.room ?? "") ? rate.room : undefined);
  rate.paymentEn ??= ratePaymentText[rate.payment];
  rate.breakfastEn ??= rateBreakfastText[rate.breakfast];
  rate.sourceEn ??= accommodationSourceEn(rate.source);
  if (rate.cancelUntil) {
    rate.cancelUntilEn ??= cancellationDeadlineText[rate.cancelUntil]
      ?? (!containsHanText(rate.cancelUntil) ? rate.cancelUntil : undefined);
  }
  if (rate.memberNote) {
    rate.memberNoteEn ??= rateMemberNoteText[rate.memberNote]
      ?? (!containsHanText(rate.memberNote) ? rate.memberNote : undefined);
  }
  if (rate.rateLabel && !containsHanText(rate.rateLabel)) rate.rateLabelEn ??= rate.rateLabel;
  if (rate.refundableRateLabel && !containsHanText(rate.refundableRateLabel)) {
    rate.refundableRateLabelEn ??= rate.refundableRateLabel;
  }
  if (rate.conversionNote && !containsHanText(rate.conversionNote)) {
    rate.conversionNoteEn ??= rate.conversionNote;
  }
}

export function completeAccommodationEnglishFields(hotels, { includeIds, fillRates = false } = {}) {
  for (const hotel of hotels) {
    for (const image of hotel.hotelImages ?? []) {
      image.labelEn ??= photoLabelEn(image.label, {
        hotelName: hotel.name,
        scope: "property",
      });
      image.sourceEn ??= accommodationSourceEn(image.source);
    }
    for (const room of hotel.roomTypes ?? []) {
      for (const image of room.images ?? []) {
        image.labelEn ??= photoLabelEn(image.label, {
          hotelName: hotel.name,
          roomName: room.nameEn ?? roomNames[room.name] ?? room.name,
          scope: "room",
        });
        image.sourceEn ??= accommodationSourceEn(image.source);
      }
    }
    if (includeIds && !includeIds.has(hotel.id)) continue;
    if ((hotel.isAirbnb && !hotel.isVerifiedListing) || hotel.isResearchPlaceholder) continue;
    if (hotel.distanceNote && !hotel.distanceNoteEn) hotel.distanceNoteEn = distanceNotes[hotel.distanceNote];
    for (const attraction of hotel.nearbyAttractions ?? []) {
      attraction.nameEn ??= attractionNames[attraction.name] ?? attraction.name;
      attraction.distanceEn ??= metricEn(attraction.distance);
      attraction.travelTimeEn ??= travelTimeEn(attraction.travelTime);
    }
    for (const room of hotel.roomTypes ?? []) {
      room.nameEn ??= roomNames[room.name] ?? room.name;
      if (room.size) room.sizeEn ??= sizeEn(room.size);
      room.bedEn ??= bedText[room.bed] ?? room.bed;
      room.facilitiesEn ??= (room.facilities ?? []).map((facility) => facilityText[facility] ?? facility);
      if (room.photoNote) room.photoNoteEn ??= photoNotes[room.photoNote];
    }
    const ratings = Array.isArray(hotel.ratings) ? hotel.ratings : hotel.ratings ? [hotel.ratings] : [];
    for (const rating of ratings) {
      rating.platformEn ??= platformText[rating.platform] ?? rating.platform;
      rating.scoreEn ??= scoreEn(rating.score);
      rating.reviewsEn ??= reviewsEn(rating.reviews);
    }
    for (const snapshot of Object.values(hotel.rateSnapshots ?? {})) {
      if (snapshot?.roomRates) {
        for (const platforms of Object.values(snapshot.roomRates)) {
          for (const rate of Object.values(platforms ?? {})) {
            if (fillRates) completeRateEnglish(rate);
            else rate.sourceEn ??= accommodationSourceEn(rate.source);
          }
        }
      } else if (snapshot?.source) {
        if (fillRates) completeRateEnglish(snapshot);
        else snapshot.sourceEn ??= accommodationSourceEn(snapshot.source);
      }
    }
  }
  return hotels;
}
