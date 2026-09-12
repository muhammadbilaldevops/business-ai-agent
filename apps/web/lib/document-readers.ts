import type { Worker } from 'tesseract.js';
export const supportedFiles = '.pdf,.docx,.txt,.md,.json,.csv,.xlsx,.png,.jpg,.jpeg';
const MAX_TEXT=250_000;
function validate(text:string){const value=text.replace(/\u0000/g,'').trim();if(!value)throw new Error('This file has no readable text. For scans, use a clear, upright image with printed English text.');if(value.length>MAX_TEXT)throw new Error('This document is too long for browser storage. Split it into smaller files.');return value;}
async function makeOCR(progress?: (text:string)=>void) {
 const {createWorker}=await import('tesseract.js');
 return createWorker('eng',1,{workerPath:'/document-assets/ocr/worker.min.js',corePath:'/document-assets/ocr/core',langPath:'/document-assets/ocr/lang',workerBlobURL:false,logger:m=>progress?.('Reading scanned text: '+m.status+(m.progress ? ' '+Math.round(m.progress*100)+'%' : ''))});
}
export async function readDocument(file:File, progress?: (text:string)=>void):Promise<string>{
 const ext=file.name.split('.').pop()?.toLowerCase();
 progress?.('Reading '+file.name+'…');
 if(ext==='pdf'){
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc='/document-assets/pdf.worker.min.mjs';
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,cMapUrl:'/document-assets/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-assets/standard_fonts/',wasmUrl:'/document-assets/wasm/'});
  let pdf;let ocr:Worker|undefined;
  try{
   pdf=await task.promise;if(pdf.numPages>60)throw new Error('Please split PDFs longer than 60 pages before uploading.');const pages:string[]=[];
   for(let n=1;n<=pdf.numPages;n++){
    progress?.('Reading '+file.name+' · page '+n+' of '+pdf.numPages);
    const page=await pdf.getPage(n),content=await page.getTextContent();
    let text='';let lastY:number|undefined;
    for(const item of content.items){if(!('str' in item))continue;const y=item.transform[5];if(lastY!==undefined&&Math.abs(y-lastY)>3)text+='\n';else if(text&&!text.endsWith('\n'))text+=' ';text+=item.str;if(item.hasEOL)text+='\n';lastY=y;}
    if(text.replace(/\s/g,'').length<12){
     ocr ||= await makeOCR(progress);
     const normal=page.getViewport({scale:1});const scale=Math.min(2,Math.sqrt(4_000_000/(normal.width*normal.height)));
     const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     await page.render({canvas,viewport}).promise;
     text=(await ocr.recognize(canvas)).data.text;canvas.width=0;canvas.height=0;
    }
    if(text.trim())pages.push('[Page '+n+']\n'+text.trim());
    page.cleanup();
   }
   return validate(pages.join('\n\n'));
  }catch(e){if(e instanceof Error && /password/i.test(e.name+' '+e.message))throw new Error('This PDF is password protected. Unlock it and upload an unprotected copy.');throw e;}
  finally{await ocr?.terminate();await task.destroy();}
 }
 if(ext==='docx'){const mammoth=await import('mammoth');const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return validate(result.value);}
 if(ext==='xlsx'){const data=await readSpreadsheet(file);return validate([data.columns.join(' | '),...data.rows.map(r=>data.columns.map(c=>String(r[c]??'')).join(' | '))].join('\n'));}
 if(['png','jpg','jpeg'].includes(ext||'')){const worker=await makeOCR(progress);try{return validate((await worker.recognize(file)).data.text);}finally{await worker.terminate();}}
 if(['txt','md','json','csv'].includes(ext||'')){const text=await file.text();if(ext==='json')return validate(JSON.stringify(JSON.parse(text),null,2));return validate(text);}
 throw new Error('Supported files: PDF, DOCX, TXT, Markdown, JSON, CSV, XLSX, PNG, and JPG. Save older .doc files as .docx or PDF first.');
}
export async function readSpreadsheet(file:File){
 const ExcelJS=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.load(await file.arrayBuffer());const sheet=book.worksheets[0];if(!sheet||sheet.rowCount<2)throw new Error('The first worksheet needs column headers and at least one data row.');
 if(sheet.rowCount>1001||sheet.columnCount>100)throw new Error('Use up to 1,000 data rows and 100 columns per worksheet.');
 const columns:string[]=[];sheet.getRow(1).eachCell({includeEmpty:true},cell=>columns.push(cell.text.trim()));
 if(columns.some(c=>!c)||new Set(columns.map(c=>c.toLowerCase())).size!==columns.length)throw new Error('Use non-empty, unique column headers.');
 const rows:Record<string,unknown>[]=[];for(let n=2;n<=sheet.rowCount;n++){const row=sheet.getRow(n);rows.push(Object.fromEntries(columns.map((c,i)=>[c,row.getCell(i+1).text])));}return {columns,rows};
}

