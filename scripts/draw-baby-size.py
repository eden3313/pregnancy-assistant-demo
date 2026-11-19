"""Draw original, offline fruit illustrations for the size comparison cards."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'miniprogram/assets/baby-size'
OUT.mkdir(parents=True, exist_ok=True)
for name in ['blueberry', 'strawberry', 'avocado', 'banana', 'corn', 'cauliflower', 'coconut', 'melon', 'pumpkin']:
    image = Image.new('RGBA', (480, 400), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse((90, 340, 390, 370), fill='#dce2d2')
    if name == 'blueberry':
        d.ellipse((115, 80, 365, 335), fill='#5d70ae', outline='#445789', width=7)
        d.ellipse((150, 105, 225, 160), fill='#9aa9d2')
        d.polygon([(240,150),(220,123),(190,133),(203,101),(185,79),(220,80),(240,55),(255,81),(292,78),(274,105),(283,133),(254,124)], fill='#394879')
    elif name == 'strawberry':
        d.polygon([(105,130),(140,90),(240,80),(340,90),(375,130),(355,220),(300,295),(240,345),(180,295),(125,220)], fill='#e98079')
        d.polygon([(140,110),(160,60),(215,85),(240,40),(260,85),(320,60),(335,115),(275,105),(240,140),(205,105)], fill='#61966e')
        for x,y in [(160,160),(230,180),(305,160),(185,235),(270,245),(235,295)]: d.ellipse((x,y,x+8,y+15), fill='#ffe6ac')
    elif name == 'avocado':
        d.ellipse((115,140,365,345), fill='#5e8961')
        d.ellipse((165,55,315,230), fill='#5e8961')
        d.polygon([(166,115),(115,237),(365,237),(314,115)], fill='#5e8961')
        d.ellipse((130,151,350,332), fill='#d9df91')
        d.ellipse((179,70,301,230), fill='#d9df91')
        d.polygon([(180,120),(135,220),(345,220),(300,120)], fill='#d9df91')
        d.ellipse((183,204,297,316), fill='#a16b4c', outline='#8c593f', width=6)
    elif name == 'banana':
        d.arc((75,5,395,325), 5, 170, fill='#d3a247', width=85)
        d.arc((75,0,390,310), 10, 165, fill='#f5d478', width=65)
        d.line((89,155,106,180), fill='#89734d', width=20)
        d.line((380,155,392,128), fill='#89734d', width=17)
    elif name == 'corn':
        d.rounded_rectangle((169,48,311,335), radius=65, fill='#edc56a')
        for x in range(185,300,30):
            for y in range(75,310,32): d.rounded_rectangle((x,y,x+22,y+25), radius=8, fill='#ffe19a')
        d.polygon([(240,355),(105,200),(100,120),(200,225)], fill='#739964')
        d.polygon([(240,355),(365,180),(365,120),(275,235)], fill='#91ad73')
    elif name == 'cauliflower':
        d.polygon([(240,365),(80,240),(110,170),(220,260),(370,160),(405,220)], fill='#7e9c6c')
        for box in [(100,130,235,275),(180,75,310,225),(255,130,390,275),(165,175,325,325)]:
            d.ellipse(box, fill='#f7edd3', outline='#e3d6b5', width=6)
    elif name == 'coconut':
        d.ellipse((100,75,380,345), fill='#93735a')
        d.ellipse((125,90,355,320), fill='#faf1df')
        d.ellipse((157,120,323,290), fill='#d5b48b')
        d.ellipse((172,136,309,278), fill='#f5e8d0')
    elif name == 'melon':
        d.ellipse((100,65,380,345), fill='#b4bd82', outline='#879468', width=7)
        for x in range(115,390,40): d.line((x,85,x-80,315), fill='#e2dfb4', width=5)
        for x in range(90,330,40): d.line((x,90,x+95,315), fill='#e2dfb4', width=5)
        d.line((235,70,250,40,275,40), fill='#7b835a', width=13)
    else:
        d.line((235,110,245,50,275,40), fill='#768553', width=25)
        for box,c in [((70,120,250,335),'#d89758'),((230,120,410,335),'#d89758'),((115,105,285,350),'#e6a461'),((195,105,365,350),'#e6a461'),((175,95,305,355),'#f1b573')]: d.ellipse(box, fill=c, outline='#cf8c4e', width=5)
    image.resize((240,200), Image.Resampling.LANCZOS).save(OUT / f'{name}.png')
print(f'Created 9 illustrations in {OUT}')
