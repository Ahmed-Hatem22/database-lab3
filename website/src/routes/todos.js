const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to protect private routes (R3: visitor not logged in is sent to login page)
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// All to-do routes require authentication
router.use(requireAuth);

// GET / - Show study task list for the logged-in student (Query 3)
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user.user_id;

    // Query 3: Show the list of the logged-in user, newest first
    const [todos] = await db.execute(
      'SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC;',
      [userId]
    );

    res.render('index', {
      user: req.session.user,
      todos,
      errors: [],
      inputTitle: '',
      editTodoId: null,
      editTitle: ''
    });
  } catch (err) {
    console.error('Error fetching study tasks:', err);
    res.status(500).render('index', {
      user: req.session.user,
      todos: [],
      errors: ['Failed to load study tasks from database.'],
      inputTitle: '',
      editTodoId: null,
      editTitle: ''
    });
  }
});

// POST /todos/add - Add a new study task (Query 4)
router.post('/todos/add', async (req, res) => {
  const { title } = req.body;
  const userId = req.session.user.user_id;
  const errors = [];

  // Validation rules (R8)
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.trim().length > 200) {
    errors.push('Title is too long');
  }

  // If validation fails, re-render form with messages without touching database
  if (errors.length > 0) {
    try {
      const [todos] = await db.execute(
        'SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC;',
        [userId]
      );
      return res.status(400).render('index', {
        user: req.session.user,
        todos,
        errors,
        inputTitle: title || '',
        editTodoId: null,
        editTitle: ''
      });
    } catch (err) {
      console.error(err);
      return res.redirect('/');
    }
  }

  try {
    // Query 4: Add a to-do
    await db.execute(
      'INSERT INTO todos (user_id, title) VALUES (?, ?);',
      [userId, title.trim()]
    );
    // Post/Redirect/Get pattern
    return res.redirect('/');
  } catch (err) {
    console.error('Error adding study task:', err);
    return res.redirect('/');
  }
});

// POST /todos/:id/edit - Update the study task title (Query 5)
router.post('/todos/:id/edit', async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const { title } = req.body;
  const userId = req.session.user.user_id;
  const errors = [];

  // Validation rules (R8)
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.trim().length > 200) {
    errors.push('Title is too long');
  }

  if (errors.length > 0) {
    try {
      const [todos] = await db.execute(
        'SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC;',
        [userId]
      );
      return res.status(400).render('index', {
        user: req.session.user,
        todos,
        errors,
        inputTitle: '',
        editTodoId: todoId,
        editTitle: title || ''
      });
    } catch (err) {
      console.error(err);
      return res.redirect('/');
    }
  }

  try {
    // Query 5: Edit the title (scoped to user_id for security)
    await db.execute(
      'UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?;',
      [title.trim(), todoId, userId]
    );
    return res.redirect('/');
  } catch (err) {
    console.error('Error updating study task:', err);
    return res.redirect('/');
  }
});

// POST /todos/:id/toggle - Mark done (1) or not done (0) (Query 6)
router.post('/todos/:id/toggle', async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const userId = req.session.user.user_id;
  // Normalize is_done to 0 or 1
  const isDone = (req.body.is_done === '1' || req.body.is_done === 1 || req.body.is_done === 'true') ? 1 : 0;

  try {
    // Query 6: Mark done (1) or not done (0)
    await db.execute(
      'UPDATE todos SET is_done = ? WHERE todo_id = ? AND user_id = ?;',
      [isDone, todoId, userId]
    );
    return res.redirect('/');
  } catch (err) {
    console.error('Error toggling study task state:', err);
    return res.redirect('/');
  }
});

// POST /todos/:id/delete - Delete study task (Query 7)
router.post('/todos/:id/delete', async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const userId = req.session.user.user_id;

  try {
    // Query 7: Delete (scoped to user_id for security)
    await db.execute(
      'DELETE FROM todos WHERE todo_id = ? AND user_id = ?;',
      [todoId, userId]
    );
    return res.redirect('/');
  } catch (err) {
    console.error('Error deleting study task:', err);
    return res.redirect('/');
  }
});

module.exports = router;
