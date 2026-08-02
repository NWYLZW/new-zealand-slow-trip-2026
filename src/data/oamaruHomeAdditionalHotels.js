const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";
const officialMediaRoot = "https://img1.wsimg.com/isteam/ip/1ffceef8-895d-4ea5-ab6d-86b4c671698a";

const officialImage = (fileName, label, labelEn, sourceFile) => ({
  src: `${imagePrefix}${fileName}`,
  label,
  labelEn,
  source: `Casa Nova House 官网・${sourceFile}`,
  sourceEn: `Casa Nova House official site · ${sourceFile}`,
  sourceUrl: `${officialMediaRoot}/${sourceFile}`,
  propertyId: "casa-nova-house-oamaru",
  reviewedAt: "2026-08-02",
});

const penYBrynMediaRoot = "https://www.penybryn.co.nz/wp-content/uploads";

const penYBrynImage = (fileName, label, labelEn, sourcePath) => ({
  src: `${imagePrefix}${fileName}`,
  label,
  labelEn,
  source: `Pen-y-bryn Lodge 官网 · Garden Room`,
  sourceEn: "Pen-y-bryn Lodge official site · Garden Room",
  sourceUrl: `${penYBrynMediaRoot}/${sourcePath}`,
  propertyId: "pen-y-bryn-lodge-oamaru",
  reviewedAt: "2026-08-02",
});

const casaNovaAttractions = [
  {
    name: "Ōamaru Blue Penguin Colony",
    nameEn: "Ōamaru Blue Penguin Colony",
    distance: "约 5.0 公里",
    distanceEn: "About 5.0 km",
    travelTime: "驾车约 8—10 分钟；企鹅晚场后需提前约定晚到",
    travelTimeEn: "About 8–10 minutes by car; arrange late arrival before the evening penguin visit",
    destinationQuery: "Oamaru Blue Penguin Colony",
  },
  {
    name: "Victorian Precinct",
    nameEn: "Victorian Precinct",
    distance: "约 4.0 公里",
    distanceEn: "About 4.0 km",
    travelTime: "驾车约 7—9 分钟",
    travelTimeEn: "About 7–9 minutes by car",
    destinationQuery: "Victorian Precinct Oamaru",
  },
];

