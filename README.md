# Cloudinary API And Image/File Uploader

This Package provides a simple way for uploading files to Cloudinary, which in turn can be set up to sync with your Amazon S3 service. This is useful for uploading and actively manipulating images and files that you want accessible to the public.

>This is a [Meteor][meteor] package with part of it's code published as a companion NPM package made to work with clients other than Meteor. For example your server is Meteor, but you want to build a React Native app for the client. This allows you to share code between your Meteor server and other clients to give you a competitive advantage when bringing your mobile and web application to market.

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->
- [Prior Art](#prior-art)
- [Supporting The Project](#supporting-the-project)
- [Features](#features)
- [Meteor Installation](#meteor-installation)
- [NPM Installation](#npm-installation)
- [Usage Outside Meteor](#usage-outside-meteor)
  - [React Native](#react-native)
- [Configuration](#configuration)
  - [Server](#server)
  - [Client](#client)
- [Uploading](#uploading)
  - [Uploads Collection](#uploads-collection)
- [Manipulating and Displaying](#manipulating-and-displaying)
- [Deleting From Cloudinary](#deleting-from-cloudinary)
- [Generating A Download Link](#generating-a-download-link)
- [Compatibility](#compatibility)
  - [Cordova Android Bug with Meteor 1.2+](#cordova-android-bug-with-meteor-12)
- [API](#api)
<!-- /TOC -->

## Prior Art

This project is based heavily on [lepozepo:cloudinary](https://github.com/Lepozepo/cloudinary/). Coffeescript has been converted to ES2015, Modules are now implemented, no more dependence on jQuery or Blaze, functions that call server methods now return promises, and client side cloudinary config has been tweaked to bring it in line with the server side implementation.

## Supporting The Project

Finding the time to maintain FOSS projects can be quite difficult. I am myself responsible for over 30 personal projects across 2 platforms, as well as Multiple others maintained by the [Meteor Community Packages](https://github.com/meteor-community-packages) organization. Therfore, if you appreciate my work, I ask that you either sponsor my work through GitHub, or donate via Paypal or Patreon. Every dollar helps give cause for spending my free time fielding issues, feature requests, pull requests and releasing updates. Info can be found in the "Sponsor this project" section of the [GitHub Repo](https://github.com/copleykj/socialize-base-model)

## Features

- Frontend agnostic
- Signed URLs
- Expiring URLs
- Download URLs
- Auththentication Rules
- Client side signed uploads

## Meteor Installation

This package is built on [Cloudinary (NPM)](https://github.com/cloudinary/cloudinary_npm) and [Cloudinary URL Gen](https://github.com/cloudinary/js-url-gen). These packages must be installed from NPM for this package to work.

``` shell
meteor npm install --save cloudinary cloudinary-core
meteor add socialize:cloudinary
```

## NPM Installation

When installing the npm package for use outside Meteor, npm takes care of installing cloudinary deps and theres no need to install them like is necessary inside the Meteor app.

```shell
npm install --save @socialize/cloudinary
```

## Usage Outside Meteor

The client side parts of this package are published to NPM as `@socialize/cloudinary` for use in front ends outside of Meteor.

When using the npm package you'll need to connect to a server, which hosts the server side Meteor code for your app, using `Meteor.connect` as per the [@socialize/react-native-meteor usage example](https://github.com/copleykj/react-native-meteor#example-usage) documentation.

 ```javascript
Meteor.connect('ws://192.168.X.X:3000/websocket');
 ```

### React Native

When using this package with React Native there is some minor setup required by the `@socialize/react-native-meteor` package. See [@socialize/react-native-meteor react-native](https://github.com/copleykj/react-native-meteor#react-native) for necessary instructions.

## Configuration

### Settings.json

First thing you'll want to do is set up some place to hold your configuration values outside your application code.

Here we use Meteor settings.

> __Note__
>
> If you create your settings file in Meteor with the exact keys as shown below, this package will auto setup your cloudinary and you will not need to call `Cloudinary.config()`

```json
{
  "public": {
    "cloudinary": {
      "cloudName": "cloud-name",
    }
  },
  "cloudinary": {
    "api_key": "api-key",
    "api_secret": "api-secret"
  }
}
```

### Server

Make note that Cloudinary.config takes a slightly different shaped object on the server than it does on the client.

> __Note__
>
> If Meteor.settings is setup as specified above you will not need to call `Cloudinary.config()`. See note about auto configuration above.

``` javascript
import { Cloudinary } from 'meteor/socialize:cloudinary';

// Destructure the Meteor.settings object from the shape specified above
const { cloudinary: { api_key, api_secret }, public: { cloudinary: { cloud_name } } } = Meteor.settings

// Call Cloudinary.config with the destructured values
Cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

// Rules are bound to the connection from which they are are executed. This means you have a userId available as this.userId if there is a logged in user. Throw a new Meteor.Error to stop the method from executing and propagate the error to the client. If rule is not set a standard error will be thrown.
Cloudinary.rules.delete = function (publicId) {
  if (!this.userId && !publicId) throw new Meteor.Error("Not Authorized", "Sorry, you can't do that!");
};

Cloudinary.rules.sign_upload = function () {
  if (!this.userId) throw new Meteor.Error("Not Authorized", "Sorry, you can't do that!")
};

Cloudinary.rules.private_resource = function (publicId) {
  if (!this.userId && !publicId) throw new Meteor.Error("Not Authorized", "Sorry, you can't do that!");
};

Cloudinary.rules.download_url = function (publicId) {
  if (!this.userId && !publicId) throw new Meteor.Error("Not Authorized", "Sorry, you can't do that!");
};
```

### Client

On the client side, the config method takes an object with a `cloud` key which contains a key `cloudName`. No other configuration values are necessary and you should take care not to expose your api key and secret to the client.

> __Note__
>
> If Meteor.settings is setup as specified above you will not need to do this step. See note about auto configuration above.

```javascript
import { Cloudinary } from 'meteor/socialize:cloudinary';

const { public: { cloudinary: { cloud_name: cloudName } } } = Meteor.settings


Cloudinary.config({
  cloud: {
    cloudName,
  },
});
```

## Uploading

Wire up your `input[type="file"]`. CLIENT SIDE.

```jsx
class Uploader extends Component {
    onChange = (e) => {
    const uploads = Cloudinary.uploadFiles(e.currentTarget.files);
    uploads.forEach(async (response) => {
      const photoData = await response;
      new Photo(photoData).save();
    });
    }
    render() {
        return (
          <input type="file" accept="image/*" multiple onChange={this.onChange} />
        );
    }
}
```

## Uploads Collection

All uploads are stored in `Cloudinary.collection` with the following fields.

```js
{
  status: 'complete',
  percent_uploaded: 100,
  groupId: "general",
  loaded: 844109,
  total: 844109,
  response: { // Only present on complete uploads
    asset_id: "0abc9b1e775694d08abfabb9ce590a84",
    public_id: "eusvz5ttdwpgo5blp3ko",
    version: 1666662135,
    version_id: "55c7b72ec0685d68e730a043878cf9d1",
    signature: "59d77f9fa0b745aaa10e53532033d62340367c2d",
    width: 2048,
    height: 1536,
    format: "jpg",
    resource_type: "image",
    created_at: "2022-10-25T01:42:15Z",
    tags: [],
    "ytes: 632699,
    type: "upload",
    etag: "3e0021608455fe13342fcb9866fab232",
    placeholder: false,
    url: "http://res.cloudinary.com/dpf7hzqcl/image/upload/v1666662135/eusvz5ttdwpgo5blp3ko.jpg",
    secure_url: "https://res.cloudinary.com/dpf7hzqcl/image/upload/v1666662135/eusvz5ttdwpgo5blp3ko.jpg",
    folder: "",
    api_key: "383564773967721"
  }
}
```

### Uploads Collection Statuses

The status field can be one of `uploading`, `complete`, `error`, `aborted`. Matching on this field lets you easily find and display files that are uploading, complete, or errored.

```js
import { Cloudinary } from 'meteor/socialize:cloudinary';

const uploadingFiles = Cloudinary.collection.find({status:'uploading'});

const completedFiles = Cloudinary.collection.find({status:'complete'});

const completedFiles = Cloudinary.collection.find({status:'error'});
```

## Manipulating and Displaying

As of version 2 of this package we no longer use the `cloudinary-core` package and instead have moved to using `@cloudinary/url-gen` to generate urls. This allows better tree shaking for smaller bundle sizes as well as the usage of front end specific cloudinary libraries like `@cloudinary/react`.

Because we need to access the Cloudinary instance created from the `Cloudinary` constructor provided by the `@cloudinary/url-gen` package, you'll need to call the `Cloudinary` function exported from this package to get the instance. This is done by calling `Cloudinary()`.

```jsx
//import necessary packages
import { Cloudinary } from 'meteor/socialize:cloudinary';
import { thumbnail } from "@cloudinary/url-gen/actions/resize";
import {AdvancedImage} from '@cloudinary/react';

const Avatar = ({publicId}) => {
  const img = Cloudinary().image(publicId).resize(thumbnail().width(50).height(50)).format('jpg');
  return (
    <AdvancedImage cldImg={url} />
  );
}
```

For more information see the cloudinary's documentation:
[https://cloudinary.com/documentation/javascript_integration](<https://cloudinary.com/documentation/javascript_integration>

## Deleting From Cloudinary

Just pass the public_id to the `Cloudinary.delete` method. Be sure to set `Cloudinary.rules.delete` to your own function that implements permission logic for deleting stored files. If you don't set this rule, a standard error will be thrown and the delete will not be executed.

```javascript
// client side
try {
  const result = await Cloudinary.delete(public_id);
} catch (e) {
  console.log(e.reason);
}
```

## Generating A Download Link

```javascript
try {
  const url = await Cloudinary.downloadUrl(public_id, options);
} catch (e){
  console.log(e.reason);
}
```

## Compatibility

If you are using the `browser-policy` package, don't forget to allow images from cloudinary to load on your webapp by using `BrowserPolicy.content.allowImageOrigin("res.cloudinary.com")`

Here are all the transformations you can apply:
[http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)

### Cordova Android Bug with Meteor 1.2+

Due to a [bug in the Cordova Android version that is used with Meteor 1.2](https://issues.apache.org/jira/browse/CB-8608?jql=project%20%3D%20CB%20AND%20text%20~%20%22FileReader%22), you will need to add the following to your mobile-config.js or you will have problems with this package on Android devices:

```js
App.accessRule("blob:*");
```

---

## API

- Cloudinary(): calling the package export as a function returns the Cloudinary instance created from the `@cloudinary/url-gen` package

- Cloudinary.config(options) __required__:

  Server Options:
  - cloud_name: string containing the name of your cloud
  - api_key: string containing your api key
  - api_secret: string containing your api secret

  Client Options:
  - cloud: object with a key `cloudName`
    - cloudName: string containing the name of your cloud
- async Cloudinary.uploadFile(dataUrl, config = { groupId: 'general', options: {}, callback: null }) __(CLIENT)__: returns a promise that resolves to a json object containing information about the uploaded resource
  - dataUrl: A file that has been read as a data url
  - config: An object containing the upload configuration.
    - groupId: A string to group uploads by. This makes finding uploads that should be grouped together easier. By default the groupId is 'general'
    - options: The cloudinary configuration options
    - callback: A callback to execute if you don't wish to use async/await

- async Cloudinary.uploadFiles(files, config = { groupId: 'general', options: {}, callback: null }) __(CLIENT)__: returns an array of promises that each resolves to a json object containing information about the uploaded resource
  - files: An instance of, or array of instances of `File` or `Blob`
  - config: An object containing the upload configuration.
    - groupId: A string to group uploads by. This makes finding uploads that should be grouped together easier. By default the groupId is 'general'
    - options: The cloudinary configuration options
    - callback: A callback to execute if you don't wish to use async/await

- async Cloudinary.privateUrl(public_id, options) __(CLIENT)__: returns a promise which resolves to a signed URL
  - public_id: The public ID returned after uploading a resource
  - options: A set of transformations described here [http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)

- async Cloudinary.downloadUrl(public_id) __(CLIENT)__: returns a promise that resolves to a url that will expire in 1 hour, does not take any transformations
  - public_id: The public ID returned after uploading a resource

- async Cloudinary.delete(public_id, type) __(CLIENT)__: returns a promise that resolves to json object containing information about the resource that was deleted.
  - public_id: The public ID returned after uploading a resource
  - type: The type that was specified when the resource was uploaded

- Cloudinary.rules __(SERVER)__ __required__: This is a javascript object of rules as functions
  - Cloudinary.rules.delete: Checks whether deleting a resource is allowed. Throw a `Meteor.Error` to disallow this action
  - Cloudinary.rules.sign_upload: Checks whether uploading a resource is allowed. Throw a `Meteor.Error` to disallow this action
  - Cloudinary.rules.private_resource: Checks whether getting a private resource is allowed. Throw a `Meteor.Error` to disallow this action
  - Cloudinary.rules.download_url: Checks whether fetching a download link for a resource is allowed. Throw a `Meteor.Error` to disallow this action

[meteor]: https://www.meteor.com
