/* eslint-disable import/no-unresolved, no-param-reassign */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Promise } from 'meteor/promise';

import './versionCheck.js';
import CloudinaryConstruct from './cloudinary.js';

const Cloudinary = CloudinaryConstruct({ Meteor, Mongo, Promise });

export { Cloudinary };
