import os
import shutil
import base64
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from collections import deque

def generate_assets():
    source_path = r'C:\Users\YOGA\.gemini\antigravity\brain\813ffbc6-a987-43c8-a0a7-2fe2fcc9461c\.user_uploaded\media_1795590809355_f7cb9ead.jpg'
    public_dir = r'C:\Projects\DEAR YOU\public'
    brand_dir = os.path.join(public_dir, 'brand')
    app_dir = r'C:\Projects\DEAR YOU\src\app'

    os.makedirs(brand_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    print(f"Loading source image from: {source_path}")
    raw_img = Image.open(source_path)

    # 1. Copy raw original into brand folder
    raw_img.save(os.path.join(brand_dir, 'logo-original.jpg'), quality=95)
    raw_img.save(os.path.join(brand_dir, 'logo-full.png'), format='PNG')

    # 2. Extract the D-Heart logo mark with smooth transparency
    src_rgba = raw_img.convert('RGBA')
    w, h = src_rgba.size

    # The colored logo mark is bounded at: (333, 313, 690, 676)
    # Center = (511.5, 494.5), width = 357, height = 363
    cx, cy = 511.5, 494.5
    side = max(357, 363)
    # Give it ~15% breathing room for optimal visual scaling
    crop_size = int(side * 1.25)
    half = crop_size // 2

    cropped = src_rgba.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))
    cw, ch = cropped.size
    pixels = cropped.load()

    # Flood fill outer background from 4 corners
    visited = set()
    queue = deque([(0, 0), (cw-1, 0), (0, ch-1), (cw-1, ch-1)])
    for pt in queue:
        visited.add(pt)

    while queue:
        x, y = queue.popleft()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < cw and 0 <= ny < ch and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny]
                if r > 240 and g > 240 and b > 240:
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    # Build smooth transparent RGBA image
    logo_trans = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    trans_pixels = logo_trans.load()

    for y in range(ch):
        for x in range(cw):
            r, g, b, a = pixels[x, y]
            if (x, y) in visited:
                trans_pixels[x, y] = (0, 0, 0, 0)
            else:
                is_border = False
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if (nx, ny) in visited:
                        is_border = True
                        break
                if is_border and (r > 200 and g > 200 and b > 200):
                    diff = 255 - ((r + g + b) // 3)
                    alpha = int(min(255, max(0, diff * 5.0)))
                    trans_pixels[x, y] = (r, g, b, alpha)
                else:
                    trans_pixels[x, y] = (r, g, b, 255)

    # Resize to standard high-res 512x512
    logo_512 = logo_trans.resize((512, 512), Image.Resampling.LANCZOS)
    logo_512.save(os.path.join(brand_dir, 'logo.png'), format='PNG')
    logo_512.save(os.path.join(public_dir, 'logo.png'), format='PNG')
    print("Saved 512x512 transparent logo.png")

    # 3. Create White Background and Warm Ivory Tile versions
    # Solid White version
    logo_white = Image.new('RGBA', (512, 512), (255, 255, 255, 255))
    logo_white.alpha_composite(logo_512)
    logo_white.save(os.path.join(brand_dir, 'logo-white.png'), format='PNG')

    # Warm Ivory rounded tile with subtle border (for dark backgrounds like developer console)
    tile_size = 512
    logo_tile = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
    draw_tile = ImageDraw.Draw(logo_tile)
    # Draw soft rounded rectangle
    draw_tile.rounded_rectangle([8, 8, tile_size - 8, tile_size - 8], radius=110, fill=(255, 255, 255, 255), outline=(226, 232, 240, 200), width=4)
    # Composite logo centered inside tile
    logo_tile.alpha_composite(logo_512)
    logo_tile.save(os.path.join(brand_dir, 'logo-tile.png'), format='PNG')

    # 4. Generate All Favicon Sizes
    sizes = {
        'favicon-16x16.png': (16, 16),
        'favicon-32x32.png': (32, 32),
        'favicon-48x48.png': (48, 48),
        'apple-touch-icon.png': (180, 180),
        'android-chrome-192x192.png': (192, 192),
        'android-chrome-512x512.png': (512, 512),
    }

    # For tiny favicons (16x16, 32x32, 48x48), slight crop/scale optimization ensures the white heart and D remain ultra-sharp
    for filename, (sw, sh) in sizes.items():
        if sw <= 48:
            # Use high-quality antialiasing
            fav_img = logo_512.resize((sw, sh), Image.Resampling.LANCZOS)
        elif sw == 180:
            # Apple touch icon looks best on a pristine white or soft ivory background per Apple HIG
            fav_img = Image.new('RGBA', (180, 180), (255, 255, 255, 255))
            scaled_logo = logo_512.resize((150, 150), Image.Resampling.LANCZOS)
            fav_img.alpha_composite(scaled_logo, (15, 15))
        else:
            fav_img = logo_512.resize((sw, sh), Image.Resampling.LANCZOS)

        # Save to both brand/ and public/
        fav_img.save(os.path.join(brand_dir, filename), format='PNG')
        fav_img.save(os.path.join(public_dir, filename), format='PNG')
        print(f"Generated {filename} ({sw}x{sh})")

    # 5. Multi-size favicon.ico (16, 32, 48)
    ico_16 = logo_512.resize((16, 16), Image.Resampling.LANCZOS)
    ico_32 = logo_512.resize((32, 32), Image.Resampling.LANCZOS)
    ico_48 = logo_512.resize((48, 48), Image.Resampling.LANCZOS)

    ico_path_public = os.path.join(public_dir, 'favicon.ico')
    ico_path_brand = os.path.join(brand_dir, 'favicon.ico')

    # Pillow supports saving true multi-resolution ICO files
    ico_32.save(ico_path_public, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    shutil.copyfile(ico_path_public, ico_path_brand)
    print("Generated multi-resolution favicon.ico (16, 32, 48)")

    # 6. Generate SVG Favicon wrapper
    with open(os.path.join(brand_dir, 'logo.png'), 'rb') as f:
        b64_logo = base64.b64encode(f.read()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
  </defs>
  <image href="data:image/png;base64,{b64_logo}" x="0" y="0" width="512" height="512"/>
</svg>'''
    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open(os.path.join(brand_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Generated favicon.svg")

    # 7. Generate App Router icon conventions in src/app/
    shutil.copyfile(os.path.join(public_dir, 'favicon-32x32.png'), os.path.join(app_dir, 'icon.png'))
    shutil.copyfile(os.path.join(public_dir, 'apple-touch-icon.png'), os.path.join(app_dir, 'apple-icon.png'))

    # 8. Generate PWA site.webmanifest
    manifest_content = '''{
  "name": "Dear You",
  "short_name": "Dear You",
  "description": "One platform. Unlimited gifts. Every gift tells a different story.",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#FAF8F5",
  "background_color": "#FAF8F5",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/"
}'''
    with open(os.path.join(public_dir, 'site.webmanifest'), 'w', encoding='utf-8') as f:
        f.write(manifest_content)
    with open(os.path.join(brand_dir, 'site.webmanifest'), 'w', encoding='utf-8') as f:
        f.write(manifest_content)
    print("Generated site.webmanifest")

    # 9. Generate High-Quality OpenGraph Social Sharing Image (1200x630)
    og_w, og_h = 1200, 630
    og_img = Image.new('RGBA', (og_w, og_h), (250, 248, 245, 255)) # #FAF8F5 Warm Ivory

    # Add soft ambient glow orbs in corners
    # Top-right lavender glow
    glow_tr = Image.new('RGBA', (og_w, og_h), (0, 0, 0, 0))
    d_tr = ImageDraw.Draw(glow_tr)
    d_tr.ellipse([750, -100, 1300, 450], fill=(233, 213, 255, 120)) # soft lavender
    glow_tr = glow_tr.filter(ImageFilter.GaussianBlur(80))
    og_img.alpha_composite(glow_tr)

    # Bottom-left blush rose glow
    glow_bl = Image.new('RGBA', (og_w, og_h), (0, 0, 0, 0))
    d_bl = ImageDraw.Draw(glow_bl)
    d_bl.ellipse([-100, 250, 450, 750], fill=(252, 231, 243, 140)) # blush pink
    glow_bl = glow_bl.filter(ImageFilter.GaussianBlur(90))
    og_img.alpha_composite(glow_bl)

    # Place high-res Logo Mark on left
    logo_og = logo_512.resize((340, 340), Image.Resampling.LANCZOS)
    # Subtle soft shadow under the logo mark for premium 3D depth
    logo_shadow = Image.new('RGBA', (og_w, og_h), (0, 0, 0, 0))
    d_sh = ImageDraw.Draw(logo_shadow)
    d_sh.ellipse([140, 475, 420, 520], fill=(130, 110, 150, 45))
    logo_shadow = logo_shadow.filter(ImageFilter.GaussianBlur(25))
    og_img.alpha_composite(logo_shadow)
    og_img.alpha_composite(logo_og, (110, 145))

    # Right side typography & badge
    d_og = ImageDraw.Draw(og_img)

    # Load Windows fonts
    font_serif_large = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 72)
    font_sans_tagline = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 30)
    font_sans_tagline_bold = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 30)
    font_badge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 13)
    font_pill = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 16)
    font_footer = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 15)

    # Draw Brand Tagline Badge
    badge_x, badge_y = 510, 145
    badge_text = "✦  A PERSONALIZED DIGITAL GIFTING PLATFORM"
    d_og.rounded_rectangle([badge_x, badge_y, badge_x + 360, badge_y + 32], radius=16, fill=(243, 232, 255, 230), outline=(216, 180, 254, 255), width=1)
    d_og.text((badge_x + 18, badge_y + 8), badge_text, fill=(124, 58, 237), font=font_badge)

    # Title: "Dear You"
    d_og.text((badge_x, 195), "Dear You", fill=(26, 22, 37), font=font_serif_large)

    # Taglines
    d_og.text((badge_x, 290), "One platform. Unlimited gifts.", fill=(55, 65, 81), font=font_sans_tagline_bold)
    d_og.text((badge_x, 335), "Every gift tells a different story.", fill=(109, 40, 217), font=font_sans_tagline)

    # Feature badges
    features = [
        ("♥ Interactive Keepsakes", (245, 243, 255), (196, 181, 253), (109, 40, 217)),
        ("🔒 Password Protected", (254, 242, 242), (254, 202, 202), (185, 28, 28)),
        ("✨ Emotional Journeys", (254, 243, 199), (253, 230, 138), (180, 83, 9)),
    ]
    fx = badge_x
    fy = 415
    for text, bg_col, border_col, txt_col in features:
        bbox = d_og.textbbox((0, 0), text, font=font_pill)
        pill_w = bbox[2] - bbox[0] + 28
        d_og.rounded_rectangle([fx, fy, fx + pill_w, fy + 36], radius=18, fill=bg_col, outline=border_col, width=1)
        d_og.text((fx + 14, fy + 8), text, fill=txt_col, font=font_pill)
        fx += pill_w + 14

    # Subtle bottom divider and footer
    d_og.line([badge_x, 495, og_w - 90, 495], fill=(229, 231, 235), width=1)
    d_og.text((badge_x, 520), "dearyou.me  ·  Create immersive, unforgettable digital memories", fill=(156, 163, 175), font=font_footer)

    # Save OG images
    og_img.convert('RGB').save(os.path.join(public_dir, 'og-image.png'), format='PNG', quality=95)
    og_img.convert('RGB').save(os.path.join(brand_dir, 'og-image.png'), format='PNG', quality=95)
    og_img.convert('RGB').save(os.path.join(app_dir, 'opengraph-image.png'), format='PNG', quality=95)
    og_img.convert('RGB').save(os.path.join(app_dir, 'twitter-image.png'), format='PNG', quality=95)
    print("Generated 1200x630 og-image.png, opengraph-image.png, and twitter-image.png")

    print("\n[SUCCESS] All brand assets successfully generated!")

if __name__ == '__main__':
    generate_assets()
