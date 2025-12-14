#!/bin/bash

echo "启动儿童识字小报生成器..."
echo ""

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "使用Python启动服务器..."
    echo "请在浏览器中访问: http://localhost:8080"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "使用Python启动服务器..."
    echo "请在浏览器中访问: http://localhost:8080"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python -m SimpleHTTPServer 8080
elif command -v npx &> /dev/null; then
    echo "使用Node.js启动服务器..."
    npx http-server . -p 8080 -o
else
    echo "错误：未找到Python或Node.js，请安装其中一个后重试"
    echo ""
    echo "安装方法："
    echo "- macOS: brew install python3 或 brew install node"
    echo "- 或者访问 https://nodejs.org/ 安装Node.js"
fi