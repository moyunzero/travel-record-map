#!/usr/bin/env tsx

/**
 * Tigris 配置验证脚本
 *
 * 用于验证 Tigris 配置是否正确，包括：
 * - 环境变量是否设置
 * - S3 客户端是否能连接
 * - 存储桶是否可访问
 * - 上传和下载功能是否正常
 */

import { resolve } from "node:path";
import { DeleteObjectCommand, GetObjectCommand, ListBucketsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";

// 加载环境变量
config({ path: resolve(process.cwd(), ".env") });

const requiredEnvVars = [
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
];

console.log("🔍 验证 Tigris 配置...\n");

// 1. 检查环境变量
console.log("1️⃣ 检查环境变量...");
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ 缺少以下环境变量:");
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

console.log("✅ 所有必需的环境变量已设置\n");

// 显示配置信息（隐藏敏感信息）
console.log("📋 当前配置:");
console.log(`   Endpoint: ${process.env.S3_ENDPOINT}`);
console.log(`   Bucket: ${process.env.S3_BUCKET}`);
console.log(`   Region: ${process.env.S3_REGION}`);
console.log(`   Access Key: ${process.env.S3_ACCESS_KEY?.substring(0, 12)}...`);
console.log();

// 验证 Tigris 特定的凭证格式
if (process.env.S3_ENDPOINT?.includes("tigris")) {
  console.log("🐯 检测到 Tigris 配置，验证凭证格式...");

  if (!process.env.S3_ACCESS_KEY?.startsWith("tid_")) {
    console.warn("⚠️  警告: Access Key 应该以 'tid_' 开头");
  }
  else {
    console.log("✅ Access Key 格式正确（以 tid_ 开头）");
  }

  if (!process.env.S3_SECRET_KEY?.startsWith("tsec_")) {
    console.warn("⚠️  警告: Secret Key 应该以 'tsec_' 开头");
  }
  else {
    console.log("✅ Secret Key 格式正确（以 tsec_ 开头）");
  }
  console.log();
}

// 2. 初始化 S3 客户端
console.log("2️⃣ 初始化 S3 客户端...");
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

console.log("✅ S3 客户端初始化成功\n");

// 3. 测试连接
console.log("3️⃣ 测试连接到 Tigris...");
try {
  const listCommand = new ListBucketsCommand({});
  const response = await s3Client.send(listCommand);
  console.log("✅ 成功连接到 Tigris");
  console.log(`   找到 ${response.Buckets?.length || 0} 个存储桶`);

  if (response.Buckets && response.Buckets.length > 0) {
    console.log("   存储桶列表:");
    response.Buckets.forEach((bucket) => {
      const isCurrent = bucket.Name === process.env.S3_BUCKET;
      console.log(`   ${isCurrent ? "→" : " "} ${bucket.Name}${isCurrent ? " (当前使用)" : ""}`);
    });
  }
  console.log();
}
catch (error: any) {
  console.error("❌ 连接失败:", error.message);
  if (error.message?.includes("403")) {
    console.error("\n💡 提示: 403 错误通常表示凭证无效或权限不足");
    console.error("   - 检查 Access Key 和 Secret Key 是否正确");
    console.error("   - 确认密钥有足够的权限");
  }
  process.exit(1);
}

// 4. 测试上传
console.log("4️⃣ 测试文件上传...");
const testKey = `test/${Date.now()}.txt`;
const testContent = "Hello from Tigris! 🐯";

try {
  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: testKey,
    Body: testContent,
    ContentType: "text/plain",
  });

  await s3Client.send(putCommand);
  console.log("✅ 文件上传成功");
  console.log(`   Key: ${testKey}\n`);
}
catch (error: any) {
  console.error("❌ 上传失败:", error.message);
  if (error.message?.includes("404")) {
    console.error("\n💡 提示: 存储桶不存在");
    console.error(`   - 检查存储桶名称: ${process.env.S3_BUCKET}`);
    console.error("   - 在 Tigris Console 中创建存储桶");
  }
  process.exit(1);
}

// 5. 测试下载
console.log("5️⃣ 测试文件下载...");
try {
  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: testKey,
  });

  const response = await s3Client.send(getCommand);
  const downloadedContent = await response.Body?.transformToString();

  if (downloadedContent === testContent) {
    console.log("✅ 文件下载成功，内容匹配\n");
  }
  else {
    console.error("❌ 下载的内容不匹配");
    console.error(`   期望: ${testContent}`);
    console.error(`   实际: ${downloadedContent}`);
    process.exit(1);
  }
}
catch (error: any) {
  console.error("❌ 下载失败:", error.message);
  process.exit(1);
}

// 6. 清理测试文件
console.log("6️⃣ 清理测试文件...");
try {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: testKey,
  });

  await s3Client.send(deleteCommand);
  console.log("✅ 测试文件已删除\n");
}
catch (error: any) {
  console.error("⚠️  清理失败（不影响功能）:", error.message);
}

// 完成
console.log("🎉 所有测试通过！Tigris 配置正确。\n");
console.log("📝 下一步:");
console.log("   1. 确保在 Vercel 中设置了相同的环境变量");
console.log("   2. 部署应用并测试图片上传功能");
console.log("   3. 享受 Tigris 的全球分发和零流量费用！\n");

console.log("💰 Tigris 免费额度:");
console.log("   - 5 GB 存储空间/月");
console.log("   - 10,000 次写入请求/月");
console.log("   - 100,000 次读取请求/月");
console.log("   - 零出站流量费用（永久免费）\n");
