const reviewedAt = "2026-07-31";

const googleRating = ({ score, reviews, placeId, address, position }) => ({
  position,
  ratings: [{
    platform: "Google Maps",
    platformEn: "Google Maps",
    score: `${score} / 5`,
    scoreEn: `${score} / 5`,
    reviews: `${reviews.toLocaleString("en-NZ")} 条 Google 评价`,
    reviewsEn: `${reviews.toLocaleString("en-NZ")} Google reviews`,
    sourceUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    reviewedAt,
    verifiedAddress: address,
    verifiedPosition: position,
  }],
});

const sourcedRating = ({
  platform,
  score,
  reviews,
  sourceUrl,
  platformEn = platform,
  reviewsEn = `${reviews.replace(/\s*条.*$/u, "")} reviews`,
}) => ({
  platform,
  platformEn,
  score,
  scoreEn: score,
  reviews,
  reviewsEn,
  sourceUrl,
  reviewedAt,
});

const googleOverrides = {
  "pullman-auckland-airport": googleRating({
    score: 4.7,
    reviews: 1629,
    placeId: "ChIJFUUEILJPDW0RpovOwAT3vo4",
    address: "Auckland Airport 37 Tom Pearce Drive, Māngere, Auckland 2022",
    position: [-37.0034454, 174.7824461],
  }),
  "sudima-auckland-airport": googleRating({
    score: 4.2,
    reviews: 1446,
    placeId: "ChIJa8Am_I1PDW0R-w1QBgovMOM",
    address: "18 Airpark Drive, Māngere, Auckland 2022",
    position: [-36.9844975, 174.7835384],
  }),
  "bks-pioneer-motor-lodge": googleRating({
    score: 4.2,
    reviews: 687,
    placeId: "ChIJE9ZiapxPDW0RzyUJyHUlFBE",
    address: "205 Kirkbride Road, Māngere, Auckland 2022",
    position: [-36.9726836, 174.7870643],
  }),
  "holiday-inn-auckland-airport": googleRating({
    score: 4.1,
    reviews: 1964,
    placeId: "ChIJU4tMzBdGDW0RH1ax7RCXABY",
    address: "2 Ascot Road, Māngere, Auckland 2022",
    position: [-36.9731497, 174.7858429],
  }),
  "grand-chancellor-auckland": googleRating({
    score: 4.7,
    reviews: 538,
    placeId: "ChIJQeSYaABHDW0Rbyg6bGvGinU",
    address: "80 Wellesley Street West, Auckland CBD, Auckland 1010",
    position: [-36.8497607, 174.759702],
  }),
  "bella-vista-queenstown": googleRating({
    score: 4.5,
    reviews: 293,
    placeId: "ChIJawe10IId1akRHE81vRgGmzg",
    address: "36 Robins Road, Queenstown 9300",
    position: [-45.02697, 168.659929],
  }),
  "hermitage-mt-cook-motel-studio-queen": googleRating({
    score: 4,
    reviews: 748,
    placeId: "ChIJ2fi5GK20K20Rv2BtDceLwIY",
    address: "Glencoe Access Road, Aoraki / Mount Cook National Park, Canterbury 7999",
    position: [-43.7363846, 170.0987676],
  }),
  "mountain-chalets-twizel": googleRating({
    score: 4.1,
    reviews: 536,
    placeId: "ChIJ0VQhtPwfK20RmBISgcxwWgU",
    address: "12 Wairepo Road, Twizel 7901",
    position: [-44.2612703, 170.1028545],
  }),
  "observatory-hotel-christchurch": googleRating({
    score: 4.6,
    reviews: 487,
    placeId: "ChIJ4yBriueLMW0RcEuU2Tu0Xn0",
    address: "9 Hereford Street, Christchurch Central City, Christchurch 8013",
    position: [-43.5318478, 172.6285667],
  }),
  "sudima-christchurch-city": googleRating({
    score: 4.7,
    reviews: 524,
    placeId: "ChIJq4ZhXDeKMW0RQ4o2oEunz_I",
    address: "49 Salisbury Street, Christchurch Central City, Christchurch 8013",
    position: [-43.5242843, 172.6310922],
  }),
  "hotel-montreal-christchurch": googleRating({
    score: 4.6,
    reviews: 230,
    placeId: "ChIJUddjwTmKMW0RmbH5jU05tA8",
    address: "351 Montreal Street, Christchurch Central City, Christchurch 8013",
    position: [-43.5261961, 172.630296],
  }),
  "carnmore-hotel-christchurch": googleRating({
    score: 4.5,
    reviews: 487,
    placeId: "ChIJG9eumKSLMW0R8JJpU5_d_No",
    address: "840–848 Colombo Street, Christchurch Central City, Christchurch 8013",
    position: [-43.5245617, 172.6368009],
  }),
  "adina-heritage-christchurch": googleRating({
    score: 4.4,
    reviews: 408,
    placeId: "ChIJvSIgSXCKMW0R_YQbfoo7_cc",
    address: "28 Cathedral Square, Christchurch Central City, Christchurch 8011",
    position: [-43.531116, 172.638032],
  }),
  "the-george-christchurch": googleRating({
    score: 4.5,
    reviews: 826,
    placeId: "ChIJzc9RPziKMW0RNic3FiHgkE0",
    address: "50 Park Terrace, Christchurch Central City, Christchurch 8013",
    position: [-43.5259392, 172.6287928],
  }),
};

