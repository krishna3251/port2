// Global variables
let scene, camera, renderer, fallingStars, mouse, windowHalfX, windowHalfY;
let starVelocities = [];
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIndex = 0;

// Audio System Variables
let audioContext;
let soundEnabled = false;
let masterVolume = 0.1;

// Theme System Variables
let currentTheme = 'cyberpunk';
const themes = {
    cyberpunk: { 
        name: 'Cyberpunk',
        primary: '#00fff7', 
        secondary: '#ff00ff', 
        tertiary: '#9b59b6', 
        accent: '#00bcd4' 
    },
    ocean: { 
        name: 'Ocean Blue',
        primary: '#0ea5e9', 
        secondary: '#3b82f6', 
        tertiary: '#1d4ed8', 
        accent: '#1e40af' 
    },
    matrix: { 
        name: 'Matrix Green',
        primary: '#22c55e', 
        secondary: '#16a34a', 
        tertiary: '#15803d', 
        accent: '#166534' 
    },
    golden: { 
        name: 'Golden Amber',
        primary: '#f59e0b', 
        secondary: '#d97706', 
        tertiary: '#b45309', 
        accent: '#92400e' 
    },
    purple: { 
        name: 'Royal Purple',
        primary: '#a855f7', 
        secondary: '#9333ea', 
        tertiary: '#7c3aed', 
        accent: '#6d28d9' 
    },
    sakura: { 
        name: 'Sakura Pink',
        primary: '#ec4899', 
        secondary: '#db2777', 
        tertiary: '#be185d', 
        accent: '#9d174d' 
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization...');
    
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        initAudioSystem();
        initThemeSystem();
        initNavigation();
        initThreeJS();
        initScrollAnimations();
        initSkillBars();
        initContactForm();
        initRippleEffect();
        initKonamiCode();
        initAudioSystem();
        attachSoundEvents();
        initParallax();
        initInteractiveAudio();
        initOrbitIcons();
        initMobileToggle();
        
        // Load saved theme
        loadSavedTheme();
        
        // Hide loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hide');
            setTimeout(() => loadingScreen.remove(), 500);
        }
        
        console.log('All systems initialized successfully!');
    }, 300);
});

// ====================
// AUDIO SYSTEM
// ====================

// (you already have these declared)
// let audioContext;
// let soundEnabled = false;
// let masterVolume = 0.1;

let currentOscillator = null; // track active sound

// Initialize audio on first interaction
function initAudioSystem() {
    console.log("Initializing audio system...");

    const initAudio = () => {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext initialized ✅");
            } catch (err) {
                console.warn("Web Audio API not supported ❌", err);
                return;
            }
        }
        document.removeEventListener("click", initAudio);
        document.removeEventListener("touchstart", initAudio);
    };

    // first user interaction will unlock audio
    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });

    // Setup toggle button if it exists
    const soundBtn = document.getElementById("audioToggle");
    if (soundBtn) {
        soundBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            soundEnabled = !soundEnabled;
            updateSoundButton();

            if (soundEnabled) {
                playSound("success");
                showNotification("🔊 Sound effects enabled!", "success");
            } else {
                showNotification("🔇 Sound effects disabled", "success");
            }
        });
        console.log("Sound toggle button ready 🎚️");
    }

    updateSoundButton();
}

// Update button icon
function updateSoundButton() {
    const soundBtn = document.getElementById("audioToggle");
    if (!soundBtn) return;

    const icon = soundBtn.querySelector("i");

    if (soundEnabled) {
        icon.className = "fas fa-volume-up";
        soundBtn.classList.add("active");
        soundBtn.title = "Disable Sound Effects";
    } else {
        icon.className = "fas fa-volume-mute";
        soundBtn.classList.remove("active");
        soundBtn.title = "Enable Sound Effects";
    }
}

