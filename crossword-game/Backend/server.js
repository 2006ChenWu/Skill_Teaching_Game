const express = require('express');
const cors = require('cors');
const levelRoutes = require('./routes/levelRoutes');

const app = express();
const PORT = 4001;

// 中间件
app.use(cors()); // 允许跨域（前端访问后端）
app.use(express.json()); // 解析JSON请求体

// 挂载路由
app.use('/api', levelRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});