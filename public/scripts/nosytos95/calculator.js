/**
 * NosytOS95 Calculator Application
 * A fully functional Windows 95-style calculator
 */

class NosytCalculator {
    constructor() {
        this.display = '';
        this.previousValue = null;
        this.operation = null;
        this.waitingForOperand = false;
        this.memory = 0;
        this.isCalculatorOpen = false;
        
        this.init();
    }

    init() {
        console.log('🧮 NosytCalculator initialized');
    }

    openCalculator() {
        if (this.isCalculatorOpen) {
            // Focus existing window
            const existingWindow = document.querySelector('.window[data-app="calculator"]');
            if (existingWindow) {
                window.windowManager.focusWindow(existingWindow);
                return;
            }
        }

        const calculatorWindow = this.createCalculatorWindow();
        document.body.appendChild(calculatorWindow);
        
        if (window.windowManager) {
            window.windowManager.initializeWindow(calculatorWindow);
        }
        
        this.isCalculatorOpen = true;
        this.setupEventListeners(calculatorWindow);
        this.updateDisplay();
    }

    createCalculatorWindow() {
        const windowElement = document.createElement('div');
        windowElement.className = 'window calculator-window';
        windowElement.setAttribute('data-app', 'calculator');
        windowElement.style.cssText = `
            width: 280px;
            height: 380px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        `;

        windowElement.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">Calculator</div>
                <div class="title-bar-controls">
                    <button class="minimize-btn" aria-label="Minimize"></button>
                    <button class="close-btn" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body calculator-body">
                <div class="calculator-display">
                    <input type="text" class="display-input" readonly value="0">
                </div>
                <div class="calculator-buttons">
                    <!-- Memory buttons -->
                    <div class="button-row">
                        <button class="calc-btn memory-btn" data-action="memory-clear">MC</button>
                        <button class="calc-btn memory-btn" data-action="memory-recall">MR</button>
                        <button class="calc-btn memory-btn" data-action="memory-store">MS</button>
                        <button class="calc-btn memory-btn" data-action="memory-add">M+</button>
                    </div>
                    
                    <!-- Function buttons -->
                    <div class="button-row">
                        <button class="calc-btn function-btn" data-action="backspace">⌫</button>
                        <button class="calc-btn function-btn" data-action="clear-entry">CE</button>
                        <button class="calc-btn function-btn" data-action="clear">C</button>
                        <button class="calc-btn function-btn" data-action="negate">±</button>
                    </div>
                    
                    <!-- Number and operation buttons -->
                    <div class="button-row">
                        <button class="calc-btn number-btn" data-number="7">7</button>
                        <button class="calc-btn number-btn" data-number="8">8</button>
                        <button class="calc-btn number-btn" data-number="9">9</button>
                        <button class="calc-btn operation-btn" data-operation="divide">÷</button>
                    </div>
                    
                    <div class="button-row">
                        <button class="calc-btn number-btn" data-number="4">4</button>
                        <button class="calc-btn number-btn" data-number="5">5</button>
                        <button class="calc-btn number-btn" data-number="6">6</button>
                        <button class="calc-btn operation-btn" data-operation="multiply">×</button>
                    </div>
                    
                    <div class="button-row">
                        <button class="calc-btn number-btn" data-number="1">1</button>
                        <button class="calc-btn number-btn" data-number="2">2</button>
                        <button class="calc-btn number-btn" data-number="3">3</button>
                        <button class="calc-btn operation-btn" data-operation="subtract">−</button>
                    </div>
                    
                    <div class="button-row">
                        <button class="calc-btn number-btn zero-btn" data-number="0">0</button>
                        <button class="calc-btn number-btn" data-action="decimal">.</button>
                        <button class="calc-btn operation-btn" data-operation="add">+</button>
                    </div>
                    
                    <div class="button-row">
                        <button class="calc-btn equals-btn" data-action="equals">=</button>
                    </div>
                </div>
            </div>
        `;

        return windowElement;
    }

    setupEventListeners(windowElement) {
        const closeBtn = windowElement.querySelector('.close-btn');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeCalculator(windowElement);
        });

        minimizeBtn.addEventListener('click', () => {
            if (window.windowManager) {
                window.windowManager.minimizeWindow(windowElement);
            }
        });

        // Calculator button listeners
        const buttons = windowElement.querySelectorAll('.calc-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleButtonClick(e.target, windowElement);
            });
        });

        // Keyboard support
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyPress(e, windowElement);
        });

        // Make window focusable for keyboard events
        windowElement.setAttribute('tabindex', '0');
        windowElement.focus();
    }

    handleButtonClick(button, windowElement) {
        const number = button.dataset.number;
        const operation = button.dataset.operation;
        const action = button.dataset.action;

        if (number !== undefined) {
            this.inputNumber(number);
        } else if (operation) {
            this.inputOperation(operation);
        } else if (action) {
            this.performAction(action);
        }

        this.updateDisplay(windowElement);
        this.playClickSound();
    }

    handleKeyPress(e, windowElement) {
        e.preventDefault();
        
        const key = e.key;
        
        if (/[0-9]/.test(key)) {
            this.inputNumber(key);
        } else if (key === '.') {
            this.performAction('decimal');
        } else if (key === '+') {
            this.inputOperation('add');
        } else if (key === '-') {
            this.inputOperation('subtract');
        } else if (key === '*') {
            this.inputOperation('multiply');
        } else if (key === '/') {
            this.inputOperation('divide');
        } else if (key === 'Enter' || key === '=') {
            this.performAction('equals');
        } else if (key === 'Escape') {
            this.performAction('clear');
        } else if (key === 'Backspace') {
            this.performAction('backspace');
        } else if (key === 'Delete') {
            this.performAction('clear-entry');
        }

        this.updateDisplay(windowElement);
    }

    inputNumber(num) {
        if (this.waitingForOperand) {
            this.display = num;
            this.waitingForOperand = false;
        } else {
            this.display = this.display === '0' ? num : this.display + num;
        }
    }

    inputOperation(nextOperation) {
        const inputValue = parseFloat(this.display);

        if (this.previousValue === null) {
            this.previousValue = inputValue;
        } else if (this.operation) {
            const currentValue = this.previousValue || 0;
            const newValue = this.calculate(currentValue, inputValue, this.operation);

            this.display = String(newValue);
            this.previousValue = newValue;
        }

        this.waitingForOperand = true;
        this.operation = nextOperation;
    }

    performAction(action) {
        switch (action) {
            case 'equals':
                this.performEquals();
                break;
            case 'clear':
                this.clear();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'negate':
                this.negate();
                break;
            case 'memory-clear':
                this.memory = 0;
                break;
            case 'memory-recall':
                this.display = String(this.memory);
                this.waitingForOperand = true;
                break;
            case 'memory-store':
                this.memory = parseFloat(this.display);
                break;
            case 'memory-add':
                this.memory += parseFloat(this.display);
                break;
        }
    }

    performEquals() {
        const inputValue = parseFloat(this.display);

        if (this.previousValue !== null && this.operation) {
            const newValue = this.calculate(this.previousValue, inputValue, this.operation);
            this.display = String(newValue);
            this.previousValue = null;
            this.operation = null;
            this.waitingForOperand = true;
        }
    }

    calculate(firstValue, secondValue, operation) {
        switch (operation) {
            case 'add':
                return firstValue + secondValue;
            case 'subtract':
                return firstValue - secondValue;
            case 'multiply':
                return firstValue * secondValue;
            case 'divide':
                if (secondValue === 0) {
                    alert('Cannot divide by zero');
                    return firstValue;
                }
                return firstValue / secondValue;
            default:
                return secondValue;
        }
    }

    clear() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForOperand = false;
    }

    clearEntry() {
        this.display = '0';
    }

    backspace() {
        if (this.display.length > 1) {
            this.display = this.display.slice(0, -1);
        } else {
            this.display = '0';
        }
    }

    inputDecimal() {
        if (this.waitingForOperand) {
            this.display = '0.';
            this.waitingForOperand = false;
        } else if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
    }

    negate() {
        if (this.display !== '0') {
            if (this.display.charAt(0) === '-') {
                this.display = this.display.slice(1);
            } else {
                this.display = '-' + this.display;
            }
        }
    }

    updateDisplay(windowElement = null) {
        if (!windowElement) {
            windowElement = document.querySelector('.window[data-app="calculator"]');
        }
        
        if (windowElement) {
            const displayInput = windowElement.querySelector('.display-input');
            if (displayInput) {
                // Format display value
                let displayValue = this.display;
                
                // Handle very long numbers
                if (displayValue.length > 12) {
                    const num = parseFloat(displayValue);
                    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
                        displayValue = num.toExponential(6);
                    } else {
                        displayValue = num.toPrecision(12);
                    }
                }
                
                displayInput.value = displayValue;
            }
        }
    }

    playClickSound() {
        if (window.soundManager && window.soundManager.playSound) {
            window.soundManager.playSound('click');
        }
    }

    closeCalculator(windowElement) {
        if (windowElement) {
            windowElement.remove();
        }
        this.isCalculatorOpen = false;
        
        // Reset calculator state
        this.clear();
    }
}

// Initialize calculator
window.nosytCalculator = new NosytCalculator();

// Add calculator styles
const calculatorStyles = document.createElement('style');
calculatorStyles.textContent = `
    .calculator-window {
        font-family: 'MS Sans Serif', sans-serif;
    }

    .calculator-body {
        padding: 8px;
        background: #c0c0c0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: calc(100% - 20px);
    }

    .calculator-display {
        background: #000;
        border: 2px inset #c0c0c0;
        padding: 4px;
        margin-bottom: 8px;
    }

    .display-input {
        width: 100%;
        background: #000;
        color: #00ff00;
        border: none;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        text-align: right;
        padding: 8px;
        outline: none;
    }

    .calculator-buttons {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .button-row {
        display: flex;
        gap: 4px;
        flex: 1;
    }

    .calc-btn {
        flex: 1;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        min-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .calc-btn:hover {
        background: #d4d0c8;
    }

    .calc-btn:active {
        border: 2px inset #c0c0c0;
        background: #a0a0a0;
    }

    .zero-btn {
        flex: 2;
    }

    .equals-btn {
        flex: 3;
        background: #0078d4;
        color: white;
    }

    .equals-btn:hover {
        background: #106ebe;
    }

    .equals-btn:active {
        background: #005a9e;
    }

    .operation-btn {
        background: #ffcc00;
        color: #000;
    }

    .operation-btn:hover {
        background: #ffdd33;
    }

    .operation-btn:active {
        background: #e6b800;
    }

    .memory-btn {
        background: #ff6b6b;
        color: white;
        font-size: 10px;
    }

    .memory-btn:hover {
        background: #ff5252;
    }

    .memory-btn:active {
        background: #e53935;
    }

    .function-btn {
        background: #4ecdc4;
        color: white;
    }

    .function-btn:hover {
        background: #26a69a;
    }

    .function-btn:active {
        background: #00695c;
    }

    .number-btn {
        background: #f5f5f5;
        color: #000;
    }

    .number-btn:hover {
        background: #e0e0e0;
    }

    .number-btn:active {
        background: #bdbdbd;
    }
`;

document.head.appendChild(calculatorStyles);

console.log('🧮 Calculator application loaded successfully');
