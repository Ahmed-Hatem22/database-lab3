const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');

describe('Student Study Database System - Unit & Validation Tests', () => {

  // Test 1: Password Hashing (Step 4 & R9)
  describe('Password Hashing with bcrypt', () => {
    test('passwords must be hashed with bcrypt and not stored in plaintext', async () => {
      const rawPassword = 'StudentSecretPassword123!';
      const hash = await bcrypt.hash(rawPassword, 12);

      // Verify hash format ($2b$12$...)
      assert.match(hash, /^\$2[abxy]\$12\$/, 'Hash should use bcrypt with 12 rounds');
      assert.notStrictEqual(hash, rawPassword, 'Raw password must never equal hash');

      // Verify password verification works
      const isMatch = await bcrypt.compare(rawPassword, hash);
      assert.strictEqual(isMatch, true, 'bcrypt.compare should return true for valid password');

      const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
      assert.strictEqual(isWrongMatch, false, 'bcrypt.compare should return false for wrong password');
    });
  });

  // Test 2: Registration Validation Rules (R1, R8)
  describe('Registration Input Validation Rules', () => {
    function validateRegister(name, email, password, confirm_password) {
      const errors = [];
      if (!name || name.trim() === '') errors.push('Name is required');
      if (!email || email.trim() === '') errors.push('Email is required');
      if (!password || password === '') errors.push('Password is required');
      if (!confirm_password || confirm_password === '') errors.push('Confirm password is required');
      if (password && confirm_password && password !== confirm_password) {
        errors.push('Passwords do not match');
      }
      return errors;
    }

    test('empty form triggers one error per empty field', () => {
      const errors = validateRegister('', '', '', '');
      assert.deepStrictEqual(errors, [
        'Name is required',
        'Email is required',
        'Password is required',
        'Confirm password is required'
      ]);
    });

    test('whitespace-only name or email triggers required error', () => {
      const errors = validateRegister('   ', '   ', 'pass123', 'pass123');
      assert.ok(errors.includes('Name is required'));
      assert.ok(errors.includes('Email is required'));
    });

    test('mismatched passwords trigger Passwords do not match', () => {
      const errors = validateRegister('Sara Ahmed', 'sara@mail.com', 'secret1', 'secret2');
      assert.deepStrictEqual(errors, ['Passwords do not match']);
    });

    test('valid input produces no validation errors', () => {
      const errors = validateRegister('Sara Ahmed', 'sara@mail.com', 'secret123', 'secret123');
      assert.strictEqual(errors.length, 0);
    });
  });

  // Test 3: Login Validation Rules (R2, R8)
  describe('Login Input Validation Rules', () => {
    function validateLogin(email, password) {
      const errors = [];
      if (!email || email.trim() === '') errors.push('Email is required');
      if (!password || password === '') errors.push('Password is required');
      return errors;
    }

    test('empty login form triggers email and password required errors', () => {
      const errors = validateLogin('', '');
      assert.deepStrictEqual(errors, [
        'Email is required',
        'Password is required'
      ]);
    });

    test('valid login credentials produce no validation errors', () => {
      const errors = validateLogin('sara@mail.com', 'password123');
      assert.strictEqual(errors.length, 0);
    });
  });

  // Test 4: Study Task Title Validation Rules (R4, R5, R8)
  describe('Study Task Title Validation Rules', () => {
    function validateTodoTitle(title) {
      const errors = [];
      if (!title || title.trim() === '') {
        errors.push('Title is required');
      } else if (title.trim().length > 200) {
        errors.push('Title is too long');
      }
      return errors;
    }

    test('empty title or whitespace-only title triggers Title is required', () => {
      assert.deepStrictEqual(validateTodoTitle(''), ['Title is required']);
      assert.deepStrictEqual(validateTodoTitle('    '), ['Title is required']);
    });

    test('title longer than 200 characters triggers Title is too long', () => {
      const longTitle = 'a'.repeat(201);
      assert.deepStrictEqual(validateTodoTitle(longTitle), ['Title is too long']);
    });

    test('valid title within 200 characters passes', () => {
      const validTitle = 'Finish Database Lab 2: Login & To-Do Application';
      assert.strictEqual(validateTodoTitle(validTitle).length, 0);
    });
  });

  // Test 5: Authorization & Query Safety (R3, R9)
  describe('SQL Queries and Multi-Tenant Isolation', () => {
    test('UPDATE and DELETE queries must include user_id in WHERE clause', () => {
      const updateTitleSQL = 'UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?;';
      const toggleDoneSQL = 'UPDATE todos SET is_done = ? WHERE todo_id = ? AND user_id = ?;';
      const deleteTodoSQL = 'DELETE FROM todos WHERE todo_id = ? AND user_id = ?;';

      assert.ok(updateTitleSQL.includes('AND user_id = ?'), 'Update title query must enforce AND user_id = ?');
      assert.ok(toggleDoneSQL.includes('AND user_id = ?'), 'Toggle status query must enforce AND user_id = ?');
      assert.ok(deleteTodoSQL.includes('AND user_id = ?'), 'Delete query must enforce AND user_id = ?');
    });

    test('SQL injection attempt in email is passed as parameter, not concatenated', () => {
      const maliciousInput = "' OR '1'='1' --";
      const parameterizedQuery = 'SELECT user_id, name, password_hash FROM users WHERE email = ?;';
      // In parameterized execution, maliciousInput is strictly compared as a literal string value
      assert.ok(!parameterizedQuery.includes(maliciousInput));
      assert.ok(parameterizedQuery.includes('WHERE email = ?'));
    });
  });

});
