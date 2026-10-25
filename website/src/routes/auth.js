const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Middleware to redirect already logged-in users away from auth pages
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  next();
}

// GET /register
router.get('/register', redirectIfAuth, (req, res) => {
  res.render('register', {
    errors: [],
    values: { name: '', email: '' }
  });
});

// POST /register
router.post('/register', redirectIfAuth, async (req, res) => {
  const { name, email, password, confirm_password } = req.body;
  const errors = [];

  // Validation according to Lab 2 exact rules
  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  }
  if (!password || password === '') {
    errors.push('Password is required');
  }
  if (!confirm_password || confirm_password === '') {
    errors.push('Confirm password is required');
  }
  if (password && confirm_password && password !== confirm_password) {
    errors.push('Passwords do not match');
  }

  // If validation fails, re-render form with messages without touching database (R8)
  if (errors.length > 0) {
    return res.status(400).render('register', {
      errors,
      values: { name: name || '', email: email || '' }
    });
  }

  try {
    // Hash password with bcrypt (12 rounds)
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Query 1: Sign up
    const [result] = await db.execute(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?);',
      [email.trim(), name.trim(), password_hash]
    );

    // R1: Log the user in after registration and redirect to list
    req.session.user = {
      user_id: result.insertId,
      name: name.trim(),
      email: email.trim()
    };

    return res.redirect('/');
  } catch (err) {
    // Duplicate email error handling (MySQL Error 1062 / ER_DUP_ENTRY)
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      return res.status(400).render('register', {
        errors: ['Email Already Exists'],
        values: { name: name || '', email: email || '' }
      });
    }

    console.error('Registration error:', err);
    return res.status(500).render('register', {
      errors: ['Database error occurred while creating account. Please try again.'],
      values: { name: name || '', email: email || '' }
    });
  }
});

// GET /login
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login', {
    errors: [],
    values: { email: '' }
  });
});

// POST /login
router.post('/login', redirectIfAuth, async (req, res) => {
  const { email, password } = req.body;
  const errors = [];

  // Validation according to Lab 2 exact rules
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  }
  if (!password || password === '') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).render('login', {
      errors,
      values: { email: email || '' }
    });
  }

  try {
    // Query 2: Log in: find user by e-mail, then compare password with password_hash in code
    const [rows] = await db.execute(
      'SELECT user_id, name, password_hash FROM users WHERE email = ?;',
      [email.trim()]
    );

    // R2: Same message for wrong email and wrong password
    if (rows.length === 0) {
      return res.status(400).render('login', {
        errors: ['Invalid email or password'],
        values: { email: email || '' }
      });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(400).render('login', {
        errors: ['Invalid email or password'],
        values: { email: email || '' }
      });
    }

    // Login successful: initialize session (Step 5)
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: email.trim()
    };

    return res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('login', {
      errors: ['A server error occurred during login. Please try again.'],
      values: { email: email || '' }
    });
  }
});

// POST & GET /logout
function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
}

router.post('/logout', handleLogout);
router.get('/logout', handleLogout);

module.exports = router;
