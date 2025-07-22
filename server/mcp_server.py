# mcp_server.py

import json
import logging
import os
import requests
from typing import Dict, List, Any
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
from tools.manim_tool import ManimTool
from tools.render_tool import RenderTool

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Tool registry with metadata
TOOL_REGISTRY = {
    "generate_manim_code": {
        "instance": ManimTool(),
        "description": "Generates Python code using Manim library for creating mathematical animations, geometric shapes, text animations, and educational visualizations. Use this when user wants to create animations, mathematical content, or visual demonstrations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Description of the animation to create"
                }
            },
            "required": ["prompt"]
        },
        "keywords": ["animation", "manim", "mathematical", "geometric", "visual", "educational", "shapes", "text", "movement", "graphics"]
    },
    "render_video": {
        "instance": RenderTool(),
        "description": "Renders Manim Python code into an MP4 video file. Use this after generating manim code or when user has existing manim code that needs to be converted to video.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Python code containing Manim scene definition"
                }
            },
            "required": ["code"]
        },
        "keywords": ["render", "video", "mp4", "compile", "execute", "manim", "code", "output"]
    },
    "open_burger_menu": {
        "instance": None,  # UI control tool
        "description": "Opens the burger menu/sidebar to show video library and management options. Use when user wants to see their generated videos, video history, manage videos, or access video library.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Reason why the burger menu should be opened"
                }
            },
            "required": ["reason"]
        },
        "keywords": ["videos", "history", "library", "manage", "burger", "menu", "sidebar", "generated", "see", "view", "show", "list"]
    },
    "open_video_editor": {
        "instance": None,  # UI control tool
        "description": "Opens the video editor interface for trimming, merging, and editing videos. Use when user wants to edit, trim, merge, or modify existing videos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Reason why the video editor should be opened"
                },
                "suggested_videos": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of video IDs to pre-select for editing",
                    "default": []
                }
            },
            "required": ["reason"]
        },
        "keywords": ["edit", "trim", "merge", "cut", "combine", "modify", "editor", "video editor", "editing"]
    }
}

