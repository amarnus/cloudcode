CloudcodeClient.Project = SC.Record.extend({
	 pid: SC.Record.attr(String),
   title: SC.Record.attr(String),
   description: SC.Record.attr(String),
   user: SC.Record.toOne("Cloudcode.User"),
   root: SC.Record.toOne("Cloudcode.File"), 
   vid: SC.Record.attr(String),
   template_pid: SC.Record.attr(String),
   updated: SC.Record.attr(String),
   created: SC.Record.attr(String)
});