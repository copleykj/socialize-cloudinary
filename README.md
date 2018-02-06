# Cloudinary Image/File Uploader #
Cloudinary provides a simple way for uploading files to Cloudinary, which in turn can be set up to sync with your Amazon S3 service. This is useful for uploading and actively manipulating images and files that you want accesible to the public. Cloudinary is built on [Cloudinary (NPM)](https://github.com/cloudinary/cloudinary_npm) and [Cloudinary (JS)](https://github.com/cloudinary/cloudinary_core). These packages must be installed via `metoer npm install --save` command for this package to work.

This project is based heavily on [lepozepo:cloudinary](https://github.com/Lepozepo/cloudinary/). Coffeescript has been converted to ES2015, Modules are now implemented, no more dependence on jQuery or Blaze, functions that call server methods now return promises, and client side cloudinary config has been tweaked to bring it more inline with the server side implementation.

## Supporting the Project ##
In the spirit of keeping this and all of the packages in the [Socialize](https://atmospherejs.com/socialize) set alive, I ask that if you find this package useful, please donate to it's development.

[Bitcoin](https://www.coinbase.com/checkouts/4a52f56a76e565c552b6ecf118461287) / [Patreon](https://www.patreon.com/user?u=4866588) / [Paypal](https://www.paypal.me/copleykj)

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
Cloudinary.config({
	cloud_name: 'cloud_name'
	api_key: '1237419'
	api_secret: 'asdf24adsfjk'
});

// Rules are all optional. Return true to pass validation. If rule is not set validation will always pass.
Cloudinary.rules.delete = function (userId, publicId) {
	return !!userId && !!publicId
};

Cloudinary.rules.sign_upload = function (userId) {
	return !!userId;
};

Cloudinary.rules.private_resource = function (userId) {
	return !!userId;
};

Cloudinary.rules.download_url = function (userId) {
	return !!userId;
};
```

**Client**

```javascript
Cloudinary.config({
	cloud_name:'cloud_name',
	api_key: 'Your Key Here',
})

```

## Uploading ##
Wire up your `input[type="file"]`. CLIENT SIDE.

``` javascript
Template.templateName.events({
	'change input[type=file]': function(e) {
		const { files } = e.currentTarget;

		Cloudinary.upload(files, {

		},function(error, response){

		});
	}
});
	"change input[type='file']": (e) ->
		files = e.currentTarget.files

		Cloudinary.upload files,
			folder:"secret" # optional parameters described in http://cloudinary.com/documentation/upload_images#remote_upload
			type:"private" # optional: makes the image accessible only via a signed url. The signed url is available publicly for 1 hour.
			(err,res) -> #optional callback, you can catch with the Cloudinary collection as well
				console.log "Upload Error: #{err}"
				console.log "Upload Result: #{res}"

```


## How to read and manipulate
All of Cloudinary's manipulation options are available in the c.url helper. You can access an image by passing a cloudinary public_id:

``` handlebars
<img src="{{c.url public_id}}">
<img src="{{c.private_url public_id}}">
```

You can manipulate an image by adding parameters to the helper
``` handlebars
<img width="250" src="{{c.url public_id effect='blur:300' angle=10}}">
```

Obs: If you want to resize your image in a smaller size you will need to pass the `crop` parameter
``` handlebars
<img src="{{c.url public_id width=250 height=250 crop="fill"}}">
```
For more information see the cloudinary's documentation:
[http://cloudinary.com/documentation/image_transformations#crop_modes](http://cloudinary.com/documentation/image_transformations#crop_modes)


## Compatibility

If you are using the `browser-policy` package, don't forget to allow images from cloudinary to load on your webapp by using `BrowserPolicy.content.allowImageOrigin("res.cloudinary.com")`

Here are all the transformations you can apply:
[http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)

### Cordova Android Bug with Meteor 1.2+

Due to a [bug in the Cordova Android version that is used with Meteor 1.2](https://issues.apache.org/jira/browse/CB-8608?jql=project%20%3D%20CB%20AND%20text%20~%20%22FileReader%22), you will need to add the following to your mobile-config.js or you will have problems with this package on Android devices:

```js
App.accessRule("blob:*");
```


## How to delete from Cloudinary
Just pass the public_id of the image or file through this function (security features pending). It will return an object with a list of the images deleted as a result.

```javascript
// client side
try {
	const result = await Cloudinary.delete(public_id);
} catch (e) {
	console.log(e.reason);
}
```

## How to generate a downloadable link
```javascript
try {
	const url = await Cloudinary.downloadUrl(public_id, options);
} catch (e){
	console.log(e.reason);
}
```

### API
- Cloudinary.config(options) __required__:
	- cloud_name: Name of your cloud
	- api_key: Your Cloudinary API Key
	- api_secret: Your Cloudinary API Secret - only set this on the server


- sync Cloudinary.url(public_id, options) **(CLIENT)**: returns a generated url
	- public_id: The public ID returned after uploading a resource
	- options: A set of transformations described here [http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)


- async Cloudinary.privateUrl(public_id, options) **(CLIENT)**: returns a promise which resolves to a signed URL
	- public_id: The public ID returned after uploading a resource
	- options: A set of transformations described here [http://cloudinary.com/documentation/image_transformations#reference](http://cloudinary.com/documentation/image_transformations#reference)


- async Cloudinary.downloadUrl(public_id) **(CLIENT)**: returns a promise that resolves to a url that will expire in 1 hour, does not take any transformations
	- public_id: The public ID returned after uploading a resource


- Cloudinary.rules **(SERVER)** __required__: This is a javascript object of rules as functions
	- Cloudinary.rules.delete: Checks whether deleting a resource is allowed. Return true to allow the action.
	- Cloudinary.rules.sign_upload: Checks whether uploading a resource is allowed. Return true to allow the action.
	- Cloudinary.rules.private_resource: Checks whether getting a private resource is allowed. Return true to allow the action.
	- Cloudinary.rules.download_url: Checks whether fetching a download link for a resource is allowed. Return true to allow the action.
