sc_require("core");

var CloudcodeApi = function() {};

CloudcodeApi.prototype.request = function(url, callback, method, params, body) {
	if (window.chrome) {
		url = CloudcodeClient.SERVER_URL + url;
		method = method || "GET";
		params = params || {};
		body = body || "";
		var backgroundPage = chrome.extension.getBackgroundPage(); 
		oauth = backgroundPage.chromeExOAuth;
		oauth.authorize(function() {
			oauth.sendSignedRequest(url, function() {
				callback.apply(callback, arguments); // Forward all arguments received
			}, { parameters: params, method: method, body: body });
	  });
	}
	else {
		console.error("Method not called from within the context of a Chrome browser");
	}
};

CloudcodeApi.prototype.getUser = function(callback) {
	this.request("/api/account", callback);
};

CloudcodeApi.prototype.getUsers = function(callback) {
	this.request("/api/users", callback);
};

CloudcodeApi.prototype.getProjects = function(all, callback) {
	this.request("/api/projects", callback);
};

CloudcodeApi.prototype.getFiles = function(params, callback) {
	this.request("/api/files", callback, "GET", params);
};

CloudcodeApi.prototype.getRevisions = function(params, callback) {
	this.request("/api/revisions", callback, "GET", params);
};

CloudcodeApi.prototype.createProject = function(params, callback) {
	this.request("/api/projects", callback, "POST", params);
};

CloudcodeApi.prototype.createDirectory = function(params, callback) {
	this.request("/api/directory", callback, "POST", params);
};

CloudcodeApi.prototype.createRevision = function(params, callback, body) {
	this.request("/api/revision", callback, "PUT", params, body);
};

CloudcodeApi.prototype.createFile = function(params, callback) {
	this.request("/api/files", callback, "PUT", params);
};

CloudcodeApi.prototype.updateFile = function(params, callback) {
	this.request("/api/file", callback, "PUT", params);
};

CloudcodeApi.prototype.removeFile = function(params, callback) {
	this.request("/api/file", callback, "DELETE", params);
};

CloudcodeApi.prototype.removeProject = function(params, callback) {
	this.request("/api/project", callback, "DELETE", params);
};