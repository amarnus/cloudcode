CloudcodeClient.BrowserStore = SC.Object.extend({
	supportedBrowser: false,
	factory: null,
	db: null,
	
	init: function() {
		if ('webkitIndexedDB' in window) {
		  this.set('supportedBrowser', true); 
		  this.set('factory', window.webkitIndexedDB);
		}
		else if ('mozIndexedDB' in window) {
			this.set('supportedBrowser', true);
			this.set('factory', window.mozIndexedDB);
		}
	},
	
	checkObjectStores: function(stores) {
		var db = this.get('db');
		for (var i = 0; i < stores.length; i++) {
			db.createObjectStore(stores[i]);
		}
	},
	
	checkDatabase: function(name, callback) {
		if (this.get('supportedBrowser')) {
			var factory, request, that, db, version, reqv;
			factory = this.get('factory');
			that = this;
			request = factory.open(name, 'A document database inside the browser to hold Cloudcode data');
			request.onsuccess = function(e) {
				db = e.srcElement.result;
				console.log("Created %@ database..".fmt(db.name));
		    that.set('db', db);
				if (db.version.length == 0) {
	        reqv = db.setVersion("1.0");
					reqv.onsuccess = function(e) {
						that.checkObjectStores([ "project", "file", "user" ]);
						callback(true);
					};
					reqv.onfailure = function(e) {
						// console.error("Problem.." + e);
					};
				}
				else {
					callback(true);
				}
			};
			request.onfailure = function() {
				callback(false);
			};
		}
		else {
		  callback(false);
		}
	},
	
	add: function(storeName, dataHash) {
		var db, trans, store;
		db = this.get('db');
		if (db) {
			trans = db.transaction([storeName], window.webkitIDBTransaction.READ_WRITE);
			store = trans.objectStore(storeName);
			console.log(store);
			var req = store.put(dataHash, "hello_world");
			req.onsuccess = function() {
				req2 = store.openCursor();
				req2.onsuccess = function(evt) {
					console.log(evt);
				};
			};
			req.onerror = function(e) {
				console.log(e);
				console.error("There was a problem writing %@ to %@", JSON.stringify(dataHash), storeName);
			};
		}
	},
	
	fetch: function() {
		var that = this;
		this.checkDatabase("CloudcodeClient", function(complete) {
			if (complete) {
				var db, trans, stores, store, data;
				that.add("project", { x:2, y:3 });
				db = that.get('db'); 
				stores = [ "project", "user", "file" ];
				trans = db.transaction(stores);
				data = {}; 
				for(var i = 0; i < stores.length; i++) {
					(function(x) {
						store = trans.objectStore(stores[x]);
						data[stores[x]] = [];
						var res = store.openCursor();
						res.onsuccess = function(event) {
							console.log(event.srcElement);
							if (event.srcElement.result == null) {
								return;
							}
						  console.log(x);
							console.log(stores);
							console.log(stores[x]);
							data[stores[x]].push(event.srcElement.result.value);
							console.log(event.result);
							Function.call("event.srcElement.result.continue");
						};
					})(i);
				}
			  console.log(data);
				return data;
			}
		});
	}
});