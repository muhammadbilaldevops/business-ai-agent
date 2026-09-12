import type { Source, Dataset, Citation } from './localops-types';
const ignored = new Set('what which who where when why how is are was were am my me your you our the a an and or for to of in on with from about can could would should please tell show give does do did has have file files document documents pdf resume cv summarize summary explain this that uploaded upload based'.split(' '));
const terms = (text: string) => [...new Set((text.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) || []).filter(t=>t.length>1&&!ignored.has(t)))];
function chunks(text: string) {
 const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean); const result:string[]=[];let part='';
 for(const line of lines){ if(part.length+line.length>650 && part){result.push(part);part='';} if(line.length>900){for(let i=0;i<line.length;i+=600)result.push(line.slice(i,i+750));}else part+=(part?'\n':'')+line; } if(part)result.push(part); return result;
}
const isContinuation = (question: string) => /^(?:continue|go on|keep going|more|tell me more|show more|next)(?:\s*[.!?])?$/i.test(question.trim());
const isAcknowledgement = (question: string) => /^(?:nice|thanks|thank you|great|good|okay|ok|got it|cool|awesome)(?:\s*(?:thanks|thank you))?[.!?]*$/i.test(question.trim());
function focusedExcerpt(text: string, keywords: string[]) {
 const lines=text.split(/\n+/).map(line=>line.trim()).filter(Boolean);
 const relevant=lines.filter(line=>keywords.some(word=>line.toLowerCase().includes(word)));
 const selected=(relevant.length ? relevant : lines).slice(0, 4).join('\n');
 if(selected.length<=750)return selected;
 const first=keywords.map(word=>selected.toLowerCase().indexOf(word)).find(index=>index>=0) ?? 0;
 return (first>80?'…':'')+selected.slice(Math.max(0,first-80),first+620)+(selected.length>first+620?'…':'');
}
export function suggestQuestions(documents: Source[], datasets: Dataset[]) {
 const doc=documents[documents.length-1];
 if(doc){const name=doc.filename;const text=(doc.content||'').toLowerCase();
  if(/resume|résumé|\bcv\b/i.test(name)||(/experience|education/.test(text)&&/skills|certification/.test(text))) return [`Summarize the experience in ${name}`,`What technical skills are listed in ${name}?`,`What projects and achievements are in ${name}?`];
  const subjects=[...new Set((doc.content||'').split(/\n+/).map(l=>l.replace(/^#+\s*/, '').trim()).filter(l=>l.length>8&&l.length<75&&!/https?:|@|^\[Page/.test(l)))];
  return [`Summarize ${name}`,subjects.length>1 ? `What does ${name} say about ${subjects[1]}?` : `What are the key facts in ${name}?`, `Find dates and numbers in ${name}`];
 }
 const data=datasets[datasets.length-1];return data ? [`Analyze ${data.filename}`,`Show the first rows of ${data.filename}`,`What columns are in ${data.filename}?`] : [];
}
export function answerDocuments(question:string, documents:Source[], history:{role:string;content:string;metadata?:{citations?:Citation[]}}[]=[]):{answer:string;citations:Citation[]} {
 if(!documents.length)return {answer:'Add your files using the + button, then ask about their contents. I will show the sources behind each answer.',citations:[]};
 if(isAcknowledgement(question))return {answer:'You’re welcome. Ask another question about your uploaded files whenever you’re ready.',citations:[]};
 const continuing=isContinuation(question);
 const previousUser=[...history].reverse().find(message=>message.role==='user')?.content;
 const q=(continuing && previousUser ? previousUser : question).toLowerCase();
 const named=documents.filter(d=>q.includes(d.filename.toLowerCase()));
 const entity=q.match(/\bproject\s+([\p{L}\p{N}_-]+)/u)?.[0];
 const entityDocs=entity ? documents.filter(d=>(d.content||'').toLowerCase().includes(entity)) : [];
 const docs=named.length?named:entityDocs.length?entityDocs:documents;
 const isSummary=/summari[sz]e|summary|overview|key facts|tell me about/.test(q);
 const isSkills=/\bskills?\b|technolog|tech stack/.test(q);
 const isExperience=/experience|employment|work history/.test(q);
 const isEducation=/education|degree|university|college/.test(q);
 const isProjects=/projects|achievements?|accomplishments?/.test(q);
 const isNumbers=/dates and numbers|date|number|salary|year|month/.test(q);
 const baseTerms=terms(named.reduce((s,d)=>s.replace(d.filename.toLowerCase(),''),q));
 const expanded=[...baseTerms,...(isSkills?['skills','technical','tools','technologies','programming','languages','frameworks']:[]),...(isExperience?['experience','engineer','developer','employment','worked','intern']:[]),...(isEducation?['education','university','degree','bachelor','master','college']:[]),...(isProjects?['projects','built','developed','created','achieved','deployed']:[])];
 const all=docs.flatMap(d=>chunks(d.content||'').map((text,index)=>{
  const lower=text.toLowerCase();let score=expanded.reduce((sum,t)=>sum+(lower.includes(t)?1:0),0);
  if(isNumbers && /\d/.test(text))score+=2;
  return {document_id:d.id,filename:d.filename,excerpt:text,score,index};
 }));
 const bestScore=Math.max(0,...all.map(c=>c.score));
 const priorCitations=history.flatMap(message=>message.metadata?.citations||[]);
 const priorPositions=priorCitations.map(c=>({document_id:c.document_id,index:c.chunk_index})).filter(c=>typeof c.index==='number');
 let selected;
 if(continuing && priorPositions.length){
  const next=priorPositions.map(previous=>all.find(c=>c.document_id===previous.document_id&&c.index===previous.index!+1)).filter(Boolean) as typeof all;
  selected=next.length ? next.slice(0,3) : all.filter(c=>c.score>0&&c.score>=bestScore*0.65).sort((a,b)=>b.score-a.score).slice(0,3);
 } else {
  selected=isSummary?all.filter(c=>c.index<4).slice(0,4):all.filter(c=>c.score>0&&c.score>=bestScore*0.65).sort((a,b)=>b.score-a.score).slice(0,3);
 }
 if(!selected.length)return {answer:'I couldn’t find that information in the uploaded files. Try a more specific question, or add a document containing the answer. I won’t fill in missing facts.',citations:[]};
 const intro=continuing?'Here is the next relevant detail from the same document:':isSummary?'Here is a source-based overview of your document:':isSkills?'These passages list the relevant skills and technologies:':isExperience?'Here is the experience recorded in your document:':isProjects?'These are the projects and achievements I found:':'I found the information most relevant to your question:';
 return {answer:intro+'\n\n'+selected.map((c,i)=>`**${c.filename} [${i+1}]**\n\n${focusedExcerpt(c.excerpt,expanded)}`).join('\n\n'),citations:selected.map(c=>({...c,chunk_index:c.index}))};
}
