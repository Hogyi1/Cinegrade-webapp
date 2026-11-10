package hu.elte.ik.thesis.cinegrade.email;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

	private final JavaMailSender mailSender;
	private final SpringTemplateEngine templateEngine;

	// Feladó címe (.env: MAIL_FROM). Gmailnél meg kell egyeznie a bejelentkezett fiókkal.
	@Value("${application.security.mailing.from}")
	private String fromAddress;

	@Async
	public void sendEmail(String to, String userName, EmailTemplateName emailTemplate, String confirmationUrl,
			String activationCode, String subject) throws MessagingException {

		String templateName;
		if (emailTemplate == null) {
			templateName = "confirm-email";
		} else {
			templateName = emailTemplate.getName(); // a fájlnév (activate_account), nem az enum neve
		}

		MimeMessage mimeMessage = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
				StandardCharsets.UTF_8.name());

		Map<String, Object> properties = new HashMap<>();
		properties.put("username", userName);
		properties.put("confirmationUrl", confirmationUrl);
		properties.put("activation_code", activationCode);

		Context context = new Context();
		context.setVariables(properties);

		try {
			helper.setFrom(fromAddress, "CineGrade"); // a címzett "CineGrade" néven látja
		} catch (UnsupportedEncodingException e) {
			helper.setFrom(fromAddress);
		}
		helper.setTo(to);
		helper.setSubject(subject);

		String template = templateEngine.process(templateName, context);

		helper.setText(template, true);
		helper.addInline("logo", new ClassPathResource("email/whole-cine-logo.png"));

		mailSender.send(mimeMessage);
	}

}
