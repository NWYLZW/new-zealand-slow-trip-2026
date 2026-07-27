const image = (src, label, source = "Booking.com") => ({ src: `/new-zealand-slow-trip-2026/images/hotels/${src}`, label, source });

export const regionalStays = {
  queenstown: {
    id: "queenstown",
    title: "皇后镇住宿比选",
    titleEn: "Queenstown stay comparison",
    mapLabel: "皇后镇住宿位置地图",
    mapLabelEn: "Queenstown stay locations",
    anchorPosition: [-45.0312, 168.6594],
    anchorLabel: "Steamer Wharf",
    anchorLabelEn: "Steamer Wharf",
    anchorIcon: "⚓",
    dates: { checkIn: "2026-09-29", checkOut: "2026-10-03", label: "9月29日—10月3日" },
    selectedHotelId: "ramada-queenstown-central",
  },
  wanaka: {
    id: "wanaka",
    title: "瓦纳卡住宿比选",
    titleEn: "Wānaka stay comparison",
    mapLabel: "瓦纳卡住宿位置地图",
    mapLabelEn: "Wānaka stay locations",
    anchorPosition: [-44.698, 169.117],
    anchorLabel: "That Wānaka Tree",
    anchorLabelEn: "That Wānaka Tree",
    anchorIcon: "🌳",
    dates: { checkIn: "2026-10-03", checkOut: "2026-10-05", label: "10月3日—5日" },
    selectedHotelId: "wanaka-luxury-apartments",
  },
  "mount-cook": {
    id: "mount-cook",
    title: "库克山村住宿比选",
    titleEn: "Aoraki / Mount Cook stay comparison",
    mapLabel: "库克山村住宿位置地图",
    mapLabelEn: "Aoraki / Mount Cook stay locations",
    anchorPosition: [-43.765, 170.133],
    anchorLabel: "Mount Cook Airport",
    anchorLabelEn: "Mount Cook Airport",
    anchorIcon: "🚁",
    dates: { checkIn: "2026-10-05", checkOut: "2026-10-06", label: "10月5日—6日" },
    selectedHotelId: "hermitage-mount-cook",
  },
  christchurch: {
    id: "christchurch",
    title: "基督城市中心住宿比选",
    titleEn: "Central Christchurch stay comparison",
    mapLabel: "基督城住宿位置地图",
    mapLabelEn: "Christchurch stay locations",
    anchorPosition: [-43.532, 172.636],
    anchorLabel: "Riverside Market",
    anchorLabelEn: "Riverside Market",
    anchorIcon: "◎",
    dates: { checkIn: "2026-10-06", checkOut: "2026-10-07", label: "10月6日—7日" },
    selectedHotelId: "rydges-latimer-christchurch",
  },
  rotorua: {
    id: "rotorua",
    title: "罗托鲁瓦住宿比选",
    titleEn: "Rotorua stay comparison",
    mapLabel: "罗托鲁瓦住宿位置地图",
    mapLabelEn: "Rotorua stay locations",
    anchorPosition: [-38.1617, 176.2505],
    anchorLabel: "Te Puia",
    anchorLabelEn: "Te Puia",
    anchorIcon: "♨",
    dates: { checkIn: "2026-10-09", checkOut: "2026-10-10", label: "10月9日—10日" },
    selectedHotelId: "jetpark-rotorua",
  },
};

