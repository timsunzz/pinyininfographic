// 全局变量
let scenesDatabase = {};
let currentGeneration = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadScenesDatabase();
    loadApiKey();
    loadHistory();
    initEventListeners();
});

// 加载场景词汇数据库
async function loadScenesDatabase() {
    try {
        const response = await fetch('data/scenes_database.json');
        scenesDatabase = await response.json();
        console.log('场景词汇数据库加载成功', scenesDatabase);
    } catch (error) {
        console.error('加载场景词汇数据库失败:', error);
        showError('加载数据失败，请刷新页面重试');
    }
}

// 初始化事件监听器
function initEventListeners() {
    // 场景按钮点击事件
    document.querySelectorAll('.scene-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            selectTheme(theme);
            // 更新按钮状态
            document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 生成按钮点击事件
    document.getElementById('generate-btn').addEventListener('click', generateNewspaper);

    // 下载按钮点击事件
    document.getElementById('download-btn').addEventListener('click', downloadImage);

    // 重新生成按钮点击事件
    document.getElementById('regenerate-btn').addEventListener('click', regenerateNewspaper);

    // API密钥输入事件
    document.getElementById('api-key').addEventListener('change', saveApiKey);

    // 主题输入框事件
    document.getElementById('theme').addEventListener('input', (e) => {
        // 清除预设场景按钮的选中状态
        if (e.target.value) {
            document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
        }
    });
}

// 选择场景主题
function selectTheme(theme) {
    const themeInput = document.getElementById('theme');
    themeInput.value = theme;

    // 自动生成默认标题
    const titleInput = document.getElementById('title');
    if (!titleInput.value) {
        titleInput.value = `走进${theme}`;
    }
}

// 保存API密钥到本地存储
function saveApiKey() {
    const apiKey = document.getElementById('api-key').value;
    if (apiKey) {
        localStorage.setItem('replicate_api_key', apiKey);
    }
}

// 从本地存储加载API密钥
function loadApiKey() {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (apiKey) {
        document.getElementById('api-key').value = apiKey;
    }
}

// Prompt生成器类
class PromptGenerator {
    constructor() {
        this.template = `请生成一张儿童识字小报《{{theme}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子 认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{title}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{theme}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{theme}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{theme}} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{theme}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

{{wordLists}}

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.
* **文字要求**：确保所有中文文字清晰可读，拼音标注准确，使用适合儿童的圆润字体，标签与物体之间用细线连接，保持高对比度便于阅读。`;
    }

    generate(theme, title, words) {
        // 格式化词汇列表
        const wordListsText = this.formatWordLists(words);

        // 替换模板中的占位符
        let prompt = this.template
            .replace(/{{theme}}/g, theme)
            .replace(/{{title}}/g, title)
            .replace(/{{wordLists}}/g, wordListsText);

        return prompt;
    }

    formatWordLists(words) {
        let result = '';

        // 处理核心角色与设施
        if (words['核心角色与设施'] && words['核心角色与设施'].length > 0) {
            result += '**1. 核心角色与设施：**\n';
            words['核心角色与设施'].forEach(item => {
                result += `${item.pinyin} ${item.word}, `;
            });
            result = result.slice(0, -2) + '\n\n';
        }

        // 处理常见物品/工具
        if (words['常见物品/工具'] && words['常见物品/工具'].length > 0) {
            result += '**2. 常见物品/工具：**\n';
            words['常见物品/工具'].forEach(item => {
                result += `${item.pinyin} ${item.word}, `;
            });
            result = result.slice(0, -2) + '\n\n';
        }

        // 处理环境与装饰
        if (words['环境与装饰'] && words['环境与装饰'].length > 0) {
            result += '**3. 环境与装饰：**\n';
            words['环境与装饰'].forEach(item => {
                result += `${item.pinyin} ${item.word}, `;
            });
            result = result.slice(0, -2) + '\n\n';
        }

        return result;
    }
}

// 词汇联想引擎
class WordAssociationEngine {
    constructor(database) {
        this.database = database;
    }

    getWords(theme) {
        // 如果数据库中有该主题，直接返回
        if (this.database[theme]) {
            return this.database[theme];
        }

        // 如果没有，尝试找到相似的主题（简单实现）
        const similarThemes = Object.keys(this.database).filter(key =>
            key.includes(theme) || theme.includes(key)
        );

        if (similarThemes.length > 0) {
            return this.database[similarThemes[0]];
        }

        // 如果都没有，返回默认的通用词汇
        return this.getDefaultWords();
    }

    getDefaultWords() {
        return {
            "核心角色与设施": [
                {"word": "小朋友", "pinyin": "xiǎo péng you", "category": "person"},
                {"word": "桌子", "pinyin": "zhuō zi", "category": "facility"},
                {"word": "椅子", "pinyin": "yǐ zi", "category": "facility"}
            ],
            "常见物品/工具": [
                {"word": "书本", "pinyin": "shū běn", "category": "item"},
                {"word": "铅笔", "pinyin": "qiān bǐ", "category": "item"},
                {"word": "气球", "pinyin": "qì qiú", "category": "item"}
            ],
            "环境与装饰": [
                {"word": "门", "pinyin": "mén", "category": "environment"},
                {"word": "窗户", "pinyin": "chuāng hu", "category": "environment"},
                {"word": "墙", "pinyin": "qiáng", "category": "environment"}
            ]
        };
    }
}

// Nano Banana Pro API客户端
class NanoBananaClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = '/api/replicate';
    }

    async generateImage(prompt) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: this.apiKey,
                endpoint: '/v1/predictions',
                method: 'POST',
                body: {
                    // Nano Banana Pro的正确版本ID
                    version: "b48b194183021abdb3e82f3e7b5686f9fd76e20b1d9360e90bd9e19c2d7c6fa1",
                    input: {
                        prompt: prompt,
                        aspect_ratio: "3:4",
                        resolution: "4K",
                        output_format: "png",
                        safety_filter_level: "block_only_high"
                    }
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '生成图片失败');
        }

        const prediction = await response.json();

        // 轮询获取结果
        return this.pollForResult(prediction.id);
    }

    async pollForResult(predictionId) {
        const maxAttempts = 60; // 最多轮询60次（5分钟）
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await fetch(`/api/replicate/prediction/${predictionId}?apiKey=${encodeURIComponent(this.apiKey)}`);

            if (!response.ok) {
                throw new Error('获取生成结果失败');
            }

            const prediction = await response.json();

            if (prediction.status === 'succeeded') {
                return prediction;
            } else if (prediction.status === 'failed') {
                throw new Error('图片生成失败');
            }

            // 等待5秒后再次检查
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('生成超时，请重试');
    }
}

