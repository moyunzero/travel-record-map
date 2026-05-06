import { S3Client } from "@aws-sdk/client-s3";
import env from "~/lib/env";

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  // path-style 只有本地 MinIO 需要，Tigris 等云服务使用 virtual-hosted style
  forcePathStyle: env.S3_ENDPOINT.includes("localhost") || env.S3_ENDPOINT.includes("127.0.0.1"),
});

export const s3Bucket = env.S3_BUCKET;
