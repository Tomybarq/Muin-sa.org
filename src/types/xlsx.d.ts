declare module "xlsx" {
  export interface WorkSheet {
    [key: string]: any;
  }
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }
  export interface WritingOptions {
    bookType?: "xlsx" | "xlsb" | "xls" | "csv";
    type?: "base64" | "binary" | "buffer" | "file" | "array";
  }
  export interface SheetJSONOptions {
    header?: string[] | string[][];
    defval?: any;
  }
  export interface ParsingOptions {
    type?: "base64" | "binary" | "buffer" | "file" | "array";
    raw?: boolean;
  }
  export const utils: {
    json_to_sheet: (data: Record<string, any>[], opts?: SheetJSONOptions) => WorkSheet;
    sheet_to_json: <T = Record<string, any>>(ws: WorkSheet, opts?: SheetJSONOptions) => T[];
    book_new: () => WorkBook;
    book_append_sheet: (wb: WorkBook, ws: WorkSheet, name: string) => void;
    decode_range: (ref: string) => { s: { r: number; c: number }; e: { r: number; c: number } };
    encode_cell: (cell: { r: number; c: number }) => string;
  };
  export function read(data: any, opts?: ParsingOptions): WorkBook;
  export function write(wb: WorkBook, opts: WritingOptions): any;
}
