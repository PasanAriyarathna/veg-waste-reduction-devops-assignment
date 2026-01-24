// ===== VEGETABLE DETAIL PAGE =====
// This page shows charts and allows employees to update data

let currentChart = null;
let currentVegetableId = null;
let currentUser = null;

// Check if user is logged in
function checkUserLogin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('❌ Please sign in first');
        window.location.href = 'signin.html';
        return null;
    }
    return user;
}

// Get vegetable ID from URL parameters
function getVegetableIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load vegetable details
async function loadVegetableDetails(vegId) {
    try {
        const response = await fetch(`/api/vegetables/${vegId}`);
        if (!response.ok) {
            if (response.status === 404 && response.headers.get('content-type')?.includes('text/html')) {
                throw new Error('Server not running. Please start the server first.');
            }
            throw new Error('Vegetable not found');
        }

        const vegetable = await response.json();
        currentVegetableId = vegId;

        // Update page title and headers
        document.getElementById('vegName').textContent = vegetable.name;
        document.getElementById('vegDescription').textContent = vegetable.description;

    } catch (error) {
        console.error('Error loading vegetable:', error);
        alert('❌ Failed to load vegetable details');
        window.location.href = 'category.html';
    }
}

// Set up UI based on user role
function setupUIByRole(user) {
    const formSection = document.getElementById('formSection');
    const roleBadge = document.getElementById('userRoleBadge');
    const viewOnlyNotice = document.getElementById('viewOnlyNotice');

    if (user.role === 'agent') {
        // Show form for agents
        formSection.style.display = 'block';
        viewOnlyNotice.style.display = 'none';
        roleBadge.className = 'role-badge employee';
        roleBadge.innerHTML = `👨‍🌾 Logged in as Agent - District: ${user.district}`;

        // Lock district to agent's assigned district
        const districtSelect = document.getElementById('district');
        if (districtSelect) {
            districtSelect.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = user.district;
            opt.textContent = user.district;
            districtSelect.appendChild(opt);
            districtSelect.disabled = true;
        }
    } else {
        // Admin and customers: read-only
        formSection.style.display = 'none';
        viewOnlyNotice.style.display = 'block';
        
        if (user.role === 'admin') {
            roleBadge.className = 'role-badge customer';
            roleBadge.innerHTML = '🛠️ Logged in as Admin - Read Only';
        } else {
            roleBadge.className = 'role-badge customer';
            roleBadge.innerHTML = '👥 Logged in as Customer - Read Only';
        }
    }
}

