(function () {
  var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src*="omukweyo-widget.js"]'));
  var script = scripts[scripts.length - 1];
  var scriptUrl = new URL(script ? script.src : window.location.href);
  var origin = scriptUrl.origin;
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-omukweyo-queue]'));

  nodes.forEach(function (node) {
    if (node.getAttribute('data-omukweyo-mounted') === 'true') return;
    var company = node.getAttribute('data-omukweyo-queue');
    if (!company) {
      node.innerHTML = '<div style="font:14px system-ui;padding:16px;border:1px solid #e5e7eb;border-radius:12px">Missing data-omukweyo-queue company slug.</div>';
      return;
    }
    var height = node.getAttribute('data-height') || '520';
    var iframe = document.createElement('iframe');
    iframe.src = origin + '/widget/' + encodeURIComponent(company);
    iframe.title = 'Omukweyo queue widget';
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = '0';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
    iframe.style.background = '#fff';
    node.innerHTML = '';
    node.appendChild(iframe);
    node.setAttribute('data-omukweyo-mounted', 'true');
  });
})();
