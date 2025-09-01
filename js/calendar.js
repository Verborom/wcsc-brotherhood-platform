// Enhanced calendar functionality with Supabase integration
// This replaces the mock calendar system with real database operations

class SupabaseCalendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.selectedDate = null;
        this.viewMode = 'month'; // month, week, day
        this.init();
    }

    async init() {
        await this.loadEvents();
        this.render();
        this.setupEventListeners();
    }

    async loadEvents() {
        try {
            // Get user's chapter for filtering
            const userProfile = await SupabaseAPI.getCurrentUserProfile();
            const filters = userProfile ? { chapter: userProfile.chapter } : {};
            
            this.events = await SupabaseAPI.getEvents(filters);
            console.log('Events loaded:', this.events.length);
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load calendar events');
        }
    }

    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('today-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateMonth(1));
        if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());

        // View mode toggles
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.viewMode = e.target.dataset.view;
                this.updateViewModeUI();
                this.render();
            });
        });

        // Add event button (leaders only)
        const addEventBtn = document.getElementById('add-event-btn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => this.showAddEventModal());
        }

        // Event form submission
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmission(e));
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.closeModals();
                }
            });
        });
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    }

    updateViewModeUI() {
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.viewMode);
        });
    }

    render() {
        this.updateHeader();
        
        switch (this.viewMode) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    updateHeader() {
        const monthYearElement = document.getElementById('current-month-year');
        if (monthYearElement) {
            const formatter = new Intl.DateTimeFormat('en-US', {
                month: 'long',
                year: 'numeric'
            });
            monthYearElement.textContent = formatter.format(this.currentDate);
        }
    }

    renderMonthView() {
        const calendar = document.getElementById('calendar-grid');
        if (!calendar) return;

        // Clear existing content
        calendar.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Render 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayCell = this.createDayCell(cellDate);
            calendar.appendChild(dayCell);
        }
    }

    createDayCell(date) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const today = new Date();
        const isToday = this.isSameDate(date, today);
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        const isSelected = this.selectedDate && this.isSameDate(date, this.selectedDate);
        
        if (isToday) dayCell.classList.add('today');
        if (!isCurrentMonth) dayCell.classList.add('other-month');
        if (isSelected) dayCell.classList.add('selected');

        // Day number
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayCell.appendChild(dayNumber);

        // Events for this day
        const dayEvents = this.getEventsForDate(date);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.slice(0, 3).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `event-item ${event.event_type}`;
                eventElement.textContent = event.title;
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEventDetails(event);
                });
                eventsContainer.appendChild(eventElement);
            });

            if (dayEvents.length > 3) {
                const moreEvents = document.createElement('div');
                moreEvents.className = 'more-events';
                moreEvents.textContent = `+${dayEvents.length - 3} more`;
                eventsContainer.appendChild(moreEvents);
            }

            dayCell.appendChild(eventsContainer);
        }

        // Click handler for day selection
        dayCell.addEventListener('click', () => {
            this.selectDate(date);
        });

        return dayCell;
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.start_date);
            return this.isSameDate(eventDate, date);
        });
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.render();
        
        // Show day events in sidebar
        this.showDayEvents(date);
    }

    showDayEvents(date) {
        const sidebar = document.getElementById('events-sidebar');
        if (!sidebar) return;

        const dayEvents = this.getEventsForDate(date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        sidebar.innerHTML = `
            <h3>Events for ${formattedDate}</h3>
            <div class="day-events-list">
                ${dayEvents.length > 0 
                    ? dayEvents.map(event => this.createEventListItem(event)).join('')
                    : '<p class="no-events">No events scheduled for this day.</p>'
                }
            </div>
            ${window.supabaseAuth?.isLeader() ? `
                <button class="btn btn-primary" onclick="window.calendar.showAddEventModal('${date.toISOString()}')">
                    <i class="icon-plus"></i> Add Event
                </button>
            ` : ''}
        `;
    }

    createEventListItem(event) {
        const eventDate = new Date(event.start_date);
        const timeString = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `
            <div class="event-list-item ${event.event_type}" onclick="window.calendar.showEventDetails('${event.id}')">
                <div class="event-time">${timeString}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-location">${event.location || ''}</div>
            </div>
        `;
    }

    async showAddEventModal(preselectedDate = null) {
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        
        // Pre-fill date if provided
        if (preselectedDate) {
            const date = new Date(preselectedDate);
            const dateInput = form.querySelector('#event-date');
            if (dateInput) {
                dateInput.value = date.toISOString().split('T')[0];
            }
        }

        // Show modal
        modal.style.display = 'flex';
    }

    async showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const modal = document.getElementById('event-details-modal');
        if (!modal) return;

        const eventDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : null;
        
        const modalContent = `
            <div class="event-details">
                <h2>${event.title}</h2>
                <div class="event-meta">
                    <div class="event-type ${event.event_type}">${event.event_type}</div>
                    <div class="event-date">
                        ${eventDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                    <div class="event-time">
                        ${eventDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}${endDate ? ` - ${endDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}` : ''}
                    </div>
                    ${event.location ? `<div class="event-location"><i class="icon-location"></i> ${event.location}</div>` : ''}
                </div>
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                
                ${window.supabaseAuth?.isLeader() ? `
                    <div class="event-actions">
                        <button class="btn btn-secondary" onclick="window.calendar.editEvent('${event.id}')">
                            <i class="icon-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="window.calendar.deleteEvent('${event.id}')">
                            <i class="icon-delete"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        modal.querySelector('.modal-content').innerHTML = modalContent;
        modal.style.display = 'flex';
    }

    async handleEventSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            event_type: formData.get('event_type'),
            start_date: new Date(`${formData.get('date')}T${formData.get('time')}`).toISOString(),
            location: formData.get('location'),
            chapter: (await SupabaseAPI.getCurrentUserProfile()).chapter
        };

        // Add end time if provided
        if (formData.get('end_time')) {
            eventData.end_date = new Date(`${formData.get('date')}T${formData.get('end_time')}`).toISOString();
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Creating event...');

        try {
            await SupabaseAPI.createEvent(eventData);
            await this.loadEvents();
            this.render();
            this.closeModals();
            this.showSuccess('Event created successfully!');
        } catch (error) {
            console.error('Error creating event:', error);
            this.showError('Failed to create event. Please try again.');
        } finally {
            this.hideLoading(submitBtn, 'Create Event');
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await SupabaseAPI.deleteEvent(eventId);
            await this.loadEvents();
            this.render();
            this.closeModals();
            this.showSuccess('Event deleted successfully!');
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showError('Failed to delete event. Please try again.');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showLoading(button, text) {
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span> ${text}`;
    }

    hideLoading(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    // Weekly and daily view rendering methods
    renderWeekView() {
        // Implementation for week view
        const calendar = document.getElementById('calendar-grid');
        if (!calendar) return;
        
        calendar.innerHTML = '<div class="week-view">Week view coming soon...</div>';
    }

    renderDayView() {
        // Implementation for day view
        const calendar = document.getElementById('calendar-grid');
        if (!calendar) return;
        
        calendar.innerHTML = '<div class="day-view">Day view coming soon...</div>';
    }
}

// Initialize calendar when DOM is loaded and auth is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for auth to be ready
    if (window.supabaseAuth) {
        // Wait a bit for auth to initialize
        setTimeout(async () => {
            if (window.supabaseAuth.isAuthenticated()) {
                window.calendar = new SupabaseCalendar();
            } else {
                console.log('User not authenticated, redirecting...');
            }
        }, 1000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseCalendar };
}