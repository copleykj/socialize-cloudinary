/* eslint-disable import/no-unresolved */
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
    cloudinary: '1.10.x',
}, 'socialize:cloudinary');
