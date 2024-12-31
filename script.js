class Calculator {
    constructor() {
        this._state = {
            displayValue: '0',
            firstOperand: null,
            waitingForSecondOperand: false,
            operator: null,
            history: '',
            calculationComplete: false
        };

        this._initElements();
        this._bindEvents();
        this._initTheme();
    }

    // Инициализация элементов
    _initElements() {
        this._display = document.querySelector('.calculator__output');
        this._history = document.querySelector('.calculator__history');
        this._buttons = document.querySelector('.calculator__buttons');
        this._themeToggle = document.getElementById('theme-toggle');
        this._formToggle = document.getElementById('form-toggle');
    }

    // Инициализация темы
    _initTheme() {
        const isDark = localStorage.getItem('calculator-theme') === 'true';
        if (isDark) {
            document.body.classList.add('page_theme_dark');
        }
    }

    // Привязка обработчиков событий
    _bindEvents() {
        this._buttons.addEventListener('click', (event) => this._handleButtonClick(event));
        this._themeToggle.addEventListener('click', () => this._toggleTheme());
        this._formToggle.addEventListener('click', () => this._toggleForm());
        document.addEventListener('keydown', (event) => this._handleKeyboard(event));
    }

    // Обработка нажатия клавиш
    _handleKeyboard(event) {
        const key = event.key;
        const code = event.code;

        // Маппинг операторов numpad
        const operatorMap = {
            'NumpadAdd': '+',
            'NumpadSubtract': '-',
            'NumpadMultiply': '*',
            'NumpadDivide': '/'
        };

        // Обработка точки (включая numpad)
        if (key === '.' || key === ',' || code === 'NumpadDecimal') {
            event.preventDefault();
            this._inputDecimal('.');
            this._updateDisplay();
            return;
        }

        // Предотвращаем обработку функциональных клавиш
        if (key.startsWith('F') && !isNaN(key.slice(1))) {
            event.preventDefault();
            return;
        }

        // Обработка цифр (включая numpad)
        if (/^\d$/.test(key)) {
            event.preventDefault();
            this._inputDigit(key);
            this._updateDisplay();
        }
        // Обработка операторов (включая numpad)
        else if (['+', '-', '*', '/', '%'].includes(key) || operatorMap[code]) {
            event.preventDefault();
            this._handleOperator(operatorMap[code] || key);
            this._updateDisplay();
        }
        // Обработка Enter/=
        else if (key === 'Enter' || key === '=' || code === 'NumpadEnter') {
            event.preventDefault();
            this._performCalculation();
            this._updateDisplay();
        }
        // Остальные специальные клавиши
        else if (key === 'Backspace') {
            event.preventDefault();
            this._deleteLastDigit();
            this._updateDisplay();
        }
        else if (key === 'Escape') {
            event.preventDefault();
            this._resetCalculator();
            this._updateDisplay();
        }
    }



    // Обработка нажатия кнопок
    _handleButtonClick(event) {
        const target = event.target;

        if (!target.matches('.calculator__btn')) return;

        if (target.classList.contains('calculator__btn_type_number')) {
            if (target.textContent === '.' || target.textContent === ',') {
                this._inputDecimal(target.textContent);
            } else {
                this._inputDigit(target.textContent);
            }
            this._updateDisplay();
        } else if (target.classList.contains('calculator__btn_type_operator')) {
            switch(target.textContent) {
                case 'AC':
                    this._resetCalculator();
                    break;
                case 'DEL':
                    this._deleteLastDigit();
                    break;
                case '=':
                    this._performCalculation();
                    break;
                default:
                    this._handleOperator(target.textContent);
            }
            this._updateDisplay();
        }
    }

    // Ввод цифр
    _inputDigit(digit) {
        const { displayValue, waitingForSecondOperand, calculationComplete } = this._state;
        const MAX_DISPLAY_LENGTH = 12;

        // Заменяем запятую на точку при вводе
        const processedDigit = digit === ',' ? '.' : digit;

        // Если предыдущая операция завершена и вводится новое число
        if (calculationComplete) {
            this._state.displayValue = processedDigit;
            this._state.calculationComplete = false;
            this._state.firstOperand = null;
            this._state.history = '';
            return;
        }

        // Проверка на максимальную длину
        if (displayValue.length >= MAX_DISPLAY_LENGTH && !waitingForSecondOperand) {
            return;
        }

        if (waitingForSecondOperand) {
            this._state.displayValue = processedDigit;
            this._state.waitingForSecondOperand = false;
        } else {
            this._state.displayValue = displayValue === '0' ? processedDigit : displayValue + processedDigit;
        }
    }

    // Ввод десятичной точки
    _inputDecimal(dot) {
        if (this._state.waitingForSecondOperand) {
            this._state.displayValue = "0.";
            this._state.waitingForSecondOperand = false;
            return;
        }

        if (!this._state.displayValue.includes(dot)) {
            this._state.displayValue += dot;
        }
    }

    // Обработка операторов
    _handleOperator(nextOperator) {
        const { firstOperand, displayValue, operator, calculationComplete } = this._state;
        const inputValue = parseFloat(displayValue);

        if (calculationComplete && nextOperator !== '=') {
            this._state.calculationComplete = false;
            this._state.firstOperand = parseFloat(this._state.displayValue);
            this._state.operator = nextOperator;
            this._state.waitingForSecondOperand = true;
            this._updateHistory();
            return;
        }

        if (operator && this._state.waitingForSecondOperand) {
            this._state.operator = nextOperator;
            this._updateHistory();
            return;
        }

        if (firstOperand === null && !isNaN(inputValue)) {
            this._state.firstOperand = inputValue;
        } else if (operator) {
            const result = this._calculate(firstOperand, inputValue, operator);
            this._state.displayValue = `${parseFloat(result.toFixed(7))}`;
            this._state.firstOperand = result;
        }

        this._state.waitingForSecondOperand = true;
        this._state.operator = nextOperator === '=' ? null : nextOperator;
        this._updateHistory();
    }


    // Выполнение вычислений
    _calculate(firstOperand, secondOperand, operator) {
        switch (operator) {
            case '+': return firstOperand + secondOperand;
            case '-': return firstOperand - secondOperand;
            case '*': return firstOperand * secondOperand;
            case '/':
                if (secondOperand === 0) {
                    alert('Деление на ноль невозможно!');
                    return 0;
                }
                return firstOperand / secondOperand;
            case '%': return firstOperand % secondOperand;
            default: return secondOperand;
        }
    }

    // Удаление последнего символа
    _deleteLastDigit() {
        this._state.displayValue = this._state.displayValue.slice(0, -1);
        if (this._state.displayValue === '') {
            this._state.displayValue = '0';
        }
    }

    // Выполнение вычисления
    _performCalculation() {
        if (this._state.operator && !this._state.waitingForSecondOperand) {
            const secondOperand = parseFloat(this._state.displayValue);
            const result = this._calculate(this._state.firstOperand, secondOperand, this._state.operator);

            const expression = `${this._state.firstOperand} ${this._state.operator} ${secondOperand} =`;

            this._state.displayValue = `${parseFloat(result.toFixed(7))}`;
            this._state.firstOperand = result; // Сохраняем результат как первый операнд
            this._state.operator = null;
            this._state.waitingForSecondOperand = false;
            this._state.calculationComplete = true;

            this._history.textContent = expression;
        }
    }

    // Сброс калькулятора
    _resetCalculator() {
        this._state.displayValue = '0';
        this._state.firstOperand = null;
        this._state.waitingForSecondOperand = false;
        this._state.operator = null;
        this._state.history = '';
        this._state.calculationComplete = false; // Сбрасываем флаг
        this._updateHistory();
    }

    // Обновление дисплея
    _updateDisplay() {
        this._display.textContent = this._state.displayValue;
        this._updateHistory();
    }

    // Обновление истории операций
    _updateHistory() {
        if (this._state.firstOperand !== null && this._state.operator) {
            this._history.textContent = `${this._state.firstOperand} ${this._state.operator}`;
        } else {
            this._history.textContent = '';
        }
    }

    // Переключение темы
    _toggleTheme() {
        document.body.classList.toggle('page_theme_dark');
        localStorage.setItem('calculator-theme', document.body.classList.contains('page_theme_dark'));
    }

    // Переключение формы
    _toggleForm() {
        const calculator = document.querySelector('.calculator');
        const shapes = ['calculator_shape_square', 'calculator_shape_round', 'calculator_shape_wide'];

        // Если форма еще не установлена, добавляем первую
        const currentShape = shapes.find(shape => calculator.classList.contains(shape));
        if (!currentShape) {
            calculator.classList.add(shapes[0]);
            return;
        }

        const currentIndex = shapes.indexOf(currentShape);
        const nextIndex = (currentIndex + 1) % shapes.length;

        calculator.classList.remove(currentShape);
        calculator.classList.add(shapes[nextIndex]);

        // Сохраняем текущую форму в localStorage
        localStorage.setItem('calculator-shape', shapes[nextIndex]);
    }
}

// Инициализация калькулятора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});