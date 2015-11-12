//jshint browser: true
(function () {
  "use strict";
  function qsn(name, context) {
    return (context || document).querySelector('[name="' + name + '"]');
  }
  function qsa(sel, context) {
    return Array.prototype.slice.call((document || context).querySelectorAll(sel));
  }
  function Template(templateName) {
    var node, vars = {};
    node = document.querySelector('#templates [data-template="' + templateName + '"]').cloneNode(true);
    function qsv() {
      return function (name, val) {
        var element = node.querySelector('[name="' + name + '"]');
        if (element && typeof val !== 'undefined') {
          if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
            element.value = val;
          } else {
            element.textContent = val;
          }
        }
        return element;
      };
    }
    Array.prototype.slice.call(node.querySelectorAll('[name]')).forEach(function (elmt) {
      vars[elmt.getAttribute('name')] = elmt;
    });
    return {
      node: node,
      vars: vars,
      qsv: qsv(node)
    };
  }
  window.addEventListener('load', function () {
    var form, xhr;
    form = document.querySelector('form');
    form.addEventListener('click', function (ev) {
      var action = ev.target.dataset.action;
      if (!action) {
        return;
      }
      switch (action) {
        case 'remove':
          ev.target.parentNode.parentNode.removeChild(ev.target.parentNode);
          break;
        case 'add':
          document.querySelector('[data-container="' + ev.target.dataset.target + '"]').appendChild(new Template(ev.target.dataset.template).node);
          break;
      }
    });
    qsn('save').addEventListener('click', function () {
      var data = {}, xhr;
      ['name', 'description', 'style'].forEach(function (key) {
        data[key] = qsn(key).value;
      });
      data.feeds = [];
      data.homepages = [];
      data.avatar = document.getElementById('avatar').src;
      qsa('[data-container=feeds] > p').forEach(function (node) {
        var title = qsn('feedTitle', node).value.trim(),
            type  = qsn('feedType', node).value.trim(),
            url   = qsn('feedUrl', node).value.trim();
        if (title || url) {
          data.feeds.push({type: type, title: title, url: url});
        }
      });
      qsa('[data-container=homepages] > p').forEach(function (node) {
        var name = qsn('homepageName', node).value.trim(),
            url  = qsn('homepageUrl', node).value.trim();
        if (name || url) {
          data.homepages.push({name: name, url: url});
        }
      });
      xhr = new XMLHttpRequest();
      xhr.onload = function () {
        var frame = document.querySelector('iframe');
        frame.src = frame.src;
      };
      xhr.open("POST", "");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    });

    xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var data = JSON.parse(xhr.responseText);
      ['name', 'description', 'style'].forEach(function (key) {
        qsn(key).value = data[key];
      });
      document.getElementById('avatar').src = data.avatar;
      data.feeds.forEach(function (feed) {
        var tpl = new Template('feed');
        tpl.qsv('feedTitle', feed.title);
        tpl.qsv('feedType', feed.type);
        tpl.qsv('feedUrl', feed.url);
        document.querySelector('[data-container="feeds"]').appendChild(tpl.node);
      });
      data.homepages.forEach(function (page) {
        var tpl = new Template('homepage');
        tpl.qsv('homepageName', page.name);
        tpl.qsv('homepageUrl', page.url);
        document.querySelector('[data-container="homepages"]').appendChild(tpl.node);
      });
    };
    xhr.open("GET", "data");
    xhr.send();

    document.getElementById('avatarInput').addEventListener('change', function (ev) {
      var reader = new FileReader();
      reader.onload = function () {
        document.getElementById('avatar').src = reader.result;
      };
      reader.readAsDataURL(ev.target.files[0]);
    });

    (function () {
      var publicTag = document.getElementById('publicUrl'),
          publicUrl = document.querySelector('iframe').contentDocument.location.toString();
      publicTag.href = publicUrl;
      publicTag.textContent = publicUrl;
    }());

    // https://developers.google.com/structured-data/testing-tool/?url=
    // https://webmaster.yandex.com/microtest.xml
    // http://linter.structured-data.org/?url=
    // https://validator.nu/?doc=

  });
}());
