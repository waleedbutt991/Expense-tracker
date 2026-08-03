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

    // Detect Host Environment
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    
    // Construct dynamic path safe for both Vercel Rewrites and Local Uvicorn
    const endpoint = isLoginMode ? '/login' : '/signup';
    const targetUrl = isLocal ? `http://127.0.0.1:8000${endpoint}` : `/api${endpoint}`;

    try {
      const response = await fetch(targetUrl, {
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
        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : (data.detail || "Authentication Failed");
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Fetch Exception Details:", err);
      alert(`Connection Error (${err.message}). Vercel function may be initializing or URL invalid.`);
    }
  });
}