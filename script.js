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
        // Scroll to the bottom to keep the cursor in view
        displayContainer.scrollTop = displayContainer.scrollHeight;
    };

    const updateState = (newContent) => {
        content = newContent;
        history = history.slice(0, historyIndex + 1);
        history.push(content);
        historyIndex++;
        render();
    };

    const handleInput = (key) => {
        let newContent = content;
        const currentLine = content.split('\n').pop();
        const lastTimestamp = currentLine.split(/[,+-]/).pop();

        // --- Context-Aware Logic ---
        if (key === ':' && !/^\(\d{2}$/.test(lastTimestamp)) return;
        if (key === ')' && !/:(\d{1,2})$/.test(lastTimestamp)) return;
        if (['+', '-', ','].includes(key) && !/\)$/.test(currentLine)) return;
        if (key === '(' && !/[,+-]$/.test(currentLine) && currentLine !== "") return;
        if (['+', '-', 'ok'].includes(key) && /[,+-]\($|\($/.test(currentLine)) return;

        switch (key) {
            case 'c':
                newContent = content.substring(0, content.lastIndexOf('\n') + 1) + '(';
                break;
            case 'backspace':
                if (content.length > 4) { // Prevent deleting the initial "1)\n("
                    newContent = content.slice(0, -1);
                }
                break;
            case 'undo':
                if (historyIndex > 0) {
                    historyIndex--;
                    content = history[historyIndex];
                    render();
                }
                return;
            case 'redo':
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    content = history[historyIndex];
                    render();
                }
                return;
            case 'copy':
                navigator.clipboard.writeText(getCleanedContent());
                return;
            case 'download':
                downloadNotes();
                return;
            case 'enter':
                handleEnter();
                return;
            case 'ok':
                handleOK();
                return;
            case ')':
                 if(/:(\d)$/.test(lastTimestamp)) { // Smart Pad
                    newContent = content.slice(0, -1) + '0' + content.slice(-1) + ')';
                } else {
                    newContent += ')';
                }
                break;
            default:
                newContent += key;
        }

        // --- Automatic Formatting ---
        const updatedLine = newContent.split('\n').pop();
        const updatedTimestamp = updatedLine.split(/[,+-]/).pop();

        if (/^\(\d{2}$/.test(updatedTimestamp)) {
            newContent += ':';
        } else if (/:(\d{2})$/.test(updatedTimestamp)) {
            newContent += '),(';
        }
        
        updateState(newContent);
    };

    const handleEnter = () => {
        const lines = content.split('\n');
        const currentDataLine = lines.pop(); // This is the line with the timestamp data
        const currentNumberLine = lines.pop(); // This is the line with the number, e.g., "1)"
        
        if (currentDataLine === '(') { // Deleting an empty new line
            if (lines.length > 0) {
                updateState(lines.join('\n'));
            }
            return;
        }
        
        const currentLineNum = parseInt(currentNumberLine || '0'); // Get the number from "1)"
        const cleanedContent = getCleanedContent();
        const nextLineNum = currentLineNum + 1;
        updateState(`${cleanedContent}\n${nextLineNum})\n(`);
    };
    
    const handleOK = () => {
        const currentLine = content.split('\n').pop();
        const lastTimestamp = currentLine.split(/[,+-]/).pop();
        let newContent = content;
        
        if (/^\((\d)$/.test(lastTimestamp)) { // Pad mm
            newContent = content.slice(0, -1) + '0' + content.slice(-1) + ':';
        } else if (/:(\d)$/.test(lastTimestamp)) { // Pad ss
            newContent = content.slice(0, -1) + '0' + content.slice(-1) + '),(';
        }
        updateState(newContent);
    };

    const getCleanedContent = () => {
        let cleaned = content;
        // Remove trailing connector e.g., "),(", "+(", "-("
        cleaned = cleaned.replace(/[,+-]\($/, ')');
        // Pad and close single digit ss e.g., "(01:2" -> "(01:02)"
        cleaned = cleaned.replace(/:(\d)$/, ':0$1)');
        return cleaned;
    };
    
    const downloadNotes = () => {
        const textToSave = getCleanedContent();
        const blob = new Blob([textToSave], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `timenotes_${date}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    keyboard.addEventListener('click', (e) => {
        const keyButton = e.target.closest('.key');
        if (keyButton) {
            handleInput(keyButton.dataset.key);
        }
    });

    header.addEventListener('click', (e) => {
        const headerButton = e.target.closest('.header-btn');
        if (headerButton) {
            handleInput(headerButton.dataset.key);
        }
    });
    
    displayContainer.addEventListener('click', () => {
        handleInput('backspace');
    });

    render();
});