// Load districts dropdown
async function loadDistricts() {
    try {
        const response = await fetch('/api/districts');
        if (!response.ok) {
            throw new Error('Failed to load districts');
        }
        const districts = await response.json();

        const districtSelect = document.getElementById('district');
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

// Load harvest data and display chart
async function loadHarvestData() {
    try {
        const response = await fetch(`/api/harvest/${currentVegetableId}`);
        if (!response.ok) {
            throw new Error('Failed to load harvest data');
        }
        const harvestData = await response.json();

        // Update table for employees
        if (currentUser.role === 'agent') {
            updateDataTable(harvestData);
        }

        // Update chart
        updateChart(harvestData);

    } catch (error) {
        console.error('Error loading harvest data:', error);
    }
}

// Update data table for employees
function updateDataTable(data) {
    const tbody = document.querySelector('#harvestDataTable tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">No harvest data yet</td></tr>';
        return;
    }

    // Group data by id and district to allow editing
    const uniqueData = {};
    data.forEach(item => {
        const key = `${item.district}-${item.harvest_date}`;
        if (!uniqueData[key] || new Date(item.updated_at) > new Date(uniqueData[key].updated_at)) {
            uniqueData[key] = item;
        }
    });

    Object.values(uniqueData).slice(0, 10).forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.district}</td>
            <td>${item.total_quantity}</td>
            <td>${new Date(item.harvest_date).toLocaleDateString('en-US')}</td>
            <td>
                <button class="btn-delete" onclick="deleteHarvestData(${item.id || 'null'})">
                    🗑️ Delete
                </button>
            </td>
        `;
    });
}

// Update chart with harvest data
function updateChart(data) {
    const canvas = document.getElementById('harvestChart');

    // Group data by district
    const byDistrict = {};
    data.forEach(item => {
        if (!byDistrict[item.district]) {
            byDistrict[item.district] = 0;
        }
        byDistrict[item.district] += item.total_quantity || 0;
    });

    const districts = Object.keys(byDistrict).sort();
    const quantities = districts.map(d => byDistrict[d]);

    // Generate colors
    const colors = generateColors(districts.length);

    // Destroy existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart
    const ctx = canvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: districts,
            datasets: [{
                label: 'Harvest Quantity (kg)',
                data: quantities,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.6', '1')),
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12 },
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Harvest Data by District'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity (kg)'
                    }
                }
            }
        }
    });
}

// Generate random colors for chart
function generateColors(count) {
    const colors = [];
    const hues = ['rgba(255, 99, 132,', 'rgba(54, 162, 235,', 'rgba(255, 206, 86,', 
                  'rgba(75, 192, 192,', 'rgba(153, 102, 255,', 'rgba(255, 159, 64,'];
    
    for (let i = 0; i < count; i++) {
        const color = hues[i % hues.length];
        colors.push(color + ' 0.6)');
    }
    return colors;
}

// Handle form submission (add harvest data)
document.getElementById('harvestForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const district = document.getElementById('district').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const harvestDate = document.getElementById('harvestDate').value;
    const formMessage = document.getElementById('formMessage');

    if (!district) {
        formMessage.textContent = '❌ Please select a district';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/harvest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vegetableId: currentVegetableId,
                district,
                quantity,
                harvestDate,
                userId: currentUser.id
            })
        });

        if (!response.ok && (response.status === 404 || response.headers.get('content-type')?.includes('text/html'))) {
            throw new Error('Server not running. Please start the server first.');
        }

        const data = await response.json();

        if (!response.ok) {
            formMessage.textContent = '❌ ' + data.error;
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
            return;
        }

        // Show success message
        formMessage.textContent = '✅ Harvest data added successfully!';
        formMessage.className = 'form-message success';
        formMessage.style.display = 'block';

        // Reset form
        document.getElementById('harvestForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('harvestDate').value = today;

        // Clear message after 3 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 3000);

        // Reload data and update chart immediately
        await loadHarvestData();

    } catch (error) {
        console.error('Error:', error);
        formMessage.textContent = '❌ An error occurred: ' + error.message;
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
    }
});

// Delete harvest data
async function deleteHarvestData(dataId) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }

    try {
        const response = await fetch(`/api/harvest/${dataId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                district: currentUser.district
            })
        });

        if (!response.ok && (response.status === 404 || response.headers.get('content-type')?.includes('text/html'))) {
            throw new Error('Server not running. Please start the server first.');
        }

        const data = await response.json();

        if (!response.ok) {
            alert('❌ ' + data.error);
            return;
        }

        alert('✅ Record deleted successfully!');
        loadHarvestData();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ An error occurred');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = checkUserLogin();
    if (!currentUser) return;

    const vegId = getVegetableIdFromURL();
    if (!vegId) {
        alert('❌ Invalid vegetable');
        window.location.href = 'category.html';
        return;
    }

    // Set up UI based on role
    setupUIByRole(currentUser);

    // Load data
    await loadVegetableDetails(vegId);
    await loadDistricts();
    await loadHarvestData();

    // Auto-refresh chart every 3 seconds (real-time updates)
    const refreshInterval = setInterval(async () => {
        try {
            await loadHarvestData();
        } catch (error) {
            console.log('Auto-refresh check failed (server might be offline)');
            clearInterval(refreshInterval);
        }
    }, 3000);

    // Clear interval when user leaves page
    window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval);
    });
