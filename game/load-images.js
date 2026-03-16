// Universal Image Loader - Loads all images immediately without lazy loading
(function() {
    'use strict';
    
    // Function to fix image paths
    function fixImagePath(path) {
        if (!path) return path;
        
        // If already absolute URL, return as is
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
            return path;
        }
        
        // If path starts with images/, make it absolute from /explore/
        if (path.startsWith('images/')) {
            return '/explore/' + path;
        }
        
        // If path starts with /, return as is
        if (path.startsWith('/')) {
            return path;
        }
        
        // Otherwise, assume it's relative to /explore/
        return '/explore/' + path;
    }
    
    // Function to load all images immediately
    function loadAllImages() {
        // Get all images with data-load attribute
        const lazyImages = document.querySelectorAll('img[data-load]');
        
        lazyImages.forEach(function(img) {
            // Skip if already loaded
            if (img.dataset.loaded === 'true' || img.src) {
                return;
            }
            
            // Get the image path
            let imgPath = img.getAttribute('data-load');
            
            if (!imgPath) return;
            
            // Fix the path
            imgPath = fixImagePath(imgPath);
            
            // Set up onload handler
            img.onload = function() {
                this.style.display = 'block';
                this.style.opacity = '1';
                this.style.visibility = 'visible';
                // Hide loader if exists
                const loader = this.parentElement.querySelector('.loader');
                if (loader) {
                    loader.style.display = 'none';
                }
            };
            
            // Set up onerror handler with fallback
            img.onerror = function() {
                const originalPath = this.getAttribute('data-load');
                if (originalPath) {
                    // Try alternative paths
                    if (this.src.includes('/explore/images/')) {
                        // Try without /explore/ prefix
                        this.src = originalPath;
                    } else if (originalPath.startsWith('images/')) {
                        // Try with /explore/ prefix
                        this.src = '/explore/' + originalPath;
                    }
                }
            };
            
            // Load the image immediately
            img.setAttribute('src', imgPath);
            img.setAttribute('data-loaded', 'true');
            img.style.display = 'block';
        });
        
        // Also handle regular img tags with src that might need fixing
        const regularImages = document.querySelectorAll('img[src]:not([data-load])');
        regularImages.forEach(function(img) {
            let src = img.getAttribute('src');
            if (src && src.startsWith('images/') && !src.startsWith('/explore/')) {
                img.src = fixImagePath(src);
            }
        });
    }
    
    // Load images immediately - run multiple times to catch all images
    loadAllImages();
    
    // Also run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllImages);
    } else {
        loadAllImages();
    }
    
    // Run again after a short delay to catch any dynamically added images
    setTimeout(loadAllImages, 100);
    setTimeout(loadAllImages, 500);
    
})();

