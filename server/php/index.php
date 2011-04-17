<?php
require_once('includes/cloudcode.inc');
cloudcode_run_application(
   array(
    '(/)?' => array(
      'handler_class' => 'MainHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?install(/)?' => array(
      'handler_class' => 'InstallHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?uninstall(/)?' => array(
      'handler_class' => 'UninstallHandler',
      'access' => 'Access::administrator_access'
    ),
    '(/)?oauth/consumer(/)?' => array(
      'handler_class' => 'OAuthHandler',
      'access' => 'Access::registered_access'
    ),
    '(/)?oauth/request_token(/)?' => array(
      'handler_class' => 'OAuthHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?oauth/auth_token(/)?' => array(
      'handler_class' => 'OAuthHandler',
      'access' => 'Access::registered_access'
    ),
    '(/)?oauth/access_token(/)?' => array(
      'handler_class' => 'OAuthHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?test(/)?' => array(
      'handler_class' => 'TestHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?logout(/)?' => array(
      'handler_class' => 'LogoutHandler',
      'access' => 'Access::registered_access'
    ),
    '(/)?user/login(/)?|(/)?user/login(/)?.*' => array(
      'handler_class' => 'LoginHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?user/signup(/)?|(/)?user/signup(/)?.*' => array(
      'handler_class' => 'RegisterHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?api/.*(/)?|(/)?user/signup(/)?.*' => array(
      'handler_class' => 'ApiHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?tests(/)?' => array(
      'handler_class' => 'ApiTestHandler',
      'access' => 'Access::anonymous_access'
    ),
    '(/)?mobwrite(/)?' => array(
      'handler_class' => 'MobwriteTestHandler',
      'access' => 'Access::anonymous_access'
    )
  )
);