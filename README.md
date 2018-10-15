# Cloudinary Image/File Uploader #
This Package provides a simple way for uploading files to Cloudinary, which in turn can be set up to sync with your Amazon S3 service. This is useful for uploading and actively manipulating images and files that you want accessible to the public. Cloudinary is built on [Cloudinary (NPM)](https://github.com/cloudinary/cloudinary_npm) and [Cloudinary (JS)](https://github.com/cloudinary/cloudinary_core). These packages must be installed via `metoer npm install --save` command for this package to work.

This project is based heavily on [lepozepo:cloudinary](https://github.com/Lepozepo/cloudinary/). Coffeescript has been converted to ES2015, Modules are now implemented, no more dependence on jQuery or Blaze, functions that call server methods now return promises, and client side cloudinary config has been tweaked to bring it in line with the server side implementation.

- [Cloudinary Image/File Uploader](#cloudinary-imagefile-uploader)
	- [Supporting the Project](#supporting-the-project)
	- [Features](#features)
	- [Installation](#installation)
	- [Configuration](#configuration)
	- [Uploading](#uploading)
		- [Uploads Collection](#uploads-collection)
	- [Manipulating and Displaying](#manipulating-and-displaying)
	- [Deleting From Cloudinary](#deleting-from-cloudinary)
	- [Generating A Download Link](#generating-a-download-link)
	- [Compatibility](#compatibility)
		- [Cordova Android Bug with Meteor 1.2+](#cordova-android-bug-with-meteor-12)
	- [API](#api)

## Supporting the Project ##
In the spirit of keeping this and all of the packages in the [Socialize](https://atmospherejs.com/socialize) set alive, I ask that if you find this package useful, please donate to it's development.

![Litecoin](http://gdurl.com/xnOe)

[Patreon](https://www.patreon.com/user?u=4866588) / [Paypal](https://www.paypal.me/copleykj)

## Features ##
- Frontend agnostic
- Signed URLs
- Expiring URLs
- Download URLs
- Auththentication Rules
- Client side signed uploads

## Installation ##

``` sh
$ meteor npm install --save cloudinary cloudinary-core
$ meteor add socialize:cloudinary
```

## Configuration ##

**Server**

``` javascript
import { Cloudinary } from 'meteor/socialize:cloudinary';

Cloudinary.config({
	cloud_name: 'cloud_name',
	api_key: '1237419',
	api_secret: 'asdf24adsfjk',
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

**Client**


```javascript
import { Cloudinary } from 'meteor/socialize:cloudinary';

Cloudinary.config({
	cloud_name:'cloud_name',
	api_key: 'Your Key Here',
});

```

## Uploading ##
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

### Uploads Collection ###

All uploads are stored in `Cloudinary.collection` with the following fields.

```js
{
	status: 'uploading', // status of the upload
	loaded: 935,		 // how much of the file has been uploaded so far
	total: 10000,		 // the total size of the file
	percent_uploaded: 9
}
```

The status field can be one of `uploading`, `complete`, `error`, `aborted`. Matching on this field lets you easily find and display files that are uploading.

```js
import { Cloudinary } from 'meteor/socialize:cloudinary';

const uploadingFiles = Cloudinary.collection.find({status:'uploading'});

const completedFiles = Cloudinary.collection.find({status:'complete'});
```


## Manipulating and Displaying ##

All of Cloudinary's manipulation options can be passed to the `Cloudinary.url` and `Cloudinary.privateUrl` Methods which can be used to generate a url for an `<img>` tags src attribute

```jsx
<img src={Cloudinary.url(public_id)}>
<img src={Cloudinary.privateUrl(public_id)}>
```

You can manipulate an image by adding parameters to the helper
```jsx
<img src={Cloudinary.url(public_id, {effect:'blur:300' angle:"10"})}">
```

For more information see the cloudinary's documentation:
[http://cloudinary.com/documentation/image_transformations#crop_modes](http://cloudinary.com/documentation/image_transformations)

## Deleting From Cloudinary ##

Just pass the public_id of the image or file through this function. It will return an object with a list of the images deleted as a result.

```javascript
// client side
try {
	const result = await Cloudinary.delete(public_id);
} catch (e) {
	console.log(e.reason);
}
```

## Generating A Download Link ##
```javascript
try {
	const url = await Cloudinary.downloadUrl(public_id, options);
} catch (e){
	console.log(e.reason);
}
```

## Compatibility ##

If you are using the `browser-policy` package, don't forget to allow images from cloudinary to load on your webapp by using `BrowserPolicy.content.allowImageOrigin("res.cloudinary.com")`

Here are all the transformations you can apply:
[http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)

### Cordova Android Bug with Meteor 1.2+ ###

Due to a [bug in the Cordova Android version that is used with Meteor 1.2](https://issues.apache.org/jira/browse/CB-8608?jql=project%20%3D%20CB%20AND%20text%20~%20%22FileReader%22), you will need to add the following to your mobile-config.js or you will have problems with this package on Android devices:

```js
App.accessRule("blob:*");
```

---

## API ##
- Cloudinary.config(options) __required__:
	- cloud_name: Name of your cloud
	- api_key: Your Cloudinary API Key
	- api_secret: Your Cloudinary API Secret - only set this on the server


- async Cloudinary.uploadFile(dataUrl, config = { groupId: 'general', options: {}, callback: null }) **(CLIENT)**: returns a promise that resolves to a json object containing information about the uploaded resource
	- dataUrl: A file that has been read as a data url
	- config: An object containing the upload configuration.
		- groupId: A string to group uploads by. This makes finding uploads that should be grouped together easier. By default the groupId is 'general'
		- options: The cloudinary configuration options
		- callback: A callback to execute if you don't wish to use async/await

- async Cloudinary.uploadFiles(files, config = { groupId: 'general', options: {}, callback: null }) **(CLIENT)**: returns an array of promises that each resolves to a json object containing information about the uploaded resource
	- files: An instance of, or array of instances of `File` or `Blob`
	- config: An object containing the upload configuration.
		- groupId: A string to group uploads by. This makes finding uploads that should be grouped together easier. By default the groupId is 'general'
		- options: The cloudinary configuration options
		- callback: A callback to execute if you don't wish to use async/await


- Cloudinary.url(public_id, options) **(CLIENT)**: returns a generated url
	- public_id: The public ID returned after uploading a resource
	- options: A set of transformations described here [http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)


- async Cloudinary.privateUrl(public_id, options) **(CLIENT)**: returns a promise which resolves to a signed URL
	- public_id: The public ID returned after uploading a resource
	- options: A set of transformations described here [http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)


- async Cloudinary.downloadUrl(public_id) **(CLIENT)**: returns a promise that resolves to a url that will expire in 1 hour, does not take any transformations
	- public_id: The public ID returned after uploading a resource

- async Cloudinary.delete(public_id, type) **(CLIENT)**: returns a promise that resolves to json object containing information about the resource that was deleted.
	- public_id: The public ID returned after uploading a resource
	- type: The type that was specified when the resource was uploaded


- Cloudinary.rules **(SERVER)** __required__: This is a javascript object of rules as functions
	- Cloudinary.rules.delete: Checks whether deleting a resource is allowed. Throw a `Meteor.Error` to disallow this action
	- Cloudinary.rules.sign_upload: Checks whether uploading a resource is allowed. Throw a `Meteor.Error` to disallow this action
	- Cloudinary.rules.private_resource: Checks whether getting a private resource is allowed. Throw a `Meteor.Error` to disallow this action
	- Cloudinary.rules.download_url: Checks whether fetching a download link for a resource is allowed. Throw a `Meteor.Error` to disallow this action
