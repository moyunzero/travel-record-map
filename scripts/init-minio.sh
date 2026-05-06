#!/bin/bash

# MinIO 一键初始化脚本
# 检查依赖、启动服务、完成配置

set -e

echo "=========================================="
echo "MinIO 一键初始化脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 MinIO Server
echo "1. 检查 MinIO Server..."
if ! command -v minio &> /dev/null; then
    echo -e "${RED}错误: 未安装 MinIO Server${NC}"
    echo ""
    echo "请安装 MinIO Server:"
    echo "  macOS: brew install minio/stable/minio"
    echo "  Linux: wget https://dl.min.io/server/minio/release/linux-amd64/minio"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ MinIO Server 已安装${NC}"

# 2. 检查 MinIO Client
echo "2. 检查 MinIO Client (mc)..."
if ! command -v mc &> /dev/null; then
    echo -e "${RED}错误: 未安装 MinIO Client (mc)${NC}"
    echo ""
    echo "请安装 MinIO Client:"
    echo "  macOS: brew install minio/stable/mc"
    echo "  Linux: wget https://dl.min.io/client/mc/release/linux-amd64/mc"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ MinIO Client 已安装${NC}"

# 3. 检查 MinIO 是否运行
echo "3. 检查 MinIO 服务状态..."
if ! curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${YELLOW}! MinIO 未运行，正在启动...${NC}"
    
    # 创建数据目录
    mkdir -p ~/minio/data
    
    # 后台启动 MinIO
    export MINIO_ROOT_USER=mynuxt
    export MINIO_ROOT_PASSWORD=nuxt123456
    
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
            echo "请查看日志: tail -f ~/minio/minio.log"
            exit 1
        fi
    done
else
    echo -e "${GREEN}✓ MinIO 已运行${NC}"
fi

# 4. 配置 mc 客户端
echo "4. 配置 mc 客户端..."
mc alias set local http://localhost:9000 mynuxt nuxt123456 > /dev/null 2>&1
echo -e "${GREEN}✓ mc 客户端配置完成${NC}"

# 5. 创建存储桶
echo "5. 创建存储桶 'images'..."
if mc ls local/images > /dev/null 2>&1; then
    echo -e "${YELLOW}! 存储桶 'images' 已存在${NC}"
else
    mc mb local/images > /dev/null 2>&1
    echo -e "${GREEN}✓ 存储桶创建成功${NC}"
fi

# 6. 设置访问策略
echo "6. 设置存储桶访问策略..."
mc anonymous set download local/images > /dev/null 2>&1
echo -e "${GREEN}✓ 访问策略设置完成（公开读取）${NC}"

# 7. 验证配置
echo "7. 验证配置..."
echo "测试文件上传..."
echo "MinIO Test" > /tmp/minio-test.txt
mc cp /tmp/minio-test.txt local/images/ > /dev/null 2>&1
mc rm local/images/minio-test.txt > /dev/null 2>&1
rm /tmp/minio-test.txt
echo -e "${GREEN}✓ 配置验证成功${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}MinIO 配置完成！${NC}"
echo "=========================================="
echo ""
echo "配置信息："
echo "  - API 地址: http://localhost:9000"
echo "  - 控制台: http://localhost:9001"
echo "  - 用户名: mynuxt"
echo "  - 密码: nuxt123456"
echo "  - 存储桶: images"
echo "  - 访问策略: 公开读取"
echo ""
echo "环境变量（已在 .env 文件中）："
echo "  MINIO_ROOT_USER=mynuxt"
echo "  MINIO_ROOT_PASSWORD=nuxt123456"
echo "  S3_ENDPOINT=http://localhost:9000"
echo "  S3_BUCKET=images"
echo "  S3_REGION=us-east-1"
echo ""
echo "常用命令："
echo "  - 查看存储桶: mc ls local/"
echo "  - 查看文件: mc ls local/images/"
echo "  - 上传文件: mc cp file.jpg local/images/"
echo "  - 查看日志: tail -f ~/minio/minio.log"
echo "  - 停止服务: pkill minio"
echo ""