export const oamaruHomeAdditionalHotels = [
  {
    id: "casa-nova-house-oamaru",
    name: "Casa Nova House",
    stayType: "home",
    isResearchPlaceholder: true,
    recommendation: "仅 3 间客房的历史 B&B",
    recommendationEn: "Three-room heritage B&B",
    summary:
      "1861 年的奥马鲁石材宅邸，经营为仅三间客房的成人向精品 B&B。推荐 Borton Chamber：一张 King 床、独立卫浴，并包含热食与欧陆式选择的早餐；它不是整租公寓，也没有供住客烹饪的完整厨房。",
    summaryEn:
      "An adults-only boutique B&B in an 1861 Oamaru-stone mansion with just three guest rooms. The recommended Borton Chamber has one king bed, a private en-suite and breakfast with a cooked menu plus continental choices. It is not a whole apartment and does not provide a full guest kitchen.",
    access: "1 Alt Street，Oamaru North；15:00 起入住，10:30 前退房",
    accessEn: "1 Alt Street, Oamaru North; check-in from 15:00 and check-out before 10:30",
    parking: "Booking.com 物业页列明免费私人停车；官网未说明车位数与晚到保留方式，须预订前直接确认",
    parkingEn: "Booking.com's property page lists free private parking. The official site does not state the space count or late-arrival holding procedure, so confirm both direct before booking",
    nearbyAttractions: casaNovaAttractions,
    strengths: [
      "仅三间客房，是真正的历史宅邸 B&B，不是 Motel 换标签",
      "Borton Chamber 明确为 King 床与独立卫浴",
      "每次住宿包含厨师热食菜单和欧陆式早餐",
      "Tripadvisor 5.0 / 5，36 条旅行者评价",
    ],
    strengthsEn: [
      "A genuine three-room heritage B&B rather than a motel relabelled as a home stay",
      "The Borton Chamber explicitly has a king bed and private en-suite",
      "Every stay includes a chef-prepared cooked menu and continental breakfast choices",
      "Rated 5.0/5 from 36 Tripadvisor traveller reviews",
    ],
    cautions: [
      "未取得 2026 年 10 月 6—7 日、2 人 1 间的可重复库存与总价，暂不可选",
      "不是整租；公共备餐区只有微波炉、热水、茶和咖啡，不应当作完整厨房",
      "所有客房在二楼且只能走楼梯；仅18岁以上住宿",
      "企鹅晚场结束时可能超过常规到店时间，须事先约定晚到",
    ],
    cautionsEn: [
      "Reproducible inventory and a total for 6–7 Oct 2026, two guests and one room have not been obtained, so it is not selectable yet",
      "This is not a whole-home stay; the shared refreshment area has a microwave, hot water, tea and coffee, not a full kitchen",
      "All rooms are upstairs with stair-only access, and accommodation is restricted to guests aged 18 and over",
      "The penguin session may finish after normal arrival hours, so late arrival must be agreed in advance",
    ],
    roomTypes: [
      {
        rateKey: "borton-chamber",
        name: "Borton Chamber",
        nameEn: "Borton Chamber",
        size: "官网未公布",
        sizeEn: "Not published by the official site",
        bed: "1 张 King 床 · 本次两人同住备选",
        bedEn: "One king bed · shortlisted for this two-person stay",
        photosVerified: true,
        facilities: ["独立卫浴与大淋浴间", "包早餐", "空调", "小冰箱与迷你吧", "Nespresso 咖啡机", "免费 Wi-Fi"],
        facilitiesEn: ["Private en-suite with large shower", "Breakfast included", "Air conditioning", "Mini-fridge and minibar", "Nespresso machine", "Free Wi-Fi"],
        images: [
          officialImage("oamaru-casa-nova-borton-room.jpg", "Borton Chamber 的 King 床与奥马鲁石特色墙", "Borton Chamber king bed and Oamaru-stone feature wall", "CasanovaHouse-143.jpg"),
          officialImage("oamaru-casa-nova-borton-bed-detail.jpg", "Borton Chamber 床铺与墙面细节", "Borton Chamber bedding and wall detail", "casanova-12.jpg"),
          officialImage("oamaru-casa-nova-ensuite-detail.jpg", "Casa Nova 客房卫浴的瓷砖与洗护用品细节", "Casa Nova guest en-suite tile and amenity detail", "CasanovaHouse-110.jpg"),
        ],
      },
    ],
    hotelImages: [
      officialImage("oamaru-casa-nova-aerial.jpg", "Casa Nova House 与 Oamaru North 周边航拍", "Casa Nova House and its Oamaru North setting from above", "Photo_6553606_DJI_6_jpg_4231240_0_202172411726.jpg"),
      officialImage("oamaru-casa-nova-breakfast-room.jpg", "Casa Nova House 早餐用餐空间", "Casa Nova House breakfast dining room", "CasanovaHouse-79.jpg"),
      officialImage("oamaru-casa-nova-coffee-station.jpg", "住客公共备餐区的 Nespresso 咖啡与茶", "Nespresso coffee and tea in the shared guest refreshment area", "Guest%20Mini%20Bars.jpg"),
      officialImage("oamaru-casa-nova-hallway.jpg", "Casa Nova House 历史宅邸内部走廊", "Heritage interior hallway at Casa Nova House", "CasanovaHouse-62.jpg"),
    ],
    ratings: [
      {
        platform: "Tripadvisor",
        platformEn: "Tripadvisor",
        score: "5.0 / 5",
        scoreEn: "5.0 / 5",
        reviews: "36 条旅行者评价",
        reviewsEn: "36 traveller reviews",
        sourceUrl: "https://www.tripadvisor.com/Hotel_Review-g255677-d23508430-Reviews-Casa_Nova_House-Oamaru_Otago_Region_South_Island.html",
        reviewedAt: "2026-08-02",
      },
    ],
    availabilityNote:
      "2026-08-02 已核对官网 Borton Chamber、入退房、含早餐、公共备餐区和取消条款；官方 SiteMinder 预订入口可打开，但可保存响应未给出 10 月 6—7 日、2 人的可重复库存、总价与退改结果，因此仅作调研参考。",
    availabilityNoteEn:
      "The official Borton Chamber, check-in/out, included breakfast, shared refreshment area and cancellation terms were checked on 2 Aug 2026. The SiteMinder direct-booking entry opens, but its saved response did not expose reproducible inventory, total or rate terms for 6–7 Oct and two guests, so this remains a research reference only.",
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-08-02 已核对 Casa Nova House 官网与官方预订入口；房型和设施证据完整，但目标日期库存、含税总价、扣款和完整退改无法在静态响应中复现，未展示任何推测价格。",
    officialStatusEn:
      "The Casa Nova House site and direct-booking entry were checked on 2 Aug 2026. Room and facility evidence is complete, but target-date inventory, a tax-inclusive total, charge timing and full cancellation terms were not reproducible from the saved response; no inferred price is displayed.",
    officialVerifiedAt: "2026-08-02",
    officialLinkRetainsSearch: false,
    officialLinkLabel: "打开官方预订页并重新选择日期",
    officialLinkLabelEn: "Open direct booking and reselect the dates",
    officialLinkNote: "请重新选择 2026 年 10 月 6—7 日、2 人、1 间 Borton Chamber，付款前确认库存、含税总价、取消、停车和企鹅晚场后的到店安排。",
    officialLinkNoteEn: "Reselect 6–7 Oct 2026 for two guests and one Borton Chamber, then confirm inventory, the tax-inclusive total, cancellation, parking and arrival after the penguin session before paying.",
    officialUrl: "https://casanovahouse.co.nz/suites",
    officialBookingUrl: "https://book-directonline.com/properties/casanovahouse",
    position: [-45.074159, 170.980199],
    mapQuery: "Casa Nova House 1 Alt Street Oamaru",
  },
  {
    id: "pen-y-bryn-lodge-oamaru",
    name: "Pen-y-bryn Lodge",
    stayType: "home",
    isResearchPlaceholder: true,
    recommendation: "五客房历史宅邸精品 Lodge",
    recommendationEn: "Five-room heritage boutique lodge",
    summary:
      "1889 年历史宅邸改造的主人经营精品 Lodge，仅有五间客房。推荐 Annex 二楼的 45 m² Garden Room：一张可拆成双床的 Super King、独立起居区，以及带地暖、独立超大浴缸和淋浴的卫浴。官网起价包含现做早餐、餐前小食、welcome drink 与税，但它不是本次目标日期报价。",
    summaryEn:
      "An owner-operated boutique lodge in an 1889 heritage home with only five guest rooms. The recommended 45 m² upstairs Garden Room in the Annex has a super-king bed convertible to twin king singles, a separate sitting area and an en-suite with underfloor heating, an oversized bath and a separate shower. The published starting rate includes cooked breakfast, pre-dinner canapés, a welcome drink and tax, but is not a quote for this trip's dates.",
    access: "41 Towey Street，Holmes Hill；14:30 起入住、10:30 前退房；Annex 客房只能走楼梯",
    accessEn: "41 Towey Street, Holmes Hill; check-in from 14:30 and check-out by 10:30; Annex rooms are accessible only by stairs",
    parking: "官网 FAQ 明确前门有 5 个免费车位，恰好每间客房 1 个；另有 Tesla 目的地充电和普通三脚插座慢充",
    parkingEn: "The official FAQ confirms five complimentary spaces at the front entrance, one per guest room, plus Tesla destination charging and a slow standard three-pin charging bay",
    nearbyAttractions: [
      {
        name: "Ōamaru Blue Penguin Colony",
        nameEn: "Ōamaru Blue Penguin Colony",
        distance: "直线约 2.0 公里",
        distanceEn: "About 2.0 km direct distance",
        travelTime: "驾车约 5—7 分钟；企鹅晚场后到店须提前协调",
        travelTimeEn: "About 5–7 minutes by car; arrange arrival after the evening penguin viewing in advance",
        destinationQuery: "Oamaru Blue Penguin Colony",
      },
      {
        name: "Victorian Precinct",
        nameEn: "Victorian Precinct",
        distance: "直线约 1.2 公里",
        distanceEn: "About 1.2 km direct distance",
        travelTime: "驾车数分钟，或步行约 15—20 分钟；返程上坡",
        travelTimeEn: "A few minutes by car or about 15–20 minutes on foot, with an uphill return",
        destinationQuery: "Victorian Precinct Oamaru",
      },
      {
        name: "Oamaru Public Gardens",
        nameEn: "Oamaru Public Gardens",
        distance: "直线约 0.9 公里",
        distanceEn: "About 0.9 km direct distance",
        travelTime: "驾车约 3—5 分钟",
        travelTimeEn: "About 3–5 minutes by car",
        destinationQuery: "Oamaru Public Gardens",
      },
    ],
    strengths: [
      "仅五间客房的主人经营历史宅邸旅宿，不是普通 Motel 换标签",
      "Garden Room 为 45 m²，Super King 可拆双床，并有独立起居区",
      "卫浴有地暖、独立超大浴缸和淋浴；房价起价包含早餐、小食、welcome drink 与税",
      "KAYAK 评分 9.8 / 10，共 63 条评分",
      "每间客房对应一个免费停车位，并提供两种慢速电动车充电",
    ],
    strengthsEn: [
      "A genuine owner-operated five-room heritage stay rather than a conventional motel relabelled as a home stay",
      "The 45 m² Garden Room has a super-king bed convertible to twins and its own sitting area",
      "The en-suite has underfloor heating, a separate oversized bath and shower; published rates include breakfast, canapés, a welcome drink and tax",
      "Rated 9.8/10 from 63 KAYAK ratings",
      "One complimentary parking space is available per room, with two forms of slow EV charging",
    ],
    cautions: [
      "官方目标日期入口未返回可重复的 2026 年 10 月 6—7 日库存与总价，暂不可选",
      "官网 NZD 675 仅为两人 Garden Room 公开起价，不是本次日期报价，不参与价格比较",
      "Garden Room 在 Annex 二楼且只能走楼梯，不适合行动不便者",
      "官网没有公布最晚入住时间；企鹅晚场后到店必须提前电话或邮件协调",
      "一般取消期为 30 天：之后至入住前 15 天收 25%，再晚收 100%",
    ],
    cautionsEn: [
      "The official target-date entry did not expose reproducible inventory or a total for 6–7 Oct 2026, so this option is not selectable yet",
      "NZD 675 is only the published starting rate for two guests in the Garden Room, not a quote for this stay, and is excluded from price comparison",
      "The Garden Room is upstairs in the Annex with stair-only access and is unsuitable for guests with limited mobility",
      "The official site does not publish a latest arrival time; arrival after the penguin viewing must be arranged by phone or email",
      "The normal cancellation window is 30 days: a 25% fee then applies until 15 days before arrival, followed by a 100% fee",
    ],
    roomTypes: [
      {
        rateKey: "garden-room",
        name: "Garden Room",
        nameEn: "Garden Room",
        size: "45 m²",
        sizeEn: "45 m²",
        bed: "1 张 Super King，可应要求拆为 2 张 King Single · 2—3 人",
        bedEn: "One super-king convertible on request to two king singles · sleeps 2–3",
        photosVerified: true,
        facilities: ["独立起居区", "独立卫浴", "地暖瓷砖", "独立超大浴缸和淋浴", "电视", "Nespresso 咖啡机", "空调与全年温控", "免费 Wi-Fi"],
        facilitiesEn: ["Private sitting area", "Private en-suite", "Heated tile floor", "Separate oversized bath and shower", "Television", "Nespresso machine", "Air conditioning and year-round climate control", "Free Wi-Fi"],
        images: [
          penYBrynImage("oamaru-pen-y-bryn-garden-room-hero.jpg", "Garden Room 的 Super King 床与独立起居区全景", "Garden Room super-king bed and private sitting area", "2021/03/jg-20210304-Canon-EOS-R5-14-Edit-Small.jpg"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-01.webp", "Garden Room 起居区与花园景观窗", "Garden Room sitting area and garden-view window", "2021/01/garden2-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-02.webp", "Garden Room 的 Super King 床", "Garden Room super-king bed", "2021/03/jg-20210304-Canon-EOS-R5-15-Small-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-03.webp", "Garden Room 从起居区望向床铺和备餐区", "Garden Room view from the sitting area towards the bed and refreshment nook", "2021/03/jg-20210304-Canon-EOS-R5-13-Small-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-04.webp", "Garden Room 起居空间与花园景观", "Garden Room sitting space and garden outlook", "2021/01/Penybryn-497-Large-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-05.webp", "Garden Room 的床铺、沙发与双面采光", "Garden Room bed, sofa and dual-aspect windows", "2021/01/Penybryn-499-Large-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-06.webp", "Garden Room 的双床可转换床头细节", "Garden Room convertible twin-headboard detail", "2021/01/Penybryn-529-Large-900x600-c-default.webp"),
          penYBrynImage("oamaru-pen-y-bryn-garden-room-07.webp", "Garden Room 起居区家具细节", "Garden Room sitting-room furniture detail", "2021/01/Penybryn-551-T-Large-900x600-c-default.webp"),
        ],
      },
    ],
    ratings: [
      {
        platform: "KAYAK",
        platformEn: "KAYAK",
        score: "9.8 / 10",
        scoreEn: "9.8 / 10",
        reviews: "63 条评分",
        reviewsEn: "63 ratings",
        sourceUrl: "https://www.kayak.com/Oamaru-Hotels-Pen-Y-Bryn-Lodge.97828.ksp",
        reviewedAt: "2026-08-02",
      },
    ],
    availabilityNote:
      "官网公开 Garden Room 两人含早餐、餐前小食、welcome drink 和全部税费的起价为 NZD 675；该数字不是 2026 年 10 月 6—7 日报价，因此不显示为本次价格。",
    availabilityNoteEn:
      "The official site publishes a starting rate of NZD 675 for two guests in the Garden Room, including breakfast, pre-dinner canapés, a welcome drink and all taxes. It is not a quote for 6–7 Oct 2026 and is therefore not displayed as this stay's price.",
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-08-02 已核验官网 Garden Room、设施、停车与政策；带入 2026 年 10 月 6—7 日、2 人的官方预订入口未返回可重复的房型库存、总价和对应退改，故仅作不可选调研参考。",
    officialStatusEn:
      "On 2 Aug 2026 the official Garden Room, facilities, parking and policies were verified. The direct booking entry carrying 6–7 Oct 2026 and two guests did not return reproducible room inventory, a total or matching rate terms, so this remains a non-selectable research reference.",
    officialVerifiedAt: "2026-08-02",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入日期和人数的官网预订入口",
    officialLinkLabelEn: "Open the direct entry with dates and guests prefilled",
    officialLinkNote: "入口已带入 2026 年 10 月 6—7 日、2 人和 NZD；请在结果页确认 Garden Room 的实际库存、含税总价、扣款和取消条款，不能把 NZD 675 起价当作本次报价。",
    officialLinkNoteEn: "The entry carries 6–7 Oct 2026, two guests and NZD. Confirm actual Garden Room inventory, the tax-inclusive total, charge timing and cancellation terms on the results page; do not treat the NZD 675 starting rate as this stay's quote.",
    officialUrl: "https://www.penybryn.co.nz/room/garden-room/",
    officialBookingUrl: "https://app-apac.thebookingbutton.com/properties/penybrynlodgedirect?check_in_date=2026-10-06&check_out_date=2026-10-07&number_adults=2&number_children=0&number_infants=0&currency=NZD",
    position: [-45.10585, 170.95583],
    mapQuery: "Pen-y-bryn Lodge 41 Towey Street Oamaru",
  },
];
