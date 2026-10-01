import { getMediaBlob } from "./library";
import { createAlbumThumbnailLoader } from "./albumLoading";
import { renderAlbumThumbnail } from "./albumThumbnailRenderer";

export const albumThumbnails = createAlbumThumbnailLoader({
  readBlob: getMediaBlob,
  renderThumbnail: renderAlbumThumbnail,
});
