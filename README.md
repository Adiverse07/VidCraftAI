# 🎬 VidCraftAI

<div align="center">

![VidCraftAI Banner](https://github.com/Adiverse07/VidCraftAI/blob/main/assets/image.png?raw=true)

*Transform your ideas into stunning mathematical animations with the power of AI* ✨

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![Manim](https://img.shields.io/badge/Manim-Community-FF6B9D?style=for-the-badge)](https://www.manim.community/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-9146FF?style=for-the-badge)](https://modelcontextprotocol.io/)

[🚀 Demo Video](#-demo-video) • [🛠️ Setup](#-setup) • [📚 Documentation](#-how-it-works) • [🤝 Contributing](#-contributing)

</div>

---

## 🤖 What is MCP (Model Context Protocol)?

Before diving into our project, let's understand the magical glue that makes everything work seamlessly! 

**MCP** is like having a universal translator between AI models and your tools. Think of it this way:

### 🔧 Traditional Approach (The Chaotic Way)
Imagine you're a chef trying to cook a complex meal, but all your kitchen tools speak different languages. Your oven speaks French 🇫🇷, your mixer speaks German 🇩🇪, and your food processor speaks Japanese 🇯🇵. You'd spend more time figuring out how to communicate than actually cooking!

### 🎯 With MCP (The Zen Way)
Now imagine having a brilliant sous chef who speaks ALL languages and knows exactly which tool to use for each task. You just say "I want to make a soufflé" and they orchestrate everything perfectly. That's MCP!

![MCP Comparison Diagram](https://github.com/Adiverse07/VidCraftAI/blob/main/assets/Screenshot%202025-07-22%20193457.png?raw=true)

**Key Benefits:**
- 🧠 **Smart Tool Selection**: LLM intelligently chooses the right tools for your request
- 🔄 **Seamless Integration**: No more hardcoded API connections everywhere
- 🎨 **Extensibility**: Add new tools without rewriting your entire application
- 🚀 **Scalability**: One protocol to rule them all

---

## 🎥 VidCraftAI: Where Math Meets Magic

Ever wanted to create those beautiful mathematical animations you see in educational videos but thought it required a PhD in both mathematics AND programming? Well, think again! 🎓

**VidCraftAI** is your personal animation studio that transforms plain English into stunning mathematical visualizations using the power of:
- 🤖 **AI-Powered Code Generation** 
- 🎬 **Manim Animation Library**
- 🔮 **MCP Tool Orchestration**
- ⚡ **Intelligent Workflow Management**

![VidCraftAI Interface](https://github.com/Adiverse07/VidCraftAI/blob/main/assets/Screenshot%202025-07-22%20193710.png?raw=true)

### 🌟 What Makes It Special?

1. **🗣️ Natural Language to Animation**: Just describe what you want - "Show me how a neural network learns" - and watch the magic happen!

2. **🎯 Smart Tool Selection**: Our AI doesn't just generate code; it understands context, selects appropriate tools, and executes complex workflows automatically.

3. **🎬 Professional Quality Output**: Powered by Manim, the same library used by 3Blue1Brown for those gorgeous mathematical animations.

4. **🛠️ Video Management**: Built-in tools for trimming, merging, and managing your video library (showcasing MCP's versatility).

---

## 🏗️ Architecture: The Brain Behind the Beauty

VidCraftAI is built with a modern, scalable architecture that showcases the true power of MCP:

```
🌐 Frontend (React) 
    ↕️ 
🔄 Flask API Server
    ↕️ 
🧠 MCP Server (The Orchestrator)
    ↕️
🛠️ Tool Ecosystem:
    ├── 📝 Manim Code Generator
    ├── 🎬 Video Renderer  
    ├── 🍔 UI Controller (Burger Menu)
    └── ✂️ Video Editor
```

### 🧩 Component Breakdown

#### 🎨 Frontend (React.js)
- **Clean, intuitive interface** for prompt input
- **Real-time feedback** on tool selection and execution
- **Integrated video player** with management controls
- **Responsive design** that works on all devices

#### ⚡ Backend (Flask)
- **RESTful API** endpoints for seamless communication
- **Video file management** with streaming support
- **Error handling** and logging for robust operation
- **CORS enabled** for cross-origin requests

#### 🧠 MCP Server (The Star of the Show!)
- **Intelligent prompt analysis** using LLM reasoning
- **Dynamic tool selection** based on user intent
- **Workflow orchestration** with dependency management
- **Error recovery** and graceful fallbacks

---

## 🛠️ Tools in Our Arsenal

Our MCP server comes equipped with a powerful toolkit:

### 🔧 Core Tools

| Tool | Description | When It's Used |
|------|-------------|----------------|
| **🎨 generate_manim_code** | AI-powered Manim code generation | When you want to create new animations |
| **🎬 render_video** | Converts Manim code to MP4 videos | After code generation or with existing code |
| **🍔 open_burger_menu** | UI control for video library access | When you ask to see your videos |
| **✂️ open_video_editor** | UI control for video editing interface | When you want to edit/merge videos |

### 🎯 Intelligent Workflow Examples

**User:** *"Create a visualization of the Fibonacci sequence"*
```
🔄 AI Analysis → 🎨 Generate Code → 🎬 Render Video → ✅ Success!
```

**User:** *"Show me my video library"*
```
🔄 AI Analysis → 🍔 Open Burger Menu → ✅ UI Action Triggered!
```

**User:** *"I want to trim my latest video"*
```
🔄 AI Analysis → ✂️ Open Video Editor → ✅ Editing Interface Ready!
```

---

## 📁 Project Structure

```
vidcraft-ai/
├── 📋 README.md                    # You are here!
├── 🔐 .env                         # Environment variables
├── 🚫 .gitignore                   # Ignored files
│
├── 💻 client/                      # React frontend
│   ├── 📦 package.json            # Dependencies & scripts
│   ├── 🌐 public/
│   │   └── 📄 index.html          # Main HTML shell
│   └── 📁 src/
│       ├── ⚛️ App.jsx             # Chat interface component
│       ├── 📄 index.js            # React DOM bootstrap
│       ├── 🔧 api.js              # HTTP client (axios)
│       └── 🎨 styles/             # CSS files
│
├── 🖥️ server/                     # Flask + MCP server
│   ├── 📋 requirements.txt        # Python dependencies
│   ├── 🔧 app.py                 # Flask app (API routes)
│   ├── 🧠 mcp_server.py          # MCP server & tool registry
│   ├── 🛠️ tools/                 # Custom MCP tools
│   │   ├── 🎨 manim_tool.py      # Manim code generator
│   │   └── 🎬 render_tool.py     # Video renderer
│   └── 🗂️ utils/                 # Helper modules
│       └── 💾 storage.py         # Video storage & retrieval
│
├── 🎥 videos/                     # Generated video files
├── 🧹 scripts/                   # Utility scripts
│   ├── 🗑️ clean_videos.py       # Cleanup old videos
│   └── 🚀 deploy.sh              # Deployment helper
```

---

## 🚀 Setup & Installation

### 📋 Prerequisites

Before you embark on this magical journey, make sure you have:
- 🐍 Python 3.9+ (The snake that powers our backend)
- 📦 Node.js 16+ (The JavaScript runtime)
- 🎨 Manim Community Edition (The animation powerhouse)
- 🔑 GitHub Token (For LLM-powered tool selection)

### 🛠️ Installation Steps

1. **Clone this masterpiece** 📥
   ```bash
   git clone https://github.com/Adiverse07/VidCraftAI.git
   cd VidCraftAI
   ```

2. **Set up the backend magic** 🐍
   ```bash
   cd server
   pip install -r requirements.txt
   ```

3. **Configure your environment** 🔧
   ```bash
   # Create .env file in the root directory
   echo "GITHUB_TOKEN=your_github_token_here" > .env
   echo "MCP_URL=http://localhost:8000/mcp" >> .env
   ```

4. **Install Manim** 🎨
   ```bash
   pip install manim
   ```

5. **Set up the frontend** ⚛️
   ```bash
   cd ../client
   npm install
   ```

6. **Launch the experience** 🚀
   ```bash
   # Terminal 1: Start MCP Server
   cd server
   python mcp_server.py
   
   # Terminal 2: Start Flask API
   python app.py
   
   # Terminal 3: Start React Frontend  
   cd client
   npm start
   ```

7. **Open your browser** 🌐
   Navigate to `http://localhost:3000` and witness the magic! ✨

---

## 🎯 How It Works: The Magic Explained

### 🎬 The Journey from Prompt to Video

Let's follow a user request through our system:

1. **🗣️ User Input**: "Create an animation showing how gradient descent works"

2. **🧠 MCP Analysis**: Our intelligent MCP server analyzes the prompt using LLM reasoning:
   ```python
   # The LLM thinks: "This is a request for a new animation about machine learning.
   # I need to: 1) Generate Manim code, 2) Render it to video"
   ```

3. **🛠️ Tool Selection**: Based on analysis, tools are selected:
   ```json
   [
     {"tool": "generate_manim_code", "reasoning": "User wants new animation"},
     {"tool": "render_video", "reasoning": "Generated code needs rendering"}
   ]
   ```

4. **⚙️ Execution Pipeline**:
   - **Step 1**: Generate sophisticated Manim code for gradient descent visualization
   - **Step 2**: Execute the code and render it into a beautiful MP4 video
   - **Step 3**: Return video URL and execution details to frontend

5. **🎉 Result**: User gets a professional-quality animation explaining gradient descent!

### 🔮 The MCP Magic in Action

Here's what makes our implementation special:

#### 🎯 Intelligent Prompt Analysis
```python
def select_tools(self, user_prompt: str) -> List[Dict[str, Any]]:
    # Uses LLM to understand user intent and select appropriate tools
    # Handles complex scenarios like:
    # - "Show me my videos" → open_burger_menu
    # - "Create and then edit a video" → generate_code → render → open_editor
    # - "Render this code: [code]" → render_video only
```

#### 🔄 Dynamic Workflow Orchestration
```python
# Tools can depend on each other seamlessly
parameters = {"code": "{{GENERATED_CODE}}"}  # Placeholder replaced at runtime
```

#### 🎛️ UI Integration
```python
# MCP doesn't just handle backend tools - it controls UI too!
ui_actions = [
    {"type": "open_burger_menu", "reason": "User wants to see video library"},
    {"type": "open_video_editor", "suggested_videos": ["video1", "video2"]}
]
```

---

## 🎥 Demo Video

Get ready to have your mind blown! 🤯 Watch VidCraftAI in action:

**🎬 [Full Demo Video - Drive Link](your-drive-link-here)**

*In this comprehensive demo, you'll see:*
- 🗣️ Natural language to animation conversion
- 🧠 Intelligent tool selection in real-time  
- 🎨 Beautiful mathematical animations being generated
- 🛠️ Video editing and management features
- 🔮 The power of MCP orchestrating everything seamlessly

*Duration: ~10 minutes | Quality: 1080p | Size: ~200MB*

---

## 🌟 Key Features & Capabilities

### 🎨 Animation Generation
- **📐 Mathematical Visualizations**: Calculus, algebra, geometry, statistics
- **🧠 AI/ML Concepts**: Neural networks, gradient descent, decision trees  
- **🔬 Physics Simulations**: Wave mechanics, particle systems, thermodynamics
- **📊 Data Visualizations**: Charts, graphs, statistical distributions

### 🛠️ Video Management  
- **✂️ Trimming**: Cut videos to the perfect length
- **🔗 Merging**: Combine multiple animations into one story
- **📚 Library**: Organized storage and retrieval of all your creations
- **🔄 Re-rendering**: Modify and re-generate existing animations

### 🧠 AI-Powered Features
- **🎯 Smart Tool Selection**: AI chooses the right tools automatically
- **📝 Code Generation**: High-quality Manim code from natural language
- **🔍 Context Awareness**: Understands complex, multi-step requests
- **🛡️ Error Recovery**: Graceful handling of edge cases and errors

---

## 🔧 Technical Deep Dive

### 🏗️ MCP Implementation Highlights

Our MCP server showcases several advanced patterns:

#### 1. **🧠 LLM-Powered Tool Selection**
```python
class LLMToolSelector:
    def select_tools(self, user_prompt: str) -> List[Dict[str, Any]]:
        # Uses GitHub Models API with GPT-4 for intelligent analysis
        # Fallback to keyword matching if LLM unavailable
        # Returns structured execution plan
```

#### 2. **🔄 Dynamic Parameter Resolution**
```python
# Tools can reference outputs from previous steps
if param_value == "{{GENERATED_CODE}}" and "code" in step_results:
    processed_parameters[param_key] = step_results["code"]
```

#### 3. **🎛️ UI Control Integration**
```python
# MCP controls both backend processing AND frontend UI
ui_actions.append({
    "type": "open_video_editor",
    "parameters": {"suggested_videos": video_ids},
    "reasoning": "User requested video editing"
})
```

#### 4. **📊 Comprehensive Logging**
```python
return {
    "code": generated_code,
    "video_url": output_url,
    "tools_used": ["generate_manim_code", "render_video"],
    "reasoning": ["Generate new animation", "Render to video"],
    "tool_selection_log": execution_steps,
    "ui_actions": ui_commands
}
```

### 🎨 Manim Integration

Our Manim code generation focuses on:
- **📏 Proper scene construction** with camera and timing setup
- **🎭 Professional animations** with smooth transitions
- **🎨 Beautiful styling** with consistent color schemes
- **📱 Optimized output** for web delivery

---

## 🤝 Contributing

We'd love your help making VidCraftAI even more amazing! 🌟

### 🎯 Areas Where You Can Contribute

1. **🛠️ New MCP Tools**: Add tools for different animation types, file formats, or AI models
2. **🎨 Frontend Enhancements**: Better UI/UX, real-time preview, drag-and-drop
3. **🧠 AI Improvements**: Better prompt understanding, more sophisticated tool selection
4. **📚 Documentation**: Examples, tutorials, API documentation
5. **🐛 Bug Fixes**: Help us squash those pesky bugs
6. **🔧 Performance**: Optimization for faster rendering and better scalability

### 📋 Contribution Guidelines

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💻 Code** your improvements  
4. **✅ Test** thoroughly (we love tests!)
5. **📝 Commit** with clear messages (`git commit -m 'Add amazing feature'`)
6. **📤 Push** to your branch (`git push origin feature/amazing-feature`)
7. **🎉 Open** a Pull Request

---

## 🛣️ Roadmap

### 🚀 Coming Soon (v2.0)
- **🎮 Interactive Animations**: User-controllable parameters in real-time
- **🌐 Cloud Deployment**: One-click deployment to AWS/GCP/Azure
- **🔗 API Integrations**: Connect to Wolfram Alpha, GeoGebra, and more
- **📱 Mobile App**: Create animations on the go

### 🌟 Future Vision (v3.0)
- **🤖 Multi-Model Support**: Integration with Claude, GPT-4, and local LLMs
- **🎬 3D Animations**: Advanced 3D mathematical visualizations  
- **👥 Collaboration**: Multi-user editing and sharing
- **🏫 Educational Platform**: Curriculum integration and teacher tools

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **🎨 Manim Community** - For the incredible animation library
- **🤖 Anthropic** - For MCP and making AI tool integration magical  
- **🌐 GitHub Models** - For powering our intelligent tool selection
- **⚛️ React & Flask Communities** - For the amazing frameworks
- **🎬 3Blue1Brown** - For inspiring us with beautiful mathematical animations

---

<div align="center">

### 🌟 Star this repo if VidCraftAI amazed you! 

*Made with ❤️ and lots of ☕ by [Aditya](https://github.com/Adiverse07)*

**✨ Transform ideas into stunning animations with VidCraftAI! ✨**

[⬆️ Back to Top](#-vidcraftai)

</div>
