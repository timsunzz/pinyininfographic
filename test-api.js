// 测试脚本 - 验证API请求格式是否正确
const testRequest = {
    apiKey: "r8_YOUR_API_KEY_HERE",  // 这里需要替换为真实的API key
    endpoint: "/v1/predictions",
    method: "POST",
    body: {
        version: "google/nano-banana-pro",
        input: {
            prompt: "测试prompt - 请生成一张儿童识字小报",
            aspect_ratio: "3:4",
            resolution: "4K",
            output_format: "png",
            safety_filter_level: "block_only_high"
        }
    }
};

console.log("测试请求格式：");
console.log(JSON.stringify(testRequest, null, 2));

console.log("\n要测试应用，请：");
console.log("1. 确保已安装依赖: npm install");
console.log("2. 启动服务器: npm start");
console.log("3. 在浏览器中访问: http://localhost:3000");
console.log("4. 输入您的Replicate API密钥");
console.log("5. 尝试生成一张识字小报");