// charger_host.js

// Ensure global functions from auth.js and main.js are accessible
// These are assumed to be loaded before charger_host.js in the HTML.
const showModal = window.showModal;
const closeModal = window.closeModal;
const sendEmail = window.sendEmail; // Assuming sendEmail is global from auth.js
const auth = window.auth; // Assuming auth object is global from auth.js
const toggleSidebar = window.toggleSidebar; // Assuming toggleSidebar is global from admin.html/main.js

// --- Mock Data for Demonstration ---
// In a real application, this data would be fetched from a backend API
let chargers = [
    { id: 'c1', name: 'Downtown Charger', location: '123 Main St, Anytown USA', type: 'Type 2', status: 'Online', price: 0.25, power: 22, workingHours: { start: '08:00', end: '22:00' } },
    { id: 'c2', name: 'Downtown Garage Unit A', location: '456 Central Ave, Anytown, USA', type: 'CCS', status: 'Charging', price: 0.30, power: 50, workingHours: { start: '09:00', end: '18:00' } },
    { id: 'c3', name: 'Suburb Fast Charger', location: '789 Park Rd, Suburbia, USA', type: 'CHAdeMO', status: 'Offline', price: 0.28, power: 7, workingHours: { start: '06:00', end: '23:00' } }
];

let bookings = [
    { id: 'BKG001', charger: 'Downtown Charger', date: '2025-06-05', time: '10:00', duration: '2 hours', customer: 'John Doe', status: 'Pending' },
    { id: 'BKG002', charger: 'Fast Charger Hub', date: '2025-06-03', time: '14:30', duration: '1 hour', customer: 'Jane Smith', status: 'Completed' },
    { id: 'BKG003', charger: 'Residential Charger', date: '2025-06-06', time: '09:00', duration: '3 hours', customer: 'Peter Jones', status: 'Upcoming' },
    { id: 'BKG004', charger: 'Downtown Charger', date: '2025-06-02', time: '11:00', duration: '1.5 hours', customer: 'Alice Brown', status: 'Cancelled' }
];

let promotions = [
    { id: 'P001', code: 'SUMMER20', description: '20% off all charging sessions in summer.', type: 'percentage', value: 20, status: 'Active', expiryDate: '2024-09-01', usage: '150/1000' },
    { id: 'P002', code: 'WELCOME5', description: '$5 off your first charge.', type: 'fixed', value: 5, status: 'Active', expiryDate: '2025-01-01', usage: '300/∞' },
    { id: 'P003', code: 'OLDCODE', description: 'Expired 10% off promotion.', type: 'percentage', value: 10, status: 'Expired', expiryDate: '2021-04-01', usage: '0/0' }
];

let sessionHistory = [
    { id: 'S001', charger: 'Downtown Charger', date: '2025-05-28', time: '14:00', duration: '1.5 hours', energy: '15', cost: '3.75', customer: 'John Doe' },
    { id: 'S002', charger: 'Fast Charger Hub', date: '2025-05-27', time: '09:30', duration: '1 hour', energy: '40', cost: '12.00', customer: 'Jane Smith' },
    { id: 'S003', charger: 'Residential Charger', date: '2025-05-26', time: '20:00', duration: '2 hours', energy: '10', cost: '2.80', customer: 'Peter Jones' }
];

let v2vPhotos = [
    // { id: 'v1', url: 'https://placehold.co/100x100?text=V2V+1' },
    // { id: 'v2', url: 'https://placehold.co/100x100?text=V2V+2' }
];

// --- Core Navigation Functionality ---

/**
 * Shows a specific page section and hides others.
 * Updates active states for sidebar and bottom navigation links.
 * @param {string} pageId - The ID of the page section to show (e.g., 'dashboard', 'manage-chargers').
 */
