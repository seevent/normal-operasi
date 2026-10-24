// src/lib/utils/serviceabilityChart.ts
// Letak tabel dan grafik batang "Serviceability Peralatan" pada sheet Laporan, meniru berkas acuan
// "SSES T2-LAPORAN HARIAN": tabel 7 kolom tanpa judul tepat di bawah tabel kegiatan (dua baris kosong),
// grafik batang di bawah tabel mulai kolom C. ExcelJS tidak bisa membuat grafik, sehingga grafiknya
// disisipkan langsung ke paket .xlsx (zip) setelah workbook ditulis. JSZip diberikan dari luar.

export const SHEET_NAME = 'Laporan';

/** Tabel berada di kolom F (No) sampai L (Total) pada berkas acuan. */
const TABLE_START_COL = 6;
/**
 * Dari baris data terakhir: baris hitam penutup, satu baris kosong, lalu tabel (berkas acuan: data berakhir
 * di baris 19, pita hitam baris 20, tabel mulai baris 22).
 */
const ROWS_BEFORE_TABLE = 3;
/** Jangkar grafik pada berkas acuan: kolom C (+734786 EMU), satu baris di bawah tabel (+114301 EMU). */
const CHART_ANCHOR = { col: 2, colOff: 734786, rowOff: 114301, cx: 13030200, cy: 4169682 } as const;
/** Baris di bawah tabel yang ditempati grafik (tinggi 4169682 EMU = 438 px, baris 20 px), untuk area cetak. */
export const CHART_ROWS_BELOW_TABLE = 24;

export interface ServiceabilityPlacement {
  /** Nomor kolom (1 = A) tempat kolom "No" tabel berada; tabel selebar 7 kolom. */
  startCol: number;
  /** Nomor baris (1 = baris pertama) tabel; baris terakhir = firstRow + itemCount - 1. */
  firstRow: number;
  lastRow: number;
}

export const getServiceabilityPlacement = (lastDataRow: number, itemCount: number): ServiceabilityPlacement => {
  const firstRow = lastDataRow + ROWS_BEFORE_TABLE;
  return { startCol: TABLE_START_COL, firstRow, lastRow: firstRow + Math.max(itemCount, 1) - 1 };
};