// ====================
// PLAY SOUND
// ====================
function playSound(type, customFreq = null, customDuration = null) {
    if (!soundEnabled || !audioContext) return;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // stop old sound first (prevents stacking)
    if (currentOscillator) {
        try { currentOscillator.stop(); } catch {}
        currentOscillator.disconnect();
        currentOscillator = null;
    }

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Preset sounds
        const sounds = {
            hover: { freq: 800, duration: 0.1 },
            click: { freq: 1200, duration: 0.08 },
            success: { freq: 1000, duration: 0.2 },
            theme: { freq: 900, duration: 0.15 },
            navigation: { freq: 600, duration: 0.15 },
            progress: { freq: 1300, duration: 0.12 },
            error: { freq: 400, duration: 0.25 },
        };

        const sound = sounds[type] || sounds.hover;
        const frequency = customFreq || sound.freq;
        const duration = customDuration || sound.duration;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Fade in/out volume smoothly
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(masterVolume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);

        currentOscillator = oscillator;

        oscillator.onended = () => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch {}
            currentOscillator = null;
        };

    } catch (err) {
        console.warn("Error playing sound:", err);
    }
}

// ====================
// OPTIONAL: Attach events
// ====================
function attachSoundEvents() {
    document.querySelectorAll("button, a").forEach(el => {
        el.addEventListener("mouseenter", () => playSound("hover"));
        el.addEventListener("click", () => playSound("click"));
    });
}

// ====================
// HELPER: Fake Notification
// ====================
// Replace with your UI function
function showNotification(msg, type) {
    console.log(`[${type}] ${msg}`);
}



// FIXED THEME SYSTEM - Working K.S Logo Theme Changer
function initThemeSystem() {
    console.log('Initializing theme system...');
    
    const ksLogo = document.getElementById('ksLogo');
    const themePalette = document.getElementById('themePalette');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (ksLogo && themePalette) {
        // K.S logo click to toggle theme palette
        ksLogo.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            themePalette.classList.toggle('hidden');
            console.log('Theme palette toggled');
            playSound('click');
        });
        
        // Theme option clicks
        themeOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const themeName = this.dataset.theme;
                console.log('Theme clicked:', themeName);
                if (themeName && themes[themeName]) {
                    changeTheme(themeName);
                    updateActiveThemeOption(themeName);
                    themePalette.classList.add('hidden');
                }
            });
            
            // Hover effects
            option.addEventListener('mouseenter', function() {
                playSound('hover', 700, 100);
            });
        });
        
        // Close palette when clicking outside
        document.addEventListener('click', function(e) {
            if (!ksLogo.contains(e.target) && !themePalette.contains(e.target)) {
                themePalette.classList.add('hidden');
            }
        });
    }
    
    console.log('Theme system initialized successfully');
}

function changeTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    console.log('Changing theme to:', theme.name);
    
    // Play theme change sound
    playSound('theme');
    setTimeout(() => playSound('success', 1200, 200), 200);
    
    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--neon-cyan', theme.primary);
    root.style.setProperty('--neon-magenta', theme.secondary);
    root.style.setProperty('--neon-violet', theme.tertiary);
    root.style.setProperty('--neon-blue', theme.accent);
    
    // Update star colors if available
    if (typeof updateStarColors === 'function') {
        updateStarColors(theme);
    }
    
    // Save theme preference
    currentTheme = themeName;
    localStorage.setItem('selectedTheme', themeName);
    
    // Show notification
    showNotification(`🎨 Theme changed to ${theme.name}!`, 'success');
    
    console.log('Theme changed successfully to:', theme.name);
}

function updateActiveThemeOption(themeName) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === themeName) {
            option.classList.add('active');
        }
    });
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'cyberpunk';
    if (themes[savedTheme]) {
        changeTheme(savedTheme);
        updateActiveThemeOption(savedTheme);
    }
}

// Get current theme colors for stars
function getCurrentThemeColors() {
    const theme = themes[currentTheme];
    return [
        hexToRgb(theme.primary),
        hexToRgb(theme.secondary), 
        hexToRgb(theme.tertiary),
        hexToRgb(theme.accent)
    ];
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
}

// THREE.JS FALLING STARS
function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.THREE) {
        console.warn('Three.js or canvas not available');
        return;
    }

    try {
        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Mouse tracking
        mouse = new THREE.Vector2();
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        // Create falling stars
        createFallingStars();

        // Position camera
        camera.position.z = 5;

        // Start animation loop
        animate();

        // Handle resize and mouse
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        
        console.log('Three.js initialized with falling stars');
    } catch (error) {
        console.warn('Three.js initialization failed:', error);
    }
}

