#!/bin/bash

# MinIO 启动脚本

# 创建数据目录
mkdir -p ~/minio/data

# 设置环境变量
export MINIO_ROOT_USER=mynuxt
export MINIO_ROOT_PASSWORD=nuxt123456

# 启动 MinIO
echo "启动 MinIO Server..."
echo "API 端口: 9000"
echo "控制台端口: 9001"
echo "用户名: mynuxt"
echo "密码: nuxt123456"
echo ""
echo "访问地址："
echo "- API: http://localhost:9000"
echo "- 控制台: http://localhost:9001"
echo ""

minio server ~/minio/data \
  --address ":9000" \
  --console-address ":9001"
