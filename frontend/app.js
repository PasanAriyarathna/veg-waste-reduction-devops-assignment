// ===== GENERAL APP FUNCTIONS =====

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}
