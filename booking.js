/**
 * Service booking functionality
 */

/**
 * Service data with providers, duration, booked slots, prices, and working hours
 */
const serviceData = {
    "Battery Health Check": {
        providers: ["Tesla Service Georgia", "Tegeta Motors"],
        duration: 60,
        price: 150,
        bookedSlots: [
            { date: "2025-06-07", time: "09:00" },
            { date: "2025-06-07", time: "11:00" },
            { date: "2025-06-08", time: "14:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Software Update": {
        providers: ["Tesla Service Georgia"],
        duration: 30,
        price: 80,
        bookedSlots: [
            { date: "2025-06-07", time: "10:00" },
            { date: "2025-06-08", time: "15:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Tire Rotation & Alignment": {
        providers: ["Tegeta Motors"],
        duration: 45,
        price: 120,
        bookedSlots: [
            { date: "2025-06-07", time: "08:30" },
            { date: "2025-06-07", time: "13:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Brake System Service": {
        providers: ["Tesla Service Georgia", "Tegeta Motors"],
        duration: 60,
        price: 200,
        bookedSlots: [
            { date: "2025-06-07", time: "09:30" },
            { date: "2025-06-08", time: "11:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Charging Port Inspection": {
        providers: ["Tesla Service Georgia"],
        duration: 30,
        price: 90,
        bookedSlots: [
            { date: "2025-06-07", time: "10:30" },
            { date: "2025-06-08", time: "16:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Annual Maintenance Package": {
        providers: ["Tegeta Motors"],
        duration: 120,
        price: 350,
        bookedSlots: [
            { date: "2025-06-07", time: "08:00" },
            { date: "2025-06-08", time: "13:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    }
};

/**
 * Open service booking modal and populate fields
 * @param {string} serviceName - Name of the service to book
 */
function openServiceModal(serviceName) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('serviceModalTitle');
    const serviceInput = document.getElementById('bookingService');
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('bookingTime');
    const bookedTimesContainer = document.getElementById('bookedTimesContainer');
    const bookedTimesList = document.getElementById('bookedTimesList');
    const priceDisplay = document.getElementById('bookingPrice');
    const providerSelect = document.getElementById('bookingProvider');

    // Set modal title and service input
    title.textContent = `Book ${serviceName}`;
    serviceInput.value = serviceName;

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.value = tomorrow.toISOString().split('T')[0]; // Set default to tomorrow

    // Populate booked times
    const service = serviceData[serviceName];
    const bookedSlots = service.bookedSlots.filter(slot => slot.date === dateInput.value);
    if (bookedSlots.length > 0) {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = bookedSlots.map(slot => `<li>${slot.date} at ${slot.time}</li>`).join('');
    } else {
        bookedTimesContainer.style.display = 'none';
    }

    // Set price
    priceDisplay.textContent = `${service.price} GEL`;

    // Populate providers if multiple options
    providerSelect.innerHTML = '';
    service.providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider;
        option.textContent = provider;
        providerSelect.appendChild(option);
    });

    // Generate available time slots
    generateTimeSlots(service, dateInput.value);

    // Show modal using global showModal if available
    if (typeof showModal === 'function') {
        showModal('bookingModal');
    } else {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Generate available time slots for a given service and date
 * @param {Object} service - Service data
 * @param {string} selectedDate - Selected date in YYYY-MM-DD format
 */
function generateTimeSlots(service, selectedDate) {
    const timeSelect = document.getElementById('bookingTime');
    const { start, end, breakStart, breakEnd } = service.workingHours;
    const duration = service.duration;
    const bookedSlots = service.bookedSlots.filter(slot => slot.date === selectedDate);

    // Clear previous time options
    timeSelect.innerHTML = '<option value="">Select time</option>';

    // Generate time slots
    let currentTime = start * 60; // Convert to minutes
    const endTime = end * 60;
    const breakStartTime = breakStart * 60;
    const breakEndTime = breakEnd * 60;

    while (currentTime + duration <= endTime) {
        // Skip break time
        if (currentTime >= breakStartTime && currentTime < breakEndTime) {
            currentTime += 30;
            continue;
        }

        // Format time
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const displayTime = `${hours > 12 ? hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

        // Check if slot is booked
        const isBooked = bookedSlots.some(slot => slot.time === timeString);
        if (!isBooked) {
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = displayTime;
            timeSelect.appendChild(option);
        }

        currentTime += 30; // Increment by 30 minutes
    }
}

// Update time slots when date changes
document.getElementById('bookingDate').addEventListener('change', (e) => {
    const serviceName = document.getElementById('bookingService').value;
    const service = serviceData[serviceName];
    const bookedTimesContainer = document.getElementById('bookedTimesContainer');
    const bookedTimesList = document.getElementById('bookedTimesList');
    const bookedSlots = service.bookedSlots.filter(slot => slot.date === e.target.value);

    // Update booked times
    if (bookedSlots.length > 0) {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = bookedSlots.map(slot => `<li>${slot.date} at ${slot.time}</li>`).join('');
    } else {
        bookedTimesContainer.style.display = 'none';
    }

    // Regenerate time slots
    generateTimeSlots(service, e.target.value);
});

// Handle booking form submission
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        service: document.getElementById('bookingService').value,
        provider: document.getElementById('bookingProvider').value,
        name: document.getElementById('bookingName').value,
        email: document.getElementById('bookingEmail').value,
        phone: document.getElementById('bookingPhone').value,
        evModel: document.getElementById('bookingEvModel').value,
        date: document.getElementById('bookingDate').value,
        time: document.getElementById('bookingTime').value,
        cardNumber: document.getElementById('bookingPaymentCard').value,
        cardExpiry: document.getElementById('bookingCardExpiry').value,
        cardCvc: document.getElementById('bookingCardCvc').value,
        price: document.getElementById('bookingPrice').textContent,
        notes: document.getElementById('bookingNotes').value
    };

    console.log('Booking data:', formData);

    // Validate payment details
    if (!validatePayment(formData.cardNumber, formData.cardExpiry, formData.cardCvc)) {
        alert('Please enter valid payment details');
        return;
    }

    // Simulate sending email notification
    const emailContent = `
        New Service Booking:
        Service: ${formData.service}
        Provider: ${formData.provider}
        Name: ${formData.name}
        Email: ${formData.email}
        Phone: ${formData.phone}
        EV Model: ${formData.evModel}
        Date: ${formData.date}
        Time: ${formData.time}
        Price: ${formData.price}
        Notes: ${formData.notes || 'None'}
    `;
    
    // Assuming sendEmail is defined in auth.js or elsewhere
    const success = typeof sendEmail === 'function' ? await sendEmail(
        'info@tegetamotors.ge',
        'New Service Booking - Tegeta Motors',
        emailContent
    ) : true; // Fallback for demo

    if (success) {
        alert(`Booking confirmed for ${formData.service} on ${formData.date} at ${formData.time}. You will receive a confirmation email.`);
        if (typeof closeModal === 'function') {
            closeModal('bookingModal');
        } else {
            document.getElementById('bookingModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        alert('Failed to send booking confirmation. Please try again.');
    }
});

// Simple payment validation
function validatePayment(cardNumber, expiry, cvc) {
    // Basic validation - in a real app you'd use a payment processor library
    const cardRegex = /^[0-9]{16}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    const cvcRegex = /^[0-9]{3,4}$/;
    
    // Remove spaces from card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    return cardRegex.test(cleanCardNumber) && 
           expiryRegex.test(expiry) && 
           cvcRegex.test(cvc);
}

// Close modal
document.querySelector('#bookingModal .close-modal').addEventListener('click', () => {
    if (typeof closeModal === 'function') {
        closeModal('bookingModal');
    } else {
        document.getElementById('bookingModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal when clicking outside
document.getElementById('bookingModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('bookingModal')) {
        if (typeof closeModal === 'function') {
            closeModal('bookingModal');
        } else {
            document.getElementById('bookingModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
});











// Add this to your existing booking.js file
// Handle energy request form submission
document.getElementById('energyRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        energyAmount: document.getElementById('energyAmount').value,
        currentRange: document.getElementById('currentRange').value,
        targetRange: document.getElementById('targetRange').value,
        energyLocation: document.getElementById('energyLocation').value,
        energyUrgency: document.getElementById('energyUrgency').value,
        paymentMethod: document.getElementById('energyPaymentMethod').value,
        paymentCard: document.getElementById('energyPaymentCard').value,
        paymentExpiry: document.getElementById('energyPaymentExpiry').value,
        paymentCvv: document.getElementById('energyPaymentCvv').value
    };

    console.log('Energy Request data:', formData);

    // Simulate sending request
    const success = true; // For demo purposes
    
    if (success) {
        alert('Energy request submitted! You will receive matches shortly. (This is a demo)');
        if (typeof closeModal === 'function') {
            closeModal('energyRequestModal');
        } else {
            document.getElementById('energyRequestModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        alert('Failed to submit energy request. Please try again.');
    }
});

// Handle charger booking form submission
document.getElementById('chargerBookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        chargerName: document.getElementById('chargerName').value,
        name: document.getElementById('chargerBookingName').value,
        email: document.getElementById('chargerBookingEmail').value,
        phone: document.getElementById('chargerBookingPhone').value,
        evModel: document.getElementById('chargerBookingEvModel').value,
        date: document.getElementById('chargerBookingDate').value,
        time: document.getElementById('chargerBookingTime').value,
        duration: document.getElementById('chargerBookingDuration').value,
        notes: document.getElementById('chargerBookingNotes').value,
        paymentMethod: document.getElementById('chargerPaymentMethod').value,
        paymentCard: document.getElementById('chargerPaymentCard').value,
        paymentExpiry: document.getElementById('chargerPaymentExpiry').value,
        paymentCvv: document.getElementById('chargerPaymentCvv').value
    };

    console.log('Charger Booking data:', formData);

    // Simulate sending booking
    const success = true; // For demo purposes
    
    if (success) {
        alert('Charger booking confirmed! You will receive a confirmation. (This is a demo)');
        if (typeof closeModal === 'function') {
            closeModal('chargerBookingModal');
        } else {
            document.getElementById('chargerBookingModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        alert('Failed to confirm charger booking. Please try again.');
    }
});