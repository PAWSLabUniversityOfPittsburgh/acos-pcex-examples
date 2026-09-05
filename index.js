const https = require('https');
const path = require('path');
var htmlencode = require('htmlencode').htmlEncode;
const download = require('download');
const slugify = require('transliteration').slugify;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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
  const api = process.env.PCEX_API_URL || 'https://adapt2.sis.pitt.edu/pcex-authoring/api/hub';
  https.get(api, { agent: httpsAgent }, (response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      console.error(`acos-pcex-examples: Failed to load from API (status code: ${response.statusCode})`);
      response.resume();
      return;
    }

    console.log('acos-pcex-examples: reloading acos-pcex-examples from API...');

    let raw = '';
    response.on('data', (chunk) => raw += chunk);
    response.on('end', () => {
      try {
        const items = JSON.parse(raw).sort((a, b) => a.name.localeCompare(b.name));
        ACOS_PCEX_Example.meta.contents = {};
        ACOS_PCEX_Example.meta.teaserContent = [];
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
        const cacheDir = path.join(__dirname, 'static/data');
        Promise.all(items.map(i => download(
          `${api}/${i.id}?_t=${Date.now()}`,
          cacheDir,
          { filename: `${i.id}.json`, rejectUnauthorized: false }
        ).then(() => console.log(`acos-pcex-examples: ${i.id}.json cached locally.`))
         .catch((err) => console.error(`acos-pcex-examples: Failed to cache ${i.id}.json:`, err.message))
        )).catch((err) => console.error('acos-pcex-examples: Error caching examples:', err));
      } catch (err) {
        console.error('acos-pcex-examples: Error parsing JSON response:', err);
      }
    });
  }).on('error', (error) => console.error('Error:', error));
}

setInterval(() => load(), /* reload every */ 10 /* mins */ * 60 * 1000);
load();

module.exports = ACOS_PCEX_Example;