const sharedSocial = {
  queenstown: {
    verdict: "小红书结果明显偏爱湖景 Airbnb、独栋与公寓，但很多热门房源离镇中心远。你们有 Walter Peak 不开车日，步行到码头比单纯窗景更重要，因此优先镇中心酒店。",
    url: "https://www.xiaohongshu.com/search_result?keyword=%E7%9A%87%E5%90%8E%E9%95%87%20%E4%BD%8F%E5%AE%BF%20%E6%8E%A8%E8%8D%90&type=51",
  },
  wanaka: {
    verdict: "小红书更偏好森林木屋、湖畔民宿和带厨房公寓；两晚自驾确实适合公寓，但应控制在湖边和镇中心步行范围内。",
    url: "https://www.xiaohongshu.com/search_result?keyword=%E7%93%A6%E7%BA%B3%E5%8D%A1%20%E4%BD%8F%E5%AE%BF%20%E6%8E%A8%E8%8D%90%20%E9%85%92%E5%BA%97%20%E6%B0%91%E5%AE%BF&type=51",
  },
  mountCook: {
    verdict: "讨论集中在 Hermitage 山景、Haka House 和山外农场民宿。山外民宿照片更惊艳，但会破坏直升机候补与晚间观星动线；这一晚应把村内位置放在第一位。",
    url: "https://www.xiaohongshu.com/search_result?keyword=%E5%BA%93%E5%85%8B%E5%B1%B1%20%E4%BD%8F%E5%AE%BF%20%E6%8E%A8%E8%8D%90%20%E9%85%92%E5%BA%97%20%E6%B0%91%E5%AE%BF&type=51",
  },
  christchurch: {
    verdict: "酒店与自助民宿推荐并存；但你们只住一晚、次日上午逛市中心再还车，清洁费和自助入住让民宿优势变小，带停车的市中心酒店更稳。",
    url: "https://www.xiaohongshu.com/search_result?keyword=%E5%9F%BA%E7%9D%A3%E5%9F%8E%20%E4%BD%8F%E5%AE%BF%20%E6%8E%A8%E8%8D%90%20%E9%85%92%E5%BA%97%20%E6%B0%91%E5%AE%BF&type=51",
  },
  rotorua: {
    verdict: "湖景民宿和农场民宿热度高，但单晚且次日 09:00 要到 Te Puia；镇中心免费停车酒店更符合晚到、早退房的节奏。",
    url: "https://www.xiaohongshu.com/search_result?keyword=%E7%BD%97%E6%89%98%E9%B2%81%E7%93%A6%20%E4%BD%8F%E5%AE%BF%20%E6%8E%A8%E8%8D%90%20%E9%85%92%E5%BA%97%20%E6%B0%91%E5%AE%BF&type=51",
  },
};

