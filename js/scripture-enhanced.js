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

    renderPackageContent() {
        const container = document.getElementById('package-content');
        if (!container) return;

        if (!this.currentPackage) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📖</div>
                    <h3>Select a Scripture Package</h3>
                    <p>Choose a package from the dropdown above to begin your study.</p>
                    ${window.supabaseAuth?.isLeader() ? `
                        <button class="btn btn-primary" onclick="window.scripture.showCreatePackageModal()">
                            <i class="icon-plus"></i> Create New Package
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        const pkg = this.currentPackage;
        const weekDate = new Date(pkg.week_date);
        
        container.innerHTML = `
            <div class="scripture-package">
                <!-- Package Header -->
                <div class="package-header">
                    <div class="package-meta">
                        <h1 class="package-title">${pkg.title}</h1>
                        <div class="package-info">
                            <span class="package-date">Week of ${weekDate.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}</span>
                            ${pkg.theme ? `<span class="package-theme">${pkg.theme}</span>` : ''}
                            <span class="view-count">${pkg.view_count || 0} views</span>
                        </div>
                    </div>
                    ${window.supabaseAuth?.isLeader() ? `
                        <div class="package-actions">
                            <button class="btn btn-secondary" onclick="window.scripture.editPackage('${pkg.id}')">
                                <i class="icon-edit"></i> Edit
                            </button>
                        </div>
                    ` : ''}
                </div>

                <!-- Primary Passages -->
                <section class="primary-passages">
                    <h2><i class="icon-book"></i> Primary Scripture Passages</h2>
                    <div class="passages-container">
                        ${this.renderPassages(pkg.primary_passages)}
                    </div>
                </section>

                <!-- Language Analysis Sections -->
                ${this.renderLanguageAnalysis('Hebrew', pkg.hebrew_analysis)}
                ${this.renderLanguageAnalysis('Greek', pkg.greek_analysis)}
                ${this.renderLanguageAnalysis('Aramaic', pkg.aramaic_analysis)}

                <!-- Commentary -->
                ${pkg.commentary ? `
                    <section class="commentary-section">
                        <h2><i class="icon-comment"></i> Commentary & Insights</h2>
                        <div class="commentary-content">
                            ${this.formatText(pkg.commentary)}
                        </div>
                    </section>
                ` : ''}

                <!-- Reflection Questions -->
                ${pkg.reflection_questions && pkg.reflection_questions.length > 0 ? `
                    <section class="reflection-section">
                        <h2><i class="icon-question"></i> Reflection Questions</h2>
                        <div class="reflection-questions">
                            ${pkg.reflection_questions.map((question, index) => `
                                <div class="reflection-question">
                                    <h4>Question ${index + 1}</h4>
                                    <p>${question}</p>
                                    <div class="reflection-input">
                                        <textarea placeholder="Write your reflection here..." 
                                                rows="3" 
                                                onchange="window.scripture.saveReflection('${pkg.id}', ${index}, this.value)">
                                        </textarea>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                ` : ''}

                <!-- Prayer Focus -->
                ${pkg.prayer_focus ? `
                    <section class="prayer-section">
                        <h2><i class="icon-pray"></i> Prayer Focus</h2>
                        <div class="prayer-content">
                            ${this.formatText(pkg.prayer_focus)}
                        </div>
                        <div class="prayer-tracker">
                            <label class="checkbox-label">
                                <input type="checkbox" onchange="window.scripture.trackPrayer('${pkg.id}', this.checked)">
                                I have prayed about this focus area today
                            </label>
                        </div>
                    </section>
                ` : ''}

                <!-- Practical Application -->
                ${pkg.practical_application ? `
                    <section class="application-section">
                        <h2><i class="icon-action"></i> Practical Application</h2>
                        <div class="application-content">
                            ${this.formatText(pkg.practical_application)}
                        </div>
                        <div class="application-tracker">
                            <h4>Action Steps</h4>
                            <div class="action-steps">
                                <input type="text" placeholder="Add a personal action step..." 
                                       onkeypress="if(event.key==='Enter') window.scripture.addActionStep('${pkg.id}', this.value, this)">
                                <div class="action-steps-list" id="action-steps-${pkg.id}"></div>
                            </div>
                        </div>
                    </section>
                ` : ''}

                <!-- Study Progress -->
                <section class="progress-section">
                    <h2><i class="icon-progress"></i> Study Progress</h2>
                    <div class="progress-tracker">
                        <div class="progress-item">
                            <label class="checkbox-label">
                                <input type="checkbox" onchange="window.scripture.updateProgress('${pkg.id}', 'read_passages', this.checked)">
                                Read all primary passages
                            </label>
                        </div>
                        <div class="progress-item">
                            <label class="checkbox-label">
                                <input type="checkbox" onchange="window.scripture.updateProgress('${pkg.id}', 'reviewed_analysis', this.checked)">
                                Reviewed language analysis
                            </label>
                        </div>
                        <div class="progress-item">
                            <label class="checkbox-label">
                                <input type="checkbox" onchange="window.scripture.updateProgress('${pkg.id}', 'answered_questions', this.checked)">
                                Answered reflection questions
                            </label>
                        </div>
                        <div class="progress-item">
                            <label class="checkbox-label">
                                <input type="checkbox" onchange="window.scripture.updateProgress('${pkg.id}', 'prayed', this.checked)">
                                Spent time in prayer
                            </label>
                        </div>
                    </div>
                </section>

                ${pkg.based_on_meeting ? `
                    <section class="meeting-connection">
                        <h2><i class="icon-link"></i> Connected Meeting</h2>
                        <p>This scripture package was generated from insights in our meeting archive.</p>
                        <button class="btn btn-secondary" onclick="window.location.href='/archives.html?meeting=${pkg.based_on_meeting}'">
                            <i class="icon-eye"></i> View Original Meeting Notes
                        </button>
                    </section>
                ` : ''}
            </div>
        `;

        // Load any saved progress
        this.loadStudyProgress(pkg.id);
    }

    renderPassages(passages) {
        if (!passages || !Array.isArray(passages)) return '<p>No passages available.</p>';

        return passages.map((passage, index) => `
            <div class="passage-block">
                <div class="passage-header">
                    <h3>${passage.book} ${passage.chapter}:${passage.verses}</h3>
                    <div class="passage-meta">
                        <span class="translation">${passage.translation || 'ESV'}</span>
                        <div class="passage-actions">
                            ${this.analysisTypes.map(type => `
                                <button class="analyze-btn btn-sm" 
                                        data-analysis="${type}" 
                                        data-passage="${index}"
                                        title="${type.charAt(0).toUpperCase() + type.slice(1)} Analysis">
                                    ${type.charAt(0).toUpperCase()}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="passage-text">
                    ${passage.text || 'Loading passage text...'}
                </div>
                <div class="passage-notes">
                    <textarea placeholder="Add your personal notes for this passage..." 
                              rows="2"
                              onchange="window.scripture.savePassageNotes('${this.currentPackage.id}', ${index}, this.value)">
                    </textarea>
                </div>
            </div>
        `).join('');
    }

    renderLanguageAnalysis(language, analysis) {
        if (!analysis || Object.keys(analysis).length === 0) {
            return `
                <section class="language-analysis ${language.toLowerCase()}-analysis">
                    <h2><i class="icon-language"></i> ${language} Analysis</h2>
                    <div class="analysis-placeholder">
                        <p>No ${language.toLowerCase()} analysis available yet.</p>
                        ${window.supabaseAuth?.isLeader() ? `
                            <button class="btn btn-primary analyze-btn" 
                                    data-analysis="${language.toLowerCase()}" 
                                    onclick="window.scripture.generateLanguageAnalysis('${language.toLowerCase()}')">
                                <i class="icon-ai"></i> Generate ${language} Analysis
                            </button>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        return `
            <section class="language-analysis ${language.toLowerCase()}-analysis">
                <h2><i class="icon-language"></i> ${language} Analysis</h2>
                <div class="analysis-content">
                    ${Object.entries(analysis).map(([term, details]) => `
                        <div class="analysis-term">
                            <h4 class="original-term">${term}</h4>
                            <div class="term-details">
                                ${details.transliteration ? `<p class="transliteration">${details.transliteration}</p>` : ''}
                                ${details.meaning ? `<p class="meaning"><strong>Meaning:</strong> ${details.meaning}</p>` : ''}
                                ${details.context ? `<p class="context"><strong>Context:</strong> ${details.context}</p>` : ''}
                                ${details.usage ? `<p class="usage"><strong>Usage:</strong> ${details.usage}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    formatText(text) {
        if (!text) return '';
        return text
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    async performAIAnalysis(analysisType, passageIndex) {
        const button = document.querySelector(`[data-analysis="${analysisType}"][data-passage="${passageIndex}"]`);
        if (button) {
            button.innerHTML = '<span class="loading-spinner"></span>';
            button.disabled = true;
        }

        try {
            // This would integrate with Claude AI API or other language analysis service
            const passage = this.currentPackage.primary_passages[passageIndex];
            const analysis = await this.callAIAnalysisService(analysisType, passage);
            
            // Update the package with new analysis
            const updatedAnalysis = {
                ...this.currentPackage[`${analysisType}_analysis`],
                [passage.book + ' ' + passage.chapter + ':' + passage.verses]: analysis
            };

            await SupabaseAPI.updateScripturePackage(this.currentPackage.id, {
                [`${analysisType}_analysis`]: updatedAnalysis
            });

            // Reload the package
            await this.loadPackage(this.currentPackage.id);
            
        } catch (error) {
            console.error('AI Analysis error:', error);
            this.showError(`Failed to generate ${analysisType} analysis`);
        } finally {
            if (button) {
                button.innerHTML = analysisType.charAt(0).toUpperCase();
                button.disabled = false;
            }
        }
    }

    async callAIAnalysisService(analysisType, passage) {
        // This is a placeholder for the actual AI service integration
        // In production, this would call Claude API or specialized biblical language APIs
        
        const prompt = this.buildAnalysisPrompt(analysisType, passage);
        
        // Mock analysis for now - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            'sample_word': {
                transliteration: 'sample',
                meaning: 'This is a sample analysis',
                context: 'Generated for demonstration',
                usage: 'Replace with actual AI analysis'
            }
        };
    }

    buildAnalysisPrompt(analysisType, passage) {
        const languageInstructions = {
            hebrew: 'Analyze the Hebrew text, focusing on original meanings, word roots, and cultural context.',
            greek: 'Analyze the Greek text, examining original meanings, grammatical structures, and theological implications.',
            aramaic: 'Analyze any Aramaic portions, explaining original meanings and cultural significance.'
        };

        return `
            Please provide detailed ${analysisType} analysis for this biblical passage:
            
            Reference: ${passage.book} ${passage.chapter}:${passage.verses}
            Translation: ${passage.translation || 'ESV'}
            Text: ${passage.text}
            
            ${languageInstructions[analysisType]}
            
            Please return analysis in JSON format with key terms and their detailed explanations.
        `;
    }

    async generateFromMeeting(meetingId) {
        try {
            // Load meeting data
            const meeting = await SupabaseAPI.getMeetingArchive(meetingId);
            if (!meeting) {
                this.showError('Meeting not found');
                return;
            }

            // Show generation modal with pre-filled data
            this.showCreatePackageModal(meeting);
            
        } catch (error) {
            console.error('Error generating from meeting:', error);
            this.showError('Failed to load meeting data');
        }
    }

    async showCreatePackageModal(baseMeeting = null) {
        const modal = document.getElementById('scripture-package-modal');
        const form = document.getElementById('scripture-package-form');
        
        if (!modal || !form) return;

        // Pre-fill form if based on meeting
        if (baseMeeting) {
            // Use AI to suggest scripture references and theme based on meeting notes
            const suggestions = await this.generateScriptureSuggestions(baseMeeting);
            // Pre-fill form with suggestions...
        }

        modal.style.display = 'flex';
    }

    async generateScriptureSuggestions(meeting) {
        // This would use AI to analyze meeting notes and suggest relevant scriptures
        // Placeholder implementation
        return {
            theme: 'Faith and Action',
            passages: [
                { book: 'James', chapter: '2', verses: '14-17' },
                { book: 'Matthew', chapter: '17', verses: '20' }
            ]
        };
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