export const columnLetter = (col: number): string => {
  let s = '';
  for (let n = col; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

export interface ServiceabilityChartSpec {
  placement: ServiceabilityPlacement;
  categories: string[];
  /** Pecahan 0..1 per peralatan. */
  ops: number[];
  off: number[];
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const strCache = (values: string[]) =>
  `<c:strCache><c:ptCount val="${values.length}"/>${values
    .map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`)
    .join('')}</c:strCache>`;

const numCache = (values: number[]) =>
  `<c:numCache><c:formatCode>0%</c:formatCode><c:ptCount val="${values.length}"/>${values
    .map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)
    .join('')}</c:numCache>`;

const dLbls =
  '<c:dLbls><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>' +
  '<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/>' +
  '<c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>';

const emptyAxisTitle =
  '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr/></a:pPr><a:endParaRPr lang="en-ID"/></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>';

/** Grafik batang berkelompok OPS (biru muda) dan OFF (merah), sumbu 0-100%, label nilai, tanpa legenda. */
export const buildServiceabilityChartXml = (spec: ServiceabilityChartSpec): string => {
  const { placement, categories, ops, off } = spec;
  const range = (col: number) =>
    `'${SHEET_NAME}'!$${columnLetter(col)}$${placement.firstRow}:$${columnLetter(col)}$${placement.lastRow}`;
  const catCol = placement.startCol + 1;
  const series = (idx: number, name: string, color: string, valCol: number, values: number[]) =>
    `<c:ser><c:idx val="${idx}"/><c:order val="${idx}"/><c:tx><c:v>${name}</c:v></c:tx>` +
    `<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln cmpd="sng"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></c:spPr>` +
    `<c:invertIfNegative val="1"/>${dLbls}` +
    `<c:cat><c:strRef><c:f>${range(catCol)}</c:f>${strCache(categories)}</c:strRef></c:cat>` +
    `<c:val><c:numRef><c:f>${range(valCol)}</c:f>${numCache(values)}</c:numRef></c:val></c:ser>`;

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<c:date1904 val="0"/><c:lang val="en-US"/><c:roundedCorners val="1"/>' +
    '<c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr/></a:pPr><a:r><a:rPr lang="en-ID"/><a:t>TABEL PERFORMA PERALATAN</a:t></a:r></a:p></c:rich></c:tx>' +
    '<c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.45662768031189083"/><c:y val="1.7582417582417582E-2"/></c:manualLayout></c:layout><c:overlay val="0"/></c:title>' +
    '<c:autoTitleDeleted val="0"/><c:plotArea>' +
    '<c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="6.4574833847523452E-2"/><c:y val="0.18521388441612574"/><c:w val="0.90189321729520655"/><c:h val="0.67491189975638433"/></c:manualLayout></c:layout>' +
    '<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="1"/>' +
    series(0, 'OPS', '9DC3E6', placement.startCol + 2, ops) +
    series(1, 'OFF', 'FF0000', placement.startCol + 4, off) +
    '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>' +
    '<c:gapWidth val="150"/><c:axId val="207428584"/><c:axId val="207423488"/></c:barChart>' +
    `<c:catAx><c:axId val="207428584"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>${emptyAxisTitle}` +
    '<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="207423488"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="1"/></c:catAx>' +
    `<c:valAx><c:axId val="207423488"/><c:scaling><c:orientation val="minMax"/><c:max val="1"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="B7B7B7"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>${emptyAxisTitle}` +
    '<c:numFmt formatCode="0%" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln/></c:spPr><c:crossAx val="207428584"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>' +
    '</c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="zero"/><c:showDLblsOverMax val="1"/></c:chart>' +
    '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100"/></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>' +
    '<c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/><c:pageSetup orientation="portrait"/></c:printSettings>' +
    '</c:chartSpace>'
  );
};

const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const REL_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_CHART = 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml';
const CT_DRAWING = 'application/vnd.openxmlformats-officedocument.drawing+xml';
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const chartAnchorXml = (placement: ServiceabilityPlacement, chartRelId: string, shapeId: number): string =>
  '<xdr:oneCellAnchor>' +
  `<xdr:from><xdr:col>${CHART_ANCHOR.col}</xdr:col><xdr:colOff>${CHART_ANCHOR.colOff}</xdr:colOff><xdr:row>${placement.lastRow}</xdr:row><xdr:rowOff>${CHART_ANCHOR.rowOff}</xdr:rowOff></xdr:from>` +
  `<xdr:ext cx="${CHART_ANCHOR.cx}" cy="${CHART_ANCHOR.cy}"/>` +
  `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${shapeId}" name="Grafik Serviceability"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>` +
  '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>' +
  `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="${NS_REL}" r:id="${chartRelId}"/></a:graphicData></a:graphic>` +
  '</xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor>';

const nextRelId = (relsXml: string): string => {
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map(m => Number(m[1]));
  return `rId${Math.max(0, ...ids) + 1}`;
};

