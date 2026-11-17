/**
 * Genera un PDF mínimo válido (una página con texto) para probar la radicación sin tener un certificado a mano.
 * Solo se usa en modo simulado. El documento dice explícitamente que es ficticio.
 */
export function pdfDePrueba(lineas: string[], nombre = "certificado_prueba.pdf"): File {
  const esc = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\\()]/g, (c) => "\\" + c);
  const contenido = ["BT", "/F1 18 Tf", "60 780 Td", `(${esc(lineas[0] ?? "Certificado de prueba")}) Tj`, "/F1 11 Tf",
    ...lineas.slice(1).flatMap((l) => ["0 -22 Td", `(${esc(l)}) Tj`]), "ET"].join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objetos.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n` + offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new File([pdf], nombre, { type: "application/pdf" });
}
