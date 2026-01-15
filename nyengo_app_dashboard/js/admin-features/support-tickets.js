/**
 * Support Tickets Admin Feature Module
 * Handles support ticket management
 */
class SupportTicketsFeature {
    constructor() {
        this.tickets = [];
        this.filteredTickets = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        this.setupEventListeners();
        this.loadTickets();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('ticketSearch');
        const statusFilter = document.getElementById('ticketStatusFilter');
        const priorityFilter = document.getElementById('ticketPriorityFilter');

        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterTickets(), 300));
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterTickets());
        if (priorityFilter) priorityFilter.addEventListener('change', () => this.filterTickets());
    }

    async loadTickets() {
        try {
            this.tickets = await apiService.get('/api/admin/support-tickets');
            this.filterTickets();
        } catch (error) {
            console.error('Error loading tickets:', error);
            helpers.showError('Failed to load support tickets');
        }
    }

    filterTickets() {
        const search = document.getElementById('ticketSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('ticketStatusFilter')?.value || '';
        const priority = document.getElementById('ticketPriorityFilter')?.value || '';

        this.filteredTickets = this.tickets.filter(ticket => {
            const matchesSearch = !search ||
                ticket.id.toLowerCase().includes(search) ||
                ticket.subject.toLowerCase().includes(search);

            const matchesStatus = !status || ticket.status === status;
            const matchesPriority = !priority || ticket.priority === priority;

            return matchesSearch && matchesStatus && matchesPriority;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    renderTable() {
        const tbody = document.getElementById('ticketsTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredTickets.slice(start, end);

        tbody.innerHTML = pageData.map(ticket => `
            <tr>
                <td>${ticket.id}</td>
                <td>${ticket.subject}</td>
                <td>${ticket.user}</td>
                <td><span class="badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
                <td><span class="badge status-${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                <td>${helpers.formatDate(ticket.createdDate)}</td>
                <td>
                    <button class="action-btn" onclick="supportTicketsFeature.viewTicket('${ticket.id}')">View</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No tickets found</td></tr>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredTickets.length / this.itemsPerPage);
        const pagination = document.getElementById('ticketPagination');
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button 
                    ${i === this.currentPage ? 'class="active"' : ''} 
                    onclick="supportTicketsFeature.goToPage(${i})"
                >
                    ${i}
                </button>
            `;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    viewTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (ticket) {
            console.log('Viewing ticket:', ticket);
            helpers.showModal('detailModal');
        }
    }
}

const supportTicketsFeature = new SupportTicketsFeature();
