// Импортируем функции аутентификации из существующего auth.js
const { verifyToken, verifyAdmin } = require('../routes/auth');

// Экспортируем функцию аутентификации под именем, которое используется в модуле расходов
const authenticateUser = verifyToken;

module.exports = { 
  authenticateUser,
  verifyAdmin 
};