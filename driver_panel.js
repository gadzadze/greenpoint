// driver.js

// --- Diagnostic Checks for Global Functions ---
// These logs will help verify if required functions from other scripts are loaded.
console.log('Driver Panel JS: Initializing...');
console.log('Is showModal defined?', typeof window.showModal === 'function' ? 'Yes' : 'No');
console.log('Is closeModal defined?', typeof window.closeModal === 'function' ? 'Yes' : 'No');
console.log('Is sendEmail defined?', typeof window.sendEmail === 'function' ? 'Yes' : 'No');
console.log('Is auth defined?', typeof window.auth === 'object' && window.auth !== null ? 'Yes' : 'No');
console.log('Is toggleSidebar defined?', typeof window.toggleSidebar === 'function' ? 'Yes' : 'No');

// Ensure global functions from auth.js and main.js are accessible
// These are assumed to be loaded before driver.js in the HTML.
const showModal = window.showModal;
const closeModal = window.closeModal;
const sendEmail = window.sendEmail; // Assuming sendEmail is global from auth.js
const auth = window.auth; // Assuming auth object is global from auth.js
const toggleSidebar = window.toggleSidebar; // Assuming toggleSidebar is global from admin.html/main.js

// --- Mock Data for Demonstration ---
let chargers = [
    { id: 'ch1', name: 'City Center Fast Charge', location: '41.7151, 44.7925', type: 'CCS', price: 0.35, power: 50, status: 'Available', workingHours: { start: '06:00', end: '23:00' } },
    { id: 'ch2', name: 'Vake Park Charger', location: '41.7061, 44.7677', type: 'Type 2', price: 0.20, power: 22, status: 'Available', workingHours: { start: '08:00', end: '20:00' } },
    { id: 'ch3', name: 'Saburtalo Mall Station', location: '41.7300, 44.7700', type: 'CHAdeMO', price: 0.30, power: 7, status: 'Occupied', workingHours: { start: '09:00', end: '22:00' } },
    { id: 'ch4', name: 'Old Town Charger', location: '41.6934, 44.8015', type: 'Type 2', price: 0.22, power: 11, status: 'Available', workingHours: { start: '07:00', end: '21:00' } }
];

