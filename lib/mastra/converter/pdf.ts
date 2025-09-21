import { MDocument } from "@mastra/rag";
import pdf from "pdf-parse-debugging-disabled";
import { readFile } from "fs/promises";
import { join } from "path";
import { libsqlVector } from "../memory";
import { embedMany } from "ai";
import { embedding } from "../ai";
import { setTimeout } from "timers/promises";

// PDF Info ve Metadata için interface tanımlamaları
interface PdfInfo {
  PDFFormatVersion?: string;
  IsAcroFormPresent?: boolean;
  IsXFAPresent?: boolean;
  [key: string]: unknown;
}

interface PdfMetadata {
  [key: string]: unknown;
}

/**
 * PDF dosyasından tüm metni çıkarır
 * @param buffer PDF dosyasının buffer'ı
 * @returns PDF'deki tüm metin (chunksız)
 */
export async function extractPdfText(buffer: Buffer): Promise<MDocument> {
  try {
    const data = await pdf(buffer);

    // PDF'deki tüm metni döndür (chunksız)
    const document = MDocument.fromText(data.text);
    return document;
  } catch (error) {
    throw new Error(
      `PDF metin çıkarma hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }
}

/**
 * PDF dosyasından dosya yolu ile metin çıkarır
 * @param filePath PDF dosyasının yolu
 * @returns PDF'deki tüm metin (chunksız)
 */
export async function extractPdfTextFromFile(
  filePath: string,
): Promise<MDocument> {
  try {
    const buffer = await readFile(filePath);
    return extractPdfText(buffer);
  } catch (error) {
    throw new Error(
      `PDF dosya okuma hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }
}

/**
 * PDF dosyasından detaylı bilgi çıkarır
 * @param buffer PDF dosyasının buffer'ı
 * @returns PDF metni ve metadata bilgileri
 */
export async function extractPdfInfo(buffer: Buffer): Promise<{
  texts: MDocument;
  numpages: number;
  info: PdfInfo;
  metadata: PdfMetadata;
  version: string;
}> {
  try {
    const data = await pdf(buffer);
    const document = MDocument.fromText(data.text);
    return {
      texts: document,
      numpages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
    };
  } catch (error) {
    throw new Error(
      `PDF bilgi çıkarma hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }
}

type Chunk = {
  text: string;
  metadata: {
    pdf_name: string;
    chunk_index: number;
    numpages: number;
  };
};

export async function extractAndChunkPdf(filePath: string): Promise<Chunk[]> {
  const pdfData = await pdf(await readFile(filePath));
  const document = await MDocument.fromText(pdfData.text);

  const chunks = await document.chunk({
    maxSize: 512,
    overlap: 50,
    separators: ["\n", "\n\n"],
    strategy: "recursive",
  });

  return chunks.map((chunk, index) => ({
    text: chunk.text,
    metadata: {
      pdf_name: filePath.split("/").pop() || filePath,
      chunk_index: index,
      numpages: pdfData.numpages,
    },
  }));
}

export async function extractAndChunkPdfFiles(
  files: string[],
): Promise<Chunk[]> {
  return Promise.allSettled(files.map(extractAndChunkPdf)).then((results) =>
    results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value),
  );
}

/**
 * Array'i belirtilen boyutlarda gruplara böler
 * @param array Bölünecek array
 * @param batchSize Batch boyutu
 * @returns Array'in batch'lere bölünmüş hali
 */
function chunkArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

export async function indexPdfFiles(files: string[]) {
  const chunks = await extractAndChunkPdfFiles(files);
  console.log(`Toplam ${chunks.length} chunk oluşturuldu`);
  
  // Chunks'ları 100'li gruplara böl
  const chunkBatches = chunkArray(chunks, 100);
  
  // Her batch'i ayrı ayrı işle
  for (let i = 0; i < chunkBatches.length; i++) {
    const batch = chunkBatches[i];
    console.log(`Batch ${i + 1}/${chunkBatches.length} işleniyor... (${batch.length} chunk)`);
    
    // Her batch için embedding oluştur
    const {embeddings} = await embedMany({
      values: batch.map(chunk => chunk.text),
      model: embedding,
      providerOptions: {
        google: {
          outputDimensionality: 1024, // optional, number of dimensions for the embedding
          taskType: "CLASSIFICATION",
        },
      },
    });
    
    // İlk batch'te index oluştur
    if (i === 0) {
      const indexes = await libsqlVector.listIndexes();
      
      // Mevcut index varsa sil (dimension mismatch sorununu çözmek için)
      if (indexes.includes("pdf_chunks")) {
        console.log("Mevcut pdf_chunks index'i siliniyor...");
        await libsqlVector.deleteIndex({ indexName: "pdf_chunks" });
      }
      
      // Yeni index oluştur
      await libsqlVector.createIndex({
        indexName: "pdf_chunks",
        dimension: 1024, // outputDimensionality ile uyumlu
        metric: "cosine",
      });
      console.log("PDF chunks index'i 1024 dimension ile oluşturuldu");
    }

    // Batch'i vector store'a ekle
    await libsqlVector.upsert({
      indexName: "pdf_chunks",
      vectors: embeddings,
      metadata: batch.map(chunk => chunk.metadata),
    });
    
    console.log(`Batch ${i + 1} başarıyla indexlendi`);
    await setTimeout(1000);
  }
  
  console.log("Tüm PDF'ler başarıyla indexlendi!");
}

const files = [
  "lib/mastra/test_1.pdf",
  "lib/mastra/test.pdf"
];

await indexPdfFiles(files);