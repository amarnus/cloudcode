<?php 
function request($end_point, $method, $params = array(), $body = null) {
  $request = new OAuthRequester(
    OAUTH_HOST . $end_point, 
    $method, 
    $params, 
    $body
  );
  return (object) $request->doRequest(0);
}
  
require_once "oauth/OAuthStore.php";
require_once "oauth/OAuthRequester.php";
define("CONSUMER_KEY", "d9d2c022819c78b987ad219b19bcb04b04d79b23c"); 
define("CONSUMER_SECRET", "f65a6554500909193a3da804d0a597da"); 
define("OAUTH_HOST", "http://localhost/cloudcode_server/");
define("REQUEST_TOKEN_URL", OAUTH_HOST . "oauth/request_token");
define("AUTHORIZE_URL", OAUTH_HOST . "oauth/auth_token");
define("ACCESS_TOKEN_URL", OAUTH_HOST . "oauth/access_token");
define('OAUTH_TMP_DIR', function_exists('sys_get_temp_dir') ? sys_get_temp_dir() : realpath($_ENV["TMP"]));
$options = array(
	'consumer_key' => CONSUMER_KEY, 
	'consumer_secret' => CONSUMER_SECRET,
	'server_uri' => OAUTH_HOST,
	'request_token_uri' => REQUEST_TOKEN_URL,
	'authorize_uri' => AUTHORIZE_URL,
	'access_token_uri' => ACCESS_TOKEN_URL
);
OAuthStore::instance("Session", $options);
try {
  if (empty($_GET["oauth_token"])) {
    $getAuthTokenParams = array(
  		'scope' => 'http://localhost/cloudcode_server',
			'xoauth_displayname' => 'OAuth Test',
			'oauth_callback' => 'http://localhost/cloudcode_server/test.php'
		);
    $tokenResultParams = OAuthRequester::requestRequestToken(CONSUMER_KEY, 1, $getAuthTokenParams);
    header("Location: " . AUTHORIZE_URL . "?btmpl=mobile&oauth_token=" . $tokenResultParams['token']);
  }
  else {
    $oauthToken = $_GET["oauth_token"];
    $tokenResultParams = $_GET;	
    try {
      OAuthRequester::requestAccessToken(CONSUMER_KEY, $oauthToken, 0, 'POST', $_GET);
    }
    catch (OAuthException2 $e) {
	    print $e->getMessage() . $e->getLine() . $e->getFile();
      return;
    }
    ob_start();
    /*
		$result = request('api/projects', 'GET');
		print $result->code;
		print $result->body;
		print '<p></p>';
		$result = request('api/projects', 'POST', array('title' => 'Google Maps'), 'Displays a Google Map, that\'s all');
		print $result->code;
		print $result->body;
		print '<p></p>';
		$project = json_decode($result->body);
		$result = request('api/directory', 'POST', array('pid' => $project->pid, 'title' => 'css', 'path' => '/'));
		print $result->code;
		print $result->body;
		$directory = json_decode($result->body);
		print '<p></p>';
		$result = request('api/files', 'POST', array('title' => 'README.txt', 'path' => '/css/', 'pid' => $project->pid, 'type' => 'text/css', 'ext' => 'css'), 'Read this file before hacking this project..');
		print $result->code;
		print $result->body;
		$file = json_decode($result->body);
		print '<p></p>';
		*/
    /*
	  $result = request('api/file', 'POST', array('title' => 'readme.pq', 'path' => '/css/readme.txt', 'pid' => 10, 'fid' => 36), 'Please read this file before hacking this project');
		print $result->code;
		print $result->body;
		print '<p></p>';
		*/
	  $result = request('api/account', 'GET');
		print $result->code;
		print $result->body;
		print '<p></p>';
		/*
		$result = request('api/file', 'DELETE', array('pid' => $project->pid, 'fid' => $directory->fid));
		print $result->code;
		print $result->body;
		print '<p></p>';
		$result = request('api/project', 'DELETE', array('pid' => $project->pid));
		print $result->code;
		print $result->body;  
		print '<p></p>';
		*/
		ob_end_flush();
  }
}
catch(OAuthException2 $e) {
  echo "OAuthException:  " . $e->getMessage() . $e->getLine() . $e->getFile();
}