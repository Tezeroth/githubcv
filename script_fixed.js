/**
 * ===== THEME SYSTEM =====
 * Manages color themes and dark mode preferences
 * Persists user preferences to localStorage
 */

// DOM Elements
const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const themeNameSpan = document.querySelector('.theme-name');
const darkModeToggle = document.querySelector('.dark-mode-toggle');

// Theme configuration - Available color schemes
const themes = ['purple', 'orange', 'teal', 'blue'];

// Color definitions for each theme (used by WebGL shader)
const themeColors = {
    purple: { primary: '#8b5cf6', secondary: '#a78bfa', start: '#8b5cf6', end: '#3b82f6' },
    orange: { primary: '#f97316', secondary: '#fb923c', start: '#f97316', end: '#ec4899' },
    teal: { primary: '#14b8a6', secondary: '#5eead4', start: '#14b8a6', end: '#3b82f6' },
    blue: { primary: '#3b82f6', secondary: '#60a5fa', start: '#3b82f6', end: '#6366f1' }
};

// Load saved user preferences from localStorage
const savedTheme = localStorage.getItem('colorTheme') || 'purple';
const savedDarkMode = localStorage.getItem('theme') || 'light';

// Apply saved theme on page load
let currentThemeIndex = themes.indexOf(savedTheme);
if (currentThemeIndex === -1) currentThemeIndex = 0; // Fallback to purple if invalid

body.classList.add(`theme-${themes[currentThemeIndex]}`);
themeNameSpan.textContent = themes[currentThemeIndex].charAt(0).toUpperCase() + themes[currentThemeIndex].slice(1);

// Apply dark mode if previously enabled
if (savedDarkMode === 'dark') {
    body.classList.add('dark-mode');
}

/**
 * Theme toggle - Cycles through available color themes
 */
themeToggle.addEventListener('click', () => {
    // Remove current theme class
    body.classList.remove(`theme-${themes[currentThemeIndex]}`);

    // Cycle to next theme (wraps around to first theme after last)
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];

    // Apply new theme class
    body.classList.add(`theme-${newTheme}`);

    // Update button text to show current theme
    themeNameSpan.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);

    // Persist preference to localStorage
    localStorage.setItem('colorTheme', newTheme);

    // Update WebGL shader colors if shader is initialized
    if (window.shaderBackground && window.shaderBackground.updateTheme) {
        window.shaderBackground.updateTheme(themeColors[newTheme]);
    }
});

/**
 * Dark mode toggle - Switches between light and dark mode
 */
darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Persist preference to localStorage
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

/**
 * ===== NAVBAR SCROLL EFFECT =====
 * Adds 'scrolled' class to navbar when user scrolls down
 * Triggers background and shadow effects via CSS
 */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class after scrolling 50px down
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/**
 * ===== MOBILE MENU TOGGLE =====
 * Handles hamburger menu functionality on mobile devices
 */
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

// Toggle menu open/close
mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on any navigation link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

/**
 * ===== SMOOTH SCROLLING =====
 * Enables smooth scroll behavior for anchor links
 * Accounts for fixed navbar height (70px offset)
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            // Offset by navbar height to prevent content being hidden
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

/**
 * ===== FADE IN ANIMATION ON SCROLL =====
 * Uses Intersection Observer API for performance-efficient scroll animations
 * Triggers fade-in-up animation when elements enter viewport
 */
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            // Unobserve after animation to prevent re-triggering
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1, // Trigger when 10% of element is visible
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
});

