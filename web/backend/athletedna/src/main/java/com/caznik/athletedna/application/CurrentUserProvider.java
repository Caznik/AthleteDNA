package com.caznik.athletedna.application;

import com.caznik.athletedna.domain.model.User;

// Seam for the "currently logged-in user". Today returns a hardcoded stub user.
// The future real-auth workitem replaces the bean exposing this interface.
public interface CurrentUserProvider {
	User current();
}
