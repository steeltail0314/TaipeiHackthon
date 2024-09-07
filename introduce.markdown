
### 說明

1. **`/generate-water-qrcode` 和 `/generate-meal-qrcode`**：
   - 每次請求都會生成一個新的隨機金鑰，並轉換為 QR Code，金鑰會在 12 小時後過期。
   - 生成 QR Code 不會影響水或食物的剩餘數量，直到 QR Code 被掃描。

2. **`/scan-qrcode`**：
   - 掃描 QR Code 時會檢查該金鑰是否有效，並且根據類型（`water` 或 `meals`）來更新用戶的剩餘配額。
   - 每次掃描成功後，該金鑰會被清除，並且配額才會更新。


### 測試

#### 生成水的 QR Code & 生成餐的 QR Code

```bash
curl -X POST http://localhost:5173/generate-water-qrcode \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": "1234", "disadvantaged": "Lowincome"}}'

curl -X POST http://localhost:5173/generate-meal-qrcode \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": "1234", "disadvantaged": "Lowincome"}}'

curl -X POST http://localhost:5173/scan-qrcode \
  -H "Content-Type: application/json" \
  -d '{"id": "1234", "key": "your-qrcode-key", "type": "water"}'

  curl -X POST http://localhost:5173/scan-qrcode \
  -H "Content-Type: application/json" \
  -d '{"id": "1234", "key": "your-qrcode-key", "type": "meals"}'

