#!/bin/bash

# MinIO 配置脚本
# 由于 MinIO 2025-05-24 版本后 Web 控制台功能受限，使用 mc 命令行工具进行配置

echo "开始配置 MinIO..."

# 1. 配置 mc 连接到本地 MinIO
echo "配置 mc 客户端..."
mc alias set local http://localhost:9000 mynuxt nuxt123456

# 2. 创建存储桶
echo "创建存储桶 'images'..."
mc mb local/images --ignore-existing

# 3. 设置存储桶为公开读取（允许匿名访问图片）
echo "设置存储桶访问策略..."
mc anonymous set download local/images

# 4. 创建访问密钥（Access Key）用于应用程序
echo "创建访问密钥..."
mc admin user add local app-user AppUser123456

# 5. 创建策略文件
cat > /tmp/readwrite-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::images/*",
        "arn:aws:s3:::images"
      ]
    }
  ]
}
EOF

# 6. 添加策略
echo "添加读写策略..."
mc admin policy create local readwrite-images /tmp/readwrite-policy.json

# 7. 将策略附加到用户
echo "将策略附加到用户..."
mc admin policy attach local readwrite-images --user app-user

# 8. 创建服务账号（推荐用于应用程序）
echo "创建服务账号..."
mc admin user svcacct add local app-user --access-key "AKIAIOSFODNN7EXAMPLE" --secret-key "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

echo "MinIO 配置完成！"
echo ""
echo "配置信息："
echo "- 存储桶名称: images"
echo "- 访问策略: 公开读取"
echo "- 应用用户: app-user"
echo "- Access Key: AKIAIOSFODNN7EXAMPLE"
echo "- Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
echo ""
echo "请将以下配置添加到 .env 文件："
echo "S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE"
echo "S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
echo "S3_BUCKET=images"
