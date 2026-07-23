/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(document).ready(function () {
  var themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

  var initializeCinematicIntro = function () {
    var root = document.documentElement;
    var intro = document.querySelector("[data-cinematic-intro]");
    var skipButton = document.querySelector("[data-cinematic-skip]");
    var replayButton = document.querySelector("[data-cinematic-replay]");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!intro || !skipButton || !replayButton) {
      return;
    }

    var isActive = function () {
      return root.classList.contains("cinematic-intro-pending");
    };

    var finish = function () {
      if (!isActive()) {
        return;
      }

      root.classList.remove("cinematic-intro-pending");
      root.classList.add("cinematic-intro-complete");
      intro.setAttribute("aria-hidden", "true");
    };

    var replay = function () {
      if (reduceMotion.matches) {
        return;
      }

      root.classList.remove("cinematic-intro-complete");
      intro.removeAttribute("aria-hidden");

      // Removing and restoring the state class restarts the bounded CSS timeline.
      void intro.offsetWidth;
      root.classList.add("cinematic-intro-pending");
    };

    if (reduceMotion.matches) {
      root.classList.remove("cinematic-intro-pending");
      intro.setAttribute("aria-hidden", "true");
    } else if (isActive()) {
      intro.removeAttribute("aria-hidden");
    } else {
      root.classList.add("cinematic-intro-complete");
      intro.setAttribute("aria-hidden", "true");
    }

    intro.addEventListener("click", finish);
    skipButton.addEventListener("click", finish);
    replayButton.addEventListener("click", replay);

    intro.addEventListener("animationend", function (event) {
      if (event.target === intro && event.animationName === "cinematic-intro-shell") {
        finish();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        finish();
      }
    });

    document.addEventListener("focusin", function (event) {
      if (isActive() && !intro.contains(event.target)) {
        finish();
      }
    });

    var handleMotionPreference = function (event) {
      if (event.matches) {
        finish();
      }
    };

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", handleMotionPreference);
    } else if (reduceMotion.addListener) {
      reduceMotion.addListener(handleMotionPreference);
    }
  };

  initializeCinematicIntro();

  var getStoredTheme = function () {
    try {
      return window.localStorage.getItem("theme");
    } catch (error) {
      return null;
    }
  };

  var storeTheme = function (theme) {
    try {
      window.localStorage.setItem("theme", theme);
    } catch (error) {
      // The selected theme still applies for this page when storage is blocked.
    }
  };

  var setTheme = function (theme) {
    var selectedTheme =
      theme ||
      getStoredTheme() ||
      $("html").attr("data-theme") ||
      (themeMedia.matches ? "dark" : "light");
    var isDark = selectedTheme === "dark";

    if (isDark) {
      $("html").attr("data-theme", "dark");
      $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
    } else {
      $("html").removeAttr("data-theme");
      $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
    }

    $("#theme-toggle")
      .attr("aria-pressed", isDark)
      .attr("aria-label", isDark ? "Use light theme" : "Use dark theme");
  };

  setTheme();

  var followSystemTheme = function (event) {
    if (!getStoredTheme()) {
      setTheme(event.matches ? "dark" : "light");
    }
  };

  if (themeMedia.addEventListener) {
    themeMedia.addEventListener("change", followSystemTheme);
  } else if (themeMedia.addListener) {
    themeMedia.addListener(followSystemTheme);
  }

  var toggleTheme = function () {
    var newTheme = $("html").attr("data-theme") === "dark" ? "light" : "dark";
    storeTheme(newTheme);
    setTheme(newTheme);
  };

  $("#theme-toggle").on("click", toggleTheme);

  // These should be the same as the settings in _variables.scss
  const scssLarge = 925; // pixels

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    var $button = $(this);
    $(".author__urls").fadeToggle("fast", function () {
      $button.attr("aria-expanded", $(this).is(":visible"));
    });
    $button.toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block');
      $(".author__urls-wrapper button").attr("aria-expanded", true);
    }
  });

  // Smooth only same-page fragment links.
  $("a[href^='#']:not([href='#'])").smoothScroll({
    offset: -75,
    preventDefault: false,
  });

  // add lightbox class to all image links
  // Add "image-popup" to links ending in image extensions,
  // but skip any <a> that already contains an <img>
  $("a[href$='.jpg'],\
  a[href$='.jpeg'],\
  a[href$='.JPG'],\
  a[href$='.png'],\
  a[href$='.gif'],\
  a[href$='.webp']")
      .not(':has(img)')
      .addClass("image-popup");

  // 1) Wrap every <p><img> (except emoji images) in an <a> pointing at the image, and give it the lightbox class
  $('p > img').not('.emoji').each(function() {
    var $img = $(this);
    // skip if it’s already wrapped in an <a.image-popup>
    if ( ! $img.parent().is('a.image-popup') ) {
      var $link = $('<a>')
        .addClass('image-popup')
        .attr('href', $img.attr('src'));
      var alignmentClass = ['align-left', 'align-right', 'align-center'].find(function (className) {
        return $img.hasClass(className);
      });

      if (alignmentClass) {
        $link.addClass('image-popup--' + alignmentClass);
        $img.removeClass(alignmentClass);
      }

      $link
        .attr('aria-label', 'Open image: ' + ($img.attr('alt') || 'preview'))
        .insertBefore($img)   // place the <a> right before the <img>
        .append($img);        // move the <img> into the <a>
    }
  });

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 200,
    // Scope the matching open and close transitions in the motion stylesheet.
    mainClass: 'mfp-zoom-in',
    callbacks: {
      beforeOpen: function () {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
      }
    },
    closeOnContentClick: true,
    midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

});
