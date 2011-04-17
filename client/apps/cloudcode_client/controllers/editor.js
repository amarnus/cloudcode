CloudcodeClient.editorController = SC.Object.create({
		
	  _editor: null,
	  cursorPosition: "",
	  lineCount: "",
	  file: null, // Meta information about the file being currently displayed by the editor
	  searchText: null,
	  revision: "",
	  searchTraces: [],
	  searchTimer: null,
	  
	  onSearchTextChange: function() {
	  	var searchText = this.get('searchText'), searchTimer;
	  	searchTimer = this.get('searchTimer');
	  	if (searchTimer !== null) {
	  		searchTimer.invalidate();
	  	}
	  	searchTimer = this.scheduleTimeout("find", 100);
	  	this.set('searchTimer', searchTimer);
	  }.observes('searchText'),
	  
	  onFocus: function() {
			var editorView = CloudcodeClient.editorController.getEditorView(), mode, editor, file;
			if (!editorView.get('isKeyResponder')) {
		    editorView.becomeFirstResponder();
			}
	    editor = CloudcodeClient.editorController;
			file = editor.get('file');
			if (file) {
        mode = CloudcodeClient.getCodeMirrorModeFromMIMEType(file.get('type'));
        if (mode == "javascript") {
			    var timer = editor.scheduleTimeout("jsHintStart", 1000);
			    editor.get('jsHint').timer = timer;
        }
			}
	  },
	  
	  // Implement low-level caching here to save the state of
	  // the editor so that it can be restored when the editor
	  // is revisited
	  // We can use the file ID of the file as the key, I think
	  
	  onBlur: function() {},
	  
	  onScroll: function(updates) {
	  	// console.log(updates);
	  },
	  
	  unmark: function() {
	  	var searchTraces = this.get('searchTraces');
	  	for(var i = 0; i < searchTraces.length; i++) {
	  		searchTraces[i]();
	  	}
	  	searchTraces.length = 0;
	  	this.set('searchTraces', searchTraces);
	  },
	  
	  find: function() {
	  	this.unmark();
	  	var editor, searchText, searchTraces, firstTime = true, coords;
	  	searchTraces = this.get('searchTraces');
	  	editor = this.get('_editor');
	  	searchText = this.get('searchText');
	  	if (editor !== null && searchText !== null && (searchText.length > 0)) {
	  		var cursor = editor.getSearchCursor(searchText);
	  		while(cursor.findNext()) {
	  			if (cursor !== undefined) {
	  	  		if (firstTime) {
	  	  			coords = editor.localCoords(cursor.from());
	  	  		  editor.scrollIntoView(coords.x, coords.y, coords.x, coords.yBot);
	  	  		  firstTime = false;
	  	  		}
  				  searchTraces.push(editor.markText(cursor.from(), cursor.to(), 'editorMarkedText'));
	  			}
  				cursor.findNext();
	  		}
	  	}
	  	this.set('searchTraces', searchTraces);
	  },
	  
	  onCursorActivity: function() {
      var editor = CloudcodeClient.editorController;
      editor.setCursor();
      editor.setLineCount();
	  },
	  
	  filePath: function() {
	  	var file = this.get('file');
	  	if (file) {
	  		return "<strong>Path:</strong> %@".fmt(file.get('path'));
	  	}
	  }.property().cacheable(),
	  
	  revisionObserver: function(file) {
	  	if (file.get('isDestroyed')) {
	  		CloudcodeClient.editorController.tearDown();
	  	}
	  	CloudcodeClient.editorController.set('revision', "<strong>Revision: </strong>" + file.get('revision').get('vid'));
	  	SC.RunLoop.end();
	  },
	  
	  setFile: function(file) {
	  	this.set('file', file);
	  	this.set('filePath', file.get('path'));
	  	this.set('revision', "<strong>Revision: </strong>: " + file.get('revision').get('vid'));
	  	file.addObserver('revision', this.revisionObserver);
	  },
	  
	  setCursor: function() {
	  	var editor = this.get('_editor'), cursor, row, col;
	  	if (editor) {
		  	cursor = editor.getCursor();
		  	row = cursor.line || 0;
		  	col = cursor.ch || 0;
		  	this.set('cursorPosition', "<strong>Cursor:</strong> %@ : %@".fmt(row, col));
	  	}
	  },
	  
	  setLineCount: function() {
	  	var editor = this.get('_editor');
	  	if (editor) {
	  		lineCount = editor.lineCount() || 0;
	  		this.set('lineCount', "<strong>Lines:</strong> %@".fmt(lineCount));
	  	}
	  },
	  
	  isFirstResponder: NO,
	  
	  jsHint: {
	  	timer: null,
	  	errors: {}
	  },
	  
	  onGutterClick: function(editor, line, event) {
	  	var editor = CloudcodeClient.editorController;
	  	if (editor.jsHint.errors[line]) {
	  		var reasons = editor.jsHint.errors[line];
	  		var reasonsString = "";
	  		reasons.forEach(function(reason) {
	  			reasonsString += '<p>' + reason + '</p>';
	  		});
	  		var pane = SC.PickerPane.create({
	  			classNames: [ 'jsHintMarker' ],
	  			textAlign: SC.ALIGN_CENTER,
	  			layout: { centerY: 0, width: 200, height: 50 },
	  			contentView: SC.View.extend({
	  				render: function(context, firstTime) {
	  					context.begin('span');
	  					context.addClass('jsHintMarker');
	  					context.push(reasonsString);
	  					context.end();
	  				}
	  			})
	  		});
	  		pane.popup(SC.$('span.marker-' + line).get(0));
	  	}
	  },
	  
	  scheduleTimeout: function(callback, interval) {
			var timer = SC.Timer.schedule({
				target: CloudcodeClient.editorController, 
				action: callback, 
				interval: interval
		  });
			return timer;
	  },
		
		onKeyEvent: function(editor, keyStroke) {
			var editor = CloudcodeClient.editorController;
			if (keyStroke.type == "keydown") {
				var timerSet = editor.jsHint.timer;
				if (timerSet) {
					timerSet.invalidate();
				}
			  editor = CloudcodeClient.editorController;
				file = editor.get('file');
				if (file) {
	        mode = CloudcodeClient.getCodeMirrorModeFromMIMEType(file.get('type'));
	        if (mode == "javascript") {
				    var timer = editor.scheduleTimeout("jsHintStart", 1000);
				    editor.get('jsHint').timer = timer;
	        }
				}
			}
		},
		
		jsHintStart: function() {
			var editor = CloudcodeClient.editorController;
			this.clearMarkers();
			JSHINT(editor.getContent());
			JSHINT.errors.forEach(function(error) {
				if (!error) {
					return;
				}
				--error.line;
				if (!editor.jsHint.errors[error.line]) {
					editor.jsHint.errors[error.line] = [ error.reason ];
				}
				else {
					editor.jsHint.errors[error.line].push(error.reason);
				}
				editor.placeMarker(error.line, "<span class='marker marker-" + error.line + "' style='color:#900;' title='" + error.reason + "'>&#149;</span> %N%");
			});
		},
		
		placeMarker: function(line, text) {
			var editor = this.get('_editor');
			if (editor) {
				editor.refresh();
				editor.setMarker(line, text);
			}
		},
		
		clearMarkers: function() {
			if (this.get('jsHint')['timer']) {
				this.get('jsHint')['timer'].invalidate();
			}		
			if (this.get('jsHint')['errors']) {
				var editor = this.get('_editor');
				if (editor) {
					var errors = this.get('jsHint')['errors'];
					if (errors !== null) {
						for(var property in errors) {
							if (errors.hasOwnProperty(property)) {
								editor.clearMarker(parseInt(property));
								delete errors[property];
							}
						}
					}
				}
				this.set('jsHint', { timer: null, errors: {} });
			}
		},
		
		getEditorView: function() {
			return CloudcodeClient.mainPage.getPath('mainPane.content.bottomRightView.contentView.editorView');
		},
		
		tearDown: function() {
			this.clearMarkers();
			var editor = this.get('_editor');
			if (editor) {
				editor.refresh();
			}
			var editorView = CloudcodeClient.editorController.getEditorView();
			editorView.set('isVisible', NO);
		},
		
		setUp: function() {
			this.tearDown(); // Clear the last instance if one exists
			var editorView = CloudcodeClient.editorController.getEditorView();
			if (editorView) {
				editorView.set('isVisible', YES);
				return YES;
			}
			return NO;
		},
		
		blur: function() {
			var editor = this.get('_editor');
			editor.blur();
		},
		
		hide: function() {
			var editorView = CloudcodeClient.editorController.getEditorView();
			if (editorView && editorView.get('isVisible')) {
				editorView.set('isVisible', NO);
			}
		},
		
		boot: function() {
			sc_super();
			var editorDOMElement = document.getElementById("code");
			var editor = CodeMirror.fromTextArea(editorDOMElement, {
				mode: "xml",
			  lineNumbers: true,
			  matchBrackets: true,
			  enterMode: "flat",
			  gutter: true,
			  readOnly: false,
			  onFocus: this.onFocus,
			  onBlur: this.onBlur,
			  workTime: 200,
			  workDelay: 200,
			  undoDepth: 100,
			  onKeyEvent: this.onKeyEvent,
			  onGutterClick: this.onGutterClick,
			  onCursorActivity: this.onCursorActivity,
			  onScroll: this.onScroll
			});
			this.set('_editor', editor);
		},
		
		isValidFile: function(file) {
			if (file === null || !file.get('isRecord')) {
				throw "File is not a record";
			}
  		var storeKey = file.get('storeKey'), recordType;
  		recordType = SC.Store.recordTypeFor(storeKey);
  		if (recordType != "CloudcodeClient.File") {
  			throw "Invalid type of record. Expected %@, got %@".fmt("CloudcodeClient.File", recordType);
  		}
		},
		
		// We pass an object and an attribute that
		// corresponds to content
		addContent: function(file, content) {
			this.isValidFile(file);
			var editorView = CloudcodeClient.editorController.getEditorView();
			var editor = this.get('_editor');
			if (editor) {
				if (content === null) {
					content = "";
				}
				var setUp = this.setUp();
				if (setUp) {
					editor.setValue(content);
					editor.setOption('mode', CloudcodeClient.getCodeMirrorModeFromMIMEType(file.get('type')));
					this.setFile(file);
					this.setCursor();
					this.setLineCount();
					return YES;
				}
				return NO;
			}
		},
		
		getContent: function() {
			var editor = this.get('_editor');
			if (editor) {
				return editor.getValue();
			}
			return null;
		}
		
	});