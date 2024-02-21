const http = require('http');
var htmlencode = require('htmlencode').htmlEncode;

var ACOS_PCEX_Example = function () { };

ACOS_PCEX_Example.addToHead = function (params) { return ''; };
ACOS_PCEX_Example.addToBody = function (params) {
  return '<div class="pcex-example" data-id="' + htmlencode(params.name) + '"></div>';
};

ACOS_PCEX_Example.initialize = function (req, params, handlers, cb) {
  // Initialize the content package
  params.headContent += ACOS_PCEX_Example.addToHead(params);
  params.bodyContent += ACOS_PCEX_Example.addToBody(params);

  cb();
};

ACOS_PCEX_Example.register = function (handlers) {
  handlers.contentPackages['acos-pcex-examples'] = ACOS_PCEX_Example;
  handlers.contentTypes['acos-pcex'].installedContentPackages.push(ACOS_PCEX_Example);
};

ACOS_PCEX_Example.namespace = 'acos-pcex-examples';
ACOS_PCEX_Example.contentTypeNamespace = 'acos-pcex';
ACOS_PCEX_Example.packageType = 'content';

ACOS_PCEX_Example.meta = {
  'name': 'acos-pcex-examples',
  'shortDescription': 'A demonstration for PCEX examples.',
  'description': '',
  'author': 'Mohammad Hassany',
  'license': 'MIT',
  'version': '0.0.1',
  'url': '',
  'teaserContent': [],
  'contents': {}
};

http.get('http://adapt2.sis.pitt.edu/pcex-authoring/api/hub', (response) => {
  let raw = '';
  response.on('data', (chunk) => raw += chunk);
  response.on('end', () => {
    JSON.parse(raw).forEach((example, index) => {
      ACOS_PCEX_Example.meta.contents[example.id] = {
        'order': index,
        'title': example.name,
        'description': example.description || '',
      };
    });
    ACOS_PCEX_Example.meta.teaserContent = Object.keys(ACOS_PCEX_Example.meta.contents).slice(0, 4);
  });
}).on('error', (error) => console.error('Error:', error));

module.exports = ACOS_PCEX_Example;
