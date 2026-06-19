import { unique } from "../helpers/test-data.helper";

export function buildDocumentFixture() {
  return {
    fileName: `doc-${unique("e2e")}.pdf`,
    content: "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
  };
}
