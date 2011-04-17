<!doctype html>  
<!--[if lt IE 7 ]> <html lang="en" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"> <!--<![endif]-->
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title><?php print $title; ?> / <?php print $sitename; ?></title>
  <meta name="description" content="<?php print $description; ?>">
  <meta name="author" content="<?php print $author; ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <?php foreach($styles as $style): ?>
    <link rel="stylesheet" href="<?php print $style; ?>">
  <?php endforeach; ?>
</head>

<body>
  <div id="container">
    <header>
      <div id="sitename">
        <h1><?php print $sitename; ?></h1>
      </div>
      <div id="site-description">
        <?php print $sitedescription; ?>
      </div>
      <div class="clear"></div>
    </header>
    <div id="main">
      <h2><?php print $title; ?></h2>
      <div class="description"><?php print $description; ?></div>
      <div class="content">
        <?php foreach ($messages as $message): ?>
          <?php print $message; ?>
        <?php endforeach; ?>
      	<?php print $content; ?>
      </div>
    </div>
    
    <footer>
       <?php foreach($links as $link): ?>
         <?php print $link; ?>
       <?php endforeach; ?>
       <div class="copyright">
         &copy; 2011 CloudCode
       </div>
    </footer>
  </div> <!-- end of #container -->
  
  <?php foreach($behaviors as $behavior): ?>
    <?php if (($behavior['type']) == 'inline'): ?>
      <script><?php print $behavior['src']; ?></script>
    <?php else: ?>
      <script src="<?php print $behavior['src']; ?>"></script>
    <?php endif; ?>   
  <?php endforeach; ?>
  
  <!-- scripts concatenated and minified via ant build script 
  <script src="js/plugins.js"></script>
  <script src="js/script.js"></script>
  <!-- end concatenated and minified scripts-->
  
  
  <!--[if lt IE 7 ]>
    <script src="js/libs/dd_belatedpng.js"></script>
    <script> DD_belatedPNG.fix('img, .png_bg'); </script>
  <![endif]-->

  <!-- yui profiler and profileviewer - remove for production
  <script src="js/profiling/yahoo-profiling.min.js"></script>
  <script src="js/profiling/config.js"></script>
  <!-- end profiling code -->


  <!-- change the UA-XXXXX-X to be your site's ID
  <script>
   var _gaq = [['_setAccount', 'UA-XXXXX-X'], ['_trackPageview']];
   (function(d, t) {
    var g = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
    g.async = true;
    g.src = ('https:' == location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    s.parentNode.insertBefore(g, s);
   })(document, 'script');
  </script>
  -->
</body>
</html>