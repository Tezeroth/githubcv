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
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class after scrolling 50px down
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
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

// Observe elements that should fade in on scroll
const observeElements = document.querySelectorAll('.highlight-card, .timeline-item, .project-card, .contact-item');
observeElements.forEach(el => {
    fadeObserver.observe(el);
});

/**
 * ===== ACTIVE NAVIGATION LINK =====
 * Highlights the current section in the navigation menu
 * Updates as user scrolls through different sections
 */
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        // Check if current scroll position is within this section
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            // Add active class to current section's link
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

/**
 * ===== TYPING EFFECT FOR HERO TITLE =====
 * Creates a typewriter animation for the hero name
 * Adds visual interest to the landing section
 */
const heroName = document.querySelector('.name');
if (heroName) {
    const text = heroName.textContent;
    heroName.textContent = '';
    heroName.style.opacity = '1';

    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            heroName.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 150); // 150ms delay between characters
        }
    }

    // Start typing effect after 500ms delay
    setTimeout(typeWriter, 500);
}

/**
 * ===== DYNAMIC YEAR IN FOOTER =====
 * Automatically updates copyright year to current year
 */
const footer = document.querySelector('.footer p');
if (footer) {
    const currentYear = new Date().getFullYear();
    footer.innerHTML = footer.innerHTML.replace('2024', currentYear);
}

/**
 * ===== INTERACTIVE PROJECT CARDS =====
 * Adds hover effects to project cards for better interactivity
 * Enhances user experience with visual feedback
 */
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

/**
 * ===== WEBGL RAYMARCHED SHADER BACKGROUND =====
 * Creates an animated 3D shader background using WebGL
 * Features:
 * - Raymarched 3D geometry (sphere, box, torus morphing)
 * - Dynamic theme color integration
 * - Performance optimizations (pauses when tab hidden)
 * - Proper memory management and cleanup
 */
class ShaderBackground {
    /**
     * Initialize the WebGL shader background
     * @param {string} canvasId - ID of the canvas element to render to
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.isInitialized = false;

        if (!this.canvas) {
            console.warn('Canvas element not found');
            return;
        }

        // Disable WebGL on mobile devices for better performance
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowPowerDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

        if (isMobile || isLowPowerDevice) {
            console.log('WebGL disabled on mobile/low-power device for performance');
            this.canvas.style.display = 'none';
            this.isInitialized = false;
            return;
        }

        // Get WebGL context (try standard then experimental)
        try {
            this.gl = this.canvas.getContext('webgl', {
                alpha: false,
                antialias: false,
                powerPreference: 'high-performance'
            }) || this.canvas.getContext('experimental-webgl', {
                alpha: false,
                antialias: false,
                powerPreference: 'high-performance'
            });
        } catch (e) {
            console.warn('WebGL context creation failed:', e);
            this.gl = null;
        }

        if (!this.gl) {
            console.warn('WebGL not supported, shader background disabled');
            this.canvas.style.display = 'none';
            this.isInitialized = false;
            return;
        }

        // Animation state
        this.time = 0;
        this.animationFrameId = null;
        this.isRunning = false;
        this.isVisible = true;

        // Get initial theme colors from localStorage
        const savedTheme = localStorage.getItem('colorTheme') || 'purple';
        this.currentColors = themeColors[savedTheme];

        // Bind event handlers to preserve 'this' context
        this.resizeHandler = () => this.resize();
        this.visibilityHandler = () => this.handleVisibilityChange();

        // Initialize shader program and start animation
        try {
            this.init();
            this.resize();
            this.start();
            this.isInitialized = true;
        } catch (e) {
            console.error('WebGL initialization failed:', e);
            this.canvas.style.display = 'none';
            this.isInitialized = false;
            return;
        }

        // Setup event listeners for responsive behavior
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    /**
     * Initialize WebGL shaders and buffers
     * Sets up the rendering pipeline
     */
    init() {
        const gl = this.gl;

        // Vertex shader - Simple passthrough for full-screen quad
        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment shader - raymarched 3D geometry
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 resolution;
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;

            // Signed distance function for a sphere
            float sdSphere(vec3 p, float r) {
                return length(p) - r;
            }

            // Signed distance function for a box
            float sdBox(vec3 p, vec3 b) {
                vec3 d = abs(p) - b;
                return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
            }

            // Signed distance function for a torus
            float sdTorus(vec3 p, vec2 t) {
                vec2 q = vec2(length(p.xz) - t.x, p.y);
                return length(q) - t.y;
            }

            // Rotation matrix
            mat2 rot(float a) {
                float c = cos(a), s = sin(a);
                return mat2(c, -s, s, c);
            }

            // Scene distance function
            float map(vec3 p) {
                // Rotate the scene
                p.xz *= rot(time * 0.3);
                p.xy *= rot(time * 0.2);

                // Morphing between shapes
                float t = sin(time * 0.5) * 0.5 + 0.5;

                // Create multiple shapes
                float sphere = sdSphere(p, 0.8);
                float box = sdBox(p, vec3(0.6));
                float torus = sdTorus(p, vec2(0.8, 0.3));

                // Morph between shapes
                float shape1 = mix(sphere, box, t);
                float shape2 = mix(box, torus, sin(time * 0.3) * 0.5 + 0.5);

                return min(shape1, shape2);
            }

            // Calculate normal for lighting
            vec3 calcNormal(vec3 p) {
                float h = 0.0001;
                vec2 k = vec2(1, -1);
                return normalize(
                    k.xyy * map(p + k.xyy * h) +
                    k.yyx * map(p + k.yyx * h) +
                    k.yxy * map(p + k.yxy * h) +
                    k.xxx * map(p + k.xxx * h)
                );
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;

                // Camera setup
                vec3 ro = vec3(0.0, 0.0, 3.0); // Ray origin
                vec3 rd = normalize(vec3(uv, -1.0)); // Ray direction

                // Raymarching
                float t = 0.0;
                vec3 col = vec3(0.0);

                for (int i = 0; i < 80; i++) {
                    vec3 p = ro + rd * t;
                    float d = map(p);

                    if (d < 0.001) {
                        // Hit! Calculate lighting
                        vec3 normal = calcNormal(p);
                        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                        float diff = max(dot(normal, lightDir), 0.0);

                        // Color gradient based on position and time using theme colors
                        vec3 baseColor = mix(color1, color2, 0.5 + 0.5 * sin(time * 0.5 + p.y * 2.0));
                        baseColor += 0.2 * cos(time + p.xyx + vec3(0, 2, 4));
                        col = baseColor * (0.5 + 0.5 * diff);

                        // Add some rim lighting with theme color
                        float rim = 1.0 - max(dot(normal, -rd), 0.0);
                        col += color2 * pow(rim, 3.0) * 0.5;

                        break;
                    }

                    if (t > 20.0) break;
                    t += d;
                }

                // Background gradient with theme colors
                if (length(col) < 0.01) {
                    col = color1 * 0.2 + color2 * 0.1 * uv.y;
                }

                // Add some glow with theme color
                col += color1 * 0.3 * exp(-t * 0.3);

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            console.error('Shader compilation failed');
            return;
        }

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Delete shaders after linking (they're now part of the program)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        // Create buffer for full-screen quad
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Get attribute and uniform locations
        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'resolution');
        this.timeLocation = gl.getUniformLocation(this.program, 'time');
        this.color1Location = gl.getUniformLocation(this.program, 'color1');
        this.color2Location = gl.getUniformLocation(this.program, 'color2');
    }