export const regionalHotels = {
  queenstown: [
    {
      id: "ramada-queenstown-central", name: "Ramada by Wyndham Queenstown Central", recommendation: "行程最匹配", recommendationEn: "Best itinerary fit",
      summary: "到镇中心、湖边和 Queenstown Gardens 步行约 7—10 分钟；四晚不换房，Walter Peak 当天可把车留在酒店。",
      summaryEn: "Walkable to the centre, lakefront and gardens, making the car-free Walter Peak day straightforward.",
      access: "位置评分 9.0；Steamer Wharf 约 1.1 公里", accessEn: "Location score 9.0; about 1.1 km to Steamer Wharf",
      parking: "需预订的私人停车场 NZD 30/天；四晚约 NZD 120", parkingEn: "Reserved private parking NZD 30/day; about NZD 120 for four nights",
      strengths: ["镇中心步行动线好", "27 m² 公寓带小厨房", "可取消档零付款至 9 月 26 日", "四晚不搬行李"],
      cautions: ["停车四晚另加约 NZD 120", "评分 8.3 不如 The Rees", "一室公寓床型需在结算页确认大床"],
      ratings: [{ platform: "Booking.com", score: "8.3 / 10", reviews: "2,000+ 条" }],
      roomTypes: [{ rateKey: "studio-king", name: "一室公寓 · 大床", size: "27 m²", bed: "1 张大床（结算页确认床型）", facilities: ["私人小厨房", "洗碗机", "独立浴室", "空调", "隔音", "免费 Wi-Fi"], images: [image("queenstown-room-1.jpg", "一室公寓大床与山景"), image("queenstown-room-2.jpg", "一室公寓浴室")] }],
      hotelImages: [image("queenstown-hotel-1.jpg", "酒店外观"), image("queenstown-hotel-2.jpg", "酒店与山景")],
      rateSnapshots: { "2026-09-29/2026-10-03": { source: "Booking.com · Genius 1", roomKey: "studio-king", room: "一室公寓 · 27 m²", nonRefundableNzd: 1984, refundableNzd: 2204, cancelUntil: "2026-09-28", payment: "可取消档在 9 月 26 日前（不含当日）零付款", breakfast: "早餐可另购", quotedAt: "2026-07-27" } },
      research: sharedSocial.queenstown,
      officialUrl: "https://www.wyndhamhotels.com/ramada/queenstown-new-zealand/ramada-queenstown-central/overview", bookingUrl: "https://www.booking.com/hotel/nz/ramada-queenstown-central.html", agodaUrl: "https://www.agoda.com/ramada-queenstown-central/hotel/queenstown-nz.html", position: [-45.0372, 168.6653], mapQuery: "Ramada by Wyndham Queenstown Central",
    },
    {
      id: "the-rees-queenstown", name: "The Rees Hotel & Luxury Apartments", recommendation: "湖景品质", recommendationEn: "Lake-view quality",
      summary: "房间和服务更好，并有免费镇中心接驳；但离码头约 2.2 公里且四晚价格高很多。", summaryEn: "Better rooms and a town shuttle, but farther from the wharf and much more expensive.",
      access: "距中心约 2.2 公里；提供镇中心接驳", accessEn: "About 2.2 km from the centre with a town shuttle", parking: "免费私人停车", parkingEn: "Free private parking",
      strengths: ["34 m² 湖景特大床", "免费停车与镇中心接驳", "评分 8.7"], cautions: ["四晚总价高", "Walter Peak 当天不如步行酒店直接", "可取消截止较早"], ratings: [{ platform: "Booking.com", score: "8.7 / 10", reviews: "1,000+ 条" }],
      roomTypes: [{ rateKey: "lake-view-king", name: "湖景特大床房", size: "34 m²", bed: "1 张超大号双人床", facilities: ["湖景", "私人浴室", "空调", "免费 Wi-Fi"], images: [] }], hotelImages: [],
      rateSnapshots: { "2026-09-29/2026-10-03": { source: "Booking.com", roomKey: "lake-view-king", room: "湖景特大床房 · 34 m²", nonRefundableNzd: 2902, refundableNzd: 3055, cancelUntil: "2026-09-22", payment: "可取消档付款时间以结算页为准", breakfast: null, quotedAt: "2026-07-27" } }, research: sharedSocial.queenstown,
      officialUrl: "https://www.therees.co.nz/", bookingUrl: "https://www.booking.com/hotel/nz/the-rees-luxury-apartments.html", agodaUrl: "https://www.agoda.com/the-rees-hotel-luxury-apartments/hotel/queenstown-nz.html", position: [-45.0281, 168.6875], mapQuery: "The Rees Hotel Queenstown",
    },
    {
      id: "holiday-inn-remarkables", name: "Holiday Inn Queenstown Remarkables Park", recommendation: "低价大床", recommendationEn: "Lower-cost king", summary: "山景特大床价格低且可取消，但距镇中心 6.8 公里，连续四天会增加往返。", summaryEn: "A good-value cancellable king room, but 6.8 km from central Queenstown.", access: "距镇中心约 6.8 公里", accessEn: "About 6.8 km from central Queenstown", parking: "停车条款需结算页确认", parkingEn: "Confirm parking at checkout", strengths: ["明确山景特大床", "四晚价格低", "免费取消、无需预付"], cautions: ["不适合 Walter Peak 步行日", "四天往返镇中心", "停车成本待确认"], ratings: [{ platform: "Booking.com", score: "8.8 / 10", reviews: "2,000+ 条" }], roomTypes: [{ rateKey: "mountain-king", name: "山景特大床房", size: "平台待确认", bed: "1 张超大号双人床", facilities: ["山景", "私人浴室", "空调", "免费 Wi-Fi"], images: [] }], hotelImages: [], rateSnapshots: { "2026-09-29/2026-10-03": { source: "Booking.com", roomKey: "mountain-king", room: "山景特大床房", nonRefundableNzd: null, refundableNzd: 1356, cancelUntil: "平台显示免费取消", payment: "无需预付、到店付款", breakfast: null, quotedAt: "2026-07-27" } }, research: sharedSocial.queenstown, officialUrl: "https://www.ihg.com/holidayinn/hotels/us/en/queenstown/zqnrm/hoteldetail", bookingUrl: "https://www.booking.com/hotel/nz/holiday-inn-queenstown-remarkables-park.html", agodaUrl: "https://www.agoda.com/holiday-inn-queenstown-remarkables-park/hotel/queenstown-nz.html", position: [-45.0154, 168.7366], mapQuery: "Holiday Inn Queenstown Remarkables Park",
    },
  ],
  wanaka: [
    {
      id: "wanaka-luxury-apartments", name: "Wanaka Luxury Apartments", recommendation: "两晚最均衡", recommendationEn: "Best two-night balance", summary: "步行约 10 分钟到湖边，59 m² 一卧室大床公寓兼顾度假感、做饭洗衣和次日出城。", summaryEn: "A spacious queen apartment within walking distance of the lake, with an easy drive out toward Aoraki.", access: "距湖岸 600 米、镇中心约 0.9 公里；位置评分 9.1", accessEn: "600 m from the lake and about 0.9 km from town; location score 9.1", parking: "免费私人停车", parkingEn: "Free private parking", strengths: ["59 m² 纯大床公寓", "厨房、Spa 浴缸与壁炉", "免费停车", "两晚可取消且价格合理"], cautions: ["不是正湖畔第一排", "只剩 1 间时库存风险高", "Edgewater 精确日期无房"], ratings: [{ platform: "Booking.com", score: "9.0 / 10", reviews: "800+ 条" }], roomTypes: [{ rateKey: "one-bedroom-queen", name: "一卧室公寓", size: "59 m²", bed: "1 张大号双人床", facilities: ["私人小厨房", "Spa 浴缸", "壁炉", "庭院", "洗衣/烘干", "免费 Wi-Fi"], images: [image("wanaka-room-1.jpg", "一卧室大床"), image("wanaka-room-2.jpg", "Spa 浴缸"), image("wanaka-room-3.jpg", "公寓厨房")] }], hotelImages: [image("wanaka-hotel-1.jpg", "公寓泳池与山景"), image("wanaka-hotel-2.jpg", "公寓建筑与泳池")], rateSnapshots: { "2026-10-03/2026-10-05": { source: "Booking.com", roomKey: "one-bedroom-queen", room: "一卧室公寓 · 59 m²", nonRefundableNzd: null, refundableNzd: 660, cancelUntil: "2026-09-19", payment: "9 月 17 日前（不含当日）零付款", breakfast: "带厨房，不含早餐", quotedAt: "2026-07-27" } }, research: sharedSocial.wanaka, officialUrl: "https://www.wanakaluxuryapartments.co.nz/", bookingUrl: "https://www.booking.com/hotel/nz/wanaka-luxury-apartments.html", agodaUrl: "https://www.agoda.com/wanaka-luxury-apartments/hotel/wanaka-nz.html", position: [-44.7047, 169.1216], mapQuery: "Wanaka Luxury Apartments",
    },
    { id: "west-meadows-wanaka", name: "West Meadows of Wanaka", recommendation: "高分大床", recommendationEn: "High-rated king studio", summary: "35 m² 特大床一室公寓、评分更高，适合更重视现代房间的人。", summaryEn: "A highly rated modern king studio.", access: "自驾出城方便；到湖边需短途开车", accessEn: "Easy driving access; a short drive to the lake", parking: "免费停车", parkingEn: "Free parking", strengths: ["35 m² 特大床", "评分 9.2", "免费取消"], cautions: ["步行湖边不如首选", "两晚总价略高"], ratings: [{ platform: "Booking.com", score: "9.2 / 10", reviews: "500+ 条" }], roomTypes: [{ rateKey: "king-studio", name: "特大床一室公寓", size: "35 m²", bed: "1 张超大号双人床", facilities: ["小厨房", "私人浴室", "空调", "免费 Wi-Fi"], images: [] }], hotelImages: [], rateSnapshots: { "2026-10-03/2026-10-05": { source: "Booking.com", roomKey: "king-studio", room: "特大床一室公寓 · 35 m²", refundableNzd: 708, nonRefundableNzd: null, cancelUntil: "平台显示免费取消", payment: "付款时间以结算页为准", breakfast: null, quotedAt: "2026-07-27" } }, research: sharedSocial.wanaka, officialUrl: "https://westmeadowswanaka.co.nz/", bookingUrl: "https://www.booking.com/hotel/nz/west-meadows-of-wanaka.html", agodaUrl: "https://www.agoda.com/west-meadows-of-wanaka/hotel/wanaka-nz.html", position: [-44.7134, 169.1406], mapQuery: "West Meadows of Wanaka" },
  ],
  "mount-cook": [
    {
      id: "hermitage-mount-cook", name: "The Hermitage Hotel Aoraki Mount Cook", recommendation: "位置优先 · 待确认库存", recommendationEn: "Best location · inventory pending", summary: "Big Sky、餐厅和游客中心都在酒店内；最适合 10 月 5 日观星和次晨直升机候补，但 Booking 精确日期无房，官网预订页当前报错。", summaryEn: "The best base for stargazing and a helicopter retry, but exact-date inventory could not be confirmed.", access: "村内上村；到 Mount Cook Airport 约 8 分钟车程", accessEn: "Upper village; about 8 minutes by car to Mount Cook Airport", parking: "官网确认免费停车", parkingEn: "Free parking confirmed by the official site", strengths: ["Big Sky 与餐厅在酒店内", "天气候补动线最佳", "官网 48 小时取消", "纯大床房型选择多"], cautions: ["10 月 5 日 Booking 显示无房", "官网预订页当前 404", "Superior 房型 2026 年 5—10 月装修", "必须直接联系酒店确认库存"], ratings: [{ platform: "Booking.com", score: "8.3 / 10", reviews: "4,000+ 条" }], roomTypes: [{ rateKey: "premium-plus-king", name: "Premium Plus Super King", size: "官网未标", bed: "1 张特大床", facilities: ["8—10 层", "库克山景", "私人浴室", "免费 Wi-Fi"], images: [image("mount-cook-room-1.jpg", "Premium Plus 特大床房", "Hermitage 官网")] }, { rateKey: "standard-view-queen", name: "Standard Mt Cook View Queen", size: "官网未标", bed: "1 张大号双人床", facilities: ["库克山景", "1—2 层", "无空调", "私人浴室"], images: [] }], hotelImages: [image("mount-cook-hotel-1.jpg", "Hermitage 酒店与库克山", "Hermitage 官网"), image("mount-cook-hotel-2.jpg", "酒店餐厅", "Hermitage 官网"), image("mount-cook-hotel-3.jpg", "Big Sky 观星", "Hermitage 官网")], availabilityNote: "精确日期当前无法核验：Booking.com 显示无房；Hermitage 官网预订页返回 404。不要按官网“From NZD 450”当作 10 月 5 日实价，请直接联系酒店确认。", rateSnapshots: {}, research: sharedSocial.mountCook, officialUrl: "https://www.hermitage.co.nz/stay/hermitage-hotel/", bookingUrl: "https://www.booking.com/hotel/nz/the-hermitage-mount-cook.html", position: [-43.7338, 170.0937], mapQuery: "The Hermitage Hotel Aoraki Mount Cook",
    },
    { id: "mt-cook-lodge", name: "Mt Cook Lodge", recommendation: "村内次选 · 待确认库存", recommendationEn: "Village backup · inventory pending", summary: "下村翻新客房、Chamois Bar & Grill 在旁；距 Hermitage 800 米，仍能保留村内天气备选。", summaryEn: "A refurbished lower-village backup that preserves the weather contingency.", access: "下村；距 Hermitage 800 米", accessEn: "Lower village; 800 m from the Hermitage", parking: "官网确认免费停车", parkingEn: "Free parking confirmed", strengths: ["仍在库克山村内", "免费停车与 Wi-Fi", "官网 48 小时取消"], cautions: ["精确日期官网库存未加载", "Big Sky 需去上村", "房型总价待确认"], ratings: [{ platform: "官网", score: "未统一评分", reviews: "官方资料" }], roomTypes: [{ rateKey: "lodge-king", name: "翻新大床客房", size: "官网待确认", bed: "1 张大床（预订时确认）", facilities: ["私人浴室", "免费 Wi-Fi", "塔斯曼谷景"], images: [] }], hotelImages: [], availabilityNote: "官网说明 10 月正常营业并提供 48 小时取消，但精确日期库存与实价未成功加载。", rateSnapshots: {}, research: sharedSocial.mountCook, officialUrl: "https://www.hermitage.co.nz/stay/mt-cook-lodge/", position: [-43.7417, 170.1006], mapQuery: "Mt Cook Lodge" },
  ],
  christchurch: [
    {
      id: "rydges-latimer-christchurch", name: "Rydges Latimer Christchurch", recommendation: "行程最匹配", recommendationEn: "Best itinerary fit", summary: "长途驾驶后可直接停车入住；次日上午步行约 5 分钟到 Riverside Market，再向机场方向还车。", summaryEn: "Easy parking after the long drive, then a short walk to Riverside Market before returning the car.", access: "Riverside Market 步行约 5 分钟；位置评分 9.1", accessEn: "About a 5-minute walk to Riverside Market; location score 9.1", parking: "私人停车约 NZD 20/天（住客评价与平台资料；预订前确认）", parkingEn: "Private parking about NZD 20/day; reconfirm before booking", strengths: ["28 m² 纯特大床", "市中心步行动线", "10 月 5 日前免费取消", "无需预付、到店付款"], cautions: ["停车收费", "早餐另加 NZD 42/人", "只住一晚无需追求公寓厨房"], ratings: [{ platform: "Booking.com", score: "8.5 / 10", reviews: "2,000+ 条" }], roomTypes: [{ rateKey: "superior-king", name: "高级特大号床间", size: "28 m²", bed: "1 张超大号双人床", facilities: ["空调", "独立浴室", "隔音", "平板电视", "免费 Wi-Fi"], images: [image("christchurch-room-1.jpg", "高级特大床房"), image("christchurch-room-2.jpg", "特大床房与窗景")] }], hotelImages: [image("christchurch-hotel-1.jpg", "酒店外观"), image("christchurch-hotel-2.jpg", "酒店公共空间")], rateSnapshots: { "2026-10-06/2026-10-07": { source: "Booking.com", roomKey: "superior-king", room: "高级特大号床间 · 28 m²", nonRefundableNzd: null, refundableNzd: 326, cancelUntil: "2026-10-05", payment: "无需预付、到店付款", breakfast: "早餐另加 NZD 42/人；含早总价 NZD 449", quotedAt: "2026-07-27" } }, research: sharedSocial.christchurch, officialUrl: "https://www.rydges.com/accommodation/new-zealand/latimer-christchurch/", bookingUrl: "https://www.booking.com/hotel/nz/rydges-latimer-christchurch.html", agodaUrl: "https://www.agoda.com/rydges-latimer-christchurch/hotel/christchurch-nz.html", position: [-43.5303, 172.6472], mapQuery: "Rydges Latimer Christchurch",
    },
    { id: "quest-manchester-christchurch", name: "Quest on Manchester Serviced Apartments", recommendation: "公寓性价比", recommendationEn: "Apartment value", summary: "评分更高、带厨房洗衣，单晚可取消价更低；但一室公寓大床和停车位均需视供应确认。", summaryEn: "A highly rated apartment with kitchen and laundry, though bed type and parking are subject to availability.", access: "位置评分 9.3；市中心步行范围", accessEn: "Location score 9.3; walkable central location", parking: "私人停车位视供应情况；收费需预订时确认", parkingEn: "Private parking is subject to availability; confirm the charge", strengths: ["评分 9.0", "30 m² 带厨房与洗衣", "可取消价 NZD 247"], cautions: ["大床需视供应确认", "停车位不保证", "单晚厨房价值有限"], ratings: [{ platform: "Booking.com", score: "9.0 / 10", reviews: "1,000+ 条" }], roomTypes: [{ rateKey: "studio-double", name: "一室公寓 · 大床优先", size: "30 m²", bed: "1 张双人床（需视供应确认）", facilities: ["私人厨房", "洗衣机/烘干机", "洗碗机", "空调", "隔音", "免费 Wi-Fi"], images: [] }], hotelImages: [], rateSnapshots: { "2026-10-06/2026-10-07": { source: "Booking.com", roomKey: "studio-double", room: "一室公寓 · 30 m²", nonRefundableNzd: 234, refundableNzd: 247, cancelUntil: "2026-10-04", payment: "可取消档在 10 月 2 日前（不含当日）零付款", breakfast: "带厨房，不含早餐", quotedAt: "2026-07-27" } }, research: sharedSocial.christchurch, officialUrl: "https://www.questapartments.co.nz/properties/south-island/christchurch/quest-on-manchester/overview", bookingUrl: "https://www.booking.com/hotel/nz/quest-on-manchester.html", agodaUrl: "https://www.agoda.com/quest-on-manchester/hotel/christchurch-nz.html", position: [-43.5387, 172.6388], mapQuery: "Quest on Manchester Christchurch" },
  ],
  rotorua: [
    {
      id: "jetpark-rotorua", name: "JetPark Hotel Rotorua", recommendation: "单晚最实用", recommendationEn: "Best practical one-night stay", summary: "霍比屯后进城方便，免费停车；次晨退房向南约 8 分钟到 Te Puia，比湖景民宿更适合这段短住。", summaryEn: "Free parking and an easy eight-minute drive to Te Puia make it ideal for this one-night stop.", access: "镇中心步行范围；到 Te Puia 约 8 分钟车程；位置评分 8.9", accessEn: "Walkable to town and about 8 minutes to Te Puia; location score 8.9", parking: "房价含 1 个免费车位", parkingEn: "One free parking space included", strengths: ["翻新大床房", "免费停车与高速网络", "10 月 8 日前免费取消", "无需预付"], cautions: ["不是湖景度假型住宿", "单晚不需要公寓厨房", "Booking 页面链接偶尔返回旧版错误页"], ratings: [{ platform: "Booking.com", score: "8.3 / 10", reviews: "1,500+ 条" }], roomTypes: [{ rateKey: "superior-queen-king", name: "高级大床房", size: "26 m²", bed: "1 张大床（平台标注 queen/king，结算时确认）", facilities: ["空调", "独立浴室", "翻新客房", "高速 Wi-Fi", "免费停车"], images: [] }], hotelImages: [], rateSnapshots: { "2026-10-09/2026-10-10": { source: "Booking.com · Genius", roomKey: "superior-queen-king", room: "高级大床房 · 26 m²", nonRefundableNzd: null, refundableNzd: 296, cancelUntil: "2026-10-08", payment: "无需预付、到店付款", breakfast: "早餐另加 NZD 25/人；含早总价 NZD 341", quotedAt: "2026-07-27" } }, research: sharedSocial.rotorua, officialUrl: "https://www.jetparkrotorua.co.nz/", bookingUrl: "https://www.booking.com/hotel/nz/jet-park-rotorua.html", agodaUrl: "https://www.agoda.com/jet-park-hotel-rotorua/hotel/rotorua-nz.html", position: [-38.1435, 176.2495], mapQuery: "JetPark Hotel Rotorua",
    },
    { id: "millennium-rotorua", name: "Millennium Hotel Rotorua", recommendation: "湖景升级", recommendationEn: "Lake-view upgrade", summary: "位置更靠近湖与 Polynesian Spa，29 m² 湖景特大床和免费停车适合想把单晚变成度假体验的人。", summaryEn: "A lake-view king upgrade beside Polynesian Spa, with free parking.", access: "位置评分 9.2；Polynesian Spa 步行可达", accessEn: "Location score 9.2; walkable to Polynesian Spa", parking: "免费私人停车", parkingEn: "Free private parking", strengths: ["29 m² 湖景特大床", "免费停车", "10 月 8 日前免费取消", "泳池与温泉设施"], cautions: ["可取消价比 JetPark 高 NZD 93", "到 Te Puia 动线优势不明显", "早餐另加 NZD 40/人"], ratings: [{ platform: "Booking.com", score: "8.4 / 10", reviews: "3,000+ 条" }], roomTypes: [{ rateKey: "superior-balcony-king", name: "Superior Balcony 1 King", size: "29 m²", bed: "1 张超大号双人床", facilities: ["阳台", "湖景", "空调", "独立浴室", "泳池", "免费 Wi-Fi"], images: [] }], hotelImages: [], rateSnapshots: { "2026-10-09/2026-10-10": { source: "Booking.com", roomKey: "superior-balcony-king", room: "Superior Balcony 1 King · 29 m²", nonRefundableNzd: 370, refundableNzd: 389, cancelUntil: "2026-10-08", payment: "可取消档无需预付、到店付款", breakfast: "早餐另加 NZD 40/人；含早总价 NZD 459", quotedAt: "2026-07-27" } }, research: sharedSocial.rotorua, officialUrl: "https://www.millenniumhotels.com/en/rotorua/millennium-hotel-rotorua/", bookingUrl: "https://www.booking.com/hotel/nz/millennium-rotorua.html", agodaUrl: "https://www.agoda.com/millennium-hotel-rotorua/hotel/rotorua-nz.html", position: [-38.1385, 176.2574], mapQuery: "Millennium Hotel Rotorua" },
  ],
};
