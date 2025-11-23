import axios from "axios";
import fs from "fs";
import PDFDocument from "pdfkit";
import pkg from 'pdf-to-printer';
const { print, getPrinters, getDefaultPrinter } = pkg

export const downloadFile = async (file) => {
  const response = await axios.get(file, { responseType: "arraybuffer" });

  const tempImage = `./temp-${Date.now()}.jpeg`;

  fs.writeFileSync(tempImage, response.data);

  const tempPDF = `./tempik-${Date.now()}.pdf`;

  await convertImageToPDF(tempImage, tempPDF);
  await print(tempPDF);

  fs.unlinkSync(tempImage); 
  fs.unlinkSync(tempPDF); 
    
  
  if (response.data) {
    // console.log(`Uploading file: ${UniqueFileName}`);
    return true;
  } else {
    return false;
  }
}


const convertImageToPDF = async (imagePath, pdfPath) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        doc.image(imagePath, 0, 0, { fit: [612, 612] });
        doc.end();
        stream.on("finish", resolve);
    });
};