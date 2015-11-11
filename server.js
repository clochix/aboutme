//jshint node: true, maxstatements: 5000
(function () {
  "use strict";
  var connect     = require('connect'),
      http        = require('http'),
      bodyParser  = require('body-parser'),
      fs          = require('fs'),
      path        = require('path'),
      hogan       = require('hogan.js'),
      app, port, host, template,
      basePath, dataPath, indexPath, templatePath;

  process.on('uncaughtException', function (err) {
    console.error("Uncaught Exception");
    console.error(err);
    console.error(err.stack);
  });

  basePath     = process.env.APP_DATA || __dirname;
  dataPath     = path.join(basePath, 'data.json');
  indexPath    = path.join(basePath, 'index.html');
  templatePath = path.join(basePath, 'template.html');

  port = process.env.PORT || 9253;
  host = process.env.HOST || "127.0.0.1";

  app = connect();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.text({limit: '10mb'}));
  app.use(bodyParser.json());

  function compile(values) {
    var i, ldjson = { "@context" : "http://schema.org",
      "@type" : "Person",
      "name" : values.name
    };
    if (values.homepages.length > 0) {
      ldjson.url = values.homepages[0].url;
    }
    if (values.homepages.length > 1) {
      ldjson.sameAs = [];
      for (i = 1; i < values.homepages.length; i++) {
        ldjson.sameAs.push(values.homepages[i]);
      }
    }
    values.ldjson = ldjson;
    template = hogan.compile(fs.readFileSync(templatePath).toString());
    fs.writeFileSync(indexPath, template.render(values));
  }

  function getData() {
    var data;
    try {
      data = require(dataPath);
    } catch (e) {
      console.log(e);
      data = {};
    }
    ['feeds', 'homepages', 'emails', 'openid', 'foaf', 'keys'].forEach(function (key) {
      if (!Array.isArray(data[key])) {
        data[key] = [];
      }
    });
    return data;
  }


  compile(getData());

  app.use('/public', function (req, res, next) {
    res.setHeader('Content-Type', 'application/xhtml+xml; charset=utf-8');
    fs.readFile(indexPath, function (err, content) {
      if (err) {
        throw err;
      }
      res.end(content.toString());
    });
  });

  app.use('/data', function (req, res, next) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.statusCode = 200;
    res.end(JSON.stringify(getData()));
  });

  app.use('/', function (req, res, next) {
    if (req.url === '/') {
      switch (req.method) {
        case 'GET':
          res.setHeader('Content-Type', 'text/html');
          fs.readFile(path.join(__dirname, 'edit.html'), function (err, content) {
            if (err) {
              throw err;
            }
            res.end(content.toString());
          });
          break;
        case 'POST':
        case 'PUT':
          fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), function (err) {
            if (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({error: err}));
            } else {
              compile(req.body);
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.statusCode = 200;
              res.end(JSON.stringify(req.body));
            }
          });
          break;
      }
    } else {
      next();
    }
  });

  http.createServer(app).listen(port, host, function () {
    console.log("Server listening to %s:%d", host, port);
  });
}());
