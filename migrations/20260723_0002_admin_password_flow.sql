-- Generated administrator passwords are definitive. Clear the legacy flag
-- without modifying password hashes, roles, permissions or content.

UPDATE admin_users
SET must_change_password = false
WHERE must_change_password = true;
