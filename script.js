// Utility function to create a loading indicator
function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('loading-indicator');
    indicator.textContent = 'Loading...';
    return indicator;
}

// Utility function for lazy loading images
function lazyLoadImage(img) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });
    observer.observe(img);
}

// Function to check system preference for dark mode
function prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

document.addEventListener('DOMContentLoaded', async () => {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-menu');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const blogContainer = document.getElementById('blog-posts');
    const searchInput = document.getElementById('blog-search');
    const filterSelect = document.getElementById('blog-filter');
    const backToTopButton = document.getElementById('back-to-top');

    let allBlogPosts = [];

    // Function to fetch blog posts from JSON file
    async function fetchBlogPosts() {
        const loadingIndicator = createLoadingIndicator();
        blogContainer.appendChild(loadingIndicator);

        try {
            const response = await fetch('blog-posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            blogContainer.removeChild(loadingIndicator);
            return data;
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            blogContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
            throw error;
        }
    }

    // Function to create a blog post element
    function createBlogPost(blog) {
        const blogPost = document.createElement('article');
        blogPost.classList.add('blog-post');

        const img = document.createElement('img');
        img.classList.add('blog-post-image');
        img.dataset.src = blog.imageUrl; // Use data-src for lazy loading
        img.alt = blog.imageAlt || '';
        lazyLoadImage(img);

        blogPost.innerHTML = `
            <h3>${blog.title}</h3>
            <p class="date">Published on ${new Date(blog.date).toLocaleDateString()}</p>
            <p>${blog.summary}</p>
            <p class="tags">${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</p>
            <button class="btn btn-outline read-more" data-id="${blog.id}">Read More</button>
        `;
        
        blogPost.insertBefore(img, blogPost.firstChild);
        return blogPost;
    }

    // Function to render blog posts
    function renderBlogPosts(posts) {
        blogContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        posts.forEach(blog => {
            const blogPostElement = createBlogPost(blog);
            fragment.appendChild(blogPostElement);
        });
        blogContainer.appendChild(fragment);

        // Add event listeners to "Read More" buttons
        blogContainer.querySelectorAll('.read-more').forEach(button => {
            button.addEventListener('click', () => showFullPost(button.dataset.id));
        });
    }

    // Function to filter and search blog posts
    function filterAndSearchPosts() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterTag = filterSelect.value;

        const filteredPosts = allBlogPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchTerm) || 
                                  post.summary.toLowerCase().includes(searchTerm) ||
                                  post.content.some(item => item.type === 'text' && item.content.toLowerCase().includes(searchTerm));
            const matchesFilter = filterTag === 'all' || post.tags.includes(filterTag);
            return matchesSearch && matchesFilter;
        });

        renderBlogPosts(filteredPosts);
    }

    // Function to populate filter options
    function populateFilterOptions(posts) {
        const allTags = new Set();
        posts.forEach(post => post.tags.forEach(tag => allTags.add(tag)));

        filterSelect.innerHTML = '<option value="all">All Tags</option>';
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterSelect.appendChild(option);
        });
    }

    // Function to create DOM elements
    function createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        return element;
    }

    // Function to show full blog post in a modal
    async function showFullPost(id) {
        try {
            const post = allBlogPosts.find(post => post.id.toString() === id);
            
            if (!post) throw new Error('Post not found');

            const modal = createElement('div', { class: 'modal' });
            const modalContent = createElement('div', { class: 'modal-content' });
            
            modalContent.appendChild(createElement('span', { class: 'close', textContent: '×' }));
            modalContent.appendChild(createElement('h2', { textContent: post.title }));
            modalContent.appendChild(createElement('p', { class: 'date', textContent: `Published on ${new Date(post.date).toLocaleDateString()}` }));

            const postContent = createElement('div', { class: 'post-content' });
            post.content.forEach(item => {
                switch (item.type) {
                    case 'text':
                        postContent.appendChild(createElement('p', { textContent: item.content }));
                        break;
                    case 'heading':
                        postContent.appendChild(createElement('h3', { textContent: item.content }));
                        break;
                    case 'image':
                        const figure = createElement('figure');
                        const img = createElement('img', { 'data-src': item.url, alt: item.alt });
                        lazyLoadImage(img);
                        figure.appendChild(img);
                        figure.appendChild(createElement('figcaption', { textContent: item.caption }));
                        postContent.appendChild(figure);
                        break;
                    // Add more cases for other content types as needed
                }
            });

            modalContent.appendChild(postContent);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Close modal functionality
            const closeBtn = modal.querySelector('.close');
            closeBtn.onclick = () => document.body.removeChild(modal);
            window.onclick = (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            };

            // Implement keyboard navigation for the modal
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                }
            });

            modal.style.display = 'block';
            closeBtn.focus(); // Focus on close button for accessibility
        } catch (error) {
            console.error('Error showing full post:', error);
            alert('Failed to load the full post. Please try again later.');
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        updateDarkModeToggle();
    }

    // Initialize dark mode
    function initDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === null) {
            // If no preference is saved, use system preference
            if (prefersDarkMode()) {
                document.body.classList.add('dark-mode');
            }
        } else if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
        }
        updateDarkModeToggle();
    }

    function updateDarkModeToggle() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('show');
            menuToggle.setAttribute('aria-expanded', nav.classList.contains('show'));
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to top button functionality
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Initialize blog posts, search, and filter
    async function initBlog() {
        try {
            allBlogPosts = await fetchBlogPosts();
            renderBlogPosts(allBlogPosts);
            populateFilterOptions(allBlogPosts);

            searchInput.addEventListener('input', filterAndSearchPosts);
            filterSelect.addEventListener('change', filterAndSearchPosts);
        } catch (error) {
            console.error('Error initializing blog:', error);
        }
    }

    // Initialize dark mode and blog
    initDarkMode();
    initBlog();

    // Listen for changes in system color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            updateDarkModeToggle();
        }
    });
});