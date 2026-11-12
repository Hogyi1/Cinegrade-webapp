package hu.elte.ik.thesis.cinegrade.auth.activation;

import hu.elte.ik.thesis.cinegrade.user.User;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class RegistrationToken {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long id;
	private String code;

	@CreatedDate
	@Column(nullable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime expiresAt;
	private LocalDateTime validatedAt;
	private LocalDateTime lastSentAt;

	@Column(nullable = false)
	private Integer attempts;

	@ManyToOne
	@JoinColumn(name = "userId", nullable = false)
	private User user;
}
