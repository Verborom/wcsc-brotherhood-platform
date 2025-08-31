// Scripture study functionality

class ScriptureStudy {
    constructor() {
        this.packages = this.loadScripturePackages();
        this.init();
    }

    init() {
        this.displayCurrentPackage();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Future interactive elements for scripture study
    }

    loadScripturePackages() {
        return {
            current: {
                date: '2025-01-27',
                theme: 'Building Unshakeable Brotherhood',
                meetingSource: 'Friday January 24, 2025 meeting insights'
            },
            archive: [
                {
                    date: '2025-01-20',
                    theme: 'Standing Firm in Truth',
                    summary: 'Focus on biblical courage and defending righteousness in hostile environments.'
                },
                {
                    date: '2025-01-13', 
                    theme: 'Servant Leadership',
                    summary: 'Christ\'s example of washing disciples\' feet and leading through service.'
                }
            ]
        };
    }

    displayCurrentPackage() {
        // Current package is already in the HTML
        // This method would update it when new packages are generated
        console.log('Current scripture package loaded');
    }

    loadPackage(date) {
        // Future functionality to load specific archived packages
        alert(`Loading scripture package for ${date} - This will be implemented when we add the AI processing system.`);
    }
}

// Global function for HTML onclick
function loadPackage(date) {
    if (window.scriptureStudy) {
        window.scriptureStudy.loadPackage(date);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.scriptureStudy = new ScriptureStudy();
});