const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./database/db');
const employeeRoutes = require('./routes/employees');
const equipmentRoutes = require('./routes/equipment');
const transportationRoutes = require('./routes/transportation');
const toolsRoutes = require('./routes/tools');
const sparesRoutes = require('./routes/spares');
const materialsRoutes = require('./routes/materials');

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 5000;

// Настройка Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Статические файлы React
app.use(express.static(path.join(__dirname, 'build')));

// Регистрация маршрутов API
app.use('/api/employees', employeeRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/transportation', transportationRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/spares', sparesRoutes);
app.use('/api/materials', materialsRoutes);

// Маршрут для обслуживания React приложения
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Закрытие соединения с БД при остановке сервера
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});