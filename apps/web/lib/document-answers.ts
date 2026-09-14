import type { Source, Dataset, Citation } from './localops-types';
const ignored = new Set('what which who where when why how is are was were am my me your you our the a an and or for to of in on with from about can could would should please tell show give does do did has have file files document documents pdf resume cv summarize summary explain this that uploaded upload based'.split(' '));
const terms = (text: string) => [...new Set((text.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) || []).filter(t=>t.length>1&&!ignored.has(t)))];
const semanticGroups: Record<string, string[]> = {
 cloud: ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'devops', 'cloudflare'],
 devops: ['ci/cd', 'github actions', 'jenkins', 'docker', 'kubernetes', 'terraform', 'aws', 'azure', 'linux'],
 deployment: ['deploy', 'deployment', 'ci/cd', 'github actions', 'docker', 'kubernetes', 'terraform', 'release'],
 frontend: ['react', 'next.js', 'typescript', 'javascript', 'tailwind', 'html', 'css'],
 backend: ['python', 'fastapi', 'node.js', 'api', 'database', 'postgresql', 'sql'],
 database: ['postgresql', 'mysql', 'mongodb', 'sqlite', 'sql', 'redis'],
 leadership: ['lead', 'managed', 'mentored', 'team', 'stakeholder', 'owner'],
 security: ['security', 'oauth', 'authentication', 'authorization', 'encryption', 'iam'],
};
function enrichTerms(words: string[]) {
 return [...new Set(words.flatMap(word => [word, ...(semanticGroups[word] || [])]))];
}
export function chunks(text: string) {
 const result: {text:string;page?:number;section?:string}[]=[];
 let page:number|undefined, section:string|undefined, part='';
 const flush=()=>{if(part.trim())result.push({text:part.trim(),page,section});part='';};
 for(const raw of text.split(/\n+/)) {
  const line=raw.trim(); if(!line)continue;
  const marker=line.match(/^\[Page\s+(\d+)\]$/i);
  if(marker){flush();page=Number(marker[1]);continue;}
  if(/^#{1,6}\s/.test(line)||/^(skills|technical skills|experience|education|projects|certifications|professional experience|summary)$/i.test(line)) {
   flush();section=line.replace(/^#+\s*/, '');continue;
  }
  for(const sentence of line.match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g)||[line]) {
   if(part.length+sentence.length>500)flush();
   for(let start=0;start<sentence.length;start+=500){
    const piece=sentence.slice(start,start+500).trim();
    if(part.length+piece.length>600)flush();
    part+=(part?'\n':'')+piece;
   }
  }
 }
 flush();return result;
}
const isContinuation = (question: string) => /^(?:continue|go on|keep going|more|tell me more|show more|next)(?:\s*[.!?])?$/i.test(question.trim());
const isAcknowledgement = (question: string) => /^(?:nice|thanks|thank you|great|good|okay|ok|got it|cool|awesome|wow|amazing|perfect|excellent|helpful|lovely)(?:\s*(?:thanks|thank you))?[.!?]*$/i.test(question.trim());
const isGreeting = (question: string) => /^(?:hi|hello|hey|good morning|good afternoon|good evening|how are you)[.!?]*$/i.test(question.trim());
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
export function answerDocuments(question:string, documents:Source[], history:{role:string;content:string;metadata?:{citations?:Citation[]}}[]=[], similarities:Map<string,number>=new Map()):{answer:string;citations:Citation[]} {
 if(!documents.length)return {answer:'📎 I’d be happy to help! Please add a document with the + button first, then ask me anything about it. I’ll keep my answers tied to your file.',citations:[]};
 if(isAcknowledgement(question))return {answer:'😊 Glad that helped! Whenever you’re ready, ask me anything else about your uploaded files.',citations:[]};
 if(isGreeting(question))return {answer:'👋 Hi! I’m here to help you explore your uploaded files. What would you like to know?',citations:[]};
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

 const baseTerms=terms(named.reduce((s,d)=>s.replace(d.filename.toLowerCase(),''),q));
 const expanded=enrichTerms([...baseTerms,...(isSkills?['skills','technical','tools','technologies','programming','languages','frameworks']:[]),...(isExperience?['experience','engineer','developer','employment','worked','intern']:[]),...(isEducation?['education','university','degree','bachelor','master','college']:[]),...(isProjects?['projects','built','developed','created','achieved','deployed']:[])]);
 const all=docs.flatMap(d=>chunks(d.content||'').map((chunk,index)=>{
  const text=chunk.text; const lower=((chunk.section||'')+' '+text).toLowerCase();
  const words=new Set(terms(lower));
  const matches=expanded.filter(t=>t.includes(' ')?lower.includes(t):words.has(t));
  const lexical=matches.length/Math.max(1,expanded.length);
  const semantic=similarities.get(d.id+':'+index)||0;
  const sensitive=baseTerms.filter(t=>/salary|compensation|availability|phone|email/.test(t));
  const supported=!sensitive.length||sensitive.some(t=>lower.includes(t));
  const score=supported&&(matches.length>0||semantic>=0.42)?lexical*0.55+Math.max(0,semantic)*0.45:0;
  return {document_id:d.id,filename:d.filename,excerpt:text,score,index,page:chunk.page,section:chunk.section};
 }));
 const bestScore=Math.max(0,...all.map(c=>c.score));
 const priorCitations=history.flatMap(message=>message.metadata?.citations||[]);
 const priorPositions=priorCitations.map(c=>({document_id:c.document_id,index:c.chunk_index})).filter(c=>typeof c.index==='number');
 if(continuing && !priorPositions.length)return {answer:'🔎 I don’t have an earlier document answer to continue from yet. Ask me a specific question about one of your uploaded files and I’ll take it from there.',citations:[]};
 let selected;
 if(continuing && priorPositions.length){
  const next=priorPositions.map(previous=>all.find(c=>c.document_id===previous.document_id&&c.index===previous.index!+1)).filter(Boolean) as typeof all;
  selected=next.length ? next.slice(0,3) : all.filter(c=>c.score>0&&c.score>=bestScore*0.65).sort((a,b)=>b.score-a.score).slice(0,3);
 } else {
  selected=isSummary?all.filter(c=>c.index<3).slice(0,3):all.filter(c=>c.score>0&&c.score>=bestScore*0.65).sort((a,b)=>b.score-a.score).slice(0,2);
 }
 if(!selected.length)return {answer:'🔍 I couldn’t spot that in the uploaded files. Could you try phrasing the question a little differently, or add the file that contains it? I’ll stick to what your documents actually say.',citations:[]};
 const intro=continuing?'Here is the next relevant detail from the same document:':isSummary?'Here is a source-based overview of your document:':isSkills?'These passages list the relevant skills and technologies:':isExperience?'Here is the experience recorded in your document:':isProjects?'These are the projects and achievements I found:':'I found the information most relevant to your question:';
 return {answer:intro+'\n\n'+selected.map((c,i)=>`**${c.filename} [${i+1}]**\n\n${focusedExcerpt(c.excerpt,expanded)}`).join('\n\n'),citations:selected.map(c=>({...c,chunk_index:c.index,score:c.score}))};
}

export async function answerDocumentsSemantic(question:string, documents:Source[], history:Parameters<typeof answerDocuments>[2]=[], signal?:AbortSignal) {
 if(!documents.length||isAcknowledgement(question)||isGreeting(question))return answerDocuments(question,documents,history);
 const query=isContinuation(question)?[...history].reverse().find(m=>m.role==='user')?.content||question:question;
 const named=documents.filter(d=>query.toLowerCase().includes(d.filename.toLowerCase()));
 const corpus=(named.length?named:documents).flatMap(d=>chunks(d.content||'').map((chunk,index)=>({key:d.id+':'+index,text:(chunk.section?chunk.section+'\n':'')+chunk.text})));
 try {
  const {semanticScores}=await import('./semantic-search');
  const scores=await semanticScores(query,corpus.map(c=>c.text),signal);
  return answerDocuments(question,documents,history,new Map(corpus.map((c,i)=>[c.key,scores[i]])));
 } catch(error) {
  if(signal?.aborted)throw error;
  const fallback=answerDocuments(question,documents,history);
  return {...fallback,answer:fallback.answer+'\n\n_Search used keyword matching because the semantic model could not load._'};
 }
}
