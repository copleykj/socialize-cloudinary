/* eslint-disable import/no-unresolved */
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
  '@cloudinary/url-gen': '1.8.x',
}, 'socialize:cloudinary');
