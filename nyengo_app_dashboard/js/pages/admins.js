/**
 * Admins Page Module (Super Admin Only)
 * Handles admin user management
 */
class AdminsPage {
    constructor() {
        this.admins = [];
        this.filteredAdmins = [];
        this.editingAdmin = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        this.setupEventListeners();
        this.loadAdmins();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addAdminBtn');
        const searchInput = document.getElementById('adminSearch');
        const roleFilter = document.getElementById('adminRoleFilter');
        const statusFilter = document.getElementById('adminStatusFilter');

        if (addBtn) addBtn.addEventListener('click', () => this.showAddAdminForm());
        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterAdmins(), 300));
        if (roleFilter) roleFilter.addEventListener('change', () => this.filterAdmins());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterAdmins());

        // Form submission
        const adminForm = document.getElementById('adminForm');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAdmin();
            });
        }
    }

    async loadAdmins() {
        try {
            this.admins = await apiService.get('/api/admin/admins');
            this.filterAdmins();
        } catch (error) {
            console.error('Error loading admins:', error);
            helpers.showError('Failed to load admin users');
        }
    }

    filterAdmins() {
        const search = document.getElementById('adminSearch')?.value.toLowerCase() || '';
        const role = document.getElementById('adminRoleFilter')?.value || '';
        const status = document.getElementById('adminStatusFilter')?.value || '';

        this.filteredAdmins = this.admins.filter(admin => {
            const matchesSearch = !search ||
                admin.firstName.toLowerCase().includes(search) ||
                admin.lastName.toLowerCase().includes(search) ||
                admin.email.toLowerCase().includes(search);

            const matchesRole = !role || admin.role === role;
            const matchesStatus = !status || admin.status === status;

            return matchesSearch && matchesRole && matchesStatus;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    renderTable() {
        const tbody = document.getElementById('adminsTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredAdmins.slice(start, end);

        tbody.innerHTML = pageData.map(admin => `
            <tr>
                <td>${admin.firstName} ${admin.lastName}</td>
                <td>${admin.email}</td>
                <td>${admin.phone || 'N/A'}</td>
                <td><span class="badge role-${admin.role.toLowerCase()}">${this.formatRole(admin.role)}</span></td>
                <td><span class="badge status-${admin.status.toLowerCase()}">${admin.status}</span></td>
                <td>${helpers.formatDate(admin.createdDate)}</td>
                <td>
                    <button class="action-btn" onclick="adminsPage.editAdmin(${admin.id})">Edit</button>
                    <button class="action-btn danger" onclick="adminsPage.deleteAdmin(${admin.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No admin users found</td></tr>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredAdmins.length / this.itemsPerPage);
        const pagination = document.getElementById('adminPagination');
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
                    onclick="adminsPage.goToPage(${i})"
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showAddAdminForm() {
        this.editingAdmin = null;
        this.resetAdminForm();
        document.getElementById('adminModalTitle').textContent = 'Add New Admin';
        helpers.showModal('adminModal');
    }

    editAdmin(id) {
        this.editingAdmin = this.admins.find(a => a.id === id);
        if (!this.editingAdmin) return;

        document.getElementById('adminFirstName').value = this.editingAdmin.firstName;
        document.getElementById('adminLastName').value = this.editingAdmin.lastName;
        document.getElementById('adminEmail').value = this.editingAdmin.email;
        document.getElementById('adminPhone').value = this.editingAdmin.phone || '';
        document.getElementById('adminRole').value = this.editingAdmin.role;
        document.getElementById('adminStatus').value = this.editingAdmin.status;

        document.getElementById('adminModalTitle').textContent = 'Edit Admin';
        document.getElementById('adminPasswordGroup').style.display = 'none';

        helpers.showModal('adminModal');
    }

    async saveAdmin() {
        const adminData = {
            firstName: document.getElementById('adminFirstName').value,
            lastName: document.getElementById('adminLastName').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value,
            role: document.getElementById('adminRole').value,
            status: document.getElementById('adminStatus').value
        };

        // Add password only for new admins
        if (!this.editingAdmin) {
            adminData.password = document.getElementById('adminPassword').value;
            
            if (!adminData.password) {
                helpers.showError('Password is required for new admins');
                return;
            }
        }

        // Validate
        if (!adminData.firstName || !adminData.lastName || !adminData.email || !adminData.role) {
            helpers.showError('Please fill in all required fields');
            return;
        }

        try {
            const endpoint = this.editingAdmin
                ? `/api/admin/admins/${this.editingAdmin.id}`
                : '/api/admin/admins';

            const method = this.editingAdmin ? 'PUT' : 'POST';

            await apiService[method.toLowerCase()](endpoint, adminData);
            helpers.showSuccess(this.editingAdmin ? 'Admin updated' : 'Admin created');

            helpers.closeModal('adminModal');
            this.loadAdmins();
        } catch (error) {
            console.error('Error saving admin:', error);
            helpers.showError('Failed to save admin');
        }
    }

    async deleteAdmin(id) {
        if (!confirm('Are you sure you want to delete this admin user?')) return;

        try {
            await apiService.delete(`/api/admin/admins/${id}`);
            helpers.showSuccess('Admin deleted');
            this.loadAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
            helpers.showError('Failed to delete admin');
        }
    }

    formatRole(role) {
        return role.replace(/_/g, ' ').toUpperCase();
    }

    resetAdminForm() {
        document.getElementById('adminFirstName').value = '';
        document.getElementById('adminLastName').value = '';
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPhone').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminRole').value = 'admin';
        document.getElementById('adminStatus').value = 'active';
        document.getElementById('adminPasswordGroup').style.display = 'block';
    }
}

const adminsPage = new AdminsPage();
