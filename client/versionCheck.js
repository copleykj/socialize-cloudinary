/* eslint-disable import/no-unresolved */
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
    'cloudinary-core': '2.8.x',
}, 'socialize:cloudinary');
