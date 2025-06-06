    /**
     * Map functionality using Leaflet for charger and energy sharing sections
     */

    /**
     * Sample charger data with booked slots
     */
    const chargerData = {
        "Downtown Charger": {
            bookedSlots: [
                { date: "2025-05-16", time: "09:00" },
                { date: "2025-05-16", time: "11:00" },
                { date: "2025-05-17", time: "14:00" }
            ],
            workingHours: { start: 8, end: 22 } // 8 AM to 10 PM
        },
        "Residential Charger": {
            bookedSlots: [
                { date: "2025-05-16", time: "10:00" },
                { date: "2025-05-17", time: "15:00" }
            ],
            workingHours: { start: 9, end: 18 } // 9 AM to 6 PM
        },
        "Fast Charger Hub": {
            bookedSlots: [
                { date: "2025-05-16", time: "12:00" },
                { date: "2025-05-17", time: "13:00" }
            ],
            workingHours: { start: 6, end: 23 } // 6 AM to 11 PM
        }
    };

    /**
     * Generate time slots for a given charger's working hours
     * @param {Object} workingHours - { start: number, end: number }
     * @returns {string[]} - Array of time slots (e.g., ["08:00", "08:30", ...])
     */
    function generateTimeSlots(workingHours) {
        const slots = [];
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }

    /**
     * Open the charger booking modal and populate it
     * @param {string} chargerName - Name of the charger
     */
    function openChargerBookingModal(chargerName) {
        showModal('chargerBookingModal');
        document.getElementById('chargerModalTitle').textContent = `Book ${chargerName}`;
        document.getElementById('chargerName').value = chargerName;

        // Populate booked times
        const bookedTimesContainer = document.getElementById('chargerBookedTimesContainer');
        const bookedTimesList = document.getElementById('chargerBookedTimesList');
        bookedTimesList.innerHTML = '';
        const bookedSlots = chargerData[chargerName]?.bookedSlots || [];

        if (bookedSlots.length > 0) {
            bookedTimesContainer.style.display = 'block';
            bookedSlots.forEach(slot => {
                const li = document.createElement('li');
                li.textContent = `${slot.date} at ${slot.time}`;
                bookedTimesList.appendChild(li);
            });
        } else {
            bookedTimesContainer.style.display = 'none';
        }

        // Populate time slots based on selected date
        const dateInput = document.getElementById('chargerBookingDate');
        const timeSelect = document.getElementById('chargerBookingTime');

        dateInput.addEventListener('change', () => {
            timeSelect.innerHTML = '<option value="">Select time</option>';
            const selectedDate = dateInput.value;
            const workingHours = chargerData[chargerName]?.workingHours || { start: 8, end: 22 };
            const allSlots = generateTimeSlots(workingHours);
            const bookedTimes = bookedSlots
                .filter(slot => slot.date === selectedDate)
                .map(slot => slot.time);

            allSlots.forEach(slot => {
                if (!bookedTimes.includes(slot)) {
                    const option = document.createElement('option');
                    option.value = slot;
                    option.textContent = slot;
                    timeSelect.appendChild(option);
                }
            });
        });

        // Trigger change event to populate times if date is already selected
        dateInput.dispatchEvent(new Event('change'));
    }

    /**
     * Initialize the charger map for the "Find Charger" section
     */
    function initChargerMap() {
        const map = L.map('map').setView([41.7151, 44.8271], 13); // Centered on Tbilisi, Georgia

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Sample charger locations
        const chargers = [
            {
                coords: [41.7151, 44.8271],
                title: "Downtown Charger",
                description: "Level 2 Charger, J1772, $1.5/kWh",
                available: true
            },
            {
                coords: [41.7050, 44.8170],
                title: "Residential Charger",
                description: "Level 1 Charger, Tesla, $1/kWh",
                available: false
            },
            {
                coords: [41.7252, 44.8372],
                title: "Fast Charger Hub",
                description: "DC Fast Charger, CCS, $2/kWh",
                available: true
            }
        ];

        // Add markers for chargers
        chargers.forEach(charger => {
            const marker = L.marker(charger.coords).addTo(map);
            marker.bindPopup(`
                <h3>${charger.title}</h3>
                <p>${charger.description}</p>
                <p><strong>Status:</strong> ${charger.available ? 'Available' : 'Occupied'}</p>
                <button onclick="openChargerBookingModal('${charger.title}')" class="button primary small">
                    <i class="fas fa-plug"></i> Book Charger
                </button>
            `);
        });

        // Add search form listener
        document.querySelector('.search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const location = document.getElementById('location').value;
            const chargerType = document.getElementById('charger-type').value;
            const connector = document.getElementById('connector').value;

            console.log('Search parameters:', { location, chargerType, connector });
            alert('Search functionality to be implemented! Filters applied.');
            // Future: Filter chargers based on input and update map
        });

        // Charger booking form submission
        document.getElementById('chargerBookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookingData = {
                charger: document.getElementById('chargerName').value,
                name: document.getElementById('chargerBookingName').value,
                email: document.getElementById('chargerBookingEmail').value,
                phone: document.getElementById('chargerBookingPhone').value,
                evModel: document.getElementById('chargerBookingEvModel').value,
                date: document.getElementById('chargerBookingDate').value,
                time: document.getElementById('chargerBookingTime').value,
                duration: document.getElementById('chargerBookingDuration').value,
                notes: document.getElementById('chargerBookingNotes').value
            };

            // Simulate adding to booked slots (in a real app, this would be stored in a database)
            if (chargerData[bookingData.charger]) {
                chargerData[bookingData.charger].bookedSlots.push({
                    date: bookingData.date,
                    time: bookingData.time
                });
            }

            console.log('Charger booking:', bookingData);
            await sendEmail(
                'g.gadzadze5@gmail.com',
                'New Charger Booking',
                `New charger booking:\n\n` +
                `Charger: ${bookingData.charger}\n` +
                `Name: ${bookingData.name}\n` +
                `Email: ${bookingData.email}\n` +
                `Phone: ${bookingData.phone}\n` +
                `EV Model: ${bookingData.evModel}\n` +
                `Date: ${bookingData.date}\n` +
                `Time: ${bookingData.time}\n` +
                `Duration: ${bookingData.duration} hours\n` +
                `Notes: ${bookingData.notes || 'None'}`
            );
            alert(`Charger ${bookingData.charger} booked successfully! (This is a demo)`);
            closeModal('chargerBookingModal');
        });
    }

    /**
     * Initialize the energy sharing map for the "Energy Sharing" section
     */
    function initEnergyMap() {
        const energyMap = L.map('energyMap').setView([41.7151, 44.8271], 13); // Centered on Tbilisi, Georgia

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(energyMap);

        // Sample energy donors
        const donors = [
            {
                coords: [41.7100, 44.8200],
                title: "Energy Donor 1",
                description: "Tesla Model 3, 20 kWh available, $1.2/kWh",
                connector: "Tesla"
            },
            {
                coords: [41.7200, 44.8300],
                title: "Energy Donor 2",
                description: "BMW i4, 15 kWh available, $1.5/kWh",
                connector: "CCS"
            }
        ];

        // Add markers for energy donors
        donors.forEach(donor => {
            const marker = L.marker(donor.coords).addTo(energyMap);
            marker.bindPopup(`
                <h3>${donor.title}</h3>
                <p>${donor.description}</p>
                <p><strong>Connector:</strong> ${donor.connector}</p>
                <button onclick="showEnergyModal()" class="button primary small">
                    <i class="fas fa-bolt"></i> Request Energy
                </button>
            `);
        });

        // Refresh button listener
        document.querySelector('.energy-map-container .button').addEventListener('click', () => {
            console.log('Refreshing energy donors...');
            alert('Map refresh functionality to be implemented!');
            // Future: Refresh donor markers
        });
    }

    // Initialize maps when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('map')) {
            initChargerMap();
        }
        if (document.getElementById('energyMap')) {
            initEnergyMap();
        }
    });

    // Reuse auth.js functions for modal control and email
    /**
     * Show a specific modal (from auth.js)
     * @param {string} modalId - ID of the modal to show
     */
    function showModal(modalId) {
        closeAllModals();
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close a specific modal (from auth.js)
     * @param {string} modalId - ID of the modal to close
     */
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * Close all modals (from auth.js)
     */
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    /**
     * Send email via server (from auth.js)
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} text - Plain text content
     * @param {string} [html] - HTML content (optional)
     * @returns {Promise<boolean>} - Success status
     */
    async function sendEmail(to, subject, text, html) {
        try {
            const response = await fetch('http://localhost:3001/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, subject, text, html }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send email');
            console.log('Email sent successfully');
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            return false;
        }
    }

    