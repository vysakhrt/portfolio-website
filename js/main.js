/**
 * VYSAKH RAJU PORTFOLIO — MAIN JS
 * Features:
 *   1. WebGL background (Three.js particle field with mouse interaction)
 *   2. Custom cursor (magnetic, hover states)
 *   3. Scroll reveal animations (IntersectionObserver)
 *   4. Navbar scroll behavior & active link tracking
 *   5. Typing effect
 *   6. Magnetic hover elements
 *   7. Mobile menu
 *   8. Back to top button
 */

/* ==============================================
   1. WEBGL BACKGROUND — PARTICLE FIELD
   ============================================== */
(function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    let W = window.innerWidth;
    let H = window.innerHeight;
    let mouse = { x: 0.5, y: 0.5 };
    let targetMouse = { x: 0.5, y: 0.5 };
    let time = 0;

    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);

    // VERTEX SHADER
    const vsSource = `
        attribute vec2 a_position;
        attribute float a_size;
        attribute vec3 a_color;
        attribute float a_speed;
        attribute float a_phase;

        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;

        varying vec3 v_color;
        varying float v_alpha;

        void main() {
            vec2 pos = a_position;

            // Wave motion
            pos.x += sin(u_time * a_speed + a_phase) * 0.03;
            pos.y += cos(u_time * a_speed * 0.7 + a_phase * 1.3) * 0.02;

            // Mouse repulsion
            vec2 mouseWorld = u_mouse * 2.0 - 1.0;
            float aspect = u_resolution.x / u_resolution.y;
            vec2 diff = pos - mouseWorld;
            diff.x *= aspect;
            float dist = length(diff);
            float repel = 1.0 / (dist * dist + 0.15);
            pos += normalize(diff) * repel * 0.015;

            v_color = a_color;
            v_alpha = 0.4 + 0.5 * abs(sin(u_time * a_speed * 0.5 + a_phase));

            gl_Position = vec4(pos, 0.0, 1.0);
            gl_PointSize = a_size * (1.0 + 0.3 * sin(u_time + a_phase));
        }
    `;

    // FRAGMENT SHADER
    const fsSource = `
        precision mediump float;
        varying vec3 v_color;
        varying float v_alpha;

        void main() {
            // Soft circular point
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;

            float alpha = v_alpha * (1.0 - r * r);
            gl_FragColor = vec4(v_color, alpha);
        }
    `;

    function createShader(gl, type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn('Shader error:', gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('Program error:', gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    // Particle data
    const COUNT = 180;
    const positions = new Float32Array(COUNT * 2);
    const sizes     = new Float32Array(COUNT);
    const colors    = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const phases    = new Float32Array(COUNT);

    // Palette: purple, blue, teal
    const palette = [
        [0.486, 0.361, 0.988], // #7c5cfc
        [0.310, 0.675, 0.996], // #4facfe
        [0.000, 0.949, 0.765], // #00f2c3
    ];

    for (let i = 0; i < COUNT; i++) {
        // Distribute mostly across full canvas
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 1.4;
        positions[i * 2]     = Math.cos(angle) * radius * (W / H < 1 ? 1 : W / H * 0.7);
        positions[i * 2 + 1] = Math.sin(angle) * radius;

        // Clamp to [-1, 1]
        positions[i * 2]     = (Math.random() * 2 - 1) * 1.1;
        positions[i * 2 + 1] = (Math.random() * 2 - 1) * 1.1;

        sizes[i]    = 1.5 + Math.random() * 4;
        speeds[i]   = 0.2 + Math.random() * 0.8;
        phases[i]   = Math.random() * Math.PI * 2;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3]     = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
    }

    function createBuffer(data, attrib, size) {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, attrib);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        return buf;
    }

    createBuffer(positions, 'a_position', 2);
    createBuffer(sizes,     'a_size',     1);
    createBuffer(colors,    'a_color',    3);
    createBuffer(speeds,    'a_speed',    1);
    createBuffer(phases,    'a_phase',    1);

    const uTime       = gl.getUniformLocation(program, 'u_time');
    const uMouse      = gl.getUniformLocation(program, 'u_mouse');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.02, 0.02, 0.03, 1.0);

    gl.uniform2f(uResolution, W, H);

    function render(ts) {
        time = ts * 0.0006;

        // Smooth mouse
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, time);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.POINTS, 0, COUNT);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX / W;
        targetMouse.y = 1 - e.clientY / H;
    });

    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        gl.viewport(0, 0, W, H);
        gl.uniform2f(uResolution, W, H);
    });
})();


/* ==============================================
   2. CUSTOM CURSOR
   ============================================== */
