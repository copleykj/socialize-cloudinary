/* eslint-disable import/no-unresolved, no-param-reassign */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Promise } from 'meteor/promise';

import './versionCheck.js';

const callWithPromise = (method, ...myParameters) => new Promise((resolve, reject) => {
    Meteor.call(method, ...myParameters, (err, res) => {
        if (err) reject(err);
        resolve(res);
    });
});


const cloudinaryCore = require('cloudinary-core');

const Cloudinary = {
    collection: new Mongo.Collection('_cloudinary', {
        connection: null,
    }),
    _privateUrls: {},
    _expiringUrls: {},
    cloudinary: new cloudinaryCore.Cloudinary(),
    config(key, value) {
        return this.cloudinary.config(key, value);
    },
    url(publicId, options = {}) {
        if (publicId) {
            return this.cloudinary.url(publicId, options);
        }
        return '';
    },
    async privateUrl(publicId, options = {}) {
        let privateUrl = this._privateUrls[publicId];

        if (publicId && !privateUrl) {
            privateUrl = await callWithPromise('cloudinary.get_private_resource', publicId, options);
        }
        return privateUrl;
    },
    async downloadUrl(publicId, options = {}) {
        let expiringUrl = this._expiringUrls[publicId];

        if (publicId && !expiringUrl) {
            expiringUrl = await callWithPromise('cloudinary.get_download_url', publicId, options);
        }
        return expiringUrl;
    },
    async delete(publicId, type) {
        const result = await callWithPromise('cloudinary.delete_by_publicId', publicId, type);
        return result;
    },
    uploadFiles(files, { groupId = 'general', options = {}, callback }) {
        const uploadResults = [];
        if (files instanceof File || files instanceof Blob) {
            const reader = new FileReader();
            reader.onload = async () => {
                uploadResults.push(await this.uploadFile(reader.result, groupId, options, callback));
            };
            reader.readAsDataURL(files);
        }
        if (Array.isArray(files) || files instanceof FileList) {
            const newFiles = Array.from(files);
            newFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = async () => {
                    uploadResults.push(this.uploadFile(reader.result, groupId, options, callback));
                };
                reader.readAsDataURL(file);
            });
        }
        return uploadResults;
    },
    async uploadFile(file, groupId = 'general', ops = {}, callback) {
        const result = await callWithPromise('cloudinary.sign', ops);
        const self = this;
        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // cloudinary.sign sends back all necessary form props we just need to append them to formData
            result.hidden_fields.forEach((v, k) => formData.append(k, v));

            // append the file
            formData.append('file', file);
            // create a new XHR instace so we can send the data to cloudinary
            const xhr = new XMLHttpRequest();
            // set the inital record for the uploading file
            const collectionId = self.collection.insert({
                status: 'uploading',
                preview: file,
                percent_uploaded: 0,
                groupId,
            });
            // listen for progress event
            xhr.upload.addEventListener('progress', function onProgress(event) {
                self.collection.update(collectionId, {
                    $set: {
                        loaded: event.loaded,
                        total: event.total,
                        percent_uploaded: Math.floor((event.loaded / event.total) * 100),
                    },
                });
            }, false);
            // listen for load event
            xhr.addEventListener('load', function onLoad() {
                const response = JSON.parse(this.response);
                if (xhr.status < 400) {
                    self.collection.upsert(collectionId, {
                        $set: {
                            status: 'complete',
                            percent_uploaded: 100,
                            response,
                        },
                    });
                    (callback && callback(null, response)) || resolve(response);
                }

                self.collection.upsert(collectionId, {
                    $set: {
                        status: 'error',
                        response,
                    },
                });
                (callback && callback(response, null)) || reject(response);
            });
            // listen for error event
            xhr.addEventListener('error', function onError() {
                const response = JSON.parse(this.response);
                self.collection.upsert(collectionId, {
                    $set: {
                        status: 'error',
                        response,
                    },
                });
                (callback && callback(response, null)) || reject(response);
            });
            // listen for abort event
            xhr.addEventListener('abort', function onAbort() {
                self.collection.upsert(collectionId, {
                    $set: {
                        status: 'aborted',
                    },
                });
            });
            // open async XHR connection to cloudinary
            xhr.open('POST', result.form_attrs.action, true);
            // send the form data
            xhr.send(formData);
        });
    },
};

export { Cloudinary };
