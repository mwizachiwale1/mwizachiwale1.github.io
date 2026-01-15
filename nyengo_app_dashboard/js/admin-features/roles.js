/**
 * Roles Admin Feature Module
 */
class RolesFeature {
    constructor() {
        this.roles = [];
    }

    init() {
        this.setupEventListeners();
        this.loadRoles();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addRoleBtn');
        if (addBtn) addBtn.addEventListener('click', () => helpers.showModal('roleModal'));
    }

    async loadRoles() {
        try {
            this.roles = await apiService.get('/api/admin/roles');
            this.renderTable();
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('rolesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.roles.map(role => `
            <tr>
                <td>${role.name}</td>
                <td>${role.description}</td>
                <td>${role.permissions.length}</td>
                <td>
                    <button class="action-btn" onclick="rolesFeature.editRole(${role.id})">Edit</button>
                    <button class="action-btn danger" onclick="rolesFeature.deleteRole(${role.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    editRole(id) {
        helpers.showModal('roleModal');
    }

    async deleteRole(id) {
        if (!confirm('Delete this role?')) return;
        try {
            await apiService.delete(`/api/admin/roles/${id}`);
            helpers.showSuccess('Role deleted');
            this.loadRoles();
        } catch (error) {
            helpers.showError('Failed to delete role');
        }
    }
}

const rolesFeature = new RolesFeature();
