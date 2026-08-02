import { queenstownAdditionalHotels } from "../queenstownAdditionalHotels.js";
import { googleGuestRating, image, sharedSocial } from "./shared.js";

export const queenstownHotels = [
    ...queenstownAdditionalHotels,
    {
      id: "the-rees-queenstown",
      stayType: "hotel",
      name: "The Rees Hotel & Luxury Apartments",
      recommendation: "湖景品质",
      recommendationEn: "Lake-view quality",
      summary:
        "房间和服务更好，并有免费镇中心接驳；但离码头约 2.2 公里且四晚价格高很多。",
      summaryEn:
        "Better rooms and a town shuttle, but farther from the wharf and much more expensive.",
      access: "距中心约 2.2 公里；提供镇中心接驳",
      accessEn: "About 2.2 km from the centre with a town shuttle",
      parking: "免费私人停车",
      parkingEn: "Free private parking",
      nearbyAttractions: [
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 2.2 公里",
          travelTime: "酒店接驳或驾车约 6—8 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 2.5 公里",
          travelTime: "驾车约 7—9 分钟",
          destinationQuery: "Queenstown Gardens",
        },
        {
          name: "Glenorchy 公路起点",
          distance: "约 3 公里",
          travelTime: "驾车约 8 分钟",
          destinationQuery: "Glenorchy Queenstown Road",
        },
      ],
      strengths: [
        "展示的湖景特大床房已有对应房型图片与精确日期报价",
        "免费停车与镇中心接驳",
        "评分 8.7",
      ],
      strengthsEn: [
        "The displayed lake-view king has exact-category photos and an exact-date quote",
        "Free parking and a town-centre shuttle",
        "8.7 rating",
      ],
      cautions: [
        "四晚总价高",
        "官网前两类客房写 Super King 或 Twin；直订时必须备注并让酒店确认 King，不能只凭官网类别名保证床型",
        "Walter Peak 当天不如步行酒店直接",
        "Booking 免费取消至 9 月 22 日；官网首晚押金档采用分段取消规则",
      ],
      cautionsEn: [
        "High four-night total",
        "The first two direct room categories allow either a super king or twin king singles; request and confirm a king when booking direct",
        "Less convenient than a walkable hotel on the Walter Peak day",
        "Booking.com is cancellable through 22 Sep; the direct first-night-deposit plan uses staged cancellation charges",
      ],
      ratings: [
        { platform: "Booking.com", score: "8.7 / 10", reviews: "1,000+ 条" },
      ],
      roomTypes: [
        {
          rateKey: "lake-view-king",
          name: "湖景特大床房（Booking 保证 King）",
          size: "34 m²",
          bed: "Booking 明确 1 张超大号双人床；官网对应类别可能为 Super King 或 Twin",
          photosVerified: true,
          facilities: ["湖景", "私人浴室", "空调", "免费 Wi-Fi"],
          images: [
            image("rees-lake-king-1.jpg", "湖景特大床房卧室"),
            image("rees-lake-king-2.jpg", "湖景特大床房休息区"),
            image("rees-lake-king-3.jpg", "湖景特大床房浴室"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "当前仅展示有对应房型图片的 Lake View King。The Rees 官网已按 2026 年 9 月 29 日—10 月 3 日、2 人 1 间核验对应 Lake View Hotel Room；官网床型写 Super King 或 Twin King Singles，若直订必须备注并让酒店书面确认 King。Booking.com 对应房型明确为纯 King。",
      availabilityNoteEn:
        "Only the Lake View King with exact-category photos remains displayed. Its matching direct Lake View Hotel Room was verified for 29 Sep–3 Oct 2026, two adults and one room. The direct category allows either a super king or twin king singles, so request written king-bed confirmation when booking direct; the matching Booking.com category explicitly guarantees a king.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          roomRates: {
            "lake-view-king": {
              official: {
                source: "The Rees 官网",
                roomKey: "lake-view-king",
                room: "湖景酒店客房 · 30—35 m²",
                roomEn: "Lake View Hotel Room · 30–35 m²",
                nonRefundableNzd: 2831,
                refundableNzd: null,
                payment: "不可退档现在全额支付；另有首晚押金档 NZD 2,980，余款入住时付；信用卡手续费另计",
                paymentEn: "The non-refundable plan is charged in full now; a NZD 2,980 first-night-deposit plan is also available, with the balance due at check-in; credit-card fees apply",
                breakfast: "官网直订含 2 位成人早餐（促销码房价除外）",
                breakfastEn: "Direct bookings include breakfast for two adults, except promotional-code rates",
                memberNote: "官网床型为 Super King 或 Twin King Singles，必须请求并确认 King；首晚押金档：入住前超过 7 天取消免费，7 天内但超过 24 小时收首晚，24 小时内收全程",
                memberNoteEn: "The direct bed is a super king or twin king singles; request and confirm a king. First-night-deposit plan: free cancellation more than seven days before arrival; the first night is charged from seven days to 24 hours; the full stay is charged within 24 hours",
                quotedAt: "2026-07-28",
              },
              booking: {
                source: "Booking.com",
                roomKey: "lake-view-king",
                room: "湖景特大床房 · 34 m²",
                nonRefundableNzd: 2902,
                refundableNzd: 3055,
                cancelUntil: "2026-09-22",
                payment: "可取消档付款时间以结算页为准",
                breakfast: "Booking.com 报价未标明含早餐；付款前在结算页复核",
                breakfastEn: "The saved Booking.com quote did not state that breakfast was included; recheck at checkout",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.queenstown,
      agodaSoldOut: true,
      agodaStatus: "精确日期已售罄",
      agodaStatusDetail:
        "Agoda 已正确带入 9 月 29 日—10 月 3 日、2 人 1 间，页面明确显示“我们的空房已售罄”，因此没有可比较的四晚总价。",
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-28 已在 The Rees 官网按 9 月 29 日—10 月 3 日、2 人 1 间核验当前保留的 Lake View Hotel Room 含税四晚总价、早餐、预付与分段取消规则。官网床型写 Super King 或 Twin King Singles，不保证 King；Booking.com 对应房型明确为纯 King。",
      officialStatusEn:
        "The retained Lake View Hotel Room was verified in The Rees' direct engine for 29 Sep–3 Oct 2026, two adults and one room, including its tax-inclusive total, breakfast, payment and staged cancellation terms. The direct bed can be a super king or twin king singles, while the matching Booking.com room explicitly guarantees a king.",
      officialVerifiedAt: "2026-07-28",
      officialUrl: "https://www.therees.co.nz/",
      officialBookingUrl:
        "https://book-directonline.com/thereeshotel/properties/thereesqueendirect?locale=zh-CN&items[0][adults]=2&items[0][children]=0&items[0][infants]=0&currency=NZD&checkInDate=2026-09-29&checkOutDate=2026-10-03&trackPage=no",
      bookingUrl:
        "https://www.booking.com/hotel/nz/the-rees-luxury-apartments.html",
      agodaUrl:
        "https://www.agoda.com/the-rees-hotel-luxury-apartments/hotel/queenstown-nz.html",
      position: [-45.0281, 168.6875],
      mapQuery: "The Rees Hotel Queenstown",
    },
    {
      id: "holiday-inn-remarkables",
      stayType: "hotel",
      name: "Holiday Inn Queenstown Remarkables Park",
      recommendation: "低价大床",
      recommendationEn: "Lower-cost king",
      summary:
        "山景特大床价格低且可取消，但距镇中心 6.8 公里，连续四天会增加往返。",
      summaryEn:
        "A good-value cancellable king room, but 6.8 km from central Queenstown.",
      access: "距镇中心约 6.8 公里",
      accessEn: "About 6.8 km from central Queenstown",
      parking: "Agoda 酒店资料显示 NZD 20/天；Booking 可选含停车套餐",
      parkingEn:
        "Agoda lists parking at NZD 20/day; Booking also offers a parking-inclusive plan",
      nearbyAttractions: [
        {
          name: "Queenstown Airport",
          distance: "约 1.5 公里",
          travelTime: "驾车约 3—5 分钟",
          destinationQuery: "Queenstown Airport",
        },
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 8 公里",
          travelTime: "驾车约 15—20 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 7 公里",
          travelTime: "驾车约 15 分钟",
          destinationQuery: "Queenstown Gardens",
        },
      ],
      strengths: [
        "展示的基础山景特大床房已有对应房型图片与精确日期报价",
        "基础山景特大床四晚价格低",
        "免费取消、无需预付",
      ],
      strengthsEn: [
        "The displayed entry mountain-view king has exact-category photos and an exact-date quote",
        "Low four-night price for the entry mountain-view king",
        "Free cancellation with no prepayment",
      ],
      cautions: [
        "不适合 Walter Peak 步行日",
        "四天往返镇中心",
        "停车 NZD 20/晚，四晚需另加 NZD 80",
        "Agoda 本次只显示酒店介绍、未加载可预订房型卡；旧报价不再当作当前可订价",
      ],
      cautionsEn: [
        "Not convenient for walking to the Walter Peak departure",
        "Requires repeated trips into central Queenstown over four days",
        "Parking is NZD 20 per night, adding NZD 80 for four nights",
        "Agoda loaded only the hotel overview, not bookable room cards; the old quote is not treated as current availability",
      ],
      ratings: [
        { platform: "Booking.com", score: "8.8 / 10", reviews: "2,000+ 条" },
      ],
      roomTypes: [
        {
          rateKey: "mountain-king",
          name: "山景特大号床间",
          size: "28 m²",
          bed: "1 张超大号双人床",
          photosVerified: true,
          facilities: ["山景", "私人浴室", "空调", "咖啡机", "免费 Wi-Fi"],
          images: [
            image("holiday-inn-king-1.jpg", "山景特大床房卧室"),
            image("holiday-inn-king-2.jpg", "山景特大床房休息区"),
            image("holiday-inn-king-3.jpg", "山景特大床房浴室"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "当前仅展示有对应房型图片的 1 King Standard Mountain View。IHG 官网已按 2026 年 9 月 29 日—10 月 3 日、2 人 1 间核验：IHG One Rewards 会员 Advance Saver 四晚含 15% 税总价 NZD 1,220.40，可在 8 月 30 日 18:00（酒店当地时间）前免费取消、无需预付并到店付款。",
      availabilityNoteEn:
        "Only the 1 King Standard Mountain View with exact-category photos remains displayed. Verified on IHG for 29 Sep–3 Oct 2026, two adults and one room: its four-night IHG One Rewards Advance Saver total was NZD 1,220.40 including 15% tax, cancellable free before 6:00 p.m. hotel local time on 30 Aug, with no prepayment and payment at the property.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          roomRates: {
            "mountain-king": {
              official: {
                source: "IHG 官网",
                roomKey: "mountain-king",
                room: "1 King Standard Mountain View · 28 m²",
                roomEn: "1 King Standard Mountain View · 28 m²",
                nonRefundableNzd: null,
                refundableNzd: 1220.4,
                cancelUntil: "2026-08-30 18:00（酒店当地时间）",
                payment: "IHG One Rewards 会员 Advance Saver；无需预付、到店付款；4 晚总价含 15% 税",
                paymentEn: "IHG One Rewards member Advance Saver; no prepayment and pay at the property; the four-night total includes 15% tax",
                breakfast: "不含早餐",
                breakfastEn: "Breakfast not included",
                memberNote: "IHG 页面动态换算参考价约 CNY 4,689.14；与本站按固定汇率计算的人民币参考价不同",
                memberNoteEn: "IHG's dynamic currency conversion showed about CNY 4,689.14, which differs from this site's fixed-rate CNY estimate",
                quotedAt: "2026-07-28",
              },
              booking: {
                source: "Booking.com",
                roomKey: "mountain-king",
                room: "山景特大号床间 · 28 m²",
                nonRefundableNzd: null,
                refundableNzd: 1356,
                cancelUntil: "2026-08-30",
                payment: "无需预付、到店付款",
                breakfast: "早餐另加 NZD 30/人/天；停车 NZD 20/天，含停车实际总价 NZD 1,436",
                quotedAt: "2026-07-28",
              },
            },
          },
        },
      },
      research: sharedSocial.queenstown,
      agodaStatus: "精确日期详情已打开，但房型卡未加载",
      agodaStatusDetail:
        "2026-07-28 已实际打开 Agoda 同一酒店并确认 9 月 29 日—10 月 3 日、2 人 1 间；本次页面只加载酒店介绍，没有出现可订房型卡或结算总价，因此撤下旧 Agoda 报价。",
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-28 已在 IHG 官网按 9 月 29 日—10 月 3 日、2 人 1 间进入 Select Room，并逐项核验当前保留的 1 King Standard Mountain View 之 IHG One Rewards 会员 Advance Saver 四晚含 15% 税总价、早餐、付款与取消条款。",
      officialStatusEn:
        "The retained 1 King Standard Mountain View was verified on IHG on 28 Jul 2026 for 29 Sep–3 Oct 2026, two adults and one room, including its four-night tax-inclusive IHG One Rewards Advance Saver total and terms.",
      officialVerifiedAt: "2026-07-28",
      officialUrl:
        "https://www.ihg.com/holidayinn/hotels/us/en/queenstown/zqnpk/hoteldetail",
      officialBookingUrl:
        "https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?qDest=28%20Red%20Oaks%20Drive%2C%20Frankton%2C%20Queenstown%209371%2C%20New%20Zealand&qPt=CASH&qCiD=29&qCoD=3&qCiMy=082026&qCoMy=092026&qAdlt=2&qChld=0&qRms=1&qAAR=6CBARC&qSlH=ZQNPK&qAkamaiCC=CN&srb_u=1&qExpndSrch=false&qFS=false&qSrt=sAV&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.kd.ma.sp.va.re.vx.nd.sx.we.lx.rn.sn.nu.ge.fa&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=true&qpMbw=0&qErm=false&qpMn=1&qpMbx=0&qLoSe=false&qDr=1&qSt=Holiday%20Inn%20Queenstown%20Remarkables%20Park&qRmFltr=",
      bookingUrl:
        "https://www.booking.com/hotel/nz/holiday-inn-queenstown-remarkables-park.html",
      agodaUrl:
        "https://www.agoda.com/holiday-inn-queenstown-remarkables-park/hotel/queenstown-nz.html",
      position: [-45.0154, 168.7366],
      mapQuery: "Holiday Inn Queenstown Remarkables Park",
    },
    {
      id: "summit-serenity-airbnb",
      stayType: "home",
      name: "Summit Serenity 1 Bedroom · Airbnb",
      recommendation: "小红书湖景民宿方向 · 已核验",
      recommendationEn: "Verified social-media-led Airbnb",
      summary:
        "先从小红书高赞的 Sunshine Bay 湖景民宿方向筛选，再在 Airbnb 反查精确日期得到的具体一卧室房源。Queen 床、热水浴缸、完整厨房和湖山全景很适合四晚慢住，但去 Walter Peak 码头需开车。",
      summaryEn:
        "A verified one-bedroom Airbnb found by following the lake-view Sunshine Bay pattern recommended on Xiaohongshu.",
      access:
        "Sunshine Bay / Fernhill 湖景山坡一带；到 Steamer Wharf 约 4—5 公里、驾车约 8—10 分钟",
      accessEn:
        "Sunshine Bay / Fernhill hillside; about 8–10 minutes by car to Steamer Wharf",
      parking: "房源内免费车位 1 个",
      parkingEn: "One free on-site parking space",
      distanceNote:
        "Airbnb 预订前只公开大致位置；距离按房源地图所示 Sunshine Bay / Fernhill 一带估算，确认预订后应以准确地址复核。",
      nearbyAttractions: [
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 4—5 公里",
          travelTime: "驾车约 8—10 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 5 公里",
          travelTime: "驾车约 10—12 分钟",
          destinationQuery: "Queenstown Gardens",
        },
        {
          name: "Skyline Queenstown",
          distance: "约 4.5 公里",
          travelTime: "驾车约 9—11 分钟",
          destinationQuery: "Skyline Queenstown",
        },
        {
          name: "Queenstown Airport",
          distance: "约 12 公里",
          travelTime: "驾车约 20—25 分钟",
          destinationQuery: "Queenstown Airport",
        },
      ],
      strengths: [
        "小红书高赞住宿方向反查",
        "精确日期已核验可订",
        "1 张 Queen 床",
        "湖山全景与私人热水浴缸",
        "完整厨房、洗衣机与烘干机",
        "密码盒自助入住",
        "9 月 24 日前免费取消",
      ],
      strengthsEn: [
        "Verified from a highly recommended Xiaohongshu lake-view stay pattern",
        "Exact dates and two guests were checked",
        "One queen bed",
        "Panoramic lake-and-mountain views with a private hot tub",
        "Full kitchen, washing machine and dryer",
        "Lockbox self check-in",
        "Free cancellation until 24 Sep",
      ],
      cautions: [
        "不在镇中心步行圈",
        "Walter Peak 当天需驾车并处理停车",
        "四晚价格高于 Holiday Inn",
        "另有 1 张沙发床但无需使用",
      ],
      cautionsEn: [
        "Outside the walkable town-centre area",
        "Driving and city parking are required for the Walter Peak departure",
        "The four-night total is higher than Holiday Inn",
        "A sofa bed is also present but is not needed for two guests",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.86 / 5", reviews: "58 条 · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "one-bedroom-queen-home",
          name: "一卧室整套民居",
          size: "平台未标",
          bed: "1 张 Queen 床",
          photosVerified: true,
          facilities: [
            "湖景",
            "山景",
            "私人热水浴缸",
            "完整厨房",
            "洗衣/烘干",
            "空调",
            "私人阳台",
            "免费停车",
          ],
          images: [
            image("summit-serenity-queen-1.jpg", "Queen 床卧室", "Airbnb"),
          ],
        },
      ],
      hotelImages: [
        image("summit-serenity-hotel-1.jpg", "湖景热水浴缸", "Airbnb"),
        image("summit-serenity-hotel-2.jpg", "湖景客厅", "Airbnb"),
        image("summit-serenity-hotel-3.jpg", "房源湖山视野", "Airbnb"),
      ],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 9 月 29 日—10 月 3 日、2 人核验：含全部费用总价 NZD 1,924；9 月 24 日前免费取消，9 月 29 日入住前取消可部分退款。",
      availabilityNoteEn:
        "Checked on Airbnb for 29 Sep–3 Oct 2026 and two guests: NZD 1,924 all-in, with free cancellation until 24 September and a partial refund for cancellation before check-in on 29 September. Recheck live inventory and checkout terms before booking.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          source: "Airbnb",
          roomKey: "one-bedroom-queen-home",
          room: "一卧室整套民居 · 1 张 Queen 床",
          nonRefundableNzd: null,
          refundableNzd: 1924,
          cancelUntil: "2026-09-24",
          payment: "预订按钮当前提示不会立即扣款；实际分期时间以结算页为准",
          breakfast: "带完整厨房，不含早餐",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 9 月 29 日—10 月 3 日、2 人核验可订，并记录含全部费用总价 NZD 1,924 与取消条件；Airbnb 库存和动态总价会变化，付款前须重新核价。",
      officialStatusEn:
        "The concrete Airbnb listing was checked on 27 Jul 2026 for 29 Sep–3 Oct and two guests. It was available at NZD 1,924 including all fees with the recorded cancellation terms. Airbnb availability and dynamic totals can change, so recheck before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://www.airbnb.com.sg/rooms/1343016251239831074?adults=2&check_in=2026-09-29&check_out=2026-10-03&currency=NZD",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-45.0465, 168.6205],
      mapQuery: "Sunshine Bay Queenstown New Zealand",
    },
    {
      id: "queenstown-central-qt3-airbnb",
      stayType: "home",
      name: "Central QT3 · Airbnb",
      recommendation: "码头步行最优民宿",
      recommendationEn: "Best walkable Airbnb",
      summary:
        "镇中心一卧室整套公寓，Airbnb 精确四晚已核验。价格不低，但可步行覆盖 Steamer Wharf、湖边、餐厅与 Queenstown Gardens，最贴合 Walter Peak 当天不用开车的安排。",
      summaryEn:
        "A verified central one-bedroom Airbnb with the strongest walkability for Steamer Wharf and town activities.",
      access: "镇中心；房源标题明确标注可步行到各处",
      accessEn: "Central Queenstown with walk-everywhere positioning",
      parking: "页面未显示免费停车；预订前需向房东确认车位",
      parkingEn: "No free parking shown; confirm parking with the host",
      distanceNote:
        "Airbnb 预订前只公开大致位置；步行距离按房源中央 Queenstown 地图范围估算，订后应以准确地址复核。",
      nearbyAttractions: [
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 600—900 米",
          travelTime: "步行约 8—12 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 800 米—1.2 公里",
          travelTime: "步行约 10—15 分钟",
          destinationQuery: "Queenstown Gardens",
        },
        {
          name: "Glenorchy 公路起点",
          distance: "约 1—2 公里",
          travelTime: "驾车约 5 分钟",
          destinationQuery: "Glenorchy Queenstown Road",
        },
        {
          name: "Queenstown Airport",
          distance: "约 8 公里",
          travelTime: "驾车约 15—20 分钟",
          destinationQuery: "Queenstown Airport",
        },
      ],
      strengths: [
        "精确日期与 2 人已核验",
        "Walter Peak 和镇中心步行最方便",
        "整套一卧室公寓",
        "完整厨房与自助入住",
        "4.93 分、165 条评价",
        "8 月 30 日前免费取消",
      ],
      strengthsEn: [
        "Exact dates and two guests were checked",
        "Best walkability for Steamer Wharf and central Queenstown",
        "Whole one-bedroom apartment",
        "Full kitchen and self check-in",
        "Rated 4.93 from 165 reviews",
        "Free cancellation until 30 Aug",
      ],
      cautions: [
        "四晚总价明显高于机场区酒店",
        "页面未显示免费停车",
        "Airbnb 精确地址订后才公开",
      ],
      cautionsEn: [
        "The four-night total is materially higher than the airport-area hotel",
        "No free parking was shown on the listing",
        "Airbnb reveals the exact address only after booking",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.93 / 5", reviews: "165 条 · Guest Favourite · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "central-one-bedroom-apartment",
          name: "镇中心一卧室整套公寓",
          size: "平台未标",
          bed: "2 张床（民宿不按床型筛选）",
          photosVerified: true,
          facilities: ["完整厨房", "阳台", "自助入住", "独立浴室", "免费 Wi-Fi"],
          images: [
            image("queenstown-central-qt3-1.jpg", "公寓客厅", "Airbnb"),
            image("queenstown-central-qt3-2.jpg", "公寓卧室", "Airbnb"),
            image("queenstown-central-qt3-3.jpg", "公寓厨房", "Airbnb"),
            image("queenstown-central-qt3-4.jpg", "公寓用餐区", "Airbnb"),
            image("queenstown-central-qt3-5.jpg", "公寓浴室", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 9 月 29 日—10 月 3 日、2 人核验：含全部费用总价 NZD 2,046；8 月 30 日前免费取消。",
      availabilityNoteEn:
        "Checked on Airbnb for 29 Sep–3 Oct 2026 and two guests: NZD 2,046 all-in, with free cancellation until 30 August. Recheck live inventory and checkout terms before booking.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          source: "Airbnb",
          roomKey: "central-one-bedroom-apartment",
          room: "镇中心一卧室整套公寓",
          nonRefundableNzd: null,
          refundableNzd: 2046,
          cancelUntil: "2026-08-30",
          payment: "付款时间以 Airbnb 结算页为准",
          breakfast: "带完整厨房，不含早餐",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 9 月 29 日—10 月 3 日、2 人核验可订，并记录含全部费用总价 NZD 2,046 与免费取消日期；Airbnb 库存和动态总价会变化，付款前须重新核价。",
      officialStatusEn:
        "The concrete Airbnb listing was checked on 27 Jul 2026 for 29 Sep–3 Oct and two guests. It was available at NZD 2,046 including all fees with the recorded free-cancellation date. Airbnb availability and dynamic totals can change, so recheck before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://zh.airbnb.com/rooms/938494715127054681?adults=2&check_in=2026-09-29&check_out=2026-10-03&currency=NZD",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-45.0322, 168.661],
      mapQuery: "Central Queenstown New Zealand",
    },
    {
      id: "queenstown-hayes-farmstay-airbnb",
      stayType: "home",
      name: "Lake Hayes Farmstay Studio · Airbnb",
      recommendation: "安静低价民宿",
      recommendationEn: "Quiet lower-cost Airbnb",
      summary:
        "Lake Hayes 农场单间公寓，精确四晚总价只略高于 Holiday Inn，并有山谷景观、厨房、洗衣机和免费停车；代价是每天都要开车进镇，Walter Peak 当天也无法步行到码头。",
      summaryEn:
        "A verified quiet Lake Hayes farmstay with good value, kitchen and parking, but daily driving is required.",
      access: "Lake Hayes 乡间；进皇后镇需驾车",
      accessEn: "Rural Lake Hayes; driving required for Queenstown",
      parking: "房源内免费停车",
      parkingEn: "Free on-site parking",
      distanceNote:
        "Airbnb 预订前只公开大致位置；距离按 Lake Hayes 房源地图范围估算，订后应以准确地址复核。",
      nearbyAttractions: [
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 17—20 公里",
          travelTime: "驾车约 25—30 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 17—20 公里",
          travelTime: "驾车约 25—30 分钟",
          destinationQuery: "Queenstown Gardens",
        },
        {
          name: "Glenorchy 公路起点",
          distance: "约 18—21 公里",
          travelTime: "驾车约 25—35 分钟",
          destinationQuery: "Glenorchy Queenstown Road",
        },
        {
          name: "Queenstown Airport",
          distance: "约 10—13 公里",
          travelTime: "驾车约 15—20 分钟",
          destinationQuery: "Queenstown Airport",
        },
      ],
      strengths: [
        "精确日期与 2 人已核验",
        "NZD 172 / 晚左右",
        "山谷与农场环境安静",
        "完整厨房、洗衣机和免费停车",
        "4.90 分、187 条评价",
        "9 月 24 日前免费取消",
      ],
      strengthsEn: [
        "Exact dates and two guests were checked",
        "About NZD 172 per night",
        "Quiet farm setting with valley views",
        "Full kitchen, washing machine and free parking",
        "Rated 4.90 from 187 reviews",
        "Free cancellation until 24 Sep",
      ],
      cautions: [
        "所有皇后镇活动都需开车",
        "Walter Peak 当天要处理市区停车",
        "Airbnb 精确地址订后才公开",
      ],
      cautionsEn: [
        "Every Queenstown activity requires driving",
        "City parking is required on the Walter Peak day",
        "Airbnb reveals the exact address only after booking",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.90 / 5", reviews: "187 条 · Guest Favourite · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "lake-hayes-farmstay-studio",
          name: "农场整套单间公寓",
          size: "平台未标",
          bed: "特大床及其他床位（民宿不按床型筛选）",
          photosVerified: true,
          facilities: ["完整厨房", "洗衣机", "山谷景观", "独立浴室", "免费停车", "免费 Wi-Fi"],
          images: [
            image("queenstown-hayes-farmstay-studio-overview.jpg", "单间公寓 King 床、起居区与洗衣设施", "Airbnb"),
            image("queenstown-hayes-farmstay-living.jpg", "单间公寓起居区与 King 床", "Airbnb"),
            image("queenstown-hayes-farmstay-kitchen-laundry.jpg", "单间公寓厨房、冰箱与洗衣机", "Airbnb"),
            image("queenstown-hayes-farmstay-valley.jpg", "房源山谷与山地景观", "Airbnb"),
            image("queenstown-hayes-farmstay-yard.jpg", "房源庭院、草坪与户外座位", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 9 月 29 日—10 月 3 日、2 人核验：含全部费用总价 NZD 688；9 月 24 日前免费取消，当前显示今日先付 NZD 0。",
      availabilityNoteEn:
        "Checked on Airbnb for 29 Sep–3 Oct 2026 and two guests: NZD 688 all-in, with free cancellation until 24 September and NZD 0 due immediately. Recheck live inventory and checkout terms before booking.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          source: "Airbnb",
          roomKey: "lake-hayes-farmstay-studio",
          room: "Lake Hayes 农场整套单间公寓",
          nonRefundableNzd: null,
          refundableNzd: 688,
          cancelUntil: "2026-09-24",
          payment: "当前显示今日先付 NZD 0；后续付款以 Airbnb 结算页为准",
          breakfast: "带完整厨房，不含早餐",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 9 月 29 日—10 月 3 日、2 人核验可订，并记录含全部费用总价 NZD 688 与取消条件；Airbnb 库存和动态总价会变化，付款前须重新核价。",
      officialStatusEn:
        "The concrete Airbnb listing was checked on 27 Jul 2026 for 29 Sep–3 Oct and two guests. It was available at NZD 688 including all fees with the recorded cancellation terms. Airbnb availability and dynamic totals can change, so recheck before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://zh.airbnb.com/rooms/41320451?adults=2&check_in=2026-09-29&check_out=2026-10-03&currency=NZD",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-44.987, 168.808],
      mapQuery: "Lake Hayes Queenstown New Zealand",
    },
    {
      id: "ramada-queenstown-central",
      name: "Ramada by Wyndham Queenstown Central",
      stayType: "hotel",
      stayTypes: ["hotel", "home"],
      recommendation: "镇中心公寓酒店",
      recommendationEn: "Central apartment hotel",
      summary:
        "到镇中心、湖边和 Queenstown Gardens 步行约 7—10 分钟；27 m² Studio 带小厨房，四晚不换房，适合 Walter Peak 当天把车留在酒店。",
      summaryEn:
        "Walkable to the centre, lakefront and gardens, with a 27 m² kitchenette studio that suits the car-free Walter Peak day.",
      access: "位置评分 9.0；Steamer Wharf 约 1.1 公里",
      accessEn: "Location score 9.0; about 1.1 km to Steamer Wharf",
      parking: "需预订的私人停车场 NZD 30/天；四晚约 NZD 120",
      parkingEn: "Reserved private parking NZD 30/day; about NZD 120 for four nights",
      nearbyAttractions: [
        { name: "Steamer Wharf · Walter Peak 码头", distance: "约 1.1 公里", travelTime: "步行约 15 分钟", destinationQuery: "Steamer Wharf Queenstown" },
        { name: "Queenstown Gardens", distance: "约 500—800 米", travelTime: "步行约 7—10 分钟", destinationQuery: "Queenstown Gardens" },
      ],
      strengths: ["镇中心步行动线好", "27 m² 公寓带小厨房", "可取消档零付款至 9 月 26 日", "四晚不搬行李"],
      strengthsEn: ["Strong central walking route", "27 m² studio with kitchenette", "Cancellable rate required no payment until 26 Sep", "No room change for four nights"],
      cautions: ["停车四晚另加约 NZD 120", "报价核验于 7 月 27 日，付款前应复查", "一室公寓床型需在结算页确认大床"],
      cautionsEn: ["Parking adds about NZD 120", "Rate was checked on 27 Jul and should be refreshed before payment", "Confirm the studio bed at checkout"],
      ratings: [{ platform: "Booking.com", score: "8.3 / 10", reviews: "2,000+ 条" }],
      roomTypes: [
        {
          rateKey: "studio-king",
          name: "一室公寓 · 大床",
          size: "27 m²",
          bed: "1 张大床（结算页确认床型）",
          photosVerified: true,
          facilities: ["私人小厨房", "洗碗机", "独立浴室", "空调", "隔音", "免费 Wi-Fi"],
          images: [
            image("queenstown-room-1.jpg", "一室公寓大床与山景"),
            image("queenstown-room-2.jpg", "一室公寓浴室"),
          ],
        },
      ],
      hotelImages: [
        image("queenstown-hotel-1.jpg", "酒店外观"),
        image("queenstown-hotel-2.jpg", "酒店与山景"),
      ],
      availabilityNote:
        "Booking.com 已按 2026 年 9 月 29 日—10 月 3 日、2 人 1 间核验 Studio：不可退 NZD 1,984，可取消 NZD 2,204；可取消档在 9 月 26 日前（不含当日）零付款。该报价核验于 2026-07-27，付款前仍应刷新。",
      availabilityNoteEn:
        "Booking.com was checked for 29 Sep–3 Oct 2026, two adults and one room: the studio was NZD 1,984 non-refundable or NZD 2,204 cancellable, with no payment before 26 Sep. Checked on 27 Jul 2026; refresh before paying.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          source: "Booking.com · Genius 1",
          roomKey: "studio-king",
          room: "一室公寓 · 27 m²",
          nonRefundableNzd: 1984,
          refundableNzd: 2204,
          cancelUntil: "2026-09-28",
          payment: "可取消档在 9 月 26 日前（不含当日）零付款",
          breakfast: "早餐可另购",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Booking.com 按 9 月 29 日—10 月 3 日、2 人 1 间核验 Studio 的不可退与可取消总价；Wyndham 官网用于核对酒店身份与设施，但当前日期价格来自平台且会变化，付款前须重新核价。",
      officialStatusEn:
        "Booking.com was checked on 27 Jul 2026 for 29 Sep–3 Oct, two adults and one room, with both non-refundable and cancellable studio totals recorded. Wyndham's website confirms the property and facilities, but the dated prices came from the platform and must be refreshed before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl: "https://www.wyndhamhotels.com/ramada/queenstown-new-zealand/ramada-queenstown-central/overview",
      bookingUrl: "https://www.booking.com/hotel/nz/ramada-queenstown-central.html",
      agodaUrl: "https://www.agoda.com/ramada-queenstown-central/hotel/queenstown-nz.html",
      position: [-45.0372, 168.6653],
      mapQuery: "Ramada by Wyndham Queenstown Central",
    },
    {
      id: "bella-vista-queenstown",
      name: "Bella Vista Queenstown",
      stayType: "motel",
      recommendation: "镇中心 Motel 性价比",
      recommendationEn: "Central motel value",
      summary:
        "距镇中心约 500 米，精确四晚官网仅剩带完整厨房的 27 m² Studio，King + Single、免费停车，适合兼顾步行和自驾；17:00 后入住需提前联系。",
      summaryEn:
        "About 500 m from central Queenstown. The exact four-night stay had one 27 m² full-kitchen studio left with a king plus single bed and free parking; contact the motel for arrival after 17:00.",
      access: "距镇中心约 500 米；15:00 入住、10:00 退房，17:00 后到店需提前联系并在线入住",
      accessEn: "About 500 m from the centre; check-in from 15:00 and check-out at 10:00, with advance contact and online check-in for arrival after 17:00",
      parking: "官网确认免费停车",
      parkingEn: "Free parking confirmed direct",
      nearbyAttractions: [
        { name: "Steamer Wharf · Walter Peak 码头", distance: "约 500—800 米", travelTime: "步行约 8—12 分钟", destinationQuery: "Steamer Wharf Queenstown" },
        { name: "Skyline Queenstown", distance: "镇中心步行范围", travelTime: "步行可达", destinationQuery: "Skyline Queenstown" },
        { name: "Queenstown Gardens", distance: "约 1 公里", travelTime: "步行约 15 分钟", destinationQuery: "Queenstown Gardens" },
      ],
      strengths: ["Motel 类型且免费停车", "镇中心约 500 米", "完整厨房", "King + Single", "官网精确日期仅剩 1 间"],
      strengthsEn: ["Motel with free parking", "About 500 m from the centre", "Full kitchen", "King plus single", "One exact-date unit remained direct"],
      cautions: ["仅剩 1 间，库存风险高", "取消期内取消或未入住收全额", "刷卡有 2.5%—3% 手续费", "17:00 后入住须提前联系"],
      cautionsEn: ["Only one unit remained", "Full charge for cancellation inside the window or no-show", "Card surcharge of 2.5%–3%", "Contact the motel for arrival after 17:00"],
      ratings: [],
      roomTypes: [
        {
          rateKey: "full-kitchen-studio",
          name: "Full Kitchen Studio",
          nameEn: "Full Kitchen Studio",
          size: "27 m²",
          sizeEn: "27 m²",
          bed: "1 张 King + 1 张 Single",
          bedEn: "one king plus one single",
          facilities: ["完整厨房", "独立卫浴", "浴缸上方手持花洒", "免费无限 Wi-Fi", "免费停车"],
          facilitiesEn: ["Full kitchen", "En-suite bathroom", "Handheld shower over bath", "Free unlimited Wi-Fi", "Free parking"],
          photosVerified: true,
          images: [
            image(
              "queenstown-bella-vista-full-kitchen-studio.jpg",
              "Full Kitchen Studio · King + Single 与厨房",
              "https://www.bellavista.co.nz/library/images/Motels/Queenstown/Rooms/BVQueenstown_FullKitchenStudio.jpg",
            ),
            image(
              "queenstown-bella-vista-full-kitchen-studio-bathroom.jpg",
              "Full Kitchen Studio 浴室与浴缸",
              "https://www.bellavista.co.nz/library/images/Motels/Queenstown/Rooms/BVQueenstown_FullKitchenStudio4.jpg",
            ),
          ],
        },
      ],
      hotelImages: [
        image(
          "queenstown-bella-vista-exterior.jpg",
          "Bella Vista Queenstown 外观",
          "https://www.bellavista.co.nz/library/images/Motels/Queenstown/BVQueenstown_Exterior(1).jpg",
        ),
      ],
      availabilityNote:
        "Bella Vista 官网已按 2026 年 9 月 29 日—10 月 3 日、2 人核验：仅剩 1 间 Full Kitchen Studio，官网四晚 10% 促销总价 NZD 1,324.80（原 NZD 1,472）。预订时无需付款但需信用卡担保；取消期进入后、到店前可扣全额。",
      availabilityNoteEn:
        "Verified direct for 29 Sep–3 Oct 2026 and two adults: one Full Kitchen Studio remained at a four-night 10%-off total of NZD 1,324.80, down from NZD 1,472. No payment is taken at booking but a card guarantee is required, and the full amount may be charged after the cancellation window begins.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          roomRates: {
            "full-kitchen-studio": {
              official: {
                source: "Bella Vista 官网",
                roomKey: "full-kitchen-studio",
                room: "Full Kitchen Studio · 27 m² · King + Single",
                roomEn: "Full Kitchen Studio · 27 m² · king plus single",
                refundableNzd: 1324.8,
                nonRefundableNzd: null,
                cancelUntil: "入住前 7 天（具体酒店当地时刻未明示；付款前确认）",
                cancelUntilEn: "seven days before arrival (exact local cutoff time not stated; confirm before payment)",
                refundableRateLabel: "官网四晚 10% 促销总价；原价 NZD 1,472",
                refundableRateLabelEn: "Four-night direct 10%-off total; was NZD 1,472",
                payment: "预订时不付款、信用卡担保；取消期进入后到店前可扣全额；Visa/Mastercard 2.5%，Amex/JCB 3%",
                paymentEn: "No payment at booking; card guarantee required. Full charge may be taken after the cancellation window begins. Visa/Mastercard 2.5%; Amex/JCB 3%",
                breakfast: "完整厨房；官网报价未标明含早餐",
                breakfastEn: "Full kitchen; the direct rate did not state breakfast inclusion",
                memberNote: "冬季 Large Studio / Apartment 使用 7 天取消期；窗口内取消、变更或未入住收全额",
                memberNoteEn: "Winter Large Studio / Apartment bookings use a seven-day cancellation window; cancellation, amendment or no-show inside it is charged in full",
                quotedAt: "2026-07-31",
              },
            },
          },
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-31 已在 Bella Vista Queenstown 官网预订引擎按 9 月 29 日—10 月 3 日、2 人核验：Full Kitchen Studio 仅剩 1 间，27 m²、King + Single、完整厨房和免费停车，四晚 10% 促销总价 NZD 1,324.80；并核对冬季 7 天取消期、信用卡担保及刷卡手续费。",
      officialStatusEn:
        "Verified on 31 Jul 2026 in Bella Vista Queenstown's direct engine for 29 Sep–3 Oct and two adults: one 27 m² Full Kitchen Studio remained with a king plus single bed, full kitchen and free parking, at a four-night 10%-off total of NZD 1,324.80. The winter seven-day cancellation window, card guarantee and card surcharges were also checked.",
      officialVerifiedAt: "2026-07-31",
      officialUrl: "https://www.bellavista.co.nz/our-motels/queenstown",
      officialBookingUrl: "https://www.onlinebooking.direct/property/bella-vista-queenstown?checkIn=2026-09-29&checkOut=2026-10-03&adults=2",
      bookingUrl: "https://www.booking.com/hotel/nz/bella-vista-motel-queenstown.html",
      position: [-45.0270284, 168.6599819],
      mapQuery: "Bella Vista Queenstown",
    },
    {
      id: "novotel-queenstown-lakeside",
      name: "Novotel Queenstown Lakeside",
      stayType: "hotel",
      recommendation: "湖畔与花园步行最顺",
      recommendationEn: "Best lakeside and gardens walk",
      summary:
        "位于 Marine Parade、紧邻湖岸和 Queenstown Gardens；推荐 26 m² Standard King，步行去 Steamer Wharf 也很方便。官网已核验 9 月 29 日—10 月 3 日、2 人的公开不可退总价 NZD 1,971。",
      summaryEn:
        "On Marine Parade beside the lakefront and Queenstown Gardens. The recommended 26 m² Standard King also keeps Steamer Wharf within an easy walk. The public non-refundable total of NZD 1,971 was verified direct for 29 Sep–3 Oct and two adults.",
      access: "Marine Parade 湖畔；步行约 2—4 分钟到 Queenstown Gardens，约 7—10 分钟到 Steamer Wharf",
      accessEn: "Lakefront Marine Parade; about 2–4 minutes on foot to Queenstown Gardens and 7–10 minutes to Steamer Wharf",
      parking: "Accor 官网：视供应情况提供代客停车，封闭室外 30 个车位，24 小时开放，NZD 50/天",
      parkingEn: "Accor: valet parking subject to availability, 30 enclosed outdoor spaces open 24/7, NZD 50/day",
      nearbyAttractions: [
        { name: "Queenstown Gardens", distance: "约 100—300 米", travelTime: "步行约 2—4 分钟", destinationQuery: "Queenstown Gardens" },
        { name: "Steamer Wharf · Walter Peak 码头", distance: "约 600—800 米", travelTime: "步行约 7—10 分钟", destinationQuery: "Steamer Wharf Queenstown" },
        { name: "Skyline Queenstown", distance: "约 1 公里", travelTime: "步行约 12—15 分钟", destinationQuery: "Skyline Queenstown" },
      ],
      strengths: ["湖畔和 Queenstown Gardens 几乎出门即到", "26 m² Standard King 床型明确", "Steamer Wharf 与镇中心均可步行", "Accor 官网房型、停车与官方图片已核对"],
      strengthsEn: ["Immediate access to the lakefront and Queenstown Gardens", "The 26 m² Standard King has a clearly specified king bed", "Both Steamer Wharf and central Queenstown are walkable", "Direct room, parking and official imagery were checked"],
      cautions: ["代客停车 NZD 50/天且视供应情况", "公开价不可退款且需在线预付；税费是否已包含须到结算页确认", "标准 King 官网说明带阳台，但具体景观不作保证"],
      cautionsEn: ["Valet parking costs NZD 50/day and is subject to availability", "The public rate is non-refundable and prepaid online; tax inclusion must be confirmed at checkout", "The direct description lists a balcony, but no specific view is guaranteed"],
      ratings: [{ platform: "ALL Accor", score: "4.2 / 5", reviews: "2,944 条官网确认评价" }],
      roomTypes: [
        {
          rateKey: "standard-king",
          name: "Standard Room with one Kingsize Bed",
          nameEn: "Standard Room with one Kingsize Bed",
          size: "26 m²",
          sizeEn: "26 m²",
          bed: "1 张 King 床",
          bedEn: "one king bed",
          photosVerified: true,
          facilities: ["阳台", "独立卫浴", "工作区", "LCD TV 与 Chromecast", "茶咖设备"],
          facilitiesEn: ["Balcony", "En-suite bathroom", "Work area", "LCD TV with Chromecast", "Tea and coffee facilities"],
          images: [
            image("queenstown-novotel-standard-king.jpg", "Standard King 客房", "https://www.ahstatic.com/photos/5308_rokgc_00_p_2048x1536.jpg"),
          ],
        },
      ],
      hotelImages: [
        image("queenstown-novotel-exterior.jpg", "Novotel Queenstown Lakeside 湖畔外观", "https://www.ahstatic.com/photos/5308_ho_00_p_2048x1536.jpg"),
        image("queenstown-novotel-balcony-room.jpg", "Novotel 阳台客房与湖山景观", "https://www.ahstatic.com/photos/5308_ho_01_p_2048x1536.jpg"),
      ],
      availabilityNote:
        "2026-08-03 已在 Accor 官网按 2026 年 9 月 29 日—10 月 3 日、2 人核验 Standard King：公开不可退、在线预付、纯房总价 NZD 1,971；未观察到公开可退价。ALL 会员总价 NZD 1,872.45 仅作会员价附注。页面未明示税费是否已包含，须在结算页确认。",
      availabilityNoteEn:
        "Verified direct on 3 Aug 2026 for 29 Sep–3 Oct and two adults: the Standard King public room-only rate totalled NZD 1,971, was non-refundable and required online prepayment. No refundable public rate was observed. The ALL member total of NZD 1,872.45 is noted separately. The page did not state whether tax was included, so confirm it at checkout.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          roomRates: {
            "standard-king": {
              official: {
                source: "Accor 官网",
                sourceEn: "Accor direct website",
                roomKey: "standard-king",
                room: "Standard Room with one Kingsize Bed · 26 m²",
                roomEn: "Standard Room with one Kingsize Bed · 26 m²",
                nonRefundableNzd: 1971,
                refundableNzd: null,
                rateLabel: "公开价 · 纯房 · 税费状态待结算 · 不可退款",
                rateLabelEn: "Public rate · room only · tax inclusion pending checkout · non-refundable",
                payment: "不可退款；需在线预付全额",
                paymentEn: "Non-refundable; the full amount is prepaid online",
                breakfast: "纯房价，不含早餐",
                breakfastEn: "Room-only rate; breakfast is not included",
                memberNote: "ALL 会员同档总价 NZD 1,872.45；仅作会员价附注，不替代公开价",
                memberNoteEn: "The equivalent ALL member total is NZD 1,872.45; shown only as a member-rate note and not as the public rate",
                quotedAt: "2026-08-03",
              },
            },
          },
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-08-03 已在 Accor 官网按 9 月 29 日—10 月 3 日、2 人核验 Standard King：公开不可退、在线预付、纯房总价 NZD 1,971；未观察到公开可退价。ALL 会员同档总价 NZD 1,872.45，仅作附注。页面未明示税费是否已包含，须在结算页确认。",
      officialStatusEn:
        "Verified direct on Accor on 3 Aug 2026 for 29 Sep–3 Oct and two adults: the Standard King public room-only rate totalled NZD 1,971, was non-refundable and prepaid online. No refundable public rate was observed. The equivalent ALL member total of NZD 1,872.45 is noted separately. Tax inclusion was not stated and remains pending checkout confirmation.",
      officialVerifiedAt: "2026-08-03",
      officialUrl: "https://all.accor.com/hotel/5308/index.en.shtml",
      officialBookingUrl: "https://all.accor.com/ssr/app/accor/rates/5308/index.en.shtml?dateIn=2026-09-29&nights=4&compositions=2&stayplus=false",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开 Accor 官网核对结算",
      officialLinkLabelEn: "Open Accor and verify checkout",
      officialLinkNote: "日期和人数已带入；付款前请再次确认库存、税费是否已包含、停车和最终扣款金额。",
      officialLinkNoteEn: "The dates and guest count are carried in the link; before payment, reconfirm inventory, tax inclusion, parking and the final charged total.",
      position: [-45.033729, 168.661759],
      mapQuery: "Novotel Queenstown Lakeside",
    },
    {
      id: "sofitel-queenstown-hotel-spa",
      name: "Sofitel Queenstown Hotel & Spa",
      stayType: "hotel",
      recommendation: "仅剩超高价顶层套房 · 不建议",
      recommendationEn: "Only an ultra-expensive penthouse remained · not recommended",
      featuredRoomKey: "penthouse-no-10",
      summary:
        "Duke Street 镇中心五星酒店；原本推荐 41 m² Superior King，但目标日期核验时仅返回 Penthouse No.10，四晚公开总价接近 NZD 2 万，明显不适合作为常规候选。",
      summaryEn:
        "A five-star Duke Street hotel in central Queenstown. The originally preferred 41 m² Superior King has a double spa bath and Juliet balcony, but the exact-date search returned only Penthouse No.10 at nearly NZD 20,000 for four nights, making this an impractical fallback.",
      access: "Duke Street 镇中心；步行约 4—6 分钟到 Steamer Wharf，约 10—12 分钟到 Queenstown Gardens",
      accessEn: "Central Duke Street; about 4–6 minutes on foot to Steamer Wharf and 10–12 minutes to Queenstown Gardens",
      parking: "Accor 官网：室内代客停车 30 个车位，24 小时开放，NZD 50/天",
      parkingEn: "Accor: indoor valet parking, 30 spaces open 24/7, NZD 50/day",
      nearbyAttractions: [
        { name: "Steamer Wharf · Walter Peak 码头", distance: "约 300—450 米", travelTime: "步行约 4—6 分钟", destinationQuery: "Steamer Wharf Queenstown" },
        { name: "Skyline Queenstown", distance: "约 500—700 米", travelTime: "步行约 7—9 分钟", destinationQuery: "Skyline Queenstown" },
        { name: "Queenstown Gardens", distance: "约 800 米—1 公里", travelTime: "步行约 10—12 分钟", destinationQuery: "Queenstown Gardens" },
      ],
      strengths: ["Steamer Wharf 与镇中心餐饮步行动线很短", "41 m² Superior King 空间明显更大", "双人 Spa 浴缸、地暖浴室与 Juliet 阳台", "Accor 官网房型、停车与官方图片已核对"],
      strengthsEn: ["Very short walk to Steamer Wharf and central dining", "The 41 m² Superior King is notably spacious", "Double spa bath, heated bathroom floor and Juliet balcony", "Direct room, parking and official imagery were checked"],
      cautions: ["代客停车 NZD 50/天", "目标日期仅返回 Penthouse No.10，公开四晚总价 NZD 19,731.25", "不可退且需预付；税费是否已含未说明"],
      cautionsEn: ["Valet parking costs NZD 50/day", "Only Penthouse No.10 was returned for the target dates, at NZD 19,731.25 for four nights", "Non-refundable and prepaid; tax inclusion was not stated"],
      ratings: [{ platform: "ALL Accor", score: "4.5 / 5", reviews: "1,054 条官网确认评价" }],
      roomTypes: [
        {
          rateKey: "superior-king-spa-balcony",
          name: "Superior Room · 1 King · Double Spa Bath · Juliet Balcony",
          nameEn: "Superior Room · 1 King · Double Spa Bath · Juliet Balcony",
          size: "41 m²",
          sizeEn: "41 m²",
          bed: "1 张 King 床",
          bedEn: "one king bed",
          photosVerified: true,
          facilities: ["城景", "Juliet 阳台", "大理石浴室与地暖", "雨淋花洒", "双人 Spa 浴缸", "Nespresso 咖啡机"],
          facilitiesEn: ["Town view", "Juliet balcony", "Marble bathroom with underfloor heating", "Rain shower", "Double spa bath", "Nespresso machine"],
          images: [
            image("queenstown-sofitel-superior-king.jpg", "Superior King 客房", "https://www.ahstatic.com/photos/5688_rokgb_00_p_2048x1536.jpg"),
          ],
        },
        {
          rateKey: "penthouse-no-10",
          name: "Penthouse No.10",
          nameEn: "Penthouse No.10",
          size: "面积以 Accor 结算页为准",
          sizeEn: "Confirm size at Accor checkout",
          bed: "床型以 Accor 结算页为准",
          bedEn: "Confirm bedding at Accor checkout",
          photosVerified: false,
          facilities: ["含早餐的目标日期唯一返回房型"],
          facilitiesEn: ["Only room category returned for the target dates; breakfast included"],
          images: [],
        },
      ],
      hotelImages: [
        image("queenstown-sofitel-entrance.jpg", "Sofitel Queenstown 正门", "https://www.ahstatic.com/photos/5688_ho_00_p_2048x1536.jpg"),
        image("queenstown-sofitel-exterior.jpg", "Sofitel Queenstown 建筑外观", "https://www.ahstatic.com/photos/5688_ho_01_p_2048x1536.jpg"),
      ],
      availabilityNote:
        "2026-08-03 已在 Accor 目标日期结果中核验：2026 年 9 月 29 日—10 月 3 日、2 人仅返回 Penthouse No.10，公开四晚总价 NZD 19,731.25，ALL 会员 NZD 18,744.69；核验时剩 1 间，含早餐、不可退且需预付。页面未说明税费是否已含，不作推断。",
      availabilityNoteEn:
        "Verified in Accor's exact-date result on 3 Aug 2026 for 29 Sep–3 Oct and two adults: only Penthouse No.10 was returned, at NZD 19,731.25 public or NZD 18,744.69 for ALL members for four nights. One room remained; breakfast was included and the rate was non-refundable and prepaid. Tax inclusion was not stated and is not inferred.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": { roomRates: { "penthouse-no-10": { official: {
          source: "Accor 官网",
          sourceEn: "Accor direct website",
          roomKey: "penthouse-no-10",
          room: "Penthouse No.10 · 目标日期唯一返回房型 · 4 晚",
          roomEn: "Penthouse No.10 · only returned room for the target dates · four nights",
          nonRefundableNzd: 19731.25,
          refundableNzd: null,
          inventory: 1,
          rateLabel: "公开价 · 含早餐 · 不可退款 · 税费是否已含未说明",
          rateLabelEn: "Public rate · breakfast included · non-refundable · tax inclusion not stated",
          payment: "不可退款；需预付",
          paymentEn: "Non-refundable; prepayment required",
          breakfast: "含早餐",
          breakfastEn: "Breakfast included",
          memberNote: "ALL 会员四晚 NZD 18,744.69；仅作会员价附注",
          memberNoteEn: "ALL member total NZD 18,744.69 for four nights; noted separately",
          quotedAt: "2026-08-03",
        } } } },
      },
      research: sharedSocial.queenstown,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-08-03 已在 Accor 按 9 月 29 日—10 月 3 日、2 人核验：仅返回 Penthouse No.10，公开四晚 NZD 19,731.25、ALL 会员 NZD 18,744.69；剩 1 间，含早餐、不可退且需预付。税费是否已含未说明。",
      officialStatusEn:
        "Verified on Accor on 3 Aug 2026 for 29 Sep–3 Oct and two adults: only Penthouse No.10 was returned, at NZD 19,731.25 public or NZD 18,744.69 for ALL members for four nights. One room remained; breakfast was included and the rate was non-refundable and prepaid. Tax inclusion was not stated.",
      excludedByPreference: true,
      officialVerifiedAt: "2026-08-03",
      officialUrl: "https://all.accor.com/hotel/5688/index.en.shtml",
      officialBookingUrl: "https://all.accor.com/ssr/app/accor/rates/5688/index.en.shtml?dateIn=2026-09-29&nights=4&compositions=2&stayplus=false",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开 Accor 官网并重新核对日期",
      officialLinkLabelEn: "Open Accor and recheck the dates",
      officialLinkNote: "请重新选择 2026 年 9 月 29 日—10 月 3 日、2 位成人、1 间，并在付款前核对含税总价、早餐、停车、取消截止时间和扣款规则。",
      officialLinkNoteEn: "Reselect 29 Sep–3 Oct 2026, two adults and one room, then verify the tax-inclusive total, breakfast, parking, cancellation deadline and charge terms before payment.",
      position: [-45.031318, 168.658901],
      mapQuery: "Sofitel Queenstown Hotel & Spa",
    },
    {
      id: "crowne-plaza-queenstown",
      stayType: "hotel",
      name: "Crowne Plaza Queenstown by IHG",
      recommendation: "码头步行标杆 · 高价",
      recommendationEn: "Premium wharf walkability",
      summary:
        "就在 Beach Street 湖边，位置评分 9.8，去 Steamer Wharf 与镇中心最直接；当前保留的湖景阳台 King 有精确房型图片，Booking.com 四晚可取消价为 NZD 5,249。",
      summaryEn:
        "The strongest hotel for wharf walkability. The retained lake-view balcony king has exact-category photos and a four-night cancellable Booking.com total of NZD 5,249.",
      access: "Beach Street 湖边；Steamer Wharf 对面一带",
      accessEn: "Lakefront Beach Street, next to the wharf precinct",
      parking: "私人停车额外收费；Booking 含 1 个车位套餐总价 NZD 5,253",
      parkingEn: "Paid private parking; parking-inclusive Booking plan totals NZD 5,253",
      nearbyAttractions: [
        {
          name: "Steamer Wharf · Walter Peak 码头",
          distance: "约 100—250 米",
          travelTime: "步行约 2—4 分钟",
          destinationQuery: "Steamer Wharf Queenstown",
        },
        {
          name: "Queenstown Gardens",
          distance: "约 700—900 米",
          travelTime: "步行约 10—12 分钟",
          destinationQuery: "Queenstown Gardens",
        },
        {
          name: "Glenorchy 公路起点",
          distance: "约 1 公里",
          travelTime: "驾车约 3—5 分钟",
          destinationQuery: "Glenorchy Queenstown Road",
        },
        {
          name: "Queenstown Airport",
          distance: "约 8 公里",
          travelTime: "驾车约 15—20 分钟",
          destinationQuery: "Queenstown Airport",
        },
      ],
      strengths: [
        "Walter Peak 当天几乎不用交通",
        "湖景阳台纯特大床房",
        "平台房型画廊 15 张已核验，精选展示 5 张",
        "含早餐",
        "9 月 28 日前免费取消",
        "位置评分 9.8",
      ],
      strengthsEn: [
        "Almost no transport needed on the Walter Peak day",
        "Lake-view balcony room with a guaranteed king bed",
        "Fifteen platform room photos verified, with five selected for display",
        "Breakfast included",
        "Free cancellation before 28 Sep",
        "9.8 location score",
      ],
      cautions: [
        "当前保留的湖景阳台 King 四晚总价高",
        "普通方案停车另收费",
        "性价比评分仅 7.6",
      ],
      cautionsEn: [
        "The retained lake-view balcony king has a high four-night total",
        "Parking costs extra on the standard plan",
        "Value-for-money score is only 7.6",
      ],
      ratings: [
        { platform: "Booking.com", score: "8.3 / 10", reviews: "1,524 条 · 位置 9.8" },
      ],
      roomTypes: [
        {
          rateKey: "lake-view-balcony-king",
          name: "湖景阳台特大床房",
          size: "32 m²",
          bed: "1 张超大号双人床",
          photosVerified: true,
          facilities: ["湖景", "阳台", "浴缸", "空调", "咖啡机", "迷你吧", "免费 Wi-Fi"],
          images: [
            image("crowne-plaza-lake-king-1.jpg", "湖景阳台特大床房", "Booking.com"),
            image("crowne-plaza-lake-king-2.jpg", "特大床房休息区", "Booking.com"),
            image("crowne-plaza-lake-king-3.jpg", "特大床房浴室", "Booking.com"),
            image("crowne-plaza-lake-king-4.jpg", "特大床房阳台", "Booking.com"),
            image("crowne-plaza-lake-king-5.jpg", "特大床房湖景", "Booking.com"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "当前仅展示有对应房型图片的 Lake View King with Balcony。Booking.com 已按 2026 年 9 月 29 日—10 月 3 日、2 人 1 间核验：四晚可取消总价 NZD 5,249，含早餐，可在 9 月 28 日前免费取消；含停车套餐为 NZD 5,253。此前核验的 IHG 山景阳台 King 因没有对应房型图片，已从展示房型和价格中移除。",
      availabilityNoteEn:
        "Only the Lake View King with Balcony, which has exact-category photos, remains displayed. Booking.com was checked for 29 Sep–3 Oct 2026, two adults and one room: the four-night cancellable total was NZD 5,249 with breakfast and free cancellation before 28 Sep; the parking-inclusive plan was NZD 5,253. The previously checked direct mountain-view balcony king has been removed from the displayed rooms and rates because it lacks exact-category photos.",
      rateSnapshots: {
        "2026-09-29/2026-10-03": {
          roomRates: {
            "lake-view-balcony-king": {
              booking: {
                source: "Booking.com",
                roomKey: "lake-view-balcony-king",
                room: "Lake View King with Balcony · 32 m²",
                nonRefundableNzd: null,
                refundableNzd: 5249,
                cancelUntil: "2026-09-28",
                payment: "无需预付、到店付款；含停车套餐总价 NZD 5,253",
                breakfast: "含早餐",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.queenstown,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-28 已核验 IHG 山景阳台 King，但该房型没有对应图片，现已从展示房型与价格中移除。当前保留的湖景阳台 King 仅有 Booking.com 精确日期报价；官网同房型价格仍待重新匹配。",
      officialStatusEn:
        "The direct mountain-view balcony king was checked on 28 Jul 2026, but it lacked exact-category photos and has been removed from the displayed rooms and rates. The retained lake-view balcony king has an exact-date Booking.com quote only; its matching direct rate still needs verification.",
      officialVerifiedAt: "2026-07-28",
      officialUrl: "https://www.ihg.com/crowneplaza/hotels/us/en/queenstown/zqnbs/hoteldetail",
      officialBookingUrl:
        "https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?qDest=93%20Beach%20Street%2C%20Queenstown%209300%2C%20New%20Zealand&qPt=CASH&qCiD=29&qCoD=3&qCiMy=082026&qCoMy=092026&qAdlt=2&qChld=0&qRms=1&qAAR=6CBARC&qSlH=ZQNBS&qAkamaiCC=CN&srb_u=1&qExpndSrch=false&qFS=false&qSrt=sAV&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.kd.ma.sp.va.re.vx.nd.sx.we.lx.rn.sn.nu.ge.fa&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=true&qpMbw=0&qErm=false&qpMn=1&qpMbx=0&qLoSe=false&qDr=1&qSt=Crowne%20Plaza%20Queenstown&qRmFltr=",
      bookingUrl:
        "https://www.booking.com/hotel/nz/crowne-plaza-queenstown.zh-cn.html",
      position: [-45.0311, 168.6583],
      mapQuery: "Crowne Plaza Queenstown",
    },
];
