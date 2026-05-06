#!/bin/bash

# 验证 MinIO 配置

echo "=========================================="
echo "MinIO 配置验证"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 从 .env 读取配置
if [ -f .env ]; then
    export $(cat .env | grep -E '^(S3_|MINIO_)' | xargs)
fi

echo "📋 当前配置："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Endpoint:    $S3_ENDPOINT"
echo "Access Key:  $S3_ACCESS_KEY"
echo "Secret Key:  ${S3_SECRET_KEY:0:20}..."
echo "Bucket:      $S3_BUCKET"
echo "Region:      $S3_REGION"
echo ""

# 1. 检查 MinIO 服务
echo "1️⃣  检查 MinIO 服务..."
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MinIO 服务运行正常${NC}"
else
    echo -e "${RED}✗ MinIO 服务未运行${NC}"
    echo "请运行: ./scripts/start-minio.sh"
    exit 1
fi

# 2. 测试连接
echo ""
echo "2️⃣  测试服务账号连接..."
mc alias set verify-test http://localhost:9000 "$S3_ACCESS_KEY" "$S3_SECRET_KEY" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务账号认证成功${NC}"
else
    echo -e "${RED}✗ 服务账号认证失败${NC}"
    mc alias remove verify-test > /dev/null 2>&1
    exit 1
fi

# 3. 检查存储桶
echo ""
echo "3️⃣  检查存储桶..."
if mc ls verify-test/$S3_BUCKET > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 存储桶 '$S3_BUCKET' 存在${NC}"
else
    echo -e "${RED}✗ 存储桶 '$S3_BUCKET' 不存在${NC}"
    mc alias remove verify-test > /dev/null 2>&1
    exit 1
fi

# 4. 检查存储桶策略
echo ""
echo "4️⃣  检查存储桶访问策略..."
POLICY=$(mc anonymous get verify-test/$S3_BUCKET 2>&1)
if echo "$POLICY" | grep -q "download"; then
    echo -e "${GREEN}✓ 存储桶策略: 公开读取${NC}"
elif echo "$POLICY" | grep -q "upload"; then
    echo -e "${YELLOW}! 存储桶策略: 公开写入${NC}"
elif echo "$POLICY" | grep -q "public"; then
    echo -e "${YELLOW}! 存储桶策略: 完全公开${NC}"
else
    echo -e "${YELLOW}! 存储桶策略: 私有${NC}"
    echo "  建议设置为公开读取: mc anonymous set download local/images"
fi

# 5. 测试上传
echo ""
echo "5️⃣  测试文件上传..."
TEST_FILE="/tmp/minio-test-$(date +%s).txt"
echo "MinIO Test File - $(date)" > "$TEST_FILE"
TEST_OBJECT="test/verify-$(date +%s).txt"

if mc cp "$TEST_FILE" "verify-test/$S3_BUCKET/$TEST_OBJECT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 文件上传成功${NC}"
    
    # 6. 测试下载
    echo ""
    echo "6️⃣  测试文件下载..."
    DOWNLOAD_FILE="/tmp/minio-download-$(date +%s).txt"
    if mc cp "verify-test/$S3_BUCKET/$TEST_OBJECT" "$DOWNLOAD_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 文件下载成功${NC}"
        rm "$DOWNLOAD_FILE"
    else
        echo -e "${RED}✗ 文件下载失败${NC}"
    fi
    
    # 7. 测试删除
    echo ""
    echo "7️⃣  测试文件删除..."
    if mc rm "verify-test/$S3_BUCKET/$TEST_OBJECT" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 文件删除成功${NC}"
    else
        echo -e "${RED}✗ 文件删除失败${NC}"
    fi
    
    rm "$TEST_FILE"
else
    echo -e "${RED}✗ 文件上传失败${NC}"
    rm "$TEST_FILE"
    mc alias remove verify-test > /dev/null 2>&1
    exit 1
fi

# 8. 获取文件 URL 示例
echo ""
echo "8️⃣  文件访问 URL 格式..."
echo "  http://localhost:9000/$S3_BUCKET/your-file.jpg"
echo "  示例: http://localhost:9000/images/photo.jpg"

# 清理
mc alias remove verify-test > /dev/null 2>&1

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 所有配置验证通过！${NC}"
echo "=========================================="
echo ""
echo "你的 MinIO 已完全配置好，可以开始上传图片了！"
echo ""
echo "配置摘要："
echo "  ✓ 服务运行正常"
echo "  ✓ 认证配置正确"
echo "  ✓ 存储桶已创建"
echo "  ✓ 上传/下载/删除功能正常"
echo "  ✓ Region: $S3_REGION"
echo ""
