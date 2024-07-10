document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-menu');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const blogContainer = document.getElementById('blog-posts');

    // Function to fetch blog posts from JSON file
    async function fetchBlogPosts() {
        try {
            const response = await fetch('blog-posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            throw error; // Re-throw the error for the calling function to handle
        }
    }

    // Function to create a blog post element
    function createBlogPost(blog) {
        const blogPost = document.createElement('article');
        blogPost.classList.add('blog-post');

        blogPost.innerHTML = `
            <h3>${blog.title}</h3>
            <p class="date">Published on ${new Date(blog.date).toLocaleDateString()}</p>
            <p>${blog.summary}</p>
            <button class="btn btn-outline read-more" data-id="${blog.id}">Read More</button>
        `;
        
        return blogPost;
    }

    // Function to render all blog posts
    async function renderBlogPosts() {
        // Show loading state
        blogContainer.innerHTML = '<p>Loading blog posts...</p>';

        try {
            const blogPosts = await fetchBlogPosts();
            blogContainer.innerHTML = ''; // Clear loading message
            const fragment = document.createDocumentFragment();
            blogPosts.forEach(blog => {
                const blogPostElement = createBlogPost(blog);
                fragment.appendChild(blogPostElement);
            });
            blogContainer.appendChild(fragment);

            // Add event listeners to "Read More" buttons
            blogContainer.querySelectorAll('.read-more').forEach(button => {
                button.addEventListener('click', () => showFullPost(button.dataset.id));
            });
        } catch (error) {
            console.error('Error rendering blog posts:', error);
            blogContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
        }
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
            const blogPosts = await fetchBlogPosts();
            const post = blogPosts.find(post => post.id.toString() === id);
            
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
                        figure.appendChild(createElement('img', { src: item.url, alt: item.alt }));
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

            modal.style.display = 'block';
        } catch (error) {
            console.error('Error showing full post:', error);
            alert('Failed to load the full post. Please try again later.');
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Initialize dark mode
    function initDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
        } else if (savedDarkMode === 'false') {
            document.body.classList.remove('dark-mode');
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

    // Initialize dark mode and render blog posts
    initDarkMode();
    renderBlogPosts();
});