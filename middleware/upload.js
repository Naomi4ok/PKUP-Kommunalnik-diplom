const multer = require('multer');

// Настройка хранилища для multer (загрузка файлов)
const storage = multer.memoryStorage(); // Хранение файлов в виде буферов
const upload = multer({ storage: storage });

module.exports = upload;