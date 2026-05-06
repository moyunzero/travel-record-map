import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { deleteLocationLogImage, findLocationLogImage } from "~/lib/db/queries/location-log";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";
import { s3Bucket, s3Client } from "~/utils/s3-client";

export default defineAuthenticatedEventHandler(async (event) => {
  const imageId = getRouterParam(event, "imageId") as string;

  // 查找图片记录
  const image = await findLocationLogImage(Number.parseInt(imageId), event.context.user.id);

  if (!image) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "图片不存在",
    }));
  }

  try {
    // 从 S3 删除文件
    const deleteCommand = new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: image.key,
    });

    await s3Client.send(deleteCommand);

    // 从数据库删除记录
    await deleteLocationLogImage(Number.parseInt(imageId), event.context.user.id);

    return {
      success: true,
      message: "图片已删除",
    };
  }
  catch (error) {
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: "删除图片失败",
    }));
  }
});