// 生成识字小报
async function generateNewspaper() {
    const theme = document.getElementById('theme').value.trim();
    const title = document.getElementById('title').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();

    // 验证输入
    if (!theme || !title) {
        showError('请输入场景主题和标题');
        return;
    }

    if (!apiKey) {
        showError('请输入Replicate API密钥');
        return;
    }

    // 显示加载状态
    showLoading();

    try {
        // 1. 获取场景词汇
        const wordEngine = new WordAssociationEngine(scenesDatabase);
        const words = wordEngine.getWords(theme);

        // 2. 生成prompt
        const promptGenerator = new PromptGenerator();
        const prompt = promptGenerator.generate(theme, title, words);

        // 3. 调用AI生成图片
        const client = new NanoBananaClient(apiKey);
        const result = await client.generateImage(prompt);

        // 4. 显示结果
        currentGeneration = {
            theme,
            title,
            words,
            imageUrl: result.output,
            prompt,
            timestamp: new Date().toISOString()
        };

        displayResult(currentGeneration);
        saveToHistory(currentGeneration);
        hideLoading();

    } catch (error) {
        console.error('生成失败:', error);
        showError(error.message || '生成失败，请重试');
        hideLoading();
    }
}

// 显示生成结果
function displayResult(generation) {
    // 显示结果区域
    document.querySelector('.result-section').style.display = 'block';

    // 显示图片
    const imageElement = document.getElementById('generated-image');
    imageElement.src = generation.imageUrl;

    // 显示词汇列表
    displayWordList(generation.words);

    // 滚动到结果区域
    document.querySelector('.result-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 显示词汇列表
function displayWordList(words) {
    const wordDisplay = document.getElementById('word-display');
    wordDisplay.innerHTML = '';

    // 合并所有词汇
    const allWords = [
        ...(words['核心角色与设施'] || []),
        ...(words['常见物品/工具'] || []),
        ...(words['环境与装饰'] || [])
    ];

    allWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span class="word-text">${word.word}</span>
            <span class="word-pinyin">${word.pinyin}</span>
        `;
        wordDisplay.appendChild(wordItem);
    });
}

// 重新生成
async function regenerateNewspaper() {
    if (currentGeneration) {
        // 填充表单
        document.getElementById('theme').value = currentGeneration.theme;
        document.getElementById('title').value = currentGeneration.title;

        // 再次生成
        await generateNewspaper();
    }
}

// 下载图片
function downloadImage() {
    if (currentGeneration && currentGeneration.imageUrl) {
        const link = document.createElement('a');
        link.href = currentGeneration.imageUrl;
        link.download = `${currentGeneration.title}_${currentGeneration.theme}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 保存到历史记录
function saveToHistory(generation) {
    let history = JSON.parse(localStorage.getItem('generation_history') || '[]');

    // 添加新记录到开头
    history.unshift(generation);

    // 最多保留20条记录
    if (history.length > 20) {
        history = history.slice(0, 20);
    }

    localStorage.setItem('generation_history', JSON.stringify(history));
    loadHistory();
}

// 加载历史记录
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('generation_history') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: #666;">暂无历史记录</p>';
        return;
    }

    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
            <div class="history-item-info">
                <div class="history-item-theme">${item.title}</div>
                <div class="history-item-date">${new Date(item.timestamp).toLocaleDateString()}</div>
            </div>
        `;

        // 点击历史记录项
        historyItem.addEventListener('click', () => {
            currentGeneration = item;
            displayResult(item);
        });

        historyList.appendChild(historyItem);
    });
}

// 显示加载状态
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('generate-btn').disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.loading').style.display = 'inline';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('generate-btn').disabled = false;
    document.querySelector('.btn-text').style.display = 'inline';
    document.querySelector('.loading').style.display = 'none';
}

// 显示错误信息
function showError(message) {
    console.error('应用错误:', message);
    alert(message); // 简单实现，可以后续改为更优雅的提示方式
}