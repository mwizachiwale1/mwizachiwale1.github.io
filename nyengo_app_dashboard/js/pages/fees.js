/**
 * Fees Page Module (Super Admin Only)
 * Handles service fee configuration and management
 */
class FeesPage {
    constructor() {
        this.fees = [];
        this.editingFee = null;
    }

    init() {
        this.setupEventListeners();
        this.loadFees();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addFeeBtn');
        const saveBtn = document.getElementById('saveFeeBtn');
        const cancelBtn = document.getElementById('cancelFeeBtn');

        if (addBtn) addBtn.addEventListener('click', () => this.showAddFeeForm());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveFee());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    async loadFees() {
        try {
            this.fees = await apiService.get('/api/admin/fees');
            this.renderTable();
        } catch (error) {
            console.error('Error loading fees:', error);
            helpers.showError('Failed to load fees');
        }
    }

    renderTable() {
        const tbody = document.getElementById('feesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.fees.map(fee => `
            <tr>
                <td>${fee.feeType}</td>
                <td>${fee.description}</td>
                <td>${fee.percentage}%</td>
                <td>${helpers.formatCurrency(fee.minAmount)}</td>
                <td>${helpers.formatCurrency(fee.maxAmount)}</td>
                <td><span class="badge ${fee.active ? 'success' : 'danger'}">${fee.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="action-btn" onclick="feesPage.editFee(${fee.id})">Edit</button>
                    <button class="action-btn danger" onclick="feesPage.deleteFee(${fee.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        if (this.fees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No fees configured</td></tr>';
        }
    }

    showAddFeeForm() {
        this.editingFee = null;
        this.resetFeeForm();
        helpers.showModal('feeModal');
    }

    editFee(id) {
        this.editingFee = this.fees.find(f => f.id === id);
        if (!this.editingFee) return;

        document.getElementById('feeType').value = this.editingFee.feeType;
        document.getElementById('feeDescription').value = this.editingFee.description;
        document.getElementById('feePercentage').value = this.editingFee.percentage;
        document.getElementById('feeMinAmount').value = this.editingFee.minAmount;
        document.getElementById('feeMaxAmount').value = this.editingFee.maxAmount;
        document.getElementById('feeActive').checked = this.editingFee.active;

        helpers.showModal('feeModal');
    }

    async saveFee() {
        const feeData = {
            feeType: document.getElementById('feeType').value,
            description: document.getElementById('feeDescription').value,
            percentage: parseFloat(document.getElementById('feePercentage').value),
            minAmount: parseFloat(document.getElementById('feeMinAmount').value),
            maxAmount: parseFloat(document.getElementById('feeMaxAmount').value),
            active: document.getElementById('feeActive').checked
        };

        // Validate
        if (!feeData.feeType || feeData.percentage === null) {
            helpers.showError('Please fill in all required fields');
            return;
        }

        try {
            const endpoint = this.editingFee 
                ? `/api/admin/fees/${this.editingFee.id}`
                : '/api/admin/fees';
            
            const method = this.editingFee ? 'PUT' : 'POST';
            
            await apiService[method.toLowerCase()](endpoint, feeData);
            helpers.showSuccess(this.editingFee ? 'Fee updated' : 'Fee created');
            
            helpers.closeModal('feeModal');
            this.loadFees();
        } catch (error) {
            console.error('Error saving fee:', error);
            helpers.showError('Failed to save fee');
        }
    }

    async deleteFee(id) {
        if (!confirm('Are you sure you want to delete this fee?')) return;

        try {
            await apiService.delete(`/api/admin/fees/${id}`);
            helpers.showSuccess('Fee deleted');
            this.loadFees();
        } catch (error) {
            console.error('Error deleting fee:', error);
            helpers.showError('Failed to delete fee');
        }
    }

    resetFeeForm() {
        document.getElementById('feeType').value = '';
        document.getElementById('feeDescription').value = '';
        document.getElementById('feePercentage').value = '';
        document.getElementById('feeMinAmount').value = '';
        document.getElementById('feeMaxAmount').value = '';
        document.getElementById('feeActive').checked = true;
    }

    cancelEdit() {
        this.editingFee = null;
        this.resetFeeForm();
        helpers.closeModal('feeModal');
    }
}

const feesPage = new FeesPage();
