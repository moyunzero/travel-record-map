#!/bin/bash

# 创建 MinIO 服务账号
# 服务账号是 MinIO 生成的专用访问凭证，比直接使用 root 用户更安全

echo "=========================================="
echo "创建 MinIO 服务账号"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 确保 mc 已配置
echo "1. 检查 mc 配置..."
if ! mc alias list | grep -q "local"; then
    echo "配置 mc 客户端..."
    mc alias set local http://localhost:9000 mynuxt nuxt123456
fi
echo -e "${GREEN}✓ mc 配置完成${NC}"

# 2. 为 root 用户创建服务账号
echo ""
echo "2. 创建服务账号..."
echo "正在为 root 用户生成服务账号..."

# 创建服务账号并捕获输出
OUTPUT=$(mc admin user svcacct add local mynuxt 2>&1)

# 提取 Access Key 和 Secret Key
ACCESS_KEY=$(echo "$OUTPUT" | grep "Access Key:" | awk '{print $3}')
SECRET_KEY=$(echo "$OUTPUT" | grep "Secret Key:" | awk '{print $3}')

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "错误：无法创建服务账号"
    echo "$OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ 服务账号创建成功${NC}"
echo ""

# 3. 显示凭证
echo "=========================================="
echo "服务账号凭证（MinIO 生成）"
echo "=========================================="
echo ""
echo "Access Key: $ACCESS_KEY"
echo "Secret Key: $SECRET_KEY"
echo ""

# 4. 更新 .env 文件
echo "3. 更新 .env 文件..."

# 检查是否已存在 S3_ACCESS_KEY
if grep -q "^S3_ACCESS_KEY=" .env; then
    # 更新现有配置
    sed -i.bak "s|^S3_ACCESS_KEY=.*|S3_ACCESS_KEY=$ACCESS_KEY|" .env
    sed -i.bak "s|^S3_SECRET_KEY=.*|S3_SECRET_KEY=$SECRET_KEY|" .env
    rm .env.bak
else
    # 添加新配置
    echo "" >> .env
    echo "# MinIO 服务账号（由 MinIO 生成）" >> .env
    echo "S3_ACCESS_KEY=$ACCESS_KEY" >> .env
    echo "S3_SECRET_KEY=$SECRET_KEY" >> .env
fi

echo -e "${GREEN}✓ .env 文件已更新${NC}"
echo ""

# 5. 测试凭证
echo "4. 测试服务账号..."
mc alias set test http://localhost:9000 "$ACCESS_KEY" "$SECRET_KEY" > /dev/null 2>&1
if mc ls test/images > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服务账号测试成功${NC}"
    mc alias remove test > /dev/null 2>&1
else
    echo -e "${YELLOW}! 服务账号测试失败，但凭证已生成${NC}"
    mc alias remove test > /dev/null 2>&1
fi

echo ""
echo "=========================================="
echo "完成！"
echo "=========================================="
echo ""
echo "现在你的应用可以使用以下凭证连接 MinIO："
echo ""
echo "  S3_ENDPOINT=http://localhost:9000"
echo "  S3_ACCESS_KEY=$ACCESS_KEY"
echo "  S3_SECRET_KEY=$SECRET_KEY"
echo "  S3_BUCKET=images"
echo "  S3_REGION=us-east-1"
echo ""
echo "这些凭证已保存到 .env 文件中"
echo ""
echo "查看所有服务账号："
echo "  mc admin user svcacct list local mynuxt"
echo ""
echo "删除服务账号："
echo "  mc admin user svcacct rm local $ACCESS_KEY"
echo ""
