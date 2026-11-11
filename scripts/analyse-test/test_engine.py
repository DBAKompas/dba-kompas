"""Proefopstelling: nieuwe DBA-analyse met Opus 5.5 + actuele jurisprudentie (web search).
Leest de API-sleutel uit het .env.local-pad dat als argument wordt meegegeven. Drukt de sleutel nooit af."""
import json, sys, time, urllib.request, re

env_path, case_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
model = sys.argv[4] if len(sys.argv) > 4 else "claude-opus-5-5"
key = None
for line in open(env_path, encoding="utf-8"):
    if line.startswith("ANTHROPIC_API_KEY="):
        key = line.split("=", 1)[1].strip().strip('"').strip("'")
assert key, "geen sleutel gevonden"

SYSTEM = open(sys.argv[5], encoding="utf-8").read()
case = open(case_path, encoding="utf-8").read()
dossier = open(sys.argv[6], encoding="utf-8").read() if len(sys.argv) > 6 else None

body = {
    "model": model,
    "max_tokens": 6000,
    "system": SYSTEM,
    "tools": [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 3,
        "allowed_domains": ["rechtspraak.nl", "uitspraken.rechtspraak.nl", "hogeraad.nl", "belastingdienst.nl", "rijksoverheid.nl", "tweedekamer.nl"],
        "user_location": {"type": "approximate", "country": "NL", "timezone": "Europe/Amsterdam"},
    }],
    "messages": [{"role": "user", "content": "<OPDRACHT_TEKST>\n" + case + "\n</OPDRACHT_TEKST>\n\nVoer de analyse uit volgens je instructies."}],
}
if dossier is not None:
    del body["tools"]
    body["system"] = SYSTEM + "\n\n<DOSSIER>\n" + dossier + "\n</DOSSIER>"
if case_path.endswith("dossier_task.txt"):
    body["messages"] = [{"role": "user", "content": case}]
    body["tools"][0]["max_uses"] = 8
    body["max_tokens"] = 14000
req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=json.dumps(body).encode(),
    headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
)
t = time.time()
try:
    resp = json.load(urllib.request.urlopen(req, timeout=420))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:600]); sys.exit(1)
dt = time.time() - t

queries, sources, text_after = [], [], []
for b in resp["content"]:
    if b["type"] == "server_tool_use":
        queries.append(b["input"].get("query")); text_after = []
    elif b["type"] == "web_search_tool_result":
        c = b["content"]
        if isinstance(c, list):
            sources += [(r.get("title"), r.get("url"), r.get("page_age")) for r in c]
        else:
            sources.append(("FOUT", c.get("error_code"), None))
        text_after = []
    elif b["type"] == "text":
        text_after.append(b["text"])
final = "".join(text_after)
m = re.search(r"\{[\s\S]*\}", final)
parsed = None
if m:
    try: parsed = json.loads(m.group(0))
    except Exception as e: print("JSON-fout:", e)
json.dump({"seconds": round(dt, 1), "usage": resp.get("usage"), "stop": resp.get("stop_reason"), "queries": queries,
           "sources": sources, "result": parsed, "raw": None if parsed else final}, open(out_path, "w"), ensure_ascii=False, indent=1)
u = resp.get("usage", {})
print(f"{model}: {dt:.0f}s, in={u.get('input_tokens')} out={u.get('output_tokens')} searches={u.get('server_tool_use',{}).get('web_search_requests')} stop={resp.get('stop_reason')} json={'ok' if parsed else 'NEE'}")
print("zoekvragen:", queries)
