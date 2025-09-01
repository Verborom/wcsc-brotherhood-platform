// Enhanced scripture system with AI analysis and original language support
// This integrates with the Spiritual Flywheel workflow

class SupabaseScripture {
    constructor() {
        this.packages = [];
        this.currentPackage = null;
        this.analysisTypes = ['hebrew', 'greek', 'aramaic'];
        this.init();
    }

    async init() {
        await this.loadScripturePackages();
        this.setupEventListeners();
        this.render();
        this.checkForGenerationRequest();
    }

    async loadScripturePackages() {
        try {
            const userProfile = await SupabaseAPI.getCurrentUserProfile();
            const filters = userProfile ? { chapter: userProfile.chapter } : {};
            
            this.packages = await SupabaseAPI.getScripturePackages(filters);
            console.log('Scripture packages loaded:', this.packages.length);
        } catch (error) {
            console.error('Error loading scripture packages:', error);
            this.showError('Failed to load scripture packages');
        }
    }

    setupEventListeners() {
        // Package selection
        const packageSelect = document.getElementById('package-select');
        if (packageSelect) {
            packageSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadPackage(e.target.value);
                } else {
                    this.currentPackage = null;
                    this.renderPackageContent();
                }
            });
        }

        // Create package button (leaders only)
        const createPackageBtn = document.getElementById('create-package-btn');
        if (createPackageBtn) {
            createPackageBtn.addEventListener('click', () => this.showCreatePackageModal());
        }

        // Package form submission
        const packageForm = document.getElementById('scripture-package-form');
        if (packageForm) {
            packageForm.addEventListener('submit', (e) => this.handlePackageSubmission(e));
        }

        // AI Analysis buttons
        document.querySelectorAll('.analyze-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const analysisType = e.target.dataset.analysis;
                const passage = e.target.dataset.passage;
                this.performAIAnalysis(analysisType, passage);
            });
        });

        // Generate from meeting archive
        const generateBtn = document.getElementById('generate-from-meeting-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showMeetingSelectionModal());
        }
    }

    checkForGenerationRequest() {
        const urlParams = new URLSearchParams(window.location.search);
        const generateFromId = urlParams.get('generate_from');
        if (generateFromId) {
            this.generateFromMeeting(generateFromId);
        }
    }

    render() {
        this.renderPackagesList();
        this.renderPackageContent();
    }

    renderPackagesList() {
        const packageSelect = document.getElementById('package-select');
        if (!packageSelect) return;

        packageSelect.innerHTML = `
            <option value="">Select a Scripture Package...</option>
            ${this.packages.map(pkg => `
                <option value="${pkg.id}">
                    ${pkg.title} - ${new Date(pkg.week_date).toLocaleDateString()}
                </option>
            `).join('')}
        `;
    }

    async loadPackage(packageId) {
        try {
            this.currentPackage = this.packages.find(pkg => pkg.id === packageId);
            if (this.currentPackage) {
                // Increment view count
                await SupabaseAPI.updateScripturePackage(packageId, {
                    view_count: (this.currentPackage.view_count || 0) + 1
                });
                this.renderPackageContent();
            }
        } catch (error) {
            console.error('Error loading package:', error);
            this.showError('Failed to load scripture package');
        }
    }

    // Progress tracking methods
    async loadStudyProgress(packageId) {
        // Load from localStorage for now, could be database in future
        const progress = JSON.parse(localStorage.getItem(`progress_${packageId}`) || '{}');
        
        // Update checkboxes based on saved progress
        Object.entries(progress).forEach(([key, value]) => {
            const checkbox = document.querySelector(`input[onchange*="${key}"]`);
            if (checkbox) checkbox.checked = value;
        });
    }

    async updateProgress(packageId, progressType, completed) {
        const progress = JSON.parse(localStorage.getItem(`progress_${packageId}`) || '{}');
        progress[progressType] = completed;
        localStorage.setItem(`progress_${packageId}`, JSON.stringify(progress));
    }

    async saveReflection(packageId, questionIndex, reflection) {
        const reflections = JSON.parse(localStorage.getItem(`reflections_${packageId}`) || '{}');
        reflections[questionIndex] = reflection;
        localStorage.setItem(`reflections_${packageId}`, JSON.stringify(reflections));
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }
}

// Initialize scripture system when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    if (window.supabaseAuth) {
        setTimeout(async () => {
            if (window.supabaseAuth.isAuthenticated()) {
                window.scripture = new SupabaseScripture();
            }
        }, 1000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseScripture };
}