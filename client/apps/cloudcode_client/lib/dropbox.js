sc_require('core');

var Dropbox = {};

/**
 * This method is used to get a random string to be used as a boundary 
 * between adjacent form fields within the payload of a HTTP POST request
 * with Content-Type set to multipart/form-data
 */
Dropbox._getRandomBoundaryString = function() {
	var time = (new Date()).getTime(); // Get current Unix timestamp in milliseconds
	var randomNumber = Math.floor(Math.random() * 32768); // A random number within the range of an integer
	return escape(time + '' + randomNumber);
};

/**
 * UTF-8 encode the strings passed with the request as recommended by the Dropbox API
 */
Dropbox.utf8EncodeString = function(string) {
	return unescape(encodeURIComponent(string));
};

Dropbox.saveFile = function(callback, path, content) {
	if (!path || typeof(path) === undefined) {
		return false;
	}
	var parts = path.split('/');
	var title = parts[parts.length - 1];
	parts.pop();
	var parentPath = parts.join('/');
  var payload = '';
  var boundary = Dropbox._getRandomBoundaryString();
  
  // Setting the payload of a multipart POST request
  // as mentioned in http://www.faqs.org/rfcs/rfc2388.html
  var body = '';  
  body += "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=file; filename=" + Dropbox.utf8EncodeString(title) + "\r\n";
  body += "Content-Type: application/octet-stream\r\n\r\n";
  body += content + "\r\n";
  body += "--" + boundary + "--";

 	var url = 'https://api-content.dropbox.com/1/files/dropbox' + Dropbox.utf8EncodeString(parentPath);
	console.log('Sending request to Dropbox %@..'.fmt(url));
	var oauth = chrome.extension.getBackgroundPage().chromeExOAuth;
	oauth.sendSignedRequest(url, function(response) {
		console.log('Receiving response from Dropbox..');
		callback(response);
	}, 
	  {
		  'method': 'POST',
		  'parameters': {
		    'file': Dropbox.utf8EncodeString(title)
		  },
		  'headers': {
			  'Content-Type': 'multipart/form-data; boundary=' + boundary 
		  },
		  'body': body
		}
	);
};

Dropbox.renameFile = function(callback, oldPath, newPath) {
	var url = 'https://api.dropbox.com/0/fileops/move';
	var oauth = chrome.extension.getBackgroundPage().chromeExOAuth;
	console.log('Sending request to Dropbox %@..'.fmt(url));
	oauth.sendSignedRequest(url, function(response) {
		console.log('Receiving response from Dropbox..');
		callback(response);
	}, 
	  {
		  'method': 'POST',
		  'parameters': {
		    'from_path': oldPath,
		    'root': 'dropbox',
		    'to_path': newPath	
		  }
		}
	);
};

Dropbox.getFile = function(callback, path) {
	var path = path || '/dropbox/';
	var url = 'https://api-content.dropbox.com/0/files' + escape(path);
	var oauth = chrome.extension.getBackgroundPage().chromeExOAuth;
	console.log('Sending request to Dropbox %@..'.fmt(url));
	oauth.sendSignedRequest(url, function(response) {
		console.log('Receiving response from Dropbox..');
		callback(response);
	});
};

Dropbox.getFiles = function(callback, path) {
	var path = path || '/dropbox/'; // /dropbox is the root of all dropbox files
	var url = 'https://api.dropbox.com/0/files' + escape(path);
	var oauth = chrome.extension.getBackgroundPage().chromeExOAuth;
	console.log('Sending request to Dropbox %@..'.fmt(url));
	oauth.sendSignedRequest(url, function(response) {
		console.log('Receiving response from Dropbox..');
		callback(response);
	});
};