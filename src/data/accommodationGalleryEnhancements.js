const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";

const photo = (fileName, label, labelEn, source) => ({
  src: `${imagePrefix}${fileName}`,
  label,
  labelEn,
  source,
});

const galleryEnhancements = {
  "peppers-bluewater-resort-lake-tekapo": {
    hotel: [
      photo(
        "peppers-bluewater-property-exterior.jpg",
        "Peppers Bluewater Resort 客房楼与园林步道（住宿外观）",
        "Peppers Bluewater Resort room blocks and landscaped path (property exterior)",
        "https://www.peppers.co.nz/Portals/0/GalleryImages/System/Peppers/BluewaterResort/Approved/Peppers-Bluewater-Lake-Tekapo-New-Zealand-Hotel-Around-the-hotel-12.t102493.jpg",
      ),
      photo(
        "peppers-bluewater-property-lake-setting.jpg",
        "Peppers Bluewater Resort 建筑群与 Lake Tekapo（住宿环境）",
        "Peppers Bluewater Resort buildings and Lake Tekapo (property setting)",
        "https://www.peppers.co.nz/Portals/0/GalleryImages/System/Peppers/BluewaterResort/Approved/Peppers-Bluewater-Lake-Tekapo-New-Zealand-Hotel-Around-the-hotel-15.t102514.jpg",
      ),
      photo(
        "peppers-bluewater-restaurant.jpg",
        "Rakinui Restaurant & Bar 用餐区（酒店餐厅）",
        "Rakinui Restaurant & Bar dining area (hotel restaurant)",
        "https://www.peppers.co.nz/Portals/3/Images/Property/PeppersBluewaterResort/Peppers-Bluewater-Resort-Rakinui-Restaurant.jpg",
      ),
    ],
  },
  "hermitage-mt-cook-motel-studio-queen": {
    hotel: [
      photo(
        "hermitage-motel-property-exterior.jpg",
        "Mt Cook Motel 客房楼与停车区（住宿外观）",
        "Mt Cook Motel room block and parking area (property exterior)",
        "https://www.hermitage.co.nz/media/1941/mt-cook-motel.jpg?anchor=center&mode=crop&width=1600&height=900&rnd=133812524840000000&quality=90",
      ),
      photo(
        "hermitage-motel-property-patio.jpg",
        "Mt Cook Motel Studio 户外露台与山地环境（房型可能略有差异）",
        "Mt Cook Motel Studio patio and alpine setting (individual units may vary)",
        "https://www.hermitage.co.nz/media/1986/hermitage_motel-28.jpg?anchor=center&mode=crop&width=1600&height=900&rnd=133813282760000000&quality=90",
      ),
    ],
  },
  "mount-cook-station-huts": {
    hotel: [
      photo(
        "mount-cook-station-huts-official-door.webp",
        "Station Huts 小屋入口与山景反射（住宿外观）",
        "Station Huts entrance with reflected mountain view (property exterior)",
        "https://mountcookstation.co.nz/wp-content/uploads/2024/11/Station-Hut-Accommodation-4.webp",
      ),
      photo(
        "mount-cook-station-huts-official-door-view.webp",
        "Station Huts 门口望向农场与山脉（住宿环境）",
        "Farm and mountain outlook from a Station Hut doorway (property setting)",
        "https://mountcookstation.co.nz/wp-content/uploads/2024/11/Station-Hut-Accommodation-15.webp",
      ),
    ],
  },
  "ben-ohau-vista": {
    hotel: [
      photo(
        "ben-ohau-vista-official-lounge.jpg",
        "Ben Ohau Vista 客厅与休息区",
        "Ben Ohau Vista living room and seating area",
        "https://images.rmscloud.com/rmsoimages/9891/RMSWin/RMSOnlineImages/00001952.jpg",
      ),
      photo(
        "ben-ohau-vista-official-bedroom.jpg",
        "Ben Ohau Vista 双人卧室与露台入口",
        "Ben Ohau Vista double bedroom and patio access",
        "https://images.rmscloud.com/rmsoimages/9891/RMSWin/RMSOnlineImages/00001953.jpg",
      ),
    ],
  },
  "airbnb-cosy-accommodation-twizel": {
    room: {
      "entire-queen-guesthouse": [
        photo(
          "cosy-twizel-room-refreshments.jpg",
          "独立客房备餐台、微波炉、小冰箱与电视",
          "Guesthouse refreshment station, microwave, mini-fridge and television",
          "https://a0.muscache.com/im/pictures/7a2a63bc-4769-4231-b2b4-9bdabe21922b.jpg",
        ),
        photo(
          "cosy-twizel-room-exterior.jpg",
          "Cosy Accommodation 独立客房外观与入口平台",
          "Cosy Accommodation private guesthouse exterior and entrance deck",
          "https://a0.muscache.com/im/pictures/cbf40a3f-5b4a-48ea-a7db-2cfb76d56397.jpg",
        ),
      ],
    },
  },
  "mountain-chalets-twizel": {
    hotel: [
      photo(
        "mountain-chalets-official-1.jpg",
        "Mountain Chalets 两卧木屋双人卧室示例（非 Twin Studio 专属）",
        "Mountain Chalets two-bedroom chalet double-room example (not specific to the Twin Studio)",
        "https://www.mountainchalets.co.nz/media/1042/10048-08-2bed-300x199.jpg",
      ),
      photo(
        "mountain-chalets-official-4.jpg",
        "Mountain Chalets 花园与户外座位（住宿公共区域）",
        "Mountain Chalets garden and outdoor seating (shared property area)",
        "https://www.mountainchalets.co.nz/media/1052/10048-10-300x199.jpg",
      ),
    ],
  },
  "the-rees-queenstown": {
    room: {
      "lake-view-king": [
        photo(
          "rees-lake-view-balcony.webp",
          "湖景酒店客房的阳台、卧室与湖景",
          "Lake View Hotel Room balcony, bedroom and lake outlook",
          "https://therees.co.nz/wp-content/uploads/2024/01/Lake-View-Hotel-Room-room-balcony.webp",
        ),
        photo(
          "rees-lake-view-hero.webp",
          "湖景酒店客房起居区与阳台视野",
          "Lake View Hotel Room sitting area and balcony outlook",
          "https://therees.co.nz/wp-content/uploads/2024/01/Lake-View-Hotel-Room-hero-view.webp",
        ),
      ],
    },
  },
  "holiday-inn-remarkables": {
    room: {
      "mountain-king": [
        photo(
          "holiday-inn-mountain-king-view-official.jpg",
          "山景特大床房卧室全景与窗外山景",
          "Mountain-view king room overview and mountain outlook",
          "https://cdn.worldota.net/t/1024x768/content/c0/3f/c03fbfc9720133b21cf0cc4e601d62ba9dd163f5.jpeg",
        ),
        photo(
          "holiday-inn-mountain-king-bathroom-official.jpg",
          "山景特大床房独立浴室与步入式淋浴",
          "Mountain-view king room en-suite and walk-in shower",
          "https://cdn.worldota.net/t/1024x768/content/e9/ab/e9ab05555ee44d7ac03687960d8a2d4d0b8c9cb2.jpeg",
        ),
      ],
    },
  },
  "summit-serenity-airbnb": {
    hotel: [
      photo(
        "summit-serenity-garden-view.jpg",
        "房源草坪与瓦卡蒂普湖、群山视野（户外区域）",
        "Listing lawn with Lake Wakatipu and mountain views (outdoor area)",
        "https://a0.muscache.com/im/pictures/hosting/Hosting-1343016251239831074/original/2617be65-3140-4c06-9d19-a717b6bfc3e3.jpeg",
      ),
    ],
  },
  "ramada-queenstown-central": {
    room: {
      "studio-king": [
        photo(
          "ramada-queenstown-studio-official-1.jpg",
          "Studio 客房大床、窗景与工作区",
          "Studio room king bed, outlook and work area",
          "https://www.wyndhamhotels.com/content/dam/property-images/en-us/ra/nz/others/queenstown/51477/51477_studio_room_1.jpg?downsize=1200:*",
        ),
        photo(
          "ramada-queenstown-studio-official-2.jpg",
          "Studio 客房小厨房与起居空间",
          "Studio room kitchenette and living space",
          "https://www.wyndhamhotels.com/content/dam/property-images/en-us/ra/nz/others/queenstown/51477/51477_studio_room_2.jpg?downsize=1200:*",
        ),
        photo(
          "ramada-queenstown-studio-official-3.jpg",
          "Studio 客房大床与窗边空间",
          "Studio room bed and window-side space",
          "https://www.wyndhamhotels.com/content/dam/property-images/en-us/ra/nz/others/queenstown/51477/51477_guest_room_studio_1.jpg?downsize=1200:*",
        ),
      ],
    },
  },
  "bella-vista-queenstown": {
    hotel: [
      photo(
        "queenstown-bella-vista-exterior-2.jpg",
        "Bella Vista Queenstown 冬季建筑外观与停车区",
        "Bella Vista Queenstown winter exterior and parking area",
        "https://www.bellavista.co.nz/library/images/Motels/Queenstown/BVQueenstown_Exterior2.jpg",
      ),
      photo(
        "queenstown-bella-vista-grounds.jpg",
        "Bella Vista Queenstown 入口外观与招牌",
        "Bella Vista Queenstown entrance exterior and sign",
        "https://www.bellavista.co.nz/library/images/Motels/Queenstown/BVQueenstownOG.jpg",
      ),
    ],
  },
  "novotel-queenstown-lakeside": {
    hotel: [
      photo(
        "queenstown-novotel-garden.jpg",
        "酒店前台（公共区域）",
        "Hotel reception desk (shared area)",
        "https://www.ahstatic.com/photos/5308_ho_02_p_2048x1536.jpg",
      ),
      photo(
        "queenstown-novotel-lobby.jpg",
        "酒店户外餐饮花园（公共区域）",
        "Hotel outdoor dining garden (shared area)",
        "https://www.ahstatic.com/photos/5308_ho_03_p_1024x768.jpg",
      ),
    ],
  },
  "sofitel-queenstown-hotel-spa": {
    hotel: [
      photo(
        "queenstown-sofitel-lobby.jpg",
        "酒店大堂休息区（公共区域）",
        "Hotel lobby lounge (shared area)",
        "https://www.ahstatic.com/photos/5688_ho_02_p_1024x768.jpg",
      ),
      photo(
        "queenstown-sofitel-spa.jpg",
        "酒店水疗护理区（公共区域）",
        "Hotel spa treatment area (shared area)",
        "https://www.ahstatic.com/photos/5688_sp_00_p_1024x768.jpg",
      ),
    ],
  },
  "the-moorings-wanaka": {
    room: {
      "lake-view-studio": [
        photo(
          "wanaka-moorings-studio-bathroom.jpg",
          "Lake-view Studio 独立浴室与淋浴浴缸",
          "Lake-view Studio en-suite bathroom with shower over bath",
          "https://www.themoorings.co.nz/site/wp-content/uploads/the-moorings-wanaka-studio-accommodation-1.jpg",
        ),
      ],
    },
    hotel: [
      photo(
        "wanaka-moorings-exterior.jpg",
        "The Moorings 客房楼外观、阳台与花园（住宿外观）",
        "The Moorings room-block exterior, balconies and garden (property exterior)",
        "https://www.themoorings.co.nz/site/wp-content/uploads/the-moorings-wanaka-studio-accommodation-2.jpg",
      ),
    ],
  },
  "clearbrook-motels-wanaka": {
    room: {
      "studio-apartment": [
        photo(
          "wanaka-clearbrook-studio-kitchen.jpg",
          "Studio Apartment 完整厨房与洗衣机",
          "Studio Apartment full kitchen and washing machine",
          "https://static.wixstatic.com/media/b65291_50cd2daa249e4f8eb325ca171fe04980~mv2.jpg/v1/fit/w_1000,h_605,q_90,enc_avif,quality_auto/b65291_50cd2daa249e4f8eb325ca171fe04980~mv2.jpg",
        ),
        photo(
          "wanaka-clearbrook-studio-laundry.jpg",
          "Studio Apartment 独立洗衣机与烘干机",
          "Studio Apartment private washing machine and dryer",
          "https://static.wixstatic.com/media/b65291_a8df1e18e9c1421a946eac67d18a0581~mv2.jpg/v1/fit/w_1000,h_605,q_90,enc_avif,quality_auto/b65291_a8df1e18e9c1421a946eac67d18a0581~mv2.jpg",
        ),
      ],
    },
  },
  "alpine-motel-wanaka": {
    room: {
      "superior-king-studio": [
        photo(
          "wanaka-alpine-superior-king-overview.jpg",
          "Superior King Studio King 床、单人床与户外座位方向",
          "Superior King Studio king bed, single bed and outlook towards the outdoor seating",
          "https://www.alpinemotelwanaka.co.nz/assets/images/room4.jpg",
        ),
        photo(
          "wanaka-alpine-superior-king-reverse.jpg",
          "Superior King Studio King 床、单人床与休息椅",
          "Superior King Studio king bed, single bed and lounge chair",
          "https://www.alpinemotelwanaka.co.nz/assets/images/room4a.jpg",
        ),
        photo(
          "wanaka-alpine-superior-king-kitchenette.jpg",
          "Superior King Studio 小厨房",
          "Superior King Studio kitchenette",
          "https://www.alpinemotelwanaka.co.nz/assets/images/room4c.jpg",
        ),
        photo(
          "wanaka-alpine-superior-king-bathroom.jpg",
          "Superior King Studio 独立浴室与淋浴",
          "Superior King Studio en-suite bathroom and shower",
          "https://www.alpinemotelwanaka.co.nz/assets/images/room4d.jpg",
        ),
        photo(
          "wanaka-alpine-superior-king-exterior.jpg",
          "Superior King Studio 房门、户外座位与庭院",
          "Superior King Studio entrance, outdoor seating and courtyard",
          "https://www.alpinemotelwanaka.co.nz/assets/images/room4e.jpg",
        ),
      ],
    },
  },
  "fairway-motel-wanaka": {
    room: {
      studio: [
        photo(
          "wanaka-fairway-king-studio-overview.jpg",
          "King Studio 大床、电视与休息区（官网 King Studio 图库）",
          "King Studio bed, television and sitting area (official King Studio gallery)",
          "https://fairwaymotel.co.nz/wp-content/uploads/IMG_0786-scaled.jpg",
        ),
        photo(
          "wanaka-fairway-king-studio-bed.png",
          "King Studio 大床近景（官网 King Studio 图库）",
          "King Studio double-bed view (official King Studio gallery)",
          "https://fairwaymotel.co.nz/wp-content/uploads/IMG_0796.png",
        ),
        photo(
          "wanaka-fairway-king-studio-balcony.png",
          "King Studio 私人阳台与户外座位（官网 King Studio 图库）",
          "King Studio private balcony and outdoor seat (official King Studio gallery)",
          "https://fairwaymotel.co.nz/wp-content/uploads/IMG_0147.png",
        ),
        photo(
          "wanaka-fairway-king-studio-kitchen.png",
          "King Studio 完整厨房与用餐区（官网 King Studio 图库）",
          "King Studio full kitchen and dining area (official King Studio gallery)",
          "https://fairwaymotel.co.nz/wp-content/uploads/IMG_0795.png",
        ),
        photo(
          "wanaka-fairway-king-studio-lounge.png",
          "King Studio 双人沙发休息区（官网 King Studio 图库）",
          "King Studio two-seat sofa area (official King Studio gallery)",
          "https://fairwaymotel.co.nz/wp-content/uploads/IMG_0791-3.png",
        ),
      ],
    },
  },
  "bella-vista-wanaka": {
    room: {
      "superior-king-studio": [
        photo(
          "wanaka-bella-vista-superior-king-wide.jpg",
          "Superior King Studio 大床、微波炉小厨房与用餐区",
          "Superior King Studio king bed, microwave kitchenette and dining area",
          "https://www.bellavista.co.nz/library/images/Motels/Wanaka/Rooms/BVWanaka_King5.jpg",
        ),
      ],
    },
    hotel: [
      photo(
        "wanaka-bella-vista-exterior.jpg",
        "Bella Vista Wānaka 客房楼、停车区与入口（住宿外观）",
        "Bella Vista Wānaka room blocks, parking area and entrance (property exterior)",
        "https://www.bellavista.co.nz/library/images/Motels/Wanaka/bella_vista_wanaka_exterior.jpg",
      ),
    ],
  },
  "wanaka-view-motel": {
    room: {
      "studio-room": [
        photo(
          "wanaka-view-studio-bathroom.jpg",
          "Studio Room 独立浴室与淋浴",
          "Studio Room en-suite bathroom and shower",
          "https://www.wanakaviewmotel.co.nz/wp-content/uploads/2020/01/wanaka-view-motel-15.jpg",
        ),
        photo(
          "wanaka-view-studio-bed.jpg",
          "Studio Room 大床正面视角",
          "Studio Room front view of the large bed",
          "https://www.wanakaviewmotel.co.nz/wp-content/uploads/2020/01/wanaka-view-motel-41.jpg",
        ),
      ],
    },
  },
  "naumi-auckland-airport": {
    room: {
      "habitat-two-queens-28": [
        photo(
          "naumi-habitat-bedside-official.png",
          "Habitat 两张 Queen 床之间的床头与电源细节",
          "Habitat bedside and power-point detail between the two queen beds",
          "https://d18slle4wlf9ku.cloudfront.net/naumihotels.com-1365503697/cms/cache/v2/6930df44baa11.png/1920x1080/fit/80/19f945655d682b8b20c62f9a7cadc34d.png",
        ),
        photo(
          "naumi-habitat-bathroom-official.png",
          "Habitat 独立浴室与淋浴",
          "Habitat en-suite bathroom and shower",
          "https://d18slle4wlf9ku.cloudfront.net/naumihotels.com-1365503697/cms/cache/v2/68fb3c4f24db3.png/1920x1080/fit/80/fef538baa0850e4d6d6a1505b4f69a65.png",
        ),
      ],
    },
  },
  "sudima-auckland-airport": {
    hotel: [
      photo(
        "sudima-airport-accessible-king-official.jpg",
        "Accessible King 客房参考（非推荐房型）",
        "Accessible King reference room (not the recommended room type)",
        "https://www.sudimahotels.com/media/2oljlick/sudima-auckland-airport-accessible-king-room.jpg?width=800&height=533&v=1db2fdcd364c9b0",
      ),
      photo(
        "sudima-airport-premium-suite-official.jpg",
        "Premium Suite 客房参考（非推荐房型）",
        "Premium Suite reference room (not the recommended room type)",
        "https://www.sudimahotels.com/media/1jtn23bt/sudima-auckland-airport-premium-suite.jpg?width=800&height=533&v=1dbf6b25db64700",
      ),
    ],
  },
  "heartland-auckland-airport": {
    hotel: [
      photo(
        "heartland-airport-pool-official.jpg",
        "酒店室外泳池（公共区域）",
        "Hotel outdoor pool (shared area)",
        "https://www.scenichotelgroup.co.nz/content/uploads/2022/03/Heartland-Hotel-Auckland-Airport-Pool-Regular-2000x1389.jpg",
      ),
      photo(
        "heartland-airport-restaurant-official.jpg",
        "酒店餐厅（公共区域）",
        "Hotel restaurant (shared area)",
        "https://www.scenichotelgroup.co.nz/content/uploads/2022/03/Heartland-Hotel-Auckland-Airport-Restaurant-Regular-2000x1389.jpg",
      ),
    ],
  },
  "bks-pioneer-motor-lodge": {
    hotel: [
      photo(
        "bks-pioneer-deluxe-king-reference.jpg",
        "Deluxe King Studio 客房参考（非推荐房型）",
        "Deluxe King Studio reference room (not the recommended room type)",
        "https://webbox.imgix.net/images/boakbemabqqkmiww/c1091541-39f1-4978-8bae-57caf4178c17.png?auto=format,compress&fit=crop&crop=entropy&w=1600&h=1000",
      ),
      photo(
        "bks-pioneer-property-reference.jpg",
        "两卧室套房客房参考（非推荐房型）",
        "Two-bedroom suite reference room (not the recommended room type)",
        "https://webbox.imgix.net/images/boakbemabqqkmiww/c53d6b79-5a8a-4290-a7ad-fd3fccccdeeb.png?auto=format,compress&fit=crop&crop=entropy&w=1600&h=1000",
      ),
    ],
  },
  "auckland-airport-motel": {
    hotel: [
      photo(
        "auckland-airport-motel-property-official.jpg",
        "Queen + Single 客房参考（非推荐房型）",
        "Queen-and-single reference room (not the recommended room type)",
        "https://aucklandairportmotel.co.nz/public/img/DSC_87772.jpg",
      ),
      photo(
        "auckland-airport-motel-property-official-2.jpg",
        "双床客房参考（非推荐房型）",
        "Twin-room reference (not the recommended room type)",
        "https://aucklandairportmotel.co.nz/public/img/DSC_88451.jpg",
      ),
    ],
  },
  "holiday-inn-auckland-airport": {
    hotel: [
      photo(
        "holiday-inn-auckland-airport-exterior.jpg",
        "Holiday Inn Auckland Airport 入口外观",
        "Holiday Inn Auckland Airport entrance exterior",
        "https://cdn.worldota.net/t/1024x768/content/7f/9f/7f9f311076f3560976b0ecfe89e2c0abc1643bc8.jpeg",
      ),
    ],
  },
  "poshtel-oamaru": {
    hotel: [
      photo(
        "oamaru-poshtel-bowling-room-decor.jpg",
        "Bowling Room 保龄球主题陈设",
        "Bowling Room bowling-themed décor",
        "https://poshtelnz.com/wp-content/uploads/2023/04/room1e-scaled-700x0-c-default.jpg",
      ),
      photo(
        "oamaru-poshtel-shared-lounge-reception.jpg",
        "Poshtel 共用客厅与前台",
        "Poshtel shared lounge and reception",
        "https://poshtelnz.com/wp-content/uploads/2019/04/DSC8712.jpg",
      ),
    ],
  },
  "bella-vista-oamaru": {
    hotel: [
      photo(
        "oamaru-bella-vista-exterior-parking.jpg",
        "Bella Vista Oamaru 外观与院内停车区",
        "Bella Vista Oamaru exterior and on-site parking",
        "https://www.bellavista.co.nz/library/images/Motels/Oamaru/BVOamaru_Exterior.jpg",
      ),
      photo(
        "oamaru-bella-vista-reception.jpg",
        "Bella Vista Oamaru 前台",
        "Bella Vista Oamaru reception",
        "https://www.bellavista.co.nz/library/images/Motels/Oamaru/BVOamaru_Reception.jpg",
      ),
    ],
  },
  "oamaru-motor-lodge": {
    hotel: [
      photo(
        "oamaru-motor-lodge-exterior-parking.jpg",
        "Oamaru Motor Lodge 客房楼、外廊与院内停车区（住宿外观）",
        "Oamaru Motor Lodge room block, exterior walkways and on-site parking (property exterior)",
        "https://www.oamarumotorlodge.co.nz/assets/images/140.jpg",
      ),
      photo(
        "oamaru-motor-lodge-two-bedroom-reference.jpg",
        "Two-bedroom Suite 起居与用餐区示例（非当前推荐房型）",
        "Two-bedroom Suite living and dining area example (not the currently recommended room type)",
        "https://www.oamarumotorlodge.co.nz/assets/images/146.jpg",
      ),
    ],
  },
  "aaa-thames-court-motel": {
    hotel: [
      photo(
        "oamaru-aaa-thames-court-executive-king-alternative.jpeg",
        "Executive King Studio 另一视角",
        "Executive King Studio alternative view",
        "https://aaathamescourt.co.nz/wp-content/uploads/2017/09/executuve-king-600_400.jpeg",
      ),
      photo(
        "oamaru-aaa-thames-court-garden.jpg",
        "AAA Thames Court 花园",
        "AAA Thames Court garden",
        "https://aaathamescourt.co.nz/wp-content/uploads/2017/09/aaathames_garden.jpg",
      ),
    ],
  },
  "asure-ambassador-oamaru": {
    room: {
      "spa-studio": [
        photo(
          "oamaru-asure-ambassador-spa-studio-dining.jpg",
          "Studio Unit with Spa Bath 用餐区与简易厨房",
          "Studio Unit with Spa Bath dining area and kitchenette",
          "https://www.ambassadoroamaru.co.nz/assets/images/room2c.jpg",
        ),
        photo(
          "oamaru-asure-ambassador-spa-bath.jpg",
          "Studio Unit with Spa Bath 水疗浴缸",
          "Studio Unit with Spa Bath spa bath",
          "https://www.ambassadoroamaru.co.nz/assets/images/room2d.jpg",
        ),
      ],
    },
  },
  "brydone-hotel-oamaru": {
    hotel: [
      photo(
        "oamaru-brydone-function-room.jpg",
        "Brydone 酒店宴会与餐饮公共空间",
        "Brydone Hotel function and dining room",
        "https://www.brydonehotel.co.nz/media/ju4l5qgs/brydone-16of56.jpg",
      ),
      photo(
        "oamaru-brydone-accessibility-room.jpg",
        "Brydone 无障碍客房示例（非当前推荐房型）",
        "Brydone accessible-room example (not the currently recommended room type)",
        "https://www.brydonehotel.co.nz/media/wj0b41um/accessibility-2.jpg",
      ),
    ],
  },
  "colonial-lodge-motel-oamaru": {
    room: {
      "two-bedroom-family-apartment": [
        photo(
          "oamaru-colonial-family-apartment-twin-bedroom.jpeg",
          "Two Bedroom Family Apartment 双床卧室",
          "Two Bedroom Family Apartment twin bedroom",
          "https://coloniallodgemotel.co.nz/colonial/images/colonial/IMG_8281ES.jpeg",
        ),
        photo(
          "oamaru-colonial-family-apartment-kitchenette.jpeg",
          "Two Bedroom Family Apartment 简易厨房",
          "Two Bedroom Family Apartment kitchenette",
          "https://coloniallodgemotel.co.nz/colonial/images/colonial/IMG_8269ES.jpeg",
        ),
      ],
    },
  },
  "old-confectionery-apartments-oamaru": {
    hotel: [
      photo(
        "oamaru-old-confectionery-living-room-overview.jpg",
        "The Old Confectionery 公寓起居室全景",
        "The Old Confectionery apartment living room overview",
        "https://static.wixstatic.com/media/57aa66_d887d7bcc38c4c58be532c0676c9c36f~mv2.jpg",
      ),
      photo(
        "oamaru-old-confectionery-bedroom-doorway.jpg",
        "The Old Confectionery 公寓卧室入口与花卉壁纸",
        "The Old Confectionery apartment bedroom doorway and floral wallpaper",
        "https://static.wixstatic.com/media/57aa66_a1ce4726adda4b8a98aac43d82f7c095~mv2.jpg",
      ),
      photo(
        "oamaru-old-confectionery-living-room-coffee-table.jpg",
        "The Old Confectionery 公寓起居室与雕花茶几",
        "The Old Confectionery apartment living room with carved coffee table",
        "https://static.wixstatic.com/media/57aa66_8b12d8aafae849efb36425bccc60e1b6~mv2.jpg",
      ),
    ],
  },
  "grand-chancellor-auckland": {
    room: {
      "deluxe-harbour-king": [
        photo(
          "auckland-city-grand-chancellor-deluxe-king-bathroom.jpg",
          "Deluxe King Harbour View 步入式淋浴间",
          "Deluxe King Harbour View walk-in shower",
          "https://image-tc.galaxy.tf/wijpeg-1x5invmfj117kvj628z71olct/0e0a2999-r_wide.jpg?crop=0%2C105%2C2000%2C1125",
        ),
        photo(
          "auckland-city-grand-chancellor-deluxe-king-bedside.jpg",
          "Deluxe King Harbour View 大床近景",
          "Deluxe King Harbour View bedside detail",
          "https://image-tc.galaxy.tf/wijpeg-57mieisiaaral1i6boxx260ja/king-2-min_wide.jpg?rotate=0&crop=0%2C154%2C2000%2C1125",
        ),
      ],
    },
  },
  "holiday-inn-express-auckland-city": {
    room: {
      "standard-queen": [
        photo(
          "auckland-city-hie-queen-room-wide.jpg",
          "Standard Queen 客房全景",
          "Standard Queen room overview",
          "https://cdn.worldota.net/t/1024x768/content/b9/7c/b97cbae51277d16c7f1602ac68b06a0970e56d09.jpeg",
        ),
        photo(
          "auckland-city-hie-queen-bathroom.jpg",
          "Standard Queen 独立浴室",
          "Standard Queen en-suite bathroom",
          "https://cdn.worldota.net/t/1024x768/content/df/1a/df1a4e94933bb64ddfef705195bb5d0afacb1a3a.jpeg",
        ),
      ],
    },
  },
};

export function applyAccommodationGalleryEnhancements(hotels) {
  for (const hotel of hotels) {
    const enhancement = galleryEnhancements[hotel.id];
    if (!enhancement) continue;
    const removedFileNames = new Set(enhancement.removeImages ?? []);
    const keepImage = (item) => !removedFileNames.has(item?.src?.split("/").pop());
    hotel.hotelImages = (hotel.hotelImages ?? []).filter(keepImage);
    for (const room of hotel.roomTypes ?? []) {
      room.images = (room.images ?? []).filter(keepImage);
    }
    const knownSources = new Set([
      ...(hotel.hotelImages ?? []).map((item) => item.src),
      ...(hotel.roomTypes ?? []).flatMap((room) => (room.images ?? []).map((item) => item.src)),
    ]);
    const unique = (items = []) => items.filter((item) => item.source && !knownSources.has(item.src) && knownSources.add(item.src));
    hotel.hotelImages = [...(hotel.hotelImages ?? []), ...unique(enhancement.hotel)];
    for (const room of hotel.roomTypes ?? []) {
      room.images = [...(room.images ?? []), ...unique(enhancement.room?.[room.rateKey])];
    }
  }
  return hotels;
}
