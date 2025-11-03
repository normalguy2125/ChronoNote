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

    const handleInput = (key, element) => {
        let newContent = content;
        const currentLine = content.split('\n').pop();
        const lastTimestamp = currentLine.split(/[,+-]/).pop();

        if (key === ':' && !/^\(\d{2}$/.test(lastTimestamp)) return;
        if (key === ')' && !/:(\d{1,2})$/.test(lastTimestamp)) return;
        if (['+', '-', ','].includes(key) && !/\)$/.test(currentLine)) return;
        if (key === '(' && !/[,+-]$/.test(currentLine) && currentLine !== "") return;
        if (['+', '-', 'ok'].includes(key) && /[,+-]\($|\($/.test(currentLine)) return;

        switch (key) {
            case 'backspace':
                if (content.length > 4) {
                    newContent = content.slice(0, -1);
                }
                break;
            case 'undo':
            case 'redo':
                handleHistory(key);
                return;
            case 'copy':
                handleCopy(element);
                return;
            case 'download-txt':
                downloadNotes('txt');
                return;
            case 'download-doc':
                downloadNotes('doc');
                return;
            case 'enter':
                handleEnter();
                return;
            case 'ok':
                handleOK();
                return;
            case ')':
                if (/:(\d)$/.test(lastTimestamp)) {
                    newContent = content.slice(0, -1) + '0' + content.slice(-1) + ')';
                } else {
                    newContent += ')';
                }
                break;
            default:
                newContent += key;
        }

        const updatedLine = newContent.split('\n').pop();
        const updatedTimestamp = updatedLine.split(/[,+-]/).pop();

        if (/^\(\d{2}$/.test(updatedTimestamp)) {
            newContent += ':';
        } else if (/:(\d{2})$/.test(updatedTimestamp)) {
            newContent += '),(';
        }
        
        updateState(newContent);
    };
    
    const handleHistory = (key) => {
        if (key === 'undo' && historyIndex > 0) {
            historyIndex--;
        } else if (key === 'redo' && historyIndex < history.length - 1) {
            historyIndex++;
        }
        content = history[historyIndex];
        render();
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
        // ADDED EXTRA \n FOR SPACING
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
        // BUG FIX: Replaced faulty regex to correctly finalize the line
        cleaned = cleaned.replace(/(\(\d{2}:\d{2}))[,+-]\($/, '$1)');
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

    keyboard.addEventListener('click', (e) => {
        const keyButton = e.target.closest('.key');
        if (keyButton) handleInput(keyButton.dataset.key, keyButton);
    });

    header.addEventListener('click', (e) => {
        const headerButton = e.target.closest('.header-btn');
        if (headerButton) handleInput(headerButton.dataset.key, headerButton);
    });
    
    displayContainer.addEventListener('click', () => handleInput('backspace'));

    render();
});
