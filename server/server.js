/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Future from 'fibers/future';
/* eslint-enable import/no-unresolved */

import { Cloudinary } from './configuration.js';


Meteor.methods({
    'cloudinary.sign': function sign(ops = {}) {
        let authFunction;

        check(ops, Match.Optional(Object));
        this.unblock();
        if (Cloudinary.rules.sign_upload) {
            this.options = ops;
            authFunction = Cloudinary.rules.signature.bind(this);
            if (!authFunction()) {
                throw new Meteor.Error('Unauthorized', 'Signature not allowed');
            }
        }
        const signature = Cloudinary.uploader.direct_upload('', ops);
        return signature;
    },
    'cloudinary.delete_by_publicId': function deleteByPublicId(publicId, type) {
        let authFunction;
        let ops;
        check(publicId, String);
        check(type, Match.OneOf(String, 0, null));
        this.unblock();
        if (Cloudinary.rules.delete) {
            this.publicId = publicId;
            authFunction = Cloudinary.rules.delete.bind(this);
            if (!authFunction()) {
                throw new Meteor.Error('Unauthorized', 'Delete not allowed');
            }
        }
        if (type) {
            ops = {
                type,
            };
        }
        const future = new Future();

        Cloudinary.api.delete_resources([publicId], result => future.return(result), ops);

        return future.wait();
    },
    'cloudinary.get_private_resource': function getPrivateResource(publicId, ops = {}) {
        let authFunction;

        check(publicId, String);
        check(ops, Match.Optional(Object));
        this.unblock();
        const newOps = {
            ...ops,
            sign_url: true,
            type: 'private',
        };
        if (Cloudinary.rules.private_resource) {
            this.publicId = publicId;
            authFunction = Cloudinary.rules.private_resource.bind(this);
            if (!authFunction()) {
                throw new Meteor.Error('Unauthorized', 'Access not allowed');
            }
        }
        return Cloudinary.url(publicId, newOps);
    },
    'cloudinary.get_download_url': function getDownloadUrl(publicId, ops = {}) {
        let authFunction;

        check(publicId, String);
        check(ops, Match.Optional(Object));
        this.unblock();
        if (Cloudinary.rules.download_url) {
            this.publicId = publicId;
            authFunction = Cloudinary.rules.download_url.bind(this);
            if (!authFunction()) {
                throw new Meteor.Error('Unauthorized', 'Access not allowed');
            }
        }
        const format = ops.format || '';
        return Cloudinary.utils.private_download_url(publicId, format, ops.filter(op => op !== 'format'));
    },
});

export { Cloudinary };
