from pathlib import Path
import sys

ROWS=r'''return s.split('\n').map((line,index)=>({line,index})).filter(({line})=>line.trim()).map(({line,index})=>{
 const text=line.trim();let c=text.includes('\t')?text.split('\t'):/[|｜]/.test(text)?text.split(/[|｜]/):null;
 if(c){if(c.length>2)throw Error('第 '+(index+1)+' 行有多餘分隔符號，請確認韓文與中文兩欄。');c=c.map(v=>v.trim());if(!c[0])throw Error('第 '+(index+1)+' 行請填寫韓文。');return {kr:c[0],zh:c[1]||''}}
 const pair=text.match(/^(.+?)\s+((?:[0-9０-９]+\s*)?[「『（(《〈【]?[\u3400-\u9fff].*)$/u);
 if(pair&&/[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/u.test(pair[1]))return {kr:pair[1].trim(),zh:pair[2].trim()};
 const firstChinese=text.search(/[\u3400-\u9fff]/u);
 if(firstChinese>0&&/[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/u.test(text.slice(0,firstChinese)))return {kr:text.slice(0,firstChinese).trim(),zh:text.slice(firstChinese).trim()};
 if(/[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/u.test(text)&&firstChinese<0)return {kr:text,zh:''};
 throw Error('第 '+(index+1)+' 行無法辨識韓文，請確認內容；也可以用 Tab 或 | 分欄。');
 })}'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-auto-tip-paste-style' in s:return
 start=s.index('<script id="bana-forest-notes">');end=s.index('</script>',start);part=s[start:end]
 a=part.index(" return s.split('\\n').filter(l=>l.trim()).map(line=>");b=part.index('\nfunction mountTip(',a)
 part=part[:a]+' '+ROWS+part[b:]
 old='每行用 Tab 或 | 分欄。多行同一組請用「韓文：」「中文：」標籤，組與組空一行；中文可留空。'
 assert part.count(old)==1;part=part.replace(old,'一行一組，直接貼上「韓文句子 中文翻譯」，會自動辨識；也支援 Tab 或 | 分欄。多行同一組可用「韓文：」「中文：」標籤，組與組空一行；中文可留空。',1)
 s=s[:start]+part+s[end:]
 s=s.replace('</head>','<style id="bana-auto-tip-paste-style">.fn-batch .fn-hint{line-height:1.6}</style>\n</head>',1);p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
