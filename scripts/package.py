"""Create a reproducible source ZIP using a strict allowlist; no host credentials."""
from pathlib import Path
import hashlib, json, zipfile
root=Path(__file__).resolve().parents[1]
files=[root/name for name in ('README.md','LICENSE','package.json','package-lock.json','server.mjs','cli.mjs','vercel.json','.gitignore')]
for folder in ('public','scripts','tests','docs','.github'):
    files.extend(p for p in (root/folder).rglob('*') if p.is_file() and p.suffix in ('.html','.css','.mjs','.json','.md','.svg','.txt','.py','.yml'))
files=sorted(files,key=lambda p:p.relative_to(root).as_posix())
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
with zipfile.ZipFile(root/'public/relay-source.zip','w',compression=zipfile.ZIP_DEFLATED) as archive:
    for name,data in [(str(p.relative_to(root)),p.read_bytes()) for p in files]+[('SOURCE-MANIFEST.json',(json.dumps(manifest,indent=2)+'\n').encode())]:
        item=zipfile.ZipInfo('relay/'+name,date_time=(1980,1,1,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;item.external_attr=0o644<<16;archive.writestr(item,data)
print(hashlib.sha256((root/'public/relay-source.zip').read_bytes()).hexdigest())
