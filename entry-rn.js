/* eslint-disable import/no-unresolved, no-param-reassign */
import Meteor, { Mongo } from '@socialize/react-native-meteor';

import CloudinaryConstruct from './cloudinary.js';

const Cloudinary = CloudinaryConstruct({ Meteor, Mongo, Promise });


export { Cloudinary };
