// ===== AUTHENTICATION LOGIC =====

// Toggle between Login and Register tabs
function toggleTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// ===== LOGIN FORM =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    // Reset error state
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.remove('show');
    }

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (loginError) {
            loginError.textContent = 'Please enter a valid email address.';
            loginError.classList.add('show');
        }
        return;
    }
    if (typeof password !== 'string' || password.trim().length < 6) {
        if (loginError) {
            loginError.textContent = 'Password must be at least 6 characters.';
            loginError.classList.add('show');
        }
        return;
    }

    // Disable button during request
    if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Signing in...';
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server not running or returned invalid response. Please ensure the server is started with: node server.js');
        }

        const data = await response.json();

        if (!response.ok) {
            // Show error message
            if (loginError) {
                loginError.textContent = data.error || 'Login failed. Please try again.';
                loginError.classList.add('show');
            } else {
                alert('❌ ' + (data.error || 'Login failed. Please try again.'));
            }
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'Sign In';
            return;
        }

        // Success! Store user data and redirect
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        // Show success message
        alert('✅ Logged in successfully!');

        // Redirect based on role
        if (data.user && data.user.role === 'agent') {
            window.location.href = 'dashboard-agent.html';
        } else if (data.user && data.user.role === 'admin') {
            window.location.href = 'dashboard-admin.html';
        } else if (data.user && data.user.role === 'customer') {
            window.location.href = 'index.html';
        } else {
            alert('Unknown role. Please contact Admin.');
            window.location.href = 'index.html';
        }

    } catch (error) {
        console.error('Error:', error);
        if (loginError) {
            loginError.textContent = 'Network error. Please check your connection.';
            loginError.classList.add('show');
        } else {
            alert('❌ Network error. Please check your connection.');
        }
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Sign In';
    }
});
