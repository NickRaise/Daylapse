import * as MediaLibrary from "expo-media-library/legacy";

const ALBUM_NAME = "Daylapse";

// Saves a file into a dedicated "Daylapse" album rather than leaving it loose in the general camera
// roll — moves it in (copy: false) so it doesn't also sit duplicated outside the album.
export async function saveToDaylapseAlbum(uri: string): Promise<void> {
  const asset = await MediaLibrary.createAssetAsync(uri);
  const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
  }
}