function showPage(pageId) {
    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show the requested page section
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error(`Page section with ID '${pageId}-page' not found.`);
        return;
    }

    // Update active class for sidebar links (desktop)
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
    });
    const sidebarLink = document.querySelector(`.sidebar a[onclick*="showPage('${pageId}')"]`);
    if (sidebarLink) {
        sidebarLink.classList.add('active');
    }

    // Update active class for bottom navigation links (mobile)
    document.querySelectorAll('.bottom-nav a').forEach(link => {
        link.classList.remove('active');
    });
    const bottomNavlink = document.querySelector(`.bottom-nav a[onclick*="showPage('${pageId}')"]`);
    if (bottomNavlink) {
        bottomNavlink.classList.add('active');
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        // Calling the global toggleSidebar function from admin.html/main.js
        toggleSidebar(true); // Pass true to force close if it's open
    }

    // Update charts specific to the page if applicable
    updateCharts(pageId);

    // Re-render tables/data when their respective pages are shown
    if (pageId === 'manage-chargers') {
        chargerHost.renderChargersTable();
    } else if (pageId === 'bookings') {
        chargerHost.filterBookings('all'); // Show all bookings by default
    } else if (pageId === 'dashboard') {
        chargerHost.updateDashboardMetrics();
    } else if (pageId === 'promotions') {
        chargerHost.renderPromotionsTable();
    } else if (pageId === 'session-history') {
        chargerHost.renderSessionHistoryTable();
    } else if (pageId === 'settings') {
        chargerHost.renderV2VPhotos(); // Ensure V2V photos are rendered on settings page load
    }
}

// --- Charger Host Specific Logic ---