function createFallingStars() {
    const starCount = window.innerWidth < 768 ? 40 : 60;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    // Initialize star velocities for slow falling
    starVelocities = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        // Position
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = Math.random() * 30 + 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        
        // Velocities - slow falling with horizontal drift
        starVelocities[i * 3] = (Math.random() - 0.5) * 0.01;
        starVelocities[i * 3 + 1] = -(Math.random() * 0.02 + 0.01);
        starVelocities[i * 3 + 2] = 0;
        
        // Colors from current theme
        const themeColors = getCurrentThemeColors();
        const colorIndex = Math.floor(Math.random() * 4);
        const color = themeColors[colorIndex];
        colors[i * 3] = color[0];
        colors[i * 3 + 1] = color[1]; 
        colors[i * 3 + 2] = color[2];
        
        // Sizes
        sizes[i] = Math.random() * 4 + 2;
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Enhanced shader material
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                
                // Twinkling effect
                float twinkle = 0.8 + sin(time * 3.0 + position.x * 10.0 + position.y * 5.0) * 0.4;
                gl_PointSize = size * (300.0 / -mvPosition.z) * twinkle;
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                float r = distance(gl_PointCoord, vec2(0.5));
                if (r > 0.5) discard;
                
                float alpha = 1.0 - (r * 2.0);
                alpha = alpha * alpha * alpha;
                gl_FragColor = vec4(vColor, alpha * 0.9);
            }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    fallingStars = new THREE.Points(geometry, material);
    scene.add(fallingStars);
    
    console.log('Falling stars created with theme colors');
}

// Update star colors when theme changes
function updateStarColors() {
    if (!fallingStars) {
        console.log('No falling stars to update');
        return;
    }
    
    console.log('Updating star colors to match theme:', currentTheme);
    
    const colors = fallingStars.geometry.attributes.color.array;
    const themeColors = getCurrentThemeColors();
    const starCount = colors.length / 3;
    
    for (let i = 0; i < starCount; i++) {
        const colorIndex = Math.floor(Math.random() * 4);
        const color = themeColors[colorIndex];
        colors[i * 3] = color[0];
        colors[i * 3 + 1] = color[1];
        colors[i * 3 + 2] = color[2];
    }
    
    fallingStars.geometry.attributes.color.needsUpdate = true;
    console.log('Star colors updated successfully');
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    
    if (fallingStars) {
        fallingStars.material.uniforms.time.value = time;
        
        // Update star positions for falling effect
        const positions = fallingStars.geometry.attributes.position.array;
        const starCount = positions.length / 3;
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Update position with velocity
            positions[i3] += starVelocities[i3]; // x
            positions[i3 + 1] += starVelocities[i3 + 1]; // y
            positions[i3 + 2] += starVelocities[i3 + 2]; // z
            
            // Reset star when it falls too low
            if (positions[i3 + 1] < -15) {
                positions[i3] = (Math.random() - 0.5) * 50;
                positions[i3 + 1] = Math.random() * 10 + 20;
                positions[i3 + 2] = (Math.random() - 0.5) * 20;
                
                starVelocities[i3] = (Math.random() - 0.5) * 0.01;
                starVelocities[i3 + 1] = -(Math.random() * 0.02 + 0.01);
            }
        }
        
        fallingStars.geometry.attributes.position.needsUpdate = true;
        
        // Mouse parallax effect
        if (mouse) {
            fallingStars.rotation.x += (mouse.y * 0.03 - fallingStars.rotation.x) * 0.05;
            fallingStars.rotation.y += (mouse.x * 0.03 - fallingStars.rotation.y) * 0.05;
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    if (!mouse) return;
    mouse.x = (event.clientX - windowHalfX) / windowHalfX;
    mouse.y = (event.clientY - windowHalfY) / windowHalfY;
}

// Navigation System
function initNavigation() {
    console.log('Initializing navigation...');
    
    // Get all navigation links that start with #
    const navLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    console.log(`Found ${navLinks.length} navigation links`);
    
    navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        console.log(`Setting up nav link ${index}: ${href}`);
        
        // Skip the K.S logo since it's used for theme switching
        if (link.id === 'ksLogo') {
            console.log('Skipping K.S logo for navigation (used for theme switching)');
            return;
        }
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('href');
            console.log('Navigation link clicked:', targetId);
            
            // Smooth scroll to target section
            scrollToSection(targetId);
            
            // Play navigation sound
            playSound('navigation');
        });
    });

    // Navbar background on scroll
    let ticking = false;
    function updateNavbar() {
        const navbar = document.querySelector('.cyber-navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(10, 15, 28, 0.95)';
                navbar.style.backdropFilter = 'blur(20px)';
            } else {
                navbar.style.background = 'rgba(10, 15, 28, 0.9)';
                navbar.style.backdropFilter = 'blur(10px)';
            }
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });
    
    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    const navigationLinks = document.querySelectorAll('.cyber-nav-link[href^="#"]');
    
    function updateActiveNav() {
        let current = '';
        const scrollPosition = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navigationLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    let navTicking = false;
    window.addEventListener('scroll', () => {
        if (!navTicking) {
            requestAnimationFrame(updateActiveNav);
            navTicking = true;
        }
    });
    
    console.log('Navigation initialized successfully');
}

