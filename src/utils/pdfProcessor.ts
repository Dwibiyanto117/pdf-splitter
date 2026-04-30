import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { CompressFileItem } from '../components/Compress';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
      const pdfDoc = await PDFDocument.load(item.pdfBytes);
      const newPdfDoc = await PDFDocument.create();
      
      const fromIndex = Math.max(0, item.fromPage - 1);
      const toIndex = Math.min(item.totalPages - 1, item.toPage - 1);
      
      const pageIndicesToCopy: number[] = [];
      for (let i = fromIndex; i <= toIndex; i++) {
        pageIndicesToCopy.push(i);
      }

      if (pageIndicesToCopy.length > 0) {
        const copiedPages = await (mergedPdfDoc || newPdfDoc).copyPages(pdfDoc, pageIndicesToCopy);
        
        if (merge && mergedPdfDoc) {
          copiedPages.forEach((page) => {
            mergedPdfDoc!.addPage(page);
          });
        } else {
          copiedPages.forEach((page) => {
            newPdfDoc.addPage(page);
          });

          const pdfBytes = await newPdfDoc.save();
          const originalNameBase = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          const newFileName = `${originalNameBase}-Splited(Page ${item.fromPage} - Page ${item.toPage}).pdf`;

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
    const pdfBytes = await mergedPdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const originalNameBase = items[0].name.substring(0, items[0].name.lastIndexOf('.')) || items[0].name;
    saveAs(blob, `${originalNameBase}-Merged.pdf`);
  } else {
    if (Object.keys(zip.files).length > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'Splited-PDFs.zip');
    } else {
      throw new Error('No files were successfully processed.');
    }
  }
};

/**
 * OPTION A STUB: API-based compression
 * If you ever get an API key (e.g., PDF.co), you can swap this function to make an API call
 * and stream the compressed PDF back. This avoids all local performance overhead.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const compressPdfViaApi = async (_file: File, _apiKey: string): Promise<ArrayBuffer> => {
  // 1. Upload file to API endpoint
  // 2. Poll for completion
  // 3. Download compressed file and return ArrayBuffer
  throw new Error("API not implemented");
};

/**
 * OPTION B: Local Image Flattening Compression
 * Uses pdf.js to render each page to a canvas, then compresses the canvas to a JPEG,
 * and creates a new PDF with those compressed images.
 */
export const compressPdfs = async (items: CompressFileItem[], onProgress?: (progress: number) => void): Promise<CompressFileItem[]> => {
  if (items.length === 0) return items;
  
  const zip = new JSZip();
  let completed = 0;
  const processedItems: CompressFileItem[] = [...items];

  for (let fileIndex = 0; fileIndex < items.length; fileIndex++) {
    const item = items[fileIndex];
    try {
      const fileArrayBuffer = await item.file.arrayBuffer();
      
      // Load PDF via pdf.js
      const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
      
      // Create new PDF Document
      const newPdfDoc = await PDFDocument.create();
      
      const totalPages = pdf.numPages;

      // Render each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // Scale affects resolution vs size
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context!,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Compress as JPEG (0.6 quality for good balance of size/clarity)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        // Embed image back into new PDF
        const jpgImage = await newPdfDoc.embedJpg(dataUrl);
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      const compressedBytes = await newPdfDoc.save();
      
      processedItems[fileIndex] = {
        ...processedItems[fileIndex],
        compressedSizeBytes: compressedBytes.byteLength
      };

      const originalNameBase = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const newFileName = `${originalNameBase}-Compressed.pdf`;
      zip.file(newFileName, compressedBytes);

    } catch (e) {
      console.error(`Failed to compress ${item.name}:`, e);
    }

    completed++;
    if (onProgress) {
      onProgress((completed / items.length) * 100);
    }
  }

  if (Object.keys(zip.files).length > 0) {
    if (items.length === 1) {
      // Single file download
      const fileName = Object.keys(zip.files)[0];
      const blob = await zip.files[fileName].async('blob');
      saveAs(blob, fileName);
    } else {
      // Multi-file ZIP download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'Compressed-PDFs.zip');
    }
  } else {
    throw new Error('No files were successfully compressed.');
  }

  return processedItems;
};
