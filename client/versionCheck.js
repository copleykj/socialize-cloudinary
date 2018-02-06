/* eslint-disable import/no-unresolved */
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
    'cloudinary-core': '2.4.x',
}, 'socialize:cloudinary');
