package com.thecodinginterface.awsparams;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class AwsparamsApplication {

	@Value("${author.first-name}")
	String firstName;

	@Value("${author.middle-name}")
	String middleName;

	@GetMapping("/first-name")
	FirstNameResponse showFirstName() {
		return new FirstNameResponse(firstName);
	}

	@GetMapping("/middle-name")
	MiddleNameResponse showMiddleName() {
		return new MiddleNameResponse(middleName);
	}

	public static void main(String[] args) {
		SpringApplication.run(AwsparamsApplication.class, args);
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	static final class FirstNameResponse {
		String firstName;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	static final class MiddleNameResponse {
		String middleName;
	}
}
