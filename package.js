/* eslint-disable no-undef */
Package.describe({
    name: 'socialize:cloudinary',
    summary: 'Upload and manipulate files with the Cloudinary API and async/await',
    version: '1.0.4',
    git: 'https://github.com/copleykj/socialize-cloudinary',
});

Package.on_use(function _(api) {
    api.versionsFrom('1.3');

    api.use(['meteor', 'ecmascript', 'mongo', 'check'], ['client', 'server']);
    api.use('tmeasday:check-npm-versions@0.3.2', ['client', 'server']);

    api.mainModule('server/server.js', 'server');
    api.mainModule('client/client.js', 'client');
});