const sourcedOverrides = {
  "the-rees-queenstown": sourcedRating({
    platform: "Booking.com",
    score: "8.7 / 10",
    reviews: "1,000+ 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/the-rees-luxury-apartments.html",
  }),
  "holiday-inn-remarkables": sourcedRating({
    platform: "Booking.com",
    score: "8.8 / 10",
    reviews: "2,000+ 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/holiday-inn-queenstown-remarkables-park.html",
  }),
  "summit-serenity-airbnb": sourcedRating({
    platform: "Airbnb",
    score: "4.86 / 5",
    reviews: "58 条住客评价 · Superhost",
    sourceUrl: "https://www.airbnb.com.sg/rooms/1343016251239831074",
  }),
  "queenstown-central-qt3-airbnb": sourcedRating({
    platform: "Airbnb",
    score: "4.93 / 5",
    reviews: "165 条住客评价 · Guest Favourite · Superhost",
    sourceUrl: "https://www.airbnb.com/rooms/938494715127054681",
  }),
  "queenstown-hayes-farmstay-airbnb": sourcedRating({
    platform: "Airbnb",
    score: "4.90 / 5",
    reviews: "187 条住客评价 · Guest Favourite · Superhost",
    sourceUrl: "https://www.airbnb.com/rooms/41320451",
  }),
  "ramada-queenstown-central": sourcedRating({
    platform: "Booking.com",
    score: "8.3 / 10",
    reviews: "2,000+ 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/ramada-queenstown-central.html",
  }),
  "novotel-queenstown-lakeside": sourcedRating({
    platform: "ALL Accor",
    score: "4.2 / 5",
    reviews: "2,944 条官网住客评价",
    sourceUrl: "https://all.accor.com/hotel/5308/index.en.shtml",
  }),
  "sofitel-queenstown-hotel-spa": sourcedRating({
    platform: "ALL Accor",
    score: "4.5 / 5",
    reviews: "1,054 条官网住客评价",
    sourceUrl: "https://all.accor.com/hotel/5688/index.en.shtml",
  }),
  "crowne-plaza-queenstown": sourcedRating({
    platform: "Booking.com",
    score: "8.3 / 10",
    reviews: "1,524 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/crowne-plaza-queenstown.html",
  }),
  "omahau-down": sourcedRating({
    platform: "Booking.com",
    score: "7.6 / 10",
    reviews: "23 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/omahau-down.html",
  }),
  "simons-hill-dark-sky": sourcedRating({
    platform: "Booking.com",
    score: "9.2 / 10",
    reviews: "59 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/the-good-shepherds-hut-in-the-nz-dark-sky-reserve.html",
  }),
  "mount-cook-station-huts": sourcedRating({
    platform: "Booking.com",
    score: "8.7 / 10",
    reviews: "265 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/mount-cook-station-huts.html",
  }),
  "ben-ohau-vista": sourcedRating({
    platform: "Agoda",
    score: "9.6 / 10",
    reviews: "6 条住客评价",
    sourceUrl: "https://www.agoda.com/ben-ohau-vista/hotel/twizel-nz.html",
  }),
  "airbnb-aoraki-aurora-holiday-home": sourcedRating({
    platform: "Airbnb",
    score: "4.98 / 5",
    reviews: "82 条住客评价 · Guest favourite · Superhost",
    sourceUrl: "https://www.airbnb.com/rooms/1509743820199528739",
  }),
  "airbnb-pukaki-air-lodge": sourcedRating({
    platform: "Airbnb",
    score: "4.93 / 5",
    reviews: "58 条住客评价 · Guest favourite · Superhost",
    sourceUrl: "https://www.airbnb.com/rooms/49906407",
  }),
  "airbnb-ben-ohau-rural-retreat": sourcedRating({
    platform: "Airbnb",
    score: "4.86 / 5",
    reviews: "236 条住客评价 · Guest favourite · Superhost",
    sourceUrl: "https://www.airbnb.com/rooms/35975390",
  }),
  "airbnb-cosy-accommodation-twizel": sourcedRating({
    platform: "Airbnb",
    score: "4.87 / 5",
    reviews: "488 条住客评价 · Guest favourite",
    sourceUrl: "https://www.airbnb.com/rooms/46121304",
  }),
  "rydges-latimer-christchurch": sourcedRating({
    platform: "Booking.com",
    score: "8.5 / 10",
    reviews: "2,000+ 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/rydges-latimer-christchurch.html",
  }),
  "quest-manchester-christchurch": sourcedRating({
    platform: "Booking.com",
    score: "9.0 / 10",
    reviews: "1,000+ 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/quest-on-manchester.html",
  }),
  "novotel-christchurch-cathedral-square": sourcedRating({
    platform: "Booking.com",
    score: "8.2 / 10",
    reviews: "984 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/novotel-christchurch-cathedral-square.html",
  }),
  "distinction-christchurch": sourcedRating({
    platform: "Booking.com",
    score: "8.9 / 10",
    reviews: "577 条住客评价",
    sourceUrl: "https://www.booking.com/hotel/nz/distinction-christchurch.html",
  }),
};

const positionCorrections = {
  "jetpark-auckland-airport": [-36.9789049, 174.78671],
  "holiday-inn-remarkables": [-45.0257731, 168.7469484],
  "omahau-down": [-44.2484535, 170.1133283],
  "simons-hill-dark-sky": [-44.188221, 170.3124084],
  "mount-cook-station-huts": [-43.8551882, 170.1728599],
  "ben-ohau-vista": [-44.2640658, 170.0812984],
  "rydges-latimer-christchurch": [-43.5306198, 172.6439159],
};

export function applyAccommodationRatingOverrides(hotels) {
  for (const hotel of hotels) {
    const googleOverride = googleOverrides[hotel.id];
    if (googleOverride) {
      hotel.ratings = googleOverride.ratings;
      hotel.position = googleOverride.position;
    }
    const sourcedOverride = sourcedOverrides[hotel.id];
    if (sourcedOverride) hotel.ratings = [sourcedOverride];
    if (positionCorrections[hotel.id]) hotel.position = positionCorrections[hotel.id];
  }
}