function scrollToSection(targetId) {
    const targetSection = document.querySelector(targetId);
    
    if (!targetSection) {
        console.error('Target section not found:', targetId);
        return;
    }
    
    console.log('Scrolling to section:', targetId);
    
    const navbarHeight = document.querySelector('.cyber-navbar')?.offsetHeight || 80;
    const targetPosition = targetSection.offsetTop - navbarHeight - 20;
    
    // Use smooth scrolling with fallback
    try {
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    } catch (error) {
        // Fallback for browsers that don't support smooth scrolling
        window.scrollTo(0, targetPosition);
    }
    
    // Close mobile menu if open
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
        
        // Reset hamburger animation
        const toggler = document.querySelector('.cyber-toggler');
        if (toggler) {
            const spans = toggler.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        }
    }
    
    console.log('Scrolled to section:', targetId);
}

// Interactive Audio
function initInteractiveAudio() {
    console.log('Initializing interactive audio...');
    
    // Navigation links
    document.querySelectorAll('.cyber-nav-link').forEach(link => {
        link.addEventListener('mouseenter', () => playSound('navigation'));
        link.addEventListener('click', () => playSound('click'));
    });
    
    // Buttons
    document.querySelectorAll('.cyber-btn').forEach(button => {
        button.addEventListener('mouseenter', () => playSound('hover'));
        button.addEventListener('click', () => playSound('click'));
    });
    
    // Project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', () => playSound('hover', 900, 100));
    });
    
    // Project buttons
    document.querySelectorAll('.project-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => playSound('navigation'));
        btn.addEventListener('click', () => playSound('success'));
    });
    
    // Skill items
    document.querySelectorAll('.skill-item').forEach(item => {
        item.addEventListener('mouseenter', () => playSound('progress', 1300, 120));
    });
    
    // Achievement cards
    document.querySelectorAll('.achievement-card').forEach(card => {
        card.addEventListener('mouseenter', () => playSound('success', 1100, 150));
    });
    
    // Social links
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('mouseenter', () => playSound('navigation'));
        link.addEventListener('click', () => playSound('success'));
    });
    
    // Interest tags
    document.querySelectorAll('.interest-tag').forEach(tag => {
        tag.addEventListener('mouseenter', () => playSound('hover', 700, 100));
    });
    
    // Form inputs
    document.querySelectorAll('.cyber-input').forEach(input => {
        input.addEventListener('focus', () => playSound('navigation', 500, 100));
    });
    
    // Audio toggle button hover
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
        audioToggle.addEventListener('mouseenter', () => {
            if (soundEnabled) playSound('hover');
        });
    }
    
    console.log('Interactive audio initialized');
}

// Orbit Icons with Easter Egg functionality
function initOrbitIcons() {
    console.log('Initializing orbit icons...');
    
    const orbitIcons = document.querySelectorAll('.orbit-icon.easter-egg');
    console.log(`Found ${orbitIcons.length} orbit icons with easter eggs`);
    
    orbitIcons.forEach((icon, index) => {
        const url = icon.getAttribute('data-url');
        console.log(`Setting up orbit icon ${index} with URL: ${url}`);
        
        // Add click functionality for icons with URLs
        if (url && url.trim() !== '') {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Orbit icon clicked, opening:', url);
                playSound('success', 1200, 200);
                window.open(url, '_blank');
                showNotification('🚀 Opening link in new tab!', 'success');
            });
        }
        
        // Hover effects
        icon.addEventListener('mouseenter', function() {
            playSound('hover', 1000, 200);
        });
    });
    
    console.log('Orbit icons initialized');
}

