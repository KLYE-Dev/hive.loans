!(function (e) {
    var t = document.scripts[document.scripts.length - 1],
        i = t.parentElement,
        d = document.createElement("iframe"),
        c = !1;
    "undefined" != typeof cf_widget_mode
        ? ((c = "https://www.worldcoinindex.com/widget/renderWidget?mode=g-l&to=" + cf_widget_to),
          "g-l" == cf_widget_mode &&
              ("small" == cf_widget_size ? ((d.width = "250px"), (d.height = "270px")) : "medium" == cf_widget_size ? ((d.width = "300px"), (d.height = "270px")) : "large" == cf_widget_size && ((d.width = "336px"), (d.height = "270px")),
              (d.id = "cf_g_l_widget_iframe")))
        : ((c = "https://www.worldcoinindex.com/widget/renderWidget?size=" + cf_widget_size + "&from=" + cf_widget_from + "&to=" + cf_widget_to + "&name=" + cf_widget_name + "&clearstyle=" + cf_clearstyle),
          "small" == cf_widget_size ? ((d.width = "300px"), (d.height = "135px")) : "medium" == cf_widget_size ? ((d.width = "300px"), (d.height = "240px")) : "large" == cf_widget_size && ((d.width = "300px"), (d.height = "340px")),
          (d.id = "cf_widget_iframe")),
        d.setAttribute("data-size", cf_widget_size),
        (d.style.cssText = "border:none;"),
        -1 == navigator.userAgent.indexOf("MSIE") ? (d.src = c) : (d.location = c),
        i.replaceChild(d, t);
})(document);
