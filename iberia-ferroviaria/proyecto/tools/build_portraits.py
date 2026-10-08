"""Build embedded JPEG portraits from 9 x 7 generated PNG originals. Requires Pillow."""
from pathlib import Path
from PIL import Image,ImageOps
import base64,io,json
ROOT=Path(__file__).resolve().parents[1]
PEOPLE=['president','minister','successor','treasury','adif','workshop','riders','mayor','rival']
MOODS=['happy','angry','worried','proud','surprised','disappointed','determined']
def main():
    portraits={}
    source=ROOT.parent/'investigacion/retratos'
    output=source/'jpeg';output.mkdir(exist_ok=True,parents=True)
    for person in PEOPLE:
        portraits[person]={}
        for mood in MOODS:
            path=source/f'{person}-{mood}.png'
            with Image.open(path) as image:
                if image.size!=(1024,1536):raise ValueError(f'{path}: tamaño inesperado {image.size}')
                thumb=ImageOps.fit(image.convert('RGB'),(600,900),method=Image.Resampling.LANCZOS)
                buf=io.BytesIO();thumb.save(buf,format='JPEG',quality=84,optimize=True)
            (output/f'{person}-{mood}.jpg').write_bytes(buf.getvalue())
            portraits[person][mood]='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode('ascii')
    (ROOT/'dist/assets/portraits.js').write_text('// Retratos fotográficos generados con IA. Regenerar: python3 tools/build_portraits.py\nexport const PORTRAITS = '+json.dumps(portraits,separators=(',',':'))+';\n')
    print(f'{len(PEOPLE)*len(MOODS)} retratos JPEG de 600×900 integrados.')
if __name__=='__main__':main()
