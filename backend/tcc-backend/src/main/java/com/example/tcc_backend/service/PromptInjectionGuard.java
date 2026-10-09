package com.example.tcc_backend.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Camada deterministica anti prompt-injection (complementa o prompt de seguranca de antiInjection.md).
 * Todo texto de aluno/documento passa por aqui antes de entrar no prompt da Lumen: remove caracteres
 * invisiveis, neutraliza tags delimitadoras, limita tamanho e redige linhas que tentam dar ordens ao avaliador.
 */
final class PromptInjectionGuard {

    static final String REDACAO = "[trecho suspeito removido]";

    private static final Pattern INVISIVEIS = Pattern.compile("[\\p{Cc}\\p{Cf}&&[^\\n\\t]]");
    private static final Pattern TAG_DELIMITADORA = Pattern.compile(
            "(?i)</?\\s*(perfil_aluno|biografia|historico|motivacao_inscricao|documentos?|documento_aluno|documento|system|assistant|user|instru[cç][aã]o|prompt)[^>]*>");
    // Aplicados sobre texto minusculo e sem acento.
    private static final List<Pattern> PADROES = List.of(
            Pattern.compile("(ignor(e|ar|em)|desconsider(e|ar)|esqueca|esquecer|descarte)\\b.{0,40}\\b(instruc|regra|prompt|comando|orientac|diretriz|criterio)"),
            Pattern.compile("\\bnovas?\\s+(instruc|regra|ordem|diretriz)"),
            Pattern.compile("voce\\s+(agora\\s+)?(e|sera|deve|devera|vai)\\b.{0,30}(avaliador|assistente|\\bia\\b|modelo|sistema|admin)"),
            Pattern.compile("\\b(aja|atue|finja|comporte-se|responda)\\s+(como|que)\\b"),
            Pattern.compile("(classifique|avalie|considere|marque|atribua|retorne|responda|coloque)(-?\\s*me|\\s+(este|esse|o)\\s+aluno)?\\b.{0,40}\\b(nota|classificacao|conceito)\\s*(a\\b|10|maxima|maximo|mais alta)"),
            Pattern.compile("(aprov(e|ar|ado|acao)|selecion(e|ar))\\b.{0,30}\\b(direto|diretamente|automatic|imediat|sem avali|este aluno|\\bme\\b)"),
            Pattern.compile("(nota|classificacao)\\s*(maxima|a\\b|10)\\b.{0,30}\\b(obrigatori|garantid|sempre|deve)"),
            Pattern.compile("(retorne|responda|devolva|emita)\\b.{0,30}\\b(json|apenas|somente|exatamente)\\b"),
            Pattern.compile("injection_detectada|nota_final|nota_base|elevado_por"),
            Pattern.compile("(revele|mostre|exiba|repita|imprima)\\b.{0,30}\\b(prompt|instruc|system)"),
            Pattern.compile("ignore\\b.{0,40}\\b(previous|prior|above|all|earlier)\\b.{0,20}\\b(instruction|prompt|rule|message)"),
            Pattern.compile("disregard\\b.{0,30}\\b(instruction|prompt|rule|above)"),
            Pattern.compile("you\\s+are\\s+now\\b"),
            Pattern.compile("\\b(act|pretend|behave)\\s+as\\b"),
            Pattern.compile("\\b(system|assistant|developer)\\s*(prompt|message)?\\s*:"),
            Pattern.compile("(rate|grade|classify|score|mark)\\b.{0,25}\\b(me|this (student|candidate))\\b.{0,25}\\b(a\\b|10|highest|maximum|top)"),
            Pattern.compile("(approve|accept|hire)\\b.{0,25}\\b(me|this (student|candidate)|directly|automatically)"),
            Pattern.compile("(reveal|print|show|repeat)\\b.{0,25}\\b(system prompt|instructions)"),
            Pattern.compile("jailbreak|prompt injection|do anything now|\\bdan mode"),
            Pattern.compile("\\[/?inst\\]|<\\|(im_start|im_end|system|endoftext)\\|>|###\\s*(system|instruction)")
    );

    private PromptInjectionGuard() {}

    /** Texto seguro + trechos que dispararam a deteccao. */
    record Resultado(String texto, List<String> deteccoes) {
        boolean detectou() {
            return !deteccoes.isEmpty();
        }
    }

    static Resultado sanitizar(String bruto, int maxChars) {
        List<String> deteccoes = new ArrayList<>();
        if (bruto == null || bruto.isBlank()) return new Resultado("", deteccoes);

        String texto = INVISIVEIS.matcher(bruto).replaceAll("");
        if (TAG_DELIMITADORA.matcher(texto).find()) {
            deteccoes.add("tag delimitadora do prompt no conteudo");
            texto = TAG_DELIMITADORA.matcher(texto).replaceAll(" ");
        }
        // '<' e '>' restantes viram entidade: impossivel fechar/abrir tags do prompt.
        texto = texto.replace("<", "&lt;").replace(">", "&gt;");
        if (texto.length() > maxChars) texto = texto.substring(0, maxChars);

        StringBuilder limpo = new StringBuilder();
        for (String linha : texto.split("\n", -1)) {
            if (linhaSuspeita(linha)) {
                deteccoes.add(resumir(linha));
                limpo.append(REDACAO);
            } else {
                limpo.append(linha);
            }
            limpo.append('\n');
        }
        return new Resultado(limpo.toString().strip(), deteccoes);
    }

    private static boolean linhaSuspeita(String linha) {
        if (linha.isBlank()) return false;
        String n = Normalizer.normalize(linha, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        for (Pattern p : PADROES) {
            if (p.matcher(n).find()) return true;
        }
        return false;
    }

    private static String resumir(String linha) {
        String t = linha.strip().replaceAll("\\s+", " ");
        return t.length() > 80 ? t.substring(0, 80) + "..." : t;
    }
}
