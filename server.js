const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 代理API请求
app.post('/api/replicate', async (req, res) => {
    try {
        const { apiKey, endpoint, method, body } = req.body;

        console.log('收到API请求:', {
            endpoint,
            method: method || 'POST',
            hasApiKey: !!apiKey,
            bodyKeys: body ? Object.keys(body) : null
        });

        // 验证API密钥格式
        if (!apiKey || !apiKey.startsWith('r8_')) {
            console.error('API密钥格式错误');
            return res.status(400).json({ error: 'API密钥格式错误，应以r8_开头' });
        }

        console.log('发送请求到Replicate API...');
        const response = await fetch(`https://api.replicate.com${endpoint}`, {
            method: method || 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        console.log('Replicate API响应状态:', response.status);
        const data = await response.json();
        console.log('Replicate API响应:', data);

        if (!response.ok) {
            console.error('API请求失败:', data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('代理请求错误:', error);
        res.status(500).json({ error: '服务器内部错误', details: error.message });
    }
});

// 轮询结果
app.get('/api/replicate/prediction/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { apiKey } = req.query;

        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('轮询错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 默认路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`请在浏览器中访问 http://localhost:${PORT}`);
});