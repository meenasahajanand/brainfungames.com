/**
 * Universal Image Loader
 * Immediately loads all images with data-load attribute
 * Fixes paths to work from any location (explore/, game/, etc.)
 */
(function() {
    'use strict';
    
    // Function to get current file location
    function getFileLocation() {
        var href = window.location.href;
        var pathname = window.location.pathname;
        
        // Handle file:// protocol (local files)
        if (href.startsWith('file://')) {
            try {
                var filePath = decodeURIComponent(href.replace(/^file:\/\/\//, ''));
                filePath = filePath.replace(/\\/g, '/');
                var parts = filePath.split('/');
                // Remove filename
                if (parts.length > 0 && parts[parts.length - 1].endsWith('.html')) {
                    parts.pop();
                }
                return {
                    fullPath: filePath,
                    parts: parts.filter(function(p) { return p && p !== ''; }),
                    isFileProtocol: true
                };
            } catch (e) {
                console.warn('Error parsing file path:', e);
            }
        }
        
        // Handle http/https
        try {
            var url = new URL(href);
            var path = url.pathname;
            var parts = path.split('/').filter(function(p) { return p && p !== ''; });
            // Remove filename
            if (parts.length > 0 && parts[parts.length - 1].endsWith('.html')) {
                parts.pop();
            }
            return {
                fullPath: path,
                parts: parts,
                isFileProtocol: false
            };
        } catch (e) {
            // Fallback
            var parts = (pathname || '').split('/').filter(function(p) { return p && p !== ''; });
            if (parts.length > 0 && parts[parts.length - 1].endsWith('.html')) {
                parts.pop();
            }
            return {
                fullPath: pathname || '',
                parts: parts,
                isFileProtocol: false
            };
        }
    }
    
    // Function to fix image paths
    function fixImagePath(originalPath) {
        // If path already starts with http:// or https://, return as is
        if (originalPath.startsWith('http://') || originalPath.startsWith('https://')) {
            return originalPath;
        }
        
        var location = getFileLocation();
        var dirParts = location.parts;
        var path = originalPath;
        
        // Find directory indices
        var exploreIndex = -1;
        var gameIndex = -1;
        for (var i = 0; i < dirParts.length; i++) {
            if (dirParts[i] === 'explore' && exploreIndex === -1) {
                exploreIndex = i;
            }
            if (dirParts[i] === 'game' && gameIndex === -1) {
                gameIndex = i;
            }
        }
        
        var isInExplore = exploreIndex >= 0;
        var isInExploreGame = isInExplore && gameIndex > exploreIndex;
        var isInRootGame = gameIndex >= 0 && !isInExplore;
        
        // Handle absolute paths (starting with /)
        if (path.startsWith('/')) {
            path = path.substring(1); // Remove leading slash
            
            // Images are always in explore/images/
            if (isInExploreGame) {
                // From explore/game/file.html -> ../../images/...
                return '../../images/' + path.replace(/^images\//, '');
            } else if (isInExplore) {
                // From explore/file.html -> images/...
                return 'images/' + path.replace(/^images\//, '');
            } else if (isInRootGame) {
                // From game/file.html -> ../explore/images/...
                return '../explore/images/' + path.replace(/^images\//, '');
            } else {
                // From root -> explore/images/...
                return 'explore/images/' + path.replace(/^images\//, '');
            }
        }
        
        // Handle relative paths starting with ../
        if (path.startsWith('../')) {
            // Already relative, use as is
            return path;
        }
        
        // Handle relative paths starting with ./
        if (path.startsWith('./')) {
            path = path.substring(2);
        }
        
        // Handle other relative paths
        if (!path.startsWith('../') && !path.startsWith('images/')) {
            if (isInExplore && !isInExploreGame) {
                // In explore/, add images/ prefix
                return 'images/' + path;
            } else if (isInExploreGame) {
                // In explore/game/, add ../../images/ prefix
                return '../../images/' + path;
            }
        }
        
        return path;
    }
    
    // Function to immediately load all images
    function loadAllImages() {
        var images = document.querySelectorAll('img[data-load]');
        var loadedCount = 0;
        var totalCount = images.length;
        
        images.forEach(function(img) {
            // Skip if already loaded
            if (img.dataset.loaded === 'true') {
                loadedCount++;
                return;
            }
            
            var dataLoadPath = img.getAttribute('data-load');
            if (!dataLoadPath) {
                return;
            }
            
            // Fix the path
            var fixedPath = fixImagePath(dataLoadPath);
            
            // Set src attribute to load image immediately
            // Also show image immediately (in case CSS has display:none)
            img.style.display = 'block';
            img.style.visibility = 'visible';
            img.style.opacity = '1';
            img.src = fixedPath;
            img.setAttribute('data-loaded', 'true');
            
            // Handle image load
            img.onload = function() {
                loadedCount++;
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
            
            // Handle image error - try alternative paths
            img.onerror = function() {
                var originalPath = dataLoadPath;
                var triedPaths = [fixedPath];
                
                // Try original path if different
                if (originalPath !== fixedPath && !originalPath.startsWith('http')) {
                    this.src = originalPath;
                    triedPaths.push(originalPath);
                } else if (originalPath.startsWith('/images/')) {
                    // Try explore/images/ directly
                    var altPath = 'explore' + originalPath;
                    if (triedPaths.indexOf(altPath) === -1) {
                        this.src = altPath;
                        triedPaths.push(altPath);
                    }
                }
            };
        });
    }
    
    // Load images immediately when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadAllImages();
        });
    } else {
        // DOM is already ready
        loadAllImages();
    }
    
    // Also load images after short delays to catch dynamically added images
    setTimeout(loadAllImages, 50);
    setTimeout(loadAllImages, 200);
    setTimeout(loadAllImages, 500);
})();
