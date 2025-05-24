/**
 * NosytOS95 Paint Application
 * A Windows 95-style paint program with drawing tools
 */

class NosytPaint {
    constructor() {
        this.isPaintOpen = false;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.currentSize = 2;
        this.lastX = 0;
        this.lastY = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 20;
        
        this.tools = {
            brush: { name: 'Brush', icon: '🖌️' },
            pencil: { name: 'Pencil', icon: '✏️' },
            eraser: { name: 'Eraser', icon: '🧽' },
            line: { name: 'Line', icon: '📏' },
            rectangle: { name: 'Rectangle', icon: '⬜' },
            circle: { name: 'Circle', icon: '⭕' },
            fill: { name: 'Fill', icon: '🪣' },
            text: { name: 'Text', icon: 'A' }
        };
        
        this.colors = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
            '#800080', '#008080', '#C0C0C0', '#808080', '#FFA500', '#A52A2A',
            '#DDA0DD', '#98FB98', '#F0E68C', '#DEB887', '#5F9EA0', '#FF1493'
        ];
        
        this.init();
    }

    init() {
        console.log('🎨 NosytPaint initialized');
    }

    openPaint() {
        if (this.isPaintOpen) {
            const existingWindow = document.querySelector('.window[data-app="paint"]');
            if (existingWindow) {
                window.windowManager.focusWindow(existingWindow);
                return;
            }
        }

        const paintWindow = this.createPaintWindow();
        document.body.appendChild(paintWindow);
        
        if (window.windowManager) {
            window.windowManager.initializeWindow(paintWindow);
        }
        
        this.isPaintOpen = true;
        this.setupCanvas(paintWindow);
        this.setupEventListeners(paintWindow);
        this.saveState();
    }

    createPaintWindow() {
        const windowElement = document.createElement('div');
        windowElement.className = 'window paint-window';
        windowElement.setAttribute('data-app', 'paint');
        windowElement.style.cssText = `
            width: 800px;
            height: 600px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        `;

        windowElement.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">Paint - Untitled</div>
                <div class="title-bar-controls">
                    <button class="minimize-btn" aria-label="Minimize"></button>
                    <button class="maximize-btn" aria-label="Maximize"></button>
                    <button class="close-btn" aria-label="Close"></button>
                </div>
            </div>
            
            <div class="menu-bar">
                <div class="menu-item" data-menu="file">File</div>
                <div class="menu-item" data-menu="edit">Edit</div>
                <div class="menu-item" data-menu="view">View</div>
                <div class="menu-item" data-menu="image">Image</div>
                <div class="menu-item" data-menu="help">Help</div>
            </div>
            
            <div class="paint-toolbar">
                <div class="tool-section">
                    <div class="tool-group">
                        ${Object.entries(this.tools).map(([key, tool]) => `
                            <button class="tool-btn ${key === this.currentTool ? 'active' : ''}" 
                                    data-tool="${key}" title="${tool.name}">
                                ${tool.icon}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="color-section">
                    <div class="current-colors">
                        <div class="color-display">
                            <div class="primary-color" style="background: ${this.currentColor}"></div>
                            <div class="secondary-color" style="background: #ffffff"></div>
                        </div>
                    </div>
                    <div class="color-palette">
                        ${this.colors.map(color => `
                            <div class="color-swatch ${color === this.currentColor ? 'active' : ''}" 
                                 style="background: ${color}" 
                                 data-color="${color}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="size-section">
                    <label>Size:</label>
                    <input type="range" class="size-slider" min="1" max="20" value="${this.currentSize}">
                    <span class="size-display">${this.currentSize}px</span>
                </div>
            </div>
            
            <div class="paint-workspace">
                <div class="canvas-container">
                    <canvas class="paint-canvas" width="760" height="480"></canvas>
                </div>
            </div>
            
            <div class="status-bar">
                <span class="status-text">Ready</span>
                <span class="coordinates">0, 0</span>
            </div>
        `;

        return windowElement;
    }

    setupCanvas(windowElement) {
        this.canvas = windowElement.querySelector('.paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas background to white
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set default drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
    }

    setupEventListeners(windowElement) {
        const closeBtn = windowElement.querySelector('.close-btn');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closePaint(windowElement);
        });

        minimizeBtn.addEventListener('click', () => {
            if (window.windowManager) {
                window.windowManager.minimizeWindow(windowElement);
            }
        });

        maximizeBtn.addEventListener('click', () => {
            if (window.windowManager) {
                window.windowManager.maximizeWindow(windowElement);
            }
        });

        // Tool selection
        const toolBtns = windowElement.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool, windowElement);
            });
        });

        // Color selection
        const colorSwatches = windowElement.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.selectColor(swatch.dataset.color, windowElement);
            });
        });

        // Size adjustment
        const sizeSlider = windowElement.querySelector('.size-slider');
        const sizeDisplay = windowElement.querySelector('.size-display');
        sizeSlider.addEventListener('input', () => {
            this.currentSize = parseInt(sizeSlider.value);
            sizeDisplay.textContent = `${this.currentSize}px`;
            this.ctx.lineWidth = this.currentSize;
        });

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e, windowElement));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e, windowElement));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Mouse coordinates display
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor(e.clientX - rect.left);
            const y = Math.floor(e.clientY - rect.top);
            const coordinates = windowElement.querySelector('.coordinates');
            coordinates.textContent = `${x}, ${y}`;
        });

        // Keyboard shortcuts
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyPress(e, windowElement);
        });

        // Menu events
        const menuItems = windowElement.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                this.handleMenuClick(item.dataset.menu, windowElement);
            });
        });

        // Make window focusable for keyboard events
        windowElement.setAttribute('tabindex', '0');
        windowElement.focus();
    }

    selectTool(tool, windowElement) {
        this.currentTool = tool;
        
        // Update tool button states
        const toolBtns = windowElement.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });

        // Update cursor
        this.updateCursor();
        
        // Update status
        const statusText = windowElement.querySelector('.status-text');
        statusText.textContent = `${this.tools[tool].name} selected`;
    }

    selectColor(color, windowElement) {
        this.currentColor = color;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        
        // Update color swatch states
        const colorSwatches = windowElement.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === color);
        });

        // Update primary color display
        const primaryColor = windowElement.querySelector('.primary-color');
        primaryColor.style.background = color;
    }

    updateCursor() {
        if (this.canvas) {
            switch (this.currentTool) {
                case 'brush':
                case 'pencil':
                    this.canvas.style.cursor = 'crosshair';
                    break;
                case 'eraser':
                    this.canvas.style.cursor = 'grab';
                    break;
                case 'fill':
                    this.canvas.style.cursor = 'pointer';
                    break;
                case 'text':
                    this.canvas.style.cursor = 'text';
                    break;
                default:
                    this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    startDrawing(e, windowElement) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;

        if (this.currentTool === 'fill') {
            this.floodFill(this.lastX, this.lastY);
            this.saveState();
        } else if (this.currentTool === 'text') {
            this.addText(this.lastX, this.lastY, windowElement);
        }
    }

    draw(e, windowElement) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        this.ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';

        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
            case 'eraser':
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
                break;
                
            case 'line':
                // For line tool, we'll implement this in stopDrawing
                break;
                
            case 'rectangle':
                // For rectangle tool, we'll implement this in stopDrawing
                break;
                
            case 'circle':
                // For circle tool, we'll implement this in stopDrawing
                break;
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    floodFill(x, y) {
        // Simple flood fill implementation
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const targetColor = this.getPixelColor(imageData, x, y);
        const fillColor = this.hexToRgb(this.currentColor);
        
        if (this.colorsEqual(targetColor, fillColor)) return;
        
        const stack = [[x, y]];
        
        while (stack.length > 0) {
            const [currentX, currentY] = stack.pop();
            
            if (currentX < 0 || currentX >= this.canvas.width || 
                currentY < 0 || currentY >= this.canvas.height) continue;
                
            const currentColor = this.getPixelColor(imageData, currentX, currentY);
            
            if (!this.colorsEqual(currentColor, targetColor)) continue;
            
            this.setPixelColor(imageData, currentX, currentY, fillColor);
            
            stack.push([currentX + 1, currentY]);
            stack.push([currentX - 1, currentY]);
            stack.push([currentX, currentY + 1]);
            stack.push([currentX, currentY - 1]);
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    getPixelColor(imageData, x, y) {
        const index = (y * imageData.width + x) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }

    setPixelColor(imageData, x, y, color) {
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = 255;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    colorsEqual(color1, color2) {
        return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
    }

    addText(x, y, windowElement) {
        const text = prompt('Enter text:');
        if (text) {
            this.ctx.font = `${this.currentSize * 8}px Arial`;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillText(text, x, y);
            this.saveState();
        }
    }

    saveState() {
        this.undoStack.push(this.canvas.toDataURL());
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.loadState(previousState);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.loadState(nextState);
        }
    }

    loadState(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }

    handleKeyPress(e, windowElement) {
        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'n':
                    e.preventDefault();
                    this.clearCanvas();
                    break;
            }
        }
    }

    handleMenuClick(menu, windowElement) {
        switch (menu) {
            case 'file':
                this.showFileMenu(windowElement);
                break;
            case 'edit':
                this.showEditMenu(windowElement);
                break;
            case 'help':
                alert('NosytPaint v1.0\n\nA simple paint program for NosytOS95.\n\nKeyboard shortcuts:\nCtrl+Z: Undo\nCtrl+Y: Redo\nCtrl+N: New (clear canvas)');
                break;
        }
    }

    showFileMenu(windowElement) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-option" data-action="new">New</div>
            <div class="menu-option" data-action="save">Save</div>
            <div class="menu-separator"></div>
            <div class="menu-option" data-action="exit">Exit</div>
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'new') {
                this.clearCanvas();
            } else if (action === 'save') {
                this.saveImage();
            } else if (action === 'exit') {
                this.closePaint(windowElement);
            }
            menu.remove();
        });
        
        document.body.appendChild(menu);
        
        // Position menu
        const rect = windowElement.querySelector('[data-menu="file"]').getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    showEditMenu(windowElement) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-option" data-action="undo">Undo</div>
            <div class="menu-option" data-action="redo">Redo</div>
            <div class="menu-separator"></div>
            <div class="menu-option" data-action="clear">Clear All</div>
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'undo') {
                this.undo();
            } else if (action === 'redo') {
                this.redo();
            } else if (action === 'clear') {
                this.clearCanvas();
            }
            menu.remove();
        });
        
        document.body.appendChild(menu);
        
        // Position menu
        const rect = windowElement.querySelector('[data-menu="edit"]').getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    saveImage() {
        const link = document.createElement('a');
        link.download = 'nosytpaint-image.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    closePaint(windowElement) {
        if (windowElement) {
            windowElement.remove();
        }
        this.isPaintOpen = false;
        this.canvas = null;
        this.ctx = null;
    }
}

// Initialize paint application
window.nosytPaint = new NosytPaint();

// Add paint styles
const paintStyles = document.createElement('style');
paintStyles.textContent = `
    .paint-window {
        font-family: 'MS Sans Serif', sans-serif;
        display: flex;
        flex-direction: column;
    }

    .menu-bar {
        background: #c0c0c0;
        border-bottom: 1px solid #808080;
        display: flex;
        padding: 2px;
        font-size: 11px;
    }

    .menu-item {
        padding: 4px 8px;
        cursor: pointer;
        user-select: none;
    }

    .menu-item:hover {
        background: #0078d4;
        color: white;
    }

    .paint-toolbar {
        background: #c0c0c0;
        border-bottom: 1px solid #808080;
        padding: 8px;
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
    }

    .tool-group {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
        border: 1px inset #c0c0c0;
        padding: 4px;
    }

    .tool-btn {
        width: 32px;
        height: 32px;
        background: #c0c0c0;
        border: 1px outset #c0c0c0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }

    .tool-btn:hover {
        background: #d4d0c8;
    }

    .tool-btn.active {
        border: 1px inset #c0c0c0;
        background: #a0a0a0;
    }

    .color-section {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .current-colors {
        border: 1px inset #c0c0c0;
        padding: 4px;
    }

    .color-display {
        position: relative;
        width: 32px;
        height: 32px;
    }

    .primary-color {
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        border: 1px solid #000;
    }

    .secondary-color {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        border: 1px solid #000;
    }

    .color-palette {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 1px;
        border: 1px inset #c0c0c0;
        padding: 2px;
    }

    .color-swatch {
        width: 16px;
        height: 16px;
        cursor: pointer;
        border: 1px solid #808080;
    }

    .color-swatch.active {
        border: 2px solid #000;
    }

    .size-section {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
    }

    .size-slider {
        width: 80px;
    }

    .paint-workspace {
        flex: 1;
        background: #c0c0c0;
        padding: 8px;
        overflow: auto;
    }

    .canvas-container {
        background: white;
        border: 2px inset #c0c0c0;
        display: inline-block;
    }

    .paint-canvas {
        display: block;
        background: white;
    }

    .status-bar {
        background: #c0c0c0;
        border-top: 1px solid #808080;
        padding: 4px 8px;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
    }

    .context-menu {
        position: fixed;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 120px;
        font-size: 11px;
    }

    .menu-option {
        padding: 4px 16px;
        cursor: pointer;
        user-select: none;
    }

    .menu-option:hover {
        background: #0078d4;
        color: white;
    }

    .menu-separator {
        height: 1px;
        background: #808080;
        margin: 2px 8px;
    }
`;

document.head.appendChild(paintStyles);

console.log('🎨 Paint application loaded successfully');
