# 使用官方 Node.js 映像
FROM node:20

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用程式源代碼
COPY . .

# 開放伺服器端口
EXPOSE 5173

# 運行應用程式
CMD ["npm", "start"]
