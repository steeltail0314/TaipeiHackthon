# 使用 Node.js 官方映像檔作為基底映像
FROM node:20

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json 到工作目錄
COPY package*.json ./

# 安裝專案所需的依賴
RUN npm install

# 複製專案中的所有檔案到工作目錄
COPY . .

# 曝露應用程式運行的端口
EXPOSE 5173

# 啟動應用程式
CMD ["npm", "start"]
