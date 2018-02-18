/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import Cloudinary from 'cloudinary';

const defaultAuth = function defaultAuth() {
    throw new Meteor.Error('Unauthorized', 'You are not authorized to perform this action');
};

Cloudinary.rules = {
    delete: defaultAuth,
    sign_upload: defaultAuth,
    private_resource: defaultAuth,
    download_url: defaultAuth,
};

export { Cloudinary };