const chargerHost = {
    /**
     * Updates the dashboard metrics based on current mock data.
     */
    updateDashboardMetrics: function() {
        document.getElementById('totalRevenue').textContent = `$ ${(sessionHistory.reduce((sum, session) => sum + parseFloat(session.cost), 0)).toFixed(2)}`;
        document.getElementById('totalChargers').textContent = chargers.length;
        const activeChargers = chargers.filter(c => c.status === 'Online' || c.status === 'Charging').length;
        document.getElementById('activeChargers').textContent = `${activeChargers}/${chargers.length}`;
        const sessionsToday = sessionHistory.filter(s => s.date === new Date().toISOString().slice(0, 10)).length; // Simple check for today
        document.getElementById('sessionsToday').textContent = sessionsToday;
        const offlineChargers = chargers.filter(c => c.status === 'Offline').length;
        document.getElementById('offlineChargers').textContent = offlineChargers;

        // Update charts on dashboard if they exist
        if (monthlyRevenueChart) monthlyRevenueChart.update();
        if (chargerAvailabilityChart) chargerAvailabilityChart.update();
        if (hourlyUsageChart) hourlyUsageChart.update();
    },

    /**
     * Shows the modal for adding a new charger.
     */
    showAddChargerForm: function() {
        showModal('addChargerModal');
    },

    /**
     * Handles the submission of the add new charger form.
     * Adds a new charger to the mock data and re-renders the table.
     * @param {Event} event - The form submission event.
     */
    addCharger: function(event) {
        event.preventDefault();
        const name = document.getElementById('newChargerName').value;
        const location = document.getElementById('newChargerLocation').value;
        const type = document.getElementById('newChargerType').value;
        const price = parseFloat(document.getElementById('newChargerPrice').value);
        const power = parseInt(document.getElementById('newChargerPower').value);
        const hoursStart = document.getElementById('newChargerWorkingHoursStart').value;
        const hoursEnd = document.getElementById('newChargerWorkingHoursEnd').value;

        const newCharger = {
            id: 'c' + (chargers.length + 1), // Simple ID generation
            name: name,
            location: location,
            type: type,
            status: 'Online', // Default status for new chargers
            price: price,
            power: power,
            workingHours: { start: hoursStart, end: hoursEnd }
        };
        chargers.push(newCharger);
        // Using alert for demo, replace with custom modal or toast notification
        alert('Charger added successfully!');
        closeModal('addChargerModal');
        this.renderChargersTable(); // Re-render the chargers table
        this.updateDashboardMetrics(); // Update dashboard metrics
    },

    /**
     * Shows the modal for editing an existing charger.
     * Populates the form with the charger's current data.
     * @param {string} chargerName - The name of the charger to edit.
     */
    editCharger: function(chargerName) {
        const charger = chargers.find(c => c.name === chargerName);
        if (charger) {
            document.getElementById('editChargerId').value = charger.id;
            document.getElementById('editChargerName').value = charger.name;
            document.getElementById('editChargerLocation').value = charger.location;
            document.getElementById('editChargerType').value = charger.type;
            document.getElementById('editChargerPrice').value = charger.price;
            document.getElementById('editChargerPower').value = charger.power;
            document.getElementById('editChargerWorkingHoursStart').value = charger.workingHours.start;
            document.getElementById('editChargerWorkingHoursEnd').value = charger.workingHours.end;
            showModal('editChargerModal');
        } else {
            console.error(`Charger '${chargerName}' not found for editing.`);
        }
    },

    /**
     * Handles the submission of the edit charger form.
     * Updates the charger's data in the mock array and re-renders the table.
     * @param {Event} event - The form submission event.
     */
    saveEditedCharger: function(event) {
        event.preventDefault();
        const id = document.getElementById('editChargerId').value;
        const name = document.getElementById('editChargerName').value;
        const location = document.getElementById('editChargerLocation').value;
        const type = document.getElementById('editChargerType').value;
        const price = parseFloat(document.getElementById('editChargerPrice').value);
        const power = parseInt(document.getElementById('editChargerPower').value);
        const hoursStart = document.getElementById('editChargerWorkingHoursStart').value;
        const hoursEnd = document.getElementById('editChargerWorkingHoursEnd').value;

        const chargerIndex = chargers.findIndex(c => c.id === id);
        if (chargerIndex !== -1) {
            chargers[chargerIndex] = {
                ...chargers[chargerIndex], // Keep existing properties
                name: name,
                location: location,
                type: type,
                price: price,
                power: power,
                workingHours: { start: hoursStart, end: hoursEnd }
            };
            alert('Charger updated successfully!'); // Using alert for demo, replace with custom modal
            closeModal('editChargerModal');
            this.renderChargersTable(); // Re-render the chargers table
            this.updateDashboardMetrics(); // Update dashboard metrics
        } else {
            console.error(`Charger with ID '${id}' not found for saving edits.`);
        }
    },

    /**
     * Renders the list of chargers in the 'My Chargers' table.
     */
    renderChargersTable: function() {
        const tableBody = document.querySelector('#chargersTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        chargers.forEach(charger => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = charger.name;
            row.insertCell().textContent = charger.location;
            row.insertCell().innerHTML = `<span class="status-${charger.status.toLowerCase()}">${charger.status}</span>`;
            row.insertCell().textContent = `$ ${charger.price.toFixed(2)}`;
            row.insertCell().textContent = `${charger.power} KW`;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="button small" onclick="chargerHost.editCharger('${charger.name}')">Edit</button>
                <button class="button small" onclick="chargerHost.viewChargerBookings('${charger.name}')">Bookings</button>
            `;
        });
    },

    /**
     * Searches the chargers table based on user input.
     */
    searchChargers: function() {
        const input = document.querySelector('#manage-chargers-page .search-bar');
        const filter = input.value.toLowerCase();
        const table = document.getElementById('chargersTable');
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) { // Skip header row (index 0)
            let found = false;
            // Check relevant columns (Name, Location, Type, Status)
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) ||
                cells[1] && cells[1].textContent.toLowerCase().includes(filter) ||
                cells[2] && cells[2].textContent.toLowerCase().includes(filter) ||
                cells[3] && cells[3].textContent.toLowerCase().includes(filter) ||
                cells[4] && cells[4].textContent.toLowerCase().includes(filter)) {
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Navigates to the bookings page and filters bookings for a specific charger.
     * @param {string} chargerName - The name of the charger to filter by.
     */
    viewChargerBookings: function(chargerName) {
        showPage('bookings');
        this.filterBookings('all', chargerName); // Filter bookings for this specific charger
    },

    /**
     * Filters and renders the bookings table based on status and optionally charger name.
     * @param {string} status - The booking status to filter by ('all', 'upcoming', 'completed', 'cancelled').
     * @param {string|null} chargerName - Optional: The name of the charger to filter by.
     */
    filterBookings: function(status, chargerName = null) {
        const tableBody = document.querySelector('#bookingsTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        const filtered = bookings.filter(booking => {
            const statusMatch = status === 'all' || booking.status.toLowerCase() === status;
            const chargerMatch = chargerName === null || booking.charger === chargerName;
            return statusMatch && chargerMatch;
        });

        filtered.forEach(booking => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = booking.id;
            row.insertCell().textContent = booking.charger;
            row.insertCell().textContent = booking.date;
            row.insertCell().textContent = booking.time;
            row.insertCell().textContent = booking.duration;
            row.insertCell().textContent = booking.customer;
            row.insertCell().innerHTML = `<span class="status-${booking.status.toLowerCase()}">${booking.status}</span>`;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `<button class="button small">View</button>`;
            if (booking.status === 'Pending') {
                actionsCell.innerHTML += ` <button class="button small">Approve</button>`;
            }
            // Add other actions as needed (e.g., "Cancel", "Mark Completed")
        });

        // Update active tab visual
        document.querySelectorAll('#bookings-page .tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`#bookings-page .tabs .tab[onclick*="filterBookings('${status}')"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    },

    /**
     * Searches the bookings table based on user input.
     */
    searchBookings: function() {
        const input = document.querySelector('#bookings-page .search-bar');
        const filter = input.value.toLowerCase();
        const table = document.getElementById('bookingsTable');
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) { // Skip header row (index 0)
            let found = false;
            // Check relevant columns (Booking ID, Charger, Customer, Status)
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // ID
                cells[1] && cells[1].textContent.toLowerCase().includes(filter) || // Charger
                cells[5] && cells[5].textContent.toLowerCase().includes(filter) || // Customer
                cells[6] && cells[6].textContent.toLowerCase().includes(filter)) { // Status
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Handles saving of global pricing rules.
     * @param {Event} event - The form submission event.
     */
    savePricingRules: function(event) {
        event.preventDefault();
        const defaultPrice = parseFloat(document.getElementById('defaultPricePerKWh').value);
        const enableV2V = document.getElementById('enableV2VPricing').checked;
        const defaultV2VPrice = parseFloat(document.getElementById('defaultV2VPricePerKWh').value);
        const enablePeakHour = document.getElementById('enablePeakHourPricing').checked;

        // In a real app, send to backend
        console.log('Pricing Rules Saved:', { defaultPrice, enableV2V, defaultV2VPrice, enablePeakHour });
        alert('Pricing rules saved successfully!');
    },

    /**
     * Handles report generation.
     * @param {Event} event - The form submission event.
     */
    generateReport: function(event) {
        event.preventDefault();
        const reportType = document.getElementById('reportType').value;
        const dateRange = document.getElementById('dateRange').value; // This would be parsed by a date picker library

        // In a real app, trigger report generation on backend and download
        console.log(`Generating ${reportType} report for ${dateRange}`);
        alert(`Generating ${reportType} report for ${dateRange}. (Demo: Report would download now.)`);
    },

    /**
     * Shows the modal for adding a new promotion.
     */
    showAddPromotionForm: function() {
        showModal('addPromotionModal');
    },

    /**
     * Handles the submission of the add new promotion form.
     * Adds a new promotion to the mock data and re-renders the table.
     * @param {Event} event - The form submission event.
     */
    addPromotion: function(event) {
        event.preventDefault();
        const code = document.getElementById('newPromoCode').value;
        const description = document.getElementById('newPromoDescription').value;
        const type = document.getElementById('newPromoType').value;
        const value = parseFloat(document.getElementById('newPromoValue').value);
        const expiryDate = document.getElementById('newPromoExpiryDate').value;
        const usageLimit = document.getElementById('newPromoUsageLimit').value || '∞';

        const newPromotion = {
            id: 'P' + (promotions.length + 1),
            code: code,
            description: description,
            type: type === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`,
            value: value,
            status: new Date(expiryDate) > new Date() ? 'Active' : 'Expired', // Determine status based on expiry
            expiryDate: expiryDate,
            usage: `0/${usageLimit}`
        };
        promotions.push(newPromotion);
        alert('Promotion added successfully!');
        closeModal('addPromotionModal');
        this.renderPromotionsTable();
    },

    /**
     * Renders the list of promotions in the 'Manage Promotions' table.
     */
    renderPromotionsTable: function() {
        const tableBody = document.querySelector('#promotionsTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        promotions.forEach(promo => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = promo.code;
            row.insertCell().textContent = promo.description;
            row.insertCell().textContent = promo.type;
            row.insertCell().innerHTML = `<span class="status-${promo.status.toLowerCase()}">${promo.status}</span>`;
            row.insertCell().textContent = promo.expiryDate;
            row.insertCell().textContent = promo.usage;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="button small">Edit</button>
                <button class="button small">Delete</button>
            `;
        });
    },

    /**
     * Searches the promotions table based on user input.
     */
    searchPromotions: function() {
        const input = document.querySelector('#promotions-page .search-bar');
        const filter = input.value.toLowerCase();
        const table = document.getElementById('promotionsTable');
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) {
            let found = false;
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // Code
                cells[1] && cells[1].textContent.toLowerCase().includes(filter)) { // Description
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Renders the session history table.
     */
    renderSessionHistoryTable: function() {
        const tableBody = document.querySelector('#sessionHistoryTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        sessionHistory.forEach(session => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = session.id;
            row.insertCell().textContent = session.charger;
            row.insertCell().textContent = session.date;
            row.insertCell().textContent = session.time;
            row.insertCell().textContent = session.duration;
            row.insertCell().textContent = session.energy;
            row.insertCell().textContent = `$ ${session.cost}`;
            row.insertCell().textContent = session.customer;
        });
    },

    /**
     * Searches the session history table based on user input.
     */
    searchSessions: function() {
        const input = document.querySelector('#session-history-page .search-bar');
        const filter = input.value.toLowerCase();
        const table = document.getElementById('sessionHistoryTable');
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) {
            let found = false;
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // Session ID
                cells[1] && cells[1].textContent.toLowerCase().includes(filter) || // Charger
                cells[7] && cells[7].textContent.toLowerCase().includes(filter)) { // Customer
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Handles saving of host profile settings.
     * @param {Event} event - The form submission event.
     */
    saveProfileSettings: function(event) {
        event.preventDefault();
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        console.log('Profile Settings Saved:', { name, email });
        alert('Profile settings saved!');
    },

    /**
     * Handles saving of notification preferences.
     * @param {Event} event - The form submission event.
     */
    saveNotificationSettings: function(event) {
        event.preventDefault();
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const smsAlerts = document.getElementById('smsAlerts').checked;
        console.log('Notification Settings Saved:', { emailNotifications, smsAlerts });
        alert('Notification settings saved!');
    },

    /**
     * Handles saving of appearance settings.
     * @param {Event} event - The form submission event.
     */
    saveAppearanceSettings: function(event) {
        event.preventDefault();
        const darkMode = document.getElementById('darkMode').checked;
        console.log('Appearance Settings Saved:', { darkMode });
        alert('Appearance settings saved!');
        // In a real app, apply dark mode class to body
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    /**
     * Handles saving of regional settings.
     * @param {Event} event - The form submission event.
     */
    saveRegionalSettings: function(event) {
        event.preventDefault();
        const language = document.getElementById('language').value;
        const timezone = document.getElementById('timezone').value;
        console.log('Regional Settings Saved:', { language, timezone });
        alert('Regional settings saved!');
    },

    /**
     * Handles V2V photo upload.
     * @param {Event} event - The file input change event.
     */
    handleV2VPhotoUpload: function(event) {
        const files = event.target.files;
        const maxPhotos = 3;
        if (v2vPhotos.length + files.length > maxPhotos) {
            alert(`You can only upload a maximum of ${maxPhotos} vehicle photos.`);
            return;
        }

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newPhoto = {
                        id: `v${Date.now()}`, // Simple unique ID
                        url: e.target.result // Base64 encoded image
                    };
                    v2vPhotos.push(newPhoto);
                    this.renderV2VPhotos();
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload image files only.');
            }
        }
    },

    /**
     * Renders uploaded V2V photos.
     */
    renderV2VPhotos: function() {
        const photoGrid = document.getElementById('v2vUploadedPhotos');
        photoGrid.innerHTML = ''; // Clear existing photos

        if (v2vPhotos.length === 0) {
            document.querySelector('#v2vPhotoUploadArea + small').style.display = 'block';
        } else {
            document.querySelector('#v2vPhotoUploadArea + small').style.display = 'none';
        }

        v2vPhotos.forEach(photo => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'uploaded-photo';
            photoDiv.innerHTML = `
                <img src="${photo.url}" alt="Vehicle Photo">
                <span class="delete-photo" onclick="chargerHost.deleteV2VPhoto('${photo.id}')">&times;</span>
            `;
            photoGrid.appendChild(photoDiv);
        });
    },

    /**
     * Deletes a V2V photo.
     * @param {string} photoId - The ID of the photo to delete.
     */
    deleteV2VPhoto: function(photoId) {
        if (confirm('Are you sure you want to delete this photo?')) { // Using confirm for demo
            v2vPhotos = v2vPhotos.filter(photo => photo.id !== photoId);
            this.renderV2VPhotos();
            alert('Photo deleted.');
        }
    },

    /**
     * Handles account deletion.
     */
    deleteAccount: function() {
        if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            // In a real application, send a request to the backend to delete the account
            console.log('Account deletion initiated.');
            alert('Your account has been marked for deletion. (Demo: Account would be deleted)');
            auth.logout(); // Log out after deletion
        }
    },

    // --- AI Predictive Insights Mock Functions ---
    predictDemand: function() {
        alert('Predicting future demand... (Demo: AI model would run and display forecast)');
        console.log('AI: Generating demand forecast...');
    },
    optimizeSchedule: function() {
        alert('Optimizing charger schedules... (Demo: AI model would run and display optimized schedule)');
        console.log('AI: Optimizing charger schedules...');
    },
    predictMaintenance: function() {
        alert('Predicting maintenance needs... (Demo: AI model would run and display maintenance predictions)');
        console.log('AI: Predicting maintenance needs...');
    },
    generatePromotionIdeas: function() {
        alert('Generating AI-powered promotion ideas... (Demo: AI model would suggest ideas)');
        console.log('AI: Generating promotion ideas...');
    }
};

