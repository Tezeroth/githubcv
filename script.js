// ===== Theme System =====
const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const themeNameSpan = document.querySelector('.theme-name');
const darkModeToggle = document.querySelector('.dark-mode-toggle');

// Theme configuration
const themes = ['purple', 'orange', 'teal', 'blue'];
const themeColors = {
    purple: { primary: '#8b5cf6', secondary: '#a78bfa', start: '#8b5cf6', end: '#3b82f6' },
    orange: { primary: '#f97316', secondary: '#fb923c', start: '#f97316', end: '#ec4899' },
    teal: { primary: '#14b8a6', secondary: '#5eead4', start: '#14b8a6', end: '#3b82f6' },
    blue: { primary: '#3b82f6', secondary: '#60a5fa', start: '#3b82f6', end: '#6366f1' }
};

// Load saved preferences
const savedTheme = localStorage.getItem('colorTheme') || 'purple';
const savedDarkMode = localStorage.getItem('theme') || 'light';

// Apply saved theme
let currentThemeIndex = themes.indexOf(savedTheme);
if (currentThemeIndex === -1) currentThemeIndex = 0;

body.classList.add(`theme-${themes[currentThemeIndex]}`);
themeNameSpan.textContent = themes[currentThemeIndex].charAt(0).toUpperCase() + themes[currentThemeIndex].slice(1);

if (savedDarkMode === 'dark') {
    body.classList.add('dark-mode');
}

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    // Remove current theme class
    body.classList.remove(`theme-${themes[currentThemeIndex]}`);

    // Cycle to next theme
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];

    // Add new theme class
    body.classList.add(`theme-${newTheme}`);

    // Update button text
    themeNameSpan.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);

    // Save to localStorage
    localStorage.setItem('colorTheme', newTheme);

    // Update shader colors if shader exists
    if (window.shaderBackground && window.shaderBackground.updateTheme) {
        window.shaderBackground.updateTheme(themeColors[newTheme]);
    }
});

// Dark mode toggle functionality
darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Save preference to localStorage
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===== Smooth Scrolling =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Fade In Animation on Scroll =====
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Observe elements for fade-in animation
const observeElements = document.querySelectorAll('.highlight-card, .timeline-item, .project-card, .contact-item');
observeElements.forEach(el => {
    fadeObserver.observe(el);
});

// ===== Active Navigation Link =====
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ===== Typing Effect for Hero Title =====
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
            setTimeout(typeWriter, 150);
        }
    }
    
    // Start typing effect after a short delay
    setTimeout(typeWriter, 500);
}

// ===== Dynamic Year in Footer =====
const footer = document.querySelector('.footer p');
if (footer) {
    const currentYear = new Date().getFullYear();
    footer.innerHTML = footer.innerHTML.replace('2024', currentYear);
}

// ===== Interactive Project Cards =====
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ===== WebGL Raymarched Shader Background =====
class ShaderBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.warn('WebGL not supported, shader background disabled');
            return;
        }

        this.time = 0;

        // Get initial theme colors
        const savedTheme = localStorage.getItem('colorTheme') || 'purple';
        this.currentColors = themeColors[savedTheme];

        this.init();
        this.resize();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    init() {
        const gl = this.gl;

        // Vertex shader - simple passthrough
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

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Create buffer for full-screen quad
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Get attribute and uniform locations
        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'resolution');
        this.timeLocation = gl.getUniformLocation(this.program, 'time');
        this.color1Location = gl.getUniformLocation(this.program, 'color1');
        this.color2Location = gl.getUniformLocation(this.program, 'color2');
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        if (!this.gl || !this.program) return;

        const gl = this.gl;
        this.time += 0.016; // ~60fps

        gl.useProgram(this.program);

        // Set uniforms
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.timeLocation, this.time);

        // Set theme color uniforms
        const color1 = this.hexToRgb(this.currentColors.primary);
        const color2 = this.hexToRgb(this.currentColors.secondary);
        gl.uniform3f(this.color1Location, color1.r, color1.g, color1.b);
        gl.uniform3f(this.color2Location, color2.r, color2.g, color2.b);

        // Draw
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.animate());
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0.5, g: 0.5, b: 0.9 };
    }

    updateTheme(colors) {
        this.currentColors = colors;
    }
}

// Initialize shader background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shaderBackground = new ShaderBackground('shaderCanvas');
});

// ===== Console Easter Egg =====
console.log('%c👋 Hello, Interviewer!', 'font-size: 20px; font-weight: bold; color: #2563eb;');
console.log('%cThanks for checking out my CV landing page!', 'font-size: 14px; color: #6b7280;');
console.log('%cThis page demonstrates my skills in HTML, CSS, and JavaScript.', 'font-size: 14px; color: #6b7280;');
console.log('%cI specialize in WebXR, A-Frame, and 3D web experiences! 🥽', 'font-size: 14px; color: #10b981;');
console.log('%cCheck out the raymarched WebGL shader in the hero section! 🎨', 'font-size: 14px; color: #10b981;');
console.log('%cFeel free to explore the code! 🚀', 'font-size: 14px; color: #10b981;');

