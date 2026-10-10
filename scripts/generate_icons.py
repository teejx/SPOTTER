"""
Generate high-fidelity app icon, splash screen, adaptive icons, and favicon for SPOTTER.
Also syncs directly into android/app/src/main/res/ mipmap and drawable densities.
Uses super-sampling (4x) and Lanczos anti-aliasing.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
RES_DIR = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

def create_badge_and_bolt(size, badge_scale=0.72):
    """
    Renders the SPOTTER emblem:
    A neon volt/emerald rounded squircle badge with an athletic lightning bolt cutout/center.
    """
    S = size * 4
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    badge_w = int(S * badge_scale)
    badge_h = int(S * badge_scale)
    bx0 = (S - badge_w) // 2
    by0 = (S - badge_h) // 2
    bx1 = bx0 + badge_w
    by1 = by0 + badge_h

    # Rounded rectangle radius: ~26% of badge size
    radius = int(badge_w * 0.26)

    # 1. Draw glowing neon gradient badge
    mask = Image.new("L", (S, S), 0)
    d_mask = ImageDraw.Draw(mask)
    d_mask.rounded_rectangle([bx0, by0, bx1, by1], radius=radius, fill=255)

    grad = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    for y in range(by0, by1):
        ratio = (y - by0) / float(badge_h)
        # Top: Electric Volt-Emerald rgb(0, 245, 155), Bottom: Deep Emerald rgb(0, 210, 128)
        r = int(0 * (1 - ratio) + 0 * ratio)
        g = int(245 * (1 - ratio) + 210 * ratio)
        b = int(155 * (1 - ratio) + 128 * ratio)
        line = Image.new("RGBA", (badge_w, 1), (r, g, b, 255))
        grad.paste(line, (bx0, y))

    grad.putalpha(mask)
    canvas.alpha_composite(grad)

    # 2. Draw Lightning Bolt Emblem inside the badge
    cx = S // 2
    cy = S // 2
    bolt_h = int(badge_h * 0.58)
    bolt_w = int(bolt_h * 0.56)

    bolt_pts = [
        (cx + int(bolt_w * 0.08), cy - int(bolt_h * 0.50)),  # 1: Top tip
        (cx - int(bolt_w * 0.48), cy + int(bolt_h * 0.04)),  # 2: Mid-left outer vertex
        (cx - int(bolt_w * 0.04), cy + int(bolt_h * 0.04)),  # 3: Center inner shelf
        (cx - int(bolt_w * 0.16), cy + int(bolt_h * 0.50)),  # 4: Bottom tip
        (cx + int(bolt_w * 0.48), cy - int(bolt_h * 0.04)),  # 5: Mid-right outer vertex
        (cx + int(bolt_w * 0.04), cy - int(bolt_h * 0.04)),  # 6: Center inner shelf
    ]

    draw.polygon(bolt_pts, fill=(9, 10, 15, 255))
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def generate_main_icon(size=1024):
    """Master App Icon (1024x1024)"""
    bg = Image.new("RGBA", (size, size), (9, 10, 15, 255))
    draw = ImageDraw.Draw(bg)

    cx, cy = size // 2, size // 2
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_radius = int(size * 0.42)
    glow_draw.ellipse(
        [cx - glow_radius, cy - glow_radius, cx + glow_radius, cy + glow_radius],
        fill=(0, 229, 153, 35)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=60))
    bg.alpha_composite(glow_img)

    emblem = create_badge_and_bolt(size, badge_scale=0.70)

    shadow_mask = emblem.split()[-1].filter(ImageFilter.GaussianBlur(radius=20))
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow.putalpha(shadow_mask.point(lambda p: int(p * 0.6)))
    bg.paste(shadow, (0, 12), shadow)

    bg.alpha_composite(emblem)
    return bg


def generate_round_icon(size=1024):
    """Circular icon for Android ic_launcher_round"""
    icon = generate_main_icon(size)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)
    icon.putalpha(mask)
    return icon


def generate_adaptive_foreground(size=1024):
    """Android Adaptive Icon Foreground: badge scale = 0.56, safely in 66% circle."""
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    emblem = create_badge_and_bolt(size, badge_scale=0.56)

    shadow_mask = emblem.split()[-1].filter(ImageFilter.GaussianBlur(radius=16))
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow.putalpha(shadow_mask.point(lambda p: int(p * 0.45)))
    fg.paste(shadow, (0, 10), shadow)

    fg.alpha_composite(emblem)
    return fg


def generate_adaptive_background(size=1024):
    """Android Adaptive Icon Background: obsidian background."""
    bg = Image.new("RGBA", (size, size), (9, 10, 15, 255))
    draw = ImageDraw.Draw(bg)
    cx, cy = size // 2, size // 2
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_radius = int(size * 0.45)
    glow_draw.ellipse(
        [cx - glow_radius, cy - glow_radius, cx + glow_radius, cy + glow_radius],
        fill=(0, 229, 153, 16)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=80))
    bg.alpha_composite(glow_img)
    return bg


def generate_adaptive_monochrome(size=1024):
    """Android 13+ Material You Monochrome: pure white silhouette with cutout."""
    S = size * 4
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    badge_w = int(S * 0.56)
    badge_h = int(S * 0.56)
    bx0 = (S - badge_w) // 2
    by0 = (S - badge_h) // 2
    bx1 = bx0 + badge_w
    by1 = by0 + badge_h
    radius = int(badge_w * 0.26)

    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=radius, fill=(255, 255, 255, 255))

    cx = S // 2
    cy = S // 2
    bolt_h = int(badge_h * 0.58)
    bolt_w = int(bolt_h * 0.56)

    bolt_pts = [
        (cx + int(bolt_w * 0.08), cy - int(bolt_h * 0.50)),
        (cx - int(bolt_w * 0.48), cy + int(bolt_h * 0.04)),
        (cx - int(bolt_w * 0.04), cy + int(bolt_h * 0.04)),
        (cx - int(bolt_w * 0.16), cy + int(bolt_h * 0.50)),
        (cx + int(bolt_w * 0.48), cy - int(bolt_h * 0.04)),
        (cx + int(bolt_w * 0.04), cy - int(bolt_h * 0.04)),
    ]

    cutout = Image.new("L", (S, S), 255)
    d_cut = ImageDraw.Draw(cutout)
    d_cut.polygon(bolt_pts, fill=0)

    r, g, b, a = canvas.split()
    new_a = ImageChops.multiply(a, cutout)
    canvas.putalpha(new_a)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def generate_splash_icon(size=512):
    """Splash Screen Icon: clean centered badge on transparent canvas."""
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    emblem = create_badge_and_bolt(size, badge_scale=0.74)
    fg.alpha_composite(emblem)
    return fg


def generate_favicon(size=48):
    """Browser favicon 48x48."""
    icon = generate_main_icon(size=256)
    return icon.resize((size, size), Image.Resampling.LANCZOS)


def sync_android_res(icon_master, round_master, fg_master, bg_master, mono_master, splash_master):
    """Syncs icons into android/app/src/main/res/ for all density buckets."""
    if not os.path.exists(RES_DIR):
        print("android res dir not found, skipping native res sync.")
        return

    densities = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432),
    }

    splash_densities = {
        'drawable-mdpi': 100,
        'drawable-hdpi': 150,
        'drawable-xhdpi': 200,
        'drawable-xxhdpi': 300,
        'drawable-xxxhdpi': 400,
    }

    print("Syncing Android native resources...")
    for folder, (launcher_sz, layer_sz) in densities.items():
        dir_path = os.path.join(RES_DIR, folder)
        os.makedirs(dir_path, exist_ok=True)

        # ic_launcher.webp
        ic = icon_master.resize((launcher_sz, launcher_sz), Image.Resampling.LANCZOS)
        ic.save(os.path.join(dir_path, 'ic_launcher.webp'), 'WEBP')

        # ic_launcher_round.webp
        ic_round = round_master.resize((launcher_sz, launcher_sz), Image.Resampling.LANCZOS)
        ic_round.save(os.path.join(dir_path, 'ic_launcher_round.webp'), 'WEBP')

        # ic_launcher_foreground.webp
        fg = fg_master.resize((layer_sz, layer_sz), Image.Resampling.LANCZOS)
        fg.save(os.path.join(dir_path, 'ic_launcher_foreground.webp'), 'WEBP')

        # ic_launcher_background.webp
        bg = bg_master.resize((layer_sz, layer_sz), Image.Resampling.LANCZOS)
        bg.save(os.path.join(dir_path, 'ic_launcher_background.webp'), 'WEBP')

        # ic_launcher_monochrome.webp
        mono = mono_master.resize((layer_sz, layer_sz), Image.Resampling.LANCZOS)
        mono.save(os.path.join(dir_path, 'ic_launcher_monochrome.webp'), 'WEBP')

    for folder, splash_sz in splash_densities.items():
        dir_path = os.path.join(RES_DIR, folder)
        os.makedirs(dir_path, exist_ok=True)
        sp = splash_master.resize((splash_sz, splash_sz), Image.Resampling.LANCZOS)
        sp.save(os.path.join(dir_path, 'splashscreen_logo.png'), 'PNG')

    print("Android native resources updated successfully!")


def main():
    print("Generating SPOTTER brand assets...")
    os.makedirs(OUT_DIR, exist_ok=True)

    icon = generate_main_icon(1024)
    icon_path = os.path.join(OUT_DIR, "icon.png")
    icon.save(icon_path, "PNG")
    print(f"Saved {icon_path}")

    round_icon = generate_round_icon(1024)

    fg = generate_adaptive_foreground(1024)
    fg_path = os.path.join(OUT_DIR, "android-icon-foreground.png")
    fg.save(fg_path, "PNG")
    print(f"Saved {fg_path}")

    bg = generate_adaptive_background(1024)
    bg_path = os.path.join(OUT_DIR, "android-icon-background.png")
    bg.save(bg_path, "PNG")
    print(f"Saved {bg_path}")

    mono = generate_adaptive_monochrome(1024)
    mono_path = os.path.join(OUT_DIR, "android-icon-monochrome.png")
    mono.save(mono_path, "PNG")
    print(f"Saved {mono_path}")

    splash = generate_splash_icon(512)
    splash_path = os.path.join(OUT_DIR, "splash-icon.png")
    splash.save(splash_path, "PNG")
    print(f"Saved {splash_path}")

    favicon = generate_favicon(48)
    favicon_path = os.path.join(OUT_DIR, "favicon.png")
    favicon.save(favicon_path, "PNG")
    print(f"Saved {favicon_path}")

    # Also sync into native android res
    sync_android_res(icon, round_icon, fg, bg, mono, splash)

    print("All SPOTTER assets successfully rendered!")

if __name__ == "__main__":
    main()
