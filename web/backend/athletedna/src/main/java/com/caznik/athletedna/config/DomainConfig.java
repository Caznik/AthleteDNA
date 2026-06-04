package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.caznik.athletedna.domain.service.TrainingLoadCalculator;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class DomainConfig {

	@Bean
	public TrainingLoadCalculator trainingLoadCalculator() {
		return new TrainingLoadCalculator();
	}
}