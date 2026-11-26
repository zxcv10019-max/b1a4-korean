from pathlib import Path
import sys,re
def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 root=Path(__file__).resolve().parent
 if 'bana-vocab-tips-script' in s:
  for tag,marker,name in [('script','bana-vocab-tips-script','vocab-tips.js'),('style','bana-vocab-tips-style','vocab-tips.css')]:
   pattern=r'<'+tag+r' id="'+marker+r'">[\s\S]*?</'+tag+'>'
   content='<'+tag+' id="'+marker+'">'+(root/name).read_text(encoding='utf-8')+'</'+tag+'>'
   s,count=re.subn(pattern,lambda _:content,s,count=1)
   assert count==1,'Missing vocab tip block: '+marker
  p.write_bytes(s.encode('utf-8'));return
 normalize="""if(x.kind==='vocab'){for(const name of ['vocabRows','vocabExamples'])x[name]=(Array.isArray(raw[name])?raw[name]:[]).map(row=>{const next={...row};for(const key of ['kr','zh']){const value=String(row[key]??'');next[key]=value.trim();next[key+'Highlights']=window.banaTipTextColors?banaTipTextColors.trim(value,row[key+'Highlights']||[]):row[key+'Highlights']||[];}return next;}).filter(row=>row.kr||row.zh);}return x}).filter(x=>"""
 changes=[("polarity:'肯定／否定對照',","polarity:'肯定／否定對照',vocab:'補充單字',"),
 ("if(card.collectPolarityGroups)x.polarityGroups=card.collectPolarityGroups();","if(card.collectPolarityGroups)x.polarityGroups=card.collectPolarityGroups();if(card.collectVocabTips){const vocab=card.collectVocabTips();x.vocabRows=vocab.rows;x.vocabExamples=vocab.examples;}"),
 ("window.banaPolarityTips?.mount(card,rows[i]);","window.banaPolarityTips?.mount(card,rows[i]);window.banaVocabTips?.mount(card,rows[i]);"),
 ("return x}).filter(x=>",normalize),
 ("||x.noteBlocks?.length||","||x.noteBlocks?.length||x.vocabRows?.some(row=>row.kr||row.zh)||x.vocabExamples?.some(row=>row.kr||row.zh)||"),
 ("[x.title,x.content,...(x.kind==='contrast'?","[x.title,x.content,...(x.kind==='vocab'?[...(x.vocabRows||[]),...(x.vocabExamples||[])].map(row=>[row.kr,row.zh].filter(Boolean).join(' ')):[]),...(x.kind==='contrast'?")]
 for old,new in changes:
  assert s.count(old)==1,'Tip integration changed: '+old
  s=s.replace(old,new,1)
 s=s.replace('</head>','<style id="bana-vocab-tips-style">'+(root/'vocab-tips.css').read_text(encoding='utf-8')+'</style>\n</head>',1)
 s=s.replace('</body>','<script id="bana-vocab-tips-script">'+(root/'vocab-tips.js').read_text(encoding='utf-8')+'</script>\n</body>',1)
 p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
