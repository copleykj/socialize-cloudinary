/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
/* eslint-enable import/no-unresolved */
import './versionCheck.js';
import { Cloudinary } from './configuration.js';

Meteor.methods({
  'cloudinary.sign': function sign (ops = {}) {
    check(ops, Match.Optional(Object));
    this.unblock();
    Cloudinary.rules.sign_upload.call(this);

    return Cloudinary.uploader.direct_upload('', ops);
  },
  'cloudinary.delete_by_publicId': async function deleteByPublicId (publicId, type) {
    let ops;
    check(publicId, String);
    check(type, Match.OneOf(String, 0, null));
    this.unblock();
    Cloudinary.rules.delete.call(this, publicId);
    if (type) {
      ops = {
        type,
      };
    }
    return Cloudinary.api.delete_resources([publicId], ops);
  },
  'cloudinary.get_private_resource': function getPrivateResource (publicId, ops = {}) {
    check(publicId, String);
    check(ops, Match.Optional(Object));
    this.unblock();
    const newOps = {
      ...ops,
      sign_url: true,
      type: 'private',
    };
    Cloudinary.rules.private_resource.call(this, publicId);
    return Cloudinary.url(publicId, newOps);
  },
  'cloudinary.get_download_url': function getDownloadUrl (publicId, ops = {}) {
    check(publicId, String);
    check(ops, Match.Optional(Object));
    this.unblock();
    Cloudinary.rules.download_url.call(this, publicId);
    const format = ops.format || '';
    delete ops.format;
    return Cloudinary.utils.private_download_url(publicId, format, ops);
  },
});

export { Cloudinary };
