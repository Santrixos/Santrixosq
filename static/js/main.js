// THE STYLE OF MUSIC - Main JavaScript
// Handles general UI interactions, navigation, and common functionality

class MusicApp {
    constructor() {
        this.sidebarOpen = false;
        this.currentTheme = 'dark';
        this.searchTimeout = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupNavigation();
        this.setupSearch();
        this.setupModals();
        this.setupTooltips();
        this.initializeAnimations();
        console.log('Music App initialized');
    }
    
    bindEvents() {
        // Sidebar toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.sidebarOpen) {
                if (!sidebar?.contains(e.target) && !e.target.closest('#menuToggle')) {
                    this.closeSidebar();
                }
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Scroll handler for navbar effects
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Theme toggle (if implemented)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Search form submission
        const searchForms = document.querySelectorAll('.search-form');
        searchForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSearchSubmit(e));
        });
        
        // Live search functionality
        const searchInputs = document.querySelectorAll('input[name="q"]');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => this.handleSearchInput(e));
        });
    }
    
    setupNavigation() {
        // Highlight active navigation item
        const currentPath = window.location.pathname;
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPath || (currentPath !== '/' && href !== '/' && currentPath.startsWith(href))) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Add smooth transitions to menu items
        menuItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(5px)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
            });
        });
        
        // Navigation link click handling
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Add loading state
                this.showNavigationLoading(item);
            });
        });
    }
    
    setupSearch() {
        // Search suggestions and history
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        // Setup search suggestions
        const searchInputs = document.querySelectorAll('input[name="q"]');
        searchInputs.forEach(input => {
            this.setupSearchSuggestions(input);
        });
    }
    
    setupSearchSuggestions(input) {
        const suggestionsContainer = this.createSuggestionsContainer(input);
        
        input.addEventListener('focus', () => {
            this.showSearchSuggestions(input, suggestionsContainer);
        });
        
        input.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => {
                this.hideSearchSuggestions(suggestionsContainer);
            }, 200);
        });
        
        input.addEventListener('keydown', (e) => {
            this.handleSearchKeydown(e, suggestionsContainer);
        });
    }
    
    createSuggestionsContainer(input) {
        const container = document.createElement('div');
        container.className = 'search-suggestions';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        const parent = input.closest('.search-container') || input.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(container);
        
        return container;
    }
    
    showSearchSuggestions(input, container) {
        const query = input.value.trim();
        
        let suggestions = [];
        
        // Add search history
        if (this.searchHistory.length > 0) {
            suggestions.push({
                type: 'history',
                title: 'Recent Searches',
                items: this.searchHistory.slice(0, 5)
            });
        }
        
        // Add popular searches
        suggestions.push({
            type: 'popular',
            title: 'Popular Searches',
            items: [
                'trending music 2024',
                'pop hits',
                'rock classics',
                'chill music',
                'workout music'
            ]
        });
        
        // Add quick genres if no query
        if (!query) {
            suggestions.push({
                type: 'genres',
                title: 'Browse by Genre',
                items: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical']
            });
        }
        
        this.renderSearchSuggestions(container, suggestions, query);
        container.style.display = 'block';
    }
    
    renderSearchSuggestions(container, suggestions, query) {
        let html = '';
        
        suggestions.forEach(section => {
            if (section.items.length === 0) return;
            
            html += `<div class="suggestion-section">`;
            html += `<div class="suggestion-header">${section.title}</div>`;
            
            section.items.forEach(item => {
                const icon = this.getSuggestionIcon(section.type);
                html += `
                    <div class="suggestion-item" data-query="${item}">
                        <i class="${icon}"></i>
                        <span>${item}</span>
                    </div>
                `;
            });
            
            html += `</div>`;
        });
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                this.performSearch(query);
            });
        });
    }
    
    getSuggestionIcon(type) {
        switch(type) {
            case 'history': return 'fas fa-history';
            case 'popular': return 'fas fa-fire';
            case 'genres': return 'fas fa-music';
            default: return 'fas fa-search';
        }
    }
    
    hideSearchSuggestions(container) {
        container.style.display = 'none';
    }
    
    handleSearchKeydown(e, container) {
        if (e.key === 'Escape') {
            this.hideSearchSuggestions(container);
        }
    }
    
    setupModals() {
        // Setup modal event handlers
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', function() {
                // Focus first input when modal opens
                const firstInput = this.querySelector('input, textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            });
            
            modal.addEventListener('hidden.bs.modal', function() {
                // Reset form when modal closes
                const form = this.querySelector('form');
                if (form) {
                    form.reset();
                }
            });
        });
    }
    
    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"], [title]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    initializeAnimations() {
        // Intersection Observer for scroll animations
        const animatedElements = document.querySelectorAll('.music-card, .action-card, .stat-card, .feature-card');
        
        if (animatedElements.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            animatedElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                observer.observe(el);
            });
        }
        
        // Animate cards on hover
        this.setupCardAnimations();
    }
    
    setupCardAnimations() {
        const cards = document.querySelectorAll('.music-card, .action-card, .category-card, .mood-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (!sidebar) return;
        
        if (window.innerWidth <= 768) {
            // Mobile behavior
            this.sidebarOpen = !this.sidebarOpen;
            sidebar.classList.toggle('show', this.sidebarOpen);
            
            // Add overlay
            if (this.sidebarOpen) {
                this.createOverlay();
            } else {
                this.removeOverlay();
            }
        }
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.sidebarOpen = false;
            sidebar.classList.remove('show');
            this.removeOverlay();
        }
    }
    
    createOverlay() {
        if (document.querySelector('.sidebar-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
        `;
        
        overlay.addEventListener('click', () => this.closeSidebar());
        document.body.appendChild(overlay);
    }
    
    removeOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    handleResize() {
        if (window.innerWidth > 768) {
            this.closeSidebar();
        }
    }
    
    handleScroll() {
        const topNav = document.querySelector('.top-nav');
        if (!topNav) return;
        
        const scrollY = window.scrollY;
        
        if (scrollY > 10) {
            topNav.style.background = 'rgba(15, 15, 35, 0.98)';
            topNav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        } else {
            topNav.style.background = 'rgba(15, 15, 35, 0.95)';
            topNav.style.boxShadow = 'none';
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Global keyboard shortcuts
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
            return; // Don't handle shortcuts when typing
        }
        
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Escape to close modals/dropdowns
        if (e.key === 'Escape') {
            this.closeActiveModals();
        }
        
        // Navigation shortcuts
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    window.location.href = '/';
                    break;
                case '2':
                    e.preventDefault();
                    window.location.href = '/search';
                    break;
                case '3':
                    e.preventDefault();
                    window.location.href = '/library';
                    break;
                case '4':
                    e.preventDefault();
                    window.location.href = '/discover';
                    break;
            }
        }
    }
    
    focusSearch() {
        const searchInput = document.querySelector('input[name="q"]:not([style*="display: none"])');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    closeActiveModals() {
        const activeModals = document.querySelectorAll('.modal.show');
        activeModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
    
    handleSearchSubmit(e) {
        const form = e.target;
        const input = form.querySelector('input[name="q"]');
        const query = input ? input.value.trim() : '';
        
        if (query) {
            this.addToSearchHistory(query);
        }
    }
    
    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search suggestions
        this.searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                this.showLiveSearchSuggestions(e.target, query);
            }
        }, 300);
    }
    
    showLiveSearchSuggestions(input, query) {
        // This would integrate with search API for live suggestions
        // For now, just show static suggestions based on query
        const container = input.parentElement.querySelector('.search-suggestions');
        if (container) {
            this.showSearchSuggestions(input, container);
        }
    }
    
    performSearch(query) {
        this.addToSearchHistory(query);
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
    
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Keep only last 10 searches
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
    
    showNavigationLoading(item) {
        const originalHTML = item.innerHTML;
        const icon = item.querySelector('i');
        
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }
        
        // Restore after a short delay (in case navigation is fast)
        setTimeout(() => {
            item.innerHTML = originalHTML;
        }, 1000);
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('musicAppTheme', this.currentTheme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    // Utility methods
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
            box-shadow: var(--shadow-lg);
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    }
    
    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            case 'warning': return 'exclamation-circle';
            case 'info': default: return 'info-circle';
        }
    }
    
    showLoader(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'position-fixed d-flex flex-column align-items-center justify-content-center';
        loader.style.cssText = `
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 35, 0.9);
            z-index: 99999;
            backdrop-filter: blur(5px);
        `;
        
        loader.innerHTML = `
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-light">${message}</p>
        `;
        
        document.body.appendChild(loader);
        return loader;
    }
    
    hideLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    }
    
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // API helper methods
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            this.showNotification('Something went wrong. Please try again.', 'error');
            throw error;
        }
    }
    
    // Local storage helpers
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
}

// Global utility functions
function showNotification(message, type = 'info', duration = 3000) {
    if (window.musicApp) {
        return window.musicApp.showNotification(message, type, duration);
    }
    
    // Fallback notification
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

function showLoader(message) {
    if (window.musicApp) {
        return window.musicApp.showLoader(message);
    }
}

function hideLoader() {
    if (window.musicApp) {
        window.musicApp.hideLoader();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the global music app instance
    window.musicApp = new MusicApp();
    
    // Restore theme
    const savedTheme = localStorage.getItem('musicAppTheme');
    if (savedTheme) {
        window.musicApp.currentTheme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }
    
    // Add CSS for search suggestions
    const style = document.createElement('style');
    style.textContent = `
        .search-suggestions {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
        }
        
        .suggestion-section {
            padding: 0.5rem 0;
        }
        
        .suggestion-section:not(:last-child) {
            border-bottom: 1px solid var(--border-color);
        }
        
        .suggestion-header {
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .suggestion-item {
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: background-color var(--transition-fast);
            color: var(--text-secondary);
        }
        
        .suggestion-item:hover {
            background-color: var(--bg-hover);
            color: var(--text-primary);
        }
        
        .suggestion-item i {
            width: 16px;
            color: var(--text-muted);
            font-size: 0.875rem;
        }
        
        .sidebar-overlay {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .sidebar.show {
            transform: translateX(0) !important;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transition: transform 0.3s ease;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    console.log('Main App initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicApp;
}
