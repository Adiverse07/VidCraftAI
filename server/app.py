import os
import uuid
import json
import logging
from datetime import datetime
from pathlib import Path
from moviepy import VideoFileClip, concatenate_videoclips
import shutil

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# ─── Setup ─────────────────────────────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/*": {"origins": "*"}})

# MCP server URL
MCP_URL = os.getenv("MCP_URL", "http://localhost:8000/mcp")

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream"
}

# Video storage
VIDEO_DIR = Path(__file__).parent / "videos"
VIDEO_DIR.mkdir(exist_ok=True)

def call_mcp(tool_name, arguments, timeout=300):
    rpc = {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments}
    }
    logger.debug("MCP call %s args=%s", tool_name, arguments)
    resp = requests.post(MCP_URL, json=rpc, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    
    if resp.headers.get("Content-Type","").startswith("text/event-stream"):
        payload = resp.text.split("data: ",1)[1].split("\n",1)[0]
        data = json.loads(payload)
    else:
        data = resp.json()
    
    for item in data.get("result",{}).get("content",[]):
        if item.get("type")=="text":
            try:
                return json.loads(item["text"])
            except:
                return {"text": item["text"]}
    return {}

# Local video processing functions
def trim_video_file(input_path, output_path, start_time, end_time):
    """Trim video file and return the output path"""
    try:
        with VideoFileClip(str(input_path)) as clip:
            if end_time is None or end_time <= 0 or end_time > clip.duration:
                end_time = clip.duration
            
            # Ensure start_time is valid
            if start_time < 0:
                start_time = 0
            if start_time >= end_time:
                raise ValueError("Start time must be less than end time")
                
            # Use subclipped instead of subclip (correct method name)
            trimmed = clip.subclipped(start_time, end_time)
            
            # Write with proper settings
            trimmed.write_videofile(
                str(output_path),
                codec='libx264',
                audio_codec='aac',
                logger=None,
                temp_audiofile='temp-audio.m4a',
                remove_temp=True
            )
            trimmed.close()
        return output_path
    except Exception as e:
        logger.error(f"Error trimming video: {e}")
        raise

def merge_video_files(input_paths, output_path):
    """Merge multiple video files into one"""
    try:
        clips = []
        for path in input_paths:
            if not Path(path).exists():
                raise FileNotFoundError(f"Video file not found: {path}")
            clips.append(VideoFileClip(str(path)))
        
        if not clips:
            raise ValueError("No valid video clips to merge")
            
        final_clip = concatenate_videoclips(clips)
        
        # Write with proper settings - removed verbose parameter
        final_clip.write_videofile(
            str(output_path),
            codec='libx264',
            audio_codec='aac',
            logger=None,
            temp_audiofile='temp-audio.m4a',
            remove_temp=True
        )
        
        # Clean up clips
        final_clip.close()
        for clip in clips:
            clip.close()
            
        return output_path
    except Exception as e:
        logger.error(f"Error merging videos: {e}")
        raise

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def hello():
    return "Hello world"

@app.route('/generate', methods=['POST'])
def generate():
    """Enhanced endpoint that uses intelligent tool selection"""
    body = request.get_json(force=True)
    prompt = body.get("prompt","").strip()
    if not prompt:
        return jsonify({"error":"prompt is empty"}), 400

    try:
        # Use the new intelligent process_request tool
        result = call_mcp("process_request", {"prompt": prompt})
        
        if "error" in result:
            logger.error("MCP processing failed: %s", result["error"])
            return jsonify({"error": result["error"]}), 500
        
        # Enhanced response with tool selection information AND UI actions
        response = {
            "code": result.get("code"),
            "video_url": result.get("video_url"),
            "tools_used": result.get("tools_used", []),
            "reasoning": result.get("reasoning", []),
            "tool_selection_log": result.get("tool_selection_log", []),
            "ui_actions": result.get("ui_actions", [])  # ← This was the missing piece!
        }
        
        logger.debug("Flask response with UI actions: %s", {
            **response, 
            "ui_actions_count": len(response["ui_actions"])
        })
        
        return jsonify(response)
        
    except Exception as e:
        logger.error("Generation failed: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/generate/legacy', methods=['POST'])
def generate_legacy():
    """Legacy endpoint using direct tool calls (for backward compatibility)"""
    body = request.get_json(force=True)
    prompt = body.get("prompt","").strip()
    if not prompt:
        return jsonify({"error":"prompt is empty"}), 400

    try:
        code_resp = call_mcp("generate_manim_code", {"prompt": prompt})
        code = code_resp["code"]
    except Exception as e:
        logger.error("Code gen failed: %s", e)
        return jsonify({"error": str(e)}), 500

    try:
        vid_resp = call_mcp("render_video", {"code": code})
        return jsonify({"code": code, "video_url": vid_resp["video_url"]})
    except Exception as e:
        logger.error("Render failed: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/capabilities', methods=['GET'])
def get_capabilities():
    """Get MCP server capabilities and tool information"""
    try:
        result = call_mcp("list_capabilities", {})
        return jsonify(result)
    except Exception as e:
        logger.error("Failed to get capabilities: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/videos', methods=['GET', 'DELETE'])
def list_or_delete_all():
    if request.method == 'GET':
        items = []
        for mp4 in VIDEO_DIR.glob("*.mp4"):
            stat = mp4.stat()
            items.append({
                "id":         mp4.stem,
                "name":       mp4.stem,
                "url":        f"/videos/{mp4.name}",
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "duration":   None
            })
        return jsonify(items)

    # Delete all videos
    for mp4 in VIDEO_DIR.glob("*.mp4"):
        try:
            mp4.unlink()
        except Exception as e:
            logger.error(f"Error deleting {mp4}: {e}")
    return "", 204

@app.route('/videos/<path:filename>', methods=['GET','DELETE'])
def serve_or_delete_video(filename):
    full = VIDEO_DIR / filename
    if request.method == 'DELETE':
        if full.exists():
            try:
                full.unlink()
                return "", 204
            except Exception as e:
                logger.error(f"Error deleting {filename}: {e}")
                return jsonify({"error": "Failed to delete video"}), 500
        return "", 404

    if not full.exists():
        return "", 404

    # Fix for HTTP 416 errors - disable range requests for video serving
    response = send_from_directory(
        VIDEO_DIR,
        filename,
        conditional=False,  # Disable conditional requests
        as_attachment=False
    )
    
    # Add headers to prevent caching and range request issues
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Accept-Ranges'] = 'none'  # Disable range requests
    
    return response

@app.route('/videos/<video_id>/trim', methods=['POST'])
def trim_video(video_id):
    try:
        body = request.get_json(force=True)
        start = float(body.get("startTime", 0))
        end = body.get("endTime", None)
        if end is not None:
            end = float(end)
        
        input_path = VIDEO_DIR / f"{video_id}.mp4"
        if not input_path.exists():
            return jsonify({"error": "Video not found"}), 404
        
        # Create a temporary file for the trimmed video
        temp_id = str(uuid.uuid4())
        temp_path = VIDEO_DIR / f"temp_{temp_id}.mp4"
        
        try:
            # Trim the video to the temporary file
            trim_video_file(input_path, temp_path, start, end)
            
            # Replace the original file with the trimmed version
            if temp_path.exists():
                # Remove the original file
                input_path.unlink()
                # Move the trimmed file to replace the original
                shutil.move(str(temp_path), str(input_path))
            
            return jsonify({
                "video_url": f"/videos/{video_id}.mp4",
                "message": "Video trimmed successfully"
            })
            
        except Exception as e:
            # Clean up temp file if it exists
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except:
                    pass
            raise e
            
    except ValueError as e:
        logger.error("Trim validation error: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("Trim failed: %s", e)
        return jsonify({"error": f"Failed to trim video: {str(e)}"}), 500

@app.route('/videos/merge', methods=['POST'])
def merge_videos():
    try:
        body = request.get_json(force=True)
        ids = body.get("videoIds", [])
        
        if len(ids) < 2:
            return jsonify({"error": "At least 2 videos required for merging"}), 400
        
        input_paths = []
        for video_id in ids:
            path = VIDEO_DIR / f"{video_id}.mp4"
            if not path.exists():
                return jsonify({"error": f"Video {video_id} not found"}), 404
            input_paths.append(path)
        
        output_id = str(uuid.uuid4())
        output_path = VIDEO_DIR / f"{output_id}.mp4"
        
        merge_video_files(input_paths, output_path)
        
        return jsonify({
            "video_url": f"/videos/{output_id}.mp4",
            "merged_id": output_id,
            "message": "Videos merged successfully"
        })
        
    except Exception as e:
        logger.error("Merge failed: %s", e)
        return jsonify({"error": f"Failed to merge videos: {str(e)}"}), 500

# ─── Startup ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)