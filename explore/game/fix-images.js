// Global image loader/fallback to keep cards and screenshots visible
(function () {
    var fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgbG9hZGVkPC90ZXh0Pjwvc3ZnPg==';

    function hideLoader(img) {
        var loader = img.parentElement && img.parentElement.querySelector('.loader');
        if (loader) loader.style.display = 'none';
    }

    // Try alternate paths if the first request 404s (e.g., if assets live in /games instead of /images/games)
    function tryAlternatePath(img) {
        var original = img.dataset.load;
        if (!original || img.dataset.triedAlt) return false;

        // Build a small list of possible alternates
        var candidates = [];
        // Absolute-from-root for relative ../../images/... -> /images/...
        var absolute = original.replace(/^(\.{2}\/)+/, '/');
        if (absolute !== original) candidates.push(absolute);
        // Swap images -> games in case assets are deployed under /games/...
        var swapped = original.replace('images/', 'games/');
        if (swapped !== original) candidates.push(swapped);
        // Absolute + swapped
        if (absolute !== swapped) {
            var absoluteSwapped = absolute.replace('images/', 'games/');
            if (absoluteSwapped !== swapped) candidates.push(absoluteSwapped);
        }

        var next = candidates.find(function (c) { return c && c !== img.src; });
        if (next) {
            img.dataset.triedAlt = 'true';
            img.src = next;
            return true;
        }
        return false;
    }

    function showImage(img) {
        if (!img || img.dataset.loaded) return;

        img.dataset.loaded = 'true';
        img.style.display = 'block';

        img.onerror = function () {
            img.onerror = null;
            if (tryAlternatePath(img)) return;
            img.src = fallbackSrc;
            hideLoader(img);
        };

        img.onload = function () {
            hideLoader(img);
        };

        img.src = img.dataset.load || fallbackSrc;
    }

    function loadIfVisible(img, margin) {
        var rect = img.getBoundingClientRect();
        return rect.bottom >= -margin && rect.top <= (document.documentElement.clientHeight + margin);
    }

    function eagerLoadVisible() {
        document.querySelectorAll('img[data-load]:not([data-loaded])').forEach(function (img) {
            if (loadIfVisible(img, 200)) showImage(img);
        });
    }

    function fallbackSweep() {
        document.querySelectorAll('img[data-load]:not([data-loaded])').forEach(showImage);
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    showImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '200px 0px' });

        document.querySelectorAll('img[data-load]').forEach(function (img) {
            observer.observe(img);
        });
    } else {
        eagerLoadVisible();
        window.addEventListener('scroll', eagerLoadVisible);
        window.addEventListener('resize', eagerLoadVisible);
    }

    // Safety sweep: ensure nothing stays in a loading state
    setTimeout(fallbackSweep, 3000);
})();

