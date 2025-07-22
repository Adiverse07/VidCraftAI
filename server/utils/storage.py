# server/utils/storage.py

import os
import shutil
import uuid

# BASE_DIR is the root of your server folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# VIDEOS_DIR is a sibling “videos” folder next to utils/
VIDEOS_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir, "videos"))
os.makedirs(VIDEOS_DIR, exist_ok=True)

def save_video_path(src_path: str) -> str:
    """
    Move the rendered MP4 from src_path into VIDEOS_DIR under a unique name.
    Returns the final absolute path.
    """
    ext = os.path.splitext(src_path)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(VIDEOS_DIR, unique_name)
    shutil.move(src_path, dest_path)
    return dest_path
