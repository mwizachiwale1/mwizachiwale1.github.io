// Data loader utility for Nyengo Dashboard
class DataLoader {
    constructor() {
        this.cache = {};
    }

    // Load JSON data from file
    async loadJSON(filepath) {
        if (this.cache[filepath]) {
            return this.cache[filepath];
        }

        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache[filepath] = data;
            return data;
        } catch (error) {
            console.error(`Error loading ${filepath}:`, error);
            throw error;
        }
    }

    // Load credentials
    async loadCredentials() {
        return await this.loadJSON('data/credentials.json');
    }

    // Load dummy data
    async loadDummyData() {
        return await this.loadJSON('data/dummy-data.json');
    }

    // Authenticate user
    async authenticateUser(email, password) {
        try {
            const credentials = await this.loadCredentials();
            const user = credentials.admins.find(u => 
                u.email === email && u.password === password
            );
            return user || null;
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    // Clear cache (for development/testing)
    clearCache() {
        this.cache = {};
    }
}

// Export for use in main.js
window.DataLoader = DataLoader;
