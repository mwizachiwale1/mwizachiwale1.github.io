/**
 * Categories Admin Feature Module
 * Handles product category management
 */
class CategoriesFeature {
    constructor() {
        this.categories = [];
        this.filteredCategories = [];
        this.editingCategory = null;
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addCategoryBtn');
        const searchInput = document.getElementById('categorySearch');

        if (addBtn) addBtn.addEventListener('click', () => this.showAddCategoryForm());
        if (searchInput) searchInput.addEventListener('input', helpers.debounce(() => this.filterCategories(), 300));

        const saveBtn = document.getElementById('saveCategoryBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCategory());
    }

    async loadCategories() {
        try {
            this.categories = await apiService.get('/api/admin/categories');
            this.filterCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            helpers.showError('Failed to load categories');
        }
    }

    filterCategories() {
        const search = document.getElementById('categorySearch')?.value.toLowerCase() || '';

        this.filteredCategories = this.categories.filter(cat =>
            !search || cat.name.toLowerCase().includes(search) || cat.description.toLowerCase().includes(search)
        );

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredCategories.map(cat => `
            <tr>
                <td>${cat.name}</td>
                <td>${cat.description}</td>
                <td>${cat.productCount}</td>
                <td>
                    <button class="action-btn" onclick="categoriesFeature.editCategory(${cat.id})">Edit</button>
                    <button class="action-btn danger" onclick="categoriesFeature.deleteCategory(${cat.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        if (this.filteredCategories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No categories found</td></tr>';
        }
    }

    showAddCategoryForm() {
        this.editingCategory = null;
        this.resetCategoryForm();
        helpers.showModal('categoryModal');
    }

    editCategory(id) {
        this.editingCategory = this.categories.find(c => c.id === id);
        if (!this.editingCategory) return;

        document.getElementById('categoryName').value = this.editingCategory.name;
        document.getElementById('categoryDescription').value = this.editingCategory.description;

        helpers.showModal('categoryModal');
    }

    async saveCategory() {
        const categoryData = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value
        };

        if (!categoryData.name) {
            helpers.showError('Category name is required');
            return;
        }

        try {
            const endpoint = this.editingCategory
                ? `/api/admin/categories/${this.editingCategory.id}`
                : '/api/admin/categories';

            const method = this.editingCategory ? 'PUT' : 'POST';

            await apiService[method.toLowerCase()](endpoint, categoryData);
            helpers.showSuccess(this.editingCategory ? 'Category updated' : 'Category created');

            helpers.closeModal('categoryModal');
            this.loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            helpers.showError('Failed to save category');
        }
    }

    async deleteCategory(id) {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await apiService.delete(`/api/admin/categories/${id}`);
            helpers.showSuccess('Category deleted');
            this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            helpers.showError('Failed to delete category');
        }
    }

    resetCategoryForm() {
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryDescription').value = '';
    }
}

const categoriesFeature = new CategoriesFeature();
