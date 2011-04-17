<?php 

class Access {
  
  /**
   * 
   * Any unregistered/not logged in user can see this page
   */
  public static function anonymous_access() {
    return TRUE;
  }
  
  /**
   * 
   * Any registered/currently logged in user can see this page
   */
  public static function registered_access() {
    global $user;
    return (isset($user)) ? TRUE : FALSE;
  }
  
  /**
   * 
   * Only administrator has access to a particular resource
   */
  public static function administrator_access() {
    global $user, $mysql;
    // Before installation, there is no concept of
    // access, so permit access to this url freely
    if (!$mysql->table_exists('users')) {
      return TRUE;
    } 
    return self::registered_access() && ($user->uid == 1);
  }
};

?>