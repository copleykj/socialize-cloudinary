/* eslint-disable no-undef */
Package.describe({
    name: 'socialize:cloudinary',
    summary: 'Upload and manipulate files with the Cloudinary API and async/await',
    version: '1.0.7',
    git: 'https://github.com/copleykj/socialize-cloudinary',
});

Package.onUse(function _(api) {
  api.versionsFrom('2.3');

    api.use(['meteor', 'ecmascript', 'mongo', 'check'], ['client', 'server']);
    api.use('tmeasday:check-npm-versions@1.0.2', ['client', 'server']);

    api.mainModule('server/server.js', 'server');
    api.mainModule('client/client.js', 'client');
});
