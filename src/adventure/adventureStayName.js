export function adventureStayName(booking, privateStay, language) {
  return language === "en"
    ? privateStay?.propertyName ?? booking.listingNameEn ?? booking.listingName
    : privateStay?.propertyNameZh ?? privateStay?.["住宿名称"] ?? privateStay?.propertyName ?? booking.listingName;
}
