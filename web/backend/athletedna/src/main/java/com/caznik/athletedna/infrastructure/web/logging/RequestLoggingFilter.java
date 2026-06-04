package com.caznik.athletedna.infrastructure.web.logging;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// One access-log line per request: method, path, resulting status and wall-clock
// latency. Runs just inside TraceIdFilter so each line already carries the request's
// trace id.
//
// The query string is deliberately omitted: the Strava OAuth callback carries the
// authorization code there and it must never reach the logs. The line is emitted in
// a finally block so it is written even when the handler throws.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLoggingFilter extends OncePerRequestFilter {

	private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		long startNanos = System.nanoTime();
		try {
			filterChain.doFilter(request, response);
		} finally {
			long tookMs = (System.nanoTime() - startNanos) / 1_000_000;
			log.info("{} {} -> {} ({} ms)",
				request.getMethod(),
				request.getRequestURI(),
				response.getStatus(),
				tookMs);
		}
	}

	// Keep the noisy, uninteresting endpoints out of the access log.
	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return path.startsWith("/swagger-ui")
			|| path.startsWith("/v3/api-docs")
			|| path.equals("/favicon.ico");
	}
}