    /**
     * Compile a WebGL shader from source code
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {string} source - GLSL shader source code
     * @returns {WebGLShader|null} Compiled shader or null on error
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // Check for compilation errors
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Handle canvas resize
     * Updates canvas dimensions and WebGL viewport
     */
    resize() {
        if (!this.gl || !this.isInitialized) return;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Main animation loop
     * Renders the shader and updates uniforms each frame
     */
    animate() {
        // Safety check - don't animate if not ready or not running
        if (!this.gl || !this.program || !this.isRunning || !this.isInitialized) return;

        const gl = this.gl;
        this.time += 0.016; // Increment time (~60fps)

        gl.useProgram(this.program);

        // Update shader uniforms
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.timeLocation, this.time);

        // Update theme colors
        const color1 = this.hexToRgb(this.currentColors.primary);
        const color2 = this.hexToRgb(this.currentColors.secondary);
        gl.uniform3f(this.color1Location, color1.r, color1.g, color1.b);
        gl.uniform3f(this.color2Location, color2.r, color2.g, color2.b);

        // Draw full-screen quad
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Start the animation loop
     */
    start() {
        if (!this.gl || !this.isInitialized) return;
        if (!this.isRunning && this.isVisible) {
            this.isRunning = true;
            this.animate();
        }
    }

    /**
     * Stop the animation loop
     * Cancels the animation frame to prevent memory leaks
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isRunning = false;
    }

    /**
     * Handle page visibility changes
     * Pauses animation when tab is hidden to save CPU/battery
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.isVisible = false;
            this.stop();
        } else {
            this.isVisible = true;
            this.start();
        }
    }

    /**
     * Convert hex color to RGB values (0-1 range for WebGL)
     * @param {string} hex - Hex color string (e.g., '#8b5cf6')
     * @returns {Object} RGB object with r, g, b properties (0-1 range)
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0.5, g: 0.5, b: 0.9 }; // Fallback color
    }

    /**
     * Update shader theme colors
     * @param {Object} colors - Color object with primary and secondary properties
     */
    updateTheme(colors) {
        if (!this.isInitialized) return;
        this.currentColors = colors;
    }

    /**
     * Clean up all WebGL resources and event listeners
     * Call this before removing the shader to prevent memory leaks
     */
    destroy() {
        // Stop animation loop
        this.stop();

        // Remove event listeners only if they were added
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }

        // Clean up WebGL resources
        if (this.gl && this.isInitialized) {
            if (this.buffer) {
                this.gl.deleteBuffer(this.buffer);
                this.buffer = null;
            }
            if (this.program) {
                this.gl.deleteProgram(this.program);
                this.program = null;
            }
        }

        // Clear references to allow garbage collection
        this.gl = null;
        this.canvas = null;
        this.isInitialized = false;
    }
}

/**
 * Initialize shader background when DOM is fully loaded
 * Stored in window object to allow theme updates from other code
 */
document.addEventListener('DOMContentLoaded', () => {
    window.shaderBackground = new ShaderBackground('shaderCanvas');
});

/**
 * ===== CONSOLE EASTER EGG =====
 * Friendly message for anyone inspecting the code
 * Shows personality and technical skills
 */
console.log('%c👋 Hello, Interviewer!', 'font-size: 20px; font-weight: bold; color: #2563eb;');
console.log('%cThanks for checking out my CV landing page!', 'font-size: 14px; color: #6b7280;');
console.log('%cThis page demonstrates my skills in HTML, CSS, and JavaScript by abusing ai.', 'font-size: 14px; color: #6b7280;');
console.log('%cI specialize in WebXR, A-Frame, and 3D web experiences! 🥽', 'font-size: 14px; color: #10b981;');
console.log('%cCheck out the raymarched WebGL shader in the hero section! 🎨', 'font-size: 14px; color: #10b981;');
console.log('%cFeel free to explore the code! 🚀', 'font-size: 14px; color: #10b981;');

