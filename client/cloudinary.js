import { Cloudinary as Original } from '@cloudinary/url-gen';
import { Meteor } from 'meteor/meteor';

export default ({ Meteor, Mongo, Promise }) => {
  const callWithPromise = (method, ...myParameters) => new Promise((resolve, reject) => {
    Meteor.call(method, ...myParameters, (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });

  const _privateUrls = {};
  const _expiringUrls = {};

  const cloudName = Meteor.settings.public?.cloudinary?.cloudName;
  let cloudinary = cloudName ? new Original({ cloud: { cloudName } }) : null;

  function Cloudinary () {
    if (cloudinary !== null) {
      return cloudinary;
    } else {
      throw new Error('Cloudinary not initialized. Call Cloudinary.config() first.');
    }
  }

  Cloudinary.collection = new Mongo.Collection('_cloudinary', {
    connection: null,
  });

  Cloudinary.config = (config) => {
    cloudinary = new Original(config);
  };

  Cloudinary.privateUrl = async (publicId, options = {}) => {
    let privateUrl = _privateUrls[publicId];

    if (publicId && !privateUrl) {
      privateUrl = await callWithPromise('cloudinary.get_private_resource', publicId, options);
    }
    return privateUrl;
  };

  Cloudinary.downloadUrl = async (publicId, options = {}) => {
    let expiringUrl = _expiringUrls[publicId];

    if (publicId && !expiringUrl) {
      expiringUrl = await callWithPromise('cloudinary.get_download_url', publicId, options);
    }
    return expiringUrl;
  };

  Cloudinary.delete = async (publicId, type) => {
    const result = await callWithPromise('cloudinary.delete_by_publicId', publicId, type);
    return result;
  };

  Cloudinary.uploadFiles = (files, config = { groupId: 'general', options: {}, callback: null }) => {
    let newFiles = files;

    if (newFiles instanceof File || newFiles instanceof Blob) {
      newFiles = [newFiles];
    } else if (newFiles instanceof FileList) {
      newFiles = Array.from(newFiles);
    }

    const uploadResults = newFiles.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const response = await Cloudinary.uploadFile(reader.result, config);
        resolve(response);
      };
      reader.readAsDataURL(file);
    }));
    return uploadResults;
  };

  Cloudinary.uploadFile = async (dataUrl, config = { groupId: 'general', options: {}, callback: null }) => {
    const { groupId, options, callback } = config;
    const result = await callWithPromise('cloudinary.sign', options);

    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // cloudinary.sign sends back all necessary form props we just need to append them to formData
      Object.keys(result.hidden_fields).forEach(key => formData.append(key, result.hidden_fields[key]));

      // append the file
      formData.append('file', dataUrl);
      // create a new XHR instace so we can send the data to cloudinary
      const xhr = new XMLHttpRequest();
      // set the inital record for the uploading file
      const collectionId = Cloudinary.collection.insert({
        status: 'uploading',
        preview: dataUrl,
        percent_uploaded: 0,
        groupId,
      });
        // listen for progress event
      xhr.upload.addEventListener('progress', function onProgress (event) {
        Cloudinary.collection.update(collectionId, {
          $set: {
            loaded: event.loaded,
            total: event.total,
            percent_uploaded: Math.floor((event.loaded / event.total) * 100),
          },
        });
      }, false);
      // listen for load event
      xhr.addEventListener('load', function onLoad () {
        const response = JSON.parse(this.response);
        if (xhr.status < 400) {
          Cloudinary.collection.upsert(collectionId, {
            $set: {
              status: 'complete',
              percent_uploaded: 100,
              response,
            },
          });
          return (callback && callback(null, response)) || resolve(response);
        }

        Cloudinary.collection.upsert(collectionId, {
          $set: {
            status: 'error',
            response,
          },
        });
        return (callback && callback(response, null)) || reject(response);
      });
      // listen for error event
      xhr.addEventListener('error', function onError () {
        const response = JSON.parse(this.response);
        Cloudinary.collection.upsert(collectionId, {
          $set: {
            status: 'error',
            response,
          },
        });
        (callback && callback(response, null)) || reject(response);
      });
      // listen for abort event
      xhr.addEventListener('abort', function onAbort () {
        Cloudinary.collection.upsert(collectionId, {
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
  };

  return Cloudinary;
};
