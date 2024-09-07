import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = 5173;

app.use(express.json()); // 解析 JSON 請求
app.use(express.urlencoded({ extended: true })); // 解析表單提交的數據

// 根路由，顯示表單
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>模擬捐款表單</title>
        <style>
          .form-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          form {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .form-group {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .form-group label {
            width: 100px;
            margin-right: 10px;
          }
          .form-group input {
            flex: 1;
          }
        </style>
      </head>
      <body>
        <div class="form-container">
          <form action="/donate" method="POST">
            <h1>模擬捐款表單</h1>
            <div class="form-group">
              <label for="donorName">姓名:</label>
              <input type="text" id="donorName" name="donorName" required>
            </div>
            <div class="form-group">
              <label for="amount">金額:</label>
              <input type="number" id="amount" name="amount" required>
            </div>
            <div class="form-group">
              <input type="submit" value="提交捐款">
            </div>
          </form>
        </div>
      </body>
    </html>
  `);
});

// 處理捐款請求
app.post('/donate', (req: Request, res: Response) => {
  const { donorName, amount } = req.body;

  // 驗證捐款請求
  if (!donorName || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).send('捐款請求無效。請提供正確的姓名和金額。');
  }

  // 模擬支付流程
  const donationId = Math.floor(Math.random() * 1000000); // 模擬生成一個捐款 ID
  const paymentUrl = `http://localhost:${PORT}/payment/${donationId}`; // 模擬支付鏈接

  // 返回捐款成功的消息和模擬的支付 URL
  res.status(200).send(`
    <html>
      <body>
        <h1>捐款已提交</h1>
        <p>謝謝你，${donorName}！你已捐款 $${amount}。</p>
        <p><a href="${paymentUrl}">前往模擬支付頁面</a></p>
      </body>
    </html>
  `);
});

// 模擬支付頁面
app.get('/payment/:donationId', (req: Request, res: Response) => {
  const { donationId } = req.params;

  // 模擬支付成功或取消的選擇
  res.send(`
    <html>
      <body>
        <h1>模擬支付頁面</h1>
        <p>捐款編號: ${donationId}</p>
        <p>選擇支付結果:</p>
        <a href="/success/${donationId}">模擬支付成功</a>
        <br />
        <a href="/cancel/${donationId}">模擬取消支付</a>
      </body>
    </html>
  `);
});

// 模擬支付成功
app.get('/success/:donationId', (req: Request, res: Response) => {
  const { donationId } = req.params;

  // 模擬支付成功處理
  res.send(`支付成功！謝謝你的捐款。捐款編號: ${donationId}`);
});

// 模擬取消支付
app.get('/cancel/:donationId', (req: Request, res: Response) => {
  const { donationId } = req.params;

  // 模擬支付取消處理
  res.send(`支付已取消。捐款編號: ${donationId}`);
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器正在運行於 http://localhost:${PORT}`);
});
