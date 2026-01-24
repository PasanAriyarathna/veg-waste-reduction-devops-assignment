// ===== GENERAL APP FUNCTIONS =====

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Check if user is logged in and redirect if on protected page
function checkAuthOnPageLoad() {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentPage = window.location.pathname;

    // If on category or vegetable-detail page without login, redirect
    if ((currentPage.includes('category.html') || currentPage.includes('vegetable-detail.html')) && !user) {
        window.location.href = 'signin.html';
    }
}
