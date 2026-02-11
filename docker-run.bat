@echo off
echo 🐳 Building Docker image...
docker build -t crypto-tracker .

echo 🚀 Stopping old container if exists...
docker stop crypto-tracker 2>nul
docker rm crypto-tracker 2>nul

echo 🌟 Running new container...
docker run -d ^
  --name crypto-tracker ^
  -p 5000:5000 ^
  -v "%cd%/crypto_prices.db:/app/crypto_prices.db" ^
  --restart unless-stopped ^
  crypto-tracker

echo ✅ Container is running!
echo 📊 Dashboard: http://localhost:5000/dashboard
echo 🔍 Check logs with: docker logs crypto-tracker