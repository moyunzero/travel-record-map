import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";
import { s3Bucket, s3Client } from "~/utils/s3-client";

const SignReadSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(50),
});

export default defineAuthenticatedEventHandler(async (event) => {
  const result = await readValidatedBody(event, SignReadSchema.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
      data: result.error.issues,
    }));
  }

  const { keys } = result.data;

  // 为每个 key 生成预签名读取 URL（有效期 1 小时）
  const signedUrls = await Promise.all(
    keys.map(async (key) => {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { key, url };
    }),
  );

  return signedUrls;
});
