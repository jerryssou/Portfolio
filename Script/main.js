const nav = document.querySelector('.nav');
let scrollAnimation = null;

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function cancelScrollAnimation() {
    if (scrollAnimation) {
        cancelAnimationFrame(scrollAnimation);
        scrollAnimation = null;
    }
}

function scrollToY(target) {
    cancelScrollAnimation();
    const start = window.scrollY;
    const distance = target - start;
    if (Math.abs(distance) < 1) return;
    const duration = Math.min(2200, Math.max(900, Math.abs(distance) * 0.6));
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, start + distance * easeInOutCubic(progress));
        scrollAnimation = progress < 1 ? requestAnimationFrame(step) : null;
    }

    scrollAnimation = requestAnimationFrame(step);
}

['wheel', 'touchstart', 'keydown'].forEach((type) => {
    window.addEventListener(type, cancelScrollAnimation, { passive: true });
});

const hero = document.querySelector('.hero');
let updateHero = () => {};

if (hero && nav) {
    const fading = hero.querySelectorAll('.hero-fade');
    const arrow = hero.querySelector('.scroll-arrow');

    updateHero = () => {
        const progress = Math.min(window.scrollY / (window.innerHeight * 0.6), 1);
        fading.forEach((el) => {
            el.style.opacity = 1 - progress;
        });
        arrow.style.visibility = progress >= 1 ? 'hidden' : 'visible';
        nav.style.opacity = progress;
        nav.classList.toggle('nav-visible', progress > 0.3);
    };

    arrow.addEventListener('click', () => scrollToY(hero.offsetHeight));
}

window.addEventListener('scroll', updateHero, { passive: true });
window.addEventListener('resize', updateHero);
updateHero();

document.querySelectorAll('.carousel').forEach((carousel) => {
    const track = carousel.querySelector('.track');
    const row = carousel.querySelector('.track-row');
    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');

    function update() {
        const max = track.scrollWidth - track.clientWidth;
        carousel.classList.toggle('scrollable', max > 2);
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
    }

    function stepSize() {
        const image = row.querySelector('img');
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        return image.offsetWidth + gap;
    }

    prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
});

const lightbox = document.querySelector('.lightbox');

if (lightbox) {
    const image = lightbox.querySelector('.lightbox-img');
    const prev = lightbox.querySelector('.lightbox-prev');
    const next = lightbox.querySelector('.lightbox-next');
    const close = lightbox.querySelector('.lightbox-close');
    let group = [];
    let index = 0;
    let lastFocus = null;
    let touchStartX = null;

    function show() {
        const current = group[index];
        image.src = current.src;
        image.alt = current.alt;
        const single = group.length < 2;
        prev.hidden = single;
        next.hidden = single;
    }

    function open(images, startIndex) {
        group = images;
        index = startIndex;
        lastFocus = document.activeElement;
        show();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        close.focus();
    }

    function hide() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        if (lastFocus) lastFocus.focus();
    }

    function move(direction) {
        index = (index + direction + group.length) % group.length;
        show();
    }

    document.querySelectorAll('.map').forEach((map) => {
        const images = Array.from(map.querySelectorAll('.track img'));
        images.forEach((img, i) => {
            img.tabIndex = 0;
            img.addEventListener('click', () => open(images, i));
            img.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open(images, i);
                }
            });
        });
    });

    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    close.addEventListener('click', hide);

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.classList.contains('lightbox-figure')) hide();
    });

    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('open')) return;
        if (event.key === 'Escape') hide();
        if (event.key === 'ArrowLeft' && group.length > 1) move(-1);
        if (event.key === 'ArrowRight' && group.length > 1) move(1);
    });

    lightbox.addEventListener('touchstart', (event) => {
        touchStartX = event.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (event) => {
        if (touchStartX === null || group.length < 2) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1);
        touchStartX = null;
    });
}
