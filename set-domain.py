"""Cambia l'indirizzo del sito in tutti i file (canonical, sitemap, robots, dati strutturati).
Uso:  python set-domain.py https://www.nuovodominio.it/
"""
import sys, glob, io
OLD = "https://emanuele79ottolini-collab.github.io/NAOS_DEMO-v1/"
if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
    sys.exit(__doc__)
new = sys.argv[1] if sys.argv[1].endswith("/") else sys.argv[1] + "/"
for f in glob.glob("*.html") + ["sitemap.xml", "robots.txt"]:
    s = io.open(f, encoding="utf-8", newline="").read()
    if OLD in s:
        io.open(f, "w", encoding="utf-8", newline="").write(s.replace(OLD, new))
        print("aggiornato", f)
print("Fatto. Ricorda di aggiornare OLD in questo file se cambi di nuovo.")