// --- Chart Initialization and Update ---

// Declare chart variables globally within this script scope
let monthlyRevenueChart;
let chargerAvailabilityChart;
let hourlyUsageChart;

/**
 * Initializes all Chart.js instances for the analytics and dashboard pages.
 * This function should be called once the DOM is ready.
 */
function initializeCharts() {
    // Monthly Revenue Chart (Dashboard)
    const monthlyRevenueCtx = document.getElementById('monthlyRevenueChart')?.getContext('2d');
    if (monthlyRevenueCtx) {
        monthlyRevenueChart = new Chart(monthlyRevenueCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [1200, 1500, 1250, 1700, 1550, 1900], // Mock data
                    backgroundColor: '#2e5a50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow charts to resize freely
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value / 1000 + 'k';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Charger Availability Chart (Dashboard)
    const chargerAvailabilityCtx = document.getElementById('chargerAvailabilityChart')?.getContext('2d');
    if (chargerAvailabilityCtx) {
        const available = chargers.filter(c => c.status === 'Online').length;
        const charging = chargers.filter(c => c.status === 'Charging').length;
        const offline = chargers.filter(c => c.status === 'Offline').length;

        chargerAvailabilityChart = new Chart(chargerAvailabilityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Available', 'Charging', 'Offline'],
                datasets: [{
                    data: [available, charging, offline],
                    backgroundColor: ['#98fb98', '#f4a261', '#dc3545'], // primary-light, accent, red
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Hourly Usage Chart (Dashboard)
    const hourlyUsageCtx = document.getElementById('hourlyUsageChart')?.getContext('2d');
    if (hourlyUsageCtx) {
        hourlyUsageChart = new Chart(hourlyUsageCtx, {
            type: 'line',
            data: {
                labels: ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'],
                datasets: [{
                    label: 'Number of Sessions',
                    data: [10, 8, 6, 4, 5, 7, 12, 18, 22, 20, 15, 12, 18, 20, 24, 23, 19, 15, 12, 10, 8, 7, 6, 5], // Mock data
                    borderColor: '#2e5a50',
                    backgroundColor: 'rgba(46, 90, 80, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sessions'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}


/**
 * Updates the charts. Useful when switching between pages if chart data might change.
 * @param {string} pageId - The ID of the currently active page.
 */
function updateCharts(pageId) {
    if (pageId === 'dashboard') {
        if (monthlyRevenueChart) monthlyRevenueChart.update();
        if (chargerAvailabilityChart) {
            // Update data for availability chart based on current charger statuses
            const available = chargers.filter(c => c.status === 'Online').length;
            const charging = chargers.filter(c => c.status === 'Charging').length;
            const offline = chargers.filter(c => c.status === 'Offline').length;
            chargerAvailabilityChart.data.datasets[0].data = [available, charging, offline];
            chargerAvailabilityChart.update();
        }
        if (hourlyUsageChart) hourlyUsageChart.update();
    }
    // No specific chart updates needed for other pages in this mock setup
}

// --- Event Listeners and Initial Setup ---

document.addEventListener('DOMContentLoaded', () => {
    // Set initial page to dashboard
    showPage('dashboard');

    // Initialize charts
    initializeCharts();

    // Render initial tables
    chargerHost.renderChargersTable();
    chargerHost.filterBookings('all'); // Initial render of all bookings
    chargerHost.renderPromotionsTable();
    chargerHost.renderSessionHistoryTable();
    chargerHost.renderV2VPhotos(); // Render V2V photos on load

    // Attach form submission listeners
    const addChargerForm = document.getElementById('addChargerForm');
    if (addChargerForm) {
        addChargerForm.addEventListener('submit', (e) => chargerHost.addCharger(e));
    }

    const editChargerForm = document.getElementById('editChargerForm');
    if (editChargerForm) {
        editChargerForm.addEventListener('submit', (e) => chargerHost.saveEditedCharger(e));
    }

    const globalPricingForm = document.getElementById('globalPricingForm');
    if (globalPricingForm) {
        globalPricingForm.addEventListener('submit', (e) => chargerHost.savePricingRules(e));
    }

    const reportGenerationForm = document.getElementById('reportGenerationForm');
    if (reportGenerationForm) {
        reportGenerationForm.addEventListener('submit', (e) => chargerHost.generateReport(e));
    }

    const addPromotionForm = document.getElementById('addPromotionForm');
    if (addPromotionForm) {
        addPromotionForm.addEventListener('submit', (e) => chargerHost.addPromotion(e));
    }

    const profileSettingsForm = document.getElementById('profileSettingsForm');
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', (e) => chargerHost.saveProfileSettings(e));
    }

    const notificationSettingsForm = document.getElementById('notificationSettingsForm');
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', (e) => chargerHost.saveNotificationSettings(e));
    }

    const appearanceSettingsForm = document.getElementById('appearanceSettingsForm');
    if (appearanceSettingsForm) {
        appearanceSettingsForm.addEventListener('submit', (e) => chargerHost.saveAppearanceSettings(e));
    }

    const regionalSettingsForm = document.getElementById('regionalSettingsForm');
    if (regionalSettingsForm) {
        regionalSettingsForm.addEventListener('submit', (e) => chargerHost.saveRegionalSettings(e));
    }

    const v2vPhotoUploadArea = document.getElementById('v2vPhotoUploadArea');
    const v2vPhotoInput = document.getElementById('v2vPhotoInput');
    if (v2vPhotoUploadArea && v2vPhotoInput) {
        v2vPhotoUploadArea.addEventListener('click', () => v2vPhotoInput.click());
        v2vPhotoInput.addEventListener('change', (e) => chargerHost.handleV2VPhotoUpload(e));
    }

    // Initial update of dashboard metrics
    chargerHost.updateDashboardMetrics();
});

// Expose functions to global scope for HTML inline event handlers
// These are already handled by main.js or admin.html's global scope, but
// explicitly setting them here ensures they are available if this script
// is loaded after those, or if main.js doesn't expose them globally in the same way.
window.showPage = showPage;
window.toggleSidebar = toggleSidebar; // Assuming this is defined globally in main.js or admin.html
window.chargerHost = chargerHost;
// window.auth is assumed to be global from auth.js
