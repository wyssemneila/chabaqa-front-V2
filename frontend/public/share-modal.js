(function () {
  try {
    // Add multiple fallback strategies and robust null checks
    var shareButton = document.querySelector('[data-share-button]') || document.getElementById('share-button');

    if (shareButton && typeof shareButton.addEventListener === 'function') {
      shareButton.addEventListener('click', function () {
        try {
          var url = shareButton.getAttribute('data-share-url') || window.location.href;
          var title = shareButton.getAttribute('data-share-title') || document.title;

          if (navigator.share) {
            navigator.share({ title: title, url: url }).catch(function (err) {
              console.error('[ShareModal] Navigator share failed:', err);
            });
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
              console.log('[ShareModal] URL copied to clipboard');
            }).catch(function (err) {
              console.error('[ShareModal] Clipboard write failed:', err);
            });
          }
        } catch (innerError) {
          console.error('[ShareModal] Inner error:', innerError);
        }
      });
    }
  } catch (outerError) {
    console.error('[ShareModal] Outer error:', outerError);
  }
})();
