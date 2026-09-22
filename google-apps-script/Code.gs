/**
 * Google Apps Script - SSES T2 Penyimpanan Foto Google Drive
 * 
 * Petunjuk Pemasangan:
 * 1. Buka https://script.google.com di akun Google Drive Anda.
 * 2. Buat proyek baru ("Proyek Baru" / "New Project"). Beri nama "SSES T2 Drive Uploader".
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh isi file ini.
 * 4. Klik menu "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
 * 5. Pilih jenis (roda gigi): "Aplikasi Web" (Web App).
 * 6. Pengaturan:
 *    - Deskripsi: SSES T2 Image Storage
 *    - Jalankan sebagai (Execute as): "Saya" (Me / akun Google Anda)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> SANGAT PENTING!
 * 7. Klik "Terapkan" (Deploy), lalu setujui izin akses (Authorize access).
 * 8. Salin "URL Aplikasi Web" (akhiran /exec) dan simpan di menu Pengaturan Google Drive di aplikasi SSES T2.
 */

// Nama folder penyimpanan di Google Drive
var FOLDER_NAME = "SSES_T2_Dokumentasi";

/**
 * Handle GET: Untuk pengujian koneksi langsung lewat browser atau aplikasi
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Apps Script SSES T2 aktif dan siap menerima unggahan foto.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST: Menerima payload foto (base64) dan menyimpannya ke Google Drive
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ status: "error", message: "Data post kosong" });
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64;
    var mimeType = data.mimeType || "image/jpeg";
    var fileName = data.fileName || ("DOK_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg");

    // Jika base64 masih menyertakan header 'data:image/...;base64,', bersihkan
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }

    // Cari atau buat folder penyimpanan
    var folder;
    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (errSharingFolder) {
        // Abaikan jika akun melarang pengubahan izin via API
      }
    }

    // Decode dan buat file
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = folder.createFile(blob);
    
    // Berikan izin view publik agar bisa ditampilkan di aplikasi / Shift Report
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (errSharingFile) {
      // Abaikan jika akun melarang pengubahan izin via API
    }

    var fileId = file.getId();
    // Direct link URL yang kompatibel dengan tag <img> dan PDF
    var directViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    var driveWebUrl = file.getUrl();

    return responseJson({
      status: "success",
      url: directViewUrl,
      viewUrl: directViewUrl,
      driveUrl: driveWebUrl,
      fileId: fileId,
      fileName: fileName
    });

  } catch (error) {
    return responseJson({
      status: "error",
      message: error.toString()
    });
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan fungsi ini 1x di editor Apps Script untuk memicu izin akses Google Drive:
 * 1. Pilih 'testIzinDrive' di dropdown fungsi sebelah tombol Jalankan (Run).
 * 2. Klik 'Jalankan' (Run).
 * 3. Beri izin Google (Review Permissions -> Akun Anda -> Advanced -> Go to Untitled project -> Allow).
 */
function testIzinDrive() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  Logger.log("Izin DriveApp berhasil aktif! Anda sekarang bisa menerima foto.");
}

