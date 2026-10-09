package com.example.tcc_backend.dto.request;

import java.util.List;

/** Inscricoes a (re)avaliar; quando ausente/vazio, a Lumen avalia apenas as ainda sem nota. */
public record LumenRankingRequest(List<Integer> inscricaoIds) {}
