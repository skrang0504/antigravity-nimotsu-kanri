document.addEventListener('DOMContentLoaded', () => {
    const calendarElement = document.getElementById('calendar');
    const currentMonthDisplay = document.getElementById('currentMonthDisplay');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    // Modal Elements
    const eventModal = document.getElementById('eventModal');
    const modalDateTitle = document.getElementById('modalDateTitle');
    const closeModalBtn = document.getElementById('closeModal');
    const saveBtn = document.getElementById('saveBtn');
    const lineShareBtn = document.getElementById('lineShareBtn');

    // Input Elements
    const inputs = {
        mensGo: document.getElementById('mensGo'),
        mensReturn: document.getElementById('mensReturn'),
        mensBalls: document.getElementById('mensBalls'),
        womensGo: document.getElementById('womensGo'),
        womensReturn: document.getElementById('womensReturn'),
        womensBalls: document.getElementById('womensBalls'),
        othersGo: document.getElementById('othersGo'),
        othersReturn: document.getElementById('othersReturn'),
        othersBalls: document.getElementById('othersBalls'),
        unnecessaryItems: document.getElementById('unnecessaryItems'),
    };

    let currentDate = new Date();
    let selectedDate = null;
    let calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};

    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

    function init() {
        renderCalendar();
        setupEventListeners();
    }

    function setupEventListeners() {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === eventModal) closeModal();
        });

        saveBtn.addEventListener('click', saveData);
        lineShareBtn.addEventListener('click', shareToLine);
    }

    function renderCalendar() {
        calendarElement.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Update Header
        currentMonthDisplay.textContent = `${year}年 ${month + 1}月`;

        // Render Day Headers
        daysOfWeek.forEach((day, index) => {
            const header = document.createElement('div');
            header.className = `day-header ${index === 0 ? 'sun' : ''} ${index === 6 ? 'sat' : ''}`;
            header.textContent = day;
            calendarElement.appendChild(header);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const startDayIndex = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Previous Month Padding
        for (let i = startDayIndex; i > 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-cell other-month';
            dayDiv.innerHTML = `<span class="day-number">${prevLastDay.getDate() - i + 1}</span>`;
            calendarElement.appendChild(dayDiv);
        }

        // Current Month Days
        for (let i = 1; i <= totalDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-cell';
            const dateStr = formatDateKey(year, month, i);
            
            // Check for today
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            // Check for saved data
            const hasData = calendarData[dateStr];
            
            let contentHtml = `<span class="day-number">${i}</span>`;
            if (hasData) {
                contentHtml += `<div class="event-dot"></div>`;
                // Optional: Show some summary text
                // contentHtml += `<div class="day-content">登録あり</div>`;
            }
            
            dayDiv.innerHTML = contentHtml;
            dayDiv.addEventListener('click', () => openModal(new Date(year, month, i)));
            calendarElement.appendChild(dayDiv);
        }
    }

    function openModal(date) {
        selectedDate = date;
        const dateStr = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const dayOfWeek = daysOfWeek[date.getDay()];
        
        modalDateTitle.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
        
        // Load data if exists
        const data = calendarData[dateStr] || {};
        Object.keys(inputs).forEach(key => {
            inputs[key].value = data[key] || '';
        });

        eventModal.classList.add('active');
    }

    function closeModal() {
        eventModal.classList.remove('active');
        selectedDate = null;
    }

    function saveData() {
        if (!selectedDate) return;

        const dateStr = formatDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const data = {};
        
        let isEmpty = true;
        Object.keys(inputs).forEach(key => {
            const val = inputs[key].value.trim();
            if (val) isEmpty = false;
            data[key] = val;
        });

        if (isEmpty) {
            delete calendarData[dateStr];
        } else {
            calendarData[dateStr] = data;
        }

        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        renderCalendar();
        closeModal();
    }

    function shareToLine() {
        if (!selectedDate) return;
        
        // Use current input values
        const currentInputs = {};
        Object.keys(inputs).forEach(key => {
            currentInputs[key] = inputs[key].value.trim();
        });

        // Format Date
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        const dayOfWeek = daysOfWeek[selectedDate.getDay()];
        
        const header = `${year}年${month}月${day}日(${dayOfWeek})`;
        const parts = [header];

        // Function to build group string
        const buildGroupString = (title, go, ret, balls) => {
            let lines = [];
            // Check if any data exists for this group
            if (!go && !ret && !balls) return null;

            lines.push(`【${title}】`);
            
            let contentParts = [];
            if (go) contentParts.push(`行き：${go}`);
            if (ret) contentParts.push(`帰り：${ret}`);
            if (balls) contentParts.push(`${balls}個`); // Removed "ボール" text
            
            if (contentParts.length > 0) {
                lines.push(contentParts.join('　')); // distinct separator
            }
            
            return lines.join('\n');
        };

        // Determine Men's Header (Men & Women if only men data exists)
        const hasMen = currentInputs.mensGo || currentInputs.mensReturn || currentInputs.mensBalls;
        const hasWomen = currentInputs.womensGo || currentInputs.womensReturn || currentInputs.womensBalls;
        
        let mensTitle = '男子';
        if (hasMen && !hasWomen) {
            mensTitle = '男女';
        }

        // Men
        const mensPart = buildGroupString(mensTitle, currentInputs.mensGo, currentInputs.mensReturn, currentInputs.mensBalls);
        if (mensPart) parts.push(mensPart);

        // Women
        const womensPart = buildGroupString('女子', currentInputs.womensGo, currentInputs.womensReturn, currentInputs.womensBalls);
        if (womensPart) parts.push(womensPart);

        // Others
        const othersPart = buildGroupString('他', currentInputs.othersGo, currentInputs.othersReturn, currentInputs.othersBalls);
        if (othersPart) parts.push(othersPart);

        // Unnecessary Items
        if (currentInputs.unnecessaryItems) {
            parts.push(`（いらない荷物：${currentInputs.unnecessaryItems}）`);
        }

        // Join all parts with double newlines for clear separation
        const text = parts.join('\n');

        const encodedText = encodeURIComponent(text);
        const lineUrl = `https://line.me/R/msg/text/?${encodedText}`;
        
        window.open(lineUrl, '_blank');
    }

    function formatDateKey(year, month, day) {
        return `${year}-${month}-${day}`;
    }

    init();
});
