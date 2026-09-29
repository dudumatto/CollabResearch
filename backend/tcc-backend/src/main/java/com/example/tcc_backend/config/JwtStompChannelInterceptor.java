package com.example.tcc_backend.config;

import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.TokenRevocationService;
import com.example.tcc_backend.service.ConversaService;
import com.example.tcc_backend.service.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class JwtStompChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final TokenRevocationService tokenRevocationService;
    private final ConversaService conversaService;
    private final Map<String, UsernamePasswordAuthenticationToken> authenticationsBySession = new ConcurrentHashMap<>();
    private final Map<String, String> tokensBySession = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                || StompCommand.SEND.equals(accessor.getCommand())) {
            restoreAuthentication(accessor);
            validateDestination(accessor);
        }

        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            String sessionId = accessor.getSessionId();
            if (sessionId != null) {
                authenticationsBySession.remove(sessionId);
                tokensBySession.remove(sessionId);
            }
        }

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String token = bearerToken(accessor);
        if (token == null) {
            throw new IllegalArgumentException("Token ausente");
        }

        try {
            String email = jwtService.extractEmail(token);
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario == null
                    || !Boolean.TRUE.equals(usuario.getAtivo())
                    || tokenRevocationService.isRevoked(token)
                    || !jwtService.isTokenValid(token, usuario)) {
                throw new IllegalArgumentException("Token invalido");
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
            accessor.setUser(authentication);
            String sessionId = accessor.getSessionId();
            if (sessionId != null) {
                authenticationsBySession.put(sessionId, authentication);
                tokensBySession.put(sessionId, token);
            }
        } catch (JwtException | IllegalArgumentException ex) {
            throw new IllegalArgumentException("Token invalido", ex);
        }
    }

    private void restoreAuthentication(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        String token = sessionId == null ? null : tokensBySession.get(sessionId);
        if (token == null || tokenRevocationService.isRevoked(token)) {
            throw new IllegalArgumentException("Sessao WebSocket invalida");
        }

        try {
            String email = jwtService.extractEmail(token);
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario == null
                    || !Boolean.TRUE.equals(usuario.getAtivo())
                    || !jwtService.isTokenValid(token, usuario)) {
                throw new IllegalArgumentException("Sessao WebSocket invalida");
            }
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
            authenticationsBySession.put(sessionId, authentication);
            accessor.setUser(authentication);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new IllegalArgumentException("Sessao WebSocket invalida", ex);
        }
    }

    private void validateDestination(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new IllegalArgumentException("Destino STOMP ausente");
        }

        // Cliente nunca pode publicar diretamente no broker; mensagens usam os endpoints REST.
        if (StompCommand.SEND.equals(accessor.getCommand())
                && (destination.startsWith("/topic/") || destination.startsWith("/queue/"))) {
            throw new IllegalArgumentException("Publicacao direta no broker nao permitida");
        }

        String prefix = "/topic/conversa/";
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) && destination.startsWith(prefix)) {
            String id = destination.substring(prefix.length());
            if (!id.matches("\\d+")) {
                throw new IllegalArgumentException("Destino de conversa invalido");
            }
            if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken authentication)
                    || !(authentication.getPrincipal() instanceof Usuario usuario)) {
                throw new IllegalArgumentException("Sessao WebSocket invalida");
            }
            conversaService.validarParticipacao(Integer.valueOf(id), usuario.getId());
        }
    }

    private String bearerToken(StompHeaderAccessor accessor) {
        List<String> values = accessor.getNativeHeader("Authorization");
        if (values == null || values.isEmpty()) {
            values = accessor.getNativeHeader("authorization");
        }
        if (values == null || values.isEmpty()) return null;

        String header = values.get(0);
        if (header == null || !header.startsWith("Bearer ")) return null;
        return header.substring(7);
    }
}
