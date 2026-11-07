package com.hogyi.loginproject.email;

import lombok.Getter;

@Getter
public enum EmailTemplateName {

	ACTIVATE_ACCOUNT("activate_account");

	private EmailTemplateName(String name) {
		this.name = name;
	}

	private final String name;

}