(function initCursor() {
    const ring = document.getElementById('cursor-ring');
    const dot  = document.getElementById('cursor-dot');
    if (!ring || !dot) return;

    let ringX = 0, ringY = 0;
    let dotX  = 0, dotY  = 0;
    let curX  = 0, curY  = 0;

    document.addEventListener('mousemove', (e) => {
        curX = e.clientX;
        curY = e.clientY;
        dot.style.transform  = `translate(${curX}px, ${curY}px)`;
    });

    function animCursor() {
        ringX += (curX - ringX) * 0.12;
        ringY += (curY - ringY) * 0.12;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        requestAnimationFrame(animCursor);
    }
    animCursor();

    const hoverEls = document.querySelectorAll('a, button, .magnetic, .skill-card, .project-card, .tech-pill, .contact-link-item, .social-link');
    hoverEls.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mouseleave', () => {
        ring.style.opacity = '0';
        dot.style.opacity  = '0';
    });
    document.addEventListener('mouseenter', () => {
        ring.style.opacity = '1';
        dot.style.opacity  = '1';
    });
})();


/* ==============================================
   3. TYPING EFFECT
   ============================================== */
(function initTyping() {
    const el = document.getElementById('typing-text');
    if (!el) return;

    const phrases = [
        'Python Developer',
        'AI Systems Engineer',
        'Gen AI Enthusiast',
        'Backend Specialist',
        'LLM & RAG Builder',
    ];

    let phraseIndex = 0;
    let charIndex   = 0;
    let isDeleting  = false;
    let speed       = 100;

    function type() {
        const phrase = phrases[phraseIndex];

        if (isDeleting) {
            el.textContent = phrase.substring(0, charIndex - 1);
            charIndex--;
            speed = 40;
        } else {
            el.textContent = phrase.substring(0, charIndex + 1);
            charIndex++;
            speed = 90;
        }

        if (!isDeleting && charIndex === phrase.length) {
            isDeleting = true;
            speed = 2200;
        } else if (isDeleting && charIndex === 0) {
            isDeleting   = false;
            phraseIndex  = (phraseIndex + 1) % phrases.length;
            speed = 400;
        }
        setTimeout(type, speed);
    }
    setTimeout(type, 800);
})();


/* ==============================================
   4. SCROLL REVEAL
   ============================================== */
(function initScrollReveal() {
    const els = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay || 0);
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
})();


/* ==============================================
   5. NAVBAR — SCROLL & ACTIVE LINK
   ============================================== */
(function initNavbar() {
    const navbar  = document.getElementById('navbar');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        // Scrolled class
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link
        let current = '';
        sections.forEach(section => {
            const sTop = section.offsetTop - 120;
            if (window.scrollY >= sTop) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
})();


/* ==============================================
   6. MOBILE MENU
   ============================================== */
(function initMobileMenu() {
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
})();


/* ==============================================
   7. MAGNETIC HOVER EFFECT
   ============================================== */
(function initMagnetic() {
    const magnets = document.querySelectorAll('.magnetic');

    magnets.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect   = el.getBoundingClientRect();
            const x      = e.clientX - rect.left - rect.width  / 2;
            const y      = e.clientY - rect.top  - rect.height / 2;
            const factor = 0.25;
            el.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
})();


/* ==============================================
   8. BACK TO TOP
   ============================================== */
(function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();


/* ==============================================
   9. CONTACT FORM
   ============================================== */
(function initContactForm() {
    const form = document.getElementById('contact-form');
    const btn  = document.getElementById('submit-btn');
    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalText = btn.querySelector('.btn-submit-text').textContent;
        btn.querySelector('.btn-submit-text').textContent = 'Sending...';
        btn.disabled = true;

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body:   new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                btn.querySelector('.btn-submit-text').textContent = '✓ Message Sent!';
                form.reset();
                setTimeout(() => {
                    btn.querySelector('.btn-submit-text').textContent = originalText;
                    btn.disabled = false;
                }, 4000);
            } else {
                throw new Error('Failed');
            }
        } catch {
            btn.querySelector('.btn-submit-text').textContent = 'Failed — Try Again';
            btn.disabled = false;
            setTimeout(() => {
                btn.querySelector('.btn-submit-text').textContent = originalText;
            }, 3000);
        }
    });
})();


/* ==============================================
   10. SMOOTH PARALLAX SECTIONS TILT
   ============================================== */
(function initParallax() {
    const cards = document.querySelectorAll('.project-card, .tech-bento-card, .experience-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
})();


/* ==============================================
   11. HORIZONTAL SCROLL PROGRESS INDICATOR
   ============================================== */
(function initScrollProgress() {
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        width: 0%;
        background: linear-gradient(90deg, #7c5cfc, #4facfe, #00f2c3);
        z-index: 9999;
        transition: width 0.1s ease;
        pointer-events: none;
    `;
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = pct + '%';
    }, { passive: true });
})();
