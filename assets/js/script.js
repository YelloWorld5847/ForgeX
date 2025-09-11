document.addEventListener('DOMContentLoaded', () => {

    // Mobile Navigation Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // On-Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));

    // Use Cases Tabs
    const tabsContainer = document.querySelector('.tabs');
    const tabPanes = document.querySelectorAll('.tab-pane');

    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const targetTab = e.target.dataset.tab;

                tabsContainer.querySelectorAll('.tab-button').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                tabPanes.forEach(pane => {
                    if (pane.id === targetTab) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });
            }
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Optional: Close all other items
            // faqItems.forEach(i => {
            //     i.classList.remove('active');
            //     i.querySelector('.faq-answer').style.maxHeight = 0;
            // });

            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = 0;
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Feather Icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});