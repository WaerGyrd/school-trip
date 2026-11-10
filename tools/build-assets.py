"""제공받은 원본 사진·폰트를 사이트용으로 줄여서 assets/ 에 넣는다.
사용: python3 tools/build-assets.py <이미지 폴더> <폰트 폴더>
"""
import os, sys
import numpy as np
from PIL import Image, ImageOps, ImageFilter
from fontTools import subset

IMG, FONT = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(os.path.join(OUT, "learn"), exist_ok=True)
os.makedirs(os.path.join(OUT, "fonts"), exist_ok=True)

def photo(src, dst, width, q):
    im = ImageOps.exif_transpose(Image.open(os.path.join(IMG, src))).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, dst), quality=q, optimize=True, progressive=True)

photo("Ho Chi minh City.jpg", "hero.jpg", 1500, 70)
photo("통일궁.png", "learn/palace.jpg", 1600, 78)
photo("전쟁박물관.jpg", "learn/war.jpg", 1600, 78)
photo("역사박물관.jpg", "learn/history.jpg", 1600, 80)

def trimmed(src, dst, colors=None):
    im = Image.open(os.path.join(IMG, src)).convert("RGBA")
    im = im.crop(im.getbbox())
    if colors:
        im = im.quantize(colors, method=Image.FASTOCTREE)
    im.save(os.path.join(OUT, dst), optimize=True)

trimmed("logo.png", "kish-wordmark.png")                      # 받은 logo.png 는 사실 KISH 워드마크
def circle_logo(src, dst, size=240):
    """학교 로고: 배경 제거 때 남은 흰 잔상을 지우고 완전한 원으로 자른다."""
    im = Image.open(os.path.join(IMG, src)).convert("RGBA")
    a = np.asarray(im).astype(int)
    solid = (a[..., 3] > 200) & ~((a[..., 0] > 200) & (a[..., 1] > 200) & (a[..., 2] > 200))  # 흰색이 아닌 진한 부분(테두리)
    ys, xs = np.nonzero(solid)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
    box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
    im = im.crop(box).resize((size, size), Image.LANCZOS)
    big = Image.new("L", (size * 4, size * 4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(big).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = big.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = Image.new("RGBA", (size, size), (255, 255, 255, 255))   # 원 안쪽은 불투명하게
    inner.alpha_composite(im)
    out.paste(inner, (0, 0), mask)
    out.save(os.path.join(OUT, dst), optimize=True)

circle_logo("image-removebg-preview (4).png", "logo.png")    # 학교 로고

# 코르크 무늬 (제공 안 됨 → 직접 생성)
rng = np.random.default_rng(3)
n = rng.normal(0, 1, (600, 600))
noise = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
a = np.asarray(noise) / 255.0
img = np.array([196, 150, 98])[None, None, :] * (0.78 + 0.42 * a[..., None])
img[rng.random((600, 600)) > 0.985] *= 0.62
Image.fromarray(np.clip(img, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.6)).save(os.path.join(OUT, "cork.jpg"), quality=82)

# 폰트: 한글 2,350자(KS X 1001) + 기본 라틴·문장부호만 남긴 woff2
hangul = "".join(bytes([h, l]).decode("euc-kr") for h in range(0xB0, 0xC9) for l in range(0xA1, 0xFF))
latin = "".join(chr(c) for c in range(0x20, 0x7F)) + "·…–—‘’“”→←↑↓•※○×~"
def font(src, dst, text):
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]; opts.name_IDs = ["*"]
    f = subset.load_font(os.path.join(FONT, src), opts)
    s = subset.Subsetter(opts); s.populate(text=text); s.subset(f)
    subset.save_font(f, os.path.join(OUT, "fonts", dst), opts)

font("에이투지체-7Bold.ttf", "a2z.woff2", hangul + latin)
font("Freesentation-6SemiBold.ttf", "freesentation.woff2", hangul + latin)
font("ForwardSerifBoldPersonalRegular-axKLx.otf", "forward.woff2", "Ho Chi Minh City ")

for root, _, fs in os.walk(OUT):
    for f in sorted(fs):
        p = os.path.join(root, f); print(f"{os.path.getsize(p)//1024:>5}K {os.path.relpath(p, OUT)}")
