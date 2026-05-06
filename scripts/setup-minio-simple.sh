#!/bin/bash

# MinIO 简化配置脚本
# 直接使用 root 用户进行配置（适合开发环境）

echo "开始配置 MinIO（简化版）..."

# 1. 配置 mc 连接到本地 MinIO
echo "配置 mc 客户端..."
mc alias set local http://localhost:9000 mynuxt nuxt123456

# 2. 创建存储桶
echo "创建存储桶 'images'..."
mc mb local/images --ignore-existing

# 3. 设置存储桶为公开读取（允许匿名访问图片）
echo "设置存储桶访问策略为公开读取..."
mc anonymous set download local/images

# 4. 验证配置
echo ""
echo "验证配置..."
mc ls local/

echo ""
echo "MinIO 配置完成！"
echo ""
echo "配置信息："
echo "- MinIO 地址: http://localhost:9000"
echo "- 存储桶名称: images"
echo "- 访问策略: 公开读取（匿名可下载）"
echo "- Access Key: mynuxt"
echo "- Secret Key: nuxt123456"
echo ""
echo "你的 .env 文件已包含正确配置："
echo "MINIO_ROOT_USER=mynuxt"
echo "MINIO_ROOT_PASSWORD=nuxt123456"
echo "S3_ENDPOINT=http://localhost:9000"
echo ""
echo "建议添加以下配置："
echo "S3_BUCKET=images"
echo "S3_REGION=us-east-1"
