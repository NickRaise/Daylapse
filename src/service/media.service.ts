import { Directory, File, Paths } from "expo-file-system";

class MediaService {
  private readonly mediaDir = new Directory(Paths.document, "media");

  createMediaDirectory(): void {
    this.mediaDir.create({ intermediates: true, idempotent: true });
  }

  getMediaDirectory(): string {
    return this.mediaDir.uri;
  }

  generateMediaPath(extension: string): string {
    const filename = `${Date.now()}.${extension}`;
    return new File(this.mediaDir, filename).uri;
  }

  async copyMedia(uri: string): Promise<string> {
    this.createMediaDirectory();

    const extension = uri.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}.${extension}`;
    const destination = new File(this.mediaDir, filename);

    await new File(uri).copy(destination);

    return destination.uri;
  }

  deleteMedia(uri: string): void {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  }

  exists(uri: string): boolean {
    return new File(uri).exists;
  }
}

export const mediaService = new MediaService();
