import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { z } from "zod";
import { findLocationLog } from "~/lib/db/queries/location-log";
import env from "~/lib/env";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

// 请求体验证 schema
const SignImageSchema = z.object({
  contentLength: z.number().min(1).max(10 * 1024 * 1024), // 最大 10MB
  checksum: z.string().min(1),
});

// 初始化 S3 客户端
const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: env.S3_ENDPOINT.includes("localhost") || env.S3_ENDPOINT.includes("127.0.0.1"), // 只有本地 MinIO 需要
});

export default defineAuthenticatedEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;
  const logId = getRouterParam(event, "id") as string;

  // 验证请求体
  const result = await readValidatedBody(event, SignImageSchema.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
      data: result.error.issues,
    }));
  }

  const { contentLength, checksum } = result.data;

  // 验证日志存在且属于当前用户
  const locationLog = await findLocationLog(Number.parseInt(logId), event.context.user.id);

  if (!locationLog) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "日志不存在",
    }));
  }

  // 生成唯一的文件名
  const fileId = nanoid();
  const key = `${event.context.user.id}/${logId}/${fileId}.jpg`;

  try {
    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: "image/jpeg",
      ContentLength: contentLength,
      ChecksumSHA256: checksum,
      Metadata: {
        userId: event.context.user.id.toString(),
        logId,
      },
    });

    // 生成预签名 URL（有效期 5 分钟）
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    // 返回签名 URL 和文件 key
    return {
      url,
      key,
      fields: {
        "Content-Type": "image/jpeg",
        "x-amz-checksum-sha256": checksum,
      },
    };
  }
  catch (error) {
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: "生成上传链接失败",
    }));
  }
});