// Mobile navbar toggle
function initMobileToggle() {
    console.log('Initializing mobile toggle...');
    
    const navbarToggler = document.querySelector('.cyber-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('Mobile toggle clicked');
            
            navbarCollapse.classList.toggle('show');
            playSound('click');
            
            const spans = this.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transition = 'all 0.3s ease';
                if (navbarCollapse.classList.contains('show')) {
                    if (index === 0) span.style.transform = 'rotate(45deg) translate(6px, 6px)';
                    if (index === 1) span.style.opacity = '0';
                    if (index === 2) span.style.transform = 'rotate(-45deg) translate(6px, -6px)';
                } else {
                    span.style.transform = 'none';
                    span.style.opacity = '1';
                }
            });
        });
        
        console.log('Mobile toggle initialized');
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Trigger skill bar animations
                if (entry.target.classList.contains('skills-section')) {
                    setTimeout(() => {
                        animateSkillBars();
                    }, 300);
                }
            }
        });
    }, observerOptions);

    // Observe all sections and cards
    document.querySelectorAll('section, .project-card, .skill-item, .achievement-card').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Skill bar animations
function initSkillBars() {
    window.animateSkillBars = function() {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach((bar, index) => {
            setTimeout(() => {
                const skillLevel = bar.getAttribute('data-skill');
                bar.style.width = skillLevel + '%';
                
                playSound('progress', 1200 + (index * 100), 150);
            }, index * 200);
        });
    };
}

// Contact form
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    function validateField(field, validator, errorMessage) {
        field.addEventListener('blur', function() {
            const isValid = validator(this.value);
            toggleFieldError(this, !isValid, errorMessage);
            if (!isValid) {
                playSound('error');
            }
        });

        field.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                const isValid = validator(this.value);
                if (isValid) {
                    toggleFieldError(this, false);
                    playSound('success', 800, 100);
                }
            }
        });
    }

    function toggleFieldError(field, hasError, message = '') {
        if (hasError) {
            field.classList.add('error');
            
            const existingError = field.parentNode.querySelector('.error-message');
            if (existingError) existingError.remove();
            
            if (message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                field.parentNode.appendChild(errorDiv);
            }
        } else {
            field.classList.remove('error');
            const errorMessage = field.parentNode.querySelector('.error-message');
            if (errorMessage) errorMessage.remove();
        }
    }

    // Set up field validations
    validateField(nameInput, (value) => value.trim().length >= 2, 'Name must be at least 2 characters long');
    validateField(emailInput, isValidEmail, 'Please enter a valid email address');
    validateField(messageInput, (value) => value.trim().length >= 10, 'Message must be at least 10 characters long');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        // Validate all fields
        let hasErrors = false;

        if (name.length < 2) {
            toggleFieldError(nameInput, true, 'Name must be at least 2 characters long');
            hasErrors = true;
        } else {
            toggleFieldError(nameInput, false);
        }

        if (!isValidEmail(email)) {
            toggleFieldError(emailInput, true, 'Please enter a valid email address');
            hasErrors = true;
        } else {
            toggleFieldError(emailInput, false);
        }

        if (message.length < 10) {
            toggleFieldError(messageInput, true, 'Message must be at least 10 characters long');
            hasErrors = true;
        } else {
            toggleFieldError(messageInput, false);
        }

        if (hasErrors) {
            playSound('error');
            showNotification('Please fix the errors above before submitting!', 'error');
            return;
        }

        // Submit form
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('span').textContent;
        
        submitBtn.querySelector('span').textContent = 'Sending...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        const formData = new FormData(form);

        fetch('https://formspree.io/f/mnnzewde', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                playSound('success');
                showNotification('🚀 Message sent successfully! Thanks for reaching out, Krishna will get back to you soon!', 'success');
                form.reset();
                [nameInput, emailInput, messageInput].forEach(input => {
                    toggleFieldError(input, false);
                });
                return response.json();
            } else {
                return response.json().then(data => {
                    if (data.errors) {
                        throw new Error('Form validation failed');
                    } else {
                        playSound('success');
                        showNotification('🚀 Message sent successfully! Thanks for reaching out!', 'success');
                        form.reset();
                        [nameInput, emailInput, messageInput].forEach(input => {
                            toggleFieldError(input, false);
                        });
                    }
                });
            }
        })
        .catch(error => {
            console.error('Form submission error:', error);
            if (error.message === 'Form validation failed') {
                playSound('error');
                showNotification('Oops! There was a problem with your form submission. Please check your information and try again.', 'error');
            } else {
                playSound('success');
                showNotification('🚀 Message sent successfully! Thanks for reaching out!', 'success');
                form.reset();
                [nameInput, emailInput, messageInput].forEach(input => {
                    toggleFieldError(input, false);
                });
            }
        })
        .finally(() => {
            submitBtn.querySelector('span').textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        });
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    const autoRemoveTime = type === 'success' ? 6000 : 4000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, autoRemoveTime);

    // Manual close
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Ripple effect for buttons
function initRippleEffect() {
    document.querySelectorAll('.cyber-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = this.querySelector('.ripple');
            if (ripple) {
                ripple.style.width = '0';
                ripple.style.height = '0';
                
                setTimeout(() => {
                    ripple.style.width = '300px';
                    ripple.style.height = '300px';
                }, 0);
                
                setTimeout(() => {
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                }, 600);
            }
        });
    });
}

