# server/tools/render_tool.py

import os
import uuid
import subprocess
import tempfile
import logging
from pathlib import Path
from utils.storage import save_video_path

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RenderTool:
    def run(self, code: str, **_kwargs) -> dict:
        # 1) Write your scene to a temp file
        tmpdir     = Path(tempfile.gettempdir())
        scene_id   = uuid.uuid4().hex
        scene_file = tmpdir / f"scene_{scene_id}.py"
        logger.debug("→ Writing generated code to %s", scene_file)
        scene_file.write_text(code, encoding="utf-8")

        # 2) Run Manim from inside that temp dir
        cmd = [
            "manim",
            scene_file.name,
            "MyScene",
            "-ql",
            "--format", "mp4",
        ]
        logger.info("→ Running Manim: %s", " ".join(cmd))
        try:
            subprocess.run(
                cmd,
                cwd=tmpdir,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
        except subprocess.CalledProcessError as e:
            err = e.stderr.decode(errors="ignore")
            logger.error("Manim render failed:\n%s", err)
            raise RuntimeError(f"Manim render failed:\n{err}")

        # 3) Locate the newly created MP4
        scene_stem = scene_file.stem
        candidates = list(tmpdir.rglob(f"{scene_stem}*.mp4"))
        if not candidates:
            candidates = [p for p in tmpdir.rglob("*.mp4") if scene_stem in str(p)]
        if not candidates:
            raise FileNotFoundError(f"No MP4 found for {scene_stem} under {tmpdir}")

        # 4) Pick the newest
        latest = max(candidates, key=lambda p: p.stat().st_mtime)
        logger.debug("→ Selected MP4: %s", latest)

        # 5) Move it into server/videos/
        final = save_video_path(str(latest))
        logger.debug("→ Copied to videos/: %s", final)

        # 6) Cleanup only the scene file
        try:
            scene_file.unlink()
        except OSError:
            pass

        return {"video_url": f"/videos/{Path(final).name}"}
