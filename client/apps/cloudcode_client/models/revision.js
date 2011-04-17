CloudcodeClient.Revision = SC.Record.extend({
	fid: SC.Record.attr(String),
	vid: SC.Record.attr(String),
	user: SC.Record.toOne("CloudcodeClient.User"),
	title: SC.Record.attr(String),
	content: SC.Record.attr(String),
	pvid: SC.Record.attr(String),
	log: SC.Record.attr(String),
	created: SC.Record.attr(Number),
	
	utcCreated: function() {
		var date = new Date(this.get('created'));
		return date.toLocaleTimeString() + ' by ' + this.get('user').get('nickname');
	}.property()
});