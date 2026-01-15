/**
 * Notifications Admin Feature Module
 */
class NotificationsFeature {
    constructor() {
        this.notifications = [];
    }

    init() {
        this.setupEventListeners();
        this.loadNotifications();
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('sendNotificationBtn');
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendNotification());
    }

    async loadNotifications() {
        try {
            this.notifications = await apiService.get('/api/admin/notifications');
            this.renderTable();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('notificationsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.notifications.map(notif => `
            <tr>
                <td>${notif.recipient}</td>
                <td>${notif.title}</td>
                <td>${helpers.truncateText(notif.message, 50)}</td>
                <td><span class="badge ${notif.read ? 'muted' : 'primary'}">${notif.read ? 'Read' : 'Unread'}</span></td>
                <td>${helpers.formatDate(notif.sentDate)}</td>
            </tr>
        `).join('');
    }

    async sendNotification() {
        const recipient = document.getElementById('notificationRecipient').value;
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;

        if (!recipient || !title || !message) {
            helpers.showError('Please fill in all fields');
            return;
        }

        try {
            await apiService.post('/api/admin/notifications/send', { recipient, title, message });
            helpers.showSuccess('Notification sent');
            this.loadNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            helpers.showError('Failed to send notification');
        }
    }
}

const notificationsFeature = new NotificationsFeature();
