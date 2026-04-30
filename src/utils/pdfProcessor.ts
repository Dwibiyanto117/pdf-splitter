import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  totalPages: number;
  fromPage: number;
  toPage: number;
  error?: string;
  pdfBytes: ArrayBuffer;
}

export const loadPdfData = async (file: File): Promise<{ totalPages: number, pdfBytes: ArrayBuffer }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    totalPages: pdfDoc.getPageCount(),
    pdfBytes: arrayBuffer
  };
};

export const processPdfs = async (items: PdfFileItem[], merge: boolean, onProgress?: (progress: number) => void) => {
  if (items.length === 0) return;

  const zip = new JSZip();
  let mergedPdfDoc: PDFDocument | null = null;
  
  if (merge) {
    mergedPdfDoc = await PDFDocument.create();
  }

  let completed = 0;

  for (const item of items) {
    try {
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(item.pdfBytes);
      
      // Create a new PDF Document
      const newPdfDoc = await PDFDocument.create();
      
      // Calculate indices (1-indexed to 0-indexed)
      // If fromPage is 2, index is 1.
      const fromIndex = Math.max(0, item.fromPage - 1);
      const toIndex = Math.min(item.totalPages - 1, item.toPage - 1);
      
      const pageIndicesToCopy: number[] = [];
      for (let i = fromIndex; i <= toIndex; i++) {
        pageIndicesToCopy.push(i);
      }

      if (pageIndicesToCopy.length > 0) {
        // Copy the specified pages
        const copiedPages = await (mergedPdfDoc || newPdfDoc).copyPages(pdfDoc, pageIndicesToCopy);
        
        if (merge && mergedPdfDoc) {
          // Add copied pages to the merged document
          copiedPages.forEach((page) => {
            mergedPdfDoc!.addPage(page);
          });
        } else {
          // Add copied pages to the new individual document
          copiedPages.forEach((page) => {
            newPdfDoc.addPage(page);
          });

          // Serialize the new PDF Document to bytes
          const pdfBytes = await newPdfDoc.save();

          // Determine new file name
          const originalNameBase = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          const newFileName = `${originalNameBase}-Splited(Page ${item.fromPage} - Page ${item.toPage}).pdf`;

          // Add to ZIP
          zip.file(newFileName, pdfBytes);
        }
      }
    } catch (e) {
      console.error(`Failed to process ${item.name}:`, e);
    }

    completed++;
    if (onProgress) {
      onProgress((completed / items.length) * 100);
    }
  }

  if (merge && mergedPdfDoc) {
    // Generate and download merged PDF
    const pdfBytes = await mergedPdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const originalNameBase = items[0].name.substring(0, items[0].name.lastIndexOf('.')) || items[0].name;
    saveAs(blob, `${originalNameBase}-Merged.pdf`);
  } else {
    // Generate and download ZIP
    if (Object.keys(zip.files).length > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'Splited-PDFs.zip');
    } else {
      throw new Error('No files were successfully processed.');
    }
  }
};
