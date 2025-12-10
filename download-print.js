import axios from "axios";
import fs from "fs";
import PDFDocument from "pdfkit";
import pkg from "pdf-to-printer";
// import path from "path"; // Opsional jika butuh path resolution

const { print, getPrinters, getDefaultPrinter } = pkg;

export const downloadFile = async (file) => {
  // Kita definisikan nama file di luar try agar bisa diakses di blok finally (untuk cleanup)
  const timestamp = Date.now();
  const tempImage = `./temp-${timestamp}.jpeg`;
  const tempPDF = `./temp-${timestamp}.pdf`;

  try {
    console.log(`Downloading: ${file}`);
    
    // 1. Download File
    // PENTING: response didefinisikan di sini
    const response = await axios.get(file, { responseType: "arraybuffer" });

    // 2. Simpan Image Sementara
    // Kita lakukan ini DI DALAM blok try agar bisa akses variabel 'response'
    fs.writeFileSync(tempImage, response.data);

    // 3. Convert ke PDF
    await convertImageToPDF(tempImage, tempPDF);

    // 4. Print
    // Beri jeda sedikit untuk memastikan file selesai ditulis
    await new Promise((r) => setTimeout(r, 500)); 
    
    console.log("Sending to printer...");
    await print(tempPDF);
    console.log("Print job sent!");

    return true; // Berhasil

  } catch (error) {
    console.error("Error process (Download/Convert/Print):", error);
    return false; // Gagal
  } finally {
    // 5. Cleanup (Akan SELALU dijalankan, baik sukses maupun error)
    // Menghapus file temporary agar server tidak penuh
    try {
      if (fs.existsSync(tempImage)) fs.unlinkSync(tempImage);
      if (fs.existsSync(tempPDF)) fs.unlinkSync(tempPDF);
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }
  }
};

const convertImageToPDF = async (imagePath, pdfPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(pdfPath);

    stream.on("finish", resolve);
    stream.on("error", reject);

    doc.pipe(stream);
    
    // Tambah halaman sesuai ukuran (misal Letter atau 4R tergantung printer)
    // 612 x 792 adalah ukuran Letter standar points
    doc.addPage({ size: [612, 792] }); 
    
    // Masukkan gambar, fit agar pas di kertas
    doc.image(imagePath, 0, 0, { fit: [612, 792], align: 'center', valign: 'center' });
    
    doc.end();
  });
};