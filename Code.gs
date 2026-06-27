/**
 * GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * Untuk Aplikasi Laporan Operasional SSES T2 Bandara Soekarno-Hatta
 * 
 * PANDUAN DEPLOY:
 * 1. Buka https://script.google.com atau klik Extensions > Apps Script pada Google Sheets Anda.
 * 2. Hapus semua kode default, lalu tempel (paste) seluruh kode ini.
 * 3. Klik tombol "Deploy" > "New deployment" (Atau Manage deployments > Edit > New version).
 * 4. Pilih tipe "Web app".
 * 5. Deskripsi: "SSES Backend API v2 CRUD".
 * 6. Execute as: "Me" (akun Google Anda).
 * 7. Who has access: "Anyone" (PENTING agar aplikasi web bisa mengakses tanpa login akun Google di browser).
 * 8. Klik "Deploy".
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'save_report') {
      return handleSaveReport(data);
    } else if (action === 'update_report') {
      return handleUpdateReport(data);
    } else if (action === 'delete_report') {
      return handleDeleteReport(data);
    } else if (action === 'save_pdf') {
      return handleSavePdf(data);
    }

    return responseJson({ status: 'error', message: 'Action tidak dikenal' });
  } catch (err) {
    return responseJson({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var date = e.parameter.date;

    if (action === 'get_daily') {
      return handleGetDaily(date);
    }

    return responseJson({ status: 'success', message: 'SSES Web App API Ready' });
  } catch (err) {
    return responseJson({ status: 'error', message: err.toString() });
  }
}

function handleSaveReport(data) {
  var jenis = data.jenis || 'Kegiatan';
  var tanggal = data.tanggal || '';
  var waktu = data.waktu || '';
  var shift = data.shift || '';
  var teknisi = data.teknisi || '';
  var lokasi = data.lokasi || '';
  var peralatan = data.peralatan || '';
  var uraian = data.uraian || '';
  var tindakLanjut = data.tindakLanjut || '-';
  var status = data.status || 'Normal';
  var imageBase64 = data.imageBase64 || '';

  var fileId = '';
  if (imageBase64 !== '') {
    fileId = saveImageToDrive(imageBase64, 'Dok_' + jenis + '_' + Date.now() + '.jpg');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Laporan_Harian');

  // Jika sheet kosong, buat header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Tanggal', 'Waktu', 'Shift', 'Jenis', 'Teknisi', 
      'Lokasi', 'Peralatan', 'Uraian', 'TindakLanjut', 
      'Status', 'Drive_Image_ID', 'Foto_Preview'
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#e2e8f0');
  }

  var formulaImage = fileId !== '' ? '=IMAGE("https://drive.google.com/uc?export=view&id=' + fileId + '")' : '-';

  sheet.appendRow([
    tanggal, waktu, shift, jenis, teknisi, 
    lokasi, peralatan, uraian, tindakLanjut, 
    status, fileId, formulaImage
  ]);

  return responseJson({ status: 'success', fileId: fileId });
}

function handleUpdateReport(data) {
  var rowIndex = parseInt(data.rowIndex, 10);
  if (!rowIndex || rowIndex <= 1) {
    return responseJson({ status: 'error', message: 'Baris tidak valid' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Laporan_Harian');
  if (!sheet) return responseJson({ status: 'error', message: 'Sheet tidak ditemukan' });

  var maxRows = sheet.getLastRow();
  if (rowIndex > maxRows) return responseJson({ status: 'error', message: 'Baris melebihi batas' });

  var jenis = data.jenis || 'Kegiatan';
  var tanggal = data.tanggal || '';
  var waktu = data.waktu || '';
  var shift = data.shift || '';
  var teknisi = data.teknisi || '';
  var lokasi = data.lokasi || '';
  var peralatan = data.peralatan || '';
  var uraian = data.uraian || '';
  var tindakLanjut = data.tindakLanjut || '-';
  var status = data.status || 'Normal';
  var imageBase64 = data.imageBase64 || '';

  var oldImageId = sheet.getRange(rowIndex, 11).getValue();
  var fileId = oldImageId || '';

  if (imageBase64 !== '') {
    fileId = saveImageToDrive(imageBase64, 'Dok_' + jenis + '_' + Date.now() + '.jpg');
  }

  var formulaImage = fileId !== '' ? '=IMAGE("https://drive.google.com/uc?export=view&id=' + fileId + '")' : '-';

  var rowValues = [
    tanggal, waktu, shift, jenis, teknisi, 
    lokasi, peralatan, uraian, tindakLanjut, 
    status, fileId, formulaImage
  ];

  sheet.getRange(rowIndex, 1, 1, 12).setValues([rowValues]);

  return responseJson({ status: 'success', fileId: fileId });
}

function handleDeleteReport(data) {
  var rowIndex = parseInt(data.rowIndex, 10);
  if (!rowIndex || rowIndex <= 1) {
    return responseJson({ status: 'error', message: 'Baris tidak valid' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Laporan_Harian');
  if (!sheet) return responseJson({ status: 'error', message: 'Sheet tidak ditemukan' });

  var maxRows = sheet.getLastRow();
  if (rowIndex > maxRows) return responseJson({ status: 'error', message: 'Baris melebihi batas' });

  sheet.deleteRow(rowIndex);

  return responseJson({ status: 'success' });
}

function handleSavePdf(data) {
  var filename = data.filename || ('Laporan_' + Date.now() + '.pdf');
  var pdfBase64 = data.pdfBase64 || '';

  if (pdfBase64 === '') {
    return responseJson({ status: 'error', message: 'PDF Base64 kosong' });
  }

  var folder = getOrCreateFolder('SSES_Shift_Reports');
  var decoded = Utilities.base64Decode(pdfBase64);
  var blob = Utilities.newBlob(decoded, 'application/pdf', filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return responseJson({ status: 'success', fileId: file.getId(), url: file.getUrl() });
}

function handleGetDaily(targetDateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Laporan_Harian');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return responseJson({ status: 'success', data: [] });
  }

  var values = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowDate = formatRowDate(row[0]);

    if (!targetDateStr || rowDate === targetDateStr) {
      results.push({
        rowIndex: i + 1, // Nomor baris di Spreadsheet (Penting untuk Edit & Hapus)
        Tanggal: rowDate,
        Waktu: row[1],
        Shift: row[2],
        Jenis: row[3],
        Teknisi: row[4],
        Lokasi: row[5],
        Peralatan: row[6],
        Uraian: row[7],
        TindakLanjut: row[8],
        Status: row[9],
        Drive_Image_ID: row[10]
      });
    }
  }

  return responseJson({ status: 'success', data: results });
}

function saveImageToDrive(base64Str, filename) {
  var folder = getOrCreateFolder('SSES_Report_Images');
  var decoded = Utilities.base64Decode(base64Str);
  var blob = Utilities.newBlob(decoded, 'image/jpeg', filename);
  var file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getId();
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function formatRowDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val).split('T')[0];
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
