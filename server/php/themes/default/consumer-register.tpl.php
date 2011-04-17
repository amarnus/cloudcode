<?php
/**
 * 
 * Required variables for generating this form
 * $id
 *   A unique string identifier for the form
 * $class
 *   additional attributes to add
 * $form_build_id
 *   Unique, random string to prevent malicious users trying to modify form data on their own
 * $method
 *   Form submit type - GET or POST
 * $action
 *   Target of the form
 * $class
 *   A space seperated string of CSS classes to be associated with the form
 */
?>

<form action="<?php print $action; ?>" method="<?php print $method; ?>" class="<?php print $class; ?>" id="<?php print $form_id; ?>" onsubmit="document.getElementById('user-login-submit-button').disabled=true; return true;">
  <div class="form-item">
    <label for="email">Key &middot; <span>Consumer key to be used by your client application to authorize</span></label>
    <input type="text" autocomplete="off" name="consumer_key" placeholder="Consumer Key" size="60" readonly value="<?php print isset($consumer_key) ? $consumer_key : ''; ?>"/>
  </div>
  <div class="form-item">
    <label for="email">Secret &middot; <span></span></label>
    <input type="text" autocomplete="off" name="consumer_secret" placeholder="Consumer Secret" size="60" readonly value="<?php print isset($consumer_secret) ? $consumer_secret : ''; ?>"/>
  </div>
  <div class="form-item">
    <input type="hidden" name="form_id" value="<?php print $form_id; ?>"/>
  </div>
  <div class="form-item">
    <input type="hidden" name="form_build_id" value="<?php print $form_build_id; ?>"/>
  </div>
  <div class="form-item">
    <input type="submit" name="submit" value="Update my Consumer Key and Secret" id="user-login-submit-button"/>
  </div>
</form>