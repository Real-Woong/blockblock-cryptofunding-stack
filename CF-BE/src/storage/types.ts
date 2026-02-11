export type PutObjectResult = {
  url: string;      // 프론트가 그대로 img src로 쓸 URL
  key: string;      // 내부 식별자(파일명 or S3 key)
  mimeType: string;
  size: number;
};

export interface StorageProvider {
  putObject(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
  }): Promise<PutObjectResult>;
}