let services = {
    "Battery Health Check": {
        providers: ["Tesla Service Georgia", "Tegeta Motors"],
        duration: 60,
        bookedSlots: [
            { date: "2025-06-10", time: "09:00" },
            { date: "2025-06-10", time: "11:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Software Update": {
        providers: ["Tesla Service Georgia"],
        duration: 30,
        bookedSlots: [
            { date: "2025-06-11", time: "10:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Tire Rotation & Alignment": {
        providers: ["Tegeta Motors"],
        duration: 45,
        bookedSlots: [
            { date: "2025-06-12", time: "14:00" }
        ],
        workingHours: { start: 9, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "General Inspection": {
        providers: ["Tesla Service Georgia", "Tegeta Motors", "EV Care Center"],
        duration: 90,
        bookedSlots: [
            { date: "2025-06-13", time: "10:00" }
        ],
        workingHours: { start: 8, end: 17, breakStart: 12, breakEnd: 13 }
    }
};

let myBookings = [
    { id: 'DRB001', type: 'Charger', item: 'City Center Fast Charge', date: '2025-06-08', time: '15:00', status: 'Upcoming' },
    { id: 'DRB002', type: 'Service', item: 'Battery Health Check', date: '2025-06-10', time: '09:00', status: 'Upcoming' },
    { id: 'DRB003', type: 'Charger', item: 'Vake Park Charger', date: '2025-06-01', time: '10:30', status: 'Completed' },
    { id: 'DRB004', type: 'Service', item: 'Tire Rotation & Alignment', date: '2025-05-20', time: '14:00', status: 'Completed' },
    { id: 'DRB005', type: 'Charger', item: 'Saburtalo Mall Station', date: '2025-06-03', time: '11:00', status: 'Cancelled' }
];

let myVehicles = [
    { id: 'V001', make: 'Tesla', model: 'Model 3', year: 2022, batteryCapacity: 75, currentRange: 450, status: 'Active' },
    { id: 'V002', make: 'Nissan', model: 'Leaf', year: 2018, batteryCapacity: 40, currentRange: 180, status: 'Active' }
];

let energyRequests = [
    { id: 'ER001', requester: 'Alice B.', location: '41.7200, 44.7900', amount: 10, urgency: 'High', status: 'Active' },
    { id: 'ER002', requester: 'Bob S.', location: '41.7000, 44.7500', amount: 5, urgency: 'Medium', status: 'Active' }
];

// --- Core Navigation Functionality ---

/**
 * Shows a specific page section and hides others.
 * Updates active states for sidebar and bottom navigation links.
 * @param {string} pageId - The ID of the page section to show (e.g., 'dashboard', 'find-chargers').
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
        if (typeof toggleSidebar === 'function') {
            toggleSidebar(true); // Pass true to force close if it's open
        } else {
            console.warn('toggleSidebar function not available.');
        }
    }

    // Perform specific actions when a page is shown
    if (pageId === 'find-chargers') {
        driver.initMap();
        driver.renderChargersTable();
    } else if (pageId === 'my-bookings') {
        driver.filterMyBookings('all');
    } else if (pageId === 'my-vehicles') {
        driver.renderMyVehiclesTable();
    } else if (pageId === 'dashboard') {
        driver.updateDashboardMetrics();
    } else if (pageId === 'energy-sharing') {
        driver.renderEnergyRequestsTable();
    }
}

// --- Driver Specific Logic ---

const driver = {
    map: null, // Leaflet map instance

    /**
     * Initializes the Leaflet map.
     */
    initMap: function() {
        if (this.map) {
            this.map.remove(); // Remove existing map if it's already initialized
        }
        // Check if L (Leaflet) is defined before trying to use it
        if (typeof L !== 'undefined') {
            this.map = L.map('map').setView([41.7151, 44.7925], 13); // Default to Tbilisi center

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            this.addChargerMarkersToMap();
        } else {
            console.error('Leaflet (L) is not defined. Ensure Leaflet JS is loaded.');
        }
    },

    /**
     * Adds charger markers to the map.
     */
    addChargerMarkersToMap: function() {
        if (this.map && typeof L !== 'undefined') {
            chargers.forEach(charger => {
                const [lat, lon] = charger.location.split(', ').map(Number);
                const marker = L.marker([lat, lon]).addTo(this.map);
                marker.bindPopup(`
                    <b>${charger.name}</b><br>
                    Type: ${charger.type}<br>
                    Price: $${charger.price.toFixed(2)}/kWh<br>
                    Power: ${charger.power} KW<br>
                    Status: ${charger.status}<br>
                    <button class="button primary small mt-2" onclick="driver.showChargerBookingModal('${charger.id}', '${charger.name}')">Book Now</button>
                `);
            });
        } else {
            console.warn('Map not initialized or Leaflet not available to add markers.');
        }
    },

    /**
     * Updates dashboard metrics based on current mock data.
     */
    updateDashboardMetrics: function() {
        // Nearest Charger (simplified: just pick the first one)
        const nearestChargerElem = document.getElementById('nearestCharger');
        const nearestChargerDistanceElem = document.getElementById('nearestChargerDistance');
        if (nearestChargerElem && nearestChargerDistanceElem) {
            if (chargers.length > 0) {
                nearestChargerElem.textContent = chargers[0].name;
                nearestChargerDistanceElem.textContent = 'Approx. 2.5 km'; // Mock distance
            } else {
                nearestChargerElem.textContent = 'No chargers found';
                nearestChargerDistanceElem.textContent = '';
            }
        } else {
            console.warn('Dashboard elements for nearest charger not found.');
        }


        // Upcoming Booking
        const upcomingBookingElem = document.getElementById('upcomingBooking');
        const upcomingBookingDetailsElem = document.getElementById('upcomingBookingDetails');
        if (upcomingBookingElem && upcomingBookingDetailsElem) {
            const upcoming = myBookings.find(b => b.status === 'Upcoming');
            if (upcoming) {
                upcomingBookingElem.textContent = upcoming.item;
                upcomingBookingDetailsElem.textContent = `${upcoming.date} at ${upcoming.time}`;
            } else {
                upcomingBookingElem.textContent = 'No upcoming bookings';
                upcomingBookingDetailsElem.textContent = '';
            }
        } else {
            console.warn('Dashboard elements for upcoming booking not found.');
        }


        // Current Range (using first vehicle's data if available)
        const currentRangeElem = document.getElementById('currentRange');
        if (currentRangeElem) {
            if (myVehicles.length > 0) {
                currentRangeElem.textContent = `${myVehicles[0].currentRange} km`;
            } else {
                currentRangeElem.textContent = '-- km';
            }
        } else {
            console.warn('Dashboard element for current range not found.');
        }


        // Active Energy Requests
        const activeEnergyRequestsElem = document.getElementById('activeEnergyRequests');
        if (activeEnergyRequestsElem) {
            activeEnergyRequestsElem.textContent = `${energyRequests.length} Active`;
        } else {
            console.warn('Dashboard element for active energy requests not found.');
        }
    },

    /**
     * Renders the list of available chargers in the 'Find Chargers' table.
     */
    renderChargersTable: function() {
        const tableBody = document.querySelector('#availableChargersTable tbody');
        if (!tableBody) {
            console.error('Chargers table body not found.');
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows

        chargers.forEach(charger => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = charger.name;
            row.insertCell().textContent = charger.location.split(',')[0]; // Just show latitude for simplicity
            row.insertCell().textContent = charger.type;
            row.insertCell().textContent = `$ ${charger.price.toFixed(2)}`;
            row.insertCell().textContent = `${charger.power} KW`;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="button small primary" onclick="driver.showChargerBookingModal('${charger.id}', '${charger.name}')">Book</button>
            `;
        });
    },

    /**
     * Searches the available chargers table based on user input.
     */
    searchChargers: function() {
        const input = document.querySelector('#find-chargers-page .search-bar');
        const table = document.getElementById('availableChargersTable');
        if (!input || !table) {
            console.warn('Search input or chargers table not found for search operation.');
            return;
        }
        const filter = input.value.toLowerCase();
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) { // Skip header row (index 0)
            let found = false;
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // Name
                cells[1] && cells[1].textContent.toLowerCase().includes(filter) || // Location
                cells[2] && cells[2].textContent.toLowerCase().includes(filter)) { // Type
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Populates the service provider and time slots based on selected service and date.
     */
    updateServiceBookingOptions: function() {
        const serviceType = document.getElementById('serviceType');
        const serviceProviderSelect = document.getElementById('serviceProvider');
        const serviceTimeSelect = document.getElementById('serviceTime');
        const serviceDate = document.getElementById('serviceDate');

        if (!serviceType || !serviceProviderSelect || !serviceTimeSelect || !serviceDate) {
            console.warn('Service booking elements not found for updating options.');
            return;
        }

        // Clear previous options
        serviceProviderSelect.innerHTML = '<option value="">Any Provider</option>';
        serviceTimeSelect.innerHTML = '<option value="">Select time</option>';

        if (serviceType.value && services[serviceType.value]) {
            // Populate providers
            services[serviceType.value].providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider;
                option.textContent = provider;
                serviceProviderSelect.appendChild(option);
            });

            // Populate time slots (simplified: show all available hours)
            const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
            const selectedDate = serviceDate.value || today;
            const workingHours = services[serviceType.value].workingHours;

            // Generate available time slots (hourly for simplicity)
            for (let h = workingHours.start; h < workingHours.end; h++) {
                const time = `${String(h).padStart(2, '0')}:00`;
                // Check if this slot is already booked for the selected date
                const isBooked = services[serviceType.value].bookedSlots.some(slot =>
                    slot.date === selectedDate && slot.time === time
                );

                if (!isBooked) {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    serviceTimeSelect.appendChild(option);
                }
            }
        }
    },

    /**
     * Handles service booking form submission.
     * @param {Event} event - The form submission event.
     */
    submitServiceBooking: function(event) {
        event.preventDefault();
        const serviceType = document.getElementById('serviceType')?.value;
        const serviceProvider = document.getElementById('serviceProvider')?.value;
        const serviceDate = document.getElementById('serviceDate')?.value;
        const serviceTime = document.getElementById('serviceTime')?.value;
        const serviceNotes = document.getElementById('serviceNotes')?.value;

        if (!serviceType || !serviceDate || !serviceTime) {
            // Using a custom modal/message box instead of alert
            if (typeof showModal === 'function') {
                // Assuming a generic message modal exists, or create one for this purpose
                // For now, using a simple alert as a fallback/demo
                alert('Please fill in all required service booking fields.');
            } else {
                console.error('showModal function not available.');
                alert('Please fill in all required service booking fields.');
            }
            return;
        }

        const newBooking = {
            id: 'DRB' + (myBookings.length + 1),
            type: 'Service',
            item: serviceType,
            date: serviceDate,
            time: serviceTime,
            status: 'Upcoming',
            provider: serviceProvider,
            notes: serviceNotes
        };
        myBookings.push(newBooking);
        // Using a custom modal/message box instead of alert
        if (typeof showModal === 'function') {
            // Assuming a generic message modal exists, or create one for this purpose
            // For now, using a simple alert as a fallback/demo
            alert('Service booking confirmed! Check "My Bookings" for details. (This is a demo)');
        } else {
            console.error('showModal function not available.');
            alert('Service booking confirmed! Check "My Bookings" for details. (This is a demo)');
        }

        // In a real app, send email confirmation via sendEmail function
        if (typeof sendEmail === 'function') {
            sendEmail('driver@example.com', 'Service Booking Confirmation', `Your booking for ${serviceType} on ${serviceDate} at ${serviceTime} is confirmed.`);
        } else {
            console.warn('sendEmail function not available.');
        }


        // Reset form
        const serviceBookingForm = document.getElementById('serviceBookingForm');
        if (serviceBookingForm) serviceBookingForm.reset();
        this.updateServiceBookingOptions(); // Reset time slots
        showPage('my-bookings'); // Navigate to my bookings
    },

    /**
     * Shows the charger booking modal and pre-fills charger info.
     * @param {string} chargerId - The ID of the charger to book.
     * @param {string} chargerName - The name of the charger.
     */
    showChargerBookingModal: function(chargerId, chargerName) {
        const chargerBookingChargerIdElem = document.getElementById('chargerBookingChargerId');
        const chargerBookingChargerNameElem = document.getElementById('chargerBookingChargerName');
        const chargerBookingTimeSelect = document.getElementById('chargerBookingTime');
        const chargerBookingDate = document.getElementById('chargerBookingDate');

        if (!chargerBookingChargerIdElem || !chargerBookingChargerNameElem || !chargerBookingTimeSelect || !chargerBookingDate) {
            console.error('One or more charger booking modal elements not found.');
            return;
        }

        chargerBookingChargerIdElem.value = chargerId;
        chargerBookingChargerNameElem.textContent = chargerName;

        const charger = chargers.find(c => c.id === chargerId);
        if (!charger) {
            console.error('Charger not found for booking:', chargerId);
            return;
        }

        // Populate time slots for charger booking
        chargerBookingTimeSelect.innerHTML = '<option value="">Select time</option>';

        const today = new Date().toISOString().slice(0, 10);
        const selectedDate = chargerBookingDate.value || today;
        const workingHours = charger.workingHours;

        for (let h = parseInt(workingHours.start.split(':')[0]); h < parseInt(workingHours.end.split(':')[0]); h++) {
            const time = `${String(h).padStart(2, '0')}:00`;
            // Simplified: check if this exact hour is booked (in a real app, consider duration)
            const isBooked = myBookings.some(b =>
                b.type === 'Charger' && b.item === chargerName && b.date === selectedDate && b.time === time
            );

            if (!isBooked) {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                chargerBookingTimeSelect.appendChild(option);
            }
        }

        if (typeof showModal === 'function') {
            showModal('chargerBookingModal');
        } else {
            console.error('showModal function not available.');
        }
    },

    /**
     * Handles charger booking form submission.
     * @param {Event} event - The form submission event.
     */
    submitChargerBooking: function(event) {
        event.preventDefault();
        const chargerId = document.getElementById('chargerBookingChargerId')?.value;
        const chargerName = document.getElementById('chargerBookingChargerName')?.textContent;
        const bookingDate = document.getElementById('chargerBookingDate')?.value;
        const bookingTime = document.getElementById('chargerBookingTime')?.value;
        const bookingDuration = document.getElementById('chargerBookingDuration')?.value;
        const bookingNotes = document.getElementById('chargerBookingNotes')?.value;

        if (!bookingDate || !bookingTime || !bookingDuration) {
            if (typeof showModal === 'function') {
                alert('Please fill in all required charger booking fields.');
            } else {
                console.error('showModal function not available.');
                alert('Please fill in all required charger booking fields.');
            }
            return;
        }

        const newBooking = {
            id: 'DRB' + (myBookings.length + 1),
            type: 'Charger',
            item: chargerName,
            date: bookingDate,
            time: bookingTime,
            duration: `${bookingDuration} hours`,
            status: 'Upcoming',
            notes: bookingNotes
        };
        myBookings.push(newBooking);
        if (typeof showModal === 'function') {
            alert('Charger booking confirmed! Check "My Bookings" for details. (This is a demo)');
        } else {
            console.error('showModal function not available.');
            alert('Charger booking confirmed! Check "My Bookings" for details. (This is a demo)');
        }

        if (typeof sendEmail === 'function') {
            sendEmail('driver@example.com', 'Charger Booking Confirmation', `Your booking for ${chargerName} on ${bookingDate} at ${bookingTime} for ${bookingDuration} hours is confirmed.`);
        } else {
            console.warn('sendEmail function not available.');
        }


        // Reset form
        const chargerBookingForm = document.getElementById('chargerBookingForm');
        if (chargerBookingForm) chargerBookingForm.reset();
        if (typeof closeModal === 'function') {
            closeModal('chargerBookingModal');
        } else {
            console.error('closeModal function not available.');
        }
        showPage('my-bookings'); // Navigate to my bookings
    },

    /**
     * Handles energy request form submission.
     * @param {Event} event - The form submission event.
     */
    submitEnergyRequest: function(event) {
        event.preventDefault();
        const energyAmount = document.getElementById('energyAmount')?.value;
        const currentRange = document.getElementById('currentRange')?.value;
        const targetRange = document.getElementById('targetRange')?.value;
        const location = document.getElementById('energyLocation')?.value;
        const urgency = document.getElementById('energyUrgency')?.value;

        const newRequest = {
            id: 'ER' + (energyRequests.length + 1),
            requester: 'You (Driver)', // Mock current user
            location: location,
            amount: energyAmount,
            urgency: urgency,
            status: 'Active'
        };
        energyRequests.push(newRequest);
        if (typeof showModal === 'function') {
            alert('Energy request submitted! We will notify nearby providers. (This is a demo)');
        } else {
            console.error('showModal function not available.');
            alert('Energy request submitted! We will notify nearby providers. (This is a demo)');
        }

        // In a real app, send email to providers via sendEmail function
        if (typeof sendEmail === 'function') {
            sendEmail('g.gadzadze5@gmail.com', 'New Energy Request', `Driver needs ${energyAmount} kWh at ${location} with ${urgency} urgency.`);
        } else {
            console.warn('sendEmail function not available.');
        }


        // Reset form
        const energyRequestForm = document.getElementById('energyRequestForm');
        if (energyRequestForm) energyRequestForm.reset();
        if (typeof closeModal === 'function') {
            closeModal('energyRequestModal');
        } else {
            console.error('closeModal function not available.');
        }
        this.renderEnergyRequestsTable(); // Re-render table
    },

    /**
     * Renders the table of active energy requests.
     */
    renderEnergyRequestsTable: function() {
        const tableBody = document.querySelector('#energyRequestsTable tbody');
        if (!tableBody) {
            console.error('Energy requests table body not found.');
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows

        energyRequests.filter(req => req.status === 'Active').forEach(request => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = request.requester;
            row.insertCell().textContent = request.location;
            row.insertCell().textContent = `${request.amount} kWh`;
            row.insertCell().innerHTML = `<span class="status-${request.urgency.toLowerCase()}">${request.urgency}</span>`;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="button small primary" onclick="driver.offerHelp('${request.id}')">Offer Help</button>
            `;
        });
    },

    /**
     * Handles offering help for an energy request.
     * @param {string} requestId - The ID of the energy request.
     */
    offerHelp: function(requestId) {
        const request = energyRequests.find(req => req.id === requestId);
        if (request) {
            // Using a custom modal/message box instead of confirm
            if (typeof showModal === 'function') {
                // For now, using a simple alert as a fallback/demo
                alert(`You offered to help ${request.requester} with their ${request.amount} kWh energy request. (Demo: Notification sent)`);
            } else {
                console.error('showModal function not available.');
                alert(`You offered to help ${request.requester} with their ${request.amount} kWh energy request. (Demo: Notification sent)`);
            }
            // In a real app, update request status and notify requester
            request.status = 'Matched'; // Example status update
            this.renderEnergyRequestsTable(); // Re-render to reflect change
            if (typeof sendEmail === 'function') {
                sendEmail('g.gadzadze5@gmail.com', `Energy Offer for ${request.requester}`, `A driver has offered to help with your energy request at ${request.location}.`);
            } else {
                console.warn('sendEmail function not available.');
            }
        }
    },

    /**
     * Handles energy provider form submission.
     * @param {Event} event - The form submission event.
     */
    submitEnergyProvider: function(event) {
        event.preventDefault();
        const energyAmount = document.getElementById('providerEnergyAmount')?.value;
        const location = document.getElementById('providerLocation')?.value;
        const notes = document.getElementById('providerNotes')?.value;

        if (typeof showModal === 'function') {
            alert(`You are now offering ${energyAmount} kWh of energy at ${location}. (This is a demo)`);
        } else {
            console.error('showModal function not available.');
            alert(`You are now offering ${energyAmount} kWh of energy at ${location}. (This is a demo)`);
        }
        // In a real app, register this offer in a database
        if (typeof sendEmail === 'function') {
            sendEmail('g.gadzadze5@gmail.com', 'New Energy Offer', `Driver offering ${energyAmount} kWh at ${location}. Notes: ${notes}`);
        } else {
            console.warn('sendEmail function not available.');
        }


        // Reset form
        const energyProviderForm = document.getElementById('energyProviderForm');
        if (energyProviderForm) energyProviderForm.reset();
        if (typeof closeModal === 'function') {
            closeModal('energyProviderModal');
        } else {
            console.error('closeModal function not available.');
        }
    },

    /**
     * Filters and renders the 'My Bookings' table based on status.
     * @param {string} status - The booking status to filter by ('all', 'upcoming', 'completed', 'cancelled').
     */
    filterMyBookings: function(status) {
        const tableBody = document.querySelector('#myBookingsTable tbody');
        if (!tableBody) {
            console.error('My Bookings table body not found.');
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows

        const filtered = myBookings.filter(booking => {
            return status === 'all' || booking.status.toLowerCase() === status;
        });

        filtered.forEach(booking => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = booking.id;
            row.insertCell().textContent = booking.type;
            row.insertCell().textContent = booking.item;
            row.insertCell().textContent = booking.date;
            row.insertCell().textContent = booking.time;
            row.insertCell().innerHTML = `<span class="status-${booking.status.toLowerCase()}">${booking.status}</span>`;
            const actionsCell = row.insertCell();
            if (booking.status === 'Upcoming') {
                actionsCell.innerHTML = `<button class="button small secondary" onclick="driver.cancelBooking('${booking.id}')">Cancel</button>`;
            } else {
                actionsCell.textContent = 'N/A'; // No actions for completed/cancelled
            }
        });

        // Update active tab visual
        document.querySelectorAll('#my-bookings-page .tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`#my-bookings-page .tabs .tab[onclick*="filterMyBookings('${status}')"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    },

    /**
     * Searches the 'My Bookings' table based on user input.
     */
    searchMyBookings: function() {
        const input = document.querySelector('#my-bookings-page .search-bar');
        const table = document.getElementById('myBookingsTable');
        if (!input || !table) {
            console.warn('Search input or my bookings table not found for search operation.');
            return;
        }
        const filter = input.value.toLowerCase();
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) { // Skip header row (index 0)
            let found = false;
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // ID
                cells[2] && cells[2].textContent.toLowerCase().includes(filter) || // Item
                cells[5] && cells[5].textContent.toLowerCase().includes(filter)) { // Status
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Cancels a booking.
     * @param {string} bookingId - The ID of the booking to cancel.
     */
    cancelBooking: function(bookingId) {
        // Using a custom modal/message box instead of confirm
        const confirmCancel = confirm('Are you sure you want to cancel this booking?'); // Using native confirm for demo
        if (confirmCancel) {
            const bookingIndex = myBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex !== -1) {
                myBookings[bookingIndex].status = 'Cancelled';
                if (typeof showModal === 'function') {
                    alert('Booking cancelled successfully.');
                } else {
                    console.error('showModal function not available.');
                    alert('Booking cancelled successfully.');
                }
                this.filterMyBookings('upcoming'); // Re-render to show updated status
                if (typeof sendEmail === 'function') {
                    sendEmail('g.gadzadze5@gmail.com', 'Booking Cancellation', `Booking ${bookingId} has been cancelled by the driver.`);
                } else {
                    console.warn('sendEmail function not available.');
                }
            }
        }
    },

    /**
     * Shows the modal for adding a new vehicle.
     */
    showAddVehicleForm: function() {
        if (typeof showModal === 'function') {
            showModal('addVehicleModal');
        } else {
            console.error('showModal function not available.');
        }
    },

    /**
     * Handles adding a new vehicle.
     * @param {Event} event - The form submission event.
     */
    addVehicle: function(event) {
        event.preventDefault();
        const make = document.getElementById('newVehicleMake')?.value;
        const model = document.getElementById('newVehicleModel')?.value;
        const year = document.getElementById('newVehicleYear')?.value;
        const batteryCapacity = document.getElementById('newVehicleBattery')?.value;

        const newVehicle = {
            id: 'V' + (myVehicles.length + 1),
            make: make,
            model: model,
            year: parseInt(year),
            batteryCapacity: parseInt(batteryCapacity),
            currentRange: Math.floor(Math.random() * batteryCapacity * 5) + 50, // Mock current range
            status: 'Active'
        };
        myVehicles.push(newVehicle);
        if (typeof showModal === 'function') {
            alert('Vehicle added successfully!');
        } else {
            console.error('showModal function not available.');
            alert('Vehicle added successfully!');
        }
        if (typeof closeModal === 'function') {
            closeModal('addVehicleModal');
        } else {
            console.error('closeModal function not available.');
        }
        this.renderMyVehiclesTable(); // Re-render the vehicles table
        this.updateDashboardMetrics(); // Update dashboard metrics with new vehicle info
    },

    /**
     * Renders the list of my vehicles in the 'My Vehicles' table.
     */
    renderMyVehiclesTable: function() {
        const tableBody = document.querySelector('#myVehiclesTable tbody');
        if (!tableBody) {
            console.error('My Vehicles table body not found.');
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows

        myVehicles.forEach(vehicle => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = vehicle.make;
            row.insertCell().textContent = vehicle.model;
            row.insertCell().textContent = vehicle.year;
            row.insertCell().textContent = `${vehicle.batteryCapacity} kWh`;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="button small">Edit</button>
                <button class="button small secondary" onclick="driver.removeVehicle('${vehicle.id}')">Remove</button>
            `;
        });
    },

    /**
     * Searches the 'My Vehicles' table based on user input.
     */
    searchVehicles: function() {
        const input = document.querySelector('#my-vehicles-page .search-bar');
        const table = document.getElementById('myVehiclesTable');
        if (!input || !table) {
            console.warn('Search input or my vehicles table not found for search operation.');
            return;
        }
        const filter = input.value.toLowerCase();
        const tr = table.getElementsByTagName('tr');

        for (let i = 1; i < tr.length; i++) {
            let found = false;
            const cells = tr[i].getElementsByTagName('td');
            if (cells[0] && cells[0].textContent.toLowerCase().includes(filter) || // Make
                cells[1] && cells[1].textContent.toLowerCase().includes(filter) || // Model
                cells[2] && cells[2].textContent.toLowerCase().includes(filter)) { // Year
                found = true;
            }
            tr[i].style.display = found ? '' : 'none';
        }
    },

    /**
     * Removes a vehicle.
     * @param {string} vehicleId - The ID of the vehicle to remove.
     */
    removeVehicle: function(vehicleId) {
        const confirmRemove = confirm('Are you sure you want to remove this vehicle?'); // Using native confirm for demo
        if (confirmRemove) {
            myVehicles = myVehicles.filter(v => v.id !== vehicleId);
            if (typeof showModal === 'function') {
                alert('Vehicle removed successfully.');
            } else {
                console.error('showModal function not available.');
                alert('Vehicle removed successfully.');
            }
            this.renderMyVehiclesTable(); // Re-render the table
            this.updateDashboardMetrics(); // Update dashboard metrics
        }
    },

    /**
     * Handles saving of driver profile settings.
     * @param {Event} event - The form submission event.
     */
    saveProfileSettings: function(event) {
        event.preventDefault();
        const name = document.getElementById('profileName')?.value;
        const email = document.getElementById('profileEmail')?.value;
        console.log('Profile Settings Saved:', { name, email });
        if (typeof showModal === 'function') {
            alert('Profile settings saved!');
        } else {
            console.error('showModal function not available.');
            alert('Profile settings saved!');
        }
    },

    /**
     * Handles saving of notification preferences.
     * @param {Event} event - The form submission event.
     */
    saveNotificationSettings: function(event) {
        event.preventDefault();
        const emailNotifications = document.getElementById('emailNotifications')?.checked;
        const smsAlerts = document.getElementById('smsAlerts')?.checked;
        console.log('Notification Settings Saved:', { emailNotifications, smsAlerts });
        if (typeof showModal === 'function') {
            alert('Notification settings saved!');
        } else {
            console.error('showModal function not available.');
            alert('Notification settings saved!');
        }
    },

    /**
     * Handles saving of appearance settings.
     * @param {Event} event - The form submission event.
     */
    saveAppearanceSettings: function(event) {
        event.preventDefault();
        const darkMode = document.getElementById('darkMode')?.checked;
        console.log('Appearance Settings Saved:', { darkMode });
        if (typeof showModal === 'function') {
            alert('Appearance settings saved!');
        } else {
            console.error('showModal function not available.');
            alert('Appearance settings saved!');
        }
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
        const language = document.getElementById('language')?.value;
        const timezone = document.getElementById('timezone')?.value;
        console.log('Regional Settings Saved:', { language, timezone });
        if (typeof showModal === 'function') {
            alert('Regional settings saved!');
        } else {
            console.error('showModal function not available.');
            alert('Regional settings saved!');
        }
    },

    /**
     * Handles account deletion.
     */
    deleteAccount: function() {
        const confirmDelete = confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.'); // Using native confirm for demo
        if (confirmDelete) {
            console.log('Account deletion initiated.');
            if (typeof showModal === 'function') {
                alert('Your account has been marked for deletion. (Demo: Account would be deleted)');
            } else {
                console.error('showModal function not available.');
                alert('Your account has been marked for deletion. (Demo: Account would be deleted)');
            }
            if (typeof auth !== 'undefined' && typeof auth.logout === 'function') {
                auth.logout(); // Log out after deletion
            } else {
                console.warn('Auth object or logout function not available.');
            }
        }
    }
};

// --- Event Listeners and Initial Setup ---

document.addEventListener('DOMContentLoaded', () => {
    // Set initial page to dashboard
    showPage('dashboard');

    // Attach form submission listeners
    const serviceBookingForm = document.getElementById('serviceBookingForm');
    if (serviceBookingForm) {
        serviceBookingForm.addEventListener('submit', (e) => driver.submitServiceBooking(e));
        document.getElementById('serviceType')?.addEventListener('change', () => driver.updateServiceBookingOptions());
        document.getElementById('serviceDate')?.addEventListener('change', () => driver.updateServiceBookingOptions());
    }

    const chargerBookingForm = document.getElementById('chargerBookingForm');
    if (chargerBookingForm) {
        chargerBookingForm.addEventListener('submit', (e) => driver.submitChargerBooking(e));
        document.getElementById('chargerBookingDate')?.addEventListener('change', () => driver.showChargerBookingModal(
            document.getElementById('chargerBookingChargerId')?.value,
            document.getElementById('chargerBookingChargerName')?.textContent
        )); // Re-populate times on date change
    }

    const energyRequestForm = document.getElementById('energyRequestForm');
    if (energyRequestForm) {
        energyRequestForm.addEventListener('submit', (e) => driver.submitEnergyRequest(e));
    }

    const energyProviderForm = document.getElementById('energyProviderForm');
    if (energyProviderForm) {
        energyProviderForm.addEventListener('submit', (e) => driver.submitEnergyProvider(e));
    }

    const addVehicleForm = document.getElementById('addVehicleForm');
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', (e) => driver.addVehicle(e));
    }

    const profileSettingsForm = document.getElementById('profileSettingsForm');
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', (e) => driver.saveProfileSettings(e));
    }

    const notificationSettingsForm = document.getElementById('notificationSettingsForm');
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', (e) => driver.saveNotificationSettings(e));
    }

    const appearanceSettingsForm = document.getElementById('appearanceSettingsForm');
    if (appearanceSettingsForm) {
        appearanceSettingsForm.addEventListener('submit', (e) => driver.saveAppearanceSettings(e));
    }

    const regionalSettingsForm = document.getElementById('regionalSettingsForm');
    if (regionalSettingsForm) {
        regionalSettingsForm.addEventListener('submit', (e) => driver.saveRegionalSettings(e));
    }

    // Initial data rendering for tables and dashboard
    driver.updateDashboardMetrics();
    driver.renderChargersTable(); // For "Find Chargers" section
    driver.filterMyBookings('all'); // For "My Bookings" section
    driver.renderMyVehiclesTable(); // For "My Vehicles" section
    driver.renderEnergyRequestsTable(); // For "Energy Sharing" section
    driver.updateServiceBookingOptions(); // Initialize service booking options
});

// Expose functions to global scope for HTML inline event handlers
window.showPage = showPage;
window.toggleSidebar = toggleSidebar; // Assuming this is defined globally in main.js or admin.html
window.driver = driver;
// window.auth is assumed to be global from auth.js
