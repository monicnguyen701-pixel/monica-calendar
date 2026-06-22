"""
Convert calendar.png.jpg to sharp icon.png and icon.ico.
Apply sharpening for small sizes to prevent blur in system tray.
"""
from PIL import Image, ImageEnhance, ImageFilter

# Open source image
src = Image.open('img/calendar.icon.png')
print(f"Source size: {src.size}, Mode: {src.mode}")

if src.mode != 'RGBA':
    src = src.convert('RGBA')

# Create 256x256 base icon
size = 256
icon_base = src.copy()
icon_base.thumbnail((size, size), Image.NEAREST)
w, h = icon_base.size

icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
offset_x = (size - w) // 2
offset_y = (size - h) // 2
icon.paste(icon_base, (offset_x, offset_y))

# Save icon.png (256x256, no sharpening needed for this size)
icon.save('icon.png')
print(f"Saved icon.png (256x256)")

# Generate multi-size ICO with sharpening for small sizes
def create_sharp_icon(base_img, target_size):
    """Resize and apply sharpening for small icon sizes."""
    resized = base_img.resize((target_size, target_size), Image.LANCZOS)
    
    if target_size <= 48:
        # Apply UnsharpMask: radius, percent, threshold
        # More aggressive sharpening for smaller sizes
        if target_size <= 16:
            resized = resized.filter(ImageFilter.UnsharpMask(radius=1.0, percent=200, threshold=0))
            enhancer = ImageEnhance.Contrast(resized)
            resized = enhancer.enhance(1.3)
        elif target_size <= 32:
            resized = resized.filter(ImageFilter.UnsharpMask(radius=1.0, percent=180, threshold=0))
            enhancer = ImageEnhance.Contrast(resized)
            resized = enhancer.enhance(1.2)
        else:  # 48
            resized = resized.filter(ImageFilter.UnsharpMask(radius=0.8, percent=150, threshold=0))
            enhancer = ImageEnhance.Contrast(resized)
            resized = enhancer.enhance(1.1)
    
    return resized

sizes = [
    16,
    20,
    24,
    32,
    40,
    48,
    64,
    128,
    256
]
ico_images = []
for s in sizes:
    sharp_icon = create_sharp_icon(icon, s)
    ico_images.append(sharp_icon)
    print(f"  Created {s}x{s} (sharpened)" if s <= 48 else f"  Created {s}x{s}")

ico_images[0].save('icon.ico', format='ICO',
                    sizes=[(s, s) for s in sizes],
                    append_images=ico_images[1:])
print(f"Saved icon.ico with sharpened small sizes")
print("Done!")
