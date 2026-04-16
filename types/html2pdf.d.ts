declare module "html2pdf.js" {
  export interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: { unit?: string; format?: string | number[]; orientation?: string };
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  export interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    toContainer(): Html2PdfInstance;
    toCanvas(): Html2PdfInstance;
    toImg(): Html2PdfInstance;
    toPdf(): Html2PdfInstance;
    save(filename?: string): Promise<void>;
    output(type: "blob"): Promise<Blob>;
    output(type: "datauristring"): Promise<string>;
    output(type: "bloburl"): Promise<string>;
    then<T>(callback: (value: unknown) => T): Promise<T>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfInstance;

  export default html2pdf;
}
