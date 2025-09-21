// pdf-parse-debugging-disabled paketinin tür tanımları
// Bu paket pdf-parse paketinin extend edilmiş halidir ancak kendi tür tanımları yoktur
// Bu yüzden @types/pdf-parse paketindeki türleri kullanıyoruz

declare module 'pdf-parse-debugging-disabled' {
  import PdfParse from 'pdf-parse';
  export = PdfParse;
}
