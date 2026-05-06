#!/bin/bash

# 设置 MinIO Region（Server Location）

echo "=========================================="
echo "设置 MinIO Region"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 默认 region
REGION="us-east-1"

echo "当前 MinIO 需要重启才能设置 region"
echo "Region 将设置为: $REGION"
echo ""

# 检查 MinIO 是否在运行
if pgrep -x "minio" > /dev/null; then
    echo -e "${YELLOW}检测到 MinIO 正在运行${NC}"
    echo "需要停止 MinIO 以设置 region"
    read -p "是否停止并重启 MinIO? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "停止 MinIO..."
        pkill minio
        sleep 2
    else
        echo "取消操作"
        exit 0
    fi
fi

# 创建数据目录
mkdir -p ~/minio/data

# 启动 MinIO 并设置 region
echo "启动 MinIO (Region: $REGION)..."
export MINIO_ROOT_USER=mynuxt
export MINIO_ROOT_PASSWORD=nuxt123456
export MINIO_REGION=$REGION

nohup minio server ~/minio/data \
  --address ":9000" \
  --console-address ":9001" \
  > ~/minio/minio.log 2>&1 &

MINIO_PID=$!
echo "MinIO 已启动 (PID: $MINIO_PID)"

# 等待 MinIO 启动
echo "等待 MinIO 启动..."
for i in {1..30}; do
    if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MinIO 启动成功${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}错误: MinIO 启动超时${NC}"
        exit 1
    fi
done

# 重新配置 mc
echo "配置 mc 客户端..."
mc alias set local http://localhost:9000 mynuxt nuxt123456 > /dev/null 2>&1

# 验证 region
echo ""
echo "验证配置..."
mc admin info local

echo ""
echo "=========================================="
echo -e "${GREEN}Region 配置完成！${NC}"
echo "=========================================="
echo ""
echo "MinIO Region: $REGION"
echo ""
echo "环境变量配置："
echo "  S3_REGION=$REGION"
echo ""
