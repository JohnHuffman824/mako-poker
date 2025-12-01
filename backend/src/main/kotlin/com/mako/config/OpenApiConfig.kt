package com.mako.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * OpenAPI/Swagger configuration for API documentation.
 */
@Configuration
class OpenApiConfig {

    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Poker GTO API")
                    .version("1.0.0")
                    .description("""
                        REST API for the Poker GTO Assistant application.
                        
                        Provides:
                        - User authentication and session management
                        - GTO (Game Theory Optimal) poker analysis
                        - Solver engine for calculating optimal play
                        - Session tracking and statistics
                    """.trimIndent())
                    .contact(
                        Contact()
                            .name("Poker GTO Team")
                            .email("support@pokergto.com")
                    )
                    .license(
                        License()
                            .name("MIT License")
                            .url("https://opensource.org/licenses/MIT")
                    )
            )
            .addSecurityItem(SecurityRequirement().addList("Bearer Authentication"))
            .components(
                Components()
                    .addSecuritySchemes(
                        "Bearer Authentication",
                        SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .bearerFormat("JWT")
                            .scheme("bearer")
                            .description("Enter JWT token")
                    )
            )
    }
}

