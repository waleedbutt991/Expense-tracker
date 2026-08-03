const API_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" 
  ? "http://127.0.0.1:8000" 
  : "/api";

let isLoginMode = true;

const authForm = document.getElementById('authForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const toggleAuth = document.getElementById('toggleAuth');
const toggleText = document.getElementById('toggleText');

if (toggleAuth) {
  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
      formTitle.innerText = "Welcome Back";
      submitBtn.innerText = "Login";
      toggleText.innerText = "Don't have an account?";
      toggleAuth.innerText = "Sign Up";
    } else {
      formTitle.innerText = "Create Account";
      submitBtn.innerText = "Sign Up";
      toggleText.innerText = "Already have an account?";
      toggleAuth.innerText = "Login";
    }
  });
}

if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const endpoint = isLoginMode ? '/login' : '/signup';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        window.location.href = 'index.html';
      } else {
        if (Array.isArray(data.detail)) {
          alert(data.detail[0].msg || "Invalid Input");
        } else {
          alert(data.detail || "Authentication Failed");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Ensure backend terminal is running and email format is valid (e.g. user@domain.com)");
    }
  });
}