// Konami Code Easter Egg
function initKonamiCode() {
    document.addEventListener('keydown', function(e) {
        if (e.code === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerKonamiEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
}

function triggerKonamiEasterEgg() {
    // Play special sound sequence
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            playSound('success', 1000 + (i * 200), 200);
        }, i * 100);
    }
    
    // Matrix rain effect with current theme colors
    const matrix = document.createElement('div');
    matrix.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.8);
    `;

    const chars = '01KRISHNASONI🤖🐍🧠';
    const theme = themes[currentTheme];
    
    for (let i = 0; i < 50; i++) {
        const column = document.createElement('div');
        column.style.cssText = `
            position: absolute;
            top: -100px;
            left: ${Math.random() * 100}%;
            color: ${theme.primary};
            font-family: monospace;
            font-size: 20px;
            animation: matrixFall ${2 + Math.random() * 3}s linear infinite;
        `;
        
        let text = '';
        for (let j = 0; j < 20; j++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
        }
        column.innerHTML = text;
        matrix.appendChild(column);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes matrixFall {
            to { transform: translateY(100vh); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(matrix);

    setTimeout(() => {
        showNotification(`🎮 KONAMI CODE ACTIVATED! 🎮<br>Bot Developer Mode Unlocked!<br>Theme: ${themes[currentTheme].name}`, 'success');
    }, 1000);

    setTimeout(() => {
        matrix.remove();
        style.remove();
    }, 5000);
}

// Mouse parallax effect
function initParallax() {
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - window.innerWidth / 2;
        mouseY = e.clientY - window.innerHeight / 2;
    });

    function updateParallax() {
        targetX += (mouseX - targetX) * 0.02;
        targetY += (mouseY - targetY) * 0.02;

        const orbitIcons = document.querySelectorAll('.orbit-icon');
        orbitIcons.forEach((icon, index) => {
            const depth = (index + 1) * 0.3;
            const moveX = targetX * depth * 0.005;
            const moveY = targetY * depth * 0.005;
            
            const currentTransform = icon.style.transform || '';
            if (!currentTransform.includes('translate')) {
                icon.style.transform = `${currentTransform} translate(${moveX}px, ${moveY}px)`;
            }
        });

        requestAnimationFrame(updateParallax);
    }

    updateParallax();
}

// Error handling
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('WebGL')) {
        console.warn('WebGL not supported, falling back to CSS animations');
        const canvas = document.getElementById('bg-canvas');
        if (canvas) canvas.style.display = 'none';
    }
});

// Intersection Observer fallback
if ('IntersectionObserver' in window) {
    // Enhanced animations are already initialized above
} else {
    document.querySelectorAll('.fade-in').forEach(el => {
        el.classList.add('visible');
    });
}