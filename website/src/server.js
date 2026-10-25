const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const libraryRoutes = require('./routes/library');

const app = express();

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../public')));

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Session configuration (Step 5)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'lab2_student_study_session_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Mount application routes
app.use(authRoutes);
app.use(libraryRoutes);
app.use(todoRoutes);

// Friendly 404 handler (R10: No raw error pages)
app.use((req, res) => {
  res.status(404).render('login', {
    errors: ['Page not found. Please log in or return to the main dashboard.'],
    values: { email: '' }
  });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).send('A server error occurred. Please try again.');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Student Study Database System running on http://localhost:${PORT}`);
  });
}

module.exports = app;
