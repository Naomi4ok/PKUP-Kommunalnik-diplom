const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./database/db');
const dbSchedule = require('./database/db_schedule');
const dbUsers = require('./database/db_users'); // Add this line
const employeeRoutes = require('./routes/employees');
const equipmentRoutes = require('./routes/equipment');
const transportationRoutes = require('./routes/transportation');
const toolsRoutes = require('./routes/tools');
const sparesRoutes = require('./routes/spares');
const materialsRoutes = require('./routes/materials');
const scheduleRoutes = require('./routes/schedule');
const { router: authRoutes } = require('./routes/auth'); // Add this line
const dbExpenses = require('./database/db_expenses');
const expensesRoutes = require('./routes/expenses');
const storageRoutes = require('./routes/storage');

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 5000;

// Настройка Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Создание таблиц для модуля расписания
dbSchedule.createScheduleTable();
dbUsers.createUsersTable(); // Add this line
dbExpenses.createExpensesTable();

// Статические файлы React
app.use(express.static(path.join(__dirname, 'build')));

// Регистрация маршрутов API
app.use('/api/auth', authRoutes); // Add this line
app.use('/api/employees', employeeRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/transportation', transportationRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/spares', sparesRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/storage', storageRoutes);

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