const relationshipXml = (id: string, type: string, target: string) =>
  `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;

const addRelationship = (relsXml: string | null, id: string, type: string, target: string): string => {
  const rel = relationshipXml(id, type, target);
  if (!relsXml) return `${XML_DECL}<Relationships xmlns="${REL_PKG}">${rel}</Relationships>`;
  return relsXml.replace('</Relationships>', `${rel}</Relationships>`);
};

/** Elemen lembar yang menurut skema harus berada SETELAH <drawing>. */
const AFTER_DRAWING = ['legacyDrawing', 'legacyDrawingHF', 'picture', 'oleObjects', 'controls', 'webPublishItems', 'tableParts', 'extLst'];

const insertDrawingRef = (sheetXml: string, relId: string): string => {
  const tag = `<drawing r:id="${relId}"/>`;
  const positions = AFTER_DRAWING.map(n => sheetXml.search(new RegExp(`<${n}[\\s>/]`))).filter(i => i >= 0);
  const at = positions.length ? Math.min(...positions) : sheetXml.lastIndexOf('</worksheet>');
  return sheetXml.slice(0, at) + tag + sheetXml.slice(at);
};

/** Minimal API JSZip yang dipakai, agar modul ini tidak bergantung pada tipe paket. */
interface ZipLike {
  file(name: string): { async(type: 'string'): Promise<string> } | null;
  file(name: string, data: string): unknown;
  generateAsync(opts: { type: 'uint8array'; compression: 'DEFLATE' }): Promise<Uint8Array>;
}
interface JSZipLike {
  loadAsync(data: ArrayBuffer | Uint8Array): Promise<ZipLike>;
}

const readText = async (zip: ZipLike, path: string): Promise<string | null> => {
  const f = zip.file(path);
  return f ? f.async('string') : null;
};

/** Path bagian lembar "Laporan" menurut workbook.xml dan relasinya. */
const findSheetPath = async (zip: ZipLike): Promise<string> => {
  const wbXml = (await readText(zip, 'xl/workbook.xml')) ?? '';
  const relsXml = (await readText(zip, 'xl/_rels/workbook.xml.rels')) ?? '';
  const sheetTag = [...wbXml.matchAll(/<sheet\b[^>]*>/g)]
    .map(m => m[0])
    .find(t => new RegExp(`\\bname="${SHEET_NAME}"`).test(t));
  const rid = sheetTag?.match(/\br:id="([^"]+)"/)?.[1];
  const relTag = [...relsXml.matchAll(/<Relationship\b[^>]*>/g)]
    .map(m => m[0])
    .find(t => rid && t.includes(`Id="${rid}"`));
  const target = relTag?.match(/\bTarget="([^"]+)"/)?.[1];
  if (!target) throw new Error(`Sheet ${SHEET_NAME} tidak ditemukan pada workbook`);
  return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
};

const dirOf = (p: string) => p.slice(0, p.lastIndexOf('/'));
const baseOf = (p: string) => p.slice(p.lastIndexOf('/') + 1);

/**
 * Sisipkan grafik Serviceability ke paket xlsx hasil ExcelJS. Bila lembar sudah punya drawing (karena ada
 * foto), grafik ditambahkan ke drawing itu; bila belum, drawing baru dibuat.
 */
export const embedServiceabilityChart = async (
  JSZip: JSZipLike,
  xlsx: ArrayBuffer | Uint8Array,
  spec: ServiceabilityChartSpec
): Promise<Uint8Array> => {
  const zip = await JSZip.loadAsync(xlsx);
  const sheetPath = await findSheetPath(zip);
  const sheetRelsPath = `${dirOf(sheetPath)}/_rels/${baseOf(sheetPath)}.rels`;
  const sheetXml = (await readText(zip, sheetPath)) ?? '';
  const sheetRels = await readText(zip, sheetRelsPath);

  zip.file('xl/charts/chart1.xml', buildServiceabilityChartXml(spec));

  const drawingRel = sheetRels
    ? [...sheetRels.matchAll(/<Relationship\b[^>]*>/g)].map(m => m[0]).find(t => /\/drawing"/.test(t))
    : undefined;
  const existingTarget = drawingRel?.match(/\bTarget="([^"]+)"/)?.[1];

  let contentTypes = (await readText(zip, '[Content_Types].xml')) ?? '';
  const overrides = [`<Override PartName="/xl/charts/chart1.xml" ContentType="${CT_CHART}"/>`];

  let drawingPath: string;
  let drawingXml: string;
  if (existingTarget) {
    drawingPath = existingTarget.startsWith('/') ? existingTarget.slice(1) : `${dirOf(sheetPath)}/${existingTarget}`.replace(/[^/]+\/\.\.\//, '');
    drawingXml = (await readText(zip, drawingPath)) ?? '';
  } else {
    drawingPath = 'xl/drawings/drawing1.xml';
    drawingXml =
      `${XML_DECL}<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"></xdr:wsDr>`;
    const relId = nextRelId(sheetRels ?? '');
    zip.file(sheetRelsPath, addRelationship(sheetRels, relId, `${NS_REL}/drawing`, `../drawings/${baseOf(drawingPath)}`));
    zip.file(sheetPath, insertDrawingRef(sheetXml, relId));
    overrides.push(`<Override PartName="/${drawingPath}" ContentType="${CT_DRAWING}"/>`);
  }

  const drawingRelsPath = `${dirOf(drawingPath)}/_rels/${baseOf(drawingPath)}.rels`;
  const drawingRels = await readText(zip, drawingRelsPath);
  const chartRelId = nextRelId(drawingRels ?? '');
  zip.file(drawingRelsPath, addRelationship(drawingRels, chartRelId, `${NS_REL}/chart`, '../charts/chart1.xml'));
  const shapeId = 1000 + [...drawingXml.matchAll(/<xdr:cNvPr\b/g)].length;
  zip.file(drawingPath, drawingXml.replace('</xdr:wsDr>', `${chartAnchorXml(spec.placement, chartRelId, shapeId)}</xdr:wsDr>`));

  contentTypes = contentTypes.replace('</Types>', `${overrides.join('')}</Types>`);
  zip.file('[Content_Types].xml', contentTypes);

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
};
