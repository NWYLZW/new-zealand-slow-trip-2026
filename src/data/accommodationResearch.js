export const accommodationResearchMethod = {
  priorityOrder: [
    "当日及次日行程动线",
    "到达、退房与取还车时间的可执行性",
    "酒店房型是否为大床；民宿则比较实际空间与设施",
    "酒店官网或民宿官方发布页的精确日期库存与条款",
    "对应日期含税总价、退订条件与停车总成本",
    "平台评分、照片与社交媒体口碑",
  ],
  sourcePriority: [
    "酒店官网 / 民宿官方发布页（Airbnb 房源页视为房东官方发布页）",
    "Booking.com 精确日期详情页",
    "Agoda 精确日期详情页，仅作补充比价",
    "社交媒体只用于口碑、选址和踩坑背景，不证明库存或价格",
  ],
  scoring: {
    itineraryFit: 40,
    arrivalAndTransport: 20,
    roomAndFacilities: 15,
    datedTotalCost: 15,
    reviewsAndSocialEvidence: 10,
  },
  rules: [
    "先淘汰会显著增加当天折返、搬行李或误机风险的住宿，再比较价格与评分。",
    "多晚住宿同时展示总价和单晚价；单晚住宿只展示总价。",
    "酒店与民宿统一按住宿费、税费、清洁费、停车费后的实际总成本比较。",
    "有独立官网的住宿必须优先实际打开官网，带入精确日期、2 人 1 间并核对对应房型、含税总价、早餐、付款和退改；官网宣传页或“起价”不能冒充精确日期报价。",
    "官网只能确认酒店、房型或设施而无法取得精确日期结算价时，必须明确标为“官网已确认基础信息，精确日期价格未取得”，再使用已核验的 Booking.com 精确日期价格。",
    "Agoda 仅作补充比价；只有真实打开对应详情页并核验同一日期、人数、房型、含税总价和退改后才能展示报价。",
    "酒店仅保留大床房；整套民宿不限制卧室数、床型或床位数，只要能舒适入住 2 人，并按总价、位置、评价、取消政策和行程动线比较。",
    "没有核验到具体且适合本段行程的 Airbnb 房源时，不显示 Airbnb 入口。",
  ],
};

export const accommodationResearch = {
  "auckland-city": {
    place: "奥克兰市中心",
    dates: "2026-10-07/2026-10-09",
    nights: 2,
    itineraryFit: [
      "10月7日21:50国内航班落地后能顺利进城并办理晚到入住",
      "10月8日步行覆盖 Queen Street、Britomart 与 Commercial Bay，去 Newmarket 交通直接",
      "10月9日退房后能在08:30前后抵达奥克兰机场取车",
    ],
    accommodationQuestion: "优先比较 Britomart / Commercial Bay 与 Newmarket 的酒店；只有核验到具体、可取消且含总价优势的整套 Airbnb 才加入。",
    status: "pending-iab-verification",
  },
  queenstown: {
    place: "皇后镇",
    dates: "2026-09-29/2026-10-03",
    nights: 4,
    itineraryFit: [
      "连续四晚不换住宿，能步行到镇中心、湖边、Queenstown Gardens 与 Steamer Wharf",
      "9月29日机场取车后和10月1日格林诺奇、10月3日离城自驾都需要可靠停车",
      "Walter Peak 当天不用开车，住宿到码头的步行动线优先于单纯湖景",
    ],
    accommodationQuestion: "比较带免费停车的 motel / lodge、标准酒店与具体整套 Airbnb；四晚总价必须包含停车和清洁费。",
    status: "pending-iab-verification",
  },
  wanaka: {
    place: "瓦纳卡",
    dates: "2026-10-03/2026-10-05",
    nights: 2,
    itineraryFit: [
      "连续两晚，10月4日主要在湖边与镇中心活动",
      "10月3日经 Crown Range 抵达、10月5日早上去库克山，免费停车和出城便利重要",
      "湖畔度假感与步行吃饭之间需要平衡，不为只看景牺牲两天动线",
    ],
    accommodationQuestion: "比较湖畔 resort、镇中心酒店/motel 与带厨房的具体整套 Airbnb；把清洁费与停车计入两晚总价。",
    status: "pending-iab-verification",
  },
  "mount-cook": {
    place: "奥拉基 / 库克山",
    dates: "2026-10-05/2026-10-06",
    nights: 1,
    itineraryFit: [
      "10月5日先到 Mount Cook Airport 报到直升机，傍晚入住后还要晚餐与 Big Sky Stargazing",
      "10月6日若直升机取消，需要方便参加08:30候补首班并尽快退房上路",
      "仅住一晚，位置与天气备选价值高于厨房；必须确认2026年施工影响",
    ],
    accommodationQuestion: "同时比较库克山村、普卡基湖、Braemar Station、Ben Ohau 与 Twizel 的真实可订大床酒店/旅馆及整套民宿；酒店按大床偏好筛选，民宿不限卧室和床位数量，把 Big Sky 后夜间驾驶和次晨候补直升机时间作为核心代价。",
    status: "booked-direct-hermitage-r2009c",
  },
  christchurch: {
    place: "基督城",
    dates: "2026-10-06/2026-10-07",
    nights: 1,
    itineraryFit: [
      "10月6日长途自驾后约17:30入住，需要停车和晚到便利",
      "10月7日上午安排 Riverside Market、植物园或咖啡，市区步行效率重要",
      "15:30前往 Budget 基督城机场网点还车并准备20:30航班，离城路线不能太绕",
    ],
    accommodationQuestion: "比较市中心有停车的酒店与 aparthotel；单晚 Airbnb 清洁费通常不利，只有具体房源总价明显更低才纳入。",
    status: "pending-iab-verification",
  },
  rotorua: {
    place: "罗托鲁瓦",
    dates: "2026-10-09/2026-10-10",
    nights: 1,
    itineraryFit: [
      "10月9日霍比屯后约16:30抵达，方便停车、晚餐和可选 Redwoods 短停",
      "10月10日09:00前往 Te Puia，退房与南侧出城动线重要",
      "单晚不为厨房支付额外清洁费，房间翻新、隔音与免费停车更实用",
    ],
    accommodationQuestion: "比较镇中心酒店/motel 与 Te Puia 周边酒店；具体 Airbnb 仅在停车、晚到入住和单晚含费总价均有优势时加入。",
    status: "pending-iab-verification",
  },
};
