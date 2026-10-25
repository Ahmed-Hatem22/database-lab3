// =====================================================================
// Client-side Validation (Step 3 & R8)
// Ensures quick user feedback before sending requests to the server.
// Exact messages match backend validation rules.
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Helper to render error messages into an alert box
  function displayErrors(alertBoxId, listId, errorMessages) {
    const alertBox = document.getElementById(alertBoxId);
    const errorList = document.getElementById(listId);
    if (!alertBox || !errorList) return;

    errorList.innerHTML = '';
    errorMessages.forEach(msg => {
      const li = document.createElement('li');
      li.className = 'error-item';
      li.textContent = msg;
      errorList.appendChild(li);
    });

    alertBox.classList.remove('hidden');
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearErrors(alertBoxId, listId) {
    const alertBox = document.getElementById(alertBoxId);
    const errorList = document.getElementById(listId);
    if (alertBox) alertBox.classList.add('hidden');
    if (errorList) errorList.innerHTML = '';
  }

  // 1. Register Form Validation
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirm_password');

      const errors = [];

      if (!name || !name.value || name.value.trim() === '') {
        errors.push('Name is required');
      }
      if (!email || !email.value || email.value.trim() === '') {
        errors.push('Email is required');
      }
      if (!password || !password.value || password.value === '') {
        errors.push('Password is required');
      }
      if (!confirmPassword || !confirmPassword.value || confirmPassword.value === '') {
        errors.push('Confirm password is required');
      }
      if (
        password &&
        confirmPassword &&
        password.value &&
        confirmPassword.value &&
        password.value !== confirmPassword.value
      ) {
        errors.push('Passwords do not match');
      }

      if (errors.length > 0) {
        e.preventDefault();
        displayErrors('errorAlertBox', 'errorList', errors);
      } else {
        clearErrors('errorAlertBox', 'errorList');
      }
    });
  }

  // 2. Login Form Validation
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      const email = document.getElementById('email');
      const password = document.getElementById('password');

      const errors = [];

      if (!email || !email.value || email.value.trim() === '') {
        errors.push('Email is required');
      }
      if (!password || !password.value || password.value === '') {
        errors.push('Password is required');
      }

      if (errors.length > 0) {
        e.preventDefault();
        displayErrors('errorAlertBox', 'errorList', errors);
      } else {
        clearErrors('errorAlertBox', 'errorList');
      }
    });
  }

  // 3. Add Study Task Form Validation
  const addTodoForm = document.getElementById('addTodoForm');
  if (addTodoForm) {
    addTodoForm.addEventListener('submit', (e) => {
      const titleInput = document.getElementById('todoTitleInput');
      const errors = [];

      if (!titleInput || !titleInput.value || titleInput.value.trim() === '') {
        errors.push('Title is required');
      } else if (titleInput.value.trim().length > 200) {
        errors.push('Title is too long');
      }

      if (errors.length > 0) {
        e.preventDefault();
        displayErrors('todoErrorAlertBox', 'todoErrorList', errors);
      } else {
        clearErrors('todoErrorAlertBox', 'todoErrorList');
      }
    });
  }

  // 4. Edit Study Task Forms Validation
  const editForms = document.querySelectorAll('.edit-todo-form');
  editForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('.todo-title-input');
      const errors = [];

      if (!input || !input.value || input.value.trim() === '') {
        errors.push('Title is required');
      } else if (input.value.trim().length > 200) {
        errors.push('Title is too long');
      }

      if (errors.length > 0) {
        e.preventDefault();
        displayErrors('todoErrorAlertBox', 'todoErrorList', errors);
      }
    });
  });
});
