package com.caznik.athletedna.infrastructure.web.logging;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Gives every request a trace id and exposes it two ways:
//   * MDC key "traceId" so it prints on every log line emitted while handling the
//     request (see the logging.pattern.level override in application.properties);
//   * the X-Trace-Id response header so a client or operator can tie a single call
//     back to its log lines.
//
// An inbound X-Trace-Id is honoured (so a trace can span the frontend -> backend
// hop); otherwise a fresh short id is generated. Runs first (HIGHEST_PRECEDENCE) so
// the id is in place before any other filter — including the access log — runs.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

	public static final String TRACE_ID_HEADER = "X-Trace-Id";
	public static final String TRACE_ID_MDC_KEY = "traceId";

	private static final int MAX_INBOUND_LENGTH = 64;

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		String traceId = resolveTraceId(request);
		MDC.put(TRACE_ID_MDC_KEY, traceId);
		response.setHeader(TRACE_ID_HEADER, traceId);
		try {
			filterChain.doFilter(request, response);
		} finally {
			// Servlet threads are pooled and reused; never leak the id into the next request.
			MDC.remove(TRACE_ID_MDC_KEY);
		}
	}

	private static String resolveTraceId(HttpServletRequest request) {
		String inbound = request.getHeader(TRACE_ID_HEADER);
		if (StringUtils.hasText(inbound)) {
			// Defend against log forging: strip anything but safe id chars (this also
			// removes CR/LF) and cap the length before it reaches the log pattern.
			String cleaned = inbound.trim().replaceAll("[^A-Za-z0-9_-]", "");
			if (!cleaned.isEmpty()) {
				return cleaned.length() > MAX_INBOUND_LENGTH
					? cleaned.substring(0, MAX_INBOUND_LENGTH)
					: cleaned;
			}
		}
		return UUID.randomUUID().toString().substring(0, 8);
	}
}
