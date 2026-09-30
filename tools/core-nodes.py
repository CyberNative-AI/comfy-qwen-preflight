import re,sys,os,json,glob
def ids(root):
    out=set()
    for f in glob.glob(root+'/**/*.py',recursive=True):
        s=open(f,encoding='utf-8',errors='ignore').read()
        out.update(re.findall(r'node_id\s*=\s*"([^"]+)"',s))
        for m in re.finditer(r'NODE_CLASS_MAPPINGS\s*=\s*\{(.*?)\n\}',s,re.S):
            out.update(re.findall(r'^\s*"([^"]+)"\s*:',m.group(1),re.M))
    return out
res={v:sorted(ids(v)) for v in ["v0.36.0","v0.37.0","v0.38.0"]}
for v in res: print(v,len(res[v]))
a,b,c=[set(res[v]) for v in ["v0.36.0","v0.37.0","v0.38.0"]]
print("new in 0.37:",sorted(b-a)); print("new in 0.38:",sorted(c-b)); print("removed:",sorted((a-b)|(b-c)))
json.dump(res,open('core_nodes.json','w'))