class LLMToolSelector:
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        if not self.github_token:
            logger.error("No GITHUB_TOKEN found for LLM tool selection!")
    
    def select_tools(self, user_prompt: str) -> List[Dict[str, Any]]:
        """Use LLM to analyze prompt and select appropriate tools"""
        if not self.github_token:
            # Fallback to simple keyword matching
            return self._fallback_selection(user_prompt)
        
        # Create tool descriptions for the LLM
        tool_descriptions = []
        for tool_name, tool_info in TOOL_REGISTRY.items():
            tool_descriptions.append(f"- {tool_name}: {tool_info['description']}")
        
        system_prompt = f"""You are a tool selection expert for VidCraftAI. 
Analyze the user's request and determine which tools should be used and in what order.

Available tools:
{chr(10).join(tool_descriptions)}

Rules:
1. If user wants to create animations/videos from scratch, use: generate_manim_code -> render_video
2. If user provides existing manim code to render, use: render_video only
3. If user EXPLICITLY asks to see their videos, video history, or manage videos, use: open_burger_menu
4. If user EXPLICITLY asks to edit, trim, merge, or modify videos, use: open_video_editor
5. If user asks about capabilities or general questions, explain what tools can do
6. ONLY execute UI tools when EXPLICITLY requested - do NOT anticipate future needs
7. Do NOT add UI actions unless the user specifically asks for them

IMPORTANT: For parameters that depend on previous steps, use these exact placeholders:
- For code parameter that comes from generate_manim_code: use "{{GENERATED_CODE}}"
- Do NOT use "from_previous_step" or similar text

UI Control Guidelines (ONLY when explicitly requested):
- Use "open_burger_menu" for: "show my videos", "video history", "manage videos", "video library", "open sidebar", "burger menu"
- Use "open_video_editor" for: "edit videos", "trim video", "merge videos", "video editor", "cut videos"

BE CONSERVATIVE: Only execute what the user actually asks for. Do not add extra steps or anticipate future actions.

Respond with a JSON array of tool execution plans. Each plan should have:
- "tool": tool name
- "reasoning": why this tool was selected
- "parameters": what parameters to extract from user prompt (use {{GENERATED_CODE}} for dependent parameters)

Example responses:
For "create a neural network animation":
[
  {{"tool": "generate_manim_code", "reasoning": "User wants to create an animation", "parameters": {{"prompt": "create a neural network animation"}}}},
  {{"tool": "render_video", "reasoning": "Generated code needs to be rendered to video", "parameters": {{"code": "{{GENERATED_CODE}}"}}}}
]

For "show me my videos":
[
  {{"tool": "open_burger_menu", "reasoning": "User explicitly requested to see their video library", "parameters": {{"reason": "User requested to view their videos"}}}}
]"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User request: {user_prompt}"}
        ]

        try:
            response = self._call_llm(messages)
            # Parse the JSON response
            tool_plan = json.loads(response)
            logger.info(f"LLM selected tools: {[t['tool'] for t in tool_plan]}")
            return tool_plan
        except Exception as e:
            logger.error(f"LLM tool selection failed: {e}")
            return self._fallback_selection(user_prompt)
    
    def _call_llm(self, messages: List[Dict]) -> str:
        """Call GitHub Models API for tool selection"""
        url = "https://models.github.ai/inference/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 800,
        }
        
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    
    def _fallback_selection(self, user_prompt: str) -> List[Dict[str, Any]]:
        """Fallback tool selection using keyword matching"""
        prompt_lower = user_prompt.lower()
        
        # Check for UI control requests first
        video_management_keywords = ["see my videos", "video history", "manage videos", "burger menu", "sidebar", "video library", "show videos", "list videos", "my generations"]
        video_editing_keywords = ["edit video", "trim video", "merge video", "video editor", "cut video", "combine videos"]
        
        if any(keyword in prompt_lower for keyword in video_management_keywords):
            return [{
                "tool": "open_burger_menu",
                "reasoning": "User wants to access video management interface",
                "parameters": {"reason": "User requested to see video library/history"}
            }]
        
        if any(keyword in prompt_lower for keyword in video_editing_keywords):
            return [{
                "tool": "open_video_editor", 
                "reasoning": "User wants to edit videos",
                "parameters": {"reason": "User requested video editing functionality"}
            }]
        
        # Check if user provided code directly
        if "class MyScene" in user_prompt or "def construct" in user_prompt:
            return [{
                "tool": "render_video",
                "reasoning": "User provided existing Manim code",
                "parameters": {"code": user_prompt}
            }]
        
        # Check for rendering-only requests
        render_keywords = ["render", "compile", "execute", "video", "mp4"]
        if any(word in prompt_lower for word in render_keywords) and "generate" not in prompt_lower and "create" not in prompt_lower:
            return [{
                "tool": "render_video", 
                "reasoning": "User wants to render existing code",
                "parameters": {"code": "{{NEEDS_CODE_INPUT}}"}
            }]
        
        # Default: generate then render
        return [
            {
                "tool": "generate_manim_code",
                "reasoning": "User wants to create new animation",
                "parameters": {"prompt": user_prompt}
            },
            {
                "tool": "render_video",
                "reasoning": "Generated code needs to be rendered",
                "parameters": {"code": "{{GENERATED_CODE}}"}
            }
        ]

# Initialize components
mcp = FastMCP(
    name="VidCraftAI",
    host="0.0.0.0", 
    port=8000,
    stateless_http=True,
)

tool_selector = LLMToolSelector()

@mcp.tool("process_request")
def process_user_request(prompt: str) -> dict:
    """
    Intelligently processes user requests by selecting and executing appropriate tools.
    This is the main entry point that uses LLM reasoning to choose the right tools.
    """
    try:
        # Step 1: Use LLM to select tools
        tool_plan = tool_selector.select_tools(prompt)
        
        if not tool_plan:
            return {"error": "Could not determine appropriate tools for this request"}
        
        results = {}
        execution_log = []
        step_results = {}  # Store results from each step
        ui_actions = []  # Store UI actions to perform
        
        # Step 2: Execute tools in sequence
        for step_idx, step in enumerate(tool_plan):
            tool_name = step["tool"]
            reasoning = step["reasoning"]
            parameters = step.get("parameters", {})
            
            logger.info(f"Step {step_idx + 1}: Executing {tool_name} - {reasoning}")
            execution_log.append(f"Step {step_idx + 1}: {reasoning}")
            
            if tool_name not in TOOL_REGISTRY:
                error_msg = f"Unknown tool: {tool_name}"
                logger.error(error_msg)
                return {"error": error_msg}
            
            # Handle UI control tools
            if tool_name in ["open_burger_menu", "open_video_editor"]:
                ui_action = {
                    "type": tool_name,
                    "parameters": parameters,
                    "reasoning": reasoning
                }
                ui_actions.append(ui_action)
                logger.info(f"Registered UI action: {tool_name}")
                continue
            
            # Handle parameter dependencies between tools
            processed_parameters = {}
            for param_key, param_value in parameters.items():
                if isinstance(param_value, str):
                    # Replace placeholders with actual values from previous steps
                    if param_value == "{GENERATED_CODE}" and "code" in step_results:
                        processed_parameters[param_key] = step_results["code"]
                    elif param_value == "{{GENERATED_CODE}}" and "code" in step_results:
                        processed_parameters[param_key] = step_results["code"]
                    elif param_value == "{{NEEDS_CODE_INPUT}}":
                        return {"error": "Code parameter needed but no code was provided or generated"}
                    else:
                        processed_parameters[param_key] = param_value
                else:
                    processed_parameters[param_key] = param_value
            
            # Validate required parameters
            if tool_name == "render_video" and ("code" not in processed_parameters or not processed_parameters["code"]):
                return {"error": "Render tool requires code parameter but none was provided"}
            
            # Execute the tool
            tool_instance = TOOL_REGISTRY[tool_name]["instance"]
            try:
                if tool_name == "generate_manim_code":
                    if "prompt" not in processed_parameters:
                        return {"error": "generate_manim_code requires a prompt parameter"}
                    result = tool_instance.run(processed_parameters["prompt"])
                elif tool_name == "render_video":
                    if "code" not in processed_parameters:
                        return {"error": "render_video requires a code parameter"}
                    result = tool_instance.run(processed_parameters["code"])
                else:
                    result = tool_instance.run(**processed_parameters)
                
                # Store results for next steps and final output
                if result and isinstance(result, dict):
                    step_results.update(result)
                    results.update(result)
                
                if "error" in result:
                    logger.error(f"Tool {tool_name} failed: {result['error']}")
                    return result
                    
                logger.info(f"Step {step_idx + 1} completed successfully")
                    
            except Exception as e:
                error_msg = f"Tool execution failed for {tool_name}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                return {"error": error_msg}
        
        # Step 3: Return comprehensive results
        final_result = {
            **results,
            "tool_selection_log": execution_log,
            "tools_used": [step["tool"] for step in tool_plan],
            "reasoning": [step["reasoning"] for step in tool_plan],
            "ui_actions": ui_actions,  # New field for UI actions
            "status": "success"
        }
        
        logger.info("Request processing completed successfully")
        return final_result
        
    except Exception as e:
        logger.error(f"Request processing failed: {e}", exc_info=True)
        return {"error": f"Request processing failed: {str(e)}"}

# Keep the original tools for backward compatibility (optional)
@mcp.tool("generate_manim_code")
def _gen_code(prompt: str) -> dict:
    """Direct access to code generation tool (legacy)"""
    return TOOL_REGISTRY["generate_manim_code"]["instance"].run(prompt)

@mcp.tool("render_video")  
def _render_video(code: str) -> dict:
    """Direct access to video rendering tool (legacy)"""
    return TOOL_REGISTRY["render_video"]["instance"].run(code)

@mcp.tool("open_burger_menu")
def _open_burger_menu(reason: str) -> dict:
    """UI control tool to open the burger menu/sidebar"""
    return {
        "ui_action": "open_burger_menu",
        "reason": reason,
        "message": "Burger menu should be opened to show video library",
        "status": "ui_action_requested"
    }

@mcp.tool("open_video_editor")
def _open_video_editor(reason: str, suggested_videos: List[str] = None) -> dict:
    """UI control tool to open the video editor"""
    if suggested_videos is None:
        suggested_videos = []
    
    return {
        "ui_action": "open_video_editor", 
        "reason": reason,
        "suggested_videos": suggested_videos,
        "message": "Video editor should be opened for video editing",
        "status": "ui_action_requested"
    }

@mcp.tool("list_capabilities")
def list_capabilities() -> dict:
    """Lists all available tools and their capabilities"""
    capabilities = {}
    for tool_name, tool_info in TOOL_REGISTRY.items():
        capabilities[tool_name] = {
            "description": tool_info["description"],
            "keywords": tool_info["keywords"],
            "input_schema": tool_info["input_schema"]
        }
    
    return {
        "capabilities": capabilities,
        "primary_tool": "process_request",
        "description": "VidCraftAI can intelligently create and render mathematical animations using Manim, and provide UI control for video management",
        "workflow": "1. Analyze prompt → 2. Select tools → 3. Execute in sequence → 4. Return results with UI actions",
        "ui_features": ["Video Library Management", "Video Editor", "Intelligent Tool Selection"]
    }

if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        mount_path="/mcp",
    )