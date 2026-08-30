package com.example.tcc_backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;

@Component
public class ClientIpResolver {

    private final List<String> trustedProxyCidrs;

    public ClientIpResolver(@Value("${app.security.trusted-proxies:}") String trustedProxyCidrs) {
        this.trustedProxyCidrs = Arrays.stream(trustedProxyCidrs.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    public String resolve(HttpServletRequest request) {
        String remoteAddr = normalizeIp(request.getRemoteAddr());
        if (isTrustedProxy(remoteAddr)) {
            String forwardedIp = firstForwardedForIp(request.getHeader("X-Forwarded-For"));
            if (forwardedIp != null) {
                return forwardedIp;
            }

            String realIp = normalizeIp(request.getHeader("X-Real-IP"));
            if (realIp != null) {
                return realIp;
            }

            String cfIp = normalizeIp(request.getHeader("CF-Connecting-IP"));
            if (cfIp != null) {
                return cfIp;
            }
        }

        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private String firstForwardedForIp(String forwardedFor) {
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return null;
        }
        for (String candidate : forwardedFor.split(",")) {
            String ip = normalizeIp(candidate);
            if (ip != null) {
                return ip;
            }
        }
        return null;
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (remoteAddr == null) {
            return false;
        }

        try {
            InetAddress address = InetAddress.getByName(remoteAddr);
            if (address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress()) {
                return true;
            }

            for (String cidr : trustedProxyCidrs) {
                if (matchesCidr(address, cidr)) {
                    return true;
                }
            }
        } catch (UnknownHostException ex) {
            return false;
        }

        return false;
    }

    private boolean matchesCidr(InetAddress address, String cidr) throws UnknownHostException {
        String[] parts = cidr.split("/");
        if (parts.length != 2) {
            return false;
        }

        InetAddress network = InetAddress.getByName(parts[0].trim());
        int prefixLength;
        try {
            prefixLength = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException ex) {
            return false;
        }

        byte[] addressBytes = address.getAddress();
        byte[] networkBytes = network.getAddress();
        if (addressBytes.length != networkBytes.length || prefixLength < 0 || prefixLength > addressBytes.length * 8) {
            return false;
        }

        int fullBytes = prefixLength / 8;
        int remainingBits = prefixLength % 8;
        for (int i = 0; i < fullBytes; i++) {
            if (addressBytes[i] != networkBytes[i]) {
                return false;
            }
        }

        if (remainingBits == 0) {
            return true;
        }

        int mask = 0xFF << (8 - remainingBits);
        return (addressBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
    }

    private String normalizeIp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.startsWith("[") && normalized.contains("]")) {
            normalized = normalized.substring(1, normalized.indexOf(']'));
        } else {
            int portSeparator = normalized.lastIndexOf(':');
            if (portSeparator > 0 && normalized.indexOf(':') == portSeparator) {
                normalized = normalized.substring(0, portSeparator);
            }
        }

        try {
            return InetAddress.getByName(normalized).getHostAddress();
        } catch (UnknownHostException ex) {
            return null;
        }
    }
}