package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Documento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.springframework.stereotype.Service;

import javax.xml.XMLConstants;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Abre o arquivo anexado (PDF, DOC, DOCX, TXT; storage local ou Supabase) e devolve o texto bruto.
 * Falhas retornam null: documento ilegivel nunca derruba nem penaliza a avaliacao.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentoTextExtractor {

    static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final int MAX_CHARS = 60_000;
    private static final long MAX_DOCX_XML_BYTES = 20L * 1024 * 1024;

    private final SupabaseStorageService supabaseStorageService;

    public String extrair(Documento documento) {
        if (documento == null || documento.getCaminho() == null) return null;
        try {
            byte[] bytes = lerBytes(documento);
            if (bytes == null || bytes.length == 0) return null;
            String nome = documento.getNomeArquivo() == null ? "" : documento.getNomeArquivo().toLowerCase(Locale.ROOT);
            String texto;
            if (nome.endsWith(".pdf")) texto = lerPdf(bytes);
            else if (nome.endsWith(".docx")) texto = lerDocx(bytes);
            else if (nome.endsWith(".doc")) texto = lerDoc(bytes);
            else if (nome.endsWith(".txt")) texto = new String(bytes, StandardCharsets.UTF_8);
            else return null;
            if (texto == null) return null;
            return texto.length() > MAX_CHARS ? texto.substring(0, MAX_CHARS) : texto;
        } catch (Exception ex) {
            log.warn("Falha ao extrair texto do documento {}: {}", documento.getId(), ex.getMessage());
            return null;
        }
    }

    private byte[] lerBytes(Documento documento) throws IOException {
        String caminho = documento.getCaminho();
        Path base = Path.of("uploads", "documentos").toAbsolutePath().normalize();
        try {
            Path local = Path.of(caminho).toAbsolutePath().normalize();
            if (local.startsWith(base) && Files.isRegularFile(local) && Files.size(local) <= MAX_BYTES) {
                return Files.readAllBytes(local);
            }
        } catch (RuntimeException ignored) {
            // nao e caminho local; tenta o storage remoto
        }
        Integer donoId = documento.getUsuario() == null ? null : documento.getUsuario().getId();
        if (!supabaseStorageService.isUserDocumentReferenceForOwner(caminho, donoId)) return null;
        return supabaseStorageService.downloadUserDocument(caminho, MAX_BYTES);
    }

    private static String lerPdf(byte[] bytes) throws IOException {
        try (PDDocument pdf = Loader.loadPDF(bytes)) {
            if (pdf.isEncrypted()) return null;
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setEndPage(30);
            return stripper.getText(pdf);
        }
    }

    private static String lerDoc(byte[] bytes) throws IOException {
        try (WordExtractor extractor = new WordExtractor(new ByteArrayInputStream(bytes))) {
            return extractor.getText();
        }
    }

    /** DOCX = ZIP; le apenas word/document.xml com StAX sem DTD/entidades externas. */
    private static String lerDocx(byte[] bytes) throws Exception {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    return textoDeWordXml(zip);
                }
            }
        }
        return null;
    }

    private static String textoDeWordXml(InputStream in) throws Exception {
        XMLInputFactory factory = XMLInputFactory.newFactory();
        factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
        factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
        factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        XMLStreamReader reader = factory.createXMLStreamReader(new LimitedInputStream(in, MAX_DOCX_XML_BYTES));
        StringBuilder sb = new StringBuilder();
        boolean emTexto = false;
        while (reader.hasNext() && sb.length() <= MAX_CHARS) {
            switch (reader.next()) {
                case XMLStreamConstants.START_ELEMENT -> {
                    String nome = reader.getLocalName();
                    if ("t".equals(nome)) emTexto = true;
                    else if ("tab".equals(nome)) sb.append('\t');
                    else if ("br".equals(nome)) sb.append('\n');
                }
                case XMLStreamConstants.END_ELEMENT -> {
                    String nome = reader.getLocalName();
                    if ("t".equals(nome)) emTexto = false;
                    else if ("p".equals(nome)) sb.append('\n');
                }
                case XMLStreamConstants.CHARACTERS -> {
                    if (emTexto) sb.append(reader.getText());
                }
                default -> { }
            }
        }
        reader.close();
        return sb.toString();
    }

    /** Protege contra zip-bomb: aborta se o XML descomprimido passar do limite. */
    private static final class LimitedInputStream extends InputStream {
        private final InputStream in;
        private long restante;

        LimitedInputStream(InputStream in, long limite) {
            this.in = in;
            this.restante = limite;
        }

        @Override
        public int read() throws IOException {
            if (restante-- <= 0) throw new IOException("documento descomprimido excede o limite");
            return in.read();
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (restante <= 0) throw new IOException("documento descomprimido excede o limite");
            int n = in.read(b, off, (int) Math.min(len, restante));
            if (n > 0) restante -= n;
            return n;
        }
    }
}
