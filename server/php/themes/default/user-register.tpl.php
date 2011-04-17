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
 */
?>

<form action="<?php print $action; ?>" method="<?php print $method; ?>" class="<?php print $class; ?>" id="<?php print $form_id; ?>" onsubmit="document.getElementById('user-login-submit-button').disabled=true; return true;">
  <div class="form-item">
    <label for="email">Email &middot; <span>An email address to associate your account with. Useful for retrieving your password.</span></label>
    <input type="text" autocomplete="off" name="email" placeholder="Email Address" size="60" value="<?php print isset($values['username']) && $values['username']; ?>"/>
  </div>
  <div class="form-item">
    <label for="password">Password &middot; <span>Password to be used for your account</span></label>
    <input type="password" autocomplete="off" name="password" size="60" value="<?php print isset($values['password']) && $values['password']; ?>"/>
  </div>
  <div class="form-item">
    <label for="verify_password">Verify Password &middot; <span>Re-type your password</span></label>
    <input type="password" autocomplete="off" name="verify_password" size="60" value="<?php print isset($values['verify_password']) && $values['verify_password']; ?>"/>
  </div>
  <div class="form-item">
    <input type="hidden" name="form_id" value="<?php print $form_id; ?>"/>
  </div>
  <div class="form-item">
    <input type="hidden" name="form_build_id" value="<?php print $form_build_id; ?>"/>
  </div>
  <div class="form-item">
    <input type="submit" name="submit" value="Login" id="user-login-submit-button"/>
  </div>
</form>