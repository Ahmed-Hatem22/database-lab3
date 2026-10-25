const mysql = require('mysql2/promise');
require('dotenv').config();

// In-memory data store for fallback/demo/mock mode
const mockUsers = [
  {
    user_id: 1,
    email: 'sara@mail.com',
    name: 'Sara Ahmed',
    // bcrypt hash of 'password123'
    password_hash: '$2a$10$OfzRXd2I1k.XaHd0OtHnkuXFTf0suLx8GUxbKq3lQYlaJz/LrxJom',
    registration_date: new Date()
  }
];

const mockTodos = [
  {
    todo_id: 2,
    user_id: 1,
    title: 'Finish the database lab',
    is_done: 1,
    created_at: new Date(Date.now() - 3600000)
  },
  {
    todo_id: 1,
    user_id: 1,
    title: 'Buy oat milk',
    is_done: 0,
    created_at: new Date(Date.now() - 7200000)
  }
];

let nextUserId = 2;
let nextTodoId = 3;

// Configure MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'registration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let isUsingMock = process.env.USE_MOCK_DB === 'true';

// Test connection on startup
if (!isUsingMock) {
  pool.getConnection()
    .then(conn => {
      console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'registration');
      conn.release();
    })
    .catch(err => {
      console.warn(`⚠️ Note: Could not connect to MySQL (${err.code || err.message}).`);
      console.warn('👉 To use MySQL, ensure MySQL is running and set your credentials in .env.');
      console.warn('👉 Running in fallback demonstration mode with in-memory storage so the app stays functional.');
      isUsingMock = true;
    });
}

/**
 * Execute query against MySQL or fallback mock
 */
async function execute(sql, params = []) {
  if (!isUsingMock) {
    try {
      return await pool.execute(sql, params);
    } catch (err) {
      // If error is duplicate entry, rethrow so auth router can handle ER_DUP_ENTRY
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        throw err;
      }
      // If connection issue, switch to mock fallback
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
        console.warn('Switching to mock mode due to DB error:', err.message);
        isUsingMock = true;
      } else {
        throw err;
      }
    }
  }

  // --- Mock DB Handler matching exact lab queries ---
  const normalizedSql = sql.trim().toUpperCase();

  // 1. Sign up: INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?);
  if (normalizedSql.startsWith('INSERT INTO USERS')) {
    const [email, name, password_hash] = params;
    const exists = mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      const dupError = new Error('Duplicate entry for email');
      dupError.code = 'ER_DUP_ENTRY';
      dupError.errno = 1062;
      throw dupError;
    }
    const newUser = {
      user_id: nextUserId++,
      email,
      name,
      password_hash,
      registration_date: new Date()
    };
    mockUsers.push(newUser);
    return [{ insertId: newUser.user_id, affectedRows: 1 }, null];
  }

  // 2. Log in: SELECT user_id, name, password_hash FROM users WHERE email = ?;
  if (normalizedSql.startsWith('SELECT USER_ID, NAME, PASSWORD_HASH FROM USERS')) {
    const [email] = params;
    const found = mockUsers.filter(u => u.email.toLowerCase() === email.toLowerCase());
    return [found, null];
  }

  // 3. Show list: SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC;
  if (normalizedSql.startsWith('SELECT TODO_ID, TITLE, IS_DONE, CREATED_AT FROM TODOS')) {
    const [userId] = params;
    const userTodos = mockTodos
      .filter(t => t.user_id === parseInt(userId, 10))
      .sort((a, b) => b.todo_id - a.todo_id);
    return [userTodos, null];
  }

  // 4. Add a to-do: INSERT INTO todos (user_id, title) VALUES (?, ?);
  if (normalizedSql.startsWith('INSERT INTO TODOS')) {
    const [userId, title] = params;
    const newTodo = {
      todo_id: nextTodoId++,
      user_id: parseInt(userId, 10),
      title,
      is_done: 0,
      created_at: new Date()
    };
    mockTodos.unshift(newTodo);
    return [{ insertId: newTodo.todo_id, affectedRows: 1 }, null];
  }

  // 5. Edit the title: UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?;
  if (normalizedSql.startsWith('UPDATE TODOS SET TITLE = ?')) {
    const [title, todoId, userId] = params;
    const item = mockTodos.find(t => t.todo_id === parseInt(todoId, 10) && t.user_id === parseInt(userId, 10));
    if (item) {
      item.title = title;
      return [{ affectedRows: 1 }, null];
    }
    return [{ affectedRows: 0 }, null];
  }

  // 6. Mark done (1) or not done (0): UPDATE todos SET is_done = ? WHERE todo_id = ? AND user_id = ?;
  if (normalizedSql.startsWith('UPDATE TODOS SET IS_DONE = ?')) {
    const [isDone, todoId, userId] = params;
    const item = mockTodos.find(t => t.todo_id === parseInt(todoId, 10) && t.user_id === parseInt(userId, 10));
    if (item) {
      item.is_done = isDone;
      return [{ affectedRows: 1 }, null];
    }
    return [{ affectedRows: 0 }, null];
  }

  // 7. Delete: DELETE FROM todos WHERE todo_id = ? AND user_id = ?;
  if (normalizedSql.startsWith('DELETE FROM TODOS')) {
    const [todoId, userId] = params;
    const idx = mockTodos.findIndex(t => t.todo_id === parseInt(todoId, 10) && t.user_id === parseInt(userId, 10));
    if (idx !== -1) {
      mockTodos.splice(idx, 1);
      return [{ affectedRows: 1 }, null];
    }
    return [{ affectedRows: 0 }, null];
  }

  throw new Error(`Unsupported mock query: ${sql}`);
}

module.exports = {
  execute,
  pool
};
