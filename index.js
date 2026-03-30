const https = require('https');
var htmlencode = require('htmlencode').htmlEncode;
const download = require('download');
const slugify = require('transliteration').slugify;

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
  'shortDescription': 'Examples and challenges created and shared publicly on PCEX Authoring Tool (http://adapt2.sis.pitt.edu/pcex-authoring/#/hub)',
  'description': '',
  'author': 'Mohammad Hassany',
  'license': 'MIT',
  'version': '0.0.2',
  'url': '',
  'teaserContent': [],
  'contents': {}
};

const load = () => {
  // const api = 'http://adapt2.sis.pitt.edu/pcex-authoring/api/hub'
  const api = 'https://proxy.personalized-learning.org/pcex-authoring/api/hub'
  https.get(api, (response) => {
    console.log('acos-pcex-examples: reloading acos-pcex-examples from API...');

    let raw = '';
    response.on('data', (chunk) => raw += chunk);
    response.on('end', () => {
      ACOS_PCEX_Example.meta.contents = {};
      ACOS_PCEX_Example.meta.teaserContent = [];
      const items = JSON.parse(raw).sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((example, index) => {
        let name = slugify(example.name, { separator: '_' });
        name = name.replace(/ /g, '_');
        name = name.replace(/\./g, '_');
        ACOS_PCEX_Example.meta.contents[`${name}__${example.id}`] = {
          'order': index,
          'title': example.name,
          'description': example.description || '',
        };
      });
      ACOS_PCEX_Example.meta.contents['preview'] = {}; // add empty content for default
      ACOS_PCEX_Example.meta.teaserContent = Object.keys(ACOS_PCEX_Example.meta.contents).slice(0, 4);

      // cache all examples locally
      Promise.all(items.map(i => download(
        `${api}/${i.id}?_t=${Date.now()}`,
        './node_modules/acos-pcex-examples/static/data', { filename: `${i.id}.json` },
      ).then((item) => console.log(`acos-pcex-examples: ${i.id}.json cached locally.`))));
    });
  }).on('error', (error) => console.error('Error:', error));
}

setInterval(() => load(), 10 * 60 * 1000); // reload every 5mins
load();

module.exports = ACOS_PCEX_Example;
