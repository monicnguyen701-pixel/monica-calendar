"""
Crop the tray icon to remove excessive transparent padding and generate sharp multi-size icon formats.
Uses high-quality LANCZOS resizing and channel-separated sharpening to prevent transparency halo artifacts.
Outputs: icon.png (256x256) and icon.ico (multi-size).
"""
import os
import shutil
from PIL import Image, ImageFilter, ImageEnhance

def generate_icons():
    source_path = 'img/calendar.icon.png'
    print(f"Loading source image: {source_path}")
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found!")
        return
        
    # Backup existing icons if they exist
    if os.path.exists('icon.png'):
        shutil.copy('icon.png', 'icon_backup.png')
    if os.path.exists('icon.ico'):
        shutil.copy('icon.ico', 'icon_backup.ico')
        
    img = Image.open(source_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    # Crop to non-transparent bounding box
    bbox = img.getbbox()
    print(f"Original bounding box: {bbox}")
    cropped = img.crop(bbox)
    aw, ah = cropped.size
    print(f"Cropped size: {aw}x{ah}")
    
    # Target fill ratio: we want the artwork to fill 100% of the canvas (maximum visual size)
    target_fill = 1.0
    canvas_size = int(max(aw, ah) / target_fill)
    # Align to a multiple of 4
    canvas_size = ((canvas_size + 3) // 4) * 4
    print(f"New base canvas size: {canvas_size}x{canvas_size}")
    
    # Create the centered base image
    base_img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - aw) // 2
    offset_y = (canvas_size - ah) // 2
    base_img.paste(cropped, (offset_x, offset_y))
    
    # Helper to resize and sharpen
    def create_icon_for_size(src, size, sharpen=True):
        # Resize using LANCZOS
        resized = src.resize((size, size), Image.Resampling.LANCZOS)
        
        if sharpen and size <= 48:
            # Split channels to avoid alpha halo artifacts
            r, g, b, a = resized.split()
            rgb = Image.merge('RGB', (r, g, b))
            
            if size <= 16:
                # 16x16 needs extra contrast and punchy sharpening
                rgb_sharpened = rgb.filter(ImageFilter.UnsharpMask(radius=0.4, percent=200, threshold=0))
                rgb_sharpened = ImageEnhance.Contrast(rgb_sharpened).enhance(1.25)
                rgb_sharpened = ImageEnhance.Color(rgb_sharpened).enhance(1.15)
            elif size <= 24:
                rgb_sharpened = rgb.filter(ImageFilter.UnsharpMask(radius=0.5, percent=160, threshold=0))
                rgb_sharpened = ImageEnhance.Contrast(rgb_sharpened).enhance(1.18)
                rgb_sharpened = ImageEnhance.Color(rgb_sharpened).enhance(1.1)
            elif size <= 32:
                rgb_sharpened = rgb.filter(ImageFilter.UnsharpMask(radius=0.6, percent=130, threshold=0))
                rgb_sharpened = ImageEnhance.Contrast(rgb_sharpened).enhance(1.12)
            else:  # 40, 48
                rgb_sharpened = rgb.filter(ImageFilter.UnsharpMask(radius=0.7, percent=100, threshold=0))
                rgb_sharpened = ImageEnhance.Contrast(rgb_sharpened).enhance(1.05)
                
            # Re-merge with the original smooth alpha channel
            resized = Image.merge('RGBA', (*rgb_sharpened.split(), a))
            
        return resized

    # 1. Save main icon.png (256x256)
    icon_png = create_icon_for_size(base_img, 256, sharpen=False)
    icon_png.save('icon.png')
    print("Saved icon.png (256x256)")
    
    # 2. Save multi-size icon.ico for Windows
    # Sort sizes in descending order so the largest size (256x256) is the first frame.
    # This prevents Windows from scaling up a tiny 16x16 frame as a fallback.
    sizes = [256, 128, 64, 48, 40, 32, 24, 20, 16]
    ico_images = []
    for s in sizes:
        ico_img = create_icon_for_size(base_img, s, sharpen=(s <= 48))
        ico_images.append(ico_img)
        print(f"Generated {s}x{s} frame for ICO")
        
    # Save standard ICO
    ico_images[0].save('icon.ico', format='ICO', sizes=[(s, s) for s in sizes], append_images=ico_images[1:])
    print("Saved icon.ico with all sizes")
    
    # Save v3 versions to bypass Windows icon cache
    icon_png.save('icon_v3.png')
    ico_images[0].save('icon_v3.ico', format='ICO', sizes=[(s, s) for s in sizes], append_images=ico_images[1:])
    print("Saved icon_v3.png and icon_v3.ico")
    print("Done! Backups saved as icon_backup.png and icon_backup.ico")

if __name__ == '__main__':
    generate_icons()
