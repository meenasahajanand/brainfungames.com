/**
 * Universal Image Loader
 * Immediately loads all images with data-load attribute
 * Fixes paths to work from any location (explore/, game/, etc.)
 */
(function() {
    'use strict';
    
    // Function to fix image paths to work from any file location
    function fixImagePath(path) {
        // If path already starts with http:// or https://, return as is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        // Get current file path
        var currentPath = window.location.pathname || window.location.href;
        var pathParts = currentPath.split('/').filter(function(p) { return p && p !== ''; });
        
        // Remove the HTML filename
        if (pathParts.length > 0 && pathParts[pathParts.length - 1].endsWith('.html')) {
            pathParts.pop();
        }
        
        // If path starts with /, it's absolute - convert to relative
        if (path.startsWith('/')) {
            // Remove leading slash
            path = path.substring(1);
            // Check if we're in explore or game directory
            var exploreIndex = pathParts.indexOf('explore');
            var gameIndex = pathParts.indexOf('game');
            var inExplore = exploreIndex >= 0;
            var inGame = gameIndex >= 0;
            
            if (inExplore && inGame) {
                // We're in explore/game/, so /images becomes ../../images
                return '../../' + path;
            } else if (inExplore) {
                // We're in explore/, so /images becomes images (same directory)
                // Images are in explore/images/, so from explore/index.html it should be images/...
                return path;
            } else if (inGame) {
                // We're in root game/, so /images should point to explore/images
                // But images might be in explore/images, so try that first
                if (path.startsWith('images/')) {
                    return '../explore/' + path;
                }
                return '../' + path;
            } else {
                // Root level, try explore/images first
                if (path.startsWith('images/')) {
                    return 'explore/' + path;
                }
                return path;
            }
        }
        
        // If path starts with ../, it's already relative - use as is
        if (path.startsWith('../')) {
            return path;
        }
        
        // If path starts with ./, remove it
        if (path.startsWith('./')) {
            path = path.substring(2);
        }
        
        // For other relative paths, calculate from current location
        var newPath = pathParts.join('/') + '/' + path;
        newPath = newPath.replace(/\/+/g, '/');
        if (newPath.startsWith('/')) {
            newPath = newPath.substring(1);
        }
        
        return newPath;
    }
    
    // Function to immediately load all images
    function loadAllImages() {
        var images = document.querySelectorAll('img[data-load]');
        
        images.forEach(function(img) {
            // Skip if already loaded
            if (img.dataset.loaded === 'true') {
                return;
            }
            
            var dataLoadPath = img.getAttribute('data-load');
            if (!dataLoadPath) {
                return;
            }
            
            // Fix the path
            var fixedPath = fixImagePath(dataLoadPath);
            
            // Set src attribute to load image immediately
            img.src = fixedPath;
            img.setAttribute('data-loaded', 'true');
            
            // Handle image load
            img.onload = function() {
                this.style.display = 'block';
                this.style.visibility = 'visible';
                this.style.opacity = '1';
                // Hide loader if present
                var loader = this.parentElement.querySelector('.loader');
                if (loader) {
                    loader.style.display = 'none';
                }
                var loadingImg = this.parentElement.querySelector('.loading-img');
                if (loadingImg) {
                    loadingImg.style.display = 'none';
                }
            };
            
            // Handle image error - try original path as fallback
            img.onerror = function() {
                var originalPath = dataLoadPath;
                // If fixed path is different, try original
                if (originalPath !== fixedPath && !originalPath.startsWith('http')) {
                    this.src = originalPath;
                }
            };
        });
    }
    
    // Load images immediately when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllImages);
    } else {
        // DOM is already ready
        loadAllImages();
    }
    
    // Also load images after short delays to catch dynamically added images
    setTimeout(loadAllImages, 50);
    setTimeout(loadAllImages, 200);
    setTimeout(loadAllImages, 500);
})();

