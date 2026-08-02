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
    dates: "2026-10-08/2026-10-10",
    nights: 2,
    itineraryFit: [
      "10月8日15:10国内航班落地，预计傍晚前进城办理入住",
      "10月9日约06:30离开酒店，前往 SkyCity Coach Terminal 参加霍比屯往返大巴",
      "10月9日霍比屯大巴返回后继续住同一酒店，不换房也不租车",
      "10月10日退房后寄存行李，在奥克兰休闲活动并按国际航班时间前往机场",
    ],
    accommodationQuestion: "优先比较 Britomart / Commercial Bay 与 Newmarket 的酒店；只有核验到具体、可取消且含总价优势的整套 Airbnb 才加入。",
    status: "new-exact-dates-pending-reverification",
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
    status: "booked-direct-hermitage-confirmation-private",
  },
  oamaru: {
    place: "奥马鲁",
    dates: "2026-10-06/2026-10-07",
    nights: 1,
    itineraryFit: [
      "10月6日20:00参加奥马鲁小蓝企鹅保护区晚场，住宿要减少活动结束后的夜间驾驶",
      "次日继续自驾去基督城，需有停车位并方便早上出城",
      "只住一晚，不因民宿装修或额外床位牺牲位置、入住便利和退改",
    ],
    accommodationQuestion: "已完成精品套房、公寓民宿、自助客栈与传统酒店的多类型比选，并按10月6—7日、2人1间核验精确日期库存与官网总价；Mariner Suites 当前为首选，付款前仍需复核最新库存，以及各候选未完全公开的退改、停车或晚到安排。",
    status: "multi-type-exact-date-research-complete-booking-pending",
  },
  christchurch: {
    place: "基督城",
    dates: "2026-10-07/2026-10-08",
    nights: 1,
    itineraryFit: [
      "10月7日从奥马鲁自驾到基督城，抵达后需停车和方便步行游览",
      "10月8日早餐后退房，09:30左右驾车去机场并在途中加满油",
      "11:00还车后直接进入航站楼，准备13:50的JQ236航班，不再返回市中心",
    ],
    accommodationQuestion: "比较市中心有停车和可寄存行李的酒店与 aparthotel；按10月7—8日一晚含停车总价核验，只有具体 Airbnb 房源总价和位置明显更优才纳入。",
    status: "new-one-night-dates-pending-reverification",
  },
};
