function coordinatePair(value) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) return null;
  return value;
}

export function verifiedStayMarkers(stays, privateVault, isPrivateUnlocked) {
  const accommodations = isPrivateUnlocked ? privateVault?.accommodations : null;
  return (stays ?? []).flatMap((stay) => {
    const privatePosition = coordinatePair(accommodations?.[stay.bookingId]?.coordinates);
    const position = privatePosition ?? coordinatePair(stay.mapPosition);
    if (!position) return [];
    return [{ bookingId: stay.bookingId, position: [...position],
      name: stay.listingName, nameEn: stay.listingNameEn ?? stay.listingName }];
  });
}
