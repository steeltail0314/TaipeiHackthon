import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import QRCode from 'qrcode';
import crypto from 'crypto'; // 用來生成隨機金鑰
import fs from 'fs-extra'; // 用來處理文件讀寫

const app = express();
const port = 5173;
const dataFile = './user_data.json'; // JSON 文件保存用戶數據

app.use(bodyParser.json());

// 定義用戶資料結構
interface User {
  id: string;
  disadvantaged: string;
  dailyLimit: { water: number, meals: number };
  used: { water: number, meals: number };
  lastReset: Date;
  keys: { waterKey: string | null, mealKey: string | null };
  keyExpires: { waterExpires: Date | null, mealExpires: Date | null };
}

let users: { [key: string]: User } = {};

// 讀取 JSON 文件
const loadData = async () => {
  try {
    const data = await fs.readJSON(dataFile);
    users = data;
  } catch (err) {
    console.error('Error loading user data:', err);
  }
};

// 寫入 JSON 文件
const saveData = async () => {
  try {
    await fs.writeJSON(dataFile, users, { spaces: 2 });
  } catch (err) {
    console.error('Error saving user data:', err);
  }
};

// 初始化時讀取 JSON 文件
loadData();

// 每天重置限額
const resetDailyLimit = async () => {
  const currentDate = new Date();
  Object.keys(users).forEach(userId => {
    const user = users[userId];
    const lastReset = new Date(user.lastReset);
    // 檢查是否需要重置限額
    if (lastReset.getDate() !== currentDate.getDate()) {
      user.used = { water: 0, meals: 0 }; // 重置每日使用情況
      user.lastReset = currentDate; // 更新重置日期
    }
  });
  await saveData();
};

// 每天凌晨0點重置
setInterval(resetDailyLimit, 24 * 60 * 60 * 1000);

// 生成隨機金鑰
const generateKey = () => {
  return crypto.randomBytes(16).toString('hex'); // 生成隨機16字節的金鑰
};

// 處理水 QR Code 生成請求
app.post('/generate-water-qrcode', async (req: Request, res: Response) => {
  const { id, disadvantaged } = req.body.data;

  if (!id || !disadvantaged) {
    return res.status(400).json({ error: 'ID 和 disadvantaged 欄位是必須的' });
  }

  // 如果該ID不存在，則創建該用戶
  if (!users[id]) {
    users[id] = {
      id,
      disadvantaged,
      dailyLimit: disadvantaged === 'Lowincome' 
        ? { water: 3, meals: 2 } 
        : disadvantaged === 'Nearpoor' 
        ? { water: 2, meals: 1 } 
        : { water: 0, meals: 0 },
      used: { water: 0, meals: 0 },
      lastReset: new Date(),
      keys: { waterKey: null, mealKey: null },
      keyExpires: { waterExpires: null, mealExpires: null }
    };
    await saveData();
  }

  const user = users[id];

  // 檢查是否已達到每日限額
  if (user.used.water >= user.dailyLimit.water) {
    return res.status(400).json({ error: '今日水的份量已用完' });
  }

  // 生成新的水金鑰，並設定12小時有效期
  const waterKey = generateKey();
  const waterExpires = new Date(new Date().getTime() + 12 * 60 * 60 * 1000); // 12小時後過期

  user.keys.waterKey = waterKey;
  user.keyExpires.waterExpires = waterExpires;

  await saveData(); // 更新到 JSON 檔案

  try {
    const qrCodeURL = await QRCode.toDataURL(waterKey);
    return res.json({
      message: '水的 QR Code 已生成',
      key: waterKey,
      qrCode: qrCodeURL,
      expiresAt: waterExpires
    });
  } catch (err) {
    return res.status(500).json({ error: '生成 QR Code 時發生錯誤' });
  }
});

// 處理食物 QR Code 生成請求
app.post('/generate-meal-qrcode', async (req: Request, res: Response) => {
  const { id, disadvantaged } = req.body.data;

  if (!id || !disadvantaged) {
    return res.status(400).json({ error: 'ID 和 disadvantaged 欄位是必須的' });
  }

  // 如果該ID不存在，則創建該用戶
  if (!users[id]) {
    users[id] = {
      id,
      disadvantaged,
      dailyLimit: disadvantaged === 'Lowincome' 
        ? { water: 3, meals: 2 } 
        : disadvantaged === 'Nearpoor' 
        ? { water: 2, meals: 1 } 
        : { water: 0, meals: 0 },
      used: { water: 0, meals: 0 },
      lastReset: new Date(),
      keys: { waterKey: null, mealKey: null },
      keyExpires: { waterExpires: null, mealExpires: null }
    };
    await saveData();
  }

  const user = users[id];

  // 檢查是否已達到每日限額
  if (user.used.meals >= user.dailyLimit.meals) {
    return res.status(400).json({ error: '今日食物的份量已用完' });
  }

  // 生成新的食物金鑰，並設定12小時有效期
  const mealKey = generateKey();
  const mealExpires = new Date(new Date().getTime() + 12 * 60 * 60 * 1000); // 12小時後過期

  user.keys.mealKey = mealKey;
  user.keyExpires.mealExpires = mealExpires;

  await saveData(); // 更新到 JSON 檔案

  try {
    const qrCodeURL = await QRCode.toDataURL(mealKey);
    return res.json({
      message: '食物的 QR Code 已生成',
      key: mealKey,
      qrCode: qrCodeURL,
      expiresAt: mealExpires
    });
  } catch (err) {
    return res.status(500).json({ error: '生成 QR Code 時發生錯誤' });
  }
});

// 處理掃描 QR Code 的 POST 請求
app.post('/scan-qrcode', async (req: Request, res: Response) => {
  const { id, key, type } = req.body;

  if (!id || !key || !type) {
    return res.status(400).json({ error: 'ID, 金鑰和類型是必須的' });
  }

  // 檢查用戶是否存在
  const user = users[id];
  if (!user) {
    return res.status(404).json({ error: '用戶不存在' });
  }

  // 檢查金鑰是否有效
  if (type === 'water') {
    if (user.keys.waterKey !== key || !user.keyExpires.waterExpires || user.keyExpires.waterExpires < new Date()) {
      return res.status(400).json({ error: '無效或過期的金鑰' });
    }

    // 檢查是否已達到每日限額
    if (user.used.water >= user.dailyLimit.water) {
      return res.status(400).json({ error: '今日水的限額已達' });
    }

    // 更新水的使用次數
    user.used.water += 1;
    user.keys.waterKey = null; // 清除水金鑰
    user.keyExpires.waterExpires = null;
  } else if (type === 'meals') {
    if (user.keys.mealKey !== key || !user.keyExpires.mealExpires || user.keyExpires.mealExpires < new Date()) {
      return res.status(400).json({ error: '無效或過期的金鑰' });
    }

    // 檢查是否已達到每日限額
    if (user.used.meals >= user.dailyLimit.meals) {
      return res.status(400).json({ error: '今日食物的限額已達' });
    }

    // 更新食物的使用次數
    user.used.meals += 1;
    user.keys.mealKey = null; // 清除食物金鑰
    user.keyExpires.mealExpires = null;
  } else {
    return res.status(400).json({ error: '無效的類型' });
  }

  await saveData();

  return res.json({
    message: 'QR Code 掃描成功',
    remaining: {
      water: user.dailyLimit.water - user.used.water,
      meals: user.dailyLimit.meals - user.used.meals
    }
  });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
