document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const keyboard = document.querySelector('.keyboard');
    const header = document.querySelector('.header');
    const displayContainer = document.getElementById('displayContainer');

    let content = "1)\n(";
    let history = [content];
    let historyIndex = 0;

    const render = () => {
        display.innerHTML = `${content.replace(/\n/g, '<br>')}<span class="cursor"></span>`;
        displayContainer.scrollTop = displayContainer.scrollHeight;
    };

    const updateState = (newContent) => {
        content = newContent;
        history = history.slice(0, historyIndex + 1);
        history.push(content);
        historyIndex++;
        render();
    };

    // Main function for keyboard and tap-to-clear inputs
    const handleInput = (key) => {
        let newContent = content;
        const currentLine = content.split('\n').pop();
        const lastTimestamp = currentLine.split(/[,+-]/).pop();

        // Context-Aware Logic
        if (key === ':' && !/^\(\d{2}$/.test(lastTimestamp)) return;
        if (key === ')' && !/:(\d{1,2})$/.test(lastTimestamp)) return;
        if (['+', '-', ','].includes(key) && !/\)$/.test(currentLine)) return;
        if (key === '(' && !/[,+-]$/.test(currentLine) && currentLine !== "") return;
        if (['+', '-', 'ok'].includes(key) && /[,+-]\($|\($/.test(currentLine)) return;

        switch (key) {
            case 'backspace':
                if (content.length > 4) { newContent = content.slice(0, -1); }
                break;
            case 'enter':
                handleEnter();
                return; // Return because handleEnter calls updateState itself
            case 'ok':
                handleOK();
                return; // Return because handleOK calls updateState itself
            case ')':
                if (/:(\d)$/.test(lastTimestamp)) { // Smart Pad
                    newContent = content.slice(0, -1) + '0' + content.slice(-1) + ')';
                } else {
                    newContent += ')';
                }
                break;
            default:
                newContent += key;
        }

        // Automatic Formatting
        const updatedLine = newContent.split('\n').pop();
        const updatedTimestamp = updatedLine.split(/[,+-]/).pop();

        if (/^\(\d{2}$/.test(updatedTimestamp)) {
            newContent += ':';
        } else if (/:(\d{2})$/.test(updatedTimestamp)) {
            newContent += '),(';
        }
        
        updateState(newContent);
    };
    
    // Handles special header buttons
    const handleHeaderAction = (key, element) => {
        if (key === 'undo' || key === 'redo') {
            if (key === 'undo' && historyIndex > 0) historyIndex--;
            else if (key === 'redo' && historyIndex < history.length - 1) historyIndex++;
            content = history[historyIndex];
            render();
        } else if (key === 'copy') {
            handleCopy(element);
        } else if (key === 'download-txt') {
            downloadNotes('txt');
        } else if (key === 'download-doc') {
            downloadNotes('doc');
        }
    };

    const handleEnter = () => {
        const lines = content.split('\n');
        const currentDataLine = lines.pop();
        const currentNumberLine = lines.pop();
        
        if (currentDataLine === '(') {
            if (lines.length > 0) {
                updateState(lines.join('\n'));
            }
            return;
        }
        
        const currentLineNum = parseInt(currentNumberLine || '0');
        const cleanedContent = getCleanedContent();
        const nextLineNum = currentLineNum + 1;
        updateState(`${cleanedContent}\n\n${nextLineNum})\n(`);
    };
    
    const handleOK = () => {
        const currentLine = content.split('\n').pop();
        const lastTimestamp = currentLine.split(/[,+-]/).pop();
        let newContent = content;
        
        if (/^\((\d)$/.test(lastTimestamp)) {
            newContent = content.slice(0, -1) + '0' + content.slice(-1) + ':';
        } else if (/:(\d)$/.test(lastTimestamp)) {
            newContent = content.slice(0, -1) + '0' + content.slice(-1) + '),(';
        }
        updateState(newContent);
    };

    const getCleanedContent = () => {
        let cleaned = content;
        cleaned = cleaned.replace(/(\(\d{2}:\d{2})\)[,+-]\($/, '$1)'); // Fixes double parenthesis bug
        cleaned = cleaned.replace(/:(\d)$/, ':0$1)');
        return cleaned;
    };
    
    const handleCopy = (element) => {
        navigator.clipboard.writeText(getCleanedContent());
        const originalText = element.textContent;
        element.textContent = 'COPIED!';
        element.style.color = '#4CAF50';
        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '';
        }, 1500);
    };

    const downloadNotes = (format) => {
        const textToSave = getCleanedContent();
        const blob = new Blob([textToSave], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `timenotes_${date}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Event Listeners ---
    keyboard.addEventListener('click', (e) => {
        const keyButton = e.target.closest('.key');
        if (keyButton) handleInput(keyButton.dataset.key);
    });

    header.addEventListener('click', (e) => {
        const headerButton = e.target.closest('.header-btn');
        if (headerButton) handleHeaderAction(headerButton.dataset.key, headerButton);
    });
    
    // The C button is the first key in the keyboard, and it's mapped to 'backspace' in the HTML
    // The tap-to-clear functionality is now handled by the 'backspace' key in the keyboard
    // The displayContainer click listener is removed as it was causing confusion with the C button

    render();
});
