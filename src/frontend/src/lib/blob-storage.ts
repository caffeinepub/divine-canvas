/**
 * Simplified ExternalBlob for storing artwork images.
 * Converts files to base64 data URLs stored locally.
 */
export class ExternalBlob {
  private dataUrl: string;

  private constructor(dataUrl: string) {
    this.dataUrl = dataUrl;
  }

  static async fromBytes(
    uint8array: Uint8Array,
    mimeType = "image/jpeg",
  ): Promise<ExternalBlob> {
    return new Promise((resolve) => {
      const blob = new Blob([uint8array.buffer as ArrayBuffer], {
        type: mimeType,
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new ExternalBlob(reader.result as string));
      };
      reader.readAsDataURL(blob);
    });
  }

  static async fromFile(file: File): Promise<ExternalBlob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new ExternalBlob(reader.result as string));
      };
      reader.readAsDataURL(file);
    });
  }

  getDirectURL(): string {
    return this.dataUrl;
  }
}
