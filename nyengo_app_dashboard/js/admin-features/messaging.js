/**
 * Messaging Admin Feature Module
 */
class MessagingFeature {
    constructor() {
        this.messages = [];
    }

    init() {
        this.setupEventListeners();
        this.loadMessages();
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
    }

    async loadMessages() {
        try {
            this.messages = await apiService.get('/api/admin/messages');
            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages() {
        const tbody = document.getElementById('messagesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.messages.map(msg => `
            <tr>
                <td>${msg.sender}</td>
                <td>${msg.recipient}</td>
                <td>${helpers.truncateText(msg.content, 50)}</td>
                <td>${helpers.formatDate(msg.sentDate)}</td>
                <td><span class="badge ${msg.read ? 'muted' : 'primary'}">${msg.read ? 'Read' : 'Unread'}</span></td>
            </tr>
        `).join('');
    }

    async sendMessage() {
        const sender = document.getElementById('messageSender').value;
        const recipient = document.getElementById('messageRecipient').value;
        const content = document.getElementById('messageContent').value;

        if (!sender || !recipient || !content) {
            helpers.showError('Please fill in all fields');
            return;
        }

        try {
            await apiService.post('/api/admin/messages/send', { sender, recipient, content });
            helpers.showSuccess('Message sent');
            this.loadMessages();
        } catch (error) {
            helpers.showError('Failed to send message');
        }
    }
}

const messagingFeature = new MessagingFeature();
