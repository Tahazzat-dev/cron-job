jQuery(document).ready(function ($) {
  "use strict";

  const icon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 
      86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 
      41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 
      297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 
      342.6 150.6z"/>
    </svg>
  `;

  const sqrImg = `
    <img src="https://cdn-icons-png.flaticon.com/512/11775/11775880.png" style="max-height:20px" />
  `;

  let sidebarVisible = false;

  $('.sidebar-toggle').on('click', function () {
    if ($(window).width() <= 991) {
      const $sideNav = $('.panel-layout .side-nav');

      if (!sidebarVisible) {
        $sideNav.css({
          width: '100%',
          maxWidth: '450px'
        });
        $(this).html(icon);
      } else {
        $sideNav.css({
          width: '0',
          maxWidth: ''
        });
        $(this).html(sqrImg);
      }

      sidebarVisible = !sidebarVisible;
    }
  });

  function i(i) {
    var t = e(window).scrollTop();
    e(".menu li a").each(function () {
      var i = e(this),
        s = e(i.attr("href"));
      s.length &&
        (s.position().top <= t && s.position().top + s.height() > t
          ? (e(".menu li a").removeClass("_active"), i.addClass("_active"))
          : i.removeClass("_active"));
    });
  }
  e("#preloder").delay(1e3).fadeOut("slow"),
    e(".hamburger").click(function () {
      e(".mobile-nav").addClass("active"), e("body").addClass("nav-opened");
    }),
    e(".mobile-nav__close, .mobile-nav__list li a").click(function () {
      e(".mobile-nav").removeClass("active"),
        e("body").removeClass("nav-opened");
    }),
    e(window).width() >= 992 &&
      e(window).scroll(function () {
        e(this).scrollTop() > 600
          ? e(".header").addClass("sticky")
          : e(".header").removeClass("sticky");
      }),
    e(window).scroll(function () {
      e(this).scrollTop() > 100
        ? e(".scroll-up").fadeIn()
        : e(".scroll-up").fadeOut();
    }),
    e(".scroll-up__link").click(function (i) {
      var t = e(this);
      e("html, body")
        .stop()
        .animate(
          { scrollTop: e(t.attr("href"))?.offset()?.top + 2 },
          200,
          "swing"
        ),
        i.preventDefault();
    }),
    e(".go_to").click(function () {
      (elementClick = e(this).attr("href")),
        (destination = e(elementClick).offset().top),
        e("body,html").animate({ scrollTop: destination }, 900);
    }),
    e(window).on("scroll", i),
    e('.header > a[href^="#"]').click(function (t) {
      t.preventDefault(),
        e(window).off("scroll"),
        e("a").each(function () {
          e(this).removeClass("_active");
        }),
        e(this).addClass("_active");
      var s = this.hash,
        a = e(s);
      e("html, body")
        .stop()
        .animate(
          { scrollTop: a?.offset()?.top + 2 },
          500,
          "swing",
          function () {
            (window.location.hash = s), e(window).on("scroll", i);
          }
        );
    }),
    e(".sign-in-open").click(function () {
      e(".popup_sign-in").addClass("_active");
    });
  const t = [
    ".popup_sign-in",
    ".popup_sign-up",
    ".popup_reset",
    ".popup_subscribe",
  ];
  (e(".popup__overlay, .popup__close").click(function () {
    !(function (i) {
      i.forEach((i) => {
        e(i).removeClass("_active");
      });
    })(t);
  }),
  e(".sign-in__right").click(function () {
    e(".popup_sign-in").removeClass("_active"),
      setTimeout(function () {
        e(".popup_sign-up").addClass("_active");
      }, 500);
  }),
  e(".sign-up__right").click(function () {
    e(".popup_sign-up").removeClass("_active"),
      setTimeout(function () {
        e(".popup_sign-in").addClass("_active");
      }, 500);
  }),
  e(".js-form__forgot").click(function () {
    e(".popup_sign-in").removeClass("_active"),
      setTimeout(function () {
        e(".popup_reset").addClass("_active");
      }, 500);
  }),
  e(".ft-subscribe__btn").click(function () {
    e(".popup_subscribe").addClass("_active");
  }),
  e("*").is("#particles-js") &&
    particlesJS("particles-js", {
      particles: {
        number: { value: 110, density: { enable: !0, value_area: 1e3 } },
        color: { value: ["#fff", "#fff", "#fff", "#fff"] },
        shape: {
          type: "circle",
          stroke: { width: 0, color: "#fff" },
          polygon: { nb_sides: 5 },
          image: { src: "img/github.svg", width: 100, height: 100 },
        },
        opacity: {
          value: 0.6,
          random: !1,
          anim: { enable: !1, speed: 1, opacity_min: 0.1, sync: !1 },
        },
        size: {
          value: 2,
          random: !0,
          anim: { enable: !1, speed: 40, size_min: 0.1, sync: !1 },
        },
        line_linked: {
          enable: !0,
          distance: 120,
          color: "#bbb0b0",
          opacity: 0.4,
          width: 1,
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: !0, mode: "grab" },
          onclick: { enable: !1 },
          resize: !0,
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 1 } },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: { distance: 200, duration: 0.4 },
          push: { particles_nb: 4 },
          remove: { particles_nb: 2 },
        },
      },
      retina_detect: !0,
    }),
  e("*").is(".wow")) &&
    new WOW({ animateClass: "animate__animated", mobile: !1 }).init();
  if (e("*").is("#scene"))
    new Parallax(document.getElementById("scene"), { relativeInput: !0 });
  e("*").is(".blog-slider") &&
    e(".blog-slider").slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      arrows: !1,
      dots: !0,
      responsive: [
        { breakpoint: 1199.98, settings: { slidesToShow: 3 } },
        { breakpoint: 991.98, settings: { slidesToShow: 2 } },
        { breakpoint: 767.98, settings: { slidesToShow: 2 } },
        { breakpoint: 480, settings: { slidesToShow: 1 } },
      ],
    }),
    e("*").is(".graphic") &&
      e(".graphic").listtopie({
        size: "auto",
        drawType: "simple",
        strokeWidth: 0,
        hoverEvent: !0,
        hoverBorderColor: "#fff",
        hoverWidth: 8,
        fontFamily: "Cabin",
        fontWeight: "400",
        textSize: "16",
        marginCenter: 60,
        listVal: !0,
        strokeColor: "#fff",
        listValMouseOver: !0,
        infoText: !0,
        textColor: "#fff",
        setValues: !0,
        listValInsertClass: "graphic_list",
        backColorOpacity: "1",
        hoverSectorColor: !0,
        usePercent: !0,
      }),
    e(".faq__header").click(function (i) {
      i.preventDefault();
      var t = e(this).closest(".faq__item"),
        s = e(this).closest(".faq__item").find(".faq__content");
      e(this).closest(".faq").find(".faq__content").not(s).slideUp(),
        e(this).hasClass("_active")
          ? (e(this).removeClass("_active"), t.removeClass("_active"))
          : (e(this)
              .closest(".faq")
              .find(".faq__header._active, .faq__item._active")
              .removeClass("_active"),
            e(this).addClass("_active"),
            t.addClass("_active")),
        s.stop(!1, !0).slideToggle();
    });
}),
  $(document).ready(function () {
    $("[data-submit]").on("click", function (e) {
      e.preventDefault(), $(this).closest("form").submit();
    }),
      $.validator.addMethod(
        "regex",
        function (e, i, t) {
          var s = new RegExp(t);
          return this.optional(i) || s.test(e);
        },
        "Please check your input."
      ),
      $(".js-form").each(function () {
        $(this).validate({
          rules: { subscribe_email: { required: !0, email: !0 } },
          messages: {
            subscribe_email: {
              required: "Required field",
              email: "Invalid email format",
            },
          },
          submitHandler: function (e) {
            var i = $(e);
            switch ($(e).attr("id")) {
              case "goToNewPage":
                $.ajax({
                  type: "POST",
                  url: i.attr("action"),
                  data: i.serialize(),
                }).always(function (e) {
                  (location.href = "https://"),
                    ga("send", "event", "masterklass7", "register"),
                    yaCounter27714603.reachGoal("lm17lead");
                });
                break;
              case "popupResult":
                $.ajax({
                  type: "POST",
                  url: i.attr("action"),
                  data: i.serialize(),
                }).always(function (e) {
                  setTimeout(function () {
                    $("input, textarea").removeClass("error valid"),
                      i.trigger("reset");
                  }, 800);
                }),
                  $(".popup_subscribe").removeClass("_active");
            }
            return !1;
          },
        });
      });
  });
