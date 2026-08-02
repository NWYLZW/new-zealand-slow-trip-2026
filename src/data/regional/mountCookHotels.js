import { googleGuestRating, image, sharedSocial } from "./shared.js";

export const mountCookHotels = [
    {
      id: "peppers-bluewater-resort-lake-tekapo",
      stayType: "hotel",
      name: "Peppers Bluewater Resort Lake Tekapo",
      recommendation: "传统酒店 · Tekapo 远距备选",
      recommendationEn: "Conventional hotel · distant Tekapo alternative",
      summary:
        "位于 Lake Tekapo 的传统度假酒店，不在 Aoraki / Mount Cook Village。适合想住酒店、免费停车并在 Tekapo 用餐的旅客，但去 Mount Cook Airport 或 Hooker Valley 都要约 100 公里；若次晨有直升机候补或早走步道，这个驾驶代价明显高于山村内住宿。",
      summaryEn:
        "A conventional resort hotel in Lake Tekapo, not Aoraki / Mount Cook Village. It offers hotel service, free parking and dining in Tekapo, but both Mount Cook Airport and Hooker Valley are roughly 100 km away, a material trade-off for an early helicopter backup or trail start.",
      access: "State Highway 8，Lake Tekapo；不是库克山村住宿",
      accessEn: "State Highway 8, Lake Tekapo; this is not a Mount Cook Village stay",
      parking: "官网列明免费停车；酒店 24 小时前台",
      parkingEn: "The official site lists free parking and a 24-hour reception",
      nearbyAttractions: [
        {
          name: "Mount Cook Airport · 直升机集合",
          nameEn: "Mount Cook Airport · helicopter meeting point",
          distance: "道路约 99 公里",
          distanceEn: "About 99 km by road",
          travelTime: "常规路线约 1 小时 15—25 分钟；冬季或暗夜应留更多余量",
          travelTimeEn: "Roughly 1 hr 15–25 min in normal conditions; allow more in winter or darkness",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Hooker Valley Track 起点 · White Horse Hill",
          nameEn: "Hooker Valley Track trailhead · White Horse Hill",
          distance: "道路约 105 公里",
          distanceEn: "About 105 km by road",
          travelTime: "常规路线约 1 小时 20—30 分钟；不适合包装成步道旁住宿",
          travelTimeEn: "Roughly 1 hr 20–30 min in normal conditions; this is not a trailhead-adjacent stay",
          destinationQuery: "White Horse Hill Campground",
        },
        {
          name: "Lake Tekapo 镇区与湖滨",
          nameEn: "Lake Tekapo village and lakefront",
          distance: "官网标示约 1 公里",
          distanceEn: "About 1 km according to the official site",
          travelTime: "步行约 10—15 分钟",
          travelTimeEn: "About 10–15 minutes on foot",
          destinationQuery: "Lake Tekapo Village",
        },
      ],
      strengths: [
        "补足本地区传统 hotel 类型，并有 24 小时前台",
        "官网明确列出免费停车、Wi-Fi 与 Rakinui Restaurant & Bar",
        "Deluxe Hotel Room 为 22 m²，默认 1 张 King，带地面层露台",
      ],
      strengthsEn: [
        "Adds a conventional hotel option with a 24-hour reception",
        "The official site lists free parking, Wi-Fi and Rakinui Restaurant & Bar",
        "The 22 m² Deluxe Hotel Room defaults to one king and opens to a ground-floor deck",
      ],
      cautions: [
        "明确位于 Lake Tekapo，不在 Aoraki / Mount Cook Village",
        "到 Mount Cook Airport 约 99 公里，到 Hooker Valley 起点约 105 公里",
        "2026 年 10 月 5—6 日、2 人的实时库存、含税总价、早餐、付款和退改尚未复现",
        "官网 TripAdvisor schema 当前仅 3.5 / 5，需结合 4,573 条评价阅读具体反馈",
      ],
      cautionsEn: [
        "It is explicitly in Lake Tekapo, not Aoraki / Mount Cook Village",
        "Mount Cook Airport is about 99 km away and the Hooker Valley trailhead about 105 km away",
        "Live inventory, tax-inclusive total, breakfast, payment and cancellation terms for 5–6 Oct 2026 and two guests were not reproduced",
        "The official-site TripAdvisor schema currently shows only 3.5 / 5, so read the detail behind its 4,573 reviews",
      ],
      ratings: [
        {
          platform: "TripAdvisor · 酒店官网 schema",
          platformEn: "TripAdvisor · schema on official hotel site",
          score: "3.5 / 5",
          scoreEn: "3.5 / 5",
          reviews: "4,573 条评价",
          reviewsEn: "4,573 reviews",
          sourceUrl: "https://www.peppers.co.nz/bluewater/",
          reviewedAt: "2026-08-01T16:10:00.000Z",
          verifiedPosition: [-44.0031256720704, 170.47399520874],
        },
      ],
      roomTypes: [
        {
          rateKey: "deluxe-hotel-room",
          name: "Deluxe Hotel Room",
          nameEn: "Deluxe Hotel Room",
          size: "22 平方米",
          sizeEn: "22 square metres",
          bed: "默认 1 张 King；如需改床型须在预订阶段提出",
          bedEn: "One king by default; request any alternate bedding at reservation stage",
          photosVerified: true,
          photoNote: "3 张图片均来自 Peppers 官网图库中标为 Deluxe Hotel Room 602A 的同一房型，展示卧室 / 露台视角和浴室。",
          photoNoteEn: "All three images are from the official Peppers gallery and are labelled for the same Deluxe Hotel Room 602A, showing the bedroom/deck angles and bathroom.",
          facilities: [
            "地面层露台",
            "浴室与淋浴",
            "浴室地暖",
            "有线电视",
            "Wi-Fi",
            "冰箱",
            "茶 / 咖啡设施",
          ],
          facilitiesEn: [
            "Ground-floor deck",
            "Bathroom with shower",
            "Underfloor bathroom heating",
            "Cable television",
            "Wi-Fi",
            "Refrigerator",
            "Tea and coffee facilities",
          ],
          images: [
            {
              ...image(
                "peppers-bluewater-deluxe-room-bed.jpg",
                "Deluxe Hotel Room 602A · King 床与露台",
                "https://www.peppers.co.nz/Portals/0/GalleryImages/System/Peppers/BluewaterResort/Approved/Peppers-Bluewater-Lake-Tekapo-New-Zealand-Hotel-Deluxe-Hotel-Room-602A-1.t102027.jpg",
              ),
              labelEn: "Deluxe Hotel Room 602A · king bed and deck",
            },
            {
              ...image(
                "peppers-bluewater-deluxe-room-deck.jpg",
                "Deluxe Hotel Room 602A · 卧室全景与地面层露台",
                "https://www.peppers.co.nz/Portals/0/GalleryImages/System/Peppers/BluewaterResort/Approved/Peppers-Bluewater-Lake-Tekapo-New-Zealand-Hotel-Deluxe-Hotel-Room-602A-2.t102035.jpg",
              ),
              labelEn: "Deluxe Hotel Room 602A · bedroom overview and ground-floor deck",
            },
            {
              ...image(
                "peppers-bluewater-deluxe-room-bathroom.jpg",
                "Deluxe Hotel Room 602A · 浴室",
                "https://www.peppers.co.nz/Portals/0/GalleryImages/System/Peppers/BluewaterResort/Approved/Peppers-Bluewater-Lake-Tekapo-New-Zealand-Hotel-Deluxe-Hotel-Room-602A-4.t102053.jpg",
              ),
              labelEn: "Deluxe Hotel Room 602A · bathroom",
            },
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "2026-08-02 已核验 Peppers 官网住宿身份、Lake Tekapo 地址、Deluxe Hotel Room 房型资料、设施、图片、免费停车和官网 TripAdvisor schema；但未能复现 2026 年 10 月 5—6 日、2 位成人的可订房、含税总价、早餐、付款与退改条件，状态诚实保留为 needs-recheck。",
      availabilityNoteEn:
        "On 2 Aug 2026 the Peppers site was checked for property identity, its Lake Tekapo address, Deluxe Hotel Room details, facilities, imagery, free parking and the embedded TripAdvisor schema. Exact inventory, a tax-inclusive total, breakfast, payment and cancellation terms for two adults on 5–6 Oct 2026 could not be reproduced, so the status remains needs-recheck.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          availabilityChecked: true,
          roomKey: "deluxe-hotel-room",
          quotedAt: "2026-08-02",
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-08-02 官网静态页面与房型 API 可核验酒店、地址、房型和设施，但官网搜索没有提供可保存并独立复现的 2026 年 10 月 5—6 日、2 人库存或报价；因此不声称可订或有精确价格，付款前必须重新查询。",
      officialStatusEn:
        "The official static pages and room API confirmed the property, address, room type and facilities on 2 Aug 2026, but the official search did not expose independently reproducible inventory or a quote for two guests on 5–6 Oct 2026. No availability or exact price is claimed; recheck before payment.",
      officialVerifiedAt: "2026-08-02",
      officialUrl: "https://www.peppers.co.nz/bluewater/",
      officialBookingUrl: "https://www.peppers.co.nz/bluewater/?buildingid=4466&arrivaldate=2026-10-05&nights=1",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开官网并重选日期",
      officialLinkLabelEn: "Open official site and reselect dates",
      officialLinkNote: "官网链接含酒店和到店日期参数，但不能稳定保留 2 位成人及完整搜索结果；打开后请重选 2026 年 10 月 5—6 日、2 位成人、1 间。",
      officialLinkNoteEn: "The official link carries the property and arrival date but does not reliably retain two adults or the complete results. Reselect 5–6 Oct 2026 for two adults and one room after opening.",
      position: [-44.0031256720704, 170.47399520874],
      mapQuery: "Peppers Bluewater Resort Lake Tekapo",
    },
    {
      id: "hermitage-mt-cook-motel-studio-queen",
      stayType: "motel",
      name: "The Hermitage · Mt Cook Motel Studio Queen",
      recommendation: "已预订 · 含双人早餐",
      recommendationEn: "Booked · breakfast for two included",
      summary:
        "冬宫官网精确日期唯一可订房型。客房不在 The Hermitage 主楼，而在同一官方体系的 Mt Cook Motel 独立汽车旅馆楼；优势是留在库克山村、带完整厨房，代价是无保证库克山景，去主楼餐厅需步行约 16 分钟。",
      summaryEn:
        "The only room type available direct for the exact night, in the separate Mt Cook Motel building rather than the Hermitage main hotel.",
      access: "Mt Cook Motel 独立楼；距 The Hermitage 主楼约 1.0 公里，平路步行约 16 分钟",
      accessEn: "Separate Mt Cook Motel building; about 1.0 km or a 16-minute level walk from the Hermitage main hotel",
      parking: "房型设施列有免费停车；自驾可直接停在 Motel",
      parkingEn: "Free parking is listed for the room; drive directly to the motel building",
      nearbyAttractions: [
        {
          name: "The Hermitage 主楼 · 餐厅 / Big Sky",
          distance: "约 1.0 公里",
          travelTime: "平路步行约 16 分钟；驾车约 3 分钟",
          destinationQuery: "The Hermitage Hotel Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 6 公里",
          travelTime: "驾车约 7—10 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Hooker Valley Track 停车场",
          distance: "约 4—5 公里",
          travelTime: "驾车约 7—10 分钟",
          destinationQuery: "White Horse Hill Campground",
        },
      ],
      strengths: [
        "冬宫官网订单已确认，确认号已私下保存",
        "住在库克山村内，比住 Twizel 少约 50 分钟夜间驾驶",
        "Queen 床、完整厨房、独立浴室和免费停车",
        "入住前 48 小时以外取消可全额退款",
        "小红书实住者认为 Motel 空间和性价比优于主楼基础体验",
      ],
      strengthsEn: [
        "Direct Hermitage booking confirmed, with the confirmation number stored privately",
        "Stays inside Mount Cook Village and avoids roughly 50 minutes of night driving to Twizel",
        "Queen bed, full kitchen, private bathroom and free parking",
        "Fully refundable when cancelled more than 48 hours before arrival",
        "Xiaohongshu guests report better space and value than the main hotel's entry-level experience",
      ],
      cautions: [
        "不是 The Hermitage 主楼客房；去主楼餐厅步行约 16 分钟",
        "官网明确写明不提供 Aoraki / Mount Cook 景观保证",
        "景观取决于具体分房，小红书的前排山景不能视为保证",
        "已全额支付 NZD 504；进入入住前 48 小时后取消收全额",
        "10 月入住需先到 Mt Cook Lodge 办理入住",
      ],
      cautionsEn: [
        "This is not in The Hermitage main building; the main restaurants are about a 16-minute walk away",
        "The official listing explicitly does not guarantee an Aoraki / Mount Cook view",
        "The view depends on room allocation; front-row mountain views shown on Xiaohongshu are not guaranteed",
        "NZD 504 has been paid in full; cancellation within 48 hours of arrival forfeits the full amount",
        "October arrivals check in at Mt Cook Lodge",
      ],
      ratings: [
        { platform: "冬宫官网", score: "预订已确认", reviews: "确认号已私下保存 · 2026-07-28" },
      ],
      roomTypes: [
        {
          rateKey: "mt-cook-motel-studio-queen",
          name: "Mt Cook Motel Studio Queen",
          size: "20 m²",
          bed: "1 张 Queen 床",
          photosVerified: true,
          photoNote: "3 张图片均来自 Hermitage 官网 Mt Cook Motel 图库，分别展示 Studio 卧室、浴室和完整厨房；未混用主楼景观房图片",
          photoNoteEn: "All three images come from The Hermitage's Mt Cook Motel gallery and show the studio bedroom, bathroom and full kitchen; no main-hotel view-room image is mixed in.",
          facilities: [
            "完整厨房",
            "私人浴室 · 淋浴",
            "用餐区",
            "电视",
            "微波炉",
            "烤面包机",
            "茶 / 咖啡设施",
            "免费停车",
            "有限免费 Wi-Fi",
          ],
          images: [
            image("hermitage-motel-studio-official-1.jpg", "Mt Cook Motel Studio 卧室", "The Hermitage 官网"),
            image("hermitage-motel-studio-official-2.jpg", "Mt Cook Motel Studio 浴室", "The Hermitage 官网"),
            image("hermitage-motel-studio-official-3.jpg", "Mt Cook Motel Studio 完整厨房", "The Hermitage 官网"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "已在冬宫官网预订成功：确认号已私下保存；2026 年 10 月 5 日入住、10 月 6 日退房，2 位成人；Special Bed and Breakfast Save $10 套餐，总价 NZD 504（含税），早餐在 The Hermitage 主楼 Alpine Restaurant。",
      availabilityNoteEn:
        "Booked successfully on The Hermitage website for 5–6 Oct 2026 and two adults; the confirmation number is stored privately. The Special Bed and Breakfast Save $10 package totals NZD 504 including tax, with breakfast served at Alpine Restaurant in The Hermitage main building.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "mt-cook-motel-studio-queen": {
              official: {
                source: "冬宫官网",
                roomKey: "mt-cook-motel-studio-queen",
                room: "Mt Cook Motel Studio Queen · 20 m²",
                roomEn: "Mt Cook Motel Studio Queen · 20 m²",
                refundableNzd: 504,
                nonRefundableNzd: null,
                cancelUntil: "入住前 48 小时（酒店当地时间）",
                payment: "已全额支付；确认号已私下保存；进入入住前 48 小时后取消收 NZD 504",
                paymentEn: "Paid in full; the confirmation number is stored privately; cancellation within 48 hours of arrival incurs the full NZD 504 charge",
                breakfast: "含 2 位成人自助早餐；在 The Hermitage 主楼 Alpine Restaurant 用餐",
                breakfastEn: "Buffet breakfast for two adults included, served at Alpine Restaurant in The Hermitage main building",
                quotedAt: "2026-07-28",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "冬宫官网订单已完成：2026 年 10 月 5—6 日、2 位成人、Mt Cook Motel Studio Queen、含双人早餐，含税总价 NZD 504；确认号已私下保存。",
      officialStatusEn:
        "Booked direct for 5–6 Oct 2026, two adults, Mt Cook Motel Studio Queen with breakfast for two, NZD 504 tax-inclusive; confirmation number stored privately.",
      officialVerifiedAt: "2026-07-28",
      officialUrl:
        "https://book.hermitage.co.nz/onecart/wbe/room/20104/hermitage/2026-10-05/2026-10-06/BBSAVE10/2",
      position: [-43.7363846, 170.0987676],
      mapQuery: "Mt Cook Lodge & Motels New Zealand",
    },
    {
      id: "omahau-down",
      stayType: "home",
      name: "Omahau Down",
      recommendation: "低价大床 · 真实可订",
      recommendationEn: "Verified lower-cost king",
      summary:
        "Booking 精确日期可订的普卡基湖 / Twizel 农场旅馆。三种大床客房同价，带私人卫浴并共享厨房；比 Twizel 镇内民宿更有山景，但评分和私密性不如整套房。",
      summaryEn:
        "A verified farm guesthouse near Lake Pukaki with three same-price king/queen rooms and a shared kitchen.",
      access: "普卡基湖 / Twizel 一带；到 Twizel 约 5 分钟车程",
      accessEn:
        "Lake Pukaki / Twizel area; about five minutes by car to Twizel",
      parking: "免费私人停车",
      parkingEn: "Free private parking",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "约 60—65 公里",
          travelTime: "驾车约 50—55 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 55—60 公里",
          travelTime: "驾车约 45—50 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 8—12 公里",
          travelTime: "驾车约 8—10 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "Booking 真实详情页已核验",
        "三种大床房型同价",
        "私人浴室与山景",
        "9 月 28 日前免费取消",
        "9 月 26 日前零付款",
      ],
      strengthsEn: [
        "The concrete Booking.com property page and exact stay were checked",
        "Three king- or queen-bed room choices were shown at the same checked total",
        "Private bathrooms and mountain views are listed",
        "The checked offer allowed free cancellation until 28 September",
        "The checked offer required no payment before 26 September",
      ],
      cautions: [
        "评分仅 7.6",
        "属于共享四卧室农舍而非酒店",
        "Big Sky 后仍需夜间驾驶约 50 分钟",
      ],
      cautionsEn: [
        "Its checked Booking.com score is only 7.6",
        "This is a shared four-bedroom farmhouse rather than a conventional hotel",
        "The drive back after Big Sky is still about 50 minutes at night",
      ],
      ratings: [
        { platform: "Booking.com", score: "7.6 / 10", reviews: "23 条" },
      ],
      roomTypes: [
        {
          rateKey: "deluxe-king",
          name: "豪华间",
          size: "25 m²",
          bed: "1 张超大号双人床 + 1 张沙发床",
          photosVerified: true,
          facilities: [
            "私人厨房",
            "私人浴室",
            "阳台",
            "山景",
            "洗碗机",
            "咖啡机",
            "免费 Wi-Fi",
          ],
          images: [
            image("omahau-deluxe-1.jpg", "豪华间卧室"),
            image("omahau-deluxe-2.jpg", "豪华间休息区"),
            image("omahau-deluxe-3.jpg", "豪华间私人浴室"),
          ],
        },
        {
          rateKey: "private-queen",
          name: "双人间 · 私人浴室",
          size: "25 m²",
          bed: "1 张大号双人床 + 1 张沙发床",
          photosVerified: true,
          facilities: [
            "私人小厨房",
            "私人浴室",
            "阳台",
            "山景",
            "洗碗机",
            "咖啡机",
            "免费 Wi-Fi",
          ],
          images: [
            image("omahau-private-queen-1.jpg", "私人浴室双人间卧室"),
            image("omahau-private-queen-2.jpg", "私人浴室双人间浴室"),
          ],
        },
        {
          rateKey: "mountain-queen",
          name: "山景特大号床间（平台床型标 Queen）",
          size: "25 m²",
          bed: "1 张大号双人床 + 1 张沙发床",
          photosVerified: true,
          facilities: [
            "私人厨房",
            "私人浴室",
            "阳台",
            "山景",
            "洗碗机",
            "咖啡机",
            "免费 Wi-Fi",
          ],
          images: [
            image("omahau-mountain-queen-1.jpg", "山景大床房卧室"),
            image("omahau-mountain-queen-2.jpg", "山景大床房窗景"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "2026-07-28 未找到可确认由经营方控制的独立官网或直订引擎；2026 年 10 月 5—6 日、2 人仅保留已核验的 Booking.com 房型与报价，聚合页不冒充官网。",
      availabilityNoteEn:
        "No independently controlled property website or direct engine could be verified on 28 Jul 2026. For 5–6 Oct 2026 and two guests, only the checked Booking.com room types and rates are retained; aggregators are not presented as the official site.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "deluxe-king": {
              booking: {
                source: "Booking.com",
                roomKey: "deluxe-king",
                room: "豪华间 · 25 m²",
                refundableNzd: 312,
                nonRefundableNzd: null,
                cancelUntil: "2026-09-28",
                payment: "9 月 26 日前（不含当日）零付款；当前剩 1 间",
                breakfast: "共享厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
            "private-queen": {
              booking: {
                source: "Booking.com",
                roomKey: "private-queen",
                room: "双人间 · 私人浴室 · 25 m²",
                refundableNzd: 312,
                nonRefundableNzd: null,
                cancelUntil: "2026-09-28",
                payment: "9 月 26 日前（不含当日）零付款；当前剩 1 间",
                breakfast: "共享厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
            "mountain-queen": {
              booking: {
                source: "Booking.com",
                roomKey: "mountain-queen",
                room: "山景大床间 · 25 m²",
                refundableNzd: 312,
                nonRefundableNzd: null,
                cancelUntil: "2026-09-28",
                payment: "9 月 26 日前（不含当日）零付款；当前剩 1 间",
                breakfast: "共享厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "no-independent-official-found",
      officialStatusDetail:
        "2026-07-28 已实际查找并打开 Omahau Down / Omahau Downs 的搜索候选，包括区域旅游页、Traveleto、酒店聚合页、Facebook、Airbnb 与 Booking；未找到可确认由经营方控制、并能按 2026 年 10 月 5—6 日、2 人查询的独立官网或直订引擎。聚合站不会冒充官网，页面仅保留已实查的 Booking 报价。",
      officialStatusEn:
        "Searched for and opened Omahau Down / Omahau Downs candidates on 28 Jul 2026, including the regional tourism page, Traveleto, hotel aggregators, Facebook, Airbnb and Booking.com. No independently controlled property website or direct engine could be verified for 5–6 Oct 2026 and two guests. Aggregators are not presented as the official site; only the checked Booking.com rates remain.",
      officialVerifiedAt: "2026-07-28",
      bookingUrl: "https://www.booking.com/hotel/nz/omahau-down.html",
      position: [-44.167, 170.127],
      mapQuery: "Omahau Down Lake Pukaki",
    },
    {
      id: "simons-hill-dark-sky",
      stayType: "home",
      name: "Simons Hill in the NZ Dark Sky Reserve",
      recommendation: "高分观星木屋 · 真实可订",
      recommendationEn: "Verified high-rated dark-sky chalet",
      summary:
        "SH8 旁的 Simons Hill Station 官方 Queen 小屋，私密性和观星环境强，官网确认两种小屋均带私人浴室和 Spa；精确日期价格目前仅在 Booking 核验，官网只提供邮件询价，且次晨去库克山机场仍需长途驾驶。",
      summaryEn:
        "A verified private queen chalet with a kitchen and hot tub in the dark-sky reserve, but at a high price and with a long airport drive.",
      access: "2963 Tekapo–Twizel Road；距 Twizel 餐饮约 29 公里",
      accessEn: "2963 Tekapo–Twizel Road; about 29 km from Twizel dining",
      parking: "免费私人停车",
      parkingEn: "Free private parking",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "约 70 公里",
          travelTime: "驾车约 55—60 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 60—65 公里",
          travelTime: "驾车约 50—55 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 20—25 公里",
          travelTime: "驾车约 20 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "经营方官网与 Booking 真实详情页均已访问",
        "整套一卧室 Queen 木屋",
        "评分 9.2、位置 9.6",
        "私人厨房与热水浴池",
        "9 月 28 日前免费取消",
      ],
      strengthsEn: [
        "Both the operator's website and the concrete Booking.com listing were opened",
        "A self-contained one-bedroom hut with one queen bed",
        "Booking.com score 9.2 and location score 9.6",
        "Private kitchen and hot tub",
        "The checked Booking.com offer allowed free cancellation until 28 September",
      ],
      cautions: [
        "一晚 NZD 825 起，价格高",
        "官网只有邮件询价，未提供可复现的精确日期直订价",
        "距餐厅约 29 公里",
        "Big Sky 后和次晨候补均要较长驾驶",
      ],
      cautionsEn: [
        "The checked Booking.com total starts at NZD 825 for one night",
        "The direct site accepts email enquiries only and exposes no reproducible exact-date rate",
        "The nearest listed restaurant is about 29 km away",
        "Both the post-Big-Sky return and next-morning backup plan require a long drive",
      ],
      ratings: [
        { platform: "Booking.com", score: "9.2 / 10", reviews: "59 条" },
      ],
      roomTypes: [
        {
          rateKey: "queen-chalet-825",
          name: "一卧室小屋",
          size: "平台搜索卡标 10 m²；详情页未重复标面积",
          bed: "1 张大号双人床",
          photosVerified: true,
          facilities: [
            "整租木屋",
            "私人厨房",
            "私人浴室",
            "山景",
            "空调",
            "庭院",
            "热水浴池",
            "咖啡机",
            "免费 Wi-Fi",
          ],
          images: [
            image("simons-good-shepherd-bedroom.jpg", "The Good Shepherds Hut 卧室与起居区", "Simons Hill Station 官网"),
            image("simons-good-shepherd-kitchen.jpg", "The Good Shepherds Hut 小厨房与窗景", "Simons Hill Station 官网"),
            image("simons-good-shepherd-hot-tub.jpg", "The Good Shepherds Hut 私人热水浴池与户外淋浴区", "Simons Hill Station 官网"),
          ],
        },
        {
          rateKey: "queen-chalet-935",
          name: "一卧室小屋 · 另一独立单元",
          size: "平台未明确区分面积",
          bed: "1 张大号双人床",
          photosVerified: true,
          facilities: [
            "整租木屋",
            "私人厨房",
            "私人浴室",
            "山景",
            "空调",
            "庭院",
            "热水浴池",
            "咖啡机",
            "免费 Wi-Fi",
          ],
          images: [
            image("simons-charlie-bedroom.jpg", "Concertina Charlie's Hut Queen 卧室", "Simons Hill Station 官网"),
            image("simons-charlie-bathroom.jpg", "Concertina Charlie's Hut 私人浴室", "Simons Hill Station 官网"),
            image("simons-charlie-living.jpg", "Concertina Charlie's Hut 起居区与小厨房", "Simons Hill Station 官网"),
            image("simons-charlie-exterior.jpg", "Concertina Charlie's Hut 建筑外观与热水浴池", "Simons Hill Station 官网"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "2026-07-28 已核验官网两种 Queen 小屋、私人浴室与 Spa，但官网仅接受邮件询价；2026 年 10 月 5—6 日、2 人价格仅保留已核验的 Booking.com 报价，不推测官网价。",
      availabilityNoteEn:
        "The direct site was checked on 28 Jul 2026 and confirms two queen huts with private bathrooms and spas, but booking is by email enquiry only. For 5–6 Oct 2026 and two guests, only the verified Booking.com rates are retained; no direct price is inferred.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "queen-chalet-825": {
              booking: {
                source: "Booking.com",
                roomKey: "queen-chalet-825",
                room: "一卧室 Queen 木屋",
                refundableNzd: 825,
                nonRefundableNzd: null,
                cancelUntil: "2026-09-28",
                payment: "9 月 26 日前（不含当日）零付款",
                breakfast: "带厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
            "queen-chalet-935": {
              booking: {
                source: "Booking.com",
                roomKey: "queen-chalet-935",
                room: "一卧室 Queen 木屋 · 另一独立单元",
                refundableNzd: 935,
                nonRefundableNzd: null,
                cancelUntil: "2026-09-28",
                payment: "9 月 26 日前（不含当日）零付款",
                breakfast: "带厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "official-inquiry-only",
      officialStatusDetail:
        "2026-07-28 已实际打开 Simons Hill Station 官网及 The Good Shepherds Hut、Concertina Charlie's Hut 两个房型页。官网确认两者均为 2 人 Queen 床小屋，带私人浴室和 Spa，但预订入口仅为邮件询价，未提供可带入 2026 年 10 月 5—6 日、2 人并复现价格的在线引擎；因此页面仅保留 Booking 已核验报价，不猜官网价。",
      officialStatusEn:
        "Visited the Simons Hill Station website and both The Good Shepherds Hut and Concertina Charlie's Hut pages on 28 Jul 2026. The direct site confirms two-person queen-bed huts with private bathrooms and spas, but booking is by email enquiry only and no online engine reproduces a price for 5–6 Oct 2026 and two guests. Only the verified Booking.com rates are retained; no direct rate is inferred.",
      officialVerifiedAt: "2026-07-28",
      officialUrl: "https://www.simonshillstation.com/",
      bookingUrl:
        "https://www.booking.com/hotel/nz/the-good-shepherds-hut-in-the-nz-dark-sky-reserve.html",
      position: [-44.051, 170.155],
      mapQuery: "Simons Hill NZ Dark Sky Reserve",
    },
    {
      id: "mount-cook-station-huts",
      stayType: "home",
      name: "Mount Cook Station Huts",
      recommendation: "Braemar 农场体验 · 真实可订",
      recommendationEn: "Verified Braemar farm stay",
      summary:
        "用户提出的 Braemar Station 方向确实有真实可订的 Queen 牧羊人小屋，星空和农场景观强；但它在 Tasman River 另一侧，官网明确说明驾车到库克山村约 1.5 小时，不适合 Big Sky 和次晨直升机候补。",
      summaryEn:
        "A verified queen hut on Braemar Mount Cook Station Road, but the property states Mount Cook Village is about 1.5 hours away by road.",
      access: "1580 Braemar Mount Cook Station Road；碎石路进入",
      accessEn: "1580 Braemar Mount Cook Station Road via a bumpy gravel road",
      parking: "免费私人停车",
      parkingEn: "Free private parking",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "道路绕行",
          travelTime: "驾车约 1.5 小时",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "道路绕行",
          travelTime: "驾车约 1 小时 20—30 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Lake Tekapo Village",
          distance: "约 44 公里",
          travelTime: "驾车约 45 分钟",
          destinationQuery: "Lake Tekapo Village",
        },
      ],
      strengths: [
        "官网与 Booking 精确日期均已核验",
        "1 张 Queen 床",
        "农场、星空和南阿尔卑斯景观",
        "免费停车",
        "评分 8.7",
      ],
      strengthsEn: [
        "Exact dates verified on both the direct site and Booking.com",
        "One queen bed",
        "Farm, dark-sky and Southern Alps setting",
        "Free parking",
        "Booking.com score 8.7",
      ],
      cautions: [
        "官网预订时全额支付；任何取消收 NZD 25，入住前 30 天内取消则 100% 不退款",
        "浴室和厨房需走到户外",
        "碎石路颠簸",
        "无手机信号、Wi-Fi 有限",
        "不适合本次 Big Sky 与直升机候补动线",
      ],
      cautionsEn: [
        "The direct rate is paid in full at booking; every cancellation costs NZD 25 and cancellations within 30 days are fully non-refundable",
        "The shared bathroom and kitchen require going outdoors",
        "Long, bumpy gravel-road access",
        "Little or no mobile coverage and limited Wi-Fi",
        "Poor fit for this trip's Big Sky and helicopter-backup logistics",
      ],
      ratings: [
        { platform: "Booking.com", score: "8.7 / 10", reviews: "265 条" },
      ],
      roomTypes: [
        {
          rateKey: "queen-hut",
          name: "Station Huts Queen · Queen 牧羊人小屋",
          size: "平台未标",
          bed: "1 张 Queen 大号双人床（官网明确标注）",
          photosVerified: true,
          photoNote:
            "官网 Station Huts 图库将该图明确标为 Inside Double；页面同时标注小屋床型为 1 Queen / 2 Singles",
          facilities: [
            "景观",
            "共用独立厨房",
            "户外通往浴室",
            "免费 Wi-Fi（信号有限）",
          ],
          images: [
            image(
              "mount-cook-station-huts-queen-official.webp",
              "Station Huts · Inside Double 官网图",
              "Mount Cook Station 官网",
            ),
          ],
        },
      ],
      hotelImages: [
        image("mount-cook-station-huts-official-exterior.webp", "Station Huts 小屋外观", "Mount Cook Station 官网"),
        image("mount-cook-station-huts-official-view.webp", "Station Huts 农场与山景", "Mount Cook Station 官网"),
      ],
      availabilityNote:
        "官网与 Booking.com 同日均有 Station Huts Queen：官网含 15% GST 的结算总额 NZD 350，Booking 当前不可退款档 NZD 403。官网低 NZD 53，但需预订时全额支付；任何取消收 NZD 25，入住前 30 天内取消则 100% 不退款。官网未标明早餐。",
      availabilityNoteEn:
        "The Station Huts Queen is available for the exact stay both direct and on Booking.com: NZD 350 including 15% GST at direct checkout versus NZD 403 for Booking.com's current non-refundable rate. Direct is NZD 53 lower but requires full payment at booking; every cancellation costs NZD 25 and cancellations within 30 days are fully non-refundable. Breakfast is not stated.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "queen-hut": {
              official: {
                source: "Mount Cook Station 官网",
                roomKey: "queen-hut",
                room: "Station Huts Queen · 1 张 Queen 床",
                roomEn: "Station Huts Queen · one queen bed",
                refundableNzd: null,
                nonRefundableNzd: null,
                rateOptions: [
                  {
                    label: "官网结算总额",
                    labelEn: "Direct checkout total",
                    nzd: 350,
                    detail:
                      "10 月 5—6 日 · 2 位成人 · 1 晚 · 含 15% GST；预订时全额付款；任何取消收 NZD 25，入住前 30 天内取消 100% 不退款",
                    detailEn:
                      "5–6 Oct · two adults · one night · includes 15% GST; full payment at booking; every cancellation costs NZD 25 and cancellations within 30 days are fully non-refundable",
                  },
                ],
                cancelUntil: null,
                payment:
                  "结算按钮显示“全额支付 NZD 350”；官网条款要求预订时全额付款，信用卡手续费已包含在预订费中",
                paymentEn:
                  "The checkout button says pay NZD 350 in full; the direct terms require full payment at booking and state that card fees are included in the booking fee",
                breakfast: "官网房型页与结算摘要均未标明含早餐",
                breakfastEn:
                  "Neither the direct room page nor checkout summary states that breakfast is included",
                quotedAt: "2026-07-28",
              },
              booking: {
                source: "Booking.com",
                roomKey: "queen-hut",
                room: "Queen 牧羊人小屋 / 帐篷",
                refundableNzd: null,
                nonRefundableNzd: 403,
                cancelUntil: null,
                payment: "不可退款、在线付款；当前剩 1 间",
                breakfast: "共用厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-28 已在 Mount Cook Station 官方预订引擎带入 2026 年 10 月 5—6 日、2 位成人；Station Huts Queen 可订，结算摘要和付款按钮均显示总额 NZD 350。官网预订条款另行核验确认：房价含 15% GST、预订时全额付款；任何取消收 NZD 25，入住前 30 天内取消则 100% 不退款。官网未标明早餐，未作推断。",
      officialStatusEn:
        "Verified on 28 Jul 2026 in Mount Cook Station's direct booking engine for 5–6 Oct 2026 and two adults. The Station Huts Queen is available and both the cart summary and payment button show NZD 350 total. The direct terms were also opened and confirm 15% GST is included, full payment is required at booking, every cancellation costs NZD 25, and cancellations within 30 days are fully non-refundable. Breakfast is not stated and was not inferred.",
      officialVerifiedAt: "2026-07-28",
      officialUrl: "https://mountcookstation.co.nz/station-huts/",
      officialBookingUrl: "https://mountcookstation.co.nz/book-online/",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开官网预订页（需重新选择日期）",
      officialLinkLabelEn: "Open direct booking page (reselect dates)",
      officialRateLinkLabel: "官网 · 已核验（链接不保留搜索）",
      officialRateLinkLabelEn: "Official website · verified (link does not retain search)",
      officialLinkNote:
        "官网链接在新会话中不会保留本次购物车；打开后请重新选择 2026 年 10 月 5—6 日、2 位成人及 Station Huts Queen。NZD 350 与政策来自 2026-07-28 的实际结算和条款核验。",
      officialLinkNoteEn:
        "A new session will not retain this cart. After opening, reselect 5–6 Oct 2026, two adults and Station Huts Queen. The NZD 350 total and policies come from the live checkout and terms check on 28 Jul 2026.",
      bookingUrl:
        "https://www.booking.com/hotel/nz/mount-cook-station-huts.html",
      position: [-43.866, 170.482],
      mapQuery: "Mount Cook Station Huts",
    },
    {
      id: "ben-ohau-vista",
      stayType: "home",
      name: "Ben Ohau Vista",
      recommendation: "官网与 Agoda 均已核验可订",
      recommendationEn: "Verified direct and on Agoda",
      summary:
        "Twizel 镇内的整栋度假屋，管理方 Twizel Holiday Homes 官网与 Agoda 在 10 月 5 日均显示只剩 1 套。官网当前显示价低于 Agoda，但两端卧室元数据不一致，最终价差与第四间卧室配置都应在下单前确认；民宿不限制床位数量。",
      summaryEn:
        "A four-bedroom Twizel holiday home verified both direct with Twizel Holiday Homes and on Agoda, with strong privacy and self-catering facilities but added driving after the helicopter flight and stargazing.",
      access:
        "Twizel 镇内；到 Mount Cook Airport / Hermitage 约 50—55 分钟车程",
      accessEn:
        "In Twizel; about 50–55 minutes by car to Mount Cook Airport and the Hermitage",
      parking: "免费私人停车，无需预约",
      parkingEn: "Free private parking; no reservation required",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "约 65 公里",
          travelTime: "驾车约 50—55 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 60 公里",
          travelTime: "驾车约 45—50 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Hooker Valley Track 起点",
          distance: "约 69 公里",
          travelTime: "驾车约 55 分钟",
          destinationQuery: "White Horse Hill Campground",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 12 公里",
          travelTime: "驾车约 10 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "10 月 5—6 日官网与 Agoda 均已核验可订",
        "整栋房屋、厨房、花园与烧烤设施",
        "官网当前显示含清洁与预订费总价 NZD 338",
        "Agoda 档 9 月 20 日前免费取消",
        "Agoda 档 9 月 18 日再付款",
        "免费停车与 Wi-Fi",
      ],
      strengthsEn: [
        "Availability for 5–6 October was checked on both the direct engine and Agoda",
        "A whole home with a kitchen, garden and barbecue",
        "The direct engine showed NZD 338 including cleaning and booking fees",
        "The checked Agoda offer allowed free cancellation until 20 September",
        "The checked Agoda offer deferred payment until 18 September",
        "Free parking and Wi-Fi",
      ],
      cautions: [
        "看完 Big Sky 后需夜间驾驶约 50—55 分钟",
        "次晨直升机候补需提前近 1 小时出发",
        "15:00—17:30 到 Twizel Holiday Homes 取钥匙，与下午直升机冲突；下单前必须确认延迟取钥匙",
      ],
      cautionsEn: [
        "The return after Big Sky is about a 50–55-minute night drive",
        "A next-morning helicopter backup requires leaving nearly an hour early",
        "The stated 15:00–17:30 key collection at Twizel Holiday Homes conflicts with the afternoon helicopter; confirm late key collection before booking",
      ],
      ratings: [{ platform: "Agoda", score: "9.6 / 10", reviews: "6 条" }],
      roomTypes: [
        {
          rateKey: "whole-home",
          name: "Ben Ohau Vista · Whare Tironui 整栋度假屋",
          size: "平台未标",
          bed: "官网称 4 间卧室，但只列 1 张 California King + 2 张 Queen；Agoda 称 3 卧，需确认第四房配置",
          photosVerified: true,
          photoNote:
            "已在 Twizel Holiday Homes 同一房源官网与官方 RMS Cloud 预订页核对",
          facilities: [
            "独立厨房",
            "客厅与用餐区",
            "花园",
            "露台",
            "烧烤设施",
            "免费 Wi-Fi",
          ],
          images: [
            image(
              "ben-ohau-vista-official.jpg",
              "Ben Ohau Vista 管理方官网房源图",
              "Twizel Holiday Homes 官网",
            ),
          ],
        },
      ],
      hotelImages: [
        image("ben-ohau-vista-official-kitchen-view.jpg", "Ben Ohau Vista 厨房与窗景", "Twizel Holiday Homes 官方 RMS 图库"),
        image("ben-ohau-vista-official-living-kitchen.jpg", "Ben Ohau Vista 起居与厨房", "Twizel Holiday Homes 官方 RMS 图库"),
      ],
      availabilityNote:
        "管理方官网与 Agoda 已按 2026 年 10 月 5—6 日、2 人核验，均显示只剩 1 套。官网 Standard（含清洁与预订费）当前显示 NZD 338；Agoda 含税总价 NZD 456，当前页面价差 NZD 118，但最终价差仍以官网结算页税费为准。官网称 4 卧却只列 3 张床，Agoda 称 3 卧，平台元数据有冲突；下单前需确认第四房配置。Agoda 已明确 9 月 20 日前免费取消、9 月 18 日再付款；官网退改与扣款规则未在价格卡中展开。",
      availabilityNoteEn:
        "The manager's direct site and Agoda both show one home left for 5–6 Oct 2026 and two guests. The direct Standard total is NZD 338 including cleaning and booking fees, versus Agoda's NZD 456 tax-inclusive total, a NZD 118 difference. Agoda states free cancellation until 20 Sep and payment on 18 Sep; the direct price card does not expand cancellation or payment terms, so recheck them before checkout.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "whole-home": {
              official: {
                source: "Twizel Holiday Homes 官网",
                roomKey: "whole-home",
                room: "Ben Ohau Vista · Whare Tironui 整栋度假屋",
                roomEn: "Ben Ohau Vista · Whare Tironui whole holiday home",
                nonRefundableNzd: null,
                refundableNzd: null,
                rateOptions: [
                  {
                    label: "Standard · 含清洁与预订费",
                    labelEn: "Standard · cleaning and booking fees included",
                    nzd: 338,
                    detail:
                      "10 月 5—6 日 · 2 位客人 · 1 晚 · 官网显示仅剩 1 套；退改、扣款和税费拆分待结算前确认",
                    detailEn:
                      "5–6 Oct · two guests · one night · one home left; recheck cancellation, payment and any tax breakdown before checkout",
                  },
                ],
                cancelUntil: null,
                payment:
                  "官网价格卡未展开可复现的扣款与退款规则；加入购物车前需读取并确认",
                paymentEn:
                  "The direct price card does not expose reproducible payment or refund terms; recheck them before adding the stay to the cart",
                breakfast: "整栋民宿带厨房；官网价格卡未标明是否包含早餐，不作推断",
                breakfastEn: "The whole home has a kitchen; the direct price card does not state whether breakfast is included, so no inference is made",
                quotedAt: "2026-07-28",
              },
              agoda: {
                source: "Agoda",
                roomKey: "whole-home",
                room: "House, 3 Bedrooms · 整栋房屋",
                nonRefundableNzd: null,
                refundableNzd: 456,
                cancelUntil: "2026-09-20",
                payment: "可到 2026 年 9 月 18 日再付款；信用卡付款另收 3.25%",
                breakfast: "带厨房，不含早餐",
                quotedAt: "2026-07-27",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-28 已实际打开管理方 Twizel Holiday Homes 的 Ben Ohau Vista 同一房源页，并进入其官方 RMS Cloud 预订引擎带入 2026 年 10 月 5—6 日、2 位客人。结果明确显示 Available、Only 1 left，Standard（含清洁与预订费）总价 NZD 338。官网价格卡未展开退改、扣款与税费拆分，因此未作推断。",
      officialStatusEn:
        "Verified on 28 Jul 2026 on Twizel Holiday Homes' matching property page and its official RMS Cloud engine for 5–6 Oct 2026 and two guests. The result explicitly shows Available, Only 1 left, and a NZD 338 Standard total including cleaning and booking fees. Cancellation, payment and tax breakdowns were not expanded on the direct price card and were not inferred.",
      officialVerifiedAt: "2026-07-28",
      officialUrl: "https://twizelholidayhomes.com/property-view/?id=139",
      officialBookingUrl:
        "https://bookings.rmscloud.com/obookings3/Search/Index/9891/53/139",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开官网预订引擎（需重新选择日期）",
      officialLinkLabelEn: "Open direct engine (reselect dates)",
      officialRateLinkLabel: "官网 · 已核验（链接不保留搜索）",
      officialRateLinkLabelEn: "Official website · verified (link does not retain search)",
      officialLinkNote:
        "RMS Cloud 链接不编码本次日期和人数；打开后请重新选择 2026 年 10 月 5—6 日、2 位客人，并核对 Ben Ohau Vista。NZD 338 来自 2026-07-28 的实际结果。",
      officialLinkNoteEn:
        "The RMS Cloud link does not encode this stay or guest count. After opening, reselect 5–6 Oct 2026 and two guests, then confirm Ben Ohau Vista. The NZD 338 total comes from the live result on 28 Jul 2026.",
      agodaUrl:
        "https://www.agoda.com/zh-cn/ben-ohau-vista/hotel/twizel-nz.html",
      position: [-44.2594, 170.1006],
      mapQuery: "Ben Ohau Vista 16 Ostler Road Twizel",
    },
    {
      id: "airbnb-aoraki-aurora-holiday-home",
      stayType: "home",
      name: "Aoraki Aurora Holiday Home · Airbnb",
      recommendation: "Airbnb 整栋舒适度 · 已核验",
      recommendationEn: "Verified whole-home Airbnb comfort",
      summary:
        "Twizel 镇中心门口的整栋三卧室民居；民宿不限制床位数量，因此两张 King 床和额外双层床不构成排除条件。两人可享完整厨房、洗衣烘干、两间浴室和更大公共空间，代价是价格高于独立客房，且 Big Sky 后仍需夜间开回 Twizel。",
      summaryEn:
        "A verified three-bedroom whole home near central Twizel; extra bedrooms and beds are acceptable for a homestay and provide more comfort for two guests.",
      access: "Twizel 近镇中心；房源描述为镇中心门口的私密住宅",
      accessEn: "Near central Twizel in a private whole home",
      parking: "房源内免费停车",
      parkingEn: "Free on-site parking",
      distanceNote:
        "Airbnb 预订前仅公开大致位置；以下距离按 Twizel 镇中心估算，确认预订后应以准确地址复核。",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "约 65 公里",
          travelTime: "驾车约 50—55 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 60 公里",
          travelTime: "驾车约 45—50 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 12 公里",
          travelTime: "驾车约 10 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "10 月 5 日精确日期、2 人已核验可订",
        "整栋三卧室；两间 King 卧室",
        "4.98 分、82 条评价、房客推荐、超赞房东",
        "完整厨房、洗衣机、烘干机和两间浴室",
        "密码钥匙盒自助入住",
        "9 月 30 日前免费取消、现在付 NZD 0",
      ],
      strengthsEn: [
        "The exact 5 October stay for two guests was checked as available",
        "A whole three-bedroom home with two king bedrooms",
        "Rated 4.98 from 82 reviews, with Guest Favourite and Superhost badges",
        "Full kitchen, washer, dryer and two bathrooms",
        "Self check-in through a lockbox",
        "The checked offer allowed free cancellation until 30 September with NZD 0 due immediately",
      ],
      cautions: [
        "含全部费用一晚 NZD 362，高于低价独立客房",
        "Big Sky 后需夜间驾驶约 50—55 分钟",
        "次晨直升机候补需提前近 1 小时出发",
        "房源未报告一氧化碳报警器",
      ],
      cautionsEn: [
        "The checked all-in total was NZD 362 for one night, above the lower-cost private-room options",
        "The return after Big Sky is about a 50–55-minute night drive",
        "A next-morning helicopter backup requires leaving nearly an hour early",
        "The listing did not report a carbon-monoxide alarm",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.98 / 5", reviews: "82 条 · Guest favourite · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "whole-three-bedroom-home",
          name: "整栋三卧室民居",
          size: "平台未标",
          bed: "2 张 King 床 + 2 组双层床（民宿不限制床位数）",
          photosVerified: true,
          facilities: [
            "完整厨房",
            "2 间浴室",
            "洗衣机",
            "烘干机",
            "空调",
            "露台或阳台",
            "密码盒自助入住",
            "免费停车",
          ],
          images: [
            image("aurora-holiday-home-king-bedroom.jpg", "King 床卧室", "Airbnb"),
            image("aurora-holiday-home-bathroom.jpg", "浴室步入式淋浴与卫生间", "Airbnb"),
            image("aurora-holiday-home-bunk-room.jpg", "双层床卧室", "Airbnb"),
            image("aurora-holiday-home-kitchen.jpg", "完整厨房与早餐台", "Airbnb"),
            image("aurora-holiday-home-living.jpg", "客厅与电视区", "Airbnb"),
            image("aurora-holiday-home-laundry.jpg", "独立洗衣机与烘干机", "Airbnb"),
            image("aurora-holiday-home-exterior.jpg", "整栋民居外观与露台", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 10 月 5—6 日、2 人核验：含全部费用总价 NZD 362；现在付 NZD 0，9 月 30 日前免费取消。",
      availabilityNoteEn:
        "Checked on Airbnb for 5–6 Oct 2026 and two guests: NZD 362 all-in, NZD 0 due immediately, with free cancellation until 30 September. Recheck live inventory and the final checkout total before booking.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          source: "Airbnb",
          roomKey: "whole-three-bedroom-home",
          room: "整栋三卧室民居 · 2 张 King 床 + 双层床",
          nonRefundableNzd: null,
          refundableNzd: 362,
          cancelUntil: "2026-09-30",
          payment: "现在付 NZD 0；Airbnb 页面提示暂不会扣款",
          breakfast: "带完整厨房，不含早餐",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 2026 年 10 月 5—6 日、2 人核验，结算页显示含全部费用 NZD 362、现在付 NZD 0、9 月 30 日前免费取消。Airbnb 库存与价格会动态变化，付款前必须重新核对。",
      officialStatusEn:
        "Checked on the concrete Airbnb listing on 27 Jul 2026 for 5–6 Oct 2026 and two guests. Checkout showed NZD 362 all-in, NZD 0 due immediately and free cancellation until 30 September. Airbnb inventory and pricing are dynamic and must be rechecked before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://zh.airbnb.com/rooms/1509743820199528739?adults=2&check_in=2026-10-05&check_out=2026-10-06",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-44.258, 170.098],
      mapQuery: "Twizel New Zealand",
    },
    {
      id: "airbnb-pukaki-air-lodge",
      stayType: "home",
      name: "Pukaki Air Lodge 高级客房 · Airbnb",
      nameEn: "Pukaki Air Lodge Superior Room · Airbnb",
      recommendation: "Pukaki 景观与取消政策 · 已核验",
      recommendationEn: "Verified Pukaki stay with flexible cancellation",
      summary:
        "Airbnb 精确日期搜索中真实可订的 Pukaki 独立客房。位置比 Twizel 更靠近进山公路，4.93 分且 10 月 4 日前仍可免费取消，适合把天气风险留到最后；但它仍不在库克山村，Big Sky 后需要夜间驾驶。",
      summaryEn:
        "A verified private room in Pukaki with a strong rating and unusually late free cancellation, but still outside Mount Cook Village.",
      access: "Pukaki；Airbnb 预订前只公开大致位置",
      accessEn: "Pukaki; Airbnb shows only an approximate location before booking",
      parking: "房源内免费停车；下单前复核准确入口",
      parkingEn: "Free on-site parking; reconfirm the exact entrance before booking",
      distanceNote:
        "Airbnb 预订前不公开准确地址；以下时间按 Pukaki / Twizel 北侧区域保守估算，确认预订后必须复核。",
      nearbyAttractions: [
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 50—60 公里",
          travelTime: "驾车约 40—50 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Big Sky Stargazing",
          distance: "约 55—65 公里",
          travelTime: "驾车约 45—55 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "区域内",
          travelTime: "准确时间待预订地址确认",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "10 月 5—6 日、2 人精确日期已核验可订",
        "4.93 分、58 条评价、房客推荐、超赞房东",
        "含全部费用 NZD 386",
        "10 月 4 日前免费取消、现在付 NZD 0",
        "Pukaki 区域比 Twizel 更靠近库克山进山方向",
        "Mount Cook 山景、完整共用厨房、客用洗衣房和自助早餐",
      ],
      strengthsEn: [
        "The exact 5–6 October stay for two guests was checked as available",
        "Rated 4.93 from 58 reviews, with Guest Favourite and Superhost badges",
        "The checked all-in total was NZD 386",
        "The checked offer allowed free cancellation until 4 October with NZD 0 due immediately",
        "Pukaki is closer to the Mount Cook access road than central Twizel",
        "Mount Cook views, a full shared kitchen, guest laundry and self-service breakfast",
      ],
      cautions: [
        "独立房间，不是整栋民宿",
        "Big Sky 后仍需夜间驾驶",
        "准确地址和真实车程要在预订后复核",
      ],
      cautionsEn: [
        "This is a private room rather than a whole home",
        "A night drive is still required after Big Sky",
        "The exact address and actual drive times are only available after booking and must be rechecked",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.93 / 5", reviews: "58 条 · Guest favourite · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "pukaki-air-lodge-private-room",
          name: "Pukaki Air Lodge 高级独立客房",
          size: "平台未标",
          bed: "2 张约 1.8 米宽双人床（民宿不限制床位数）",
          photosVerified: true,
          facilities: [
            "独立卫浴",
            "Mount Cook 山景",
            "完整共用厨房",
            "客用洗衣房（限时）",
            "自助早餐",
            "中央空调",
            "无线网络",
            "免费停车",
          ],
          images: [
            image("pukaki-air-lodge-1.jpg", "Pukaki Air Lodge 高级客房", "Airbnb"),
            image("pukaki-air-lodge-2.jpg", "高级客房休息区", "Airbnb"),
            image("pukaki-air-lodge-3.jpg", "高级客房设施", "Airbnb"),
            image("pukaki-air-lodge-4.jpg", "房源公共空间", "Airbnb"),
            image("pukaki-air-lodge-5.jpg", "房源景观", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 10 月 5—6 日、2 人核验：含全部费用总价 NZD 386；现在付 NZD 0，10 月 4 日前免费取消。",
      availabilityNoteEn:
        "Checked on Airbnb for 5–6 Oct 2026 and two guests: NZD 386 all-in, NZD 0 due immediately, with free cancellation until 4 October. Recheck live inventory and the final checkout total before booking.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          source: "Airbnb",
          roomKey: "pukaki-air-lodge-private-room",
          room: "Pukaki Air Lodge 高级独立客房",
          nonRefundableNzd: null,
          refundableNzd: 386,
          cancelUntil: "2026-10-04",
          payment: "现在付 NZD 0",
          breakfast: "含自助早餐；住客反馈有鸡蛋、酸奶、麦片与面包等，具体供应下单前复核",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 2026 年 10 月 5—6 日、2 人核验，结算页显示含全部费用 NZD 386、现在付 NZD 0、10 月 4 日前免费取消。Airbnb 库存与价格会动态变化，付款前必须重新核对。",
      officialStatusEn:
        "Checked on the concrete Airbnb listing on 27 Jul 2026 for 5–6 Oct 2026 and two guests. Checkout showed NZD 386 all-in, NZD 0 due immediately and free cancellation until 4 October. Airbnb inventory and pricing are dynamic and must be rechecked before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://zh.airbnb.com/rooms/49906407?adults=2&check_in=2026-10-05&check_out=2026-10-06",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-44.16, 170.12],
      mapQuery: "Pukaki New Zealand",
    },
    {
      id: "airbnb-ben-ohau-rural-retreat",
      stayType: "home",
      name: "Ben Ohau 现代乡村度假屋 · Airbnb",
      nameEn: "Modern Ben Ohau Rural Retreat · Airbnb",
      recommendation: "山景乡村民宿 · 已核验",
      recommendationEn: "Verified Ben Ohau rural retreat",
      summary:
        "小红书偏爱的 Ben Ohau / Twizel 山景乡村型民宿中，一套已在 Airbnb 真实详情页核验当日可订的整套客房。评价量明显高于一般景观新房源，额外卧室不作为排除条件；代价是本次 Big Sky 与次晨直升机都要长距离往返。",
      summaryEn:
        "A verified whole guesthouse in rural Ben Ohau with strong reviews and mountain-country appeal, but a long drive for the evening and next-morning plans.",
      access: "Ben Ohau 乡村区域；Airbnb 预订前只公开大致位置",
      accessEn: "Rural Ben Ohau; Airbnb shows only an approximate location before booking",
      parking: "房源内免费停车；下单前复核入口与夜间照明",
      parkingEn: "Free on-site parking; reconfirm the entrance and night lighting",
      distanceNote:
        "以下距离按 Ben Ohau 区域估算；Airbnb 确认预订后才提供准确地址。",
      nearbyAttractions: [
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 60—70 公里",
          travelTime: "驾车约 50—60 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Big Sky Stargazing",
          distance: "约 65—75 公里",
          travelTime: "驾车约 55—65 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 15—25 公里",
          travelTime: "驾车约 15—25 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "10 月 5—6 日、2 人精确日期已核验可订",
        "整套两卧室客房；民宿不限制床位数量",
        "4.86 分、236 条评价、房客推荐、超赞房东",
        "含全部费用 NZD 528",
        "9 月 30 日前免费取消、现在付 NZD 0",
        "Ben Ohau 乡村景观和私密性强",
        "完整厨房、洗衣机、热泵供暖、空调和密码盒自助入住",
      ],
      strengthsEn: [
        "The exact 5–6 October stay for two guests was checked as available",
        "A whole two-bedroom guesthouse; extra beds are acceptable for a homestay option",
        "Rated 4.86 from 236 reviews, with Guest Favourite and Superhost badges",
        "The checked all-in total was NZD 528",
        "The checked offer allowed free cancellation until 30 September with NZD 0 due immediately",
        "Strong privacy and rural Ben Ohau scenery",
        "Full kitchen, washer, heat-pump heating, air conditioning and lockbox self check-in",
      ],
      cautions: [
        "比 Twizel 低价独立客房贵 NZD 346",
        "Big Sky 后夜间驾驶约 55—65 分钟",
        "次晨直升机候补也要预留近 1 小时",
      ],
      cautionsEn: [
        "The checked total was NZD 346 above the lower-cost Twizel private-room option",
        "The return after Big Sky is about a 55–65-minute night drive",
        "A next-morning helicopter backup also requires allowing nearly an hour",
      ],
      ratings: [
        { platform: "Airbnb", score: "4.86 / 5", reviews: "236 条 · Guest favourite · Superhost" },
      ],
      roomTypes: [
        {
          rateKey: "ben-ohau-two-bedroom-guesthouse",
          name: "整套两卧室乡村客房",
          size: "平台未标",
          bed: "2 张床（民宿不限制床型或床位数）",
          photosVerified: true,
          facilities: [
            "独立卫浴",
            "完整厨房",
            "洗衣机",
            "山景与乡村农场景观",
            "热泵供暖",
            "空调",
            "密码盒自助入住",
            "无线网络",
            "免费停车",
          ],
          images: [
            image("ben-ohau-rural-1.jpg", "Ben Ohau 乡村度假屋外观", "Airbnb"),
            image("ben-ohau-rural-2.jpg", "乡村度假屋客厅", "Airbnb"),
            image("ben-ohau-rural-3.jpg", "客房内部", "Airbnb"),
            image("ben-ohau-rural-4.jpg", "客房设施", "Airbnb"),
            image("ben-ohau-rural-5.jpg", "房源山地景观", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 10 月 5—6 日、2 人核验：含全部费用总价 NZD 528；现在付 NZD 0，9 月 30 日前免费取消。",
      availabilityNoteEn:
        "Checked on Airbnb for 5–6 Oct 2026 and two guests: NZD 528 all-in, NZD 0 due immediately, with free cancellation until 30 September. Recheck live inventory and the final checkout total before booking.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          source: "Airbnb",
          roomKey: "ben-ohau-two-bedroom-guesthouse",
          room: "整套两卧室乡村客房",
          nonRefundableNzd: null,
          refundableNzd: 528,
          cancelUntil: "2026-09-30",
          payment: "现在付 NZD 0",
          breakfast: "不含早餐",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 2026 年 10 月 5—6 日、2 人核验，结算页显示含全部费用 NZD 528、现在付 NZD 0、9 月 30 日前免费取消。Airbnb 库存与价格会动态变化，付款前必须重新核对。",
      officialStatusEn:
        "Checked on the concrete Airbnb listing on 27 Jul 2026 for 5–6 Oct 2026 and two guests. Checkout showed NZD 528 all-in, NZD 0 due immediately and free cancellation until 30 September. Airbnb inventory and pricing are dynamic and must be rechecked before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://zh.airbnb.com/rooms/35975390?adults=2&check_in=2026-10-05&check_out=2026-10-06",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-44.22, 170.03],
      mapQuery: "Ben Ohau New Zealand",
    },
    {
      id: "airbnb-cosy-accommodation-twizel",
      stayType: "home",
      name: "Cosy Accommodation · Airbnb",
      recommendation: "Airbnb 两人性价比 · 已核验",
      recommendationEn: "Verified two-person Airbnb value",
      summary:
        "Twizel 的整套独立客房，价格远低于整栋多卧室民宿；密码盒自助入住也不会和下午直升机冲突。民宿不限制床位数量，这套的优势是低价和高评价，而不是单床本身；代价仍是 Big Sky 后夜间开回 Twizel。",
      summaryEn:
        "A verified private queen guesthouse in Twizel with lockbox check-in and strong value, but it still requires a late drive after Big Sky.",
      access: "Twizel 近镇中心；步行约 10 分钟到镇中心或河边",
      accessEn:
        "Near central Twizel; about a 10-minute walk to town or the river",
      parking: "房源内免费停车",
      parkingEn: "Free on-site parking",
      distanceNote:
        "Airbnb 预订前仅公开大致位置；以下距离按 Twizel 近镇中心估算，确认预订后应以房东提供的准确地址复核。",
      distanceNoteEn:
        "Airbnb only shows an approximate location before booking; distances use central Twizel and should be rechecked after the exact address is released.",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          distance: "约 65 公里",
          travelTime: "驾车约 50—55 分钟",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          distance: "约 60 公里",
          travelTime: "驾车约 45—50 分钟",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Hooker Valley Track 起点",
          distance: "约 69 公里",
          travelTime: "驾车约 55 分钟",
          destinationQuery: "White Horse Hill Campground",
        },
        {
          name: "Lake Pukaki Viewpoint",
          distance: "约 12 公里",
          travelTime: "驾车约 10 分钟",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "10 月 5 日精确日期已核验可订",
        "整套独立客房、1 张 Queen 床",
        "4.87 分且有 488 条评价",
        "密码盒自助入住",
        "9 月 30 日前免费取消",
        "现在付 NZD 0",
        "免费停车",
      ],
      strengthsEn: [
        "The exact 5 October stay for two guests was checked as available",
        "A whole private guesthouse with one queen bed",
        "Rated 4.87 from 488 reviews",
        "Self check-in through a lockbox",
        "The checked offer allowed free cancellation until 30 September",
        "The checked offer required NZD 0 immediately",
        "Free on-site parking",
      ],
      cautions: [
        "Big Sky 后需夜间驾驶约 50—55 分钟",
        "次晨直升机候补需提前近 1 小时出发",
        "仅有微波炉、小冰箱、烤面包机和水壶，不是完整厨房",
        "房源未报告一氧化碳报警器",
      ],
      cautionsEn: [
        "The return after Big Sky is about a 50–55-minute night drive",
        "A next-morning helicopter backup requires leaving nearly an hour early",
        "The kitchenette has only a microwave, small refrigerator, toaster and kettle rather than a full kitchen",
        "The listing did not report a carbon-monoxide alarm",
      ],
      ratings: [
        {
          platform: "Airbnb",
          score: "4.87 / 5",
          reviews: "488 条 · Guest favourite",
        },
      ],
      roomTypes: [
        {
          rateKey: "entire-queen-guesthouse",
          name: "整套独立客房",
          size: "平台未标",
          bed: "1 张 Queen 床",
          photosVerified: true,
          facilities: [
            "独立卫浴",
            "微波炉",
            "小冰箱",
            "电视",
            "花园",
            "密码盒自助入住",
            "免费停车",
          ],
          images: [
            image("cosy-twizel-room-1.jpg", "Queen 床卧室", "Airbnb"),
            image("cosy-twizel-room-2.jpg", "独立客房休息区", "Airbnb"),
            image("cosy-twizel-room-3.jpg", "独立客房浴室", "Airbnb"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "Airbnb IAB 已按 2026 年 10 月 5—6 日、2 人核验：页面显示含全部费用总价 NZD 182；现在付 NZD 0，9 月 30 日前免费取消。",
      availabilityNoteEn:
        "Checked on Airbnb for 5–6 Oct 2026 and two guests: NZD 182 all-in, NZD 0 due immediately, with free cancellation until 30 September. Recheck live inventory and the final checkout total before booking.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          source: "Airbnb",
          roomKey: "entire-queen-guesthouse",
          room: "整套独立客房 · 1 张 Queen 床",
          nonRefundableNzd: null,
          refundableNzd: 182,
          cancelUntil: "2026-09-30",
          payment: "现在付 NZD 0；Airbnb 页面提示暂不会扣款",
          breakfast: "不含早餐；提供微波炉、小冰箱、烤面包机和水壶",
          quotedAt: "2026-07-27",
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "needs-recheck",
      officialStatusDetail:
        "2026-07-27 已在 Airbnb 具体房源页按 2026 年 10 月 5—6 日、2 人核验，结算页显示含全部费用 NZD 182、现在付 NZD 0、9 月 30 日前免费取消。Airbnb 库存与价格会动态变化，付款前必须重新核对。",
      officialStatusEn:
        "Checked on the concrete Airbnb listing on 27 Jul 2026 for 5–6 Oct 2026 and two guests. Checkout showed NZD 182 all-in, NZD 0 due immediately and free cancellation until 30 September. Airbnb inventory and pricing are dynamic and must be rechecked before payment.",
      officialVerifiedAt: "2026-07-27",
      officialUrl:
        "https://www.airbnb.com.sg/rooms/46121304?adults=2&check_in=2026-10-05&check_out=2026-10-06&currency=NZD",
      isAirbnb: true,
      isVerifiedListing: true,
      position: [-44.2592, 170.0968],
      mapQuery: "Twizel New Zealand",
    },
    {
      id: "mountain-chalets-twizel",
      name: "Mountain Chalets Motel",
      stayType: "motel",
      recommendation: "Twizel 木屋汽车旅馆",
      recommendationEn: "Twizel chalet-style motel",
      summary:
        "Twizel 镇内的木屋汽车旅馆；官方 Ibex 房型 48270 Twin Studio 配 1 张 Queen 与 1 张 Single、最多入住 2 人。2026 年 10 月 5—6 日、2 人精确查询剩 1 间，一晚 NZD 185。比民宿更适合晚到和短住，但看完 Big Sky 后仍需夜间驾车约 50—55 分钟。",
      summaryEn:
        "A chalet-style motel in Twizel. Official Ibex room type 48270, Twin Studio, has one queen and one single bed with a maximum occupancy of two. The exact 5–6 Oct 2026 search for two adults showed one unit at NZD 185 for the night. It is more practical for a short stay than a private home, but still requires a 50–55-minute night drive after Big Sky.",
      access: "Twizel 镇内；到库克山机场和冬宫约 45—55 分钟车程",
      accessEn: "In Twizel; about 45–55 minutes by car to Mount Cook Airport and the Hermitage",
      parking: "每栋木屋门前停车；官网设施页明确列出",
      parkingEn: "Parking directly outside each chalet, explicitly listed on the official facilities page",
      nearbyAttractions: [
        {
          name: "Big Sky Stargazing",
          nameEn: "Big Sky Stargazing",
          distance: "约 65 公里",
          distanceEn: "About 65 km",
          travelTime: "驾车约 50—55 分钟",
          travelTimeEn: "About 50–55 minutes by car",
          destinationQuery: "Big Sky Stargazing Aoraki Mount Cook",
        },
        {
          name: "Mount Cook Airport · 直升机集合",
          nameEn: "Mount Cook Airport · helicopter meeting point",
          distance: "约 60 公里",
          distanceEn: "About 60 km",
          travelTime: "驾车约 45—50 分钟",
          travelTimeEn: "About 45–50 minutes by car",
          destinationQuery: "Mount Cook Airport",
        },
        {
          name: "Lake Pukaki Viewpoint",
          nameEn: "Lake Pukaki Viewpoint",
          distance: "约 12 公里",
          distanceEn: "About 12 km",
          travelTime: "驾车约 10 分钟",
          travelTimeEn: "About 10 minutes by car",
          destinationQuery: "Lake Pukaki Viewpoint",
        },
      ],
      strengths: [
        "官方 Ibex 房型 48270 Twin Studio 已精确匹配",
        "Queen + Single，最多入住 2 人",
        "热泵空调、Wi-Fi 和客用洗衣房",
        "每栋木屋门前可停车",
        "精确日期剩 1 间，一晚 NZD 185",
      ],
      strengthsEn: [
        "Official Ibex room type 48270 Twin Studio is matched exactly",
        "Queen plus single bed, maximum occupancy two",
        "Heat-pump air conditioning, Wi-Fi and guest laundry",
        "Parking directly outside every chalet",
        "One exact-date unit remained at NZD 185 for the night",
      ],
      cautions: [
        "Big Sky 后仍需夜间驾驶约 50—55 分钟",
        "次晨直升机候补需提前近 1 小时出发",
        "精确日期仅剩 1 间，库存可能随时变化",
        "Ibex 结果确认房型、库存与价格；退改和付款条款仍需在结算前确认",
      ],
      cautionsEn: [
        "The return after Big Sky is still about a 50–55-minute night drive",
        "A next-morning helicopter backup requires leaving nearly an hour early",
        "Only one unit remained for the exact dates, so inventory may change quickly",
        "Ibex confirms the room, inventory and price; recheck payment and cancellation terms before checkout",
      ],
      ratings: [],
      roomTypes: [
        {
          rateKey: "twin-studio-48270",
          name: "Twin Studio · Ibex 房型 48270",
          nameEn: "Twin Studio · Ibex room type 48270",
          size: "官方 Ibex 未标明面积",
          sizeEn: "Floor area not stated by the official Ibex listing",
          bed: "1 张 Queen + 1 张 Single；最多入住 2 人",
          bedEn: "One queen plus one single; maximum occupancy two",
          photosVerified: true,
          facilities: ["完整厨房", "微波炉", "私人浴室 · 淋浴", "热泵供暖", "空调", "电视", "Wi-Fi"],
          facilitiesEn: ["Full kitchen", "Microwave", "Private bathroom with shower", "Heat-pump heating", "Air conditioning", "TV", "Wi-Fi"],
          images: [
            image("mountain-chalets-twin-studio-1.jpg", "Twin Studio 48270 · Queen 与 Single", "Mountain Chalets 官方 Ibex 图 IMG_5650"),
            image("mountain-chalets-twin-studio-2.jpg", "Twin Studio 48270 · 厨房与用餐区", "Mountain Chalets 官方 Ibex 图 IMG_5651"),
            image("mountain-chalets-twin-studio-3.jpg", "Twin Studio 48270 · 淋浴与卫浴", "Mountain Chalets 官方 Ibex 图 IMG_5652"),
          ],
        },
      ],
      hotelImages: [],
      availabilityNote:
        "2026-07-31 在 Mountain Chalets 官方 Ibex 引擎按 2026 年 10 月 5—6 日、2 位成人核验：房型 48270 Twin Studio（Queen + Single，最多 2 人）即时确认库存为 1，一晚总价 NZD 185。库存可能变化，退改与付款条款需在结算前确认。",
      availabilityNoteEn:
        "Checked in Mountain Chalets' official Ibex engine on 31 Jul 2026 for 5–6 Oct 2026 and two adults: room type 48270 Twin Studio (queen plus single, maximum two guests) had one instant-confirmation unit at a one-night total of NZD 185. Inventory may change; confirm payment and cancellation terms before checkout.",
      rateSnapshots: {
        "2026-10-05/2026-10-06": {
          roomRates: {
            "twin-studio-48270": {
              official: {
                source: "Mountain Chalets 官方 Ibex",
                roomKey: "twin-studio-48270",
                room: "Twin Studio · Ibex 房型 48270 · Queen + Single · 最多 2 人",
                roomEn: "Twin Studio · Ibex room type 48270 · queen plus single · maximum two guests",
                nonRefundableNzd: null,
                refundableNzd: 185,
                payment: "一晚总价；官方 Ibex 显示即时确认库存 1，付款与退改条款需在结算前确认",
                paymentEn: "One-night total; official Ibex showed one instant-confirmation unit. Confirm payment and cancellation terms before checkout",
                breakfast: "未标明含早餐；房型配完整厨房",
                breakfastEn: "Breakfast inclusion not stated; the room has a full kitchen",
                memberNote: "2026 年 10 月 5 日入住、10 月 6 日退房、2 位成人；库存 1",
                memberNoteEn: "5 Oct 2026 arrival, 6 Oct departure, two adults; one unit available",
                quotedAt: "2026-07-31",
              },
            },
          },
        },
      },
      research: sharedSocial.mountCook,
      officialStatus: "exact-rate-verified",
      officialStatusDetail:
        "2026-07-31 已在 Mountain Chalets 官方 Ibex API 精确核验 2026 年 10 月 5—6 日、2 位成人：房型 48270 Twin Studio 配 Queen + Single、最多 2 人，库存 1，一晚 NZD 185；三张房型图为该房型专属的 IMG_5650、IMG_5651 与 IMG_5652。",
      officialStatusEn:
        "Verified through Mountain Chalets' official Ibex API on 31 Jul 2026 for 5–6 Oct and two adults: room type 48270 Twin Studio has a queen plus single bed, maximum occupancy two, one unit available and a NZD 185 one-night total. IMG_5650, IMG_5651 and IMG_5652 are assigned specifically to this room type.",
      officialVerifiedAt: "2026-07-31",
      officialUrl: "https://www.mountainchalets.co.nz/our-chalets/",
      officialBookingUrl: "https://fbs.ibexres.com/production/mountain18/fbs687.html?bc=11252",
      officialLinkRetainsSearch: false,
      officialLinkLabel: "打开官网预订引擎（需重新选择日期）",
      officialLinkLabelEn: "Open direct engine (reselect dates)",
      officialLinkNote: "打开后请选择 2026 年 10 月 5—6 日、2 位成人，并核对 Twin Studio（Ibex 房型 48270）；官网入口不保留本次日期和人数。",
      officialLinkNoteEn: "After opening, select 5–6 Oct 2026 and two adults, then confirm Twin Studio (Ibex room type 48270); the direct entry does not retain this stay or guest count.",
      position: [-44.259901, 170.104294],
      mapQuery: "Mountain Chalets Motel Twizel",
    },
];
