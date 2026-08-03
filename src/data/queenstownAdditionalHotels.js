const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";
const roomPage = "https://villadellago.nz/rooms/1-bedroom-lakefront/";

const roomImage = (index, label, labelEn) => ({
  src: `${imagePrefix}queenstown-villa-del-lago-one-bedroom-lakefront-${index}.jpg`,
  label,
  labelEn,
  source: `Villa del Lago 官网 · 1 Bedroom Lakefront 图 ${index}`,
  sourceEn: `Villa del Lago official site · 1 Bedroom Lakefront image ${index}`,
  sourceUrl: `https://villadellago.nz/wp-content/uploads/2020/03/1-Bedroom-Lakefront-${index}.jpg`,
  propertyId: "villa-del-lago-queenstown",
  reviewedAt: "2026-08-02",
});

export const queenstownAdditionalHotels = [
  {
    id: "villa-del-lago-queenstown",
    stayType: "home",
    name: "Villa del Lago Queenstown",
    recommendation: "湖滨一卧整套公寓",
    recommendationEn: "Lakefront one-bedroom apartment",
    summary:
      "249 Frankton Road 的湖滨公寓。推荐 1 Bedroom Lakefront：整套空间只住两人，带完整厨房、私人洗衣、客厅与壁炉；官网六张图均对应这个具体房型，适合把四晚住得更像家。",
    summaryEn:
      "A lakefront apartment at 249 Frankton Road. The recommended 1 Bedroom Lakefront is a self-contained stay for two with a full kitchen, private laundry, living room and gas fireplace. All six official images belong to this exact category.",
    access: "Frankton Walking Trail 湖边；驾车约 6 分钟到皇后镇中心，步行约 20 分钟到 Queenstown Gardens",
    accessEn: "On the Frankton Walking Trail; about 6 minutes by car to central Queenstown and 20 minutes on foot to Queenstown Gardens",
    parking: "官网设施页明确提供免费停车；具体车位分配和晚到取钥匙方式需预订前确认",
    parkingEn: "The official facilities page confirms free parking; confirm space allocation and late key collection before booking",
    nearbyAttractions: [
      {
        name: "Queenstown Gardens",
        nameEn: "Queenstown Gardens",
        distance: "约 1.6 公里",
        distanceEn: "About 1.6 km",
        travelTime: "沿湖步行约 20 分钟",
        travelTimeEn: "About 20 minutes on foot along the lake",
        destinationQuery: "Queenstown Gardens",
      },
      {
        name: "Steamer Wharf · Walter Peak 码头",
        nameEn: "Steamer Wharf · Walter Peak jetty",
        distance: "约 2.2 公里",
        distanceEn: "About 2.2 km",
        travelTime: "驾车约 6 分钟；步行约 30 分钟",
        travelTimeEn: "About 6 minutes by car or 30 minutes on foot",
        destinationQuery: "Steamer Wharf Queenstown",
      },
      {
        name: "Frankton Walking Trail",
        nameEn: "Frankton Walking Trail",
        distance: "住宿旁",
        distanceEn: "Beside the property",
        travelTime: "步行数分钟可到湖边步道",
        travelTimeEn: "A few minutes on foot to the lakeside trail",
        destinationQuery: "Frankton Walking Trail Queenstown",
      },
    ],
    strengths: [
      "六张官网图片全部对应 1 Bedroom Lakefront",
      "整套一卧公寓，完整厨房、私人洗衣和起居室齐全",
      "湖景露台、燃气壁炉并可直接走到湖边步道",
      "官网明确免费停车",
    ],
    strengthsEn: [
      "All six official images belong to the 1 Bedroom Lakefront category",
      "A whole one-bedroom apartment with full kitchen, private laundry and living room",
      "Lake outlook, private patio, gas fireplace and direct trail access",
      "The official site explicitly confirms free parking",
    ],
    cautions: [
      "官网当前仅提供电话／联系表单的预订咨询，无法在线取得目标四晚库存和总价",
      "到 Steamer Wharf 步行距离比镇中心公寓长",
      "晚到取钥匙、取消条款和实际车位需付款前确认",
    ],
    cautionsEn: [
      "The current official site offers reservation enquiries by phone/contact form only, not online target-stay inventory or a total",
      "The walk to Steamer Wharf is longer than from a central apartment",
      "Confirm late key collection, cancellation terms and the actual parking space before payment",
    ],
    roomTypes: [
      {
        rateKey: "one-bedroom-lakefront",
        name: "1 Bedroom Lakefront",
        nameEn: "1 Bedroom Lakefront",
        size: "官网未标明",
        sizeEn: "Not published by the official site",
        bed: "1 张床 · 最多 2 人",
        bedEn: "One bed · maximum two guests",
        photosVerified: true,
        facilities: ["完整厨房", "私人洗衣", "独立浴室", "客厅与用餐区", "燃气壁炉", "私人露台", "免费 Wi-Fi"],
        facilitiesEn: ["Full kitchen", "Private laundry", "Private bathroom", "Living and dining area", "Gas fireplace", "Private patio", "Free Wi-Fi"],
        images: [
          roomImage(1, "一卧湖滨公寓客厅与湖景", "One-bedroom lakefront living room and lake view"),
          roomImage(2, "一卧湖滨公寓卧室", "One-bedroom lakefront bedroom"),
          roomImage(3, "一卧湖滨公寓厨房与用餐区", "One-bedroom lakefront kitchen and dining area"),
          roomImage(4, "一卧湖滨公寓浴室", "One-bedroom lakefront bathroom"),
          roomImage(5, "一卧湖滨公寓起居空间", "One-bedroom lakefront living space"),
          roomImage(6, "一卧湖滨公寓露台与湖景", "One-bedroom lakefront patio and lake view"),
        ],
      },
    ],
    hotelImages: [],
    ratings: [
      {
        platform: "Tripadvisor",
        platformEn: "Tripadvisor",
        score: "4.0 / 5",
        scoreEn: "4.0 / 5",
        reviews: "686 条住客评价",
        reviewsEn: "686 traveller reviews",
        sourceUrl: "https://www.tripadvisor.com/Hotel_Review-g255122-d630336-Reviews-Villa_del_Lago-Queenstown_Otago_Region_South_Island.html",
        reviewedAt: "2026-08-02",
      },
    ],
    availabilityNote:
      "2026-08-03 已核对官网具体房型、设施、地址和六张对应图片。此前保存的官网 /book-direct/ 入口现返回 404；首页、房型页和预订政策页均未提供日期／库存／报价引擎，官网 Contact 页面明确将预订归为电话或联系表单的 Reservations & Enquiries。因此无法在线取得 2026 年 9 月 29 日—10 月 3 日、2 人 1 套的库存、含税总价或退改结果；这不是无房，且不能作为可直接选择的住宿。",
    availabilityNoteEn:
      "The exact official category, facilities, address and six matching images were checked on 3 Aug 2026. The previously saved official /book-direct/ entry now returns a 404; the home, room and reservation-policy pages expose no date, inventory or quote engine, while the Contact page explicitly routes reservations and enquiries to a phone/contact form. An online inventory result, tax-inclusive total and cancellation terms for 29 Sep–3 Oct 2026 and two guests are therefore not obtainable. This is not sold-out evidence and the option is not directly selectable.",
    officialStatus: "official-inquiry-only",
    officialStatusDetail:
      "2026-08-03 已核对 1 Bedroom Lakefront 为两人、一床、一浴室，并确认完整厨房、私人洗衣、免费停车和六张对应房型图。此前保存的 /book-direct/ 官网入口现为 404；首页、房型页和预订政策页没有日期选择或库存引擎，官网 Contact 页面将预订列为电话／联系表单的 Reservations & Enquiries。目标四晚库存与价格只能向酒店询问，当前无法在线复现；这不是目标日期无房的证据。",
    officialStatusEn:
      "Checked on 3 Aug 2026: the 1 Bedroom Lakefront is for two guests with one bed and one bathroom, and the official pages confirm a full kitchen, private laundry, free parking and six matching category images. The previously saved /book-direct/ entry now returns a 404; the home, room and reservation-policy pages have no date-selectable booking engine, and the official Contact page directs reservations and enquiries to a phone/contact form. Exact four-night inventory and pricing can only be requested from the property, and this is not evidence that the target dates are sold out.",
    officialVerifiedAt: "2026-08-03",
    officialLinkRetainsSearch: false,
    officialLinkLabel: "打开官网联系页，询问目标日期库存",
    officialLinkLabelEn: "Open official contact page to enquire about target-date availability",
    officialLinkNote:
      "官网当前没有线上预订引擎，Contact 页面将预订列为 Reservations & Enquiries。若自行向酒店询问，请提供 2026 年 9 月 29 日—10 月 3 日、2 人、1 套，并在付款前取得含税总价、取消截止、晚到取钥匙和停车位的书面确认。",
    officialLinkNoteEn:
      "The official site currently has no online booking engine and its Contact page directs reservations to Reservations & Enquiries. If you contact the property, ask for 29 Sep–3 Oct 2026 for two guests and one apartment, then obtain written confirmation of the tax-inclusive total, cancellation deadline, late key collection and parking space before paying.",
    officialUrl: "https://villadellago.nz/contact-us/",
    position: [-45.0334722, 168.6821944],
    mapQuery: "Villa del Lago 249 Frankton Road Queenstown",
  